// A capability whose test fails (tests only): the base check must stop on it.
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('this capability always fails', () => {
  assert.equal(1 + 1, 3, 'this capability is broken on purpose');
});
