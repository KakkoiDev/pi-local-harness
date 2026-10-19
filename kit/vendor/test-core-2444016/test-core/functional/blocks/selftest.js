// Run a test block against its App Block's demo markup: the block's self-test, and the core of a test playground.
// The twin of functional/blocks/selftest.py.
//
//   import * as LogIn from '../functional/blocks/js/LogIn.js';
//   import { selfTest } from '../functional/blocks/selftest.js';
//   test('LogIn block', async ({ page }) => { await selfTest(page, LogIn, { kit: 'path/to/pi-local-harness' }); });
//
// The demo markup is served at DEMO_URL by page.route: nothing leaves the machine, and every link or form the steps
// press lands on the same demo again. A control the markup lost fails with "uses a control that no longer exists".
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseScenarios } from '../js/gherkin.js';
import { runScenario } from '../js/runner.js';

export const DEMO_URL = 'http://127.0.0.1:9'; // answered by page.route; port 9 (discard) is never really asked

/** The page a block's self-test runs on: its demo markup in a plain document (or `markup` instead). */
export function demoDocument(kit, block, markup = null) {
  const body = markup ?? block.DEMO.map((path) => readFileSync(join(String(kit), path), 'utf8')).join('\n');
  return `<!doctype html>\n<html lang="en">\n<head><meta charset="utf-8"><title>${block.BLOCK} demo</title></head>\n<body>\n${body}\n</body>\n</html>\n`;
}

/** Answer every request to DEMO_URL: documents get `html`, anything else an empty 204. */
export async function serveDemo(page, html) {
  await page.route((url) => url.href.startsWith(DEMO_URL), (route) => (route.request().resourceType() === 'document'
    ? route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: html })
    : route.fulfill({ status: 204, body: '' })));
}

export function selfTestScenario(block) {
  const text = `## Scenarios\n\n### ${block.BLOCK} self-test\n${block.SELF_TEST.join('\n')}\n`;
  return parseScenarios(text, `${block.BLOCK}.SELF_TEST`)[0];
}

/** Serve the block's demo, open it and run its SELF_TEST steps. Resolves to the world. */
export async function selfTest(page, block, { kit = null, markup = null, registry = null } = {}) {
  await serveDemo(page, demoDocument(kit, block, markup));
  await page.goto(`${DEMO_URL}/`);
  return runScenario(selfTestScenario(block), { level: 'e2e', registry: registry ?? block.steps, world: { page, baseURL: DEMO_URL } });
}
