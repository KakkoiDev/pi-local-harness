import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { CONSOLE_COMMANDS, installConsole } from '../../harness/console.mjs';

test('the console registers one slash command per admin command, and none of Pi\'s own names (task 159)', () => {
  const admin = JSON.parse(execFileSync('python3', ['-m', 'harness.admin', 'harness', '--json'], { encoding: 'utf8' }));
  assert.deepEqual(Object.keys(CONSOLE_COMMANDS), Object.keys(admin), 'same commands as harness/admin.py, same order');
  const guide = readFileSync('harness/CONSOLE.md', 'utf8');
  for (const name of Object.keys(CONSOLE_COMMANDS)) assert.match(guide, new RegExp('`/' + name), `/${name} is in harness/CONSOLE.md`);
  for (const own of ['settings', 'model', 'thinking', 'compact', 'new', 'session']) assert.equal(own in CONSOLE_COMMANDS, false, `/${own} is Pi's`);
});

test('a command runs the admin backend with its words and the live web port, and shows the output', async () => {
  const commands = {}, messages = [], calls = [];
  installConsole({ registerCommand: (name, options) => { commands[name] = options; }, sendMessage: message => messages.push(message) },
    { ports: () => ({ web: 3100 }), run: async (name, words, options) => { calls.push([name, words, options]); return { ok: true, text: 'BLOCK rm -rf /' }; } });
  await commands.gate.handler(' 5  blocked ');
  assert.deepEqual(calls, [['gate', ['5', 'blocked'], { webPort: 3100 }]]);
  assert.equal(messages[0].customType, 'harness-console'); assert.equal(messages[0].display, true);
  assert.match(messages[0].content, /^Harness console: \/gate 5 blocked\n\n```\nBLOCK rm -rf \/\n```$/);
  assert.match(commands.status.description, /^Harness: /);
});

test('a change is shown and runs only after the person says yes (task 160)', async () => {
  const commands = {}, messages = [], calls = [];
  const run = async (name, words) => { calls.push(words.join(' '));
    if (words.includes('--yes')) return { ok: true, code: 0, text: 'Done. effort: high → low' };
    if (words.includes('--json')) return { ok: false, code: 3, text: JSON.stringify({ confirm: true, title: 'Change effort?', detail: 'effort: high → low' }) };
    return { ok: false, code: 3, text: 'Change effort?' }; };
  installConsole({ registerCommand: (name, options) => { commands[name] = options; }, sendMessage: message => messages.push(message) }, { run });
  const asked = [];
  await commands.config.handler('set effort low', { ui: { confirm: async (title, detail) => { asked.push([title, detail]); return false; } } });
  assert.deepEqual(asked, [['Change effort?', 'effort: high → low']]); assert.match(messages.at(-1).content, /Not changed\./);
  assert.equal(calls.some(call => call.includes('--yes')), false, 'no yes, no change');
  await commands.config.handler('set effort low', { ui: { confirm: async () => true } });
  assert.equal(calls.at(-1), 'set effort low --yes'); assert.match(messages.at(-1).content, /Done\. effort: high → low/);
});

test('Pi gets a harness tool: it reads with the console and only proposes changes (task 167, plan 158 C1)', async () => {
  const tools = {}, calls = [];
  const run = async (name, words) => { calls.push([name, ...words].join(' '));
    if (name === 'config' && words[0] === 'set') return { ok: false, code: 3, text: 'Change effort?\neffort: high → low' };
    return { ok: true, code: 0, text: `output of ${name}` }; };
  installConsole({ registerCommand() {}, registerTool: tool => { tools[tool.name] = tool; }, sendMessage() {} }, { run, ports: () => ({ web: 3100 }) });
  const tool = tools.harness;
  assert.ok(tool, 'registered'); assert.match(tool.description, /instead of bash/); assert.deepEqual(tool.parameters.properties.command.enum, Object.keys(CONSOLE_COMMANDS));
  const status = await tool.execute('t1', { command: 'status' });
  assert.equal(status.content[0].text, 'output of status');
  const guide = await tool.execute('t2', { command: 'guide', args: 'phone' });
  assert.deepEqual(calls.slice(0, 2), ['status', 'guide phone']);
  const change = await tool.execute('t3', { command: 'config', args: 'set effort low' });
  assert.match(change.content[0].text, /Not changed\. This needs the person's yes: ask them to type \/config set effort low/);
  assert.equal(calls.some(call => call.includes('--yes')), false, 'Pi never applies a change');
});

test('Gate knows the harness tool as a read (task 167)', async () => {
  const { GATE_TOOL_NAMES } = await import('../../harness/extension.mjs');
  assert.equal(GATE_TOOL_NAMES.harness, 'read_file', 'otherwise Gate blocks it as an unknown tool');
});
