// Game loop and collision (a capability chosen in Project Start): the vendored game engine loads, and its collision check
// tells touching boxes from apart ones.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isOverlapping, vec2, engineInit } from '../vendor/littlejs/littlejs.esm.min.js';

test('two boxes that touch overlap; two apart do not', () => {
  assert.equal(typeof engineInit, 'function', 'the engine starts with engineInit');
  assert.equal(isOverlapping(vec2(0, 0), vec2(2, 2), vec2(1, 1), vec2(2, 2)), true);
  assert.equal(isOverlapping(vec2(0, 0), vec2(2, 2), vec2(10, 10), vec2(2, 2)), false);
});

test('its licence ships with it and the offline shell caches it', () => {
  assert.match(readFileSync(new URL('../vendor/littlejs/LICENSE', import.meta.url), 'utf8'), /MIT/);
  assert.match(readFileSync(new URL('../sw.js', import.meta.url), 'utf8'), /['"]vendor\/littlejs\/littlejs\.esm\.min\.js['"]/);
});
