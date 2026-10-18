// Dashboard and charts (a capability chosen in Project Start): the pinned chart library, its licence and its place in the
// offline shell.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const file = path => readFileSync(new URL(`../${path}`, import.meta.url));
const PINNED = '48444a82d4edcb5bec0f1965faacdde18d9c17db3063d042abada2f705c9f54a'; // Chart.js 4.5.1 (the kit's libraries.json)

test('the chart library is the pinned version, with its licence', () => {
  assert.equal(createHash('sha256').update(file('vendor/chartjs/chart.umd.min.js')).digest('hex'), PINNED, 'vendor/chartjs/chart.umd.min.js is not Chart.js 4.5.1');
  assert.match(String(file('vendor/chartjs/LICENSE.md')), /MIT/);
});

test('the offline shell caches it', () => {
  assert.match(String(file('sw.js')), /['"]vendor\/chartjs\/chart\.umd\.min\.js['"]/);
});
