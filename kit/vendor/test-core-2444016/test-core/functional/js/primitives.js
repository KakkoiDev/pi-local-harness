// Test primitives: small functions every test level shares. Blocks and steps are made of these, nothing else.
// The twin of functional/primitives.py (same names in camelCase).
//
// Find     control(within, { role, name, label, testId, text, css }) -> a Playwright locator that exists, or
//          ControlMissing('... uses a control that no longer exists: button "Delete"')
// Act      goto, click, fill, check, uncheck, select, press
// Read     seenText(target); expectText, expectNoText, expectCount, expectVisible, expectHidden, expectAttribute,
//          expectValue, expectChecked, expectName, expectDescription. A target is a page or locator (e2e: waits for the state), a response body or a plain value.
// Data     builder(defaults) -> build(overrides): valid, unique records ('Task {n}' numbers each one)
// Network  stubNetwork(routes, { page }): page.route in a browser, a stand-in fetch in code
// Time     freezeTime(at, { page }) -> clock; with a page, the browser's clock stops there too
// Database tempDatabase(folder, schema) -> the path of a fresh SQLite file (node:sqlite)
// Routes   httpClient(baseURL): fetch that keeps the session cookie, for a server listening on port 0
//
// Waiting is always for a state, never for a time (NOTES.md 3). Playwright is imported only when a browser is used,
// so the unit level runs under Vitest or node --test without it.

export const settings = { timeout: 5000 }; // ms: how long a control may take to appear before it counts as missing

/** Text -> a RegExp source that matches it literally. */
export const escapeRegExp = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export class ControlMissing extends Error { name = 'ControlMissing'; }

const isLocatorLike = (target) => target && typeof target.getByRole === 'function' && typeof target.locator === 'function';
const isPage = (target) => isLocatorLike(target) && typeof target.goto === 'function';

/** 'button "Log In"', 'field labelled "Email"', 'element [data-testid=save]'. */
export function describeControl({ role, name, label, testId, text, css } = {}) {
  const shown = name instanceof RegExp ? name.source : name;
  if (role) return shown !== undefined ? `${role} "${shown}"` : role;
  if (label !== undefined) return `field labelled "${label}"`;
  if (testId !== undefined) return `element [data-testid=${testId}]`;
  if (text !== undefined) return `text "${text}"`;
  return `element ${css}`;
}

// ---------------------------------------------------------------- find

/** A locator for a control a person can find: by role (and name) first, then label, text, test id or CSS.
 *  Waits until it is in the page (it may be hidden); when it never appears, throws ControlMissing. */
export async function control(within, { role, name, label, testId, text, css, exact = false, includeHidden = false, block, timeout = settings.timeout } = {}) {
  let locator;
  if (role) {
    const options = {};
    if (name !== undefined) Object.assign(options, { name, exact });
    if (includeHidden) options.includeHidden = true;
    locator = within.getByRole(role, options);
  } else if (label !== undefined) locator = within.getByLabel(label, { exact });
  else if (testId !== undefined) locator = within.getByTestId(testId);
  else if (text !== undefined) locator = within.getByText(text, { exact });
  else if (css !== undefined) locator = within.locator(css);
  else throw new Error('control() needs role, label, testId, text or css');
  try {
    await locator.first().waitFor({ state: 'attached', timeout });
  } catch (error) {
    if (error?.name !== 'TimeoutError') throw error;
    const what = describeControl({ role, name, label, testId, text, css });
    throw new ControlMissing(`${block ? `${block}: ` : ''}uses a control that no longer exists: ${what}`);
  }
  return locator;
}

// ---------------------------------------------------------------- act

export const goto = async (page, url) => { await page.goto(url); return page; };
export const click = (target) => target.click();
export const fill = (target, value) => target.fill(String(value));
export const check = (target) => target.check();
export const uncheck = (target) => target.uncheck();
/** Choose an option of a <select> by its value or its visible label. */
export const select = (target, option) => target.selectOption(String(option));
export const press = (target, key) => target.press(key);

// ---------------------------------------------------------------- read

const normalize = (text) => String(text).replace(/\s+/g, ' ').trim();

