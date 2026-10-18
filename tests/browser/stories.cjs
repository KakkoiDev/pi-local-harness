// User-story journeys (task 264, docs/user-stories.md): each story drives one thing a person does through the real UI
// and the real services (web, Gate, the queue, git), with the fake Pi scripted by tests/browser/stories/*.json, and
// checks what the person sees and what is on disk. Run: python3 tests/browser/run.py stories
// (PI_STORIES=US-0 runs the stories whose id matches; PI_STORIES_VERBOSE=1 prints expected failures' errors too).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { join } = require('node:path');
const { scratch, launch, runner } = require('./workbench.cjs');

const { story, run } = runner();
const exists = (...parts) => fs.existsSync(join(...parts));

// -- helpers that act as the person ------------------------------------------------------------------------------
/** Project Start's “Create in”: the folder browser in its pick mode, pointed at the story's scratch folder. */
async function pickWhere(t) {
  const { page } = t;
  await page.locator('#start-where').click();
  await page.locator('#folder-dialog').waitFor();
  await page.waitForFunction(() => document.querySelector('#folder-path').value.length > 0 && !document.querySelector('#folder-use').disabled);
  await page.locator('#folder-path').fill(t.directory);
  const browsed = page.waitForResponse(response => response.url().includes('/api/directories?path='));
  await page.locator('#folder-go').click(); await browsed;
  await page.waitForFunction(path => document.querySelector('#folder-path').value === path, t.directory);
  await page.locator('#folder-use').click();
  await page.locator('#folder-dialog').waitFor({ state: 'hidden' });
}

/** New Project… step 1 (Name, Create in, the sentence), from the Projects page. */
async function startProject(t, name, sentence = '', { where = true } = {}) {
  const { page } = t;
  await page.goto(t.base + '/projects');
  await page.waitForFunction(() => Boolean(document.getElementById('new-project')?.onclick));
  if (await page.locator('#sidebar').getAttribute('aria-hidden') === 'true') await page.locator('#open-menu').click();  // the phone: in the π sheet
  await page.locator('#new-project').click();
  await page.locator('#start-dialog').waitFor();
  await page.locator('#start-name').fill(name);
  if (sentence) await page.locator('#start-sentence').fill(sentence);
  if (where) await pickWhere(t);
}
const step = (t, name) => t.page.waitForFunction(name => document.querySelector('#start-steps [aria-current="step"]')?.textContent.endsWith(name), name);
/** Steps 2–4 of Project Start: tick the capabilities, choose the packages (only those), and arrive at the Summary. */
async function chooseAndSummarise(t, { capabilities = [], packages = ['web'] } = {}) {
  const { page } = t;
  await page.locator('#start-next').click(); await step(t, 'Capabilities');
  for (const id of capabilities) await page.locator(`#start-body .pw-cap[data-id="${id}"] input`).check();
  await page.locator('#start-next').click(); await step(t, 'Packages');
  for (const id of await page.locator('#start-packages .pw-cap:has(input:checked)').evaluateAll(rows => rows.map(row => row.dataset.id))) if (!packages.includes(id)) await page.locator(`#start-packages .pw-cap[data-id="${id}"] input`).uncheck();
  for (const id of packages) await page.locator(`#start-packages .pw-cap[data-id="${id}"] input`).check();
  await page.locator('#start-next').click(); await step(t, 'Summary');
  await page.locator('#start-facts').waitFor();
}
/** A new project, as the person makes it: kind 'empty' is “Start from an empty folder instead”; any other kind is a
 * package (round 12: the kinds are packages), chosen in step 3, with the given capabilities, then Create. */
async function newProject(t, name, kind = 'empty', capabilities = []) {
  const { page } = t;
  await startProject(t, name);
  if (kind === 'empty') await page.locator('#start-empty').click();
  else {
    await chooseAndSummarise(t, { capabilities, packages: [kind] });
    await page.locator('#start-next').click();
  }
  await page.waitForFunction(() => document.body.dataset.view === 'chat' && /\/chat$/.test(location.pathname), null, { timeout: 60000 });
  const project = await page.evaluate(() => location.pathname.split('/')[2]);
  return { project, root: join(t.directory, name) };
}

async function choosePhase(t, name) {
  const { page } = t;
  await page.locator('#phase-button').click();
  await page.locator('#phase-menu').getByRole(/radio/.test(await page.locator('#phase-menu').getAttribute('role')) ? 'radio' : 'menuitemradio', { name: new RegExp('^' + name) }).click();
  await page.waitForFunction(phase => (document.querySelector('#phase-button')?.textContent||'').includes(phase), name);
}

/** Type in the composer and send; returns the request's id once it is queued. */
async function say(t, text) {
  const { page } = t;
  const queued = page.waitForResponse(response => response.url().endsWith('/api/jobs/create') && response.request().method() === 'POST');
  await page.locator('#prompt').fill(text);
  await page.locator('#send').click();
  const response = await queued; const body = await response.json();
  if (!response.ok()) throw new Error('Not sent: ' + body.error);
  return body.id;
}

async function answered(t, id, states) { return t.bench.job(id, states); }

const decisions = t => t.bench.lines(join(t.bench.data, 'decisions.jsonl'));
const commits = (t, root) => t.bench.git(root, 'log', '--format=%an|%s').trim().split('\n');

/** Start Building on the latest plan card; returns the request it sends ("Build the approved task."). */
async function startBuilding(t, card) {
  const { page } = t;
  const sent = page.waitForResponse(response => response.url().endsWith('/api/jobs/create'));
  await card.getByRole('button', { name: 'Start Building', exact: true }).click();
  await page.waitForFunction(() => (document.querySelector('#phase-button')?.textContent||'').includes('Implementation'));
  return (await (await sent).json()).id;
}

/** Discussion → Planning → plan card → Start Building → Pi builds: the whole round 11 flow, through the person's controls. */
async function planAndBuild(t, { name = 'Counter', script = 'plan-counter' } = {}) {
  const { page } = t;
  const made = await newProject(t, name);
  await choosePhase(t, 'Planning');
  const planned = await say(t, `Plan a click counter TEST_SCRIPT=${script}`);
  await answered(t, planned);
  const card = page.locator('.pw-card[aria-label="Plan"]').last(); await card.waitFor();
  const job = await answered(t, await startBuilding(t, card));
  return { ...made, job, card };
}

/**
 * Given an approved plan (a story's precondition, not its subject): the task files System 1 lays out, approved with
 * Start Building through the same Paperwork the services use, as design.cjs replays one. Used where the journey under
 * test starts after the approval (undo, preview, check-ins), so the known propose_plan defect (NEW-1) does not hide it.
 */
async function givenApprovedTasks(t, root, tasks, goal = 'A small app for one person.') {
  const { execFileSync } = require('node:child_process');
  execFileSync('python3', ['-c', `
import json, re, sys
from pathlib import Path
from gate.paperwork import Paperwork
from gate.protocol import Protocol
from harness.documents import DocumentStore
root, data, tasks, goal = Path(sys.argv[1]).resolve(), Path(sys.argv[2]), json.loads(sys.argv[3]), sys.argv[4]
roadmap = root/'ROADMAP.md'; text = roadmap.read_text()
text = re.sub(r'^## Goal\\s*\\n.*?(?=^## |\\Z)', '## Goal\\n\\n' + goal + '\\n\\n', text, flags=re.M|re.S)
paths = []
for number, task in enumerate(tasks, start=2):
    path = f'tasks/{number:03d}-' + re.sub(r'[^a-z0-9]+', '-', task['title'].lower()).strip('-') + '.md'
    kind = task.get('kind', 'code'); steps = '- [ ] Red: a test fails for this change.\\n- [ ] Green: the test passes with this change.\\n' if kind == 'code' else '- [ ] Verify the change.\\n'
    (root/path).write_text(f"# {number:03d}: {task['title']}\\n\\nKind: {kind}\\nFiles: {', '.join(task['files'])}\\n\\nDone when: {task['done_when']}\\n\\n{steps}\\n## Decisions\\n\\n")
    text += f"- [ ] [{number:03d}-{task['title']}]({path})\\n"; paths.append(path)
roadmap.write_text(text)
paper = Paperwork(Protocol(), data=data); paper.projects = DocumentStore(data)
paper.plan_state(root, {'tasks': paths, 'pending': True, 'digest': paper.plan_digest(root, paths)})
paper.start_building(root)
`, root, t.bench.data, JSON.stringify(tasks), goal]);
  await t.page.reload(); await t.page.waitForFunction(() => (document.querySelector('#phase-button')?.textContent||'').includes('Implementation'));
}
const COUNT = { title: 'Count clicks', files: ['counter.py', 'tests/'], done_when: 'Each click adds one.' };
const RESET = { title: 'Reset the count', files: ['counter.py', 'tests/'], done_when: 'Reset sets the count to zero.' };

/** The check-in card the last request left, and its DoneRow. */
const checkIn = t => t.page.locator('.pw-card[aria-label^="Task "]').last();  // round 12: “done” or “not verified”

// -- First run and projects --------------------------------------------------------------------------------------
story('US-001', 'first run: an empty workbench leads to the first project, which opens its chat', async t => {
  const { page } = t;
  await page.goto(t.base);
  const first = page.getByRole('button', { name: 'Create Your First Project…', exact: true }); await first.waitFor();
  assert.equal(await page.locator('#prompt').isDisabled(), true, 'no chat before a project exists');
  await first.click(); await page.locator('#start-dialog').waitFor();
  await page.locator('#start-name').fill('Hello'); await pickWhere(t);
  await page.locator('#start-empty').click();
  await page.waitForFunction(() => document.body.dataset.view === 'chat' && !document.querySelector('#prompt').disabled);
  assert.ok(exists(t.directory, 'Hello', 'ROADMAP.md') && exists(t.directory, 'Hello', 'tasks', '001-first-task.md'));
  assert.match(commits(t, join(t.directory, 'Hello')).at(-1), /^.*\|/, 'a git repository with a first commit');
  assert.match(await page.locator('#phase-button').textContent(), /Discussion/, 'every project starts in Discussion');
});

for (const [id, kind, label, identify, check] of [['US-002', 'web', 'Web app', 'app/main.py', 'tests.test_base'], ['US-003', 'static', 'App with no server', 'js/app.mjs', 'tests/notes.test.mjs'], ['US-004', 'tui', 'Terminal app', 'app/tui.py', 'tests.test_base'], ['US-005', 'empty', 'Empty folder', null, null]]) {
  story(id, `create a project of each kind (round 12: a package, or the empty folder): ${label}`, async t => {
    const made = await newProject(t, label + ' project', kind);
    assert.ok(exists(made.root, 'ROADMAP.md'), 'the plan is there');
    if (identify) {
      assert.ok(exists(made.root, identify), `the ${label} starter's ${identify}`);
      assert.deepEqual(JSON.parse(t.bench.read(made.root, 'packaging.json')), { packages: [kind], capabilities: [] }, 'the package the person chose, written by the harness');
      const runs = t.bench.lines(join(t.bench.data, 'test-runs.jsonl')).filter(run => run.cwd === made.root);
      assert.ok(runs.length && runs.every(run => run.exit_code === 0 && run.counts.pass > 0 && !run.counts.fail), 'Create ran the base’s tests and they passed');
      assert.ok(runs.some(run => run.command.includes(check)), runs.map(run => run.command).join(' / '));
    } else assert.deepEqual(fs.readdirSync(made.root).filter(name => name !== '.git').sort(), ['ROADMAP.md', 'tasks']);
    assert.equal(t.bench.git(made.root, 'status', '--porcelain').trim(), '', 'everything the starter made is committed');
    await t.page.locator('#work-tab').click();
    await t.page.getByRole('button', { name: 'ROADMAP.md', exact: true }).first().waitFor();
  });
}

// -- Project Start (round 12, plan 253) ------------------------------------------------------------------------------
/** Stand-ins for uv and uvx on the services' PATH, so a Preview or a whole-suite run never downloads (as US-116 does). */
async function offlineUv(t, extra = {}) {
  for (const name of ['uv', 'uvx']) fs.writeFileSync(join(t.directory, name), '#!/bin/sh\nfor arg in "$@"; do case "$arg" in --watch*) exec sleep 600;; esac; done\nprintf "# pass 1\\n# fail 0\\n"\nexit 0\n', { mode: 0o755 });
  await t.bench.restart(extra); await t.reopen();
}
const EXTRA = join(__dirname, '../fixtures/capabilities/extra.json');

