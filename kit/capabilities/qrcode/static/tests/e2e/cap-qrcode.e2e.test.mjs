// Share by QR code (a capability chosen in Project Start), in a real browser: its scenario in SCENARIOS.md, one test named
// exactly after its title. The app's files and the browser come from ./browser.mjs; with no browser set up it is
// skipped and says so.
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { newPage, open, serve, startBrowser } from './browser.mjs';

const started = await startBrowser();
let app;
before(async () => { if (started.chromium) app = await serve(); });
after(async () => { await started.chromium?.close(); app?.close(); });

test('A QR code is drawn for the page address', { skip: started.skip ?? false }, async () => {
  const page = await newPage(started.chromium);
  try {
    // Given the app open in the browser
    await open(page, app.base);
    // When the page draws a QR code for its own address with the library the capability brought
    await page.evaluate(async () => {
      const { default: qrcode } = await import(new URL('vendor/qrcode/qrcode.mjs', location.href).href);
      const code = qrcode(0, 'M'); code.addData(location.href); code.make();
      document.body.insertAdjacentHTML('beforeend', `<div id="e2e-qr">${code.createSvgTag({ cellSize: 4, margin: 4, scalable: true })}</div>`);
    });
    // Then the QR code is on the page
    await page.locator('#e2e-qr svg').waitFor();
  } finally { await page.context().close(); }
});
