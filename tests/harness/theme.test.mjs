import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { contrast, parseColour, toHex, toHsv, fromHsv, toOklch, distance } from '../../js/theme-colors.mjs';
import { installTheme, themeLines } from '../../harness/theme.mjs';

test('the panel reads Basecoat’s oklch colours as picker hex and checks WCAG contrast', () => {
  assert.equal(toHex('oklch(1 0 0)'), '#ffffff'); assert.equal(toHex('oklch(0 0 0)'), '#000000');
  assert.equal(toHex('oklch(0.205 0 0)'), '#171717');  // Basecoat's primary
  assert.equal(toHex('#3b82f6'), '#3b82f6'); assert.equal(toHex('rgb(255 0 0)'), '#ff0000'); assert.equal(toHex('hsl(120 100% 50%)'), '#00ff00');
  assert.equal(toHex('url(x)'), ''); assert.equal(parseColour('oklch(1 0 0 / 10%)').a, 0.1);
  assert.equal(Math.round(contrast('#000000', '#ffffff')), 21); assert.equal(contrast('#777777', '#777777'), 1);
  assert.ok(contrast('oklch(0.985 0 0)', 'oklch(0.205 0 0)') >= 4.5, 'Basecoat’s primary pair passes AA');
  assert.equal(contrast('nope', '#fff'), null);
});

test('the round 12 picker: HSV round-trips, the oklch a hex maps to, and chart colours too close to tell apart', () => {
  for (const hex of ['#e8590c', '#2563eb', '#16a34a', '#000000', '#ffffff', '#777777']) { const { h, s, v } = toHsv(hex); assert.equal(fromHsv(h, s, v), hex); }
  assert.equal(fromHsv(0, 1, 1), '#ff0000'); assert.equal(fromHsv(120, 1, 1), '#00ff00'); assert.equal(toHsv('nope'), null);
  assert.equal(toOklch('#ffffff'), 'oklch(1 0 0)'); assert.equal(toOklch('#e8590c'), 'oklch(0.644 0.192 41.7)');
  assert.equal(toHex(toOklch('#2563eb')), '#2563eb', 'the oklch shown maps back to the same hex');
  assert.ok(distance('#2563eb', '#1d4ed8') < 0.1, 'two neighbouring blues are hard to tell apart');
  assert.ok(distance('#2563eb', '#ea580c') > 0.3); assert.equal(distance('x', '#fff'), null);
});

test('/theme prints the tokens and the file, and says when there is no theme file', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'pi-theme-'));
  try {
    assert.deepEqual(themeLines(dir), ['This project has no theme file.']);
    mkdirSync(join(dir, 'styles')); mkdirSync(join(dir, 'vendor/basecoat/css/base'), { recursive: true });
    writeFileSync(join(dir, 'vendor/basecoat/css/base/base.css'), ':root {\n  --radius: 0.625rem;\n  --primary: oklch(0.205 0 0);\n}\n\n.dark {\n  --primary: oklch(0.922 0 0);\n}\n');
    writeFileSync(join(dir, 'styles/input.css'), '@import "tailwindcss";\n@import "../vendor/basecoat/css/basecoat.css";\n\n/* theme: edited in the workbench */\n:root {\n  --primary: #ff0000;\n}\n/* theme: end */\n');
    const lines = themeLines(dir);
    assert.equal(lines[0], `Theme: ${join(dir, 'styles/input.css')}`);
    assert.ok(lines.includes('  --primary: #ff0000 · dark oklch(0.922 0 0) (changed)'), lines.join('\n'));
    assert.ok(lines.includes('  --radius: 0.625rem'));
    const commands = {}, notices = [];
    installTheme({ registerCommand: (name, value) => { commands[name] = value; }, registerTool: () => assert.fail('the theme is not a Pi tool') });
    await commands.theme.handler('', { cwd: dir, ui: { notify: text => notices.push(text) } });
    assert.match(notices[0], /Project › Theme…/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
