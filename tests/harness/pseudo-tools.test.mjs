// Task 324: tool calls written as text, and turns that only describe a tool call, are System 1's to catch.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pseudoToolCalls } from '../../harness/pseudo-tools.mjs';
import harness from '../../harness/extension.mjs';

test('a tool call written as text becomes a readable note (gemma4 live, ```tool_code, JSON)', () => {
  assert.deepEqual(pseudoToolCalls('Reading.\n<execute_tool>\nread{path:app/db.py}\n</execute_tool>'), { text: 'Reading.\n(Nothing ran: a tool call to read was written as text instead of being called.)', count: 1 });
  assert.equal(pseudoToolCalls('```tool_code\nbash{command: "ls"}\n```').count, 1);
  assert.equal(pseudoToolCalls('{"name": "write", "arguments": {"path": "a.py"}}').text, '(Nothing ran: a tool call to write was written as text instead of being called.)');
  assert.deepEqual(pseudoToolCalls('Use `read` to open a file; JSON like {"a": 1} stays.'), { text: 'Use `read` to open a file; JSON like {"a": 1} stays.', count: 0 });
});

async function turn(answer, { thinking = '', question = 'Plan the icons' } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'pi-pseudo-')), saved = { ...process.env }, fetchBefore = globalThis.fetch;
  Object.assign(process.env, { PI_AGENT_DATA: join(dir, 'data'), PI_HARNESS_SHARED_PORT: '1', PI_HARNESS_TOKEN: 't', PI_HARNESS_WAKE_UPS: '3' });
  const handlers = {}, sent = [], calls = [];
  globalThis.fetch = async url => { const path = new URL(url).pathname; calls.push(path); return { ok: true, json: async () => path === '/verification' ? { verification: { state: 'same', code: [], verified: false } } : {} }; };
  const pi = { on: (name, fn) => handlers[name] = fn, appendEntry() {}, registerEntryRenderer() {}, sendUserMessage: text => sent.push(text) };
  const ctx = { cwd: dir, ui: { notify() {}, setWidget() {}, setStatus() {} } };
  try {
    harness(pi, { root: dir + '/', setInterval: () => ({ unref() {} }) }); await handlers.session_start({}, ctx);
    const results = [];
    for (let round = 0; round < 2; round++) {
      await handlers.input({ source: round ? 'extension' : 'interactive', text: round ? sent.at(-1) : question }, ctx); handlers.agent_start({}, ctx);
      results.push(handlers.message_end({ message: { role: 'assistant', content: [...(thinking ? [{ type: 'thinking', thinking }] : []), ...(answer ? [{ type: 'text', text: answer }] : [])], stopReason: 'stop' } }));
      await handlers.agent_settled({ aborted: false });
    }
    return { sent, results, calls };
  } finally { handlers.session_shutdown?.(); globalThis.fetch = fetchBefore; for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key]; Object.assign(process.env, saved); rmSync(dir, { recursive: true, force: true }); }
}

test('a pseudo tool call is nudged once, whatever the request says, and never stays in the session', async () => {
  const { sent, results } = await turn('[CANARY] <execute_tool>\nread{path:app/db.py}\n</execute_tool>', { question: 'What is in the database file?' });
  assert.equal(sent.length, 1, 'one nudge per request'); assert.match(sent[0], /tool interface/);
  assert.doesNotMatch(results[0].message.content.at(-1).text, /execute_tool/, 'the session keeps the note, not the markup');
});

test('a turn that only describes its tool call (no answer, no tool) is nudged once', async () => {
  const { sent } = await turn('', { thinking: 'I will proceed with the propose_plan call.' });
  assert.deepEqual(sent.map(text => text.replace(/^Continue \(harness wake-up \d+\): /, '')), ['Call the tool you described now; do not describe it.']);
});
