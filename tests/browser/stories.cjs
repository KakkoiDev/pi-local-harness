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
async function newProject(t, name, kind = 'empty') {
  const { page } = t;
  await page.goto(t.base + '/projects');
  await page.locator('#new-project').click();
  await page.waitForFunction(() => document.querySelector('#folder-path').value.length > 0 && !document.querySelector('#folder-use').disabled);
  await page.locator('#folder-path').fill(t.directory);
  const browsed = page.waitForResponse(response => response.url().includes('/api/directories?path='));
  await page.locator('#folder-go').click(); await browsed;
  await page.waitForFunction(path => document.querySelector('#folder-path').value === path, t.directory);
  await page.locator('#folder-name').fill(name);
  await page.locator(`#folder-kind [value="${kind}"]`).check();
  await page.locator('#folder-use').click();
  await page.waitForFunction(() => document.body.dataset.view === 'chat' && /\/chat$/.test(location.pathname));
  const project = await page.evaluate(() => location.pathname.split('/')[2]);
  return { project, root: join(t.directory, name) };
}

async function choosePhase(t, name) {
  const { page } = t;
  await page.locator('#phase-button').click();
  await page.locator('#phase-menu').getByRole(/radio/.test(await page.locator('#phase-menu').getAttribute('role')) ? 'radio' : 'menuitemradio', { name: new RegExp('^' + name) }).click();
  await page.waitForFunction(phase => document.querySelector('#phase-button').textContent.includes(phase), name);
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
  await page.waitForFunction(() => document.querySelector('#phase-button').textContent.includes('Implementation'));
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
  await t.page.reload(); await t.page.waitForFunction(() => document.querySelector('#phase-button').textContent.includes('Implementation'));
}
const COUNT = { title: 'Count clicks', files: ['counter.py', 'tests/'], done_when: 'Each click adds one.' };
const RESET = { title: 'Reset the count', files: ['counter.py', 'tests/'], done_when: 'Reset sets the count to zero.' };

/** The check-in card the last request left, and its DoneRow. */
const checkIn = t => t.page.locator('.pw-card').filter({ hasText: 'Waiting for you to check it' }).last();

// -- First run and projects --------------------------------------------------------------------------------------
story('US-001', 'first run: an empty workbench leads to the first project, which opens its chat', async t => {
  const { page } = t;
  await page.goto(t.base);
  const first = page.getByRole('button', { name: 'Create Your First Project…', exact: true }); await first.waitFor();
  assert.equal(await page.locator('#prompt').isDisabled(), true, 'no chat before a project exists');
  await first.click(); await page.locator('#folder-dialog').waitFor();
  await page.waitForFunction(() => document.querySelector('#folder-path').value.length > 0 && !document.querySelector('#folder-use').disabled);
  await page.locator('#folder-path').fill(t.directory);
  const browsed = page.waitForResponse(response => response.url().includes('/api/directories?path='));
  await page.locator('#folder-go').click(); await browsed;
  await page.waitForFunction(path => document.querySelector('#folder-path').value === path, t.directory);
  await page.locator('#folder-name').fill('Hello');
  await page.locator('#folder-kind [value="empty"]').check(); await page.locator('#folder-use').click();
  await page.waitForFunction(() => document.body.dataset.view === 'chat' && !document.querySelector('#prompt').disabled);
  assert.ok(exists(t.directory, 'Hello', 'ROADMAP.md') && exists(t.directory, 'Hello', 'tasks', '001-first-task.md'));
  assert.match(commits(t, join(t.directory, 'Hello')).at(-1), /^.*\|/, 'a git repository with a first commit');
  assert.match(await page.locator('#phase-button').textContent(), /Discussion/, 'every project starts in Discussion');
});

for (const [id, kind, label, identify] of [['US-002', 'web', 'Web app', 'app/main.py'], ['US-003', 'static', 'App with no server', 'js/app.mjs'], ['US-004', 'tui', 'Terminal app', 'app/tui.py'], ['US-005', 'empty', 'Empty folder', null]]) {
  story(id, `create a project of each kind: ${label}`, async t => {
    const made = await newProject(t, label + ' project', kind);
    assert.ok(exists(made.root, 'ROADMAP.md'), 'the plan is there');
    if (identify) assert.ok(exists(made.root, identify), `the ${label} starter's ${identify}`);
    else assert.deepEqual(fs.readdirSync(made.root).filter(name => name !== '.git').sort(), ['ROADMAP.md', 'tasks']);
    assert.equal(t.bench.git(made.root, 'status', '--porcelain').trim(), '', 'everything the starter made is committed');
    await t.page.locator('#work-tab').click();
    await t.page.getByRole('button', { name: 'ROADMAP.md', exact: true }).first().waitFor();
  });
}

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
  assert.match(await check.textContent(), /Next.*ready-to-publish/s, 'the plan ends with its publication audit task');
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

