// Multiplayer, real time (a capability chosen in Project Start): two players in one room see each other's messages, on
// p2p-core's in-memory network (tests never use the real relays).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { joinRoom, createTestNetwork } from '../vendor/p2p-core/p2p-core.js';

test('two players join one room and a move reaches the other', async () => {
  const network = createTestNetwork();
  const one = joinRoom({ app: 'base-check', network }), two = joinRoom({ app: 'base-check', network });
  const joined = [], moves = [];
  two.onPeerJoin(id => joined.push(id));
  two.onMessage('move', (data, from) => moves.push({ data, from }));
  await network.settle();
  one.send('move', { x: 1, y: 2 });
  await network.settle();
  assert.equal(joined.length, 1, 'the second player sees the first join');
  assert.deepEqual(moves.map(move => move.data), [{ x: 1, y: 2 }]);
  one.leave(); two.leave();
});

test('its licence ships with it', () => {
  assert.match(readFileSync(new URL('../vendor/p2p-core/LICENSE', import.meta.url), 'utf8'), /MIT/);
});
