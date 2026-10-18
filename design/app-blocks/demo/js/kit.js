// Blocks Playground kit: tiny rendering, i18n, actions, dialogs and toasts for the demo apps.
// Apps are built only from App Blocks markup; this file is the glue a real app's htmx or modules would replace.

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);
class Raw { constructor(s) { this.s = s; } toString() { return this.s; } }
export const raw = (s) => new Raw(String(s ?? ''));
const part = (v) => v instanceof Raw ? v.s : Array.isArray(v) ? v.map(part).join('') : (v === false || v == null) ? '' : esc(v);
/** html`<p>${text}</p>`: values are escaped unless they came from html`` or raw(). Arrays are joined. */
export function html(strings, ...vals) {
  let out = '';
  strings.forEach((s, i) => { out += s; if (i < vals.length) out += part(vals[i]); });
  return new Raw(out);
}

export const yen = (n, lang) => new Intl.NumberFormat(lang === 'ja' ? 'ja-JP' : 'en-US', { style: 'currency', currency: 'JPY' }).format(n);
export const num = (n, lang) => new Intl.NumberFormat(lang === 'ja' ? 'ja-JP' : 'en-US').format(n);
export const date = (d, lang, opts = { month: 'short', day: 'numeric' }) => new Intl.DateTimeFormat(lang === 'ja' ? 'ja-JP' : 'en-GB', opts).format(new Date(d));

/** Lucide-style icons (24px grid, 2px stroke), the set Basecoat's own markup uses. */
const ICONS = {
  home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  plus: '<path d="M5 12h14M12 5v14"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  cart: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
  bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18M16 10a4 4 0 0 1-8 0"/>',
  file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>',
  folder: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z"/>',
  chart: '<path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-3"/>',
  box: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/>',
  hash: '<path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/>',
  message: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z"/>',
  board: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18M15 3v18"/>',
  game: '<path d="M6 12h4M8 10v4M15 13h.01M18 11h.01"/><rect width="20" height="12" x="2" y="6" rx="2"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  trash: '<path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
  edit: '<path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  more: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  menu: '<path d="M4 12h16M4 6h16M4 18h16"/>',
  back: '<path d="m15 18-6-6 6-6"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  star: '<path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>',
  heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7z"/>',
  calendar: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  send: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
  smile: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
  tag: '<path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4z"/><circle cx="7.5" cy="7.5" r=".5"/>',
  grip: '<circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  alert: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
  undo: '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>',
};
/** icon('cart', 'size-4') */
export const icon = (name, cls = '') => raw(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="${cls}">${ICONS[name] || ''}</svg>`);

// ---- toasts (Basecoat's toaster) ----
const toastActions = (window.__pgToast = window.__pgToast || {});
let toastN = 0;
export function toast({ category = 'success', title, description, action, duration }) {
  const t = document.getElementById('toaster');
  if (!t?.toast) return;
  const cfg = { category, title, description, duration };
  if (action) { const id = 't' + (++toastN); toastActions[id] = action.run; cfg.action = { label: action.label, onclick: `window.__pgToast['${id}']()` }; }
  t.toast(cfg);
}

// ---- dialogs (Basecoat's dialog, built in code) ----
/** Opens a Basecoat dialog. body: html``. Returns {el, close}. Buttons with data-close close it; data-action buttons call the app's actions. */
export function dialog({ title, description, body = '', footer = '', wide = false, onAction }) {
  const d = document.createElement('dialog');
  d.className = 'dialog';
  d.setAttribute('aria-labelledby', 'pg-dlg-title');
  if (document.querySelector('#stage[lang]')) d.lang = document.querySelector('#stage').lang;
  d.innerHTML = html`<div class="${wide ? 'sm:max-w-2xl' : 'sm:max-w-md'}">
    <header><h2 id="pg-dlg-title">${title}</h2>${description ? html`<p>${description}</p>` : ''}</header>
    <section>${body}</section>
    ${footer ? html`<footer>${footer}</footer>` : ''}
    <button type="button" class="btn" data-variant="ghost" data-size="icon-sm" aria-label="Close dialog" data-close>${icon('x')}</button>
  </div>`.s;
  const close = () => { d.close(); d.remove(); };
  d.addEventListener('click', (e) => {
    if (e.target === d || e.target.closest('[data-close]')) { close(); return; }
    const a = e.target.closest('[data-action]');
    if (a && onAction) onAction(a.dataset.action, a, e, close);
  });
  d.addEventListener('submit', (e) => { e.preventDefault(); onAction?.(e.target.dataset.submit, e.target, e, close, Object.fromEntries(new FormData(e.target))); });
  d.addEventListener('close', () => d.remove());
  document.body.append(d);
  d.showModal();
  return { el: d, close };
}
/** confirm({title, body, ok, danger}) → Promise<boolean>, an alert-dialog (Esc = cancel). */
export function confirm({ title, body, ok, cancel, danger = false }) {
  return new Promise((resolve) => {
    let done = false;
    const { el } = dialog({
      title, description: body,
      footer: html`<button class="btn" data-variant="outline" type="button" data-close>${cancel}</button>
                   <button class="btn" ${raw(danger ? 'data-variant="destructive"' : '')} type="button" data-action="ok">${ok}</button>`,
      onAction: (name, a, e, close) => { if (name === 'ok') { done = true; resolve(true); close(); } },
    });
    el.addEventListener('close', () => { if (!done) resolve(false); });
  });
}
