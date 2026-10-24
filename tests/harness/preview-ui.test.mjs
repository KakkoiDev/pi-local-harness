// Round 7 (PreviewWindow, DoneRow): the parts of the Preview and the done row that are plain logic.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { frameFor, appAddress, fixMessage } from '../../js/preview.mjs';
import { firstSentence } from '../../js/done-row.mjs';

test('the sizes: Phone 390, Tablet 768 × 1024 scaled to fit with its percentage, Full the stage (P_Tablet)', () => {
  assert.deepEqual(frameFor('phone', { width: 448, height: 700 }), { width: 390, height: 660, scale: 1, caption: 'Phone · 390 wide' });
  const tablet = frameFor('tablet', { width: 448, height: 700 });
  assert.equal(tablet.caption, 'Tablet · 768 × 1024 · shown at 54%'); assert.ok(tablet.width <= 416 && tablet.height <= 660);
  assert.equal(frameFor('tablet', { width: 2000, height: 1200 }).caption, 'Tablet · 768 × 1024', 'shown at full size: no percentage');
  assert.equal(frameFor('full', { width: 448, height: 700 }).caption, 'Full · 416 wide');
});

test('the address keeps the page and asks for the language (the starters read ?lang=)', () => {
  assert.equal(appAddress('http://127.0.0.1:5000/', '/notes', 'ja'), 'http://127.0.0.1:5000/notes?lang=ja');
  assert.equal(appAddress('http://127.0.0.1:5000/', 'notes'), 'http://127.0.0.1:5000/notes');
});

test('a Preview page cannot replace the app origin', () => {
  for (const path of ['//other.invalid/notes', '/\\other.invalid/notes', '\\\\other.invalid/notes', '/\t/other.invalid/notes']) {
    assert.equal(new URL(appAddress('http://127.0.0.1:5000/', path, 'ja')).origin, 'http://127.0.0.1:5000');
  }
  assert.equal(appAddress('https://app.example:8443/', '/notes?sort=new#last', 'ja'), 'https://app.example:8443/notes?sort=new&lang=ja#last');
});

test('Ask Pi to Fix sends the last line in words and the 8 lines beside it (P_Fixing)', () => {
  const error = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', "ModuleNotFoundError: No module named 'markdown'"].join('\n');
  const sent = fixMessage(error);
  assert.equal(sent.message, "The app stopped. Its last line: ModuleNotFoundError: No module named 'markdown'. Please fix it so the app starts again.");
  assert.equal(sent.lines.length, 8); assert.equal(sent.lines.at(-1), "ModuleNotFoundError: No module named 'markdown'");
});

test('alerts name the request by its first plain sentence (P_Undo)', () => {
  assert.equal(firstSentence(['Added a Delete button to each note. It asks first.']), 'Added a Delete button to each note');
  assert.equal(firstSentence([], 'Delete a note'), 'Delete a note');
  assert.equal(firstSentence(['各メモに削除ボタンを付けました。削除の前に確認します。']), '各メモに削除ボタンを付けました');
});
