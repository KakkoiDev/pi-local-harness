// Task 312, the theme panel (design/briefs/round-12.md part D; built before the designer's drawings, in the existing
// 1-bit parts: pw-card, pw-btn, pw-seg, pw-field). Pi Workbench's own reply in the chat: one group of the app's theme
// tokens (colours, chart colours, radius, spacing, fonts). A change restyles the Preview at once through the helper
// the Preview's proxy adds to the app (harness/theme-helper.js); Save writes the block in styles/input.css and commits
// it as the person's change (harness/theme.py); Discard, or closing unsaved, gives the Preview back its saved look.
import { contrast, toHex } from './theme-colors.mjs';

const node = (tag, className = '', text) => { const element = document.createElement(tag); if (className) element.className = className; if (text !== undefined) element.textContent = text; return element; };
const button = (text, onclick, className = 'pw-btn') => { const element = node('button', className, text); element.type = 'button'; element.onclick = onclick; return element; };
const open = new Set();  // the panels on the page; the Preview gets their changes together
let saved = { light: {}, dark: {} }, sending = 0;

/** What the Preview's helper is sent: the saved block plus every open panel's unsaved changes (null = back to default). */
function maps(state) {
  const out = { light: {}, dark: {}, both: {} };
  const colour = token => (state?.groups ? Object.values(state.groups).some(group => group.rows?.some(row => row.token === token || row.foreground === token)) : true);
  const put = (mode, token, value) => { const target = mode === 'dark' ? out.dark : colour(token) ? out.light : out.both; if (value === null) delete target[token]; else target[token] = value; };
  for (const mode of ['light', 'dark']) for (const [token, value] of Object.entries(saved[mode] || {})) put(mode, token, value);
  for (const panel of open) {
    for (const mode of ['light', 'dark']) for (const [token, value] of Object.entries(panel.edits[mode])) put(mode, token, value);
    for (const [token, value] of Object.entries(panel.fontLive)) put('light', token, value);
  }
  return out;
}
function post(preview, state) { cancelAnimationFrame(sending); sending = requestAnimationFrame(() => preview?.postTheme?.(maps(state))); }

