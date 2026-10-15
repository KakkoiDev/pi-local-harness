import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stuckPattern, StepWatch } from '../../harness/stuck.mjs';

const step = (tool, input, text, error = false) => ({ tool, input, text, error });

test('the same call with the same result four times is stuck (OpenHands)', () => {
  const watch = new StepWatch();
  for (let i = 0; i < 3; i++) assert.equal(watch.add(step('bash', { command: 'ls' }, 'a b')), null);
  assert.match(watch.add(step('bash', { command: 'ls' }, 'a b')), /the same call 4 times with the same result: bash ls/);
});

test('the same call failing three times is stuck, even when the error text varies a little', () => {
  const watch = new StepWatch();
  watch.add(step('bash', { command: 'pytest' }, 'error at 12:01', true)); watch.add(step('bash', { command: 'pytest' }, 'error at 12:02', true));
  assert.match(watch.add(step('bash', { command: 'pytest' }, 'error at 12:03', true)), /failed 3 times in a row: bash pytest/);
});

test('two calls alternating six times is stuck (ping-pong)', () => {
  const watch = new StepWatch();
  const a = step('edit', { path: 'a.py' }, 'ok'), b = step('bash', { command: 'pytest' }, 'FAILED', true);
  let said = null;
  for (let i = 0; i < 6; i++) said = watch.add(i % 2 ? b : a) || said;
  assert.match(said, /alternated between two calls 6 times/);
});

test('progress is not stuck: different calls, or the same call with new results', () => {
  const watch = new StepWatch();
  for (let i = 0; i < 6; i++) assert.equal(watch.add(step('read', { path: `f${i}.py` }, 'x')), null);
  for (let i = 0; i < 6; i++) assert.equal(watch.add(step('bash', { command: 'pytest' }, `${i} passed`)), null, 'the same command, a new result each time');
  assert.equal(stuckPattern([]), null);
  watch.reset(); assert.equal(watch.steps.length, 0);
});
