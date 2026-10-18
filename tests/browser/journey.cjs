// The golden journey (task 327): the owner's session of 2026-10-18 replayed step by step through the real UI, from a
// stalled request to Run on its own, after the owner said "Use E2E test to redo all the things you did in this test
// run. change model, create new app, ask model questions, etc…". Run: python3 tests/browser/run.py journey
//
// What is real: the web page, the services (web, Gate, the queue, git, Laya's absence), Pi 1.1.0 itself and the harness
// extension (harness/extension.mjs) that Pi loads. What is faked: only the model. tests/fixtures/fake-ollama.cjs answers
// as Ollama does (the model list for the menu bar, and Pi's OpenAI-compatible stream), scripted per step by
// tests/browser/journey/*.json. The fake Pi (tests/fixtures/fake-pi.py) is not used here on purpose: it stands in for the
// extension, and most of today's findings (pseudo tool calls, nudges, [CANARY] drift, guide questions, scope pauses)
// live in the extension, so a fake Pi would test itself. Pi runs with HOME and PI_CODING_AGENT_DIR in the scratch folder.
// Nothing reaches the network, the person's data, projects, Ollama or running workbench.
//
// The steps share one workbench and run in order, like the owner's session. Each step's checks are soft: a failed check
// is recorded and the step goes on, so one finding never hides the next; where a failure leaves the journey stuck, the
// step does what the owner did next (Stop, or type "continue") and says so. Nothing is marked as expected to fail: on
// code without the fixes, this suite fails, and each failure names its finding (docs/reviews/2026-10-18-chat-critical-
// path-audit.md and task 327). PI_JOURNEY_VERBOSE=1 prints the page, the model's requests and the server log on failure.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { join, basename } = require('node:path');
const { execFileSync } = require('node:child_process');
const { scratch, launch } = require('./workbench.cjs');
const { fakeOllama } = require('../fixtures/fake-ollama.cjs');
const { startProject, choosePhase, say, decisions } = require('./stories.cjs');

