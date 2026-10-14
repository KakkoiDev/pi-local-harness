import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toolLines, installToolRenderer } from '../../harness/tool-render.mjs';

const strip = lines => lines.map(line => line.replace(/\x1b\[[0-9;]*m/g, ''));

test('a tool call is two lines: glyph, tool and argument, then the checks (task 171, T_Gate)', () => {
  assert.deepEqual(strip(toolLines('bash', { command: 'python3 -m pytest tests/test_work_queue.py' }, { gate: 'allowed', ok: true, exit: 0, seconds: 12 })),
    ['▶ bash  python3 -m pytest tests/test_work_queue.py', '  ✓ Gate allowed · ✓ exit 0 · 0:12']);
  assert.deepEqual(strip(toolLines('bash', { command: 'rm -rf ~/work' }, { gate: 'blocked', reason: 'Destructive shell guard' })),
    ['✗ bash  rm -rf ~/work', '  ✗ Gate blocked it: Destructive shell guard', '  Nothing ran. /gate blocked']);
  assert.deepEqual(strip(toolLines('write', { path: '../other/ROADMAP.md' }, { gate: 'revise', reason: 'the path is outside the project' })),
    ['! write  ../other/ROADMAP.md', '  ! Gate asked Pi to revise: the path is outside the project']);
  assert.deepEqual(strip(toolLines('bash', { command: './backup.sh' }, { gate: 'allowed', ok: false, exit: 1, seconds: 3 })),
    ['✗ bash  ./backup.sh', '  ✓ Gate allowed · ✗ exit 1 · 0:03', '  The command failed on its own; Gate did not block it.']);
  assert.deepEqual(strip(toolLines('read', { path: 'ROADMAP.md' }, { gate: 'allowed', ok: true, seconds: 0 })), ['✓ read  ROADMAP.md', '  ✓ Gate allowed · ✓ done · 0:00'], 'task 177 (T_Gate): a finished read reads ✓; bash keeps ▶');
  assert.deepEqual(strip(toolLines('bash', { command: 'pwd' }, { gate: 'allowed', drift: 'the command that ran was not the one it allowed' })),
    ['✗ bash  pwd', '  ✗ Gate: the command that ran was not the one it allowed']);
  assert.deepEqual(strip(toolLines('grep', { pattern: 'TODO', path: 'harness' }, undefined)), ['▶ grep  TODO harness'], 'running: the first line only');
  const long = toolLines('bash', { command: 'x'.repeat(200) }, undefined, 60);
  assert.ok(strip(long)[0].length <= 60 && strip(long)[0].endsWith('…'));
  assert.match(toolLines('bash', { command: 'ls' }, undefined)[0], /\x1b\[1mbash\x1b\[22m/, 'the tool bold');
});

test('the renderer draws the harness tools and keeps the output below, without the line meant for Pi', () => {
  let resolver; const checks = new Map([['t1', { gate: 'allowed', ok: false, exit: 2, seconds: 1 }]]);
  installToolRenderer({ registerToolRenderer: r => { resolver = r; } }, checks);
  assert.equal(resolver('harness', () => undefined), undefined, 'the console tool keeps its own look');
  let seen;
  const inner = { renderResult: result => { seen = result; return { render: () => ['output'], invalidate() {} }; } };
  const renderers = resolver('bash', () => inner);
  const context = { toolCallId: 't1', args: { command: 'false' } };
  assert.deepEqual(strip(renderers.renderCall({ command: 'false' }, {}, context).render(80)), ['✗ bash  false']);
  const result = { content: [{ type: 'text', text: 'boom' }, { type: 'text', text: '✓ Gate allowed · ✗ exit 2: the command failed on its own; Gate did not block it.' }] };
  assert.deepEqual(strip(renderers.renderResult(result, {}, {}, context).render(80)), ['  ✓ Gate allowed · ✗ exit 2 · 0:01', '  The command failed on its own; Gate did not block it.', 'output']);
  assert.deepEqual(seen.content, [{ type: 'text', text: 'boom' }]);
  checks.set('t2', { gate: 'blocked', reason: 'Destructive shell guard' });
  assert.deepEqual(strip(renderers.renderResult({ content: [{ type: 'text', text: 'Gate pre-execution BLOCK…' }] }, {}, {}, { toolCallId: 't2', args: {} }).render(80)),
    ['  ✗ Gate blocked it: Destructive shell guard', '  Nothing ran. /gate blocked'], 'nothing ran: no output, no message meant for Pi');
});