/** What a person reads: the page's or element's visible text, or the value itself (a string, an object). */
export async function seenText(target) {
  if (typeof target === 'string') return normalize(target);
  if (isPage(target)) return normalize(await target.locator('body').innerText());
  if (isLocatorLike(target)) return normalize(await target.innerText());
  if (target && typeof target === 'object') return JSON.stringify(target);
  return normalize(target);
}

// Playwright's expect is a proxy with no `then`: it is never returned from an async function, only used inside one.
async function inBrowser(target, assertion) {
  const { expect } = await import('@playwright/test');
  await assertion(expect(isPage(target) ? target.locator('body') : target));
}

function assert(ok, message) {
  if (!ok) throw new Error(message);
}

/** The person sees `text` (contained; the whole text with exact). In a browser it waits for it. */
export async function expectText(target, text, { exact = false } = {}) {
  if (isLocatorLike(target)) return inBrowser(target, (e) => (exact ? e.toHaveText(text, { useInnerText: true }) : e.toContainText(text, { useInnerText: true })));
  const seen = await seenText(target);
  assert(exact ? seen === text : seen.includes(text), `expected to see ${JSON.stringify(text)}, saw ${JSON.stringify(seen)}`);
}

export async function expectNoText(target, text) {
  if (isLocatorLike(target)) return inBrowser(target, (e) => e.not.toContainText(text, { useInnerText: true }));
  const seen = await seenText(target);
  assert(!seen.includes(text), `expected not to see ${JSON.stringify(text)}, saw ${JSON.stringify(seen)}`);
}

/** A locator matches n elements (waits), or a collection has n items. */
export async function expectCount(target, n) {
  if (isLocatorLike(target)) return inBrowser(target, (e) => e.toHaveCount(n));
  const size = target.length ?? target.size;
  assert(size === n, `expected ${n} item(s), got ${size}: ${JSON.stringify(target)}`);
}

export const expectVisible = (target) => inBrowser(target, (e) => e.toBeVisible());
export const expectHidden = (target) => inBrowser(target, (e) => e.toBeHidden());
export const expectAttribute = (target, name, value) => inBrowser(target, (e) => e.toHaveAttribute(name, value));
/** A field holds `value` (an input, select or text area). */
export const expectValue = (target, value) => inBrowser(target, (e) => e.toHaveValue(String(value)));

export const expectChecked = (target, checked = true) => inBrowser(target, (e) => e.toBeChecked({ checked }));
/** The element's accessible name (what a screen reader says) contains `text`. */
export const expectName = (target, text) => inBrowser(target, (e) => e.toHaveAccessibleName(new RegExp(escapeRegExp(text))));
/** The element's accessible description (its help or error text, aria-describedby) contains `text`. */
export const expectDescription = (target, text) => inBrowser(target, (e) => e.toHaveAccessibleDescription(new RegExp(escapeRegExp(text))));

// ---------------------------------------------------------------- data

/** A record builder: valid defaults, overridable. A text default with {n} gets a number unique to this builder; a
 *  function default is called with that number. const aTask = builder({ title: 'Task {n}', done: false }). */
export function builder(defaults) {
  let n = 0;
  return (overrides = {}) => {
    n += 1;
    const record = {};
    for (const [key, value] of Object.entries(defaults)) {
      if (typeof value === 'function') record[key] = value(n);
      else if (typeof value === 'string' && value.includes('{n}')) record[key] = value.replaceAll('{n}', String(n));
      else record[key] = value;
    }
    return { ...record, ...overrides };
  };
}

// ---------------------------------------------------------------- network

const globToRegExp = (glob) => new RegExp(`^${glob.split('*').map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*')}$`);

/** 'GET /api/tip', '/api/tip', 'POST /api/*', or a whole URL pattern like 'https://api.example.com/*'. */
export function routeMatches(key, method, url) {
  const parts = key.trim().split(/\s+(.*)/s).filter(Boolean);
  const [wantedMethod, target] = parts.length === 2 ? [parts[0].toUpperCase(), parts[1]] : [null, parts[0]];
  if (wantedMethod && wantedMethod !== method.toUpperCase()) return false;
  const subject = target.startsWith('/') ? new URL(url).pathname : url;
  return globToRegExp(target).test(subject);
}