story('US-133', 'create with capabilities: the sentence’s suggestions are marked, never checked; Create runs the base’s tests and they pass', async t => {
  await offlineUv(t);
  const { page } = t;
  await startProject(t, 'Class Notes', 'A notes app for my class that works offline on a phone');
  await page.locator('#start-next').click(); await step(t, 'Capabilities');
  assert.match(await page.locator('#start-body .pw-notice').textContent(), /From your sentence: .*Works offline.*Installs on a phone.*never pre-checked/);
  for (const id of ['offline', 'install']) {
    const suggested = page.locator(`#start-body .pw-cap[data-id="${id}"]`);
    assert.equal(await suggested.getAttribute('data-suggested'), '', `${id} is marked`);
    assert.equal(await suggested.locator('input').isChecked(), false, `${id} is never checked for the person`);
  }
  assert.equal(await page.locator('#start-body .pw-cap:has(input:checked)').count(), 0, 'nothing is chosen for the person');
  await page.locator('#start-body .pw-cap[data-id="offline"] input').check();
  await page.locator('#start-body .pw-cap[data-id="charts"] input').check();
  assert.equal(await page.locator('#start-status').textContent(), '2 chosen');
  await page.locator('#start-next').click(); await step(t, 'Packages');
  const web = page.locator('#start-packages .pw-cap[data-id="web"]');
  assert.equal(await web.getAttribute('aria-disabled'), 'true');
  assert.match(await web.textContent(), /Not with: Works offline/, 'a package lists what it can’t carry');
  assert.equal(await page.locator('#start-packages .pw-cap[data-id="static"] input').isChecked(), true, 'the one package that carries both');
  await page.locator('#start-packages .pw-cap[data-id="phone"] input').check();
  assert.match(await page.locator('#start-packages .pw-cap[data-id="phone"]').textContent(), /From: Installs on a phone/);
  await page.locator('#start-next').click(); await step(t, 'Summary');
  const facts = page.locator('#start-facts'); await facts.waitFor();
  const text = await facts.textContent();
  assert.match(text, /Works offline · Dashboard and charts · Installs on a phone \(from Phone app\)/);
  assert.match(text, /App with no server · Phone app/);
  assert.match(text, /English and Japanese, always/); assert.match(text, /Discussion/);
  const [, files, tests] = text.match(/(\d+) files, (\d+) tests/);
  assert.ok(Number(files) > 10 && Number(tests) >= 10, text);
  await page.locator('#start-next').click();
  await page.waitForFunction(() => document.body.dataset.view === 'chat' && /\/chat$/.test(location.pathname), null, { timeout: 60000 });
  await page.locator('#toast-text').filter({ hasText: `Created “Class Notes”: all ${tests} tests of the base pass.` }).waitFor();
  const root = join(t.directory, 'Class Notes');
  assert.match(t.bench.read(root, 'ROADMAP.md'), /A notes app for my class that works offline on a phone/);
  for (const name of ['vendor/chart.js-4.5.1/chart.umd.min.js', 'vendor/chart.js-4.5.1/LICENSE.md', 'vendor/basecoat/chart.min.js', 'tests/cap-charts.test.mjs', 'tests/cap-offline.test.mjs', 'tests/cap-install.test.mjs']) assert.ok(exists(root, name), name);
  assert.deepEqual(JSON.parse(t.bench.read(root, 'packaging.json')), { packages: ['static', 'phone'], capabilities: ['offline', 'charts', 'install'] });
  assert.match(t.bench.read(root, 'sw.js'), /'vendor\/chart\.js-4\.5\.1\/chart\.umd\.min\.js'/, 'the offline shell caches the library');
  assert.match(t.bench.read(root, 'README.md'), /## Capabilities[\s\S]*Chart\.js 4\.5\.1/);
  const run = t.bench.lines(join(t.bench.data, 'test-runs.jsonl')).filter(item => item.cwd === root).at(-1);
  assert.equal(run.counts.pass, Number(tests)); assert.equal(run.counts.fail, 0);
  assert.match(run.command, /node --test .*tests\/cap-charts\.test\.mjs/);
  assert.deepEqual(commits(t, root), ['Pi Workbench|Start from the Pi Workbench starter'], 'one first commit, after the tests passed');
  assert.equal(t.bench.git(root, 'status', '--porcelain').trim(), '');
});

story('US-134', 'on the phone, a capability that is not available yet shows its reason, and a conflict shows before choosing', async t => {
  const { page } = t;
  await startProject(t, 'Party Game', '', { where: false });  // it creates nothing; the phone's folder browser has its own check (design.cjs, Ph8_ChooseFolder)
  await page.locator('#start-next').click();
  await page.locator('#start-dialog .pw-start__bar', { hasText: '2 of 4' }).waitFor();
  assert.equal(await page.locator('#start-dialog .pw-start__bar-title').textContent(), 'Capabilities');
  assert.deepEqual(await page.locator('#start-body .pw-capgroup > legend').allTextContents(), ['Accounts', 'Data', 'Screens', 'Together', 'Games', 'Publish']);
  const accounts = page.locator('#start-body .pw-cap[data-id="accounts"]');
  assert.equal(await accounts.getAttribute('aria-disabled'), 'true');
  assert.equal(await accounts.locator('input').isDisabled(), true);
  assert.match(await accounts.textContent(), /Not available yet: signing in needs the trusted sign-in adapter/, 'its reason, never hidden');
  for (const label of await page.locator('#start-body .pw-cap').all()) assert.ok((await label.boundingBox()).height >= 44, 'rows are 44 px or more on the phone');
  await page.locator('#start-body .pw-cap[data-id="multiplayer"] input').check();
  assert.match(await page.locator('#start-body .pw-cap[data-id="offline"] .pw-cap__warn').textContent(), /With Multiplayer, real time: changes from others wait until you are back online\./, 'shown before choosing');
  assert.match(await page.locator('#start-body .pw-cap[data-id="database"] .pw-cap__warn').textContent(), /Not with Multiplayer, real time: no package carries both/);
  await page.locator('#start-body .pw-cap[data-id="database"] input').check();
  assert.equal(await page.locator('#start-next').isDisabled(), true, 'no package carries both: Next waits');
  assert.match(await page.locator('#start-status').textContent(), /No package carries all of these/);
  await page.locator('#start-body .pw-cap[data-id="database"] input').uncheck();
  await page.locator('#start-next').click();
  await page.locator('#start-dialog .pw-start__bar', { hasText: '3 of 4' }).waitFor();
  assert.match(await page.locator('#start-packages .pw-cap[data-id="tui"]').textContent(), /Not with: Multiplayer, real time/);
}, { viewport: { width: 390, height: 844 } });

story('US-135', 'a failing base test creates nothing (the folder goes to the Trash, the test is named); Add a Capability… keeps nothing either', async t => {
  await offlineUv(t, { PI_KIT_CAPABILITIES_EXTRA: EXTRA });
  const { page } = t;
  await startProject(t, 'Broken');
  await chooseAndSummarise(t, { capabilities: ['broken'], packages: ['web'] });
  await page.locator('#start-next').click();
  await page.locator('#start-result .pw-cap__warn').filter({ hasText: 'Not created: a test of the base failed (Always fails (test): test_this_capability_always_fails). Nothing was created.' }).waitFor({ timeout: 60000 });
  assert.match(await page.locator('#start-result .pw-start__failing').first().textContent(), /tests\/test_cap_broken\.py/);
  assert.match(await page.locator('#start-result .pw-start__output').textContent(), /this capability is broken on purpose/);
  assert.equal(await page.locator('#start-status').textContent(), 'Nothing was created.');
  assert.equal(exists(t.directory, 'Broken'), false, 'no folder');
  assert.ok(exists(t.directory, 'Trash', 'Broken'), 'the partial folder went to the Trash');
  assert.equal((await t.bench.api('/api/workspace')).projects.length, 0, 'no project');
  const made = await newProject(t, 'Solid', 'web');
  await page.locator('[aria-controls="menu-project"]').click(); await page.locator('#menu-project [data-command="add-capability"]').click();
  await page.locator('#capability-dialog .pw-cap[data-id="broken"] input').check();
  await page.locator('#capability-facts').filter({ hasText: /adds 1 file/ }).waitFor();
  await page.locator('#capability-add').click();
  await page.locator('#capability-status').filter({ hasText: 'Not added: a test failed (Always fails (test): test_this_capability_always_fails). Nothing was changed.' }).waitFor({ timeout: 60000 });
  assert.equal(exists(made.root, 'tests', 'test_cap_broken.py'), false);
  assert.equal(t.bench.git(made.root, 'status', '--porcelain').trim(), '', 'every file as it was');
  assert.equal(commits(t, made.root).length, 1);
});

story('US-136', 'Add a Capability…: what changes, Safety and Undo; it is kept as one request when the tests pass, and Undo takes it back', async t => {
  await offlineUv(t);
  const { page } = t;
  const { root } = await newProject(t, 'Quiz Night', 'static');
  await page.locator('[aria-controls="menu-project"]').click(); await page.locator('#menu-project [data-command="add-capability"]').click();
  const dialog = page.locator('#capability-dialog'); await dialog.waitFor();
  assert.match(await dialog.locator('.pw-cap[data-id="database"]').textContent(), /The App with no server can't carry it/);
  assert.equal(await dialog.locator('.pw-cap[data-id="database"] input').isDisabled(), true);
  await dialog.locator('.pw-cap[data-id="qrcode"] input').check();
  await page.locator('#capability-facts').filter({ hasText: 'adds 3 files · changes 3 (README.md, packaging.json, sw.js) · adds 2 tests' }).waitFor();
  const facts = await page.locator('#capability-facts').textContent();
  assert.match(facts, /every existing test must still pass; if one fails, nothing is kept/); assert.match(facts, /it is one request: Undo This Request… takes it back/);
  await page.locator('#capability-add').click();
  await dialog.waitFor({ state: 'hidden', timeout: 60000 });
  const message = page.locator('.pw-msg', { hasText: 'Added Share by QR code' }); await message.waitFor();
  assert.match(await message.textContent(), /all \d+ tests of the base pass, 2 of them new/);
  assert.equal(commits(t, root)[0], 'Pi Workbench|Capability: Share by QR code', 'one request, by the harness');
  assert.ok(exists(root, 'vendor', 'qrcode', 'qrcode.mjs') && exists(root, 'tests', 'cap-qrcode.test.mjs'));
  assert.deepEqual(JSON.parse(t.bench.read(root, 'packaging.json')).capabilities, ['qrcode']);
  await page.locator('[aria-controls="menu-project"]').click(); await page.locator('#menu-project [data-command="add-capability"]').click();
  await page.locator('#capability-dialog[open] .pw-cap[data-id="qrcode"][aria-disabled="true"]').waitFor();
  assert.match(await dialog.locator('.pw-cap[data-id="qrcode"]').textContent(), /Already in this project/);
  assert.equal(await dialog.locator('.pw-cap[data-id="qrcode"] input').isDisabled(), true);
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).last().click(); await dialog.waitFor({ state: 'hidden' });
  await message.locator('.pw-done').getByText('Undo This Request…', { exact: true }).click();
  await page.locator('#alert-message').filter({ hasText: /^Undo “/ }).waitFor(); await page.locator('#alert-danger').click();
  await page.waitForFunction(() => [...document.querySelectorAll('.pw-done__head')].some(head => /Undone/.test(head.textContent)));
  assert.equal(exists(root, 'vendor', 'qrcode', 'qrcode.mjs'), false, 'Undo takes the files back');
  assert.deepEqual(JSON.parse(t.bench.read(root, 'packaging.json')).capabilities, []);
});

story('US-006', 'add an existing folder: it is used in place, its files show and nothing is written', async t => {
  const { page } = t;
  const folder = join(t.directory, 'My notes'); fs.mkdirSync(folder); fs.writeFileSync(join(folder, 'ideas.md'), '# Ideas\n\nA garden planner.\n');
  await page.goto(t.base + '/projects');
  await page.locator('#menubar [aria-controls="menu-file"]').click(); await page.locator('#menu-file [data-command="add-folder"]').click();
  await page.locator('#folder-dialog').waitFor();
  await page.waitForFunction(() => document.querySelector('#folder-path').value.length > 0 && !document.querySelector('#folder-use').disabled);
  await page.locator('#folder-path').fill(folder);
  const browsed = page.waitForResponse(response => response.url().includes('/api/directories?path='));
  await page.locator('#folder-go').click(); await browsed;
  await page.waitForFunction(path => document.querySelector('#folder-path').value === path, folder);
  await page.locator('#folder-use').click();
  await page.waitForFunction(() => document.body.dataset.view === 'chat');
  assert.deepEqual(fs.readdirSync(folder), ['ideas.md'], 'registration alone writes nothing');
  await page.locator('#work-tab').click();
  await page.getByRole('button', { name: 'ideas.md', exact: true }).first().click();
  await page.locator('#document-editor').getByText('A garden planner.').waitFor();
});

story('US-010', 'rename a project, then keep talking with Pi in it', async t => {
  const { page } = t;  // the fake Pi stops like Pi 1.1.0 when its session header names a folder that is gone
  const made = await newProject(t, 'Old name');
  const first = await say(t, 'Hello'); await answered(t, first);
  await page.locator('#messages').getByText('reply 1',{exact:true}).waitFor();
  await page.locator('#menubar [aria-controls="menu-project"]').click(); await page.locator('#menu-project [data-command="rename-project"]').click();
  await page.locator('#name-dialog-input').fill('New name'); await page.locator('#name-dialog-ok').click();
  await page.locator('#toast-text').filter({ hasText: 'Renamed to “New name”.' }).waitFor();
  assert.ok(exists(t.directory, 'New name', 'ROADMAP.md') && !exists(made.root));
  const second = await say(t, 'Are you still there?');
  const job = await answered(t, second);
  assert.equal(job.status, 'completed', `the request after the rename ${job.status}: ${job.progress || ''}`);
  await page.locator('#messages').getByText('reply 2',{exact:true}).waitFor();
});

story('US-011', 'create a new project with the old name of a renamed one: it gets its own, empty chat', async t => {
  const { page } = t;
  await newProject(t, 'Recipes');
  const first = await say(t, 'Remember: basil'); await answered(t, first);
  await page.locator('#menubar [aria-controls="menu-project"]').click(); await page.locator('#menu-project [data-command="rename-project"]').click();
  await page.locator('#name-dialog-input').fill('Old recipes'); await page.locator('#name-dialog-ok').click();
  await page.locator('#toast-text').filter({ hasText: 'Renamed to “Old recipes”.' }).waitFor();
  await newProject(t, 'Recipes');
  await page.locator('#prompt').waitFor();
  assert.equal(await page.locator('#messages').getByText('Remember: basil').count(), 0, 'the new project shows the renamed project’s chat');
});  // review item 16 needs a project created without a parent folder (the API's data folder): the web's New Project always names one

story('US-017', 'rename a project while Pi works in it: it waits, says why, and nothing moves', async t => {
  const { page } = t;
  const made = await newProject(t, 'Busy');
  const id = await say(t, 'A long job TEST_WAIT'); await t.bench.job(id, ['running']);
  await page.locator('#menubar [aria-controls="menu-project"]').click(); await page.locator('#menu-project [data-command="rename-project"]').click();
  await page.locator('#name-dialog-input').fill('Renamed while busy'); await page.locator('#name-dialog-ok').click();
  await page.getByText(/Pi is answering about this project/).first().waitFor();
  assert.ok(exists(made.root, 'ROADMAP.md') && !exists(t.directory, 'Renamed while busy'), 'nothing moved');
  await t.bench.api('/api/jobs/stop', { id });
});

// -- The three phases, plans, check-ins ---------------------------------------------------------------------------
story('US-030', 'plan in Planning, Start Building, Pi builds the task test-first: a verified commit waits for Accept and Continue', async t => {
  const { page } = t;
  const { root, job } = await planAndBuild(t);
  assert.equal(job.status, 'completed');
  const check = checkIn(t); await check.waitFor();
  const task = fs.readdirSync(join(root, 'tasks')).find(name => /count-clicks/.test(name));
  const text = t.bench.read(root, 'tasks', task);
  assert.doesNotMatch(await check.textContent(), /not verified/, 'the harness verified it: ' + await check.textContent());
  assert.match(text, /^Plan approved: chosen /m, 'Start Building is the person’s approval');
  assert.match(text, /- \[x\] Red:/); assert.match(text, /- \[x\] Green:/);
  assert.match(t.bench.read(root, 'ROADMAP.md'), new RegExp(`- \\[x\\] .*\\(tasks/${task}\\)`));
  assert.match(commits(t, root)[0], /^Pi Workbench\|Count clicks \(task \d+\)$/, 'the harness committed the task');
  assert.match(await check.textContent(), /Next\s*Task 2: .*publish/si, 'the plan ends with its publication audit task (round 12: Next names it)');
  assert.match(await check.locator('.pw-facts').textContent(), /Test run\s*python3 -m unittest discover -s tests · 1 passed · 0 failed/, 'round 12: the evidence names the run Gate saw');
  const next = page.waitForResponse(response => response.url().endsWith('/api/jobs/create'));
  await check.getByRole('button', { name: 'Accept and Continue', exact: true }).click();
  await answered(t, (await (await next).json()).id);
  const kinds = decisions(t).map(row => `${row.kind}:${row.who}`);
  for (const expected of ['plan_layout:code', 'plan_approval:person', 'box_ticked:code', 'step_done:code', 'task_acceptance:person'])
    assert.ok(kinds.includes(expected), `decision log has ${expected}: ${kinds.join(', ')}`);
});

story('US-031', 'Discussion refuses a file write; the person sees why, in the chat and in Gate, and nothing is written', async t => {
  const { page } = t;
  const { root } = await newProject(t, 'Careful');
  const id = await say(t, 'Make the app TEST_SCRIPT=write-in-discussion'); await answered(t, id);
  await page.locator('#messages').getByText('I tried to write app.py.').waitFor();
  assert.equal(exists(root, 'app.py'), false, 'nothing written in Discussion');
  await page.goto(t.base + '/activity');
  await page.locator('.activity-task').filter({ hasText: 'Make the app' }).first().locator('.activity-request').click();
  await page.locator('#activity-detail').getByText(/Not written: the project is in Discussion/).first().waitFor();
  await page.goto(t.base + '/gate');
  const row = page.locator('#gate-events .gate-event').filter({ hasText: 'app.py' }).first();
  await row.waitFor(); assert.match(await row.textContent(), /Careful/, 'the row names its project');
});

story('US-032', 'Start Building on a waiting plan: one task built and verified, Accept and Continue builds the next, Accept Task ends', async t => {
  const { page } = t;
  const { root } = await newProject(t, 'Two steps');
  await givenApprovedTasks(t, root, [COUNT, RESET]);
  const first = await say(t, 'Build the approved task. TEST_SCRIPT=build-two'); await answered(t, first);
  let check = checkIn(t); await check.waitFor();
  assert.match(await check.textContent(), /Task 1 of 2 done: /); assert.doesNotMatch(await check.textContent(), /not verified/);
  assert.equal(await check.locator('.pw-btn--default').textContent(), 'Accept and Continue');
  const next = page.waitForResponse(response => response.url().endsWith('/api/jobs/create'));
  await check.getByRole('button', { name: 'Accept and Continue', exact: true }).click();
  await answered(t, (await (await next).json()).id);
  check = page.locator('.pw-card').filter({ hasText: 'Task 2 of 2 done' }).last(); await check.waitFor();
  await check.getByRole('button', { name: 'Accept Task', exact: true }).click();
  await page.getByText(/All 2 planned tasks are built/).waitFor();
  const log = commits(t, root);
  assert.match(log[0], /^Pi Workbench\|Reset the count/); assert.match(log[1], /^Pi Workbench\|Count clicks/);
  assert.match(t.bench.read(root, 'counter.py'), /def reset/);
  for (const name of fs.readdirSync(join(root, 'tasks')).filter(name => /count|reset/.test(name)))
    assert.doesNotMatch(t.bench.read(root, 'tasks', name).split('## Progress')[0], /- \[ \]/, name + ' has every box ticked');
  assert.equal(decisions(t).filter(row => row.kind === 'task_acceptance' && row.who === 'person').length, 2);
});

story('US-033', 'a task built without a passing test is committed but marked not verified; Retry Task is the default (round 12), Review First opens the task', async t => {
  const { root } = await newProject(t, 'Untested');
  await givenApprovedTasks(t, root, [COUNT]);
  const id = await say(t, 'Build the approved task. TEST_SCRIPT=build-untested'); await answered(t, id);
  const check = checkIn(t); await check.waitFor();
  assert.match(await check.textContent(), /not verified/);
  assert.equal(await check.locator('.pw-btn--default').textContent(), 'Retry Task');
  assert.match(commits(t, root)[0], /^Pi Workbench\|Count clicks \(task \d+, not verified\)$/, 'committed, marked');
  const task = fs.readdirSync(join(root, 'tasks')).find(name => /count-clicks/.test(name));
  assert.match(t.bench.read(root, 'tasks', task), /Not verified at \d\d:\d\d: no test passed on the final code/);
  assert.doesNotMatch(t.bench.read(root, 'ROADMAP.md'), new RegExp(`- \\[x\\] .*${task}`), 'the roadmap line stays open');
  await check.getByRole('button', { name: 'Review First', exact: true }).click();  // US-048: the task itself, in Work
  await t.page.locator('#document-path').filter({ hasText: task }).waitFor();
});

story('US-034', 'a comment-only edit and a --help run do not make a task verified', async t => {
  const { root } = await newProject(t, 'Honest');
  await givenApprovedTasks(t, root, [COUNT]);
  const id = await say(t, 'Build the approved task. TEST_SCRIPT=build-fake-green'); await answered(t, id);
  const check = checkIn(t); await check.waitFor();
  assert.match(await check.textContent(), /not verified/, 'the check-in claims verification: ' + await check.textContent());
});

story('US-035', 'a plain question while a task is being built does not end that task', async t => {
  const { page } = t;
  const { root } = await newProject(t, 'Curious');
  await givenApprovedTasks(t, root, [COUNT]);
  const id = await say(t, 'How does the counter keep its value? TEST_SCRIPT=question-in-build'); await answered(t, id);
  await page.locator('#messages').getByText('The roadmap lists one task in progress.', { exact: true }).waitFor();
  assert.equal(await page.locator('.pw-card').filter({ hasText: 'Waiting for you to check it' }).count(), 0, 'no check-in for a question');
  const task = fs.readdirSync(join(root, 'tasks')).find(name => /count-clicks/.test(name));
  assert.doesNotMatch(t.bench.read(root, 'tasks', task), /Not verified/, 'the task is still in progress');
});

story('US-036', 'Plan Another Task keeps the plan waiting in Discussion; Build the Planned Tasks… builds the checked ones', async t => {
  const { page } = t;
  await newProject(t, 'Waiting plan');
  await choosePhase(t, 'Planning');
  const id = await say(t, 'TEST_PHASE_PLAN'); await answered(t, id);
  const card = page.locator('.pw-card[aria-label="Plan"]').last(); await card.waitFor();
  await card.getByRole('button', { name: 'Plan Another Task', exact: true }).click();
  await page.locator('.pw-waiting').waitFor();
  assert.match(await page.locator('#phase-button').textContent(), /Discussion/);
  await page.getByRole('button', { name: 'Build the Planned Tasks…', exact: true }).click();
  const review = page.getByRole('dialog', { name: 'Build the planned tasks?', exact: true }); await review.waitFor();
  await review.getByRole('checkbox', { name: /Reset/ }).uncheck();
  assert.equal(await review.getByRole('checkbox', { name: /Counter/ }).isChecked(), true);
  await review.getByRole('button', { name: 'Start Building', exact: true }).click();
  await page.waitForFunction(() => (document.querySelector('#phase-button')?.textContent||'').includes('Implementation'));
  const state = await t.bench.api('/api/phase?project=' + await page.evaluate(() => location.pathname.split('/')[2]));
  assert.deepEqual(state.tasks.map(task => task.title).filter(title => /Counter|Reset/.test(title)), ['Counter', 'Reset'], 'Reset stays waiting, Counter is approved');
  assert.equal(state.phase, 'implementation');
  assert.ok(decisions(t).some(row => row.kind === 'plan_approval' && row.who === 'person'));
});

// -- Choices ------------------------------------------------------------------------------------------------------
story('US-040', 'a choice in Planning: the recommended option first, the answer kept in the plan', async t => {
  const { page } = t;
  const { root } = await newProject(t, 'Team counter');
  await choosePhase(t, 'Planning');
  const id = await say(t, 'Plan a counter TEST_SCRIPT=choose-then-plan'); await answered(t, id);
  const card = page.locator('.pw-card[aria-label="Who uses it?"]'); await card.waitFor();
  assert.equal(await card.locator('input[type="radio"]').first().isChecked(), true, 'recommended preselected');
  assert.equal(await card.getByText('Something else…', { exact: true }).count(), 1, 'Something else… last');
  await card.getByText('A team', { exact: true }).click();
  const resumed = page.waitForResponse(response => response.url().endsWith('/api/choices/answer'));  // task 290: a card's answer has its own route
  await card.getByRole('button', { name: 'Answer', exact: true }).click();
  await answered(t, (await (await resumed).json()).job);
  await page.locator('.pw-card--settled').filter({ hasText: 'A team' }).waitFor();
  assert.doesNotMatch(await page.locator('#messages').innerText(), /I could not show it/, 'the plan was refused');
  const plan = page.locator('.pw-card[aria-label="Plan"]').last(); await plan.waitFor();
  const task = fs.readdirSync(join(root, 'tasks')).find(name => /count-clicks/.test(name));
  assert.match(t.bench.read(root, 'tasks', task), /- Who uses it\?: A team \(chosen /, 'the answer is in the planned task’s Decisions');
  assert.ok(decisions(t).some(row => row.kind === 'question_answer' && row.who === 'person'));
});

story('US-041', 'a choice in Discussion: the answer stays in harness data and the project is untouched', async t => {
  const { page } = t;
  const { root } = await newProject(t, 'Colours');
  const before = t.bench.git(root, 'rev-parse', 'HEAD');
  const id = await say(t, 'Which colours? TEST_SCRIPT=discuss-choice'); await answered(t, id);
  const card = page.locator('.pw-card[aria-label="Which colours?"]'); await card.waitFor();
  const resumed = page.waitForResponse(response => response.url().endsWith('/api/choices/answer'));  // task 290: a card's answer has its own route
  await card.getByRole('button', { name: 'Answer', exact: true }).click();
  await answered(t, (await (await resumed).json()).job);
  await page.locator('.pw-card--settled').filter({ hasText: 'Black on white' }).waitFor();
  await page.reload(); await page.locator('.pw-card--settled').filter({ hasText: 'Black on white' }).waitFor();
  assert.equal(t.bench.git(root, 'rev-parse', 'HEAD'), before, 'no commit');
  assert.equal(t.bench.git(root, 'status', '--porcelain').trim(), '', 'no file changed');
  assert.ok(decisions(t).some(row => row.kind === 'question_answer' && row.who === 'person'));
});

story('US-042', 'answering a choice keeps what I was typing in the composer', async t => {
  const { page } = t;
  await newProject(t, 'Drafts');
  const id = await say(t, 'Which colours? TEST_SCRIPT=discuss-choice'); await answered(t, id);
  const card = page.locator('.pw-card[aria-label="Which colours?"]'); await card.waitFor();
  await page.locator('#prompt').fill('A long note I am still writing');
  await card.getByRole('button', { name: 'Answer', exact: true }).click();
  await page.locator('.pw-card--settled').filter({ hasText: 'Black on white' }).waitFor();
  assert.equal(await page.locator('#prompt').inputValue(), 'A long note I am still writing');
});  // fixed by task 290 (review item 9)

story('US-087', 'step back to Discussion during a check-in, then come back and accept the task', async t => {
  const { page } = t;
  const { root } = await newProject(t, 'Back and forth');
  await givenApprovedTasks(t, root, [COUNT]);
  const id = await say(t, 'Build the approved task. TEST_SCRIPT=build-counter'); await answered(t, id);
  await checkIn(t).waitFor();
  await choosePhase(t, 'Discussion');
  await choosePhase(t, 'Implementation');
  await checkIn(t).getByRole('button', { name: 'Accept Task', exact: true }).click();
  await page.getByText(/All 1 planned tasks are built/).waitFor({ timeout: 5000 });
});

story('US-088', 'answer a question Pi asks in the middle of building: the code written before it is part of the verified task', async t => {
  const { page } = t;
  const { root } = await newProject(t, 'Midway');
  await givenApprovedTasks(t, root, [COUNT]);
  const id = await say(t, 'Build the approved task. TEST_SCRIPT=build-with-question'); await answered(t, id);
  const card = page.locator('.pw-card[aria-label="Start the count at?"]'); await card.waitFor();
  const resumed = page.waitForResponse(response => response.url().endsWith('/api/choices/answer'));  // task 290: a card's answer has its own route
  await card.getByRole('button', { name: 'Answer', exact: true }).click();
  await answered(t, (await (await resumed).json()).job);
  const check = checkIn(t); await check.waitFor();
  assert.doesNotMatch(await check.textContent(), /not verified/, 'the check-in: ' + await check.textContent());
  assert.equal(t.bench.git(root, 'status', '--porcelain', '--', 'counter.py').trim(), '', 'counter.py is committed with the task');
  const task = fs.readdirSync(join(root, 'tasks')).find(name => /count-clicks/.test(name));
  assert.match(t.bench.read(root, 'tasks', task), /- Start the count at\?: Zero \(chosen /);
});

story('US-089', 'an approved docs task with no change at all is not verified', async t => {
  const { root } = await newProject(t, 'Docs');
  await givenApprovedTasks(t, root, [{ title: 'Explain the app', kind: 'docs', files: ['README.md'], done_when: 'The README explains the app.' }]);
  const id = await say(t, 'Build the approved task. TEST_SCRIPT=docs-nothing'); await answered(t, id);
  await t.page.locator('#messages').getByText('The docs are fine as they are.').waitFor();
  assert.equal(await t.page.locator('.pw-card').filter({ hasText: /Task 1 of 1 done: / }).count(), 0, 'no “done” check-in');
  const task = fs.readdirSync(join(root, 'tasks')).find(name => /explain-the-app/.test(name));
  assert.match(t.bench.read(root, 'tasks', task), /- \[ \] Verify the change\./, 'its box stays open');
  assert.equal(commits(t, root).filter(line => /\(task \d+/.test(line)).length, 0, 'nothing committed as done');
});

// -- Run on its own -----------------------------------------------------------------------------------------------
async function turnOnRunOnItsOwn(t) {
  const { page } = t;
  await page.locator('#auto-composer').check(); await page.locator('#alert-dialog').waitFor();
  assert.equal(await page.locator('#alert-default').textContent(), 'Cancel', 'Cancel is the default');
  await page.locator('#alert-danger').click();
  await page.waitForFunction(() => fetch('/api/auto').then(r => r.json()).then(d => d.enabled));
}

story('US-086', 'Run on its own builds the approved tasks one after another, accepts verified ones and leaves a report', async t => {
  const { page } = t;
  const { root } = await newProject(t, 'Unattended');
  await givenApprovedTasks(t, root, [COUNT, RESET]);
  await turnOnRunOnItsOwn(t);
  const id = await say(t, 'Build the approved task. TEST_SCRIPT=build-two'); await answered(t, id);
  const report = page.locator('.pw-card').filter({ hasText: 'Ran on its own' }).last(); await report.waitFor();
  assert.match(await report.textContent(), /Done · 2 tasks/);
  const log = commits(t, root);
  assert.match(log[0], /^Pi Workbench\|Reset the count/); assert.match(log[1], /^Pi Workbench\|Count clicks/);
  const accepted = decisions(t).filter(row => row.kind === 'task_acceptance');
  assert.ok(accepted.length >= 2 && accepted.every(row => row.automatic && row.who === 'code'), 'automatic acceptances: ' + JSON.stringify(accepted));
  await report.getByRole('button', { name: 'Got It', exact: true }).click();
  await page.reload(); assert.equal(await page.locator('.pw-card').filter({ hasText: 'Ran on its own' }).filter({ has: page.getByRole('button', { name: 'Got It' }) }).count(), 0, 'a seen report is not shown again');
});

story('US-054', 'Run on its own stops at an unverified task for my review, and says so in the report', async t => {
  const { page } = t;
  const { root } = await newProject(t, 'Stops');
  await givenApprovedTasks(t, root, [COUNT, RESET]);
  await turnOnRunOnItsOwn(t);
  const id = await say(t, 'Build the approved task. TEST_SCRIPT=build-untested'); await answered(t, id);
  const check = checkIn(t); await check.waitFor();
  assert.match(await check.textContent(), /not verified/); assert.equal(await check.locator('.pw-btn--default').textContent(), 'Retry Task');  // round 12
  const report = page.locator('.pw-card').filter({ hasText: 'Ran on its own' }).last(); await report.waitFor();
  assert.match(await report.textContent(), /not verified/);
  assert.equal(exists(root, 'tests', 'test_counter.py'), false, 'the next task never started');
  assert.deepEqual(commits(t, root).filter(line => /\(task \d+/.test(line)), ['Pi Workbench|Count clicks (task 002, not verified)'], 'one task commit, marked');
});

story('US-045', 'Run on its own: the risks first, then Pi chooses, plans and builds two tasks, accepting each verified one', async t => {
  const { page } = t;
  const { root } = await newProject(t, 'Alone');
  await turnOnRunOnItsOwn(t);
  await choosePhase(t, 'Planning');
  const id = await say(t, 'Make a counter with a reset TEST_SCRIPT=auto-two-tasks'); await answered(t, id);
  const events = (await t.bench.api('/api/gate')).events.filter(event => event.outcome === 'REVISE').map(event => event.reason);
  assert.deepEqual(events, [], 'Gate refused Pi’s work while it ran on its own');
  await page.locator('#messages').getByText(/Phase: Implementation · Run on its own/).first().waitFor();
  await page.locator('.pw-card--auto, .pw-card').filter({ hasText: 'Who uses it?: Only me' }).first().waitFor();
  assert.equal(commits(t, root).filter(line => /^Pi Workbench\|.*\(task \d+\)$/.test(line)).length, 2, 'two verified task commits');
  const automatic = decisions(t).filter(row => row.automatic);
  assert.ok(automatic.some(row => row.kind === 'plan_approval') && automatic.some(row => row.kind === 'task_acceptance'), JSON.stringify(automatic));
  // The run goes on to the plan's publication audit task, so its report comes at the end of that one (US-086 checks a report).
});

// -- Undo ---------------------------------------------------------------------------------------------------------
story('US-050', 'undo a request, then redo it: each is a new commit and the files follow', async t => {
  const { page } = t;
  const { root } = await newProject(t, 'Undoable');
  await givenApprovedTasks(t, root, [COUNT]);
  const id = await say(t, 'Build the approved task. TEST_SCRIPT=build-counter'); await answered(t, id);
  const row = checkIn(t); await row.waitFor();
  await row.getByText('Undo This Task…', { exact: true }).click();
  await page.locator('#alert-message').filter({ hasText: /^Undo “/ }).waitFor();
  assert.match(await page.locator('#alert-dialog').textContent(), /counter\.py/, 'the files that change back are listed');
  await page.locator('#alert-danger').click();
  await page.locator('.pw-done').filter({ hasText: 'Undone' }).last().waitFor();
  assert.equal(exists(root, 'counter.py'), false, 'the request’s file is gone');
  const head = commits(t, root)[0]; assert.match(head, /^Pi Workbench\|/, 'the undo is a harness commit: ' + head);
  await page.locator('.pw-done').filter({ hasText: 'Undone' }).last().getByRole('button', { name: 'Redo Request…', exact: true }).click();
  await page.locator('#alert-danger').click();
  await page.locator('.pw-done').filter({ hasText: 'Redone' }).last().waitFor();
  assert.ok(exists(root, 'counter.py'), 'Redo brings it back');
  assert.equal(t.bench.git(root, 'status', '--porcelain', '--', 'counter.py', 'tests').trim(), '', 'nothing of the request is left uncommitted');
});

story('US-051', 'undo after I edited the same file: Save Them, Then Undo keeps my edit as its own entry, and the overlap is explained', async t => {
  const { page } = t;
  const { root } = await newProject(t, 'Edited');
  await givenApprovedTasks(t, root, [COUNT]);
  const id = await say(t, 'Build the approved task. TEST_SCRIPT=build-counter'); await answered(t, id);
  const row = checkIn(t); await row.waitFor();
  fs.appendFileSync(join(root, 'counter.py'), '\n# my own note\n');
  await row.getByText('Undo This Task…', { exact: true }).click();
  await page.locator('#alert-message').filter({ hasText: /^Undo “/ }).waitFor(); await page.locator('#alert-danger').click();
  await page.locator('#alert-message').filter({ hasText: /can’t be undone yet/ }).waitFor();
  assert.match(await page.locator('#alert-dialog').textContent(), /counter\.py has changes that are not saved as a request.*Nothing was changed/s);
  await page.locator('#alert-danger').click();  // Save Them, Then Undo
  await page.locator('#alert-message').filter({ hasText: /can’t be undone by itself/ }).waitFor();
  assert.equal(await page.locator('#alert-default').textContent(), 'Ask Pi Instead', 'the way forward is the default');
  await page.locator('#alert-danger').click();  // Cancel
  assert.match(commits(t, root)[0], /\|Your edits · \d\d:\d\d$/, 'my edit is its own entry');
  assert.match(t.bench.read(root, 'counter.py'), /# my own note/, 'my edit is kept');
  assert.equal(t.bench.git(root, 'status', '--porcelain', '--', 'counter.py').trim(), '', 'the overlap left nothing half-done');
});

// -- Preview ------------------------------------------------------------------------------------------------------
story('US-060', 'preview a page Pi built, at phone and tablet sizes; Open on Phone says why it is off', async t => {
  const { page } = t;
  const { root } = await newProject(t, 'Greeting');
  await givenApprovedTasks(t, root, [{ title: 'Greeting page', files: ['index.html', 'tests/'], done_when: 'The page greets the visitor.' }]);
  const id = await say(t, 'Build the approved task. TEST_SCRIPT=build-site'); await answered(t, id);
  const row = checkIn(t); await row.waitFor();
  await row.getByText('Show in Preview', { exact: true }).click();
  const app = page.frameLocator('#preview-body iframe');
  await app.getByRole('heading', { name: 'Hello from Pi' }).waitFor({ timeout: 20000 });
  await page.locator('#preview-body').getByRole('radio', { name: 'Phone', exact: true }).click();
  await page.waitForFunction(() => Math.round(document.querySelector('#preview-body iframe').getBoundingClientRect().width) <= 390);
  await page.locator('#preview-body').getByRole('radio', { name: 'Tablet', exact: true }).click();
  assert.match(await page.locator('#preview-body .pw-preview__caption').textContent(), /768/);
  const status = await t.bench.api('/api/preview?project=' + await page.evaluate(() => location.pathname.split('/')[2]));
  assert.equal(status.state, 'running');
  const phone = await t.bench.api('/api/preview/phone', { project: await page.evaluate(() => location.pathname.split('/')[2]) });
  assert.match(phone.problem, /Phone access is off/);
});

// -- Theme panel (task 312) ----------------------------------------------------------------------------------------
/** The app in the Preview frame, once its page has the theme helper (the Preview's proxy adds it). */
async function appFrame(t) {
  const end = Date.now() + 30000;
  while (Date.now() < end) {
    const frame = t.page.frames().find(item => item !== t.page.mainFrame() && /^http:\/\/127\.0\.0\.1:\d+\//.test(item.url()));
    if (frame && await frame.evaluate(path => Boolean(document.querySelector(`script[src="${path}"]`)), '/__pi-workbench/theme.js').catch(() => false)) return frame;
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  const status = await t.bench.api('/api/preview?project=' + await t.page.evaluate(() => location.pathname.split('/')[2])).catch(error => error.message);
  throw new Error(`The Preview never showed the app with the theme helper: ${JSON.stringify(status)}; frames ${t.page.frames().map(item => item.url()).join(', ')}`);
}
const token = (frame, name) => frame.evaluate(name => getComputedStyle(document.documentElement).getPropertyValue(name).trim(), name);
async function tokenIs(t, name, value) {
  const end = Date.now() + 15000; let seen = '';
  while (Date.now() < end) { seen = await token(await appFrame(t), name).catch(() => ''); if (seen === value) return; await new Promise(resolve => setTimeout(resolve, 200)); }
  throw new Error(`${name} in the Preview is “${seen}”, not “${value}”`);
}

/** The App-with-no-server starter builds its styles with `uv tool run pytailwindcss` (a download, US-066): a stand-in uv
 * on the services' PATH copies Basecoat's tokens into static/app.css and lets the watch wait. */
async function standInUv(t) {
  fs.writeFileSync(join(t.directory, 'uv'), '#!/bin/sh\nfor arg in "$@"; do case "$arg" in --watch*) exec sleep 600;; esac; done\nmkdir -p static && cat vendor/basecoat/css/base/base.css > static/app.css\n', { mode: 0o755 });
  await t.bench.restart(); await t.reopen();
}
/** Ask for the panel in words; returns the panel the workbench answered with. */
async function askTheme(t, words, group = 'colours') {
  const { page } = t;
  await page.locator('#prompt:not([disabled])').waitFor();
  await page.locator('#prompt').fill(words);
  const answered = page.waitForResponse(response => response.url().endsWith('/api/jobs/create'));
  await page.locator('#send').click();
  assert.equal((await (await answered).json()).theme, group);
  return page.locator(`[data-theme-panel]`).last();
}

story('US-116', 'adjust the site’s colours: the panel opens without Pi, the picker restyles the Preview (Esc puts it back), Save Theme commits, Undo restores', async t => {
  await standInUv(t);
  const { page } = t;
  const { root } = await newProject(t, 'Colours', 'static');
  const original = t.bench.read(root, 'styles', 'input.css');
  // The first project with an app opens its Preview by itself (P_Answers); otherwise the person opens it.
  const opened = await page.waitForFunction(() => document.querySelector('#preview-toggle').getAttribute('aria-pressed') === 'true', null, { timeout: 3000 }).then(() => true, () => false);
  if (!opened) await page.locator('#preview-toggle').click();
  await tokenIs(t, '--primary', 'oklch(0.205 0 0)');
  const panel = await askTheme(t, 'I want to adjust the site’s colours');
  const primary = panel.locator('.pw-theme__row[data-token="primary"]'); await primary.waitFor();
  assert.equal((await t.bench.api('/api/workspace')).jobs.length, 0, 'Pi was not asked');
  assert.equal(decisions(t).at(-1).kind, 'theme_panel'); assert.equal(decisions(t).at(-1).who, 'code');
  assert.match(await page.locator('.pw-msg').last().locator('.pw-msg__label').textContent(), /Pi Workbench.*· no model/);
  assert.equal(await panel.locator('.pw-card__title').textContent(), 'Theme · Colours');
  assert.deepEqual(await panel.getByRole('tab').allTextContents(), ['Colours', 'Radius', 'Spacing', 'Chart', 'Fonts']);
  assert.match(await primary.locator('.pw-theme__name').textContent(), /^Primary\s*buttons and links$/);
  assert.match(await primary.locator('.pw-theme__val[data-mode="light"] .pw-contrast').textContent(), /^\d+\.\d : 1 · AA ✓$/);
  assert.equal(await primary.locator('.pw-theme__val[data-mode="light"] .pw-theme__hex').inputValue(), '#171717', 'Basecoat’s oklch shown as hex');
  assert.match(await panel.locator('.pw-theme__status').textContent(), /^No changes yet$/);
  assert.ok(await panel.getByRole('button', { name: 'Save Theme', exact: true }).isDisabled(), 'nothing to save yet');
  // The swatch opens the picker: a hex (and its oklch), and Esc puts the old value back.
  const swatch = primary.locator('.pw-theme__val[data-mode="light"] .pw-swatch');
  await swatch.click(); assert.equal(await swatch.getAttribute('aria-expanded'), 'true');
  const picker = page.locator('.pw-picker'); await picker.waitFor();
  assert.equal(await picker.locator('.pw-picker__title').textContent(), 'Primary · light');
  await picker.locator('.pw-theme__hex').fill('#ff0000'); await picker.locator('.pw-theme__hex').press('Enter');
  await tokenIs(t, '--primary', '#ff0000');
  assert.equal(await picker.locator('.pw-picker__oklch').textContent(), 'or oklch(0.628 0.258 29.2)');
  assert.ok(await page.locator('.pw-preview__note--theme').isVisible(), '◐ Showing the unsaved theme');
  await page.keyboard.press('Escape');
  await picker.waitFor({ state: 'detached' });
  await tokenIs(t, '--primary', 'oklch(0.205 0 0)');
  assert.ok(!(await page.locator('.pw-preview__note--theme').isVisible()), 'Esc put the old value back: nothing unsaved');
  // Dragging on the saturation field picks a colour the Preview follows; a click outside keeps it.
  await swatch.click(); await picker.waitFor();
  const field = await picker.locator('.pw-picker__field').boundingBox();
  await page.mouse.move(field.x + field.width * 0.9, field.y + field.height * 0.1); await page.mouse.down(); await page.mouse.move(field.x + field.width * 0.8, field.y + field.height * 0.2); await page.mouse.up();
  const dragged = await picker.locator('.pw-theme__hex').inputValue();
  assert.match(dragged, /^#[0-9a-f]{6}$/); assert.notEqual(dragged, '#171717');
  await tokenIs(t, '--primary', dragged);
  await panel.locator('.pw-card__title').click(); await picker.waitFor({ state: 'detached' });
  await tokenIs(t, '--primary', dragged);
  // The hex field takes a colour too; the foot counts what is not saved.
  await primary.locator('.pw-theme__val[data-mode="light"] .pw-theme__hex').fill('#ff0000'); await primary.locator('.pw-theme__val[data-mode="light"] .pw-theme__hex').press('Enter');
  await tokenIs(t, '--primary', '#ff0000');
  assert.equal(await panel.locator('.pw-theme__status').textContent(), '1 change not saved: Primary · the Preview shows it now');
  assert.equal(t.bench.read(root, 'styles', 'input.css'), original, 'nothing is written before Save');
  await panel.getByRole('button', { name: 'Save Theme', exact: true }).click();
  const saved = page.locator('.pw-theme-saved', { hasText: 'Theme saved: primary' }); await saved.waitFor();
  assert.match(await saved.textContent(), /· styles\/input\.css · \d\d:\d\d/);
  await panel.locator('.pw-card__line', { hasText: 'saved' }).waitFor();
  assert.match(commits(t, root)[0], /\|Theme: primary$/, 'the person’s own commit');
  assert.match(t.bench.read(root, 'styles', 'input.css'), /\/\* theme: edited in the workbench \*\/\n:root \{\n {2}--primary: #ff0000;\n\}/);
  await tokenIs(t, '--primary', '#ff0000');
  // Undo, in the theme's words.
  await saved.getByRole('button', { name: 'Undo', exact: true }).click();
  await page.locator('#alert-message').filter({ hasText: 'Undo the theme save?' }).waitFor();
  assert.match(await page.locator('#alert-detail').textContent(), /^Primary goes back to how it was before this save/);
  await page.locator('#alert-danger').click();
  await page.waitForFunction(() => [...document.querySelectorAll('.pw-done__head')].some(head => /Undone/.test(head.textContent)));
  assert.equal(t.bench.read(root, 'styles', 'input.css'), original, 'Undo restores the file');
  await tokenIs(t, '--primary', 'oklch(0.205 0 0)');
});

story('US-117', 'ask in Japanese: サイトの色を調整したい opens the panel; Project › Theme… and ⌃⌥K too; a project without the starter’s CSS says so', async t => {
  const { page } = t;
  await newProject(t, 'Plain');
  const panel = await askTheme(t, 'サイトの色を調整したい');
  await page.locator('.pw-theme-none', { hasText: 'This project has no theme file' }).waitFor();
  assert.match(await panel.textContent(), /Projects made from the web app and no-server starters have one\./);
  assert.equal((await t.bench.api('/api/workspace')).jobs.length, 0, 'Pi was not asked');
  await page.locator('[aria-controls="menu-project"]').click();
  assert.equal(await page.locator('#menu-project [data-command="theme"] .pw-menu__key').textContent(), '⌃⌥K');
  await page.locator('#menu-project [data-command="theme"]').click();
  await page.waitForFunction(() => document.querySelectorAll('[data-theme-panel]').length === 2);
  await page.locator('#prompt').click(); await page.keyboard.press('Control+Alt+KeyK');
  await page.waitForFunction(() => document.querySelectorAll('[data-theme-panel]').length === 3);
  for (const route of ['/api/theme/save', '/api/theme/add'])
    assert.equal((await fetch(t.base + route, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ project: 'x' }) })).status, 403, `${route} is the person’s control only`);
});

story('US-118', 'the theme panel in the chat: five colours and “▸ 3 more”, the tabs switch groups, and the radius slider shows its samples', async t => {
  const { page } = t;
  await newProject(t, 'Rows', 'static');
  const panel = await askTheme(t, 'I want to adjust the colours');
  await panel.locator('.pw-theme__row[data-token="primary"]').waitFor();
  const visible = async () => (await panel.locator('.pw-theme__row:not(.pw-theme__row--head)').evaluateAll(rows => rows.filter(row => row.offsetParent).map(row => row.dataset.token)));
  assert.deepEqual(await visible(), ['primary', 'secondary', 'accent', 'muted', 'destructive']);
  const more = panel.getByRole('button', { name: '▸ 3 more: Background, Card, Border · Input · Ring', exact: true });
  await more.click();
  assert.deepEqual(await visible(), ['primary', 'secondary', 'accent', 'muted', 'destructive', 'background', 'card', 'border']);
  assert.equal(await more.count(), 0);
  // Card edits the popover too; Border · Input · Ring edits border and input, the ring from the picker.
  await panel.locator('.pw-theme__row[data-token="card"] .pw-theme__val[data-mode="dark"] .pw-theme__hex').fill('#111827');
  await panel.locator('.pw-theme__row[data-token="card"] .pw-theme__val[data-mode="dark"] .pw-theme__hex').press('Enter');
  assert.equal(await panel.locator('.pw-theme__status').textContent(), '1 change not saved: Card · the Preview shows it now');
  assert.equal(await panel.locator('.pw-theme__row[data-token="card"] .pw-theme__reset').isDisabled(), false);
  await panel.getByRole('tab', { name: 'Radius', exact: true }).click();
  assert.equal(await panel.locator('.pw-card__title').textContent(), 'Theme · Radius');
  assert.equal(await panel.locator('.pw-slider label').textContent(), 'Radius: corners of buttons, cards and fields');
  assert.equal(await panel.locator('.pw-slider .pw-theme__reset').textContent(), 'Reset (10 px)');
  await panel.locator('.pw-slider input[type=range]').fill('16');
  assert.equal(await panel.locator('.pw-slider .pw-theme__value').textContent(), '1.000rem · 16 px');
  assert.deepEqual(await panel.locator('.pw-samples .pw-sample').allTextContents(), ['Button · sm 12 px', 'Button · md 14 px', 'Card · lg 16 px', 'Dialog · xl 20 px', 'Field · md']);
  assert.equal(await panel.locator('.pw-theme__status').textContent(), '2 changes not saved: Card, Radius 16 px · the Preview shows it now', 'unsaved changes stay across groups');
  await panel.getByRole('tab', { name: 'Spacing', exact: true }).click();
  assert.deepEqual(await panel.locator('.pw-slider input[type=range]').evaluate(input => [input.min, input.max, input.step]), ['3', '6', '0.5']);
  await panel.getByRole('tab', { name: 'Chart', exact: true }).click();
  assert.equal(await panel.locator('.pw-theme__row--chart').count(), 5);
  assert.match(await panel.locator('.pw-theme__warn').textContent(), /Hard to tell apart: .*Chart 3 and Chart 4/, 'Basecoat’s five blues are close');
  await panel.getByRole('button', { name: 'Discard', exact: true }).click();
  assert.equal(await panel.locator('.pw-theme__status').textContent(), 'No changes yet');
});

story('US-119', 'leaving with unsaved theme changes asks “Save the theme changes before going on?”: Cancel stays, Don’t Save drops them, Save saves', async t => {
  const { page } = t;
  const { root } = await newProject(t, 'Leaving', 'static');
  const panel = await askTheme(t, 'Can I change the radius?', 'radius');
  await panel.locator('.pw-slider input[type=range]').waitFor();
  await panel.locator('.pw-slider input[type=range]').fill('16');
  const dialog = page.locator('#theme-leave-dialog');
  await page.locator('#prompt').fill('Make the buttons blue'); await page.locator('#send').click();
  await dialog.waitFor();
  assert.equal(await dialog.locator('.pw-alert__message').textContent(), 'Save the theme changes before going on?');
  assert.equal(await dialog.locator('.pw-alert__detail').textContent(), 'Radius 16 px is changed in the Preview only. If you don’t save, the Preview goes back to the saved theme.');
  assert.deepEqual(await dialog.locator('.pw-dialog__actions .pw-btn').allTextContents(), ['Don’t Save', 'Cancel', 'Save']);
  assert.match(await dialog.locator('.pw-btn--default').textContent(), /^Save$/, 'Save is the default');
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click(); await dialog.waitFor({ state: 'hidden' });
  assert.equal(await page.locator('#prompt').inputValue(), 'Make the buttons blue', 'nothing was sent');
  assert.equal((await t.bench.api('/api/workspace')).jobs.length, 0);
  assert.match(await panel.locator('.pw-theme__status').textContent(), /^1 change not saved/);
  // Save: the theme is saved as its own change, then the message goes.
  await page.locator('#send').click(); await dialog.waitFor();
  const queued = page.waitForResponse(response => response.url().endsWith('/api/jobs/create'));
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await queued;
  assert.match(commits(t, root)[0], /\|Theme: radius$/);
  await page.locator('.pw-theme-saved', { hasText: 'Theme saved: radius' }).waitFor();
  // Don’t Save: the change goes, the message goes.
  const again = await (async () => { await page.locator('[aria-controls="menu-project"]').click(); await page.locator('#menu-project [data-command="theme"]').click(); return page.locator('[data-theme-panel]').last(); })();
  await again.locator('.pw-theme__row[data-token="primary"] .pw-theme__val[data-mode="light"] .pw-theme__hex').fill('#00ff00');
  await again.locator('.pw-theme__row[data-token="primary"] .pw-theme__val[data-mode="light"] .pw-theme__hex').press('Enter');
  await page.locator('#prompt').fill('Thanks'); await page.locator('#send').click(); await dialog.waitFor();
  const sent = page.waitForResponse(response => response.url().endsWith('/api/jobs/create'));
  await dialog.getByRole('button', { name: 'Don’t Save', exact: true }).click(); await sent;
  assert.match(commits(t, root)[0], /\|Theme: radius$/, 'nothing more was saved');
  assert.equal(await again.locator('.pw-theme__status').textContent(), 'No changes yet');
});

story('US-120', 'a project with no theme file: Add a Theme File adds Basecoat’s defaults as one change, and the panel opens', async t => {
  const { page } = t;
  const { root } = await newProject(t, 'No theme yet');
  const card = await askTheme(t, 'I want to adjust the site’s colours');
  await card.getByRole('button', { name: 'Add a Theme File', exact: true }).click();
  await card.locator('.pw-theme__row[data-token="primary"]').waitFor();
  assert.equal(await card.locator('.pw-card__title').textContent(), 'Theme · Colours');
  assert.match(t.bench.read(root, 'styles', 'input.css'), /^@import "tailwindcss";\n@import "\.\.\/vendor\/basecoat\/css\/basecoat\.css";\n$/);
  assert.ok(exists(root, 'vendor', 'basecoat', 'css', 'basecoat.css'));
  assert.match(commits(t, root)[0], /\|Theme: added the theme file$/, 'one change of the person’s');
  const line = page.locator('.pw-theme-saved', { hasText: 'Theme file added' }); await line.waitFor();
  assert.equal(await line.getByRole('button', { name: 'Undo', exact: true }).count(), 1);
});

story('US-121', 'on a phone (390 px): the theme panel opens full screen with the live app on top; a row opens the picker page; Close asks before dropping changes', async t => {
  await standInUv(t);
  const { page } = t;
  await newProject(t, 'Pocket theme', 'static');
  // The Preview is closed: the full-screen panel shows the app itself (“the Preview tab isn't needed”).
  const opened = await page.waitForFunction(() => document.querySelector('#preview-toggle').getAttribute('aria-pressed') === 'true', null, { timeout: 3000 }).then(() => true, () => false);
  if (opened) await page.locator('#preview-toggle').click();
  await page.setViewportSize({ width: 390, height: 844 }); await page.reload();
  const panel = await askTheme(t, 'I want to adjust the site’s colours');
  await page.waitForFunction(() => document.querySelector('[data-theme-panel][data-screen]'));
  const box = await panel.boundingBox();
  assert.deepEqual([box.x, box.y, box.width, box.height].map(Math.round), [0, 0, 390, 844], 'full screen');
  assert.equal(await panel.locator('.pw-theme__bar-title').textContent(), 'Theme');
  const live = page.frameLocator('[data-theme-panel] .pw-theme__live iframe');
  await panel.locator('.pw-theme__live iframe').waitFor({ timeout: 20000 });
  assert.equal(await panel.locator('.pw-theme__tag').textContent(), 'Live');
  const row = panel.locator('.pw-theme__row[data-token="primary"]');
  assert.ok(Math.round((await row.boundingBox()).height) >= 56, '56 px rows');
  const swatch = await row.locator('.pw-theme__val[data-mode="light"] .pw-swatch').boundingBox();
  assert.deepEqual([Math.round(swatch.width), Math.round(swatch.height)], [32, 32], '32 px swatches');
  assert.equal(await row.locator('.pw-theme__val[data-mode="dark"]').isVisible(), false, 'one side at a time');
  await row.locator('.pw-theme__name').click();
  await page.waitForFunction(() => document.querySelector('[data-theme-panel][data-picking] .pw-picker'));
  assert.equal(await panel.locator('.pw-picker__title').textContent(), 'Primary · light');
  assert.equal(await panel.locator('.pw-theme__rows, .pw-card__body').first().isVisible(), false, 'the picker is its own page');
  await panel.locator('.pw-picker .pw-theme__hex').fill('#ff0000'); await panel.locator('.pw-picker .pw-theme__hex').press('Enter');
  assert.equal(await panel.locator('.pw-theme__tag').textContent(), 'Live · unsaved');
  const end = Date.now() + 15000; let seen = '';
  while (Date.now() < end && seen !== '#ff0000') { seen = await live.locator('html').evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()).catch(() => ''); if (seen !== '#ff0000') await new Promise(resolve => setTimeout(resolve, 200)); }
  assert.equal(seen, '#ff0000', 'the live app on top follows the picker');
  await panel.getByRole('button', { name: 'Done', exact: true }).click();
  await row.waitFor();
  await panel.getByRole('button', { name: 'Close', exact: true }).click();
  const dialog = page.locator('#theme-leave-dialog'); await dialog.waitFor();
  await dialog.getByRole('button', { name: 'Don’t Save', exact: true }).click();
  await page.waitForFunction(() => !document.querySelector('[data-theme-panel][data-screen]'));
  await panel.getByRole('button', { name: 'Open Theme', exact: true }).waitFor();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'no sideways scroll');
});

story('US-142', 'filtered capability selection preserves keyboard focus and search results', async t => {
  const {page}=t; await startProject(t,'Keyboard');await page.locator('#start-next').click();await step(t,'Capabilities');
  const search=page.getByRole('searchbox',{name:'Find a capability'});await search.fill('QR');
  const chosen=page.locator('#start-body .pw-cap[data-id="qrcode"] input');await chosen.focus();await page.keyboard.press('Space');
  assert.equal(await chosen.isChecked(),true);
  assert.equal(await page.locator('#start-body .pw-cap:visible').count(),1);
  assert.equal(await search.inputValue(),'QR');assert.equal(await chosen.evaluate(input=>input===document.activeElement),true);
  await page.keyboard.press('Space');assert.equal(await chosen.isChecked(),false);
});

// -- Recovery -----------------------------------------------------------------------------------------------------
story('US-070', 'Pi crashes mid-request: Activity keeps the failure and why, and Ask Pi to Retry… queues it again', async t => {
  const { page } = t;
  await newProject(t, 'Crashy');
  const id = await say(t, 'Do the thing TEST_SCRIPT=crash-midway');
  assert.equal((await answered(t, id)).status, 'failed');
  await page.goto(t.base + '/activity');
  const failed = page.locator('.activity-task').filter({ hasText: 'Do the thing' }).first();
  await failed.locator('.task-state').filter({ hasText: 'Failed' }).waitFor();
  await failed.locator('.activity-request').click();
  assert.match(await page.locator('#activity-detail').textContent(), /Pi exited unexpectedly: Model crashed: out of memory/);
  await page.locator('#activity-detail').getByRole('button', { name: 'Ask Pi to Retry…', exact: true }).click();
  await page.locator('#retry-dialog').getByRole('button', { name: 'Queue Again', exact: true }).click();
  await page.locator('#toast-text').filter({ hasText: /^Queued again in / }).waitFor();
  assert.equal((await t.bench.api('/api/workspace')).jobs.filter(item => item.retry_of === id).length, 1);
});

story('US-075', 'Pi crashes mid-request: the chat itself says the request failed and how to retry', async t => {
  const { page } = t;
  await newProject(t, 'Crash in chat');
  const id = await say(t, 'Do the thing TEST_SCRIPT=crash-midway'); await answered(t, id);
  await page.reload();
  const answer = page.locator('#messages .pw-msg').filter({ has: page.locator('.pw-cut[role="status"]') }).last();  // round 12: the CutLine
  await answer.locator('.pw-cut[role="status"] .pw-cut__text').filter({ hasText: 'Failed before Pi finished: Pi exited unexpectedly: Model crashed: out of memory' }).waitFor({ timeout: 5000 });
  assert.equal(await answer.locator('.pw-cut').getByRole('button', { name: 'Retry', exact: true }).getAttribute('class'), 'pw-btn pw-btn--default', 'Retry is the default');
  assert.equal(await answer.locator('.pw-cut').getByRole('button', { name: 'Undo This Request…', exact: true }).count(), 0, 'Undo only when files changed');
  const again = page.waitForResponse(response => /\/api\/jobs\/[0-9a-f]{32}\/retry$/.test(response.url()));
  await answer.locator('.pw-cut').getByRole('button', { name: 'Retry', exact: true }).click();
  const retried = await (await again).json();
  assert.equal(retried.retry_of, id, 'Retry queues the same request again');
  assert.equal((await answered(t, retried.id)).message, 'Do the thing TEST_SCRIPT=crash-midway');
  // What a crashed request changed is committed (not verified) by Gate; Undo This Request… under the line takes it back.
  const { root } = await newProject(t, 'Crash after a write');
  await givenApprovedTasks(t, root, [COUNT]);
  await answered(t, await say(t, 'Build the approved task. TEST_SCRIPT=write-then-crash'));
  assert.ok(exists(root, 'counter.py'));
  const cut = page.locator('#messages .pw-msg').filter({ has: page.locator('.pw-cut[role="status"]') }).last(); await cut.waitFor();
  await cut.locator('.pw-cut').getByRole('button', { name: 'Undo This Request…', exact: true }).click();
  await page.locator('#alert-message').filter({ hasText: /^Undo “/ }).waitFor(); await page.locator('#alert-danger').click();
  await page.locator('.pw-done').filter({ hasText: 'Undone' }).last().waitFor();
  assert.equal(exists(root, 'counter.py'), false, 'the crashed request’s file is gone');
});

story('US-071', 'plh crashes while Pi works: after a restart the request is Interrupted, never repeated, and the chat goes on', async t => {
  let { page } = t;
  await newProject(t, 'Interrupted');
  const id = await say(t, 'A long job TEST_WAIT');
  await t.bench.job(id, ['running']);
  await t.bench.stop('SIGKILL'); await t.bench.start(); page = await t.reopen();  // the fake Pi it started ends by itself (TEST_WAIT sleeps 60 s)
  const job = await t.bench.job(id, ['interrupted', 'failed', 'stopped', 'completed']);
  assert.equal(job.status, 'interrupted');
  await page.goto(t.base + '/activity');
  await page.locator('.activity-task').filter({ hasText: 'A long job' }).locator('.task-state').filter({ hasText: 'Interrupted' }).waitFor();
  assert.equal((await t.bench.api('/api/workspace')).jobs.filter(item => item.status === 'running' || item.status === 'queued').length, 0, 'not repeated');
  await page.goto(t.base + '/projects'); await page.locator('#project-list .pw-row', { hasText: 'Interrupted' }).click();
  const next = await say(t, 'Hello again'); assert.equal((await answered(t, next)).status, 'completed');
});

story('US-072', 'a looping answer is recovered once: the person sees one clean answer', async t => {
  const { page } = t;
  await newProject(t, 'Loopy');
  const id = await say(t, 'Explain it TEST_RECOVER');
  assert.equal((await answered(t, id)).status, 'completed');
  await page.locator('#messages').getByText('recovered answer', { exact: true }).waitFor();
  assert.equal(await page.locator('#messages').getByText('recovered answer', { exact: true }).count(), 1);
});

story('US-073', 'reload the page while Pi is thinking: the answer still arrives in the same chat', async t => {
  const { page } = t;
  await newProject(t, 'Patient');
  const id = await say(t, 'Think it through TEST_THINK');
  await t.bench.job(id, ['running']);
  await page.reload();
  await page.locator('#messages').getByText(/^reply \d+$/).waitFor({ timeout: 30000 });
  assert.equal((await answered(t, id)).status, 'completed');
});

story('US-074', 'Gate refuses an unknown command during a request and logs why, with its rule', async t => {
  const { page } = t;
  await newProject(t, 'Unknown');
  const id = await say(t, 'Run it TEST_SCRIPT=unknown-command'); await answered(t, id);
  await page.goto(t.base + '/gate');
  const row = page.locator('#gate-events .gate-event').filter({ hasText: 'frobnicate' }).first();
  await row.waitFor({ timeout: 5000 });
  assert.match(await row.textContent(), /Blocked|Revise|Not/i);
  assert.doesNotMatch(await page.locator('#messages, #gate-events').first().textContent(), /G-011/);
});

story('US-084', 'long work that keeps reporting is never cut off; only silence stops a request', async t => {
  await t.bench.restart({ PI_HARNESS_SILENCE_SECONDS: '2' }); const page = await t.reopen();  // two seconds instead of an hour, for this scratch workbench only
  await newProject(t, 'Long work');
  const busy = await say(t, 'Keep going TEST_TICK');
  assert.equal((await answered(t, busy)).status, 'completed', 'three seconds of steady progress, past a two-second limit');
  const silent = await say(t, 'Go quiet TEST_WAIT');
  const job = await answered(t, silent);
  assert.equal(job.status, 'failed'); assert.match(job.progress || '', /Pi sent nothing for/);
  await page.goto(t.base + '/activity');
  await page.locator('.activity-task').filter({ hasText: 'Go quiet' }).locator('.task-state').filter({ hasText: 'Failed' }).waitFor();
});

// -- Privacy and person-only controls -------------------------------------------------------------------------------
story('US-080', 'secrets in the project never go into what Pi sees', async t => {
  const { page } = t;
  const { root } = await newProject(t, 'Secretive');
  fs.writeFileSync(join(root, '.env'), 'API_KEY=very-secret-value\n'); fs.mkdirSync(join(root, 'secrets')); fs.writeFileSync(join(root, 'secrets', 'id_rsa'), 'PRIVATE KEY\n');
  fs.writeFileSync(join(root, '.gitignore'), '.env\nsecrets/\n');
  const project = await page.evaluate(() => location.pathname.split('/')[2]);
  const preview = await t.bench.api('/api/context-preview?project=' + project + '&text=' + encodeURIComponent('Check the .env and secrets/id_rsa settings'));
  const files = JSON.stringify(preview);
  assert.doesNotMatch(files, /\.env|id_rsa/, 'Pi sees: ' + files.slice(0, 400));
});

story('US-081', 'only the person can change the phase: a local process without the page cannot', async t => {
  const { page } = t;
  await newProject(t, 'Guarded');
  const project = await page.evaluate(() => location.pathname.split('/')[2]);
  const response = await fetch(t.base + '/api/phase', { method: 'POST', headers: { 'Content-Type': 'application/json', Host: new URL(t.base).host }, body: JSON.stringify({ project, phase: 'planning' }) });
  assert.equal(response.status, 403, 'a script on this Mac changed the phase as “the person”');
});

// -- Security hardening (tasks 304, 305, 311) ----------------------------------------------------------------------
story('US-140', 'a test that writes outside its project is stopped by the sandbox; the notice says how I widen it, and Project › Test Sandbox… changes it only when I choose', async t => {
  const { page } = t;
  const { root } = await newProject(t, 'Boxed');
  const project = await page.evaluate(() => location.pathname.split('/')[2]);
  const before = await t.bench.api('/api/project-sandbox?project=' + project);
  assert.equal(before.network, 'none', 'no network by default');
  if (before.available) {
    await givenApprovedTasks(t, root, [{ title: 'Escape test', files: ['tests/'], done_when: 'The test runs.' }]);
    const id = await say(t, 'Build the approved task. TEST_SCRIPT=build-escape'); await answered(t, id);
    assert.equal(fs.existsSync(join(root, '..', 'escaped.txt')), false, 'the test could not write outside the project');
    await page.reload();
    const notice = page.locator('#messages .pw-notice[role="note"]').filter({ hasText: 'Test Sandbox' }).last(); await notice.waitFor();
    assert.match(await notice.textContent(), /may write only in the project, a temporary folder/);
  }
  await page.locator('[aria-controls="menu-project"]').click(); await page.locator('#menu-project [data-command="test-sandbox"]').click();
  await page.locator('#alert-message').filter({ hasText: 'Test Sandbox' }).waitFor();
  const group = page.locator('#sandbox-network');
  assert.equal(await group.getByLabel('No network (recommended)').isChecked(), true);
  assert.equal(await page.locator('#alert-default').textContent(), 'Cancel', 'the safe button is the default');
  await group.getByLabel('This computer only (localhost)').check();
  await page.locator('#alert-default').click();
  assert.equal((await t.bench.api('/api/project-sandbox?project=' + project)).network, 'none', 'Cancel changes nothing');
  await page.locator('[aria-controls="menu-project"]').click(); await page.locator('#menu-project [data-command="test-sandbox"]').click();
  await group.getByLabel('This computer only (localhost)').check();
  await page.locator('#alert-danger').click();
  await page.waitForFunction(project => fetch('/api/project-sandbox?project=' + project).then(r => r.json()).then(d => d.network === 'local'), project);
  const refused = await fetch(t.base + '/api/projects/sandbox', { method: 'POST', headers: { 'Content-Type': 'application/json', Host: new URL(t.base).host }, body: JSON.stringify({ project, network: 'internet' }) });
  assert.equal(refused.status, 403, 'a local process without the page cannot widen it');
});

story('US-141', 'the Preview serves only the project: no .env, no foreign Host, the app in a sandboxed frame; the workbench cannot be framed', async t => {
  const { page } = t;
  const { root } = await newProject(t, 'Hidden');
  fs.writeFileSync(join(root, '.env'), 'API_KEY=very-secret-value\n');
  await givenApprovedTasks(t, root, [{ title: 'Greeting page', files: ['index.html', 'tests/'], done_when: 'The page greets the visitor.' }]);
  const id = await say(t, 'Build the approved task. TEST_SCRIPT=build-site'); await answered(t, id);
  const row = checkIn(t); await row.waitFor();
  await row.getByText('Show in Preview', { exact: true }).click();
  await page.frameLocator('#preview-body iframe').getByRole('heading', { name: 'Hello from Pi' }).waitFor({ timeout: 20000 });
  const sandbox = await page.locator('#preview-body iframe').getAttribute('sandbox');
  assert.match(sandbox, /allow-scripts/); assert.doesNotMatch(sandbox, /allow-top-navigation/, 'the app cannot navigate the workbench away');
  const status = await t.bench.api('/api/preview?project=' + await page.evaluate(() => location.pathname.split('/')[2]));
  const secret = await fetch(new URL('/.env', status.url)); assert.equal(secret.status, 404, '.env is never served');
  assert.doesNotMatch(await secret.text(), /very-secret-value/);
  assert.equal((await fetch(new URL('/.git/config', status.url))).status, 404, '.git is never served');
  const rebound = await new Promise((resolve, reject) => require('node:http').get(status.url, { headers: { Host: 'evil.example' } }, response => { response.resume(); resolve(response.statusCode); }).on('error', reject));  /* fetch drops a Host header */
  assert.equal(rebound, 403, 'a foreign Host (DNS rebinding) is refused');
  const page_ = await fetch(t.base + '/'); assert.equal(page_.headers.get('x-frame-options'), 'DENY'); assert.match(page_.headers.get('content-security-policy'), /frame-ancestors 'none'/);
});

// -- Round 12: check-ins, what you grant, renames, the hunt's fixes ----------------------------------------------
/** Wait until a condition on disk holds (the request that follows an answer runs on its own). */
async function until(check, what, timeout = 15000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) { if (check()) return; await new Promise(resolve => setTimeout(resolve, 100)); }
  throw new Error('Timed out: ' + what);
}

story('US-126', 'an unverified task: Retry Task is the default; Accept Anyway… asks first, then ROADMAP.md says “accepted without verification”', async t => {
  const { page } = t;
  const { root } = await newProject(t, 'Unverified');
  await givenApprovedTasks(t, root, [COUNT, RESET]);
  const id = await say(t, 'Build the approved task. TEST_SCRIPT=build-untested'); await answered(t, id);
  const check = checkIn(t); await check.waitFor();
  assert.equal(await check.locator('.pw-card__title').textContent(), 'Task 1 of 2 not verified: Count clicks');
  assert.deepEqual(await check.locator('.pw-card__foot .pw-btn').allTextContents(), ['Retry Task', 'Review First', 'Accept Anyway…', 'Stop Here']);
  assert.equal(await check.locator('.pw-btn--default').textContent(), 'Retry Task');
  assert.match(await check.locator('.pw-facts').textContent(), /Retry Task runs task 1 again from its steps/);
  await check.getByRole('button', { name: 'Accept Anyway…', exact: true }).click();
  await page.locator('#alert-dialog[open]').waitFor();
  assert.equal(await page.locator('#alert-message').textContent(), 'Accept task 1 without a passing test?');
  assert.equal(await page.locator('#alert-default').textContent(), 'Cancel', 'Cancel is the default');
  await page.keyboard.press('Escape'); await page.locator('#alert-dialog[open]').waitFor({ state: 'detached' });
  assert.doesNotMatch(t.bench.read(root, 'ROADMAP.md'), /accepted without verification/, 'Cancel changed nothing');
  await check.getByRole('button', { name: 'Accept Anyway…', exact: true }).click();
  await page.locator('#alert-danger').click();
  const task = fs.readdirSync(join(root, 'tasks')).find(name => /count-clicks/.test(name));
  await until(() => new RegExp(`- \\[x\\] \\[\\d+-Count clicks\\]\\(tasks/${task}\\) \\(accepted without verification\\)`).test(t.bench.read(root, 'ROADMAP.md')), 'the labelled roadmap line');
  assert.ok(commits(t, root).some(line => /^Pi Workbench\|Count clicks \(task \d+, accepted without verification\)$/.test(line)), 'a harness commit records it');
  assert.ok(decisions(t).some(row => row.kind === 'task_acceptance' && row.answer === 'accept_anyway' && row.who === 'person'));
});

story('US-127', 'reopen a done task from Work: it asks first, then the boxes and the roadmap line open again and the code stays', async t => {
  const { page } = t;
  const { root, project } = await newProject(t, 'Reopen');
  await givenApprovedTasks(t, root, [COUNT]);
  const id = await say(t, 'Build the approved task. TEST_SCRIPT=build-counter'); await answered(t, id);
  await checkIn(t).waitFor();
  const task = fs.readdirSync(join(root, 'tasks')).find(name => /count-clicks/.test(name));
  await page.goto(`${t.base}/p/${project}/work/tasks/${task}`);
  const bar = page.locator('#task-infobar'); await bar.getByRole('button', { name: 'Reopen Task…', exact: true }).waitFor();
  assert.match(await bar.textContent(), /Done/);
  await bar.getByRole('button', { name: 'Reopen Task…', exact: true }).click();
  await page.locator('#alert-dialog[open]').waitFor();
  assert.equal(await page.locator('#alert-message').textContent(), 'Reopen “Count clicks”?');
  assert.match(await page.locator('#alert-detail').textContent(), /^Its 2 boxes are unchecked and its ROADMAP\.md line goes back to open\./);
  assert.equal(await page.locator('#alert-default').textContent(), 'Cancel');
  await page.locator('#alert-danger').click();
  await page.locator('#toast-text').filter({ hasText: 'Reopened “Count clicks”.' }).waitFor();
  assert.match(t.bench.read(root, 'ROADMAP.md'), new RegExp(`- \\[ \\] \\[\\d+-Count clicks\\]\\(tasks/${task}\\)`));
  assert.doesNotMatch(t.bench.read(root, 'tasks', task).split('## Progress')[0], /- \[x\]/, 'its boxes are open');
  assert.ok(exists(root, 'counter.py'), 'the code stays');
  await bar.waitFor({ state: 'hidden' });
});

story('US-128', 'Pi needs a file outside the task: Gate asks me, Add to Task 1 writes it into the task’s Files and the build goes on', async t => {
  const { page } = t;
  const { root } = await newProject(t, 'Widen');
  await givenApprovedTasks(t, root, [COUNT]);
  const id = await say(t, 'Build the approved task. TEST_SCRIPT=build-outside'); await answered(t, id);
  const card = page.locator('.pw-card[aria-label="Pi wants to change a file outside task 1"]'); await card.waitFor();
  assert.match(await card.locator('.pw-card__head').textContent(), /Gate asks you/);
  assert.match(await card.textContent(), /notes\/extra\.py/);
  assert.deepEqual(await card.locator('.pw-card__foot .pw-btn').allTextContents(), ['Add to Task 1', 'Keep Out', 'Open the Task']);
  assert.equal(await card.locator('.pw-btn--default').textContent(), 'Add to Task 1');
  assert.ok(!exists(root, 'notes', 'extra.py'), 'nothing was written before the answer');
  const resumed = page.waitForResponse(response => response.url().endsWith('/api/choices/answer'));
  await card.getByRole('button', { name: 'Add to Task 1', exact: true }).click();
  await answered(t, (await (await resumed).json()).job);
  const task = fs.readdirSync(join(root, 'tasks')).find(name => /count-clicks/.test(name));
  assert.match(t.bench.read(root, 'tasks', task), /^Files: counter\.py, tests\/, notes\/extra\.py$/m);
  const check = checkIn(t); await check.waitFor();
  assert.doesNotMatch(await check.textContent(), /not verified/, 'the check-in: ' + await check.textContent());
  assert.equal(t.bench.git(root, 'status', '--porcelain', '--', 'notes').trim(), '', 'notes/extra.py is committed with the task');
  assert.ok(decisions(t).some(row => row.kind === 'scope_widening' && row.answer === 'Add to Task 1' && row.who === 'person'));
});

story('US-129', 'a choice after plh restarted: the card says the page is out of date and Reload Page fixes it; nothing was sent', async t => {
  const { page } = t;
  const { root } = await newProject(t, 'Stale');
  await givenApprovedTasks(t, root, [COUNT]);
  const id = await say(t, 'Build the approved task. TEST_SCRIPT=build-untested'); await answered(t, id);
  const check = checkIn(t); await check.waitFor();
  await page.evaluate(() => { document.querySelector('meta[name="pi-person"]').content = 'from-before-the-restart'; });
  await check.getByRole('button', { name: 'Retry Task', exact: true }).click();
  const line = check.locator('.pw-alert-line[role="alert"]'); await line.waitFor();
  assert.match(await line.textContent(), /^This page is out of date after plh restarted, so your choice wasn’t sent\. Reload the page, then choose again\./);
  assert.equal(await line.locator('.pw-btn--default').textContent(), 'Reload Page');
  assert.equal(await page.locator('#error').isVisible(), false, 'never the generic error line');
  await line.getByRole('button', { name: 'Reload Page', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('meta[name="pi-person"]').content !== 'from-before-the-restart');
  const again = checkIn(t); await again.waitFor();
  assert.equal(await again.locator('.pw-btn--default').textContent(), 'Retry Task', 'the check-in still waits');
});

story('US-130', 'rename a project while terminal Pi works: its own alert, Show in Activity · OK, and nothing moves', async t => {
  const { page } = t;
  const made = await newProject(t, 'Class Notes');
  fs.writeFileSync(join(t.bench.data, '.agent-lock'), JSON.stringify({ pid: process.pid, token: 'terminal' }));
  try {
    await page.locator('#menubar [aria-controls="menu-project"]').click(); await page.locator('#menu-project [data-command="rename-project"]').click();
    await page.locator('#name-dialog-input').fill('Class Notes 2'); await page.locator('#name-dialog-ok').click();
    await page.locator('#alert-dialog[open]').waitFor();
    assert.equal(await page.locator('#alert-message').textContent(), 'Can’t rename “Class Notes” while terminal Pi works in it.');
    assert.match(await page.locator('#alert-detail').textContent(), /^plh in a terminal is using this folder \(a request started at \d\d:\d\d\)\. .*Nothing was changed\.$/);
    assert.deepEqual([await page.locator('#alert-danger').textContent(), await page.locator('#alert-default').textContent()], ['Show in Activity', 'OK']);
    assert.equal(await page.locator('#name-dialog').evaluate(dialog => dialog.open), false, 'the name dialog closed: the alert stands alone');
    await page.locator('#alert-danger').click();
    await page.waitForFunction(() => document.body.dataset.view === 'activity');
    assert.ok(exists(made.root, 'ROADMAP.md') && !exists(t.directory, 'Class Notes 2'), 'nothing moved');
  } finally { fs.rmSync(join(t.bench.data, '.agent-lock'), { force: true }); }
});

story('US-131', 'a task line in ROADMAP.md is a link in Work: a click opens the task file', async t => {
  const { page } = t;
  const { project } = await newProject(t, 'Linked');
  await page.goto(`${t.base}/p/${project}/work/ROADMAP.md`);
  const link = page.locator('#document-editor a.pw-link', { hasText: '001-Plan this app' }); await link.waitFor();
  assert.equal(await link.getAttribute('href'), `/p/${project}/work/tasks/001-first-task.md`, '⌘-click opens it in a new tab');
  assert.equal(await page.locator('#document-editor').getByText('[001-Plan this app](tasks/001-first-task.md)').isVisible(), false, 'not raw Markdown');
  await link.click();
  await page.locator('#document-path').filter({ hasText: 'tasks/001-first-task.md' }).waitFor();
});

story('US-132', 'the ⌃⌥ shortcuts: views ⌃⌥1–4 and the phases ⌃⌥D · ⌃⌥P; menus show ⌃⌥; ⌘2 is left to the browser', async t => {
  const { page } = t;
  await newProject(t, 'Keys');
  await page.keyboard.press('Control+Alt+Digit2'); await page.waitForFunction(() => document.body.dataset.view === 'work');
  await page.keyboard.press('Control+Alt+Digit1'); await page.waitForFunction(() => document.body.dataset.view === 'chat');
  await page.keyboard.press('Meta+Digit2'); await page.waitForTimeout(200);
  assert.equal(await page.evaluate(() => document.body.dataset.view), 'chat', '⌘2 belongs to the browser’s tabs');
  await page.keyboard.press('Control+Alt+KeyP'); await page.locator('#phase-button').filter({ hasText: 'Planning' }).waitFor();
  await page.waitForFunction(() => document.getElementById('phase-button').getAttribute('aria-busy') !== 'true');
  await page.keyboard.press('Control+Alt+KeyD'); await page.locator('#phase-button').filter({ hasText: 'Discussion' }).waitFor();
  await page.waitForFunction(() => document.getElementById('phase-button').getAttribute('aria-busy') !== 'true');
  await page.locator('#phase-button').click();
  assert.deepEqual(await page.locator('#phase-menu .pw-menu__key').allTextContents(), ['⌃⌥D', '⌃⌥P', '⌃⌥I']);
  await page.keyboard.press('Escape');
  assert.deepEqual(await page.locator('#menu-window [role="menuitemradio"] .pw-menu__key').allTextContents(), ['⌃⌥1', '⌃⌥2', '⌃⌥3', '⌃⌥4']);
  await page.keyboard.press('Control+Alt+Digit3'); await page.waitForURL(`${t.base}/activity`);
});

// -- Language and phone -------------------------------------------------------------------------------------------
story('US-090', 'the workbench in Japanese: Settings › Language, then the phase button and the plan card are in Japanese', async t => {
  const { page } = t;
  await newProject(t, 'Nihongo');
  await page.keyboard.press('ControlOrMeta+Comma');
  const settings = page.locator('#settings-dialog'); await settings.waitFor();
  await settings.locator('input[name="language"][value="ja"]').check();
  await page.waitForFunction(() => fetch('/api/settings').then(r => r.json()).then(d => d.language === 'ja'));
  await settings.getByRole('button', { name: /^(Done|完了)$/ }).click();
  await page.locator('#send').filter({ hasText: '送信' }).waitFor();
  assert.match(await page.locator('#phase-button').textContent(), /相談/);
  await choosePhase(t, '計画');
  const id = await say(t, 'TEST_PHASE_PLAN'); await answered(t, id);
  const card = page.locator('.pw-card').filter({ has: page.getByRole('button', { name: '実装開始', exact: true }) }).last(); await card.waitFor();
  assert.match(await card.textContent(), /Counter/, 'Pi’s words stay as written');
  await page.reload(); await page.locator('#send').filter({ hasText: '送信' }).waitFor();
});

story('US-095', 'on a phone (390 px): plan in Planning and Start Building from the phase sheet and the plan card', async t => {
  const { page } = t;
  await newProject(t, 'Pocket');  // made at the desk (Ph8_NewProject is design.cjs's), then used on the phone
  await page.setViewportSize({ width: 390, height: 844 }); await page.reload();
  await page.locator('#phase-button').click();
  const sheet = page.locator('#phase-menu'); await sheet.waitFor();
  await sheet.getByRole('radio', { name: /^Planning/ }).click();
  await page.waitForFunction(() => (document.querySelector('#phase-button')?.textContent||'').includes('Planning'));
  const id = await say(t, 'TEST_PHASE_PLAN'); await answered(t, id);
  const card = page.locator('.pw-card[aria-label="Plan"]').last(); await card.waitFor();
  const start = card.getByRole('button', { name: 'Start Building', exact: true });
  assert.ok((await start.boundingBox()).height >= 44, '44 px touch target');
  await start.click();
  await page.waitForFunction(() => (document.querySelector('#phase-button')?.textContent||'').includes('Implementation'));
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'no sideways scroll');
});

// -- Round 12: the harness's voice and Gate's judgements (tasks 290, 273; boards R12_Conversation, R12_Gate) -------
/** Wait until the scratch workbench runs nothing, then reload so the chat shows the saved conversation. */
async function settledAll(t) {
  for (let i = 0; i < 150; i++) {
    const jobs = (await t.bench.api('/api/workspace')).jobs;
    if (!jobs.some(job => ['queued', 'running'].includes(job.status))) break;
    await t.page.waitForTimeout(200);
  }
  await t.page.reload();
}
/** Settings… from its menu item (the shortcut may change), once the page's scripts are ready after a reload. */
async function openSettings(t) {
  const dialog = t.page.locator('#settings-dialog');
  for (let i = 0; i < 20 && !(await dialog.isVisible()); i++) {
    await t.page.evaluate(() => document.querySelector('[data-command="settings"]').click());
    await dialog.waitFor({ timeout: 500 }).catch(() => {});
  }
  await dialog.waitFor(); return dialog;
}

story('US-122', 'without Laya, a phase word gets the harness’s own notice under the answer, with how to install it', async t => {
  const { page } = t;
  await newProject(t, 'Notice');
  const id = await say(t, 'Explain the planning phase TEST_SCRIPT=say-planning'); await answered(t, id);
  await page.reload();
  const notice = page.locator('#messages .pw-notice[role="note"]').last(); await notice.waitFor();
  assert.equal(await notice.locator('.pw-notice__who').textContent(), 'Harness', 'the harness speaks, not Pi');
  assert.equal(await notice.locator('.pw-notice__text').textContent(), 'Laya isn’t installed, so the phase button can’t suggest the next phase. Everything else works.');
  assert.equal(await notice.evaluate(el => getComputedStyle(el).borderTopStyle), 'dotted');
  assert.equal(await notice.evaluate(el => Boolean(el.closest('.pw-msg__body'))), false, 'outside Pi’s words');
  await notice.getByRole('link', { name: 'How to Install', exact: true }).click();
  await page.locator('#alert-detail').filter({ hasText: 'plh setup laya' }).waitFor();
  await page.locator('#alert-default').click();
  assert.equal(await page.locator('#messages .pw-card[aria-label*="phase"]').count(), 0, 'nothing blocks: no card');
});

story('US-123', 'the decisions under an answer name who made each; Change… on my answer says what it redoes, then redoes it', async t => {
  const { page } = t;
  await newProject(t, 'Decided');
  const id = await say(t, 'Which colours? TEST_SCRIPT=discuss-choice'); await answered(t, id);
  const card = page.locator('.pw-card[aria-label="Which colours?"]'); await card.waitFor();
  const resumed = page.waitForResponse(response => response.url().endsWith('/api/choices/answer'));
  await card.getByRole('button', { name: 'Answer', exact: true }).click();
  await answered(t, (await (await resumed).json()).job);
  await settledAll(t);
  const row = page.locator('#messages details.pw-decisions:not([hidden])').first(); await row.locator('summary').waitFor();
  assert.match(await row.locator('summary').textContent(), /^▸\s*2 decisions · 1 automatic$/, 'collapsed: the count and the automatic ones');
  await row.locator('summary').click();
  const mine = row.locator('li').filter({ hasText: 'Which colours?' });
  assert.equal(await mine.locator('.pw-tag').textContent(), 'you');
  const proposed = row.locator('li').filter({ hasText: 'Recommended option' });
  assert.equal(await proposed.locator('.pw-tag').textContent(), 'model', 'the model’s judgement is named, not hidden');
  assert.match(await proposed.locator('.pw-tag').getAttribute('class'), /pw-tag--dotted/);
  assert.equal(await proposed.getByRole('link', { name: 'Change…', exact: true }).getAttribute('aria-disabled'), 'true', 'cannot be changed here: disabled, with the reason');
  await mine.getByRole('link', { name: 'Change…', exact: true }).click();
  const change = page.locator('.pw-change'); await change.waitFor();
  assert.equal(await change.locator('.pw-card__title').textContent(), 'Change: Which colours?');
  assert.match(await change.textContent(), /Current choice \(you, /);
  assert.match(await change.locator('.pw-card__foot').textContent(), /Redoes: /, 'it names what it redoes');
  assert.equal(await change.getByRole('radio', { name: 'White on black' }).isChecked(), true, 'the other answer is preselected');
  const sent = page.waitForResponse(response => response.url().endsWith('/api/decisions/change'));
  await change.getByRole('button', { name: 'Change and Redo', exact: true }).click();
  const redo = await answered(t, (await (await sent).json()).job);
  assert.equal(redo.message, 'Change: Which colours? → White on black (was Black on white). Redo what depended on it.');
  await settledAll(t);
  await page.locator('.pw-card--settled').filter({ hasText: 'Which colours?: White on black' }).waitFor();
  assert.ok(decisions(t).some(item => item.kind === 'question_answer' && item.who === 'person' && item.rule === 'decision.change'), 'recorded as the person’s');
});

story('US-124', 'a batch of questions: “Question 1 of 3” with Take All Recommendations answers the rest with their recommendations', async t => {
  const { page } = t;
  await newProject(t, 'Batch');
  const id = await say(t, 'Make notes for my class TEST_SCRIPT=batch-questions'); await answered(t, id);
  const card = page.locator('.pw-card[aria-label="Who writes the notes?"]'); await card.waitFor();
  assert.match(await card.locator('.pw-card__head').textContent(), /Question 1 of 3/);
  const take = page.waitForResponse(response => response.url().endsWith('/api/choices/answer'));
  await card.getByRole('button', { name: 'Take All Recommendations', exact: true }).click();
  const body = JSON.parse((await take).request().postData());
  assert.deepEqual([body.option, body.take_all], [0, true]);
  for (let i = 0; i < 100 && decisions(t).filter(row => row.kind === 'question_answer' && row.who === 'person').length < 3; i++) await page.waitForTimeout(200);
  await settledAll(t);
  for (const text of ['Who writes the notes?: Only me', 'How should notes be sorted?: Newest first', 'Should deleted notes go to a Trash first?: Yes, keep them 30 days'])
    await page.locator('.pw-card--settled').filter({ hasText: text }).first().waitFor();
  await page.locator('#messages').getByText('Noted all three answers.', { exact: true }).waitFor();
  assert.equal(decisions(t).filter(row => row.kind === 'question_answer' && row.who === 'person').length, 3, 'each answer is the person’s');
  assert.equal((await t.bench.api('/api/workspace')).jobs.filter(job => job.status === 'waiting').length, 0, 'nothing is left waiting');
});

story('US-125', 'Settings › Pi › Detail: Beginner hides decisions made by code; Expert shows them with the rule and the command', async t => {
  const { page } = t;
  await newProject(t, 'Detail');
  const id = await say(t, 'Run it TEST_SCRIPT=unknown-command'); await answered(t, id);
  const loaded = page.waitForResponse(response => /\/decisions$/.test(response.url()));
  await settledAll(t); await loaded;
  const answer = page.locator('#messages .pw-msg').filter({ hasText: 'Tried a command.' }).last(); await answer.waitFor();
  assert.equal(await answer.locator('details.pw-decisions:not([hidden])').count(), 0, 'Beginner (the default): Gate’s refusal is code’s, so no row');
  let settings = await openSettings(t);
  assert.equal(await settings.locator('input[name="detail"][value="beginner"]').isChecked(), true);
  const saved = page.waitForResponse(response => response.url().endsWith('/api/settings') && response.request().method() === 'POST' && /detail/.test(response.request().postData() || ''));
  await settings.locator('input[name="detail"][value="expert"]').check(); await saved;
  await settings.getByRole('button', { name: 'Done', exact: true }).click();
  const row = answer.locator('details.pw-decisions:not([hidden])'); await row.waitFor();
  await row.locator('summary').click();
  const refused = row.locator('li').filter({ hasText: 'Command' });
  assert.equal(await refused.locator('.pw-tag').textContent(), 'code');
  assert.match(await refused.textContent(), /refused|sent back/);
  assert.match(await refused.locator('.pw-decisions__rule').textContent(), /^(G-\d+|gate\.preflight)/, 'the rule');
  assert.match(await refused.locator('.pw-decisions__detail').textContent(), /frobnicate --all/, 'and the command');
  await page.reload(); settings = await openSettings(t);
  assert.equal(await settings.locator('input[name="detail"][value="expert"]').isChecked(), true, 'kept in config.json');
});

// -- Task 324: the chat critical path (the owner, 2026-10-18: "the critical path of user chatting with agent is completely
// broken. audit it."; docs/reviews/2026-10-18-chat-critical-path-audit.md) ---------------------------------------------
/** The chat's request rows as the server has them, oldest first. */
const chatJobs = async (t, project) => (await t.bench.api('/api/workspace')).jobs.filter(job => job.project === project && job.role === 'chat');
/** The last answer of Pi in the chat, as the person sees it. */
const lastAnswer = t => t.page.locator('#messages .pw-msg.assistant:not([data-live])').last();

story('US-200', 'the model stops answering after a tool: the request fails with why and Retry, and my Planning message starts next', async t => {
  await t.bench.restart({ PI_HARNESS_MODEL_SILENCE_SECONDS: '3' }); const page = await t.reopen();  // three seconds instead of two minutes, for this scratch workbench only
  const { project } = await newProject(t, 'Pong');
  const stuck = await say(t, 'Look at the roadmap TEST_SCRIPT=hang-after-tool');
  await t.bench.job(stuck, ['running']);
  await choosePhase(t, 'Planning');
  const next = await say(t, "let's plan the icons now");
  assert.equal((await chatJobs(t, project)).find(job => job.id === next).status, 'queued', 'it waits behind the stalled request');
  const failed = await answered(t, stuck, ['failed', 'completed', 'stopped'], 20000);
  assert.equal(failed.status, 'failed'); assert.equal(failed.progress, 'the model stopped answering (no reply in 3 s).');
  const done = await answered(t, next, ['completed', 'failed', 'stopped'], 20000);
  assert.equal(done.status, 'completed', 'the Planning request starts and finishes');
  await page.locator('#messages').getByText(/^reply \d+$/).waitFor({ timeout: 10000 });
  const cut = page.locator('#messages .pw-msg').filter({ has: page.locator('.pw-cut[role="status"]') }).last();
  await cut.locator('.pw-cut__text').filter({ hasText: 'Failed before Pi finished: the model stopped answering (no reply in 3 s).' }).waitFor();
  assert.equal(await cut.locator('.pw-cut').getByRole('button', { name: 'Retry', exact: true }).count(), 1, 'Retry under the cut answer');
  assert.match(await page.locator('#phase-button').textContent(), /Planning/, 'the phase I chose stays');
  assert.equal((await chatJobs(t, project)).filter(job => ['queued', 'running'].includes(job.status)).length, 0, 'nothing is left running or waiting');
});

story('US-201', 'Planning with the phase button, then a message: it starts with nothing in flight, after a question card, and after a reload', async t => {
  const { page } = t;
  const { project } = await newProject(t, 'Icons');
  await choosePhase(t, 'Planning');
  assert.equal((await answered(t, await say(t, 'Plan the icons'))).status, 'completed', 'nothing in flight');
  // A question card waits for me; I change the phase and write a message.
  await choosePhase(t, 'Discussion');
  const asked = await say(t, 'Which colours? TEST_SCRIPT=discuss-choice'); assert.equal((await answered(t, asked)).status, 'waiting');
  await page.locator('.pw-card[aria-label="Which colours?"]').waitFor();
  await choosePhase(t, 'Planning');
  const sent = page.waitForResponse(response => /\/api\/(jobs\/create|choices\/answer)$/.test(response.url()) && response.request().method() === 'POST');
  await page.locator('#prompt').fill('Plan the icons now'); await page.locator('#send').click();
  const response = await sent; const body = await response.json(); assert.ok(response.ok(), body.error);
  const id = body.job || body.id; assert.ok(id, 'a request was made: ' + JSON.stringify(body));
  assert.equal((await answered(t, id)).status, 'completed', 'after a question card');
  // After a reload, still in Planning.
  await page.reload(); await page.waitForFunction(() => (document.querySelector('#phase-button')?.textContent || '').includes('Planning'));
  const after = await say(t, 'And the score icons'); assert.equal((await answered(t, after)).status, 'completed', 'after a reload');
  await page.locator('#messages').getByText(/^reply \d+$/).last().waitFor();
  assert.equal((await chatJobs(t, project)).filter(job => ['queued', 'running'].includes(job.status)).length, 0);
});

story('US-202', '[CANARY] is never shown: live, after a reload, in Activity, and in an answer saved before the fix', async t => {
  const { page } = t;
  const { project } = await newProject(t, 'Marker');
  const id = await say(t, 'Say hello TEST_CANARY_CODE');
  const job = await answered(t, id); assert.equal(job.status, 'completed'); assert.doesNotMatch(job.text, /\[CANARY\]/);
  await lastAnswer(t).getByText(/^reply \d+$/).waitFor();
  assert.doesNotMatch(await page.locator('#messages').innerText(), /\[CANARY\]/, 'live');
  await answered(t, await say(t, 'Again TEST_CANARY_BOLD'));
  // An answer saved before the fix still carries the marker on disk: the page hides it.
  const chat = (await t.bench.api('/api/workspace')).projects.find(item => item.id === project).chat;
  const file = join(t.bench.directory, 'data', chat, 'conversation.json'), saved = JSON.parse(fs.readFileSync(file, 'utf8'));
  saved.messages.push({ role: 'assistant', content: '`[CANARY]` An old answer, saved before.', timestamp: new Date().toISOString() });
  fs.writeFileSync(file, JSON.stringify(saved));
  await page.reload(); await page.locator('#messages').getByText('An old answer, saved before.').waitFor();
  assert.doesNotMatch(await page.locator('#messages').innerText(), /\[CANARY\]/, 'after a reload, old answers too');
  assert.equal(saved.messages.filter(message => message.role === 'assistant' && /\[CANARY\]/.test(message.content)).length, 1, 'only the old one was saved with it');
  await page.goto(t.base + '/activity');
  await page.locator('.activity-task').filter({ hasText: 'Say hello' }).first().locator('.activity-request').click();
  await page.locator('#activity-detail').filter({ hasText: /reply \d+/ }).waitFor();
  assert.doesNotMatch(await page.locator('#activity-detail').textContent(), /\[CANARY\]/, 'Activity');
});

story('US-203', 'the whole chat path: streaming thoughts, a tool call, reload mid-request, a second tab, Stop, Retry, three messages in order, a phase change, a check-in, and on', async t => {
  let { page } = t;
  const { project } = await newProject(t, 'Path');
  // Streaming: the thoughts show while Pi thinks; a reload mid-request still gets the answer.
  const thinking = await say(t, 'Think it through TEST_THINK');
  await page.locator('#messages [data-live]').getByText('Reasoning').waitFor({ timeout: 10000 });
  await page.reload();
  await lastAnswer(t).getByText(/^reply \d+$/).waitFor({ timeout: 30000 });
  assert.equal((await answered(t, thinking)).status, 'completed');
  // A tool call shows while it runs, with Stop; a second tab sees the same answer.
  const second = await page.context().newPage(); await second.goto(page.url());
  const tool = await say(t, 'Read the readme TEST_TOOL');
  await page.locator('.pw-tool--live').first().waitFor({ timeout: 10000 });
  assert.equal(await page.locator('#stop').isVisible(), true, 'Stop while Pi works');
  assert.equal((await answered(t, tool)).status, 'completed');
  await second.locator('#messages').getByText(/^reply \d+$/).last().waitFor({ timeout: 10000 });
  assert.equal(await second.locator('#messages .pw-msg.user').count(), await page.locator('#messages .pw-msg.user').count(), 'both tabs show the same chat');
  await second.close();
  // Stop keeps the partial answer, marked; Retry queues it again.
  const long = await say(t, 'Explain at length TEST_STREAM_WAIT');
  for (let i = 0; i < 50 && !(await chatJobs(t, project)).find(job => job.id === long && job.text); i++) await page.waitForTimeout(100);
  await page.locator('#stop').click();
  assert.equal((await answered(t, long)).status, 'stopped');
  const cut = page.locator('#messages .pw-msg').filter({ has: page.locator('.pw-cut[role="status"]') }).last();
  await cut.locator('.pw-cut__text').filter({ hasText: 'Stopped by you before Pi finished.' }).waitFor();
  await cut.getByText('PARTIAL before the stop').waitFor();
  const again = page.waitForResponse(response => /\/api\/jobs\/[0-9a-f]{32}\/retry$/.test(response.url()));
  await cut.locator('.pw-cut').getByRole('button', { name: 'Retry', exact: true }).click();
  const retried = await (await again).json(); assert.equal(retried.retry_of, long);
  await page.waitForFunction(() => document.querySelector('#stop') && !document.querySelector('#stop').hidden, null, { timeout: 10000 });
  await page.locator('#stop').click(); assert.equal((await answered(t, retried.id)).status, 'stopped');
  // Three messages while Pi works: the first runs, the two waiting ones become one request after it (by design), in order.
  const first = await say(t, 'First, slowly TEST_THINK');
  await t.bench.job(first, ['running']);
  const secondMessage = await say(t, 'Second'); const third = await say(t, 'Third');
  assert.equal(third, secondMessage, 'a message sent while the earlier one waits joins it');
  await choosePhase(t, 'Planning');  // a phase change between messages
  assert.equal((await answered(t, first)).status, 'completed');
  const joined = await answered(t, secondMessage); assert.equal(joined.status, 'completed'); assert.equal(joined.message, 'Second\n\nThird');
  assert.ok(new Date(joined.started) >= new Date((await chatJobs(t, project)).find(job => job.id === first).finished), 'in order');
  await settledAll(t); page = t.page;
  await page.locator('#messages .pw-msg.user').filter({ hasText: 'Third' }).waitFor();
  const users = await page.locator('#messages .pw-msg.user .pw-msg__body').allInnerTexts();
  assert.deepEqual(users.slice(-2), ['First, slowly TEST_THINK', 'Second\n\nThird']);
  // A check-in, then I keep chatting.
  assert.equal((await answered(t, await say(t, 'Move the ball TEST_CHECK_IN'))).status, 'completed');
  await page.locator('#messages').getByText('The ball moves.').first().waitFor();
  const on = await say(t, 'And now the score?'); assert.equal((await answered(t, on)).status, 'completed');
  await lastAnswer(t).getByText(/^reply \d+$/).waitFor();
  assert.equal((await chatJobs(t, project)).filter(job => ['queued', 'running'].includes(job.status)).length, 0);
  assert.deepEqual(t.errors, [], 'no page errors');
});

story('US-204', 'when things go wrong the chat says why and goes on: Ollama down, a model error, Pi crashing, Gate refusing a command', async t => {
  const { page } = t;
  const { project } = await newProject(t, 'Trouble');
  const cutText = () => page.locator('#messages .pw-cut[role="status"] .pw-cut__text').last();
  const down = await say(t, 'Hello TEST_OLLAMA_DOWN'); assert.equal((await answered(t, down)).status, 'failed');
  await cutText().filter({ hasText: /^Failed before Pi finished: Ollama is not answering \(Connection error\.\)\. Start Ollama/ }).waitFor({ timeout: 10000 });
  const error = await say(t, 'Hello TEST_MODEL_ERROR'); assert.equal((await answered(t, error)).status, 'failed');
  await cutText().filter({ hasText: /model runner has unexpectedly stopped/ }).waitFor({ timeout: 10000 });
  await page.locator('#messages').getByText('Starting the answer').waitFor();
  const crash = await say(t, 'Hello TEST_CRASH'); assert.equal((await answered(t, crash)).status, 'failed');
  await cutText().filter({ hasText: /Pi exited unexpectedly: segfault in model runner/ }).waitFor({ timeout: 10000 });
  const refused = await say(t, 'Run it TEST_SCRIPT=unknown-command'); assert.equal((await answered(t, refused)).status, 'completed', 'a refusal never wedges the request');
  await page.locator('#messages').getByText('Tried a command.').waitFor({ timeout: 10000 });
  const fine = await say(t, 'Are we fine?'); assert.equal((await answered(t, fine)).status, 'completed', 'the chat goes on');
  assert.equal((await chatJobs(t, project)).filter(job => ['queued', 'running'].includes(job.status)).length, 0);
});

story('US-205', 'controls stay owned once: an answer accepted while the worker shuts down runs next; a refresh across a phase change shows the saved phase', async t => {
  const { page } = t;
  const { project } = await newProject(t, 'Owners');
  // The live card appears while the worker still runs (TEST_LIVE_CHOICE waits 5 s); I answer at once.
  const live = await say(t, 'Discuss TEST_LIVE_CHOICE');
  const card = page.locator('.pw-card[aria-label="Who uses it?"]'); await card.waitFor({ timeout: 10000 });
  assert.equal((await chatJobs(t, project)).find(job => job.id === live).status, 'running');
  const answering = page.waitForResponse(response => response.url().endsWith('/api/choices/answer'));
  await card.getByRole('button', { name: 'Answer', exact: true }).click();
  const answer = await (await answering).json(); assert.ok(answer.job, JSON.stringify(answer));
  await page.reload();  // mid-request: the saved card is the answered one, once
  await page.locator('.pw-card--settled').filter({ hasText: 'Who uses it?: Only me' }).last().waitFor();
  assert.equal((await answered(t, live)).status, 'completed', 'the worker finished after the answer');
  assert.equal((await answered(t, answer.job)).status, 'completed', 'the accepted answer ran next');
  await settledAll(t);
  assert.equal(await page.locator('.pw-card[aria-label="Who uses it?"] .pw-option').count(), 0, 'final text never reopens it');
  const chat = (await t.bench.api('/api/workspace')).projects.find(item => item.id === project).chat;
  const saved = (await t.bench.api('/api/conversations/' + chat)).messages.filter(message => message.choice);
  assert.deepEqual(saved.map(message => message.choice.answer), ['Only me'], 'one card, answered once');
  // Another tab changes the phase; this tab refreshes and shows it, and my next message runs.
  const other = await page.context().newPage(); await other.goto(page.url());
  await other.locator('#phase-button').waitFor();
  await choosePhase({ page: other }, 'Planning'); await other.close();
  await page.reload(); await page.waitForFunction(() => (document.querySelector('#phase-button')?.textContent || '').includes('Planning'));
  assert.equal((await answered(t, await say(t, 'Plan it'))).status, 'completed');
});

story('US-206', 'choosing Planning after a discussion starts the plan without typing; on an empty chat it starts nothing; Implementation starts the approved task', async t => {
  const { page } = t;
  const { project } = await newProject(t, 'Auto plan');
  await choosePhase(t, 'Planning');
  await page.waitForTimeout(800);
  assert.equal((await chatJobs(t, project)).length, 0, 'an empty chat: nothing runs');
  await choosePhase(t, 'Discussion');
  assert.equal((await answered(t, await say(t, 'I want a click counter for my desk'))).status, 'completed');
  await choosePhase(t, 'Planning');
  let started = null;
  for (let i = 0; i < 50 && !started; i++) { started = (await chatJobs(t, project)).find(job => job.message === 'Write the plan from our discussion.'); if (!started) await page.waitForTimeout(100); }
  assert.ok(started, 'the Planning button started a request');
  assert.equal((await answered(t, started.id)).status, 'waiting', 'it proposed a plan and waits for Start Building');
  const card = page.locator('.pw-card[aria-label="Plan"]').last(); await card.waitFor({ timeout: 10000 });
  await page.locator('#messages .pw-notice').filter({ hasText: 'Planning started from your discussion' }).waitFor();
  assert.equal(await page.locator('#messages .pw-msg.user').filter({ hasText: 'Write the plan from our discussion.' }).count(), 0, 'never shown as my words');
  assert.equal((await chatJobs(t, project)).filter(job => job.message === 'Write the plan from our discussion.').length, 1, 'once');
  // An approved plan: back to Discussion, then Implementation from the phase menu starts the approved task.
  const other = await newProject(t, 'Auto build');
  await givenApprovedTasks(t, other.root, [COUNT]);
  await choosePhase(t, 'Discussion'); await choosePhase(t, 'Implementation');
  let build = null;
  for (let i = 0; i < 50 && !build; i++) { build = (await chatJobs(t, other.project)).find(job => job.message === 'Build the approved task.'); if (!build) await page.waitForTimeout(100); }
  assert.ok(build, 'Implementation started the approved task');
  await answered(t, build.id);
  await page.locator('#messages .pw-notice').filter({ hasText: 'Building started: the approved task' }).waitFor();
});

story('US-207', 'a project folder with spaces and capitals (“Habit Tracker”): plan, build, sandboxed test runs, the commit and the Preview all work', async t => {
  const { root, job } = await planAndBuild(t, { name: 'Habit Tracker' });
  assert.equal(job.status === 'completed' || job.status === 'waiting', true, 'the build ran: ' + job.status + ' ' + job.progress);
  assert.ok(exists(root, 'counter.py') && exists(root, 'tests', 'test_counter.py'), 'Pi wrote into the folder with a space');
  const runs = t.bench.lines(join(t.bench.data, 'test-runs.jsonl')).filter(run => run.cwd === root);
  assert.ok(runs.some(run => run.exit_code === 0 && run.counts.pass > 0), 'the sandboxed test run passed: ' + JSON.stringify(runs.map(run => [run.exit_code, run.counts])));
  assert.match(commits(t, root).join('\n'), /Count clicks/, 'Gate committed the task');
  const web = await newProject(t, 'Habit Tracker Web', 'web');
  await t.bench.api('/api/preview/start', { project: web.project });
  let status = null;
  for (let i = 0; i < 100; i++) { status = await t.bench.api('/api/preview?project=' + web.project); if (['running', 'stopped', 'none'].includes(status.state)) break; await t.page.waitForTimeout(200); }
  assert.equal(status.state, 'running', JSON.stringify(status));
  await t.bench.api('/api/preview/stop', { project: web.project });
});

// -- Task 325: the waiting messages (the owner: "I want to be able to read and update/remove queued messages") --------
/** A project whose chat is busy with a request that keeps running (the fake Pi's TEST_WAIT), so what I send next waits. */
async function busyChat(t, name = 'Queue') {
  const made = await newProject(t, name); t.project = made.project;
  const running = await say(t, 'Work for a while TEST_WAIT');
  await answered(t, running, ['running']);
  await t.page.locator('.pw-tool--live').filter({ hasText: 'Using bash' }).waitFor();
  return { ...made, running };
}
const queued = (t, text) => t.page.locator('#queue .pw-queue__item').filter({ hasText: text });
/** Stop the running request (the chat's Stop); the next waiting message then starts. */
async function stopRunning(t, running) { await t.page.locator('#stop').click(); await answered(t, running, ['stopped', 'failed', 'interrupted']); }
async function conversation(t) { const chats = await t.bench.api('/api/conversations'); return t.bench.api('/api/conversations/' + chats.find(chat => chat.project === t.project).id); }

story('US-220', 'while Pi works, the messages I sent next wait under it: full text, attachments, when queued; “Next: 1 request waiting” folds them; Activity has them too', async t => {
  const { page } = t;
  await busyChat(t);
  await page.locator('#files').setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('a note') });
  await say(t, 'Paint the button blue.\nAnd make it round.');
  const card = queued(t, 'Paint the button blue.'); await card.waitFor();
  assert.equal(await card.locator('.pw-queue__text').innerText(), 'Paint the button blue.\nAnd make it round.', 'the full text, with its lines');
  assert.match(await card.locator('.pw-queue__when').textContent(), /^Queued \d{1,2}:\d{2}/);
  assert.equal(await card.locator('.pw-queue__file').textContent(), 'notes.txt');
  assert.match(await page.locator('#queue .pw-queue-note').textContent(), /^Next: 1 request waiting in Queue$/);
  assert.equal(await card.getByRole('button', { name: 'Edit', exact: true }).isVisible(), true);
  assert.equal(await card.getByRole('button', { name: 'Remove…', exact: true }).isVisible(), true);
  const live = await page.locator('#messages [data-live]').boundingBox(), box = await card.boundingBox();
  assert.ok(box.y > live.y, 'below the running request');
  await say(t, 'Also a border.');  // joins the waiting message: Pi gets both as one request
  await card.locator('.pw-queue__text').filter({ hasText: 'Also a border.' }).waitFor();
  assert.equal(await page.locator('#queue .pw-queue__item').count(), 1);
  await page.locator('#queue .pw-queue-note').click();
  await card.waitFor({ state: 'hidden' });
  assert.equal(await page.locator('#queue .pw-queue-note').getAttribute('aria-expanded'), 'false');
  await page.reload(); await page.locator('#queue .pw-queue-note').waitFor();
  assert.equal(await page.locator('#queue .pw-queue-note').getAttribute('aria-expanded'), 'false', 'folded stays folded');
  await page.locator('#queue .pw-queue-note').click(); await card.waitFor();
  await page.goto(t.base + '/activity');
  const row = page.locator('.activity-task').filter({ hasText: 'Paint the button blue.' }); await row.waitFor();
  assert.match(await row.textContent(), /queued \d{1,2}:\d{2}/);
  await row.locator('.activity-request').click();
  assert.match(await page.locator('#activity-detail').textContent(), /notes\.txt/, 'Activity names its attachment');
});

story('US-221', 'I edit a waiting message (new words, one attachment dropped); it keeps its place, and Pi receives the edited text', async t => {
  const { page, bench } = t;
  const { running } = await busyChat(t);
  await page.locator('#files').setInputFiles([{ name: 'keep.txt', mimeType: 'text/plain', buffer: Buffer.from('keep') }, { name: 'drop.txt', mimeType: 'text/plain', buffer: Buffer.from('drop') }]);
  const id = await say(t, 'Make the title blue');
  const card = queued(t, 'Make the title blue'); await card.waitFor();
  await card.getByRole('button', { name: 'Edit', exact: true }).click();
  const field = page.locator('#queue .pw-queue__field'); await field.waitFor();
  assert.equal(await field.inputValue(), 'Make the title blue');
  assert.equal(await page.evaluate(() => document.activeElement?.classList.contains('pw-queue__field')), true, 'the field has the focus');
  await field.fill('Make the title red, please');
  await page.locator('#queue').getByRole('button', { name: 'Remove drop.txt' }).click();
  await page.locator('#queue .pw-queue__field').fill('Make the title red, please');  // the field stays the person's after a chip goes
  const saved = page.waitForResponse(response => response.url().endsWith(`/api/jobs/${id}/edit`));
  await page.locator('#queue').getByRole('button', { name: 'Save', exact: true }).click();
  assert.equal((await saved).status(), 200);
  const edited = queued(t, 'Make the title red, please'); await edited.waitFor();
  assert.equal(await edited.locator('.pw-queue__edited').textContent(), 'Edited');
  assert.deepEqual(await edited.locator('.pw-queue__file').allTextContents(), ['keep.txt']);
  await page.locator('#queue .pw-queue__notice').filter({ hasText: 'Saved. Pi gets the edited message in the same place.' }).waitFor();
  const job = (await bench.api('/api/workspace')).jobs.find(item => item.id === id);
  assert.deepEqual([job.status, job.message, job.files, job.version], ['queued', 'Make the title red, please', ['keep.txt'], 2]);
  await stopRunning(t, running);
  await answered(t, id);
  await page.locator('#messages .pw-msg--user').filter({ hasText: 'Make the title red, please' }).waitFor();
  assert.equal(await page.locator('#messages .pw-msg--user').filter({ hasText: 'Make the title blue' }).count(), 0, 'Pi never saw the old words');
  const user = (await conversation(t)).messages.filter(message => message.role === 'user').at(-1);
  assert.equal(user.content, 'Make the title red, please');
  assert.deepEqual((user.attachments || user.files || []).map(file => file.name), ['keep.txt'], 'only the attachment I kept reached Pi');
  const rows = decisions(t).filter(row => row.kind === 'queue_edit');
  assert.deepEqual(rows.map(row => [row.who, row.answer, row.request]), [['person', 'edited, 1 attachment removed', id]]);
  assert.doesNotMatch(bench.read(bench.data, 'decisions.jsonl'), /title (blue|red)/, 'the log keeps the decision, not the words');
});

story('US-222', 'I remove a waiting message: it asks first, Pi never receives it, and its attachment is released', async t => {
  const { page, bench } = t;
  const { running } = await busyChat(t);
  await page.locator('#files').setInputFiles({ name: 'gone.txt', mimeType: 'text/plain', buffer: Buffer.from('gone') });
  const id = await say(t, 'Delete every test');
  const card = queued(t, 'Delete every test'); await card.waitFor();
  await card.getByRole('button', { name: 'Remove…', exact: true }).click();
  await page.locator('#alert-message').filter({ hasText: 'Remove this waiting message?' }).waitFor();
  await page.locator('#alert-dialog').getByRole('button', { name: 'Keep Waiting', exact: true }).click();
  assert.equal(await card.isVisible(), true, 'the safe button keeps it');
  await card.getByRole('button', { name: 'Remove…', exact: true }).click();
  await page.locator('#alert-dialog').getByRole('button', { name: 'Remove Message', exact: true }).click();
  await card.waitFor({ state: 'detached' });
  await page.locator('#queue .pw-queue__notice').filter({ hasText: 'Removed. Pi will never receive that message.' }).waitFor();
  assert.equal(await page.locator('#queue .pw-queue-note').isVisible(), false, 'nothing waits now');
  const removed = (await bench.api('/api/workspace')).jobs.find(item => item.id === id);
  assert.deepEqual([removed.status, removed.progress, removed.files], ['cancelled', 'Removed by you before it started', []]);
  assert.equal(fs.existsSync(join(bench.data, 'activity', id + '.attachments.json')), false, 'its attachment is released');
  await stopRunning(t, running);
  const next = await say(t, 'Something else');
  await answered(t, next);
  const user = (await conversation(t)).messages.filter(message => message.role === 'user').map(message => message.content);
  assert.equal(user.includes('Delete every test'), false, 'it never ran');
  assert.equal((await bench.api('/api/workspace')).jobs.find(item => item.id === id).started, undefined);
  assert.deepEqual(decisions(t).filter(row => row.kind === 'queue_remove').map(row => [row.who, row.answer, row.request]), [['person', 'removed', id]]);
});

story('US-223', 'a second window’s stale edit is refused (“changed in another window”), and my draft is back in the composer', async t => {
  const { page, bench } = t;
  await busyChat(t);
  const id = await say(t, 'Use a serif font');
  const other = await page.context().newPage();
  await other.route('**/api/updates', route => route.fulfill({ json: { state: 'current', checked: 1 } }));
  await other.goto(page.url()); await queued({ page: other }, 'Use a serif font').waitFor();
  await queued(t, 'Use a serif font').getByRole('button', { name: 'Edit', exact: true }).click();
  await page.locator('#queue .pw-queue__field').fill('Use a mono font');
  await queued({ page: other }, 'Use a serif font').getByRole('button', { name: 'Edit', exact: true }).click();
  await other.locator('#queue .pw-queue__field').fill('Use a sans font');
  await other.locator('#queue').getByRole('button', { name: 'Save', exact: true }).click();
  await queued({ page: other }, 'Use a sans font').waitFor();
  await page.locator('#prompt').fill('My unsent words');
  const refused = page.waitForResponse(response => response.url().endsWith(`/api/jobs/${id}/edit`));
  await page.locator('#queue').getByRole('button', { name: 'Save', exact: true }).click();
  assert.equal((await refused).status(), 409);
  await page.locator('#queue .pw-queue__notice').filter({ hasText: 'This message changed in another window; your edit was not saved. Your text is back in the composer.' }).waitFor();
  assert.equal(await page.locator('#prompt').inputValue(), 'My unsent words\n\nUse a mono font', 'nothing I typed is lost');
  await queued(t, 'Use a sans font').waitFor();
  assert.equal((await bench.api('/api/workspace')).jobs.find(item => item.id === id).message, 'Use a sans font', 'the other window’s edit stands');
  await other.close();
});

story('US-224', 'Pi starts the message while I edit it: “Pi already started this message; your edit was not sent”, my draft in the composer', async t => {
  const { page } = t;
  const { running } = await busyChat(t);
  const id = await say(t, 'Add a footer');
  await queued(t, 'Add a footer').getByRole('button', { name: 'Edit', exact: true }).click();
  await page.locator('#queue .pw-queue__field').fill('Add a footer with the year');
  await bench_stop(t, running);
  await page.locator('#queue .pw-queue__notice').filter({ hasText: 'Pi already started this message; your edit was not sent. Your text is back in the composer.' }).waitFor();
  assert.equal(await page.locator('#prompt').inputValue(), 'Add a footer with the year');
  await answered(t, id);
  await page.locator('#messages .pw-msg--user').filter({ hasText: 'Add a footer' }).first().waitFor();
  assert.equal((await conversation(t)).messages.filter(message => message.role === 'user').at(-1).content, 'Add a footer', 'Pi got the message as it was when it started');
});
/** Stop the running request from outside the page, so a page in the middle of an edit is not touched. */
async function bench_stop(t, running) { await t.bench.api('/api/jobs/stop', { id: running }); await answered(t, running, ['stopped', 'failed', 'interrupted']); }

story('US-225', 'on a phone (390 px) the waiting message reads in full, its buttons are 44 px, and editing fits the screen', async t => {
  const { page } = t;
  await t.page.setViewportSize({ width: 1440, height: 900 });  // the project is made at the desk (as US-095), then used on the phone
  await busyChat(t);
  await page.setViewportSize({ width: 390, height: 844 }); await page.reload();
  const long = 'Rewrite the introduction so it says what the app does in one sentence, then list the three things a person can do with it';
  const id = await say(t, long);
  const card = queued(t, 'Rewrite the introduction'); await card.waitFor(); await card.scrollIntoViewIfNeeded();
  assert.equal(await card.locator('.pw-queue__text').textContent(), long);
  for (const name of ['Edit', 'Remove…']) assert.ok((await card.getByRole('button', { name, exact: true }).boundingBox()).height >= 44, name + ' is a 44 px target');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'no sideways scrolling');
  await card.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.locator('#queue .pw-queue__field').fill('Shorter introduction');
  const box = await page.locator('#queue .pw-queue__field').boundingBox();
  assert.ok(box.x >= 0 && box.x + box.width <= 390, 'the field fits the screen');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.locator('#queue').getByRole('button', { name: 'Save', exact: true }).click();
  await queued(t, 'Shorter introduction').waitFor();
  assert.equal((await t.bench.api('/api/workspace')).jobs.find(item => item.id === id).message, 'Shorter introduction');
});

story('US-208', 'Gate’s question mid-request pauses it like a card of Pi’s: Waiting for you, the card survives a reload, Keep Out keeps the file out, Keep the Plan ends it, and the chat goes on', async t => {
  const { page } = t;
  const { root, project } = await newProject(t, 'Keep out');
  await givenApprovedTasks(t, root, [COUNT]);
  const id = await say(t, 'Build the approved task. TEST_SCRIPT=build-outside');
  const paused = await answered(t, id);
  assert.equal(paused.status, 'waiting', 'paused for the person, not failed or running');
  await page.reload();
  const card = page.locator('.pw-card[aria-label="Pi wants to change a file outside task 1"]'); await card.waitFor();
  const resumed = page.waitForResponse(response => response.url().endsWith('/api/choices/answer'));
  await card.getByRole('button', { name: 'Keep Out', exact: true }).click();
  const next = await answered(t, (await (await resumed).json()).job);
  assert.notEqual(next.status, 'running');
  assert.ok(!exists(root, 'notes', 'extra.py'), 'kept out');
  // This scripted Pi tries the same file again: Gate asks once whether the plan should change; Keep the Plan ends it.
  const replan = page.locator('.pw-card[aria-label="The plan needs to change"]'); await replan.waitFor({ timeout: 10000 });
  const kept = page.waitForResponse(response => response.url().endsWith('/api/choices/answer'));
  await replan.getByRole('button', { name: 'Keep the Plan', exact: true }).click();
  await answered(t, (await (await kept).json()).job);
  assert.ok(!exists(root, 'notes', 'extra.py'), 'still kept out');
  await settledAll(t);
  assert.equal((await chatJobs(t, project)).filter(job => ['queued', 'running'].includes(job.status)).length, 0, 'nothing is stuck');
  assert.ok(decisions(t).some(row => row.answer === 'Keep Out' && row.who === 'person'), 'my answer is recorded');
  // The chat goes on: a plain message runs (a question left waiting never blocks it).
  assert.notEqual((await answered(t, await say(t, 'What is left to do?'))).status, 'running');
});

module.exports = { story, newProject, startProject, pickWhere, choosePhase, say, answered, planAndBuild, givenApprovedTasks, decisions, commits };

// -- the run -----------------------------------------------------------------------------------------------------
if (require.main === module) (async () => {
  const browser = await launch(); let bench = null, context = null, current = null;
  const code = await run({
    async fresh(item) {
      bench = scratch(); await bench.start();
      const t = { bench, directory: bench.directory, get base() { return bench.base; }, errors: [] };
      t.reopen = async (viewport = item.viewport || { width: 1440, height: 900 }) => {
        await context?.close(); context = await browser.newContext({ viewport });
        t.page = await context.newPage();
        await t.page.route('**/api/updates', route => route.fulfill({ json: { state: 'current', checked: 1 } }));  // never the real clone
        t.page.on('pageerror', error => t.errors.push(error.message));
        // A guard, not a step: a project is only ever created or added inside this story's scratch folder (a folder
        // browser that answered late once pointed New Project at the home folder).
        await t.page.route(/\/api\/projects\/(create|register|start)$/, route => {
          const body = route.request().postDataJSON() || {}, where = String(body.parent || body.path || '');
          if (!where.startsWith(bench.directory + '/') && where !== bench.directory) return route.fulfill({ status: 400, json: { error: `Story guard: ${where || 'the data folder'} is outside the scratch folder` } });
          return route.continue();
        });
        return t.page;
      };
      await t.reopen();
      current = t; return t;
    },
    async after(item, error) {
      if (error && process.env.PI_STORIES_VERBOSE) {
        const seen = await current?.page?.evaluate(() => ['#messages', '#error', '#activity-detail'].map(selector => selector + ': ' + (document.querySelector(selector)?.innerText || '').slice(-600).replace(/\n+/g, ' / ')).join('\n      ')).catch(() => '');
        console.log('      page: ' + seen);
        console.log('      server log:\n      ' + bench.log.slice(-15).join('\n      '));
        const events = await bench.api('/api/gate').then(data => data.events.slice(0, 12)).catch(() => []);
        console.log('      gate:\n      ' + events.map(event => [event.phase, event.outcome, event.tool, JSON.stringify(event.args || event.proposal || '').slice(0, 80), String(event.reason || '').slice(0, 140)].join(' | ')).join('\n      '));
      }
      await context?.close(); context = null; await bench.stop(); bench.remove();
    },
  });
  await browser.close();
  process.exitCode = code;
})().catch(error => { console.error(error); process.exitCode = 1; });
