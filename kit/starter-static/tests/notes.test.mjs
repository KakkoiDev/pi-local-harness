import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAX_TITLE, checkTitle, newestFirst, notesFromBackup } from '../js/logic/notes.mjs';

test('a title is trimmed and must say something', () => {
  assert.deepEqual(checkTitle('  buy   milk '), { title: 'buy milk', problems: [] });
  assert.deepEqual(checkTitle('   ').problems, [{ field: 'title', key: 'error.title_empty' }]);
  assert.deepEqual(checkTitle('x'.repeat(MAX_TITLE + 1)).problems, [{ field: 'title', key: 'error.title_long' }]);
});

test('notes are listed newest first', () => {
  const notes = [{ id: 'a', title: 'first', created: '2026-01-01T00:00:00Z' }, { id: 'b', title: 'second', created: '2026-01-02T00:00:00Z' }];
  assert.deepEqual(newestFirst(notes).map(note => note.title), ['second', 'first']);
});

test('a backup brings back only well-formed notes', () => {
  assert.deepEqual(notesFromBackup({ notes: [{ id: 'a', title: 'ok', created: 'x' }, { id: 1 }, null] }), [{ id: 'a', title: 'ok', created: 'x' }]);
  assert.deepEqual(notesFromBackup('nonsense'), []);
});
