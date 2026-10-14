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

test('a command asks the backend for its view and draws it; Pi reads the same as plain text (task 171)', async () => {
  const commands = {}, messages = [], calls = [], renderers = {};
  const view = { title: 'Gate', parts: [{ kind: 'table', columns: ['TIME', 'DECISION', 'COMMAND'], rows: [['14:02', '✗ Blocked', 'rm -rf /']] }], hint: '/gate why <id>' };
  installConsole({ registerCommand: (name, options) => { commands[name] = options; }, registerMessageRenderer: (type, renderer) => { renderers[type] = renderer; }, sendMessage: message => messages.push(message) },
    { ports: () => ({ web: 3100 }), run: async (name, words, options) => { calls.push([name, words, options]); return { ok: true, code: 0, text: JSON.stringify(view) }; } });
  await commands.gate.handler(' 5  blocked ');
  assert.deepEqual(calls, [['gate', ['5', 'blocked', '--view'], { webPort: 3100 }]]);
  assert.equal(messages[0].customType, 'harness-console'); assert.deepEqual(messages[0].details.view, view);
  assert.match(messages[0].content, /^\/gate 5 blocked\n\n── Gate ─+\n  TIME   DECISION   COMMAND\n  ═+\n  14:02  ✗ Blocked  rm -rf \/\n  \/gate why <id>$/);
  const lines = renderers['harness-console'](messages[0]).render(100);
  assert.match(lines[0], /^── \x1b\[1mGate\x1b\[22m/, 'drawn bold at the terminal width');
  assert.match(commands.status.description, /^Harness: /);
});

test('a failed command reads as the command, then what went wrong', async () => {
  const commands = {}, messages = [];
  installConsole({ registerCommand: (name, options) => { commands[name] = options; }, sendMessage: message => messages.push(message) },
    { run: async () => ({ ok: false, code: 1, text: 'No model named “qwen”. Did you mean qwen3:8b?' }) });
  await commands.models.handler('use qwen');
  assert.match(messages[0].content, /── Models ─+\n  ✗ No model named “qwen”\. Did you mean qwen3:8b\?/);
});

test('a change shows from what to what, names its action, and runs only after it is chosen', async () => {
  const commands = {}, messages = [], calls = [], asked = [];
  const preview = { confirm: true, title: 'Switch to qwen3:8b?', rows: [['Model', 'gemma4 → qwen3:8b'], ['Saved in', 'model.json']], action: 'Switch Model' };
  const run = async (name, words) => { calls.push(words.join(' '));
    if (words.includes('--yes')) return { ok: true, code: 0, text: JSON.stringify({ title: null, parts: [{ kind: 'lines', lines: ['✓ Model is qwen3:8b. /undo goes back to gemma4.'] }] }) };
    return { ok: false, code: 3, text: JSON.stringify({ title: preview.title, parts: [], preview }) }; };
  installConsole({ registerCommand: (name, options) => { commands[name] = options; }, sendMessage: message => messages.push(message) }, { run });
  await commands.models.handler('use qwen3:8b', { ui: { select: async (title, options) => { asked.push([title, options]); return 'Cancel'; } } });
  assert.match(asked[0][0], /^Switch to qwen3:8b\?\n\nModel {6}gemma4 → qwen3:8b\nSaved in {3}model\.json$/); assert.deepEqual(asked[0][1], ['Switch Model', 'Cancel']);
  assert.match(messages.at(-1).content, /○ Not changed\./); assert.equal(calls.some(call => call.includes('--yes')), false, 'nothing without the choice');
  await commands.models.handler('use qwen3:8b', { ui: { select: async () => 'Switch Model' } });
  assert.equal(calls.at(-1), 'use qwen3:8b --yes --view'); assert.match(messages.at(-1).content, /✓ Model is qwen3:8b\. \/undo goes back to gemma4\./);
  const removal = { ...preview, title: 'Remove llama3.2:3b?', action: 'Remove Model', destructive: true };
  installConsole({ registerCommand: (name, options) => { commands[name] = options; }, sendMessage: message => messages.push(message) },
    { run: async () => ({ ok: false, code: 3, text: JSON.stringify({ title: removal.title, parts: [], preview: removal }) }) });
  await commands.models.handler('remove llama3.2:3b', { ui: { select: async (title, options) => { asked.push([title, options]); return options[0]; } } });
  assert.deepEqual(asked.at(-1)[1], ['Cancel', 'Remove Model'], 'destructive: Cancel comes first, so Return cancels');
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
  assert.match(change.content[0].text, /Not changed\. The command is on the person's input line/);
  assert.equal(calls.some(call => call.includes('--yes')), false, 'Pi never applies a change');
});

test('Gate knows the harness tool as a read (task 167)', async () => {
  const { GATE_TOOL_NAMES } = await import('../../harness/extension.mjs');
  assert.equal(GATE_TOOL_NAMES.harness, 'read_file', 'otherwise Gate blocks it as an unknown tool');
});

test('Pi proposes a change on the input line; Return runs it and the person confirms (task 171, T_Changes)', async () => {
  const tools = {}, handlers = {}, ui = { text: '', widgets: {}, setEditorText(text) { this.text = text; }, getEditorText() { return this.text; }, setWidget(key, lines) { this.widgets[key] = lines; } };
  const run = async (name, words) => (name === 'models' && words[0] === 'use' ? { ok: false, code: 3, text: 'Switch to qwen3:8b?' } : { ok: true, code: 0, text: 'output' });
  installConsole({ registerCommand() {}, registerTool: tool => { tools[tool.name] = tool; }, sendMessage() {}, on: (name, fn) => { handlers[name] = fn; } }, { run });
  const result = await tools.harness.execute('t', { command: 'models', args: 'use qwen3:8b' }, undefined, undefined, { ui });
  assert.equal(ui.text, '/models use qwen3:8b'); assert.deepEqual(ui.widgets['harness-proposal'], ['\x1b[2mPi proposed this · Return runs it · Esc clears · nothing changes until you confirm\x1b[22m']);
  assert.match(result.content[0].text, /^Not changed\. The command is on the person's input line/);
  handlers.input?.({ text: '/models use qwen3:8b' }, { ui }); assert.equal(ui.widgets['harness-proposal'], undefined, 'the hint goes once they send something');
  ui.text = 'half-typed'; await tools.harness.execute('t', { command: 'status' }, undefined, undefined, { ui });
  assert.equal(ui.text, 'half-typed', 'never over what the person is typing');
  ui.text = ''; await tools.harness.execute('t', { command: 'status' }, undefined, undefined, { ui });
  assert.equal(ui.text, '/status', 'a question answered from live data offers its command');
});
