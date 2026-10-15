// The README's screenshot: a scratch workbench (never your own projects or data) with a sample app, a short chat and the
// app's Preview beside it. Run: NODE_PATH=<folder with playwright> node docs/screenshots/make.cjs
// Writes docs/screenshots/workbench.png (and workbench-phone.png).
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('node:child_process');
const fs = require('node:fs');
const { tmpdir, homedir } = require('node:os');
const { join } = require('node:path');
const readline = require('node:readline');
(async () => {
  const directory = fs.realpathSync(fs.mkdtempSync(join(tmpdir(), 'pi-screenshot-')));
  const python = execFileSync('which', ['python3'], { encoding: 'utf8' }).trim();
  fs.writeFileSync(join(directory, 'pi'), `#!${python}\n` + fs.readFileSync(join(__dirname, 'pi.py'), 'utf8')); fs.chmodSync(join(directory, 'pi'), 0o755);
  // The Preview builds the app's CSS with Tailwind; reuse the downloaded copy when there is one (read only).
  const toolchain = join(homedir(), 'pi-local-harness-data', 'toolchain');
  if (fs.existsSync(toolchain)) fs.symlinkSync(toolchain, join(directory, 'toolchain'));
  const env = { ...Object.fromEntries(Object.entries(process.env).filter(([key]) => !/^PI_(HARNESS_|WEB_REMOTE_)/.test(key))), PATH: directory + ':' + process.env.PATH,
    PI_TAILSCALE: 'false', PI_TRASH_DIR: join(directory, 'Trash'), PI_GATE_PORT: '0', PI_OLLAMA_URL: 'http://127.0.0.1:9', PI_WEB_PORT: '0',
    PI_AGENT_DATA: join(directory, 'workspace'), PI_WEB_DATA: join(directory, 'data'), PI_HARNESS_LOG_FILE: join(directory, 'audit.log') };
  const server = spawn('python3', ['harness/services.py'], { env, stdio: ['ignore', 'pipe', 'pipe'] });
  server.stderr.on('data', () => {});
  let browser;
  try {
    const ports = await new Promise((resolve, reject) => { readline.createInterface({ input: server.stdout }).once('line', line => resolve(JSON.parse(line))); server.once('exit', code => reject(new Error('Server exited ' + code))); });
    const base = `http://127.0.0.1:${ports.web}`;
    browser = await chromium.launch({ headless: true, ...(process.env.PI_TEST_CHROME ? { executablePath: process.env.PI_TEST_CHROME } : {}) });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
    await page.goto(base);
    const post = (path, body) => page.evaluate(async ([path, body]) => (await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })).json(), [path, body]);
    const { project } = await post('/api/projects/create', { name: 'Class Notes', parent: directory, kind: 'static' });
    await page.goto(base);
    await page.locator('#chat-tab').click(); await page.locator('#prompt:not([disabled])').waitFor();
    const ask = async text => {
      await page.locator('#prompt').fill(text); await page.keyboard.press('Enter');
      await page.waitForFunction(count => document.querySelectorAll('.pw-msg').length >= count, (await page.locator('.pw-msg').count()) + 2);
      await page.waitForTimeout(800);
    };
    await ask('What is the plan for this app?');
    await ask('Add a search box that filters the notes as I type.');
    await post('/api/preview/start', { project });
    await page.waitForTimeout(2000);
    if (await page.locator('#preview-toggle[aria-pressed="false"]').isVisible()) await page.locator('#preview-toggle').click();
    const frame = page.frameLocator('.pw-preview__frame iframe');
    await frame.locator('#title').waitFor({ timeout: 60000 });
    for (const note of ['Kanji: 漢字 review, chapter 3', 'Bring the field trip form', 'Physics: read pages 40–52']) {
      await frame.locator('#title').fill(note); await frame.locator('#note-form button').click(); await page.waitForTimeout(200);
    }
    await page.waitForTimeout(1500);
    await page.screenshot({ path: join(__dirname, 'workbench.png') });
    await page.setViewportSize({ width: 390, height: 844 }); await page.goto(base); await page.waitForTimeout(1000);
    if (await page.locator('#phone-back').isVisible()) await page.locator('#phone-back').click();
    await page.locator('#phone-view').click(); await page.locator('#phone-view-menu [data-view="chat"]').click(); await page.waitForTimeout(1000);
    await page.screenshot({ path: join(__dirname, 'workbench-phone.png') });
    await post('/api/preview/stop', { project });
  } catch (error) {
    if (process.env.PI_SCREENSHOT_DEBUG) await browser?.contexts()[0]?.pages()[0]?.screenshot({ path: process.env.PI_SCREENSHOT_DEBUG });
    throw error;
  } finally {
    await browser?.close(); server.kill('SIGTERM');
    fs.rmSync(directory, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exit(1); });
