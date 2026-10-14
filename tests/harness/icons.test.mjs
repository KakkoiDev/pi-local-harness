import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function element(tag) {
  return { tag, attributes: {}, children: [], dataset: {}, setAttribute(k, v) { this.attributes[k] = v; }, append(...n) { this.children.push(...n); } };
}
globalThis.document = { createElementNS: (_, tag) => element(tag), createElement: element, createTextNode: (text) => ({ text }) };

const ui = await import('../../js/ui.mjs');
const design = await import('../../design/icons.mjs');

test('ui.mjs serves the design system icons, not its own set', () => {
  assert.equal(ui.icon, design.icon);
  assert.equal(ui.hydrateIcons, design.hydrateIcons);
  assert.equal(ui.stateGlyph, design.stateGlyph);
});

test('a state is a glyph and a word', () => {
  const glyph = ui.stateGlyph('BLOCK');
  assert.equal(glyph.className, 'pw-glyph');
  assert.equal(glyph.dataset.state, 'BLOCK');
  assert.equal(glyph.children[0].tag, 'svg');
  assert.equal(glyph.children[1].text, 'Blocked');
});

test('every icon the design system lists is drawn (round 5 added more)', () => {
  const listed = JSON.parse(readFileSync('design/system/design-system.json', 'utf8')).assetGroups.Icons.order.map(name => name.replace(/\.svg$/, ''));
  for (const name of listed) assert.ok(name.startsWith('alert-') ? design.ALERT_ICONS[name.slice(6)] : design.ICONS[name], `${name} is drawn in design/icons.mjs`);
});
