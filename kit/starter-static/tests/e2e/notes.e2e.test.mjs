// The app in a real browser, one test per scenario of a task, named exactly after the scenario's title (Pi Workbench
// checks the names). Playwright drives Chromium; with no Playwright or no browser set up, the test is skipped and says
// so (nothing is downloaded). Run: node --test   (or: node --test tests/e2e/)
// Find controls the way a person does: getByRole with the name, getByLabel; data-testid only where nothing else fits.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const TYPES = { '.html': 'text/html', '.mjs': 'text/javascript', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };

/** The project's files on a local port, like `python3 -m http.server`. */
async function serve() {
  const server = createServer(async (request, response) => {
    const path = normalize(join(ROOT, decodeURIComponent(new URL(request.url ?? '/', 'http://x').pathname)));
    const file = path.endsWith(sep) ? join(path, 'index.html') : path;
    if (!file.startsWith(ROOT)) { response.writeHead(403).end(); return; }
    let body;
    try { body = await readFile(file); } catch { response.writeHead(404).end(); return; }
    response.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' }).end(body);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(undefined)));
  const address = server.address();
  return { server, base: `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}/` };
}

/** Chromium through Playwright, or why it cannot start (the test is then skipped with that reason). */
async function browser() {
  let playwright;
  try { playwright = createRequire(import.meta.url)('playwright'); }
  catch { return { skip: 'no browser is set up for e2e tests (Playwright is not installed)' }; }
  try {
    // --use-mock-keychain and --password-store=basic: headless Chromium on macOS never asks for a keychain.
    const executablePath = process.env.PI_TEST_CHROME || process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined;
    return { chromium: await playwright.chromium.launch({ executablePath, args: ['--use-mock-keychain', '--password-store=basic'] }) };
  } catch (error) { return { skip: `no browser is set up for e2e tests (${String(error).split('\n')[0]})` }; }
}

test('Add a note and see it in the list', async t => {
  const started = await browser();
  if (!started.chromium) { t.skip(started.skip); return; }
  const { server, base } = await serve();
  try {
    const page = await started.chromium.newPage();
    await page.goto(base);
    await page.getByLabel('New note').fill('buy milk');
    await page.getByRole('button', { name: 'Add Note' }).click();
    await page.locator('#notes li', { hasText: 'buy milk' }).waitFor();
    assert.equal(await page.locator('#notes li').count(), 1);
  } finally { await started.chromium.close(); server.close(); }
});
