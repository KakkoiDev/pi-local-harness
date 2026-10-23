// Task 326: Pi's ollama provider goes through the tool-call repair proxy, each request names its harness request, and
// every Pi session (web and terminal) is told to answer tersely.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { installToolRepair, sameAddress, REQUEST_FIELD } from '../../harness/tool-repair.mjs';
import { terseStyle } from '../../harness/terse.mjs';
import { localModels } from '../../harness/provider.mjs';
import harness from '../../harness/extension.mjs';

process.env.PI_CODING_AGENT_DIR = mkdtempSync(join(tmpdir(), 'pi-agent-dir-'));
for (const key of Object.keys(process.env)) if (/^PI_(HARNESS_|WEB_REMOTE_)/.test(key)) delete process.env[key];
process.env.PI_AGENT_DATA = mkdtempSync(join(tmpdir(), 'pi-test-data-'));
process.env.PI_OLLAMA_URL = 'http://127.0.0.1:9';

function fakePi() {
  const handlers = {}, providers = [];
  const pi = new Proxy({ on: (name, fn) => { (handlers[name] ||= []).push(fn); }, registerProvider: (name, config) => providers.push({ name, config }) }, { get: (target, key) => target[key] ?? (() => {}) });
  return { pi, handlers, providers };
}

test('the provider is routed through the proxy only when it points at the workbench’s own Ollama', () => {
  process.env.PI_HARNESS_TOOL_REPAIR_URL = 'http://127.0.0.1:4321/v1';
  try {
    let fake = fakePi(); installToolRepair(fake.pi, { config: {}, localModels });
    assert.equal(fake.providers.length, 1, 'the default provider follows PI_OLLAMA_URL and routes through its own proxy');
    fake = fakePi(); installToolRepair(fake.pi, { config: { baseUrl: 'http://localhost:9/v1/' }, localModels });
    assert.equal(fake.providers.at(-1).config.baseUrl, 'http://127.0.0.1:4321/v1', 'localhost and a trailing slash are the same address');
    assert.ok(fake.providers.at(-1).config.models.length, 'the models stay');
    fake = fakePi(); installToolRepair(fake.pi, { config: { baseUrl: 'http://ollama.example:11434/v1' }, localModels });
    assert.equal(fake.providers.length, 0, 'an Ollama elsewhere is left alone');
    fake = fakePi(); installToolRepair(fake.pi, { config: { baseUrl: 'http://127.0.0.1:9/v1' }, localModels, bare: true });
    assert.equal(fake.providers.length, 0, 'the bench baseline runs plain Pi');
  } finally { delete process.env.PI_HARNESS_TOOL_REPAIR_URL; }
  const fake = fakePi(); const repair = installToolRepair(fake.pi, { config: { baseUrl: 'http://127.0.0.1:9/v1' }, localModels });
  assert.equal(fake.providers.length, 0, 'terminal Pi: nothing until the services announce the proxy');
  assert.equal(repair.route('http://127.0.0.1:5555/v1'), true);
  assert.equal(fake.providers.at(-1).config.baseUrl, 'http://127.0.0.1:5555/v1');
  assert.ok(sameAddress('http://localhost:11434/v1', 'http://127.0.0.1:11434/v1/'));
});

test('each request to the proxy names its harness request; other providers never get the field', () => {
  let id = 'job-7';
  const fake = fakePi(); const repair = installToolRepair(fake.pi, { config: { baseUrl: 'http://127.0.0.1:9/v1' }, localModels, request: () => id });
  const [tag] = fake.handlers.before_provider_request;
  const payload = { model: 'gemma4:e4b-mlx', messages: [] };
  assert.equal(tag({ payload }, { model: { provider: 'ollama' } }), undefined, 'not routed yet');
  repair.route('http://127.0.0.1:5555/v1');
  assert.deepEqual(tag({ payload }, { model: { provider: 'ollama' } }), { ...payload, [REQUEST_FIELD]: 'job-7' });
  assert.equal(tag({ payload }, { model: { provider: 'openai' } }), undefined);
  id = undefined; assert.equal(tag({ payload }, { model: { provider: 'ollama' } }), undefined);
});

test('every Pi session is told to answer tersely, web and terminal, and keeps the canary protocol', () => {
  assert.match(terseStyle, /Answer as briefly as possible\./);
  assert.match(terseStyle, /ask_choices/); assert.match(terseStyle, /verified/); assert.match(terseStyle, /never weaken a test/);
  assert.match(terseStyle, /\[CANARY\]/);
  const dir = mkdtempSync(join(tmpdir(), 'pi-terse-')); writeFileSync(join(dir, 'AGENT.md'), 'Start every user-facing response with [CANARY].');
  const prompt = () => { const fake = fakePi(); harness(fake.pi, { root: dir + '/' }); return fake.handlers.before_agent_start[0]({ systemPrompt: 'Base' }).systemPrompt; };
  const terminal = prompt();
  assert.ok(terminal.includes(terseStyle), 'terminal Pi');
  assert.match(terminal, /Start every user-facing response with \[CANARY\]/, 'the memory and its canary stay');
  process.env.PI_HARNESS_SHARED_PORT = '1';
  try { assert.ok(prompt().includes(terseStyle), 'a web worker'); } finally { delete process.env.PI_HARNESS_SHARED_PORT; }
  process.env.PI_HARNESS_BARE = '1';
  try { assert.ok(!prompt().includes(terseStyle), 'the bench baseline stays plain Pi'); } finally { delete process.env.PI_HARNESS_BARE; }
});
