// The e2e tests' one helper: the app's files on a local port, and the browser. Every e2e test in this folder uses it.
//
// The browser decision lives here and nowhere else: Playwright drives Chromium (the version test-core pins:
// @playwright/test 1.56.1, or the playwright library it is built on); PI_TEST_CHROME points at a Chromium already on
// this machine. With no Playwright or no browser set up, every browser test is skipped and says why. Nothing is ever
// downloaded here. Every Chromium starts with --use-mock-keychain and --password-store=basic (headless Chromium on
// macOS never asks for a keychain), and every request that leaves 127.0.0.1 is refused, so a test never reaches the
// network.
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const TYPES = { '.html': 'text/html', '.mjs': 'text/javascript', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const LOCAL = new Set(['127.0.0.1', 'localhost', '[::1]']);
const A11Y_CHECK = join(ROOT, 'test-core', 'a11y-smoke.js');  // test-core's shared accessibility smoke check

/** The project's files on a free local port, like `python3 -m http.server`: { base, close() }. */
export async function serve() {
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
  return { base: `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}/`, close: () => server.close() };
}

/** Chromium through Playwright, or why it cannot start: { chromium } or { skip: '<the reason>' }. */
export async function startBrowser() {
  const load = createRequire(import.meta.url);
  let playwright;
  for (const name of ['playwright', '@playwright/test']) {
    try { playwright = load(name); break; } catch { /* try the next name */ }
  }
  if (!playwright) return { skip: 'no browser is set up for e2e tests (Playwright is not installed)' };
  try {
    const executablePath = process.env.PI_TEST_CHROME || process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined;
    return { chromium: await playwright.chromium.launch({ executablePath, args: ['--use-mock-keychain', '--password-store=basic'] }) };
  } catch (error) { return { skip: `no browser is set up for e2e tests (${String(error).split('\n')[0]})` }; }
}

/** A fresh page (its own storage) that can only reach 127.0.0.1. Close it with `page.context().close()`. */
export async function newPage(chromium) {
  const context = await chromium.newContext();
  await context.route('**/*', route => LOCAL.has(new URL(route.request().url()).hostname) ? route.fallback() : route.abort('internetdisconnected'));
  return context.newPage();
}

/** Open the app and wait until it is ready for the first click (it sets <body data-ready="true">). */
export async function open(page, base) {
  await page.goto(base);
  await page.locator('body[data-ready="true"]').waitFor();
}

/** test-core's accessibility smoke check on the page as it is now: [] when it passes. */
export async function a11yProblems(page) {
  const check = (await readFile(A11Y_CHECK, 'utf8')).replace(/^\s*\/\/.*$/gm, '').trim();
  return page.evaluate(`(${check})()`);
}
