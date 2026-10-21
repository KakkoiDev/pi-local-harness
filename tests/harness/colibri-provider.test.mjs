// Task 294: Pi reaches a Colibri server (`coli serve`, OpenAI-compatible) as its own provider, beside Ollama.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { colibriModels } from '../../harness/provider.mjs';

process.env.PI_AGENT_DATA = mkdtempSync(join(tmpdir(), 'pi-test-data-'));

function withEnv(values, run) {
  const before = Object.fromEntries(Object.keys(values).map(key => [key, process.env[key]]));
  for (const [key, value] of Object.entries(values)) value === undefined ? delete process.env[key] : process.env[key] = value;
  try { return run(); } finally { for (const [key, value] of Object.entries(before)) value === undefined ? delete process.env[key] : process.env[key] = value; }
}

test('the Colibri provider talks OpenAI completions to colibri_url/v1 with any key', () => {
  const provider = withEnv({ PI_COLIBRI_URL: 'http://127.0.0.1:8123', PI_HARNESS_PROVIDER: undefined, PI_HARNESS_MODEL: undefined }, () => colibriModels());
  assert.equal(provider.api, 'openai-completions');
  assert.equal(provider.baseUrl, 'http://127.0.0.1:8123/v1');
  assert.ok(provider.apiKey, 'Colibri accepts any non-empty key');
  assert.deepEqual(provider.models, [], 'no model is invented when none is chosen or configured');
});

test('the default address is 127.0.0.1:8100, never Gate’s 8000', () => {
  const provider = withEnv({ PI_COLIBRI_URL: undefined }, () => colibriModels());
  assert.equal(provider.baseUrl, 'http://127.0.0.1:8100/v1');
});

test('the model chosen in the menu bar is registered with its vision, and thinking stays off', () => {
  const provider = withEnv({ PI_HARNESS_PROVIDER: 'colibri', PI_HARNESS_MODEL: 'glm-5.3-colibri', PI_HARNESS_MODEL_VISION: '1', PI_HARNESS_MODEL_THINKING: '' },
    () => colibriModels({ models: [{ id: 'qwen36' }] }));
  const glm = provider.models.find(model => model.id === 'glm-5.3-colibri');
  assert.deepEqual(glm.input, ['text', 'image']);
  assert.equal(glm.reasoning, false);
  assert.ok(provider.models.find(model => model.id === 'qwen36'), 'models.json entries stay');
});

test('an Ollama choice does not add its model to the Colibri provider', () => {
  const provider = withEnv({ PI_HARNESS_PROVIDER: 'ollama', PI_HARNESS_MODEL: 'qwen3:8b' }, () => colibriModels());
  assert.deepEqual(provider.models, []);
});

test('the extension registers the colibri provider beside ollama', async () => {
  const providers = [];
  const pi = new Proxy({ registerProvider: (name, config) => providers.push({ name, config }) }, { get: (target, key) => target[key] ?? (() => {}) });
  const { default: harness } = await import('../../harness/extension.mjs');
  await withEnv({ PI_COLIBRI_URL: 'http://127.0.0.1:8124', PI_HARNESS_PROVIDER: 'colibri', PI_HARNESS_MODEL: 'glm-5.3-colibri' }, async () => {
    try { await harness(pi); } catch { /* the rest of the extension needs a real Pi; registration comes first */ }
  });
  const names = providers.map(provider => provider.name);
  assert.ok(names.includes('ollama'));
  const colibri = providers.find(provider => provider.name === 'colibri');
  assert.ok(colibri, 'registered');
  assert.equal(colibri.config.baseUrl, 'http://127.0.0.1:8124/v1');
  assert.ok(colibri.config.models.some(model => model.id === 'glm-5.3-colibri'));
});
