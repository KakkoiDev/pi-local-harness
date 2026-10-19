// Works offline (a capability chosen in Project Start), in a real browser: its scenario in SCENARIOS.md, one test named
// exactly after its title. The app's files and the browser come from ./browser.mjs; with no browser set up it is
// skipped and says so.
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { newPage, open, serve, startBrowser } from './browser.mjs';

const started = await startBrowser();
let app;
before(async () => { if (started.chromium) app = await serve(); });
after(async () => { await started.chromium?.close(); app?.close(); });

test('The app opens without a connection after the first visit', { skip: started.skip ?? false }, async () => {
  const page = await newPage(started.chromium);
  try {
    // Given the app opened once, its service worker active
    await open(page, app.base);
    await page.evaluate(() => { navigator.serviceWorker.ready.then(registration => { window.e2eWorker = Boolean(registration.active); }); });
    await page.waitForFunction(() => window.e2eWorker === true);  // build static/app.css first: the worker caches it
    // When the connection is cut and the page is opened again
    await page.context().setOffline(true);
    await page.reload();
    // Then the app opens and is ready
    await page.locator('body[data-ready="true"]').waitFor();
    assert.equal(await page.evaluate(() => navigator.onLine), false);
  } finally { await page.context().close(); }
});
