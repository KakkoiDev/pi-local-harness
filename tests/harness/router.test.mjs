import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRoute, routePath } from '../../js/router.mjs';

test('paths name the level, project, view and file', () => {
  assert.deepEqual(parseRoute('/projects'), { level: 'projects' });
  assert.deepEqual(parseRoute('/p/abc/chat'), { level: 'project', project: 'abc', view: 'chat' });
  assert.deepEqual(parseRoute('/p/abc/work'), { level: 'project', project: 'abc', view: 'work' });
  assert.deepEqual(parseRoute('/p/abc/work/tasks/001-first%20task.md'), { level: 'project', project: 'abc', view: 'work', file: 'projects/abc/tasks/001-first task.md' });
  assert.deepEqual(parseRoute('/'), {});
  assert.deepEqual(parseRoute('/p/abc/nonsense'), {});
});

test('old query links keep working', () => {
  assert.deepEqual(parseRoute('/', '?document=projects/abc/ROADMAP.md'), { level: 'project', project: 'abc', view: 'work', file: 'projects/abc/ROADMAP.md' });
  assert.deepEqual(parseRoute('/', '?chat=c1'), { chat: 'c1', view: 'chat' });
});

test('paths round trip', () => {
  for (const route of [{ level: 'projects' }, { level: 'project', project: 'abc', view: 'chat' },
    { level: 'project', project: 'abc', view: 'work', file: 'projects/abc/docs/a b#c.md' }, { level: 'projects', view: 'gate' }])
    assert.deepEqual(parseRoute(routePath(route)), route);
  assert.equal(routePath({ level: 'project', project: 'abc', view: 'work', file: 'projects/abc/docs/a b#c.md' }), '/p/abc/work/docs/a%20b%23c.md');
  assert.equal(routePath({ level: 'project', project: 'abc', view: 'work', file: 'projects/other/x.md' }), '/p/abc/work', 'a file from another project is not put in the path');
});

test('Activity and Gate are app windows with their own addresses (task 127)', () => {
  assert.deepEqual(parseRoute('/activity'), { level: 'projects', view: 'activity' });
  assert.deepEqual(parseRoute('/gate'), { level: 'projects', view: 'gate' });
  assert.deepEqual(parseRoute('/p/abc/activity'), { level: 'projects', view: 'activity' }, 'old project-scoped address');
  assert.deepEqual(parseRoute('/p/abc/gate'), { level: 'projects', view: 'gate' });
  assert.equal(routePath({ level: 'project', project: 'abc', view: 'activity' }), '/activity');
  assert.equal(routePath({ level: 'projects', view: 'gate' }), '/gate');
  assert.equal(routePath({ level: 'projects', view: 'chat' }), '/projects');
});
