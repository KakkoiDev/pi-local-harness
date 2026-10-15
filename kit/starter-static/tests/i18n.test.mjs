import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { choose, translate } from '../js/i18n.mjs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('the person\'s choice wins, then the browser, then English', () => {
  assert.equal(choose('en', ['ja-JP']), 'en');
  assert.equal(choose(null, ['ja-JP', 'en']), 'ja');
  assert.equal(choose('xx', ['fr']), 'en');
  assert.equal(translate({}, { a: 'A' }, 'a'), 'A', 'a missing translation falls back to English');
});

test('every language has every key, and every key the page uses exists', () => {
  const languages = readdirSync(new URL('../messages/', import.meta.url)).map(name => Object.keys(JSON.parse(read(`messages/${name}`))).sort());
  for (const keys of languages) assert.deepEqual(keys, languages[0]);
  const used = [...read('index.html').matchAll(/data-t="([\w.]+)"/g), ...read('js/app.mjs').matchAll(/(?<![\w.])t\('([\w.]+)'\)/g)].map(match => match[1]);
  for (const key of used) assert.ok(languages[0].includes(key), key);
});