story('US-033', 'a task built without a passing test is committed but marked not verified; Review First is the default and opens the task', async t => {
  const { root } = await newProject(t, 'Untested');
  await givenApprovedTasks(t, root, [COUNT]);
  const id = await say(t, 'Build the approved task. TEST_SCRIPT=build-untested'); await answered(t, id);
  const check = checkIn(t); await check.waitFor();
  assert.match(await check.textContent(), /not verified/);
  assert.equal(await check.locator('.pw-btn--default').textContent(), 'Review First');
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
  await page.waitForFunction(() => document.querySelector('#phase-button').textContent.includes('Implementation'));
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
  assert.match(await check.textContent(), /not verified/); assert.equal(await check.locator('.pw-btn--default').textContent(), 'Review First');
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

story('US-116', 'adjust the site’s colours: the panel opens without Pi, a picker restyles the Preview, Save commits, Undo restores', async t => {
  // The App-with-no-server starter builds its styles with `uv tool run pytailwindcss` (a download, US-066): a stand-in
  // uv on the services' PATH copies Basecoat's tokens into static/app.css and lets the watch wait.
  fs.writeFileSync(join(t.directory, 'uv'), '#!/bin/sh\nfor arg in "$@"; do case "$arg" in --watch*) exec sleep 600;; esac; done\nmkdir -p static && cat vendor/basecoat/css/base/base.css > static/app.css\n', { mode: 0o755 });
  await t.bench.restart(); await t.reopen();
  const { page } = t;
  const { root } = await newProject(t, 'Colours', 'static');
  const original = t.bench.read(root, 'styles', 'input.css');
  // The first project with an app opens its Preview by itself (P_Answers); otherwise the person opens it.
  const opened = await page.waitForFunction(() => document.querySelector('#preview-toggle').getAttribute('aria-pressed') === 'true', null, { timeout: 3000 }).then(() => true, () => false);
  if (!opened) await page.locator('#preview-toggle').click();
  await tokenIs(t, '--primary', 'oklch(0.205 0 0)');
  await page.locator('#prompt').fill('I want to adjust the site’s colours');
  const answered = page.waitForResponse(response => response.url().endsWith('/api/jobs/create'));
  await page.locator('#send').click();
  assert.equal((await (await answered).json()).theme, 'colours');
  const panel = page.locator('.pw-theme[data-group="colours"]'); await panel.locator('.pw-theme__row[data-token="primary"]').waitFor();
  assert.equal((await t.bench.api('/api/workspace')).jobs.length, 0, 'Pi was not asked');
  assert.equal(decisions(t).at(-1).kind, 'theme_panel'); assert.equal(decisions(t).at(-1).who, 'code');
  assert.match(await page.locator('.pw-msg').last().locator('.pw-msg__label').textContent(), /Pi Workbench/);
  assert.match(await panel.locator('.pw-theme__row[data-token="primary"] .pw-theme__contrast').first().textContent(), /✓ AA/);
  await panel.locator('.pw-theme__row[data-token="primary"] .pw-theme__side[data-mode="light"] input[type=color]').first().fill('#ff0000');
  await tokenIs(t, '--primary', '#ff0000');
  assert.equal(t.bench.read(root, 'styles', 'input.css'), original, 'nothing is written before Save');
  await panel.getByRole('button', { name: 'Save', exact: true }).click();
  await page.locator('.pw-workbench-reply', { hasText: 'Theme saved: primary.' }).waitFor();
  assert.match(commits(t, root)[0], /\|Theme: primary$/, 'the person’s own commit');
  assert.match(t.bench.read(root, 'styles', 'input.css'), /\/\* theme: edited in the workbench \*\/\n:root \{\n {2}--primary: #ff0000;\n\}/);
  await tokenIs(t, '--primary', '#ff0000');
  const row = page.locator('.pw-msg', { hasText: 'Theme saved: primary.' }).locator('.pw-done'); await row.getByText('Undo This Request…', { exact: true }).click();
  await page.locator('#alert-message').filter({ hasText: /^Undo “/ }).waitFor(); await page.locator('#alert-danger').click();
  await page.waitForFunction(() => [...document.querySelectorAll('.pw-done__head')].some(head => /Undone/.test(head.textContent)));
  assert.equal(t.bench.read(root, 'styles', 'input.css'), original, 'Undo restores the file');
  await tokenIs(t, '--primary', 'oklch(0.205 0 0)');
});

story('US-117', 'ask in Japanese: サイトの色を調整したい opens the panel; Project › Theme… too; a project without the starter’s CSS says so', async t => {
  const { page } = t;
  await newProject(t, 'Plain');
  await page.locator('#prompt').fill('サイトの色を調整したい');
  const answered = page.waitForResponse(response => response.url().endsWith('/api/jobs/create'));
  await page.locator('#send').click();
  assert.equal((await (await answered).json()).theme, 'colours');
  await page.locator('.pw-theme', { hasText: 'This project has no theme file.' }).waitFor();
  assert.equal((await t.bench.api('/api/workspace')).jobs.length, 0, 'Pi was not asked');
  await page.locator('[aria-controls="menu-project"]').click(); await page.locator('#menu-project [data-command="theme"]').click();
  await page.waitForFunction(() => document.querySelectorAll('.pw-theme').length === 2);
  assert.equal((await fetch(t.base + '/api/theme/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ project: 'x' }) })).status, 403, 'Save is the person’s control only');
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
  await page.waitForFunction(() => document.querySelector('#phase-button').textContent.includes('Planning'));
  const id = await say(t, 'TEST_PHASE_PLAN'); await answered(t, id);
  const card = page.locator('.pw-card[aria-label="Plan"]').last(); await card.waitFor();
  const start = card.getByRole('button', { name: 'Start Building', exact: true });
  assert.ok((await start.boundingBox()).height >= 44, '44 px touch target');
  await start.click();
  await page.waitForFunction(() => document.querySelector('#phase-button').textContent.includes('Implementation'));
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

story('US-118', 'without Laya, a phase word gets the harness’s own notice under the answer, with how to install it', async t => {
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

story('US-119', 'the decisions under an answer name who made each; Change… on my answer says what it redoes, then redoes it', async t => {
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

story('US-120', 'a batch of questions: “Question 1 of 3” with Take All Recommendations answers the rest with their recommendations', async t => {
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

story('US-121', 'Settings › Pi › Detail: Beginner hides decisions made by code; Expert shows them with the rule and the command', async t => {
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

module.exports = { story, newProject, choosePhase, say, answered, planAndBuild, givenApprovedTasks, decisions, commits };

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
        await t.page.route(/\/api\/projects\/(create|register)$/, route => {
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
