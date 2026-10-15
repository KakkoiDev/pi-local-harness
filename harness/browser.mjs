// The browser tool (docs/lessons/L-008): Pi could not observe a UI bug, so it guessed its cause. This drives a headless
// Chromium through the DevTools protocol (no npm packages: Node's own WebSocket) at a chosen window size, runs a few steps
// and returns facts as data: which elements scroll and by how much, what is positioned against what, boxes, styles,
// console errors, a screenshot. "Probe, don't guess."
//
// By default it opens a scratch workbench (this checkout's services with a temporary data folder, the test suite's fake
// Pi and a seeded "Demo" project), never the person's own workbench or data. Another local page (a dev server on
// 127.0.0.1 or localhost) can be opened by URL.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync, chmodSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));

/** A Chromium to drive: PI_BROWSER, Google Chrome, Chromium, or Playwright's download; null when there is none. */
export function findChrome(env = process.env) {
  const cache = join(homedir(), 'Library/Caches/ms-playwright');
  const playwright = existsSync(cache) ? readdirSync(cache).filter(name => name.startsWith('chromium-')).sort().reverse()
    .flatMap(name => [join(cache, name, 'chrome-mac/Chromium.app/Contents/MacOS/Chromium'), join(cache, name, 'chrome-mac-arm64/Chromium.app/Contents/MacOS/Chromium'), join(cache, name, 'chrome-linux/chrome')]) : [];
  return [env.PI_BROWSER, env.PI_TEST_CHROME, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium', '/usr/bin/chromium', '/usr/bin/google-chrome', ...playwright]
    .find(path => path && existsSync(path)) || null;
}

// -- DevTools protocol ---------------------------------------------------------------------------------------------
class Session {
  constructor(socket) {
    this.socket = socket; this.next = 1; this.waiting = new Map(); this.listeners = new Set();
    socket.addEventListener('message', ({ data }) => {
      const message = JSON.parse(data);
      if (message.id && this.waiting.has(message.id)) {
        const { resolve, reject } = this.waiting.get(message.id); this.waiting.delete(message.id);
        message.error ? reject(new Error(message.error.message)) : resolve(message.result);
      } else for (const listener of this.listeners) listener(message);
    });
  }
  send(method, params = {}, sessionId) {
    const id = this.next++;
    this.socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    return new Promise((resolve, reject) => {
      this.waiting.set(id, { resolve, reject });
      setTimeout(() => { if (this.waiting.delete(id)) reject(new Error(`${method} timed out`)); }, 30000).unref?.();
    });
  }
  once(method, sessionId, timeout = 15000) {
    return new Promise((resolve, reject) => {
      const listener = message => { if (message.method === method && message.sessionId === sessionId) { this.listeners.delete(listener); clearTimeout(timer); resolve(message.params); } };
      const timer = setTimeout(() => { this.listeners.delete(listener); reject(new Error(`${method} did not come`)); }, timeout);
      this.listeners.add(listener);
    });
  }
}

/** Launch Chromium headless; {session, close}. */
export async function launchChrome(chrome) {
  const profile = mkdtempSync(join(tmpdir(), 'pi-browser-'));
  const child = spawn(chrome, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--hide-scrollbars=false', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
  const url = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Chromium did not start')), 20000);
    createInterface({ input: child.stderr }).on('line', line => { const match = line.match(/DevTools listening on (ws:\S+)/); if (match) { clearTimeout(timer); resolve(match[1]); } });
    child.once('exit', code => { clearTimeout(timer); reject(new Error(`Chromium exited (${code})`)); });
  });
  const socket = new WebSocket(url);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', () => reject(new Error('Could not connect to Chromium')), { once: true }); });
  return { session: new Session(socket), close() { try { socket.close(); } catch {} child.kill('SIGKILL'); rmSync(profile, { recursive: true, force: true }); } };
}

