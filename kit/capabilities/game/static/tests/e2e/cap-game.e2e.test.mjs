// Game loop and collision (a capability chosen in Project Start), in a real browser: its scenario in SCENARIOS.md, one test named
// exactly after its title. The app's files and the browser come from ./browser.mjs; with no browser set up it is
// skipped and says so.
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { newPage, open, serve, startBrowser } from './browser.mjs';

const started = await startBrowser();
let app;
before(async () => { if (started.chromium) app = await serve(); });
after(async () => { await started.chromium?.close(); app?.close(); });

test('The game engine starts and draws on the page', { skip: started.skip ?? false }, async () => {
  const page = await newPage(started.chromium);
  try {
    // Given the app open in the browser
    await open(page, app.base);
    // When the page starts the game engine the capability brought
    await page.evaluate(async () => {
      const { engineInit } = await import(new URL('vendor/littlejs/littlejs.esm.min.js', location.href).href);
      const nothing = () => {};
      engineInit(() => { window.e2eGame = true; }, nothing, nothing, nothing, nothing);
    });
    // Then the engine runs its game start and draws on a canvas
    await page.waitForFunction(() => window.e2eGame === true);
    assert.ok(await page.locator('canvas').count() > 0, 'the engine draws on a canvas');
  } finally { await page.context().close(); }
});