async function reply(spec, request) {
  let answer = typeof spec === 'function' ? await spec(request) : spec;
  if (answer === null || typeof answer !== 'object' || Array.isArray(answer)) answer = { json: answer };
  const headers = { ...(answer.headers ?? {}) };
  let body = answer.body ?? '';
  if ('json' in answer) {
    body = JSON.stringify(answer.json);
    headers['content-type'] ??= 'application/json';
  }
  return { status: answer.status ?? 200, headers, body };
}

/** Answer requests from a table instead of the network: { 'GET /api/tip': { json: {...} }, '/api/x': { status: 500 } }.
 *  With { page } (or a browser context): page.route answers the matching requests, the rest go on. Resolves to the page.
 *  Without: resolves to a fetch-compatible function that answers from the table and throws on any other request. */
export async function stubNetwork(routes, { page } = {}) {
  const keys = Object.keys(routes);
  if (page) {
    await page.route(
      (url) => keys.some((key) => routeMatches(key.trim().split(/\s+/).at(-1), 'GET', url.href)),
      async (route) => {
        const request = route.request();
        const key = keys.find((k) => routeMatches(k, request.method(), request.url()));
        if (key === undefined) return route.fallback();
        return route.fulfill(await reply(routes[key], request));
      },
    );
    return page;
  }
  return async (input, init = {}) => {
    const url = new URL(typeof input === 'string' ? input : input.url, 'http://stub.test').href;
    const method = init.method ?? input.method ?? 'GET';
    const key = keys.find((k) => routeMatches(k, method, url));
    if (key === undefined) throw new Error(`test-core: no stub for ${method} ${url} (stubNetwork routes: ${keys.join(', ')})`);
    const { status, headers, body } = await reply(routes[key], { url, method, init });
    return new Response(status === 204 ? null : body, { status, headers });
  };
}

// ---------------------------------------------------------------- time

/** Stop time at `at` (a Date or ISO text; without a zone it is UTC). With { page }, the browser's Date stops too.
 *  Resolves to a clock: clock.now() -> Date, clock.advance(ms). Pass clock.now to code that asks for the time. */
export async function freezeTime(at, { page } = {}) {
  const text = typeof at === 'string' && !/[zZ]|[+-]\d\d:?\d\d$/.test(at) && at.includes('T') ? `${at}Z` : at;
  let moment = new Date(text);
  if (page) await page.clock.setFixedTime(moment);
  return {
    now: () => new Date(moment),
    advance(ms) {
      moment = new Date(moment.getTime() + ms);
      return new Date(moment);
    },
  };
}

// ---------------------------------------------------------------- database and routes

/** A fresh SQLite database file in the test's temporary folder, with an optional schema. Returns its path. */
export async function tempDatabase(folder, schema = '', name = 'test.sqlite3') {
  const { existsSync } = await import('node:fs');
  const { join } = await import('node:path');
  const { DatabaseSync } = await import('node:sqlite');
  const path = join(folder, name);
  if (existsSync(path)) throw new Error(`${path} exists: each test gets its own database`);
  const db = new DatabaseSync(path);
  try {
    if (schema) db.exec(schema);
  } finally {
    db.close();
  }
  return path;
}

/** Call routes of a server on this machine; keeps the session cookie like a browser. Each call resolves to
 *  { status, ok, json, text }. client.get(path), client.post(path, data), client.patch(...), client.delete(path). */
export function httpClient(baseURL) {
  let cookie = '';
  const call = async (method, path, data) => {
    const response = await fetch(new URL(path, baseURL), {
      method,
      headers: { ...(data === undefined ? {} : { 'content-type': 'application/json' }), ...(cookie ? { cookie } : {}) },
      body: data === undefined ? undefined : JSON.stringify(data),
    });
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) cookie = setCookie.split(';')[0];
    const text = await response.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch { json = null; }
    return { status: response.status, ok: response.ok, json, text };
  };
  return {
    get: (path) => call('GET', path),
    post: (path, data) => call('POST', path, data),
    patch: (path, data) => call('PATCH', path, data),
    delete: (path) => call('DELETE', path),
  };
}
