import { test } from 'node:test';
import assert from 'node:assert/strict';
import { boxEdit } from '../../harness/task-box.mjs';

const task = '# 173\n\nKind: bug\n\n- [x] Planned\n- [ ] Red (browser, `tests/browser/chat.cjs`): the round trip\n- [ ] Green: the desk stays\n- [ ] Grey: run the suites\n- [ ] Green check on the phone\n';

test('a box is found by the start of its label, as written loosely by a small model (L-003)', () => {
  const red = boxEdit(task, 'red');
  assert.equal(red.oldText, '- [ ] Red (browser, `tests/browser/chat.cjs`): the round trip');
  assert.equal(red.newText, '- [x] Red (browser, `tests/browser/chat.cjs`): the round trip');
  assert.equal(boxEdit(task, '  Grey:   run ').newText, '- [x] Grey: run the suites', 'spacing and case do not matter');
  assert.equal(boxEdit(task, 'Planned', false).newText, '- [ ] Planned', 'done: false unticks');
});

test('none or several: the answer lists the boxes, so the next call can be exact', () => {
  const several = boxEdit(task, 'Green');
  assert.match(several.error, /2 open boxes start with “Green”/); assert.match(several.error, /- \[ \] Green: the desk stays\n.*- \[ \] Green check on the phone/s);
  const none = boxEdit(task, 'Blue');
  assert.match(none.error, /No open box starts with “Blue”/); assert.match(none.error, /- \[ \] Grey: run the suites/);
  assert.match(boxEdit(task, 'Planned').error, /No open box/, 'already ticked');
  assert.match(boxEdit('- [ ] a\n- [ ] a\n', 'a').error, /2 open boxes/);
});
