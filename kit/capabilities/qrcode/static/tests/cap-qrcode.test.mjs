// Share by QR code (a capability chosen in Project Start): the vendored QR code library draws a code, and the offline
// shell caches it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import qrcode from '../vendor/qrcode/qrcode.mjs';

test('it draws a scalable QR code for an address', () => {
  const code = qrcode(0, 'M');
  code.addData('https://example.com/');
  code.make();
  assert.ok(code.getModuleCount() >= 21, 'a QR code is at least 21 modules wide');
  assert.match(code.createSvgTag({ cellSize: 4, margin: 4, scalable: true }), /^<svg[\s\S]*<\/svg>$/);
});

test('its licence ships with it and the offline shell caches it', () => {
  assert.match(readFileSync(new URL('../vendor/qrcode/LICENSE', import.meta.url), 'utf8'), /MIT/);
  assert.match(readFileSync(new URL('../sw.js', import.meta.url), 'utf8'), /['"]vendor\/qrcode\/qrcode\.mjs['"]/);
});
