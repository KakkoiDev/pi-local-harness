import { test } from 'node:test';
import assert from 'node:assert/strict';
import { harnessNotice, renderNotice } from '../../harness/notices.mjs';

const strip = line => line.replace(/\x1b\[[0-9;]*m/g, '');

test('recovery and refusal lead with a bold sentence, then what happened, then what to do (task 171, T_Gate)', () => {
  const loop = harnessNotice('loop', 'Loop detected: the same three thought lines occurred twice in the last 100 lines: ["a"]');
  assert.equal(loop.sentence, 'Harness stopped a loop.');
  assert.match(loop.detail, /^The same three thought lines occurred twice/, 'no code word first');
  assert.match(loop.web, /^Harness recovery: Loop detected/, 'the web worker still reads its prefix');
  const lines = renderNotice(loop, 80);
  assert.equal(lines[0], '\x1b[1m! Harness stopped a loop.\x1b[22m');
  assert.ok(lines.slice(1).every(line => line.startsWith('  ')), 'the rest indented under it');
  assert.match(strip(lines.at(-1)), /Pi asks again another way · Esc stops it/); assert.match(lines.at(-1), /^  \x1b\[2m/, 'the next step dim');
  assert.equal(harnessNotice('hang', 'Hang detected: no streamed activity for 30000ms.').sentence, 'Harness stopped a hang.');
  assert.equal(harnessNotice('canary', 'Instruction drift: the completed response omitted [CANARY].').sentence, 'Pi drifted from its instructions.');
  const stopped = harnessNotice('stopped', '/data/session.log');
  assert.equal(stopped.sentence, 'Harness stopped retrying.'); assert.match(stopped.detail, /\/data\/session\.log/); assert.match(stopped.web, /^Harness recovery stopped: /);
  const refused = harnessNotice('refused', 'One agent is already working. Wait or stop the active task before starting another.');
  assert.equal(renderNotice(refused, 80)[0], '\x1b[1m■ Another request is running.\x1b[22m');
  assert.match(refused.detail, /yours was not sent/); assert.match(refused.next, /\/queue/); assert.match(refused.web, /^Harness refused: One agent/);
  for (const line of renderNotice(refused, 40)) assert.ok(strip(line).length <= 40, 'wrapped to the width');
});
