// Installs on a phone (a capability chosen in Project Start), in a real browser: its scenario in SCENARIOS.md, one test named
// exactly after its title. The app's files and the browser come from ./browser.mjs; with no browser set up it is
// skipped and says so.
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { newPage, open, serve, startBrowser } from './browser.mjs';

const started = await startBrowser();
let app;
before(async () => { if (started.chromium) app = await serve(); });
after(async () => { await started.chromium?.close(); app?.close(); });

test('The browser finds the manifest, the icon and the service worker', { skip: started.skip ?? false }, async () => {
  const page = await newPage(started.chromium);
  try {
    // Given the app open in the browser
    await open(page, app.base);
    // When the browser reads the manifest the page links to
    const link = await page.locator('link[rel="manifest"]').getAttribute('href');
    const manifest = await page.request.get(new URL(link, app.base).href);
    assert.ok(manifest.ok(), `${link}: ${manifest.status()}`);
    // Then the manifest names the app, its icon loads and the service worker is active
    const data = await manifest.json();
    assert.ok(data.name && data.icons?.length, 'the manifest names the app and an icon');
    assert.ok((await page.request.get(new URL(data.icons[0].src, new URL(link, app.base)).href)).ok(), data.icons[0].src);
    await page.evaluate(() => { navigator.serviceWorker.ready.then(registration => { window.e2eWorker = Boolean(registration.active); }); });
    await page.waitForFunction(() => window.e2eWorker === true);  // build static/app.css first: the worker caches it
  } finally { await page.context().close(); }
});