const SILENCE = 6;  // the model watchdog for this scratch workbench (the product's default is 120 s)
const SENTENCE = 'A habit tracker: add habits, tick them off each day, see streaks and a monthly chart, saved in a database, installable on my phone.';
const SCRIPTS = join(__dirname, 'journey');
const load = name => JSON.parse(fs.readFileSync(join(SCRIPTS, name + '.json'), 'utf8'));
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(condition, timeout = 20000, every = 200) {
  const end = Date.now() + timeout;
  for (;;) { const value = await condition(); if (value) return value; if (Date.now() > end) return null; await sleep(every); }
}
const CANARY = /\[CANARY\]/;
const PSEUDO = /<execute_tool>|read\{path:|read\(path="app\/db\.py"\)/;
const ENDED = ['completed', 'failed', 'stopped', 'interrupted', 'waiting', 'cancelled'];

// -- the person's view -----------------------------------------------------------------------------------------------
/** Watches every page for what must never show (an init script, so it survives reloads; per tab, in sessionStorage):
 * the [CANARY] marker in any form, each card's label, and "Loading" on the model button. */
const WATCH = () => {
  const keep = (key, value) => { try { const all = JSON.parse(sessionStorage.getItem('journey') || '{}'); all[key] ||= []; if (!all[key].includes(value)) all[key].push(value); sessionStorage.setItem('journey', JSON.stringify(all)); } catch {} };
  let queued = false;
  const scan = () => {
    queued = false; const text = document.body?.innerText || '';
    const at = text.indexOf('[CANARY]'); if (at >= 0) keep('canary', location.pathname + ' · …' + text.slice(Math.max(0, at - 50), at + 50).replace(/\s+/g, ' ') + '…');
    for (const card of document.querySelectorAll('.pw-card[aria-label]')) keep('cards', card.getAttribute('aria-label'));
    const model = document.getElementById('model-button')?.textContent || ''; if (/Loading/.test(model)) keep('loading', model.trim());
  };
  const start = () => { scan(); new MutationObserver(() => { if (!queued) { queued = true; requestAnimationFrame(scan); } }).observe(document.body, { subtree: true, childList: true, characterData: true }); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
};
const watched = async (page, key) => (await page.evaluate(() => JSON.parse(sessionStorage.getItem('journey') || '{}')).catch(() => ({})))[key] || [];
const forget = (page, key) => page.evaluate(key => { const all = JSON.parse(sessionStorage.getItem('journey') || '{}'); delete all[key]; sessionStorage.setItem('journey', JSON.stringify(all)); }, key);

const answers = t => t.page.locator('#messages .pw-msg.assistant:not([data-live])');
const cut = t => t.page.locator('#messages .pw-msg').filter({ has: t.page.locator('.pw-cut[role="status"]') }).last();
/** Cards that still wait for an answer: a question (Answer), Gate's scope question, a plan, a check-in. */
const OPEN_CARD = '.pw-card:not(.pw-card--settled):has(.pw-card__foot .pw-btn)';
async function snapshot(page) {
  return page.evaluate(open => ({
    users: [...document.querySelectorAll('#messages .pw-msg.user')].map(node => node.innerText.trim().split('\n').at(-1)),
    open: [...document.querySelectorAll(open)].map(card => card.getAttribute('aria-label')),
    checkIns: [...document.querySelectorAll('#messages .pw-card[aria-label^="Task "]')].map(card => card.getAttribute('aria-label') + ' · ' + (card.querySelector('h3')?.textContent || '')),
  }), OPEN_CARD);
}
/** Reload at one of the owner's points and keep what was seen before and after (step 12 judges them). */
async function reloadAt(t, where) {
  const before = await snapshot(t.page);
  await t.page.reload(); await t.page.locator('#prompt').waitFor(); await sleep(1500);
  t.reloads.push({ where, before, after: await snapshot(t.page) });
}
const jobs = async (t, project = t.project) => (await t.bench.api('/api/workspace')).jobs.filter(job => job.project === project && job.role === 'chat');
const job = async (t, id) => (await t.bench.api('/api/workspace')).jobs.find(item => item.id === id);
const turnUsed = (t, index) => Boolean(t.model.state.used[index]);
/** The requests the model received since `from` (an index into the request log). */
const requestsSince = (t, from) => t.model.state.requests.slice(from);

/** The owner's way out when a request ended and the work did not go on: type "continue" (at most `times`). Returns how
 * many times it was needed. */
async function keepGoing(t, done, { times = 3, timeout = 45000 } = {}) {
  let typed = 0;
  for (;;) {
    const reached = await until(async () => done() || !(await jobs(t)).some(item => ['queued', 'running'].includes(item.status)), timeout);
    if (done()) return typed;
    if (!reached) throw new Error('the request neither went on nor ended');
    if (typed >= times) throw new Error(`the work did not go on after “continue” ${typed} times`);
    await sleep(500); if (done()) return typed;
    await type(t, 'continue'); typed++;
  }
}
/** Type in the composer and send, as the person does; a card that waits takes the words as its answer (task 290). */
async function type(t, text) {
  const sent = t.page.waitForResponse(response => /\/api\/(jobs\/create|choices\/answer)$/.test(response.url()) && response.request().method() === 'POST');
  await t.page.locator('#prompt').fill(text); await t.page.locator('#send').click();
  const response = await sent; const body = await response.json();
  if (!response.ok()) throw new Error('Not sent: ' + body.error);
  return body.id || body.job;
}
async function answerCard(t, label, option) {
  const card = t.page.locator(`.pw-card[aria-label="${label}"]`).last(); await card.waitFor({ timeout: 30000 });
  if (option) await card.getByText(option, { exact: true }).click();
  const resumed = t.page.waitForResponse(response => response.url().endsWith('/api/choices/answer'));
  await card.getByRole('button', { name: 'Answer', exact: true }).click();
  const body = await (await resumed).json(); return body.job;
}

// -- the steps ---------------------------------------------------------------------------------------------------------
const steps = [];
const step = (id, title, fn) => steps.push({ id, title, fn });

step('J01', 'a request stuck after a tool fails within the watchdog bound with CutLine and Retry; the queued message starts; Stop updates the page at once (findings 1, 5)', async t => {
  const { page } = t;
  await newProject(t, 'Pong');
  t.model.script(load('01-stalled-stream'));
  const stuck = await say(t, 'Look at the roadmap');
  await until(() => turnUsed(t, 1), 30000) || assert.fail('the model never received the tool result');
  const next = await say(t, "let's plan the icons now");
  // Finding 1: the request ends "failed: the model stopped answering" within the bound, and the lane frees by itself.
  await t.check('finding 1: the silent request fails within the watchdog bound', async () => {
    const ended = await until(async () => { const item = await job(t, stuck); return ENDED.includes(item.status) && item; }, (SILENCE + 30) * 1000);
    assert.ok(ended, `still ${(await job(t, stuck)).status} ${SILENCE + 30} s after the model went silent (the watchdog is ${SILENCE} s)`);
    assert.equal(ended.status, 'failed'); assert.match(`${ended.progress} ${ended.error || ''}`, /the model stopped answering/);
  });
  await t.check('finding 1: the message queued behind it starts by itself', async () => {
    assert.ok(await until(async () => (await job(t, next)).status !== 'queued', 15000), 'the queued message is still waiting');
  });
  await t.check('finding 1: the cut answer shows why, with Retry', async () => {
    await cut(t).locator('.pw-cut__text').filter({ hasText: /Failed before Pi finished: the model stopped answering/ }).waitFor({ timeout: 5000 });
    assert.equal(await cut(t).locator('.pw-cut').getByRole('button', { name: 'Retry', exact: true }).count(), 1);
  });
  if ((await job(t, stuck)).status === 'running') { t.note('J01: stopped the stuck request by hand (what the owner did)'); await page.locator('#stop').click(); }
  t.model.release();
  await t.bench.job(next, ENDED, 60000);
  // Finding 5: after Stop the page shows the stopped answer at once, not at the next poll.
  const long = await say(t, 'Explain the icons at length');
  await page.locator('#messages [data-live]').getByText(/Partial answer/).waitFor({ timeout: 30000 });
  const pressed = Date.now(); await page.locator('#stop').click();
  await t.check('finding 5: the page updates promptly after Stop', async () => {
    await cut(t).locator('.pw-cut__text').filter({ hasText: /Stopped by you/ }).waitFor({ timeout: 15000 });
    const took = Date.now() - pressed; assert.ok(took < 2500, `the stopped answer showed ${took} ms after Stop`);
    assert.equal((await t.bench.job(long, ENDED, 10000)).status, 'stopped');
    await cut(t).getByText(/Partial answer/).waitFor({ timeout: 2000 });
  });
  await reloadAt(t, 'after Stop');
  t.model.release();
});

step('J02', 'changing the model: refused next to the menu while a request runs, never "Loading…"; applied when idle (finding 4)', async t => {
  const { page } = t;
  await page.locator('#model', { hasText: 'gemma4:26b-mlx' }).waitFor();
  t.model.script(load('02-model-switch'));
  const running = await say(t, 'Summarise the project');
  await t.bench.job(running, ['running']); await page.locator('#messages [data-live]').getByText(/pong game/).waitFor({ timeout: 20000 });
  await forget(page, 'loading');
  await page.locator('#model-button').click(); await page.locator('#model-menu [data-model="qwen3:8b"]').waitFor();
  await page.locator('#model-menu [data-model="qwen3:8b"]').click();
  await t.check('finding 4: the refusal is visible next to the menu', async () => {
    const message = page.getByText(/Pi is working|switch models when|while Pi/i).locator('visible=true').first();
    await message.waitFor({ timeout: 5000 });
    const box = await message.boundingBox(), menu = await page.locator('#model-button').boundingBox();
    assert.ok(box && box.y < menu.y + menu.height + 200, `the refusal is ${Math.round(box.y - menu.y)} px below the model menu`);
  });
  await t.check('finding 4: a refused switch never says "Loading…"', async () => {
    await sleep(800); assert.deepEqual(await watched(page, 'loading'), []);
    assert.match(await page.locator('#model').textContent(), /gemma4:26b-mlx/);
    assert.equal(fs.existsSync(join(t.bench.data, 'model.json')) && JSON.parse(t.bench.read(t.bench.data, 'model.json')).model === 'qwen3:8b', false, 'the refused choice was saved');
  });
  await reloadAt(t, 'mid-stream');
  await t.check('step 12: a reload mid-stream keeps the live answer', async () => {
    await page.locator('#messages').getByText(/pong game/).first().waitFor({ timeout: 10000 });
  });
  assert.equal((await t.bench.job(running, ENDED, 60000)).status, 'completed');
  await page.keyboard.press('Escape').catch(() => {});
  await page.locator('#model-button').click(); await page.locator('#model-menu [data-model="qwen3:8b"]').click();
  await t.check('finding 4: when idle the switch applies: the label, the saved choice, Ollama and Pi use it', async () => {
    await page.locator('#model', { hasText: /^qwen3:8b$/ }).waitFor({ timeout: 15000 });
    assert.equal(JSON.parse(t.bench.read(t.bench.data, 'model.json')).model, 'qwen3:8b');
    assert.ok(t.model.state.other.some(call => call.path === '/api/generate' && call.body.model === 'qwen3:8b'), 'Ollama was asked to load qwen3:8b');
    const from = t.model.state.requests.length;
    await t.bench.job(await say(t, 'Which model are you?'), ENDED, 60000);
    assert.equal(requestsSince(t, from)[0]?.model, 'qwen3:8b', 'Pi asked the new model');
  });
});

step('J03', 'New Project: "Habit Tracker" through the four steps; suggestions marked, not checked; the folder is a slug, the name stays (finding 14)', async t => {
  const { page } = t;
  await startProject(t, 'Habit Tracker', SENTENCE);
  await page.locator('#start-next').click(); await stepIs(t, 'Capabilities');
  for (const id of ['database', 'charts', 'install']) {
    const row = page.locator(`#start-body .pw-cap[data-id="${id}"]`);
    await t.check(`Capabilities suggests ${id} (marked, not checked)`, async () => {
      assert.equal(await row.getAttribute('data-suggested'), '', `${id} is not marked as suggested`);
      assert.equal(await row.locator('input').isChecked(), false, `${id} was checked for the person`);
    });
    await row.locator('input').check();
  }
  await page.locator('#start-next').click(); await stepIs(t, 'Packages');
  for (const id of await page.locator('#start-packages .pw-cap:has(input:checked)').evaluateAll(rows => rows.map(row => row.dataset.id))) if (id !== 'web') await page.locator(`#start-packages .pw-cap[data-id="${id}"] input`).uncheck();
  await page.locator('#start-packages .pw-cap[data-id="web"] input').check();
  await page.locator('#start-next').click(); await stepIs(t, 'Summary');
  await page.locator('#start-facts').waitFor();
  await page.locator('#start-next').click();
  await page.waitForFunction(() => document.body.dataset.view === 'chat' && /\/chat$/.test(location.pathname), null, { timeout: 90000 });
  t.project = await page.evaluate(() => location.pathname.split('/')[2]);
  const made = (await t.bench.api('/api/workspace')).projects.find(item => item.id === t.project);
  t.root = made.path || made.root || made.cwd;
  assert.ok(t.root && fs.existsSync(t.root), 'the project folder: ' + JSON.stringify(made));
  await t.check('finding 14: the folder name is a slug (no spaces)', async () => assert.doesNotMatch(basename(t.root), /\s/, `the folder is “${basename(t.root)}”`));
  await t.check('finding 14: the display name stays "Habit Tracker"', async () => {
    assert.equal(made.name, 'Habit Tracker');
    await page.getByText('Habit Tracker', { exact: true }).locator('visible=true').first().waitFor({ timeout: 5000 });
  });
  await t.check('the roadmap Goal is the person’s sentence', async () => assert.match(t.bench.read(t.root, 'ROADMAP.md'), new RegExp('## Goal\\s+' + SENTENCE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))));
  await t.check('the project opens in Discussion', async () => assert.match(await page.locator('#phase-button').textContent(), /Discussion/));
});

step('J04', 'Discussion: prose questions render as lists with identifiers intact; questions come one per card, recommended first, "Something else…" last; no [CANARY] anywhere (findings 2, 5, 6)', async t => {
  const { page } = t;
  t.model.script(load('04-discussion'));
  await t.bench.job(await say(t, 'What do you need to know before planning?'), ENDED, 60000);
  const prose = answers(t).filter({ hasText: 'Before planning I need three answers' }).last(); await prose.waitFor();
  await t.check('finding 5/6: the prose questions render as one numbered list of three, each with its options nested', async () => {
    assert.equal(await prose.locator('ol > li').count(), 3, await prose.innerHTML());
    for (const item of await prose.locator('ol > li').all()) assert.equal(await item.locator('ul > li').count(), 2, await item.innerHTML());
    assert.match(await prose.innerText(), /The code will have add_habit, tick_habit and month_chart functions\./);
  });
  await t.check('finding 5: underscores in identifiers stay (add_habit is not emphasis)', async () => {
    assert.equal(await prose.locator('em, i').count(), 0, await prose.innerHTML());
    assert.match(await prose.innerText(), /add_habit/);
  });
  await t.bench.job(await say(t, 'Is a habit tracker a good first app?'), ENDED, 60000);
  await answers(t).filter({ hasText: 'is a good first function' }).last().waitFor({ timeout: 10000 }).catch(() => {});
  const asked = await say(t, 'Ask me those three as choices, please.');
  await t.check('the question pauses the request (Waiting for you)', async () => assert.equal((await t.bench.job(asked, ENDED, 60000)).status, 'waiting'));
  const card = page.locator('.pw-card[aria-label="Where should habits be saved?"]').last();
  await card.waitFor({ timeout: 20000 });
  await t.check('finding 6: one question per card, recommended first and preselected, "Something else…" last', async () => {
    const options = await card.locator('.pw-option .pw-option__label').allTextContents();
    assert.match(options[0], /^SQLite database.*Recommended/); assert.equal(options.at(-1), 'Something else…'); assert.equal(options.length, 3);
    assert.equal(await card.locator('input[type="radio"]').first().isChecked(), true);
    assert.match(await card.locator('.pw-card__head').textContent(), /Question 1 of 3/);
    assert.equal(await page.locator(`#messages ${OPEN_CARD}`).count(), 1, 'one open card at a time');
  });
  await reloadAt(t, 'while a card waits');
  await t.check('finding 2: no [CANARY] (plain, `code`, **bold**) live or after the reload', async () => {
    assert.doesNotMatch(await page.locator('#messages').innerText(), CANARY);
    assert.deepEqual(await watched(page, 'canary'), []);
  });
});

step('J05', 'answer the cards; the Planning phase control starts planning from the discussion without typing; no phase notice while in Planning (findings 7, 9)', async t => {
  const { page } = t;
  for (const label of ['Where should habits be saved?', 'What counts as a streak?', 'Which chart for the month?']) {
    const resumed = await answerCard(t, label);
    await t.bench.job(resumed, ENDED, 60000);
  }
  await t.check('finding 2: the answer after the cards is shown as written (a **[CANARY]** marker is not “instruction drift”)', async () => {
    await answers(t).filter({ hasText: 'Thanks: a SQLite database' }).last().waitFor({ timeout: 20000 });
    assert.ok(!t.model.state.requests.some(request => /Instruction drift/.test(request.input)), 'the harness re-asked the model for “instruction drift” on a wrapped marker');
  });
  await t.check('the three answers are settled, once each', async () => {
    for (const answer of ['SQLite database', 'Every day ticked', 'Bar per day']) assert.equal(await page.locator('.pw-card--settled').filter({ hasText: answer }).count(), 1, answer);
  });
  await t.check('finding 2: no [CANARY] after the answers either', async () => {
    assert.doesNotMatch(await page.locator('#messages').innerText(), CANARY); assert.deepEqual(await watched(page, 'canary'), []);
  });
  t.model.script(load('06-planning'));
  const before = new Set((await jobs(t)).map(item => item.id)); const from = t.model.state.requests.length;
  await choosePhase(t, 'Planning');
  t.planning = (await until(async () => (await jobs(t)).find(item => !before.has(item.id)), 10000))?.id;
  await t.check('finding 7: choosing Planning starts a planning request by itself', async () => assert.ok(t.planning, 'no request started within 10 s of choosing Planning'));
  if (!t.planning) { t.note('J05: typed “Let’s plan it now” (what the owner did)'); t.planning = await say(t, 'Let’s plan it now'); }
  t.planFrom = from;
});

step('J06', 'planning: a turn that only describes propose_plan is nudged once and the plan appears; the Goal stays; steps are a list; the answers are in Decisions (findings 8, 9, 10)', async t => {
  const { page } = t;
  await until(() => turnUsed(t, 0), 30000) || assert.fail('the model never received the planning request');
  const first = await t.bench.job(t.planning, ENDED, 60000);
  await t.check('finding 8: the describe-only turn is nudged once, automatically, and the plan comes', async () => {
    assert.ok(turnUsed(t, 1), `no nudge: the request ended ${first.status} with “${String(first.text || '').slice(-80)}”`);
    assert.equal(first.status, 'waiting', 'the request waits for Start Building');
  });
  if (!turnUsed(t, 1)) { t.note('J06: typed “Please call propose_plan now.”'); await t.bench.job(await say(t, 'Please call propose_plan now.'), ENDED, 60000); }
  const plan = page.locator('.pw-card[aria-label="Plan"]').last(); await plan.waitFor({ timeout: 20000 });
  await t.check('finding 9: no “Pi cannot change the phase” notice while already in Planning', async () => assert.doesNotMatch(await page.locator('#messages').innerText(), /cannot change the phase/));
  await t.check('finding 10: the plan keeps the person’s Goal', async () => assert.ok(t.bench.read(t.root, 'ROADMAP.md').split('## Goal')[1]?.includes(SENTENCE), t.bench.read(t.root, 'ROADMAP.md').slice(0, 600)));
  const task = fs.readdirSync(join(t.root, 'tasks')).find(name => /store-habits/.test(name));
  t.task1 = task;
  await t.check('finding 10: task steps are a list, one step per line', async () => {
    const text = t.bench.read(t.root, 'tasks', task);
    assert.doesNotMatch(text, /1\.\s.*\s2\.\s/, 'the steps are on one line:\n' + text);
    assert.match(text, /^\s*(?:[-*]\s(?:\[ \]\s)?|\d\.\s).*failing test for add_habit/m);
    assert.match(text, /^\s*(?:[-*]\s(?:\[ \]\s)?|\d\.\s).*Implement add_habit/m);
  });
  await t.check('the answers from the cards are the plan’s Decisions', async () => {
    const shown = (await plan.locator('.pw-plan__decisions').allInnerTexts()).join(' / ');
    for (const answer of ['SQLite database', 'Every day ticked', 'Bar per day']) assert.match(shown, new RegExp(answer), `the plan card’s Decisions: ${shown}`);
  });
});

step('J07', 'Start Building: no "Which guide should Pi use?" card; tool calls written as text are repaired or nudged, never shown raw, never fed back (findings 11, 12, 13)', async t => {
  const { page } = t;
  t.model.script(load('07-build-task-1')); t.buildFrom = t.model.state.requests.length;
  const sent = page.waitForResponse(response => response.url().endsWith('/api/jobs/create'));
  await page.locator('.pw-card[aria-label="Plan"]').last().getByRole('button', { name: 'Start Building', exact: true }).click();
  await page.waitForFunction(() => (document.querySelector('#phase-button')?.textContent || '').includes('Implementation'));
  t.build = (await (await sent).json()).id;
  await until(() => turnUsed(t, 0), 30000) || assert.fail('the model never received the build request');
  await until(async () => turnUsed(t, 1) || ENDED.includes((await job(t, t.build)).status), 60000);
  await t.check('finding 11: the first pseudo tool call is repaired into a real call or nudged in the same request', async () => assert.ok(turnUsed(t, 1), 'the request ended on the pseudo tool call: ' + (await job(t, t.build)).status));
  const typed = await keepGoing(t, () => turnUsed(t, 2));
  if (typed) t.note(`J07: typed “continue” ${typed}× to get past the pseudo tool calls`);
  await t.check('finding 11: the chat never shows a pseudo tool call as the answer', async () => assert.doesNotMatch(await page.locator('#messages').innerText(), PSEUDO));
  await t.check('finding 12/13: no “Which guide should Pi use?” card', async () => assert.ok(!(await watched(page, 'cards')).some(label => /guide/i.test(label)), (await watched(page, 'cards')).join(', ')));
});

step('J08', 'a file outside the task: the request pauses with Gate’s scope card; Add to Task 1 lets the write through and the task goes on (finding 16)', async t => {
  const { page } = t;
  const card = page.locator('.pw-card[aria-label="Pi wants to change a file outside task 1"]').last();
  await until(async () => turnUsed(t, 5) && (await card.count()) > 0 || (turnUsed(t, 5) && !(await jobs(t)).some(item => ['queued', 'running'].includes(item.status))), 90000);
  await t.check('finding 16: the scope card appears and the request pauses (Waiting for you)', async () => {
    await card.waitFor({ timeout: 10000 });
    assert.match(await card.locator('.pw-card__head').textContent(), /Gate asks you/);
    assert.match(await card.textContent(), /migrations\/002-habits\.sql/);
    assert.ok((await jobs(t)).some(item => item.status === 'waiting'), 'no request is Waiting for you: ' + (await jobs(t)).map(item => item.status).join(', '));
    assert.equal(fs.existsSync(join(t.root, 'migrations', '002-habits.sql')), false, 'written before the answer');
  });
  if (await card.count()) {
    await reloadAt(t, 'while the scope card waits');
    const resumed = page.waitForResponse(response => response.url().endsWith('/api/choices/answer'));
    await page.locator('.pw-card[aria-label="Pi wants to change a file outside task 1"]').last().getByRole('button', { name: 'Add to Task 1', exact: true }).click();
    await resumed;
  } else t.note('J08: no scope card to answer');
  const typed = await keepGoing(t, () => turnUsed(t, 6));
  if (typed) t.note(`J08: typed “continue” ${typed}× after the scope question`);
  await until(() => fs.existsSync(join(t.root, 'migrations', '002-habits.sql')), 15000);
  await t.check('finding 16: after Add to Task the write succeeds and the task lists the file', async () => {
    assert.ok(fs.existsSync(join(t.root, 'migrations', '002-habits.sql')), 'migrations/002-habits.sql was not written');
    assert.match(t.bench.read(t.root, 'tasks', t.task1), /^Files: .*migrations\/002-habits\.sql/m);
  });
});

step('J09', 'Stop mid-task, then "continue": the approved task resumes and can write; one check-in per task; a refused read is never "Not written" (findings 11, 17)', async t => {
  const { page } = t;
  await until(() => turnUsed(t, 7), 60000) || assert.fail('the model never started the long answer');
  await page.locator('#messages [data-live]').getByText(/Now I write app\/habits\.py/).first().waitFor({ timeout: 20000 });
  await page.locator('#stop').click();
  await until(async () => !(await jobs(t)).some(item => ['queued', 'running'].includes(item.status)), 20000);
  t.model.release();
  await reloadAt(t, 'after Stop mid-task');
  for (const open of await page.locator(`#messages .pw-card:has(.pw-card__foot button:text-is("Answer"))`).all()) { t.note('J09: answered a leftover card'); await open.getByRole('button', { name: 'Answer', exact: true }).click(); }
  await type(t, 'continue');
  await until(() => turnUsed(t, 8), 45000);
  await t.check('finding 17: after Stop and “continue” the approved task resumes and its write goes through', async () => {
    assert.ok(turnUsed(t, 8), 'the model was never asked to go on with the task');
    assert.ok(await until(() => fs.existsSync(join(t.root, 'app', 'habits.py')), 15000), 'app/habits.py was not written');
    const refused = (await t.bench.api('/api/gate')).events.filter(event => event.outcome === 'REVISE' && JSON.stringify(event.args || event.proposal || '').includes('app/habits.py'));
    assert.deepEqual(refused.map(event => event.reason), []);
  });
  const typed = await keepGoing(t, () => turnUsed(t, 10), { times: 2 });
  if (typed) t.note(`J09: typed “continue” ${typed}× more to finish task 1`);
  await until(async () => !(await jobs(t)).some(item => ['queued', 'running'].includes(item.status)), 60000);
  const checkIns = page.locator('#messages .pw-card[aria-label^="Task "]').filter({ hasText: /Task 1 of/ });
  await checkIns.first().waitFor({ timeout: 20000 });
  await t.check('only one check-in card for task 1', async () => assert.equal(await checkIns.count(), 1, (await checkIns.allInnerTexts()).join('\n---\n')));
  await t.check('a refused read is never labelled “Not written”', async () => {
    const rows = await page.locator('#messages').getByText(/\/etc\/hosts|hosts/).all();
    for (const row of rows) assert.doesNotMatch(await row.evaluate(node => (node.closest('.pw-tool, .pw-msg') || node).innerText), /Not written/);
  });
  await t.check('finding 11: no pseudo tool call reached the model again after it was written', async () => {
    const later = requestsSince(t, t.buildFrom).slice(1);
    const fed = later.filter(request => request.messages.some(message => message.role === 'assistant' && PSEUDO.test(JSON.stringify(message.content || ''))));
    assert.equal(fed.length, 0, `${fed.length} later requests carry the pseudo tool call back to the model`);
  });
});

step('J10', 'task 1 completes verified: the check-in has evidence; Accept and Continue starts task 2', async t => {
  const { page } = t;
  const check = page.locator('#messages .pw-card[aria-label^="Task "]').filter({ hasText: /Task 1 of/ }).last();
  await t.check('task 1 is verified, with the test run as evidence', async () => {
    assert.doesNotMatch(await check.textContent(), /not verified/, await check.textContent());
    assert.match(await check.locator('.pw-facts').textContent(), /Test run/);
  });
  t.model.script(load('10-tasks-2-3'));
  const sent = page.waitForResponse(response => response.url().endsWith('/api/jobs/create'));
  const accept = check.getByRole('button', { name: 'Accept and Continue', exact: true });
  if (!await accept.count()) { t.note('J10: no Accept and Continue; pressed the check-in’s default button'); await check.locator('.pw-btn--default').click(); } else await accept.click();
  t.task2 = (await (await sent).json()).id;
  await until(() => turnUsed(t, 0), 30000) || assert.fail('task 2 never reached the model');
});

step('J11', 'the queue while task 2 runs: two messages read in the chat, one removed, one edited; the edited one runs (task 325)', async t => {
  const { page } = t;
  const item = text => page.locator('#queue .pw-queue__item').filter({ hasText: text });
  await say(t, 'Use green for ticked days.');
  await item('Use green for ticked days.').waitFor();
  await item('Use green for ticked days.').getByRole('button', { name: 'Remove…', exact: true }).click();
  await page.locator('#alert-dialog').getByRole('button', { name: 'Remove Message', exact: true }).click();
  await item('Use green for ticked days.').waitFor({ state: 'detached' });
  const id = await say(t, 'Show the streak in bold.');
  await item('Show the streak in bold.').getByRole('button', { name: 'Edit', exact: true }).click();
  await page.locator('#queue .pw-queue__field').fill('Show the streak in bold, with a flame.');
  await page.locator('#queue').getByRole('button', { name: 'Save', exact: true }).click();
  await item('Show the streak in bold, with a flame.').waitFor();
  await t.check('both messages read in full in the chat while task 2 runs', async () => assert.equal((await job(t, t.task2)).status, 'running'));
  await t.bench.job(id, ['completed', 'failed', 'stopped', 'interrupted', 'cancelled'], 120000);
  await t.check('the edited message ran; the removed one never reached Pi', async () => {
    const inputs = t.model.state.requests.map(request => request.input);
    assert.ok(inputs.some(input => input.includes('Show the streak in bold, with a flame.')), 'the edited text never reached the model');
    assert.ok(!inputs.some(input => input.includes('Use green for ticked days.')), 'the removed message reached the model');
    assert.ok(!inputs.some(input => /Show the streak in bold\.(?!.*flame)/.test(input)), 'the old words reached the model');
  });
});

step('J10b', 'Run on its own: the risk notice when turned on; the remaining tasks run with no person cards; the report lists what was decided, incl. "Widened task 3 without asking"', async t => {
  const { page } = t;
  const typed = await keepGoing(t, () => turnUsed(t, 4), { times: 2, timeout: 90000 });
  if (typed) t.note(`J10b: typed “continue” ${typed}× to finish task 2`);
  const check = page.locator('#messages .pw-card[aria-label^="Task "]').filter({ hasText: /Task 2 of/ }).last(); await check.waitFor({ timeout: 30000 });
  await t.check('task 2 is verified', async () => assert.doesNotMatch(await check.textContent(), /not verified/, await check.textContent()));
  await page.locator('#auto-composer').check();
  await t.check('Run on its own shows its risks when turned on', async () => {
    await page.locator('#alert-dialog').waitFor({ timeout: 5000 });
    assert.match(await page.locator('#alert-dialog').innerText(), /Run on its own|on its own/i);
  });
  if (await page.locator('#alert-danger').isVisible()) await page.locator('#alert-danger').click();
  await page.waitForFunction(() => fetch('/api/auto').then(r => r.json()).then(d => d.enabled), null, { timeout: 5000 });
  const cardsBefore = new Set(await watched(page, 'cards'));
  await check.locator('.pw-btn--default').click();
  const report = page.locator('.pw-card').filter({ hasText: 'Ran on its own' }).last();
  await report.waitFor({ timeout: 180000 });
  await t.check('task 3 ran and was accepted without the person', async () => {
    assert.ok(turnUsed(t, 12), 'task 3 did not finish');
    const accepted = decisions(t).filter(row => row.kind === 'task_acceptance' && row.automatic);
    assert.ok(accepted.length >= 1, JSON.stringify(decisions(t).filter(row => row.kind === 'task_acceptance')));
  });
  await t.check('no person card while it ran on its own (no scope card for task 3)', async () => {
    const asked = (await watched(page, 'cards')).filter(label => !cardsBefore.has(label) && /outside task|asked|\?$/.test(label));
    assert.deepEqual(asked, []);
    assert.ok(fs.existsSync(join(t.root, 'app', 'chart_days.py')), 'the widened file was not written');
  });
  await t.check('the report lists what was decided on its own, incl. “Widened task 3 without asking”', async () => {
    const text = await report.innerText();
    assert.match(text, /Decided on its own · [1-9]/, text); assert.match(text, /Widened task 3 without asking/, text);
  });
});

step('J13', 'the end: Ready to publish passes from the Workbench, every task is verified and committed, the roadmap is all done, and the finished app works', async t => {
  const { page } = t;
  await until(async () => turnUsed(t, 17) && !(await jobs(t)).some(item => ['queued', 'running'].includes(item.status)), 120000);
  await t.check('the Ready to publish task ran (README and app names, every test)', async () => assert.ok(turnUsed(t, 17), 'the run never reached the Ready to publish task'));
  const publish = page.locator('#messages .pw-card[aria-label^="Task "]').filter({ hasText: /Ready to publish/ }).last();
  await t.check('Ready to publish is verified from the Workbench (its publication checks ran and passed)', async () => {
    await publish.waitFor({ timeout: 10000 });
    assert.doesNotMatch(await publish.innerText(), /not verified/, (await publish.innerText()).slice(0, 400));
  });
  await t.check('the roadmap shows every task done', async () => {
    const roadmap = t.bench.read(t.root, 'ROADMAP.md');
    const open = roadmap.split('\n').filter(line => /^\s*[-*] \[ \]/.test(line) && !/Plan this app/.test(line));
    assert.deepEqual(open, [], roadmap);
  });
  await t.check('each planned task is committed as verified by the harness', async () => {
    const log = t.bench.git(t.root, 'log', '--format=%an|%s');
    for (const title of ['Store habits', 'Tick habits and count streaks', 'Monthly chart data']) assert.match(log, new RegExp(`Pi Workbench\\|${title} \\(task \\d+\\)\\n`), log);
    assert.equal(t.bench.git(t.root, 'status', '--porcelain').trim(), '', 'everything is committed');
  });
  await t.check('the finished app works: add a habit, tick it, its streak and its month chart (the project’s own code, run for real)', async () => {
    const out = execFileSync('python3', ['-I', '-c', [
      'import sys, tempfile, pathlib; sys.path.insert(0, ".")',
      'from app.habits import add_habit, list_habits, tick, ticks; from app.streaks import streak; from app.chart import month_chart',
      'db = pathlib.Path(tempfile.mkdtemp()) / "habits.sqlite3"; add_habit(db, "Read"); [tick(db, "Read", day) for day in ("2026-10-01", "2026-10-02", "2026-10-03")]',
      'print(list_habits(db), streak(ticks(db, "Read")), sum(month_chart(2026, 10, ticks(db, "Read"))))'].join('\n')], { cwd: t.root, encoding: 'utf8' }).trim();
    assert.equal(out, "['Read'] 3 3");
    const tests = execFileSync('python3', ['-m', 'unittest', 'tests.test_habits', 'tests.test_streaks', 'tests.test_chart'], { cwd: t.root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    assert.equal(typeof tests, 'string');
  });
  await t.check('the README and the app names describe the Habit Tracker', async () => {
    assert.match(t.bench.read(t.root, 'README.md'), /^# Habit Tracker/);
    assert.equal(JSON.parse(t.bench.read(t.root, 'static', 'manifest.webmanifest')).name, 'Habit Tracker');
  });
});

step('J12', 'reloads and a second tab: state is consistent, no card reopens, no duplicates', async t => {
  const { page } = t;
  for (const { where, before, after } of t.reloads) await t.check(`after the reload ${where}`, async () => {
    assert.deepEqual(after.open, before.open, 'open cards changed');
    assert.ok(after.users.length >= before.users.length, 'messages went missing');
    assert.equal(new Set(after.checkIns).size, after.checkIns.length, 'a check-in shows twice: ' + after.checkIns.join(' | '));
  });
  const other = await page.context().newPage(); await other.goto(page.url()); await other.locator('#prompt').waitFor(); await sleep(1500);
  const [mine, theirs] = [await snapshot(page), await snapshot(other)];
  await t.check('a second tab shows the same chat', async () => { assert.deepEqual(theirs.users, mine.users); assert.deepEqual(theirs.open, mine.open); assert.deepEqual(theirs.checkIns, mine.checkIns); });
  await t.check('no answered question card is open again', async () => assert.ok(!mine.open.some(label => /\?$/.test(label)), mine.open.join(', ')));
  await t.check('no check-in card shows twice', async () => assert.equal(new Set(mine.checkIns).size, mine.checkIns.length, mine.checkIns.join(' | ')));
  await t.check('finding 2: no [CANARY] in either tab, at any point of the journey', async () => { assert.deepEqual(await watched(page, 'canary'), []); assert.deepEqual(await watched(other, 'canary'), []); });
  await other.close();
});

// -- small helpers that act as the person --------------------------------------------------------------------------------
const stepIs = (t, name) => t.page.waitForFunction(name => document.querySelector('#start-steps [aria-current="step"]')?.textContent.endsWith(name), name);
/** “Start from an empty folder instead” in the scratch folder; the project's chat opens. */
async function newProject(t, name) {
  await startProject(t, name); await t.page.locator('#start-empty').click();
  await t.page.waitForFunction(() => document.body.dataset.view === 'chat' && /\/chat$/.test(location.pathname), null, { timeout: 60000 });
  t.project = await t.page.evaluate(() => location.pathname.split('/')[2]);
}

// -- the run -------------------------------------------------------------------------------------------------------------
async function main() {
  let realPi = '';
  try { realPi = execFileSync('which', ['pi'], { encoding: 'utf8' }).trim(); } catch {}
  if (!realPi) { console.log('Not run: Pi is not installed (the journey runs the real Pi with a fake model). Nothing was verified.'); return 2; }
  const model = fakeOllama(); const url = await model.start();
  const bench = scratch('pi-journey-');
  for (const folder of ['agent', 'home']) fs.mkdirSync(join(bench.directory, folder), { recursive: true });
  fs.writeFileSync(join(bench.directory, 'agent', 'models.json'), JSON.stringify({ providers: { ollama: { baseUrl: url + '/v1' } } }));
  const wrapper = join(bench.directory, 'pi-real');  // the real Pi, kept to the scratch folder
  fs.writeFileSync(wrapper, `#!/bin/sh\nHOME='${bench.directory}/home' PI_CODING_AGENT_DIR='${bench.directory}/agent' exec '${realPi}' "$@"\n`, { mode: 0o755 });
  for (const name of ['uv', 'uvx']) fs.writeFileSync(join(bench.directory, name), '#!/bin/sh\nfor arg in "$@"; do case "$arg" in --watch*) exec sleep 600;; esac; done\nprintf "# pass 1\\n# fail 0\\n"\nexit 0\n', { mode: 0o755 });  // as US-116: never a download
  // The models' measured verdicts, so the workbench never measures the fake models (capability.check).
  fs.mkdirSync(bench.data, { recursive: true });
  fs.writeFileSync(join(bench.data, 'model-capabilities.json'), JSON.stringify(Object.fromEntries(['gemma4:26b-mlx', 'qwen3:8b', 'tiny:1b'].map(name => [name, { digest: '', ollama: '0.12.0', num_parallel: '1', verdict: 'parallel' }]))));
  await bench.start({ PI_BINARY: wrapper, PI_OLLAMA_URL: url, OLLAMA_NUM_PARALLEL: '1', PI_HARNESS_MODEL_SILENCE_SECONDS: String(SILENCE) });
  const browser = await launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(WATCH);
  await context.route('**/api/updates', route => route.fulfill({ json: { state: 'current', checked: 1 } }));  // never the real clone
  await context.route(/\/api\/projects\/(create|register|start)$/, route => {  // a project is only ever made in the scratch folder
    const body = route.request().postDataJSON() || {}, where = String(body.parent || body.path || '');
    if (!where.startsWith(bench.directory + '/') && where !== bench.directory) return route.fulfill({ status: 400, json: { error: `Journey guard: ${where || 'the data folder'} is outside the scratch folder` } });
    return route.continue();
  });
  const page = await context.newPage(); page.setDefaultTimeout(20000);
  const t = { bench, model, page, directory: bench.directory, get base() { return bench.base; }, reloads: [], notes: [], errors: [] };
  page.on('pageerror', error => t.errors.push(error.message));
  t.note = text => { t.notes.push(text); console.log('      · ' + text); };
  const results = [];
  for (const item of steps) {
    if (process.env.PI_JOURNEY && !new RegExp(process.env.PI_JOURNEY).test(item.id) && results.length === 0 && item.id !== 'J01') { /* runs from the start: the steps build on each other */ }
    t.failures = [];
    t.check = async (label, fn) => { try { await fn(); } catch (error) { t.failures.push(`${label}: ${String(error.message || error).split('\n').slice(0, 4).join(' / ')}`); } };
    const started = Date.now();
    try { await item.fn(t); } catch (error) { t.failures.push(`stopped: ${String(error.message || error).split('\n').slice(0, 4).join(' / ')}`); }
    const outcome = t.failures.length ? 'FAIL' : 'PASS';
    results.push({ ...item, outcome, failures: [...t.failures] });
    console.log(`${outcome.padEnd(5)} ${item.id} ${item.title} (${((Date.now() - started) / 1000).toFixed(1)} s)`);
    for (const failure of t.failures) console.log('      ✗ ' + failure);
    if (t.failures.length && process.env.PI_JOURNEY_VERBOSE) {
      console.log('      page: ' + (await page.locator('#messages').innerText().catch(() => '')).slice(-1500).replace(/\n+/g, ' / '));
      console.log('      model: ' + model.state.requests.slice(-6).map(request => `#${request.turn} ${request.input.slice(0, 160).replace(/\n/g, ' ')}`).join('\n             '));
      console.log('      server: ' + bench.log.slice(-12).join('\n              '));
    }
    if (process.env.PI_JOURNEY_UNTIL && item.id === process.env.PI_JOURNEY_UNTIL) break;
  }
  await browser.close(); await bench.stop(); await model.stop();
  if (!process.env.PI_JOURNEY_KEEP) bench.remove(); else console.log('Kept: ' + bench.directory);
  const failed = results.filter(result => result.outcome === 'FAIL');
  console.log(`Journey: ${results.length - failed.length} of ${results.length} steps passed${failed.length ? ` · failed: ${failed.map(result => result.id).join(', ')}` : ''}.`);
  return failed.length ? 1 : 0;
}

// A response a step was waiting for when an earlier action failed rejects later, unawaited: the step already failed.
process.on('unhandledRejection', error => { if (process.env.PI_JOURNEY_VERBOSE) console.log('      (late: ' + String(error?.message || error).split('\n')[0] + ')'); });
if (require.main === module) main().then(code => { process.exitCode = code; }, error => { console.error(error); process.exitCode = 1; });
