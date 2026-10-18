// Round 12 (R12_Fixes, R12_Refusals): the pure parts of the page's fixes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withoutQuestion } from '../../js/choice-text.mjs';
import { resolveLink } from '../../js/work-links.mjs';
import { appShortcuts, CONTROL_OPTION, PHASE_KEYS } from '../../js/shortcuts.mjs';

test('Pi’s text before a choice card drops the card’s question, and nothing else', () => {
  assert.equal(withoutQuestion('Before I build, one question.\n\n**Who writes the notes?**', 'Who writes the notes?'), 'Before I build, one question.');
  assert.equal(withoutQuestion('Before I build. Who writes the notes? Pick one below.', 'Who writes the notes?'), 'Before I build. Pick one below.');
  assert.equal(withoutQuestion('Who writes the notes, and when?', 'Who writes the notes?'), 'Who writes the notes, and when?');
  assert.equal(withoutQuestion('Text', undefined), 'Text');
});

test('a Markdown link in Work resolves inside the project, never outside it', () => {
  assert.deepEqual(resolveLink('projects/p1/ROADMAP.md', 'tasks/002-subjects.md'), { project: 'p1', path: 'projects/p1/tasks/002-subjects.md' });
  assert.deepEqual(resolveLink('projects/p1/tasks/002.md', '../ROADMAP.md#goal'), { project: 'p1', path: 'projects/p1/ROADMAP.md' });
  assert.equal(resolveLink('projects/p1/ROADMAP.md', '../../etc/passwd'), null);
  assert.equal(resolveLink('projects/p1/ROADMAP.md', 'https://example.com/'), null);
  assert.equal(resolveLink('projects/p1/ROADMAP.md', 'javascript:alert(1)'), null);
});

test('the ⌃⌥ family; the moved ⌘ keys only when installed as an app', () => {
  assert.equal(CONTROL_OPTION.Digit3, 'view-activity'); assert.equal(PHASE_KEYS.KeyI, 'implementation');
  const table = { Digit1: 'view-chat', KeyS: 'save', KeyW: 'close-window', 'alt+KeyP': 'toggle-preview' };
  assert.deepEqual(appShortcuts(table, false), { KeyS: 'save' });
  assert.deepEqual(appShortcuts(table, true), table);
  assert.deepEqual(appShortcuts({ KeyN: 'new-project', KeyS: 'save' }, false), { KeyS: 'save' }, 'New Project… is ⌘N only installed as an app (⌃⌥N is New File…)');
});
