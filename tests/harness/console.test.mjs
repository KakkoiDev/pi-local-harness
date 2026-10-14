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
