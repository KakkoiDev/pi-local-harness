// Installs on a phone (a capability chosen in Project Start): the manifest names the app, its icons exist, and the page
// registers the service worker that caches the shell.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('the manifest names the app, opens like an app, and its icons exist', () => {
  const manifest = JSON.parse(read('manifest.webmanifest'));
  for (const key of ['name', 'short_name', 'start_url']) assert.ok(String(manifest[key] || '').trim(), `the manifest needs ${key}`);
  assert.ok(['standalone', 'fullscreen', 'minimal-ui'].includes(manifest.display), 'it opens like an app');
  assert.ok((manifest.icons || []).length, 'the manifest needs an icon');
  for (const icon of manifest.icons) assert.ok(existsSync(new URL(`../${icon.src}`, import.meta.url)), `missing icon ${icon.src}`);
});

test('the page links the manifest and registers the service worker', () => {
  assert.match(read('index.html'), /<link[^>]+rel=["']manifest["']/, 'index.html links the manifest');
  assert.match(read('js/app.mjs'), /serviceWorker\.register/, 'js/app.mjs registers sw.js');
  assert.match(read('sw.js'), /\bSHELL\s*=\s*\[/, 'sw.js needs its literal SHELL list');
});
