// The game in a real browser: one test per scenario in SCENARIOS.md, named after its title (task 332's protocol).
import { after, before, test } from 'node:test';
import { newPage, serve, startBrowser } from './browser.mjs';

const started = await startBrowser();
let app;
before(async () => { if (started.chromium) app = await serve(); });
after(async () => { await started.chromium?.close(); app?.close(); });

test('Switch the game to Japanese and back to English', { skip: started.skip ?? false }, async () => {
  const page = await newPage(started.chromium);
  try {
    // Given the game page in English
    await page.goto(app.base);
    await page.getByText('W/S: left').waitFor();
    // When I press 日本語; Then the controls line is in Japanese
    await page.getByRole('button', { name: '日本語' }).click();
    await page.getByText('W/S: 左').waitFor();
    // And pressing English brings it back in English
    await page.getByRole('button', { name: 'English' }).click();
    await page.getByText('W/S: left').waitFor();
  } finally { await page.context().close(); }
});
