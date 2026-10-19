// The test protocol, checked with test-core's tools (test-core/, MIT): part of the base check, offline, no
// browser (the tools are Python's standard library: python3, or $PYTHON).
// - every scenario in SCENARIOS.md has one e2e test named after its title (scenarios.py);
// - every button, link and field on the page has an e2e step, and no e2e test names a control that is gone
//   (e2e_coverage.py; texts in every language come from messages/*.json through data-t);
// - no test waits for time, is left focused or reaches a real host (flaky_lint.py).
// A failure says what to add or remove, word for word.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const tool = (name, ...args) => {
  const run = spawnSync(process.env.PYTHON || 'python3', ['-I', '-B', `test-core/tools/${name}`, ...args], { cwd: ROOT, encoding: 'utf8', timeout: 120000 });
  return { code: run.status, said: `${run.stdout ?? ''}${run.stderr ?? ''}${run.error ? String(run.error) : ''}` };
};
const listed = (folder, pattern) => readdirSync(new URL(`../${folder}`, import.meta.url)).filter(name => pattern.test(name)).sort().map(name => `${folder}${name}`);
const e2e = () => listed('tests/e2e/', /\.m?js$/);

test('every scenario has its e2e test named after its title', () => {
  const { code, said } = tool('scenarios.py', 'check', 'SCENARIOS.md', '--tests', ...e2e());
  assert.equal(code, 0, said);
});

test('every control has an e2e step and no e2e test names a control that is gone', () => {
  const { code, said } = tool('e2e_coverage.py', '--pages', ...listed('', /\.html$/), '--tests', ...e2e(), '--messages', ...listed('messages/', /\.json$/), '--text-attribute', 'data-t');
  assert.equal(code, 0, said);
});

test('no test waits for time, is left focused or reaches a real host', () => {
  const { code, said } = tool('flaky_lint.py', 'tests');
  assert.equal(code, 0, said);
});