export function themePanel(message, { api, project, preview, saved: onSaved, closed: wasClosed = false, close: onClose }) {
  const group = message.theme.group;
  const card = node('section', 'pw-card pw-theme'); card.dataset.group = group;
  const head = node('div', 'pw-card__head'), title = node('h3', 'pw-card__title', 'Theme'), where = node('span', 'pw-mono pw-theme__file');
  const modes = node('div', 'pw-seg pw-theme__modes'); modes.setAttribute('role', 'radiogroup'); modes.setAttribute('aria-label', 'Light or dark');
  const shows = node('span', 'pw-help pw-theme__shows'); shows.setAttribute('role', 'status');
  head.append(title, where, shows, modes);
  const body = node('div', 'pw-card__body pw-theme__body'), foot = node('div', 'pw-card__foot');
  const status = node('span', 'pw-help pw-theme__status'); status.setAttribute('role', 'status');
  card.append(head, body);
  const panel = { edits: { light: {}, dark: {} }, fonts: {}, fontLive: {} };  // fonts: the families to save; fontLive: their tokens, for the Preview only
  let state = null, mode = 'light', previewDark = null;

  const effective = (side, token) => {
    const edit = panel.edits[side][token];
    if (edit !== undefined) return edit ?? state.defaults[side][token] ?? state.defaults.light[token] ?? '';
    return state.saved[side][token] ?? state.defaults[side][token] ?? state.defaults.light[token] ?? '';
  };
  const changed = (side, token) => panel.edits[side][token] !== undefined || state.saved[side][token] !== undefined;
  const dirty = () => Object.keys(panel.edits.light).length + Object.keys(panel.edits.dark).length + Object.keys(panel.fonts).length > 0;
  function edit(side, token, value) {
    if (value === null && state.saved[side][token] === undefined) delete panel.edits[side][token];
    else if (value !== null && value === state.saved[side][token]) delete panel.edits[side][token];
    else panel.edits[side][token] = value;
    post(preview, state); refresh();
  }
  function setMode(next) {
    mode = next; card.dataset.mode = next;
    for (const radio of modes.children) { const on = radio.dataset.value === next; radio.setAttribute('aria-checked', String(on)); radio.tabIndex = on ? 0 : -1; }
  }
  for (const [value, text] of [['light', 'Light'], ['dark', 'Dark']]) { const radio = button(text, () => setMode(value), ''); radio.setAttribute('role', 'radio'); radio.dataset.value = value; modes.append(radio); }
  setMode('light');
  panel.followPreview = dark => { previewDark = dark; setMode(dark ? 'dark' : 'light'); shows.textContent = `The Preview shows ${dark ? 'dark' : 'light'}.`; };

  // -- one row per colour token: light and dark side by side, the foreground under it, the contrast check --------
  function colourControl(side, token, label) {
    const box = node('div', 'pw-theme__colour'), picker = node('input'), text = node('input', 'pw-field pw-mono'), reset = button('Reset', () => edit(side, token, null), 'pw-btn pw-btn--plain');
    picker.type = 'color'; picker.setAttribute('aria-label', `${label}, ${side}`); text.setAttribute('aria-label', `${label} value, ${side}`); text.spellcheck = false;
    picker.oninput = () => edit(side, token, picker.value);
    text.onchange = () => { const value = text.value.trim(); if (value && toHex(value)) edit(side, token, value); else text.value = effective(side, token); };
    box.append(picker, text, reset);
    box.update = () => { const value = effective(side, token); picker.value = toHex(value) || '#000000'; if (document.activeElement !== text) text.value = value; reset.disabled = !changed(side, token); box.toggleAttribute('data-changed', changed(side, token)); };
    return box;
  }
  function contrastLine(side, row) {
    const line = node('p', 'pw-theme__contrast');
    line.update = () => {
      const ratio = contrast(effective(side, row.foreground || row.token), effective(side, row.foreground ? row.token : row.against));
      const pass = ratio !== null && ratio >= row.minimum;
      line.replaceChildren(node('b', '', pass ? '✓ AA' : '✗ AA'), ` ${ratio === null ? '—' : ratio.toFixed(1) + ':1'}${pass ? '' : row.foreground ? ' · text may be hard to read' : ' · hard to see on the background'}`);
      line.dataset.pass = String(pass);
    };
    return line;
  }
  function colourRows(rows) {
    const table = node('div', 'pw-theme__table'), header = node('div', 'pw-theme__row pw-theme__row--head');
    header.append(node('span', '', 'Token'), node('span', 'pw-theme__side', 'Light'), node('span', 'pw-theme__side', 'Dark')); header.children[1].dataset.mode = 'light'; header.children[2].dataset.mode = 'dark';
    table.append(header);
    const parts = [];
    for (const row of rows) {
      const line = node('div', 'pw-theme__row'), name = node('div', 'pw-theme__name'); line.dataset.token = row.token;
      name.append(node('b', '', row.label), node('span', 'pw-mono', '--' + row.token));
      line.append(name);
      for (const side of ['light', 'dark']) {
        const cell = node('div', 'pw-theme__side'); cell.dataset.mode = side;
        const main = colourControl(side, row.token, row.label); cell.append(main); parts.push(main);
        if (row.foreground) { const fore = colourControl(side, row.foreground, row.label + ' text'); const caption = node('span', 'pw-theme__caption', 'Text on it'); cell.append(caption, fore); parts.push(fore); }
        if (row.minimum) { const check = contrastLine(side, row); cell.append(check); parts.push(check); }
        line.append(cell);
      }
      table.append(line);
    }
    body.append(table);
    return () => parts.forEach(part => part.update());
  }

  // -- radius and spacing: one slider, the derived sizes on samples -------------------------------------------------
  function lengthRows(spec) {
    const token = spec.token, wrap = node('div', 'pw-theme__length'), slider = node('input'), value = node('span', 'pw-mono pw-theme__value'), reset = button('Reset', () => edit('light', token, null), 'pw-btn pw-btn--plain');
    slider.type = 'range'; slider.min = spec.min; slider.max = spec.max; slider.step = spec.step; slider.setAttribute('aria-label', spec.title);
    slider.oninput = () => edit('light', token, `${Number(slider.value)}rem`);
    const control = node('div', 'pw-theme__slider'); control.append(slider, value, reset);
    const samples = node('div', 'pw-theme__samples');
    wrap.append(control, samples); body.append(wrap);
    const rem = text => { const found = String(text).match(/^([\d.]+)(rem|px)$/); return found ? Number(found[1]) / (found[2] === 'px' ? 16 : 1) : 0; };
    return () => {
      const current = effective('light', token), base = rem(current);
      slider.value = String(base); value.textContent = current; reset.disabled = !changed('light', token);
      if (token === 'radius') {
        const px = base * 16, sizes = [['sm', px - 4], ['md', px - 2], ['lg', px], ['xl', px + 4]];
        samples.replaceChildren(...sizes.map(([name, size]) => { const sample = node('span', 'pw-theme__sample', `rounded-${name} · ${Math.max(0, Math.round(size))}px`); sample.style.borderRadius = Math.max(0, size) + 'px'; return sample; }),
          (() => { const field = node('span', 'pw-theme__sample pw-theme__sample--field', 'Input'); field.style.borderRadius = Math.max(0, px - 2) + 'px'; return field; })());
      } else {
        const px = base * 16;
        samples.replaceChildren(...[2, 4, 6, 8].map(step => { const sample = node('span', 'pw-theme__sample', `p-${step} · ${Math.round(px * step)}px`); sample.style.padding = Math.min(48, px * step) / 2 + 'px'; return sample; }));
      }
    };
  }

  // -- fonts: every Google Fonts family, searched; the panel's sample loads it from Google for your eyes only ------
  function fontRows() {
    const parts = [];
    for (const [key, label, token] of [['sans', 'Body font', 'font-sans'], ['heading', 'Headings', 'font-heading']]) {
      const row = node('div', 'pw-theme__font'), name = node('div', 'pw-theme__name'), current = node('span', 'pw-theme__value'), search = node('input', 'pw-field'), list = node('div', 'pw-theme__fonts'), sample = node('p', 'pw-theme__specimen', 'The quick brown fox · いろはにほへと');
      const reset = button('Reset', () => { if (state.fonts[key]) { panel.fonts[key] = null; panel.fontLive[token] = null; } else { delete panel.fonts[key]; delete panel.fontLive[token]; } post(preview, state); refresh(); }, 'pw-btn pw-btn--plain');
      search.type = 'search'; search.placeholder = 'Search Google Fonts'; search.setAttribute('aria-label', `${label}: search Google Fonts`); list.setAttribute('role', 'listbox'); list.setAttribute('aria-label', `${label}: fonts`);
      name.append(node('b', '', label), node('span', 'pw-mono', '--' + token));
      let timer = 0;
      search.oninput = () => { clearTimeout(timer); timer = setTimeout(async () => {
        try {
          const found = await api(`/api/theme/fonts?q=${encodeURIComponent(search.value)}`);
          list.replaceChildren(...found.families.slice(0, 12).map(item => { const choice = button(item.family, () => choose(item), 'pw-menu__item'); choice.setAttribute('role', 'option'); choice.append(node('span', 'pw-menu__key', item.category)); return choice; }));
          if (!found.families.length) list.replaceChildren(node('p', 'pw-help', found.offline ? 'The font list is not available offline yet.' : 'No font has that name.'));
        } catch (error) { list.replaceChildren(node('p', 'pw-help', error.message)); }
      }, 200); };
      function choose(item) {
        panel.fonts[key] = item.family; panel.fontLive[token] = `"${item.family}", ui-sans-serif, system-ui, sans-serif`;
        specimen(item.family); list.replaceChildren(); search.value = ''; post(preview, state); refresh();
      }
      function specimen(family) {  // for the person's eyes, in the panel only; the app gets its own copy on Save
        if (!family) { sample.style.fontFamily = ''; return; }
        const id = 'pw-theme-font-' + family.replace(/\W+/g, '-');
        if (!document.getElementById(id)) { const link = node('link'); link.id = id; link.rel = 'stylesheet'; link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}&display=swap`; document.head.append(link); }
        sample.style.fontFamily = `"${family}", system-ui, sans-serif`;
      }
      const control = node('div', 'pw-theme__slider'); control.append(current, reset);
      row.append(name, control, search, list, sample); body.append(row);
      parts.push(() => {
        const family = key in panel.fonts ? panel.fonts[key] : state.fonts[key];
        current.textContent = family || (key === 'sans' ? 'Basecoat’s default (Geist Sans, else the system font)' : 'Same as the body font');
        reset.disabled = !family && !(key in panel.fonts); specimen(family);
      });
    }
    body.append(node('p', 'pw-help', 'Save downloads the chosen fonts into the project (static/fonts, with their licence): the app never loads them from Google.'));
    return () => parts.forEach(part => part());
  }

  let update = () => {};
  function refresh() {
    if (!state?.available) return;
    update();
    const unsaved = dirty(); save.disabled = !unsaved; discard.textContent = unsaved ? 'Discard' : 'Close';
    if (unsaved) status.textContent = 'Not saved. The Preview shows the change.';
  }
  const save = button('Save', async () => {
    save.disabled = true; status.textContent = Object.values(panel.fonts).some(Boolean) ? 'Saving, and downloading the font…' : 'Saving…';
    try {
      const result = await api('/api/theme/save', { project, light: panel.edits.light, dark: panel.edits.dark, fonts: panel.fonts });
      if (result.state) { state = result.state; saved = state.saved; }
      panel.edits = { light: {}, dark: {} }; panel.fonts = {}; panel.fontLive = {};
      for (const other of open) if (other !== panel && result.state) other.reload(result.state);
      post(preview, state); refresh(); status.textContent = result.message; onSaved?.(result);
    } catch (error) { status.textContent = error.message; save.disabled = false; }
  }, 'pw-btn pw-btn--default');
  const discard = button('Close', () => {
    const unsaved = dirty(); panel.edits = { light: {}, dark: {} }; panel.fonts = {}; panel.fontLive = {}; post(preview, state);
    if (unsaved) { refresh(); status.textContent = 'Discarded. The Preview is back to the saved theme.'; return; }
    collapse(); onClose?.();
  });
  foot.append(save, discard, status);

  function collapse() {
    open.delete(panel); post(preview, state);
    const line = node('div', 'pw-card__line'), again = button('Open Again', () => { card.replaceChildren(head, body, foot); open.add(panel); post(preview, state); onClose?.(false); }, 'pw-link');
    line.append(node('b', '', title.textContent), node('span', '', 'closed'), again);
    card.replaceChildren(line);
  }

  async function load() {
    try { state = await api(`/api/theme?project=${encodeURIComponent(project)}`); }
    catch (error) { state = { available: false, message: error.message }; }
    if (!state.available) {  // a project without the starter's CSS: the message, nothing else
      title.textContent = 'Theme'; head.replaceChildren(title);
      body.replaceChildren(node('p', '', state.message), ...(state.detail ? [node('p', 'pw-help', state.detail)] : []));
      return;
    }
    saved = state.saved;
    const spec = state.groups[group]; title.textContent = spec.title; where.textContent = state.path; card.setAttribute('aria-label', 'Theme: ' + spec.title);
    if (spec.kind !== 'colour') { modes.hidden = true; }
    update = spec.kind === 'colour' ? colourRows(spec.rows) : spec.kind === 'length' ? lengthRows(spec) : fontRows();
    card.append(foot); open.add(panel);
    if (previewDark !== null) panel.followPreview(previewDark);
    refresh(); status.textContent = 'Changes show in the Preview as you make them.';
    if (wasClosed) collapse();
  }
  card.setAttribute('aria-label', 'Theme');
  panel.reload = next => { if (!state?.available || !next?.available) return; state = { ...state, saved: next.saved, fonts: next.fonts }; refresh(); };
  load();
  return card;
}

/** The Preview's helper says it is ready (a page loaded) and whether the app shows dark: every panel follows. */
export function previewReady(dark) { for (const panel of open) panel.followPreview?.(dark); }
/** After an Undo or Redo, panels read the saved theme again (the block changed under them). */
export async function themeChanged(api, project, preview) {
  try {
    const state = await api(`/api/theme?project=${encodeURIComponent(project)}`);
    if (state.available) { saved = state.saved; for (const panel of open) panel.reload(state); }
    post(preview, state);
  } catch { /* the panel says it on its next save */ }
}
/** Another project's chat: its panels leave, and the Preview gets no changes from them. */
export function forgetPanels(preview) { open.clear(); saved = { light: {}, dark: {} }; post(preview, null); }
