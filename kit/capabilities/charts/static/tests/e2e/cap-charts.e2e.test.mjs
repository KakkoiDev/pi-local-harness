// Dashboard and charts (a capability chosen in Project Start), in a real browser: its scenario in SCENARIOS.md, one test named
// exactly after its title. The app's files and the browser come from ./browser.mjs; with no browser set up it is
// skipped and says so.
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { newPage, open, serve, startBrowser } from './browser.mjs';

const started = await startBrowser();
let app;
before(async () => { if (started.chromium) app = await serve(); });
after(async () => { await started.chromium?.close(); app?.close(); });

test('A chart draws with the pinned chart library', { skip: started.skip ?? false }, async () => {
  const page = await newPage(started.chromium);
  try {
    // Given the app open in the browser
    await open(page, app.base);
    // When the page draws a bar chart with the chart library the capability brought
    await page.addScriptTag({ url: 'vendor/chart.js-4.5.1/chart.umd.min.js' });
    const drawn = await page.evaluate(() => {
      const canvas = Object.assign(document.createElement('canvas'), { id: 'e2e-chart' });
      document.body.append(canvas);
      new Chart(canvas, { type: 'bar', data: { labels: ['a', 'b'], datasets: [{ label: 'Count', data: [1, 2] }] }, options: { animation: false } });
      return Boolean(Chart.getChart(canvas)) && canvas.width > 0;
    });
    // Then the chart is on the page, drawn on its canvas
    assert.equal(drawn, true);
  } finally { await page.context().close(); }
});
