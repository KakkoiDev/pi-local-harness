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
  await t.bench.restart({ PI_FAKE_SESSION_CWD: '1' }); await t.reopen();
  const { page } = t;
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
}, { xfail: 'review P0-3: a renamed project keeps Pi’s old session folder' });

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
story('US-030', 'plan in Planning, Start Building, Pi builds the task test-first: a verified commit waits for Accept Task', async t => {
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
  await check.getByRole('button', { name: 'Accept Task', exact: true }).click();
  await page.getByText(/All 1 planned tasks are built/).waitFor();
  const kinds = decisions(t).map(row => `${row.kind}:${row.who}`);
  for (const expected of ['plan_layout:code', 'plan_approval:person', 'box_ticked:code', 'step_done:code', 'task_acceptance:person'])
    assert.ok(kinds.includes(expected), `decision log has ${expected}: ${kinds.join(', ')}`);
}, { xfail: 'NEW-1 (not in the review): propose_plan appends the “Request …” line inside the first task’s ## Decisions, so G-017 refuses every write of the first planned task' });

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
}, { xfail: 'review P0-1: a trivial edit plus any earlier failing run still gets a code task verified' });

story('US-035', 'a plain question while a task is being built does not end that task', async t => {
  const { page } = t;
  const { root } = await newProject(t, 'Curious');
  await givenApprovedTasks(t, root, [COUNT]);
  const id = await say(t, 'How does the counter keep its value? TEST_SCRIPT=question-in-build'); await answered(t, id);
  await page.locator('#messages').getByText('The roadmap lists one task in progress.', { exact: true }).waitFor();
  assert.equal(await page.locator('.pw-card').filter({ hasText: 'Waiting for you to check it' }).count(), 0, 'no check-in for a question');
  const task = fs.readdirSync(join(root, 'tasks')).find(name => /count-clicks/.test(name));
  assert.doesNotMatch(t.bench.read(root, 'tasks', task), /Not verified/, 'the task is still in progress');
}, { xfail: 'review item 6: a plain question in Implementation attaches to the active task and ends it “not verified”' });

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
  const resumed = page.waitForResponse(response => response.url().endsWith('/api/jobs/create'));
  await card.getByRole('button', { name: 'Answer', exact: true }).click();
  await answered(t, (await (await resumed).json()).id);
  await page.locator('.pw-card--settled').filter({ hasText: 'A team' }).waitFor();
  assert.doesNotMatch(await page.locator('#messages').innerText(), /I could not show it/, 'the plan was refused');
  const plan = page.locator('.pw-card[aria-label="Plan"]').last(); await plan.waitFor();
  const task = fs.readdirSync(join(root, 'tasks')).find(name => /count-clicks/.test(name));
  assert.match(t.bench.read(root, 'tasks', task), /- Who uses it\?: A team \(chosen /, 'the answer is in the planned task’s Decisions');
  assert.ok(decisions(t).some(row => row.kind === 'question_answer' && row.who === 'person'));
}, { xfail: 'review item 6: a question with a choice in Planning creates its own task file and roadmap line, so the plan’s Goal check fails (G-014) and the plan never shows' });

story('US-041', 'a choice in Discussion: the answer stays in harness data and the project is untouched', async t => {
  const { page } = t;
  const { root } = await newProject(t, 'Colours');
  const before = t.bench.git(root, 'rev-parse', 'HEAD');
  const id = await say(t, 'Which colours? TEST_SCRIPT=discuss-choice'); await answered(t, id);
  const card = page.locator('.pw-card[aria-label="Which colours?"]'); await card.waitFor();
  const resumed = page.waitForResponse(response => response.url().endsWith('/api/jobs/create'));
  await card.getByRole('button', { name: 'Answer', exact: true }).click();
  await answered(t, (await (await resumed).json()).id);
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
}, { xfail: 'review item 9: a choice click destroys the composer’s draft' });

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
}, { xfail: 'review item 11: leaving Implementation during a check-in strands the plan (Implementation is refused while the check-in waits)' });

