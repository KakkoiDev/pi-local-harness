// Works offline (a capability chosen in Project Start): the data stays on the device and the service worker caches every
// file the page needs, so the app opens without a connection.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const shell = () => {
  const found = read('sw.js').match(/\bSHELL\s*=\s*\[([\s\S]*?)\]/);
  assert.ok(found, 'sw.js needs its literal SHELL list');
  return [...found[1].matchAll(/['"]([^'"]+)['"]/g)].map(match => match[1]);
};
const modules = folder => readdirSync(new URL(`../${folder}/`, import.meta.url), { withFileTypes: true })
  .flatMap(entry => entry.isDirectory() ? modules(`${folder}/${entry.name}`) : entry.name.endsWith('.mjs') ? [`${folder}/${entry.name}`] : []);

test('the service worker caches the page, every script, every language and the manifest', () => {
  const cached = shell();
  const needed = ['index.html', 'manifest.webmanifest', ...modules('js'),
    ...readdirSync(new URL('../messages/', import.meta.url)).map(name => `messages/${name}`),
    ...[...read('index.html').matchAll(/\b(?:src|href)\s*=\s*['"]([^'"#?]+)['"]/g)].map(match => match[1]).filter(path => !/^[a-z]+:|^\/\//i.test(path))];
  assert.deepEqual([...new Set(needed)].filter(path => !cached.includes(path)), [], 'add these to SHELL in sw.js');
});

test('a request that fails offline is answered from the cache', () => {
  const worker = read('sw.js');
  assert.match(worker, /addEventListener\(\s*['"]fetch['"]/, 'sw.js answers requests');
  assert.match(worker, /caches\.match/, 'sw.js falls back to the cache');
});

test('the data is kept on the device', () => {
  assert.match(read('js/store.mjs'), /indexedDB\.open/, 'js/store.mjs keeps the data in IndexedDB');
});
