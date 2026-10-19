// Task 323: the same refused command twice is a refusal loop; the harness nudges once toward allowed tools. Never a question.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import harness from '../../harness/extension.mjs';

async function request(gateResults, { answer = '[CANARY] I cannot run that command.' } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'pi-refusal-')), saved = { ...process.env }, fetchBefore = globalThis.fetch;
  Object.assign(process.env, { PI_AGENT_DATA: join(dir, 'data'), PI_HARNESS_SHARED_PORT: '1', PI_HARNESS_TOKEN: 't', PI_HARNESS_WAKE_UPS: '3' });
  const handlers = {}, sent = [], choices = [];
  let gate = 0;
  globalThis.fetch = async (url, init) => {
    const path = new URL(url).pathname;
    if (path === '/choice' || path === '/request/choice') choices.push(path);
    const body = path === '/gatekeep' ? gateResults[Math.min(gate++, gateResults.length - 1)] : path === '/verification' ? { verification: { state: 'same', code: [], verified: false } } : {};
    return { ok: true, json: async () => body };
  };
  const pi = { on: (name, fn) => handlers[name] = fn, appendEntry() {}, registerEntryRenderer() {}, sendUserMessage: text => sent.push(text) };
  const ctx = { cwd: dir, ui: { notify() {}, setWidget() {}, setStatus() {} }, abort() {} };
  try {
    harness(pi, { root: dir + '/', setInterval: () => ({ unref() {} }) }); await handlers.session_start({}, ctx);
    const blocks = [];
    for (let round = 0; round < 2; round++) {
      await handlers.input({ source: round ? 'extension' : 'interactive', text: round ? sent.at(-1) : 'Check the tests' }, ctx); handlers.agent_start({}, ctx);
      for (let call = 0; call < 2; call++) blocks.push(await handlers.tool_call({ toolName: 'bash', toolCallId: `c${round}${call}`, input: { command: 'python3 app.py' } }));
      handlers.message_end({ message: { role: 'assistant', content: [{ type: 'text', text: answer }], stopReason: 'stop' } });
      await handlers.agent_settled({ aborted: false });
    }
    return { sent, blocks, choices };
  } finally { handlers.session_shutdown?.(); globalThis.fetch = fetchBefore; for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key]; Object.assign(process.env, saved); rmSync(dir, { recursive: true, force: true }); }
}

const refused = { outcome: 'REVISE', rule: 'G-015', reason: 'G-015 Not run. Instead: `python3 -m unittest discover -s tests`. Continue with allowed tools.', instead: 'Instead: `python3 -m unittest discover -s tests`. Continue with allowed tools.', judgement: { who: 'code', advisory: true } };

test('the same refused command again nudges once toward the checked alternative, and asks the person nothing', async () => {
  const { sent, blocks, choices } = await request([{ ...refused, repeat: false }, { ...refused, repeat: true, reason: 'Refused again: the same command. ' + refused.reason }]);
  assert.ok(blocks.every(block => block?.block), 'the refusal stands');
  assert.equal(sent.length, 1, 'one nudge per request');
  assert.match(sent[0], /stays refused/); assert.match(sent[0], /python3 -m unittest discover -s tests/);
  assert.deepEqual(choices, [], 'no question for the person');
});

test('a single refusal that Pi recovers from is not nudged', async () => {
  const { sent } = await request([{ ...refused, repeat: false }, { outcome: 'ALLOW', proposal_id: 'p' }], { answer: '[CANARY] Tests pass.' });
  assert.equal(sent.length, 0);
});