// -- the scratch workbench -----------------------------------------------------------------------------------------
/** This checkout's workbench with a temporary data folder, the fake Pi and a "Demo" project; {url, project, stop}. */
export async function startScratch({ python = process.env.PI_PYTHON || 'python3' } = {}) {
  const folder = mkdtempSync(join(tmpdir(), 'pi-scratch-workbench-'));
  const bin = join(folder, 'bin'), demo = join(folder, 'Demo');
  mkdirSync(bin); mkdirSync(join(demo, 'tasks'), { recursive: true });
  writeFileSync(join(bin, 'pi'), `#!/usr/bin/env ${python}\n` + readFileSync(join(ROOT, 'tests/fixtures/fake-pi.py'), 'utf8')); chmodSync(join(bin, 'pi'), 0o755);
  writeFileSync(join(demo, 'ROADMAP.md'), '# Demo\n\n- [ ] [001-First task](tasks/001-first-task.md)\n');
  writeFileSync(join(demo, 'tasks/001-first-task.md'), '# 001: First task\n\nKind: code\n\n- [ ] Describe the work\n');
  writeFileSync(join(demo, 'notes.md'), '# Notes\n\nA paragraph to comment on.\n');
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !/^PI_(HARNESS_|WEB_REMOTE_)/.test(key)));
  const child = spawn(python, [join(ROOT, 'harness/services.py')], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...env, PATH: `${bin}:${process.env.PATH}`, PI_AGENT_DATA: join(folder, 'data'), PI_WEB_DATA: join(folder, 'data/chats'), PI_WEB_PORT: '0', PI_GATE_PORT: '0',
      PI_TAILSCALE: 'false', PI_OLLAMA_URL: 'http://127.0.0.1:9', PI_TRASH_DIR: join(folder, 'Trash'), PI_WEB_CWD: folder, PI_HARNESS_LOG_FILE: join(folder, 'audit.log') } });
  child.stderr.resume(); // an unread pipe fills and stalls the server
  const ports = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('The scratch workbench did not start')), 20000);
    createInterface({ input: child.stdout }).once('line', line => { clearTimeout(timer); try { resolve(JSON.parse(line)); } catch (error) { reject(error); } });
    child.once('exit', code => { clearTimeout(timer); reject(new Error(`The scratch workbench exited (${code})`)); });
  });
  const url = `http://127.0.0.1:${ports.web}`;
  const registered = await fetch(`${url}/api/projects/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: demo }) }).then(response => response.json());
  return { url, project: registered.project, folder, stop() { child.kill('SIGTERM'); setTimeout(() => { child.kill('SIGKILL'); rmSync(folder, { recursive: true, force: true }); }, 1500).unref(); } };
}

// -- what runs in the page -----------------------------------------------------------------------------------------
// Element names a person can find in the code: tag#id.class.class (two classes at most).
const PAGE = `(() => {
  const name = element => !element || element === document ? 'document' : element === document.scrollingElement ? 'document.scrollingElement' :
    element.tagName.toLowerCase() + (element.id ? '#' + element.id : '') + [...element.classList].slice(0, 2).map(item => '.' + item).join('');
  const box = rect => ({ x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) });
  const visible = element => { const rect = element.getBoundingClientRect(); return rect.width > 0 && rect.height > 0 && getComputedStyle(element).visibility !== 'hidden'; };
  const find = target => {
    try { const found = document.querySelector(target); if (found) return found; } catch {}
    const wanted = String(target).trim().toLowerCase();
    const candidates = [...document.querySelectorAll('button, a, [role=button], [role=menuitem], [role=tab], label, summary, input, textarea')].filter(visible);
    return candidates.find(item => (item.getAttribute('aria-label') || item.textContent || item.placeholder || '').trim().toLowerCase() === wanted)
      || candidates.find(item => (item.getAttribute('aria-label') || item.textContent || item.placeholder || '').trim().toLowerCase().startsWith(wanted)) || null;
  };
  return {
    name, box, find,
    probes: {
      viewport: () => ({ width: innerWidth, height: innerHeight, url: location.pathname + location.search, title: document.title }),
      scrolled: () => [document.scrollingElement, ...document.querySelectorAll('*')].filter(element => element && (element.scrollTop > 0 || element.scrollLeft > 0))
        .map(element => ({ element: name(element), scrollTop: Math.round(element.scrollTop), scrollLeft: Math.round(element.scrollLeft), scrollHeight: element.scrollHeight, clientHeight: element.clientHeight })),
      scrollable: () => [document.scrollingElement, ...document.querySelectorAll('*')].filter(element => element && element.scrollHeight > element.clientHeight + 1 &&
        (element === document.scrollingElement || /auto|scroll/.test(getComputedStyle(element).overflowY)))
        .map(element => ({ element: name(element), extra: element.scrollHeight - element.clientHeight, scrollTop: Math.round(element.scrollTop), overflowY: element === document.scrollingElement ? 'document' : getComputedStyle(element).overflowY })).slice(0, 40),
      positioned: () => [...document.querySelectorAll('*')].filter(element => /absolute|fixed/.test(getComputedStyle(element).position) && element.getClientRects().length)
        .map(element => ({ element: name(element), position: getComputedStyle(element).position, against: name(element.offsetParent) || 'the window', box: box(element.getBoundingClientRect()) })).slice(0, 40),
      console: () => window.__piConsole || [],
    },
  };
})()`;

const CAPTURE = `window.__piConsole = []; for (const level of ['error', 'warn']) { const original = console[level]; console[level] = (...args) => { window.__piConsole.push({ level, text: args.map(String).join(' ').slice(0, 300) }); original.apply(console, args); }; }
addEventListener('error', event => window.__piConsole.push({ level: 'error', text: String(event.message).slice(0, 300) }));
addEventListener('unhandledrejection', event => window.__piConsole.push({ level: 'error', text: 'Unhandled: ' + String(event.reason).slice(0, 280) }));`;

const KEYS = { Enter: 13, Escape: 27, Tab: 9, Backspace: 8, ArrowDown: 40, ArrowUp: 38, ArrowLeft: 37, ArrowRight: 39, Space: 32, Delete: 46, Home: 36, End: 35 };

/** The tool's input, checked: {target: 'scratch'|URL, width, height, steps, probes}. Returns {error} or the plan. */
export function plan(input = {}) {
  const width = Math.round(Number(input.width ?? 1440)), height = Math.round(Number(input.height ?? 900));
  if (!(width >= 320 && width <= 3840 && height >= 300 && height <= 2400)) return { error: 'width must be 320–3840 and height 300–2400 (CSS pixels).' };
  const target = String(input.target || 'scratch');
  if (target !== 'scratch') {
    let url; try { url = new URL(target); } catch { return { error: `target is "scratch" (a scratch workbench) or a URL on this computer, not “${target}”.` }; }
    if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) || !/^https?:$/.test(url.protocol)) return { error: 'Only pages on this computer (127.0.0.1 or localhost) can be opened.' };
  }
  const steps = Array.isArray(input.steps) ? input.steps : [];
  if (steps.length > 40) return { error: 'At most 40 steps.' };
  const probes = Array.isArray(input.probes) && input.probes.length ? input.probes : ['viewport', 'scrolled', 'scrollable', 'console'];
  return { target, width, height, path: input.path || '', steps, probes };
}

/** Open, act, probe: the facts as data. `shots`: where screenshots go. */
export async function look(input, { chrome = findChrome(), scratch, shots = tmpdir(), forbidden = [] } = {}) {
  const asked = plan(input);
  if (asked.error) return { error: asked.error };
  if (!chrome) return { error: 'No Chromium found. Install Google Chrome, or set PI_BROWSER to a Chromium binary (Playwright\'s works: npx playwright install chromium).' };
  let base = asked.target, project;
  if (asked.target === 'scratch') { const workbench = await scratch(); base = workbench.url; project = workbench.project; }
  else if (forbidden.some(port => new URL(asked.target).port === String(port))) return { error: 'That is the person\'s own workbench, with their data: use target "scratch" instead.' };
  const url = new URL(asked.path || (asked.target === 'scratch' ? `/p/${project}/chat` : ''), base).href;
  const browser = await launchChrome(chrome);
  const done = [], facts = {};
  try {
    const { session } = browser;
    const { targetId } = await session.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await session.send('Target.attachToTarget', { targetId, flatten: true });
    const page = (method, params) => session.send(method, params, sessionId);
    await page('Page.enable'); await page('Runtime.enable');
    await page('Emulation.setDeviceMetricsOverride', { width: asked.width, height: asked.height, deviceScaleFactor: 1, mobile: asked.width <= 760 });
    await page('Page.addScriptToEvaluateOnNewDocument', { source: CAPTURE });
    const evaluate = async expression => {
      const result = await page('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
      if (result.exceptionDetails) throw new Error((result.exceptionDetails.exception?.description?.split('\n')[0] || result.exceptionDetails.text).replace(/^Error: /, ''));
      return result.result.value;
    };
    const go = async address => { const loaded = session.once('Page.loadEventFired', sessionId); await page('Page.navigate', { url: address }); await loaded; await new Promise(resolve => setTimeout(resolve, 400)); };
    const within = (target, script) => evaluate(`(() => { const page = ${PAGE}; const element = page.find(${JSON.stringify(target)}); if (!element) throw new Error('No element matches ' + ${JSON.stringify(JSON.stringify(target))}); ${script} })()`);
    await go(url);
    for (const [index, step] of asked.steps.entries()) {
      const [kind] = Object.keys(step || {}), value = step?.[kind];
      try {
        if (kind === 'click') {
          const point = await within(value, `const rect = element.getBoundingClientRect(); if (rect.bottom < 0 || rect.top > innerHeight || rect.width === 0) { element.click(); return null; } return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };`);
          if (point) for (const type of ['mousePressed', 'mouseReleased']) await page('Input.dispatchMouseEvent', { type, x: point.x, y: point.y, button: 'left', clickCount: 1 });
          await new Promise(resolve => setTimeout(resolve, 300));
        } else if (kind === 'type') {
          await within(value.into, 'element.focus(); if ("value" in element) element.value = ""; return true;');
          await page('Input.insertText', { text: String(value.text) });
        } else if (kind === 'press') {
          const key = String(value), code = KEYS[key] || key.toUpperCase().charCodeAt(0);
          for (const type of ['keyDown', 'keyUp']) await page('Input.dispatchKeyEvent', { type, key, code: key.length === 1 ? `Key${key.toUpperCase()}` : key, windowsVirtualKeyCode: code, ...(type === 'keyDown' && key === 'Enter' ? { text: '\r' } : {}) });
          await new Promise(resolve => setTimeout(resolve, 300));
        } else if (kind === 'wait') {
          await new Promise(resolve => setTimeout(resolve, Math.min(Number(value) || 0, 15000)));
        } else if (kind === 'waitFor') {
          const until = Date.now() + 15000;
          while (!(await evaluate(`(() => { const page = ${PAGE}; return Boolean(page.find(${JSON.stringify(value)})); })()`))) {
            if (Date.now() > until) throw new Error(`${JSON.stringify(value)} did not appear in 15 s`);
            await new Promise(resolve => setTimeout(resolve, 250));
          }
        } else if (kind === 'goto') {
          await go(new URL(String(value), base).href);
        } else if (kind === 'api') {
          if (asked.target !== 'scratch') throw new Error('api steps are for the scratch workbench');
          facts[`api ${index + 1}`] = await fetch(new URL(value.path, base), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value.body || {}) }).then(response => response.json());
        } else throw new Error(`Unknown step “${kind}”: use click, type, press, wait, waitFor, goto or api`);
        done.push(`${index + 1}. ${kind} ${JSON.stringify(value)}: done`);
      } catch (error) { done.push(`${index + 1}. ${kind} ${JSON.stringify(value)}: failed, ${error.message}`); break; }
    }
    for (const probe of asked.probes) {
      const [kind, value] = typeof probe === 'string' ? [probe] : Object.entries(probe)[0];
      try {
        if (['viewport', 'scrolled', 'scrollable', 'positioned', 'console'].includes(kind)) facts[kind] = await evaluate(`(${PAGE}).probes.${kind}()`);
        else if (kind === 'boxes') facts[`boxes ${value}`] = await evaluate(`(() => { const page = ${PAGE}; return [...document.querySelectorAll(${JSON.stringify(value)})].slice(0, 20).map(element => ({ element: page.name(element), box: page.box(element.getBoundingClientRect()), hidden: element.hidden || !element.getClientRects().length })); })()`);
        else if (kind === 'styles') facts[`styles ${value.selector}`] = await within(value.selector, `const style = getComputedStyle(element); return Object.fromEntries(${JSON.stringify(value.props || [])}.map(prop => [prop, style.getPropertyValue(prop)]));`);
        else if (kind === 'text') facts[`text ${value}`] = await within(value, 'return element.innerText.slice(0, 2000);');
        else if (kind === 'eval') facts.eval = await evaluate(String(value));
        else if (kind === 'screenshot') {
          mkdirSync(shots, { recursive: true });
          const file = join(shots, `browser-${Date.now()}.png`);
          writeFileSync(file, Buffer.from((await page('Page.captureScreenshot', { format: 'png' })).data, 'base64'));
          facts.screenshot = file;
        } else facts[kind] = `Unknown probe: use viewport, scrolled, scrollable, positioned, console, boxes, styles, text, eval or screenshot`;
      } catch (error) { facts[kind] = `failed: ${error.message}`; }
    }
  } finally { browser.close(); }
  return { opened: url, size: `${asked.width}×${asked.height}`, steps: done, facts };
}

/** Pi's browser tool. The scratch workbench starts on first use and stays for the session; `stop()` ends it. */
export function installBrowser(pi, { forbidden = () => [], shots = tmpdir(), see = look, start = startScratch } = {}) {
  let workbench;
  pi.registerTool?.({
    name: 'browser', label: 'Browser',
    description: 'Open a web page in a real headless browser at a window size you choose, do a few steps, and get facts back as data. Use it to reproduce and measure a UI bug before changing code (probe, do not guess). target: "scratch" (default: a scratch Pi Workbench from this checkout with a Demo project and a fake Pi; never the person\'s data) or a URL on 127.0.0.1/localhost. path: a page in it, e.g. "/p/<project>/chat" or "/activity". steps (in order): {click: "button text or CSS selector"}, {type: {into: "selector", text}}, {press: "Enter"}, {wait: ms}, {waitFor: "text or selector"}, {goto: "/path"}, {api: {path, body}} (scratch only: POST to the workbench). probes: "viewport", "scrolled" (elements scrolled from 0), "scrollable" (elements that can scroll, by how much), "positioned" (absolute/fixed elements and what they are placed against), "console" (errors), "screenshot", {boxes: "selector"}, {styles: {selector, props: [..]}}, {text: "selector"}, {eval: "JS expression"}. Example for "the window lifts at tablet width": {width: 1024, height: 600, steps: [{type: {into: "#prompt", text: "Hi"}}, {press: "Enter"}], probes: ["scrolled", "scrollable", "positioned"]}.',
    promptSnippet: 'browser: open a page at a chosen size, click/type, and measure (scrolled and scrollable elements, positioned elements, boxes, styles, console, screenshot); a scratch workbench by default',
    parameters: { type: 'object', properties: {
      target: { type: 'string', description: '"scratch" (default) or a URL on 127.0.0.1/localhost' },
      path: { type: 'string', description: 'Page to open in the target, e.g. "/activity"' },
      width: { type: 'number', description: 'Window width in CSS pixels (default 1440; phone 390, tablet 1024)' },
      height: { type: 'number', description: 'Window height (default 900)' },
      steps: { type: 'array', items: { type: 'object' }, description: 'Steps, in order' },
      probes: { type: 'array', items: {}, description: 'What to measure after the steps' },
    } },
    async execute(_id, params) {
      let result;
      try { result = await see(params || {}, { shots, forbidden: forbidden(), scratch: async () => (workbench ??= await start()) }); }
      catch (error) { result = { error: error.message }; }
      const content = [{ type: 'text', text: JSON.stringify(result, null, 1).slice(0, 12000) }];
      if (result.facts?.screenshot && existsSync(result.facts.screenshot)) content.push({ type: 'image', data: readFileSync(result.facts.screenshot).toString('base64'), mimeType: 'image/png' });
      return { content, isError: Boolean(result.error), details: { opened: result.opened } };
    },
  });
  return { stop() { workbench?.stop(); workbench = undefined; } };
}
