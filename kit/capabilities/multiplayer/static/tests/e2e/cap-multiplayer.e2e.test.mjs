// Multiplayer, real time (a capability chosen in Project Start), in a real browser: its scenario in SCENARIOS.md, one test named
// exactly after its title. The app's files and the browser come from ./browser.mjs; with no browser set up it is
// skipped and says so.
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { newPage, open, serve, startBrowser } from './browser.mjs';

const started = await startBrowser();
let app;
before(async () => { if (started.chromium) app = await serve(); });
after(async () => { await started.chromium?.close(); app?.close(); });

test('A move by one player reaches the other in the same room', { skip: started.skip ?? false }, async () => {
  const page = await newPage(started.chromium);
  try {
    // Given two players in one room on the test network, in the browser (never the real relays)
    await open(page, app.base);
    const moves = await page.evaluate(async () => {
      const { joinRoom, createTestNetwork } = await import(new URL('vendor/p2p-core/p2p-core.js', location.href).href);
      const network = createTestNetwork();
      const one = joinRoom({ app: 'e2e', network }), two = joinRoom({ app: 'e2e', network });
      const received = [];
      two.onMessage('move', data => received.push(data));
      await network.settle();
      // When one player sends a move
      one.send('move', { x: 1, y: 2 });
      await network.settle();
      one.leave(); two.leave();
      return received;
    });
    // Then the other player receives it
    assert.deepEqual(moves, [{ x: 1, y: 2 }]);
  } finally { await page.context().close(); }
});
