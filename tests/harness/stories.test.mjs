// User stories in terminal Pi (task 264, docs/user-stories.md): the extension's own command handlers (harness/phases.mjs,
// harness/console.mjs) against the real services of a scratch workbench (tests/browser/workbench.cjs), so what the
// person types in the terminal and what the web shows are one saved state. No browser and no model: the person's
// select lists are answered by the test, Pi's propose_plan by the Gate call the extension makes for it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { installPhases } from '../../harness/phases.mjs';
import { installConsole } from '../../harness/console.mjs';
import { loadTerminalLanguage, requestLanguage } from '../../harness/language.mjs';

const { scratch } = createRequire(import.meta.url)('../browser/workbench.cjs');

async function workbench(t) {
  const bench = scratch('pi-terminal-stories-'); await bench.start();
  const saved = process.env.PI_AGENT_DATA; process.env.PI_AGENT_DATA = bench.data;  // the console's admin backend reads the same data folder
  t.after(async () => { if (saved === undefined) delete process.env.PI_AGENT_DATA; else process.env.PI_AGENT_DATA = saved; await bench.stop(); bench.remove(); });
  // Terminal Pi's `call` (harness/extension.mjs): Gate on loopback with the run's token and, as the person's own
  // terminal, the person secret from services.py's ready line (task 261).
  bench.gate = async (path, body) => {
    const response = await fetch(`http://127.0.0.1:${bench.ports.gate}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Gate-Token': bench.ports.token, ...(bench.ports.person ? { 'X-Pi-Person': bench.ports.person } : {}) }, body: JSON.stringify(body) });
    const data = await response.json(); if (!response.ok) throw new Error(data.error); return data;
  };
  return bench;
}

/** The person's terminal: command handlers, the select lists they answer and the notices they read. */
function terminal(bench, cwd, answers = []) {
  const commands = {}, notices = [], asked = [];
  const tools = {};
  const pi = { registerCommand: (name, value) => { commands[name] = value; }, registerTool: tool => { tools[tool.name] = tool; }, sendMessage: message => notices.push(message.content) };
  installPhases(pi, { call: bench.gate });
  installConsole(pi, { ports: () => ({ web: bench.ports.web, person: bench.ports.person }) });  // the person's own terminal (task 261)
  const editor = { text: '' };
  const ctx = { cwd, ui: { notify: text => notices.push(text), setEditorText: text => { editor.text = text; }, getEditorText: () => editor.text, setWidget() {},
    select: async (title, options) => { asked.push({ title, options }); const answer = answers.shift(); return typeof answer === 'function' ? answer(options) : answer; } } };
  return { type: (name, args = '') => commands[name].handler(args, ctx), notices, asked, answers, editor, pi: (command, args = '') => tools.harness.execute('story', { command, args }, undefined, undefined, ctx) };
}

test('US-100 terminal: /plan, Pi proposes, /build reviews the tasks and Start Building approves; the web sees the same phase', async t => {
  const bench = await workbench(t);
  const { project } = await bench.api('/api/projects/create', { name: 'Terminal counter', parent: bench.directory, kind: 'empty' });
  const root = join(bench.directory, 'terminal-counter');  // task 327: the folder is a slug of the name
  const person = terminal(bench, root, ['Start Building']);
  await person.type('plan');
  assert.match(person.notices.at(-1), /Phase: Planning/);
  assert.equal((await bench.api('/api/phase?project=' + project)).phase, 'planning', 'one saved phase for web and terminal');
  // Pi's propose_plan, as the extension sends it in Planning
  await bench.gate('/request', { request: 'terminal-1', cwd: root, text: 'Plan a counter' });
  await bench.gate('/plan', { request: 'terminal-1', content: { goal: 'Count clicks.', tasks: [{ title: 'Count clicks', files: ['counter.py', 'tests/'], done_when: 'Each click adds one.', content: 'Test, then implement.' }] } });
  await bench.gate('/request/pause', { request: 'terminal-1' });
  await person.type('build');
  assert.match(person.asked[0].title, /Build the planned tasks[\s\S]*Count clicks[\s\S]*Done when: Each click adds one\./);
  assert.equal(person.asked[0].options[0], 'Start Building');
  assert.match(person.notices.at(-1), /Phase: Implementation/);
  const phase = await bench.api('/api/phase?project=' + project);
  assert.equal(phase.phase, 'implementation'); assert.equal(phase.pending, false, 'Start Building approved the plan');
  assert.match(bench.read(root, phase.tasks.find(task => /count-clicks/.test(task.path)).path), /^Plan approved: chosen /m);
  assert.ok(bench.lines(join(bench.data, 'decisions.jsonl')).some(row => row.kind === 'plan_approval' && row.who === 'person'));
  await person.type('discuss');
  assert.equal((await bench.api('/api/phase?project=' + project)).phase, 'discussion');
});

test('US-101 terminal: /build with nothing planned changes nothing and says to /plan first', async t => {
  const bench = await workbench(t);
  const { project } = await bench.api('/api/projects/create', { name: 'Nothing planned', parent: bench.directory, kind: 'empty' });
  const person = terminal(bench, join(bench.directory, 'nothing-planned'));
  await person.type('build');
  assert.match(person.notices.at(-1), /nothing is planned yet\. \/plan first/);
  assert.equal((await bench.api('/api/phase?project=' + project)).phase, 'discussion');
});

test('US-102 terminal: /auto on shows the risks with Cancel first; Turn On reaches the web, /auto off turns it off', async t => {
  const bench = await workbench(t);
  const person = terminal(bench, bench.directory, [options => options[0], options => options.find(option => option === 'Turn On')]);
  await person.type('auto', 'on');
  assert.deepEqual(person.asked[0].options, ['Cancel', 'Turn On']); assert.match(person.asked[0].title, /Trash/);
  assert.equal((await bench.api('/api/auto')).enabled, false, 'Cancel changes nothing');
  await person.type('auto', 'on');
  assert.equal((await bench.api('/api/auto')).enabled, true, 'the web workbench sees Run on its own');
  await person.type('auto', 'off');
  assert.equal((await bench.api('/api/auto')).enabled, false);
});

test('US-103 terminal: /config set asks first and /undo puts the setting back', async t => {
  const bench = await workbench(t);
  const person = terminal(bench, bench.directory, [options => options.find(option => option !== 'Cancel'), options => options.find(option => option !== 'Cancel')]);
  const config = () => { try { return JSON.parse(bench.read(bench.data, 'config.json')); } catch { return {}; } };
  await person.type('config', 'set silence_seconds 120');
  assert.match(person.asked[0].title, /silence_seconds/);
  assert.equal(config().silence_seconds, 120, JSON.stringify([person.asked, person.notices]));
  await person.type('undo');
  assert.notEqual(config().silence_seconds, 120, '/undo put it back');
  assert.ok(bench.lines(join(bench.data, 'admin-log.jsonl')).length >= 2, 'each change is a line in admin-log.jsonl');
});

test('US-104 terminal: /status and /projects read the live workbench', async t => {
  const bench = await workbench(t);
  await bench.api('/api/projects/create', { name: 'Listed', parent: bench.directory, kind: 'empty' });
  const person = terminal(bench, bench.directory);
  await person.type('projects');
  assert.match(person.notices.at(-1), /Listed/);
  await person.type('status');
  assert.match(person.notices.at(-1), /Web\s+✓/, person.notices.at(-1));
});

test('US-085 terminal: /doctor checks the live workbench and says what to do for each problem', async t => {
  const bench = await workbench(t);
  const person = terminal(bench, bench.directory);
  await person.type('doctor');
  const text = person.notices.at(-1);
  assert.match(text, /Doctor/); assert.match(text, /Ollama/, 'the closed Ollama port is a problem it names'); assert.match(text, /✓|✗|!/);
});

test('US-091 terminal in Japanese: the language chosen in web Settings is the terminal’s on the next request', async t => {
  const bench = await workbench(t);
  t.after(() => loadTerminalLanguage('en'));
  await bench.api('/api/settings', { language: 'ja' });
  const { project } = await bench.api('/api/projects/create', { name: 'Nihongo', parent: bench.directory, kind: 'empty' });
  loadTerminalLanguage(requestLanguage(bench.data, {}));  // what the extension does at each request (harness/extension.mjs)
  const person = terminal(bench, join(bench.directory, 'nihongo'));
  await person.type('plan');
  assert.match(person.notices.at(-1), /フェーズ：計画/);
  assert.equal((await bench.api('/api/phase?project=' + project)).phase, 'planning');
});

test('US-105 terminal: /harness list and /guide <words> answer from the harness itself', async t => {
  const bench = await workbench(t);
  const person = terminal(bench, bench.directory);
  await person.type('harness', 'list');
  assert.match(person.notices.at(-1), /\/status/); assert.match(person.notices.at(-1), /\/guide/);
  await person.type('guide', 'phone');
  assert.match(person.notices.at(-1), /Tailscale/);
});

test('US-106 terminal: Pi only proposes a console change; it goes on my input line and nothing changes', async t => {
  const bench = await workbench(t);
  const person = terminal(bench, bench.directory);
  const before = (() => { try { return bench.read(bench.data, 'config.json'); } catch { return null; } })();
  const result = await person.pi('config', 'set silence_seconds 99');
  assert.equal(person.editor.text, '/config set silence_seconds 99', 'on the input line for the person');
  assert.match(JSON.stringify(result.content), /silence_seconds/);
  const after = (() => { try { return bench.read(bench.data, 'config.json'); } catch { return null; } })();
  assert.equal(after, before, 'nothing changed until the person confirms');
});

test('US-107 terminal: /queue, /job and /gate show a request the web ran and the check Gate made', async t => {
  const bench = await workbench(t);
  const { project } = await bench.api('/api/projects/create', { name: 'Watched', parent: bench.directory, kind: 'empty' });
  const job = await bench.api('/api/jobs/create', { project, message: 'Write it TEST_SCRIPT=write-in-discussion' });
  await bench.job(job.id);
  const person = terminal(bench, bench.directory);
  await person.type('queue', 'all');
  assert.match(person.notices.at(-1), /Write it/);
  await person.type('job', job.id.slice(0, 8));
  assert.match(person.notices.at(-1), /Write it TEST_SCRIPT=write-in-discussion/);
  await person.type('gate');
  assert.match(person.notices.at(-1), /app\.py/); assert.match(person.notices.at(-1), /Revise|Blocked|✗|■/);
});

test('US-226 terminal: /queue edit and /queue remove change a waiting message after asking; Pi’s own harness tool cannot', async t => {
  const bench = await workbench(t);
  const { project } = await bench.api('/api/projects/create', { name: 'Waiting', parent: bench.directory, kind: 'empty' });
  const running = await bench.api('/api/jobs/create', { project, message: 'Work for a while TEST_WAIT' });
  await bench.job(running.id, ['running']);
  const waiting = await bench.api('/api/jobs/create', { project, message: 'Make it blue' });
  const id = waiting.id.slice(0, 8), job = async () => (await bench.api('/api/workspace')).jobs.find(item => item.id === waiting.id);
  const person = terminal(bench, bench.directory, ['Save', 'Cancel', 'Remove Message']);
  await person.type('queue', `edit ${id} Make it red`);
  assert.match(person.asked[0].title, /Save the edited message\?[\s\S]*Before\s+“Make it blue”[\s\S]*After\s+“Make it red”/);
  assert.deepEqual(person.asked[0].options, ['Save', 'Cancel']);
  assert.match(person.notices.at(-1), /✓ Saved\. Pi gets the edited message in the same place\. “Make it red”/);
  assert.deepEqual([(await job()).message, (await job()).version], ['Make it red', 2]);
  await person.pi('queue', `remove ${id}`);  // the model's tool runs harness/admin.py, which only reads
  assert.equal((await job()).status, 'queued', 'Pi cannot remove its own work');
  await person.type('queue', `remove ${id}`);
  assert.deepEqual(person.asked[1].options, ['Cancel', 'Remove Message'], 'Cancel first: removing is destructive');
  assert.match(person.notices.at(-1), /Not changed/); assert.equal((await job()).status, 'queued');
  await person.type('queue', `remove ${id}`);
  assert.match(person.notices.at(-1), /✓ Removed\. Pi will never receive that message\./);
  assert.equal((await job()).status, 'cancelled');
  await person.type('queue', `edit ${id} too late`);
  assert.match(person.notices.at(-1), /✗ No waiting message/);
  const kinds = bench.lines(join(bench.data, 'decisions.jsonl')).filter(row => row.kind.startsWith('queue_')).map(row => [row.kind, row.who]);
  assert.deepEqual(kinds, [['queue_edit', 'person'], ['queue_remove', 'person']]);
  await bench.api('/api/jobs/stop', { id: running.id }); await bench.job(running.id);
});

test('US-325 terminal: /setup packages asks first and installs the project\'s packages', async t => {
  const bench = await workbench(t);
  const { project } = await bench.api('/api/projects/create', { name: 'Habit Tracker', parent: bench.directory, kind: 'web' });
  const root = (await bench.api('/api/workspace')).projects.find(item => item.id === project).path, log = join(bench.directory, 'uv-calls.log');  // task 327: a slug folder
  // A uv stand-in first on PATH (harness/admin.py runs with this process's environment): never a real download.
  writeFileSync(join(bench.directory, 'uv'), `#!/bin/sh\necho "$@" >> '${log}'\ncase "$1" in sync) mkdir -p .venv; echo "Installed 29 packages in 12ms" >&2;; esac\n`, { mode: 0o755 });
  const saved = { PATH: process.env.PATH, PI_NO_DOWNLOADS: process.env.PI_NO_DOWNLOADS };
  process.env.PATH = `${bench.directory}:${process.env.PATH}`; process.env.PI_NO_DOWNLOADS = '';
  t.after(() => { for (const [key, value] of Object.entries(saved)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } });
  const person = terminal(bench, root, ['Install Packages']);
  await person.pi('setup', 'packages');  // Pi's harness tool only proposes it
  assert.equal(person.editor.text, '/setup packages', 'the command waits on my input line');
  assert.equal(existsSync(log), false, 'Pi installed nothing');
  await person.type('setup', 'packages');
  assert.match(person.asked[0].title, /Install the project’s packages\?[\s\S]*Downloads\s+29 packages, about \d+ MB \(download from PyPI/);
  assert.deepEqual(person.asked[0].options, ['Install Packages', 'Cancel']);
  assert.match(person.notices.at(-1), /✓ Installed 29 packages/);
  assert.equal(readFileSync(log, 'utf8').trim(), 'sync --frozen');
  assert.ok(existsSync(join(root, '.venv')));
  const rows = bench.lines(join(bench.data, 'decisions.jsonl')).filter(row => row.kind === 'packages_install');
  assert.deepEqual(rows.map(row => [row.who, row.answer, row.rule]), [['person', 'installed', 'packages.setup']]);
  assert.equal((await bench.api('/api/project-packages?project=' + project)).missing, false);
});

test('US-110 terminal: a phase command outside a project offers the registered projects and applies to the chosen one', async t => {
  const bench = await workbench(t);
  const { project } = await bench.api('/api/projects/create', { name: 'Picked', parent: bench.directory, kind: 'empty' });
  const person = terminal(bench, bench.directory, [options => options.find(option => option.startsWith('Picked'))]);
  await person.type('plan');
  assert.equal(person.asked[0].title, 'Choose a project');
  assert.equal((await bench.api('/api/phase?project=' + project)).phase, 'planning');
});
