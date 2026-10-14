import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderView, ansiStyle } from '../../harness/terminal-render.mjs';

const cases = JSON.parse(readFileSync('tests/fixtures/terminal-views.json', 'utf8'));

test('the terminal renderer draws exactly what the plain renderer draws (task 171)', () => {
  for (const item of cases) assert.equal(renderView(item.view, item.width, { ascii: item.ascii || false }).join('\n'), item.plain, `${item.view.title} at ${item.width}`);
});

test('in the terminal the title is bold and secondary text dim; no colour', () => {
  const queue = cases.find(item => item.view.title === 'Queue' && item.view.parts[0].rows.length && item.width === 100).view;
  const lines = renderView(queue, 100, { style: ansiStyle });
  assert.match(lines[0], /^── \x1b\[1mQueue\x1b\[22m +\x1b\[2m1 running · 2 need attention\x1b\[22m$/);
  assert.match(lines[3], /\x1b\[2mf954b438\x1b\[22m$/, 'IDs are dim');
  assert.match(lines.at(-1), /^  \x1b\[2m\/job <id>/, 'the hint is dim');
  assert.equal(lines.join('').match(/\x1b\[3\d|\x1b\[9\d/), null, 'no foreground colour');
});
