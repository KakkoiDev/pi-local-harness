// Task 290: the extension's side of the conversation repairs (a held message reaches Pi after the answer; a phase word
// gets an inline notice; one question at a time).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import harness from '../../harness/extension.mjs';
import { installChoices } from '../../harness/choices.mjs';
process.env.PI_CODING_AGENT_DIR = mkdtempSync(join(tmpdir(), 'pi-agent-dir-'));
for (const key of Object.keys(process.env)) if (/^PI_(HARNESS_|WEB_REMOTE_)/.test(key)) delete process.env[key];

async function web(answers, run) {
  const dir = mkdtempSync(join(tmpdir(), 'pi-conversation-')), saved = { ...process.env }, fetchBefore = globalThis.fetch;
  Object.assign(process.env, { PI_AGENT_DATA: join(dir, 'data'), PI_HARNESS_SHARED_PORT: '1', PI_HARNESS_TOKEN: 't' });
  const handlers = {}, calls = [], notices = [];
  globalThis.fetch = async (url, options) => { const path = new URL(url).pathname; calls.push({ path, body: JSON.parse(options.body) }); return { ok: true, json: async () => answers[path] || {} }; };
  const pi = { on: (name, fn) => { handlers[name] = fn; }, appendEntry() {}, registerEntryRenderer() {}, sendUserMessage() {}, registerTool() {} };
  const ctx = { cwd: dir, ui: { notify: text => notices.push(text), setWidget() {}, setStatus() {} }, abort() {} };
  try { harness(pi, { root: dir + '/', setInterval: () => ({ unref() {} }) }); await handlers.session_start({}, ctx); await run({ handlers, ctx, calls, notices }); }
  finally { handlers.session_shutdown?.(); globalThis.fetch = fetchBefore; for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key]; Object.assign(process.env, saved); rmSync(dir, { recursive: true, force: true }); }
}

test('the message a question interrupted reaches Pi with the answer (review item 4)', async () => {
  await web({ '/request': { root: '/project', planning: {}, advice: null, held: ['Also add a footer'] } }, async ({ handlers, ctx }) => {
    const result = await handlers.input({ source: 'interactive', text: 'Choice: Park or drop? → Park' }, ctx);
    assert.equal(result.action, 'transform');
    assert.match(result.text, /^Choice: Park or drop\? → Park/);
    assert.match(result.text, /Also add a footer/);
  });
  await web({ '/request': { root: '/project', planning: {}, advice: null, held: [] } }, async ({ handlers, ctx }) => {
    assert.equal((await handlers.input({ source: 'interactive', text: 'Hello' }, ctx)).action, 'continue', 'nothing held: the message is unchanged');
  });
});

test('a phase word gets an inline notice in the chat, not a card (review item 5, P2)', async () => {
  const notice = 'Pi cannot change the phase. To move the work, use the phase button: Discussion, Planning or Implementation.';
  await web({ '/request': { root: '/project', planning: {}, advice: { abstained: true, advisory: true, notice } } }, async ({ handlers, ctx, notices, calls }) => {
    await handlers.input({ source: 'interactive', text: 'Explain the planning module' }, ctx);
    assert.ok(notices.includes('Harness notice: ' + notice), JSON.stringify(notices));
    assert.equal(calls.filter(call => call.path === '/choice').length, 0, 'no card');
  });
});

test('a second question in one turn is refused: one question at a time (review P2)', async () => {
  let tool; const pending = [];
  installChoices({ registerTool: value => { tool = value; } }, { web: () => true, pending: async value => pending.push(value) });
  const first = await tool.execute('one', { question: 'First?', options: [{ label: 'A' }, { label: 'B' }], recommended: 0 }, null, null, {});
  assert.equal(first.details.pending, true);
  const second = await tool.execute('two', { question: 'Second?', options: [{ label: 'A' }, { label: 'B' }], recommended: 0 }, null, null, {});
  assert.equal(second.isError, true); assert.match(second.content[0].text, /One question at a time/);
  assert.deepEqual(pending.map(value => value.question), ['First?']);
});

test('the system prompt names the memory file, so Pi can add a lesson to it (task 290)', async () => {
  await web({}, async ({ handlers, ctx }) => {
    const prompt = handlers.before_agent_start({ systemPrompt: 'Base' }).systemPrompt;
    assert.match(prompt, new RegExp(`Current persistent memory \\(${ctx.cwd.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/AGENT\\.md`));
  });
});
