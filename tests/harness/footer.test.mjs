import { test } from 'node:test';
import assert from 'node:assert/strict';
import { footerText, newProblems } from '../../harness/footer.mjs';

const config = { model: 'gemma4:26b-mlx', effort: 'high', thinking: true, phoneUrl: null };
const job = (status, extra = {}) => ({ id: status + Math.random(), status, project: 'p1', message: 'Fix the badge', role: 'chat', ...extra });
const projects = [{ id: 'p1', name: 'pi-local-harness' }];
const strip = text => text.replace(/\x1b\[[0-9;]*m/g, '');

test('the footer: model · thinking │ state │ Gate today │ phone (round 6, T_Footer)', () => {
  const base = { config, projects, gate: { today: 14, blocked_today: 1 } };
  assert.equal(strip(footerText({ ...base, jobs: [] })), 'gemma4:26b-mlx · high thinking  │  Ready  │  Gate today 14 · 1 blocked  │  Phone off');
  assert.match(strip(footerText({ ...base, jobs: [job('running'), job('queued')] })), /│  ▶ Working · 1 waiting  │/);
  assert.match(strip(footerText({ ...base, jobs: [job('queued')] })), /│  ○ 1 waiting  │/);
  assert.match(strip(footerText({ ...base, jobs: [job('running', { role: 'worker' })] })), /│  ▶ Working · worker in pi-local-harness  │/);
  assert.match(strip(footerText({ ...base, config: { ...config, phoneUrl: 'https://x' }, jobs: [] })), /Phone on$/);
  assert.match(strip(footerText({ ...base, config: { ...config, thinking: false }, jobs: [] })), /^gemma4:26b-mlx · no thinking/);
});

test('what needs you inverts and names /queue until it is seen; a stopped workbench says so', () => {
  const failed = job('failed'), base = { config, projects, gate: { today: 0, blocked_today: 0 } };
  const text = footerText({ ...base, jobs: [failed] });
  assert.match(text, /\x1b\[7m ! Failed · 1 needs attention · \/queue \x1b\[27m/, 'inverse: the one thing that needs you');
  assert.match(strip(footerText({ ...base, jobs: [failed], seen: new Set([failed.id]) })), /│  Ready  │/, 'seen: back to normal');
  assert.match(footerText({ ...base, jobs: [job('failed'), job('stopped')] }), / ! 2 need attention · \/queue /);
  assert.match(footerText({ online: false }), /\x1b\[7m ✗ Workbench not running · \/doctor \x1b\[27m/);
});

test('one notification per new problem, never for routine work (T_Workbench)', () => {
  const failed = job('failed', { progress: 'exit 1' }), known = new Set();
  const first = newProblems([job('running'), failed], known, projects);
  assert.deepEqual(first, ['! Failed in pi-local-harness: “Fix the badge” · /queue']);
  assert.deepEqual(newProblems([failed], known, projects), [], 'once');
  assert.deepEqual(newProblems([job('completed')], known, projects), []);
});
