// Blocks Playground runtime: loads the demo apps, renders the current screen into #stage (the .app container),
// routes data-go / data-action / data-submit / data-input events to the app, and runs the chrome toggles.
import { html, raw, icon, yen, num, date, toast, dialog, confirm } from './kit.js';

const APP_IDS = ['notes', 'shop', 'admin', 'chat', 'board', 'game'];
const CHROME = {
  en: { reset: 'Reset This App', blocks: 'On this screen' },
  ja: { reset: 'このアプリをリセット', blocks: 'この画面' },
};

const stage = document.getElementById('stage');
const frame = document.getElementById('pg-device-frame');
const pref = (k, d) => { try { return localStorage.getItem('pg.' + k) ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem('pg.' + k, v); } catch { /* private window */ } };

const S = {
  apps: {}, order: [], appId: null, lang: pref('lang', 'en'), theme: pref('theme', 'system'),
  device: pref('device', innerWidth < 860 ? 'phone' : 'desktop'), states: {}, history: {},
};

// ---- theme: Basecoat's html.dark, following the viewer's theme on Auto ----
const media = matchMedia('(prefers-color-scheme: dark)');
function applyTheme() {
  const host = document.documentElement.getAttribute('data-theme');
  const dark = S.theme === 'dark' || (S.theme === 'system' && (host ? host === 'dark' : media.matches));
  document.documentElement.classList.toggle('dark', dark);
}
media.addEventListener('change', applyTheme);
new MutationObserver(applyTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

// ---- sizing: the stage is the app's container; its width decides desktop or phone layout ----
function size() {
  const avail = Math.max(320, frame.parentElement.clientWidth);
  if (S.device === 'phone') {
    stage.style.width = Math.min(390, avail - 20) + 'px';
    stage.style.height = '780px';
  } else {
    stage.style.width = Math.min(1180, avail - 2) + 'px';
    stage.style.height = Math.max(620, Math.min(860, innerHeight - 150)) + 'px';
  }
  frame.dataset.device = S.device;
}
addEventListener('resize', size);

// ---- the app context passed to render() and actions ----
function ctxFor(app) {
  const msgs = app.messages || {};
  const ctx = {
    get s() { return S.states[app.id]; },
    get lang() { return S.lang; },
    get device() { return S.device; },
    t(key, vars) {
      let v = msgs[S.lang]?.[key] ?? msgs.en?.[key] ?? key;
      if (vars) for (const [k, x] of Object.entries(vars)) v = v.replaceAll('{' + k + '}', x);
      return v;
    },
    go(route, patch) {
      const st = S.states[app.id];
      (S.history[app.id] ||= []).push(st.route);
      if (patch) Object.assign(st, patch);
      st.route = route;
      render({ scrollTop: true });
    },
    back() { const h = S.history[app.id] || []; S.states[app.id].route = h.pop() || app.start || 'home'; render({ scrollTop: true }); },
    rerender(opts) { render(opts); },
    setLang(l) { S.lang = l; save('lang', l); document.querySelectorAll('#pg-lang button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === l))); renderAppButtons(); side(); },
    setTheme(t) { S.theme = t; save('theme', t); document.querySelectorAll('#pg-theme button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === t))); applyTheme(); },
    get theme() { return S.theme; },
    toast, dialog, confirm, html, raw, icon,
    yen: (n) => yen(n, S.lang), num: (n) => num(n, S.lang), date: (d, o) => date(d, S.lang, o),
  };
  return ctx;
}

// ---- render the current screen ----
let current = null;
function render({ scrollTop = false, keepFocus = true } = {}) {
  const app = S.apps[S.appId]; if (!app) return;
  const ctx = ctxFor(app);
  // keep focus and caret across re-renders (search fields, composers)
  const a = document.activeElement, keep = keepFocus && a && stage.contains(a) && a.id ? { id: a.id, s: a.selectionStart, e: a.selectionEnd } : null;
  const scrollers = [...stage.querySelectorAll('[data-scroll]')].map((el) => [el.dataset.scroll, el.scrollTop]);
  stage.querySelectorAll('canvas[data-chart-initialized]').forEach((c) => c._destroy?.());
  stage.lang = S.lang;
  stage.innerHTML = String(app.render(ctx));
  if (!scrollTop) for (const [k, top] of scrollers) { const el = stage.querySelector(`[data-scroll="${k}"]`); if (el) el.scrollTop = top; }
  if (keep) { const el = document.getElementById(keep.id); if (el) { el.focus(); try { el.setSelectionRange(keep.s, keep.e); } catch { /* not a text field */ } } }
  // charts through Basecoat's wrapper (Chart.js 4.5.1)
  stage.querySelectorAll('canvas[data-chart-type]:not([data-chart-initialized])').forEach((c) => {
    let options = {};
    try { options = c.dataset.chartOptions ? JSON.parse(c.dataset.chartOptions) : {}; } catch { /* bad JSON */ }
    try { window.basecoat.chart(c, options.chartData ? options : { options }); } catch (e) { console.warn('chart', e); }
  });
  app.mount?.(ctx, stage);
  current = { app, ctx };
  document.getElementById('pg-url').textContent = `${app.host || app.id + '.local'}/${S.states[app.id].route}`;
  sideBlocks();
}

function sideBlocks() {
  const names = [...new Set([...stage.querySelectorAll('[data-block]')].map((el) => el.dataset.block))];
  const box = document.getElementById('pg-blocks');
  box.innerHTML = names.map((n) => `<button type="button" data-find="${n}">${n}</button>`).join('');
}
document.getElementById('pg-blocks').addEventListener('click', (e) => {
  const b = e.target.closest('[data-find]'); if (!b) return;
  const el = stage.querySelector(`[data-block="${b.dataset.find}"]`); if (!el) return;
  el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  el.classList.remove('pg-flash'); void el.offsetWidth; el.classList.add('pg-flash');
});

// ---- events inside the app ----
function runAction(name, el, ev, data) {
  const { app, ctx } = current;
  const fn = app.actions?.[name];
  if (!fn) { console.warn('no action', name); return; }
  const r = fn(ctx, el, ev, data);
  if (r instanceof Promise) r.then((x) => { if (x !== false) render(); });
  else if (r !== false) render();
}
stage.addEventListener('click', (ev) => {
  const go = ev.target.closest('[data-go]');
  if (go && stage.contains(go)) {
    ev.preventDefault();
    const patch = go.dataset.param ? JSON.parse(go.dataset.param) : undefined;
    current.ctx.go(go.dataset.go, patch);
    return;
  }
  const a = ev.target.closest('[data-action]');
  if (a && stage.contains(a) && !(a.type === 'submit' && a.form?.dataset.submit)) { ev.preventDefault(); runAction(a.dataset.action, a, ev); return; }
  const link = ev.target.closest('a[href="#"]');
  if (link) ev.preventDefault();
});
stage.addEventListener('submit', (ev) => {
  const f = ev.target.closest('form'); if (!f) return;
  ev.preventDefault();
  if (f.dataset.submit) runAction(f.dataset.submit, f, ev, Object.fromEntries(new FormData(f)));
});
stage.addEventListener('input', (ev) => { const el = ev.target.closest('[data-input]'); if (el) runAction(el.dataset.input, el, ev); });
stage.addEventListener('change', (ev) => { const el = ev.target.closest('[data-change]'); if (el) runAction(el.dataset.change, el, ev); });
stage.addEventListener('keydown', (ev) => {
  const el = ev.target.closest('[data-keydown]'); if (el) { const { app, ctx } = current; const r = app.actions?.[el.dataset.keydown]?.(ctx, el, ev); if (r === true) render(); }
});

// ---- switching apps ----
async function openApp(id) {
  if (current?.app && current.app.id !== id) current.app.unmount?.(current.ctx, stage);
  S.appId = id; save('app', id);
  const app = S.apps[id];
  if (!S.states[id]) S.states[id] = { route: app.start || 'home', ...(app.init?.() || {}) };
  document.querySelectorAll('#pg-apps button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === id)));
  try { history.replaceState(null, '', '#' + id); } catch { /* sandboxed */ }
  side();
  size();
  render({ scrollTop: true });
}
function side() {
  const app = S.apps[S.appId]; if (!app) return;
  document.getElementById('pg-app-title').textContent = (app.name?.[S.lang] || app.name?.en || app.id) + (app.archetype ? ' · ' + app.archetype : '');
  document.getElementById('pg-app-desc').textContent = app.about?.[S.lang] || app.about?.en || '';
  document.getElementById('pg-try').textContent = app.try?.[S.lang] || app.try?.en || '';
  document.getElementById('pg-reset').textContent = CHROME[S.lang].reset;
  document.querySelector('.pg-side section:nth-child(2) h2').textContent = CHROME[S.lang].blocks;
}
document.getElementById('pg-reset').addEventListener('click', () => {
  const app = S.apps[S.appId]; app.unmount?.(current.ctx, stage);
  S.states[app.id] = { route: app.start || 'home', ...(app.init?.() || {}) }; S.history[app.id] = [];
  render({ scrollTop: true });
});

function seg(id, key, after) {
  const box = document.getElementById(id);
  box.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === S[key])));
  box.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    S[key] = b.dataset.v; save(key, S[key]);
    box.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    after();
  });
}
seg('pg-device', 'device', () => { size(); render(); });
seg('pg-lang', 'lang', () => { renderAppButtons(); side(); render(); });
seg('pg-theme', 'theme', () => applyTheme());
document.getElementById('pg-show').addEventListener('change', (e) => stage.classList.toggle('pg-show', e.target.checked));

function renderAppButtons() {
  document.getElementById('pg-apps').innerHTML = S.order.map((id) => {
    const a = S.apps[id];
    return `<button type="button" data-v="${id}" aria-pressed="${id === S.appId}">${icon(a.icon || 'box')}<span>${a.short?.[S.lang] || a.short?.en || a.name?.en}</span></button>`;
  }).join('');
}
document.getElementById('pg-apps').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) openApp(b.dataset.v); });

// ---- boot ----
applyTheme();
const loaded = await Promise.all(APP_IDS.map((id) => import(`./apps/${id}.js`).then((m) => m.default).catch((e) => { console.error('app', id, e); return null; })));
for (const a of loaded) if (a) { S.apps[a.id] = a; S.order.push(a.id); }
renderAppButtons();
const fromHash = location.hash.slice(1);
openApp(S.apps[fromHash] ? fromHash : (S.apps[pref('app', '')] ? pref('app', '') : S.order[0]));