story('US-088', 'answer a question Pi asks in the middle of building: the code written before it is part of the verified task', async t => {
  const { page } = t;
  const { root } = await newProject(t, 'Midway');
  await givenApprovedTasks(t, root, [COUNT]);
  const id = await say(t, 'Build the approved task. TEST_SCRIPT=build-with-question'); await answered(t, id);
  const card = page.locator('.pw-card[aria-label="Start the count at?"]'); await card.waitFor();
  const resumed = page.waitForResponse(response => response.url().endsWith('/api/jobs/create'));
  await card.getByRole('button', { name: 'Answer', exact: true }).click();
  await answered(t, (await (await resumed).json()).id);
  const check = checkIn(t); await check.waitFor();
  assert.doesNotMatch(await check.textContent(), /not verified/, 'the check-in: ' + await check.textContent());
  assert.equal(t.bench.git(root, 'status', '--porcelain', '--', 'counter.py').trim(), '', 'counter.py is committed with the task');
  const task = fs.readdirSync(join(root, 'tasks')).find(name => /count-clicks/.test(name));
  assert.match(t.bench.read(root, 'tasks', task), /- Start the count at\?: Zero \(chosen /);
}, { xfail: 'review item 10: code written before a choice pause counts as the person’s edit, the task ends “no implementation” and the files stay uncommitted' });

story('US-089', 'an approved docs task with no change at all is not verified', async t => {
  const { root } = await newProject(t, 'Docs');
  await givenApprovedTasks(t, root, [{ title: 'Explain the app', kind: 'docs', files: ['README.md'], done_when: 'The README explains the app.' }]);
  const id = await say(t, 'Build the approved task. TEST_SCRIPT=docs-nothing'); await answered(t, id);
  const check = checkIn(t); await check.waitFor();
  assert.match(await check.textContent(), /not verified/, 'nothing changed, yet: ' + await check.textContent());
}, { xfail: 'review item 7: approved docs or chore tasks with no change at all complete “verified”' });

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

story('US-045', 'Run on its own: the risks first, then Pi chooses, plans, builds two tasks and leaves a report', async t => {
  const { page } = t;
  const { root } = await newProject(t, 'Alone');
  await turnOnRunOnItsOwn(t);
  await choosePhase(t, 'Planning');
  const id = await say(t, 'Make a counter with a reset TEST_SCRIPT=auto-two-tasks'); await answered(t, id);
  const events = (await t.bench.api('/api/gate')).events.filter(event => event.outcome === 'REVISE').map(event => event.reason);
  assert.deepEqual(events, [], 'Gate refused Pi’s work while it ran on its own');
  const report = page.locator('.pw-card').filter({ hasText: 'Ran on its own' }).last(); await report.waitFor();
  assert.match(await report.textContent(), /Done · 2 tasks/); assert.match(await report.textContent(), /Decided on its own · [1-9]/);
  assert.equal(commits(t, root).filter(line => /^Pi Workbench\|.*\(task \d+\)$/.test(line)).length, 2, 'two verified task commits');
  const automatic = decisions(t).filter(row => row.automatic);
  assert.ok(automatic.some(row => row.kind === 'plan_approval') && automatic.some(row => row.kind === 'task_acceptance'));
}, { xfail: 'review item 6 (the automatic choice in Planning creates its own task, so the plan fails G-014) and NEW-1 (the first planned task cannot be written)' });

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
  await page.locator('#messages, #error').filter({ hasText: /Model crashed|failed|stopped/i }).first().waitFor({ timeout: 5000 });
}, { xfail: 'review P2 “a crash mid-answer keeps the partial text only in Activity; the chat shows nothing”' });

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
}, { xfail: 'review item 14: every refused shell command crashes Gate with an active request (G-011, never logged)' });

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
}, { xfail: 'review item 13: .env values and secrets/ go into Pi’s context; .gitignore is ignored' });

story('US-081', 'only the person can change the phase: a local process without the page cannot', async t => {
  const { page } = t;
  await newProject(t, 'Guarded');
  const project = await page.evaluate(() => location.pathname.split('/')[2]);
  const response = await fetch(t.base + '/api/phase', { method: 'POST', headers: { 'Content-Type': 'application/json', Host: new URL(t.base).host }, body: JSON.stringify({ project, phase: 'planning' }) });
  assert.equal(response.status, 403, 'a script on this Mac changed the phase as “the person”');
}, { xfail: 'review P0-2: any local process can change the phase, approve a plan, turn on Run on its own or accept a task' });

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
