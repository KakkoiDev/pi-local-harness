// Task 312, the theme panel, rebuilt to the designer's round 12 drawing (card ThemePanel; boards R12_ThemeColours,
// R12_ThemeRadius, R12_ThemeParts, Ph12_Theme, Ph12_ThemePick). Pi Workbench's own reply in the chat (“no model”):
// one group of the app's theme per panel, switched by the tabs in its head (Colours · Radius · Spacing · Chart, and
// Fonts, which the designer has not drawn yet). A change restyles the Preview at once through the helper the Preview's
// proxy adds to the app (harness/theme-helper.js); Save Theme writes the block in styles/input.css and commits it as the
// person's change (harness/theme.py); Discard, or leaving without saving, gives the Preview back its saved look.
// The workbench chrome stays 1-bit: only the swatches and samples carry the app's colours.
import { contrast, toHex, toHsv, fromHsv, toOklch, distance, parseColour } from './theme-colors.mjs';
import { glyph } from './preview.mjs';
import { undoRequest } from './done-row.mjs';
import { readState, writeState, icon } from './ui.mjs';

const node = (tag, className = '', text) => { const element = document.createElement(tag); if (className) element.className = className; if (text !== undefined) element.textContent = text; return element; };
const button = (text, onclick, className = 'pw-btn') => { const element = node('button', className, text); element.type = 'button'; element.onclick = onclick; return element; };
const phone = () => matchMedia('(max-width:760px)').matches;
const SIDES = ['light', 'dark'];
const open = new Set();  // the panels on the page; the Preview gets their changes together
let saved = { light: {}, dark: {} }, sending = 0, expected = '', previewRef = null;

/** What the Preview's helper is sent: the saved block plus every open panel's unsaved changes (null = back to default). */
function maps(state) {
  const out = { light: {}, dark: {}, both: {} };
  const colour = token => (state?.allowed ? !['radius', 'spacing', 'font-sans', 'font-heading'].includes(token) : true);
  const put = (mode, token, value) => { const target = mode === 'dark' ? out.dark : colour(token) ? out.light : out.both; if (value === null) delete target[token]; else target[token] = value; };
  for (const mode of SIDES) for (const [token, value] of Object.entries(saved[mode] || {})) put(mode, token, value);
  for (const panel of open) {
    for (const mode of SIDES) for (const [token, value] of Object.entries(panel.edits[mode])) put(mode, token, value);
    for (const [token, value] of Object.entries(panel.fontLive)) put('light', token, value);
  }
  return out;
}
const unsaved = () => [...open].some(panel => panel.dirty());
function post(preview, state) {
  if (preview) previewRef = preview;
  cancelAnimationFrame(sending);
  sending = requestAnimationFrame(() => {
    const sent = maps(state);
    previewRef?.postTheme?.(sent);
    previewRef?.themeNote?.(unsaved());  // ◐ Showing the unsaved theme · Save or Discard in the chat
    for (const panel of open) panel.live?.(sent);
  });
}

// -- the leaving question (R12_ThemeParts): Don't Save · Cancel · Save (default) ------------------------------------
let leaveDialog = null;
function leaveAlert(detail) {
  if (!leaveDialog) {
    leaveDialog = node('dialog', 'pw-dialog'); leaveDialog.id = 'theme-leave-dialog'; leaveDialog.setAttribute('role', 'alertdialog'); leaveDialog.setAttribute('aria-labelledby', 'theme-leave-message');
    const form = node('form'); form.method = 'dialog';
    const alert = node('div', 'pw-alert'), words = node('div'), message = node('p', 'pw-alert__message', 'Save the theme changes before going on?'); message.id = 'theme-leave-message';
    const glyphBox = node('span', 'pw-alert__icon'); glyphBox.append(icon('alert-note'));
    words.append(message, node('p', 'pw-alert__detail')); alert.append(glyphBox, words);
    const actions = node('div', 'pw-dialog__actions');
    const choice = (text, value, className = 'pw-btn') => { const element = node('button', className, text); element.value = value; return element; };
    actions.append(choice('Don’t Save', 'discard'), node('span', 'pw-theme__gap'), choice('Cancel', 'cancel'), choice('Save', 'save', 'pw-btn pw-btn--default'));
    form.append(alert, actions); leaveDialog.append(form); document.body.append(leaveDialog);
  }
  leaveDialog.querySelector('.pw-alert__detail').textContent = detail;
  return new Promise(resolve => {
    leaveDialog.returnValue = '';
    leaveDialog.addEventListener('close', () => resolve(leaveDialog.returnValue || 'cancel'), { once: true });
    leaveDialog.showModal(); leaveDialog.querySelector('.pw-btn--default').focus();
  });
}
const listed = names => names.length < 2 ? names.join('') : names.slice(0, -1).join(', ') + ' and ' + names.at(-1);

/** Sending a message, switching project or closing the panel with unsaved changes asks first. True: go on. */
export async function themeLeave() {
  const dirty = [...open].filter(panel => panel.dirty()); if (!dirty.length) return true;
  const names = [...new Set(dirty.flatMap(panel => panel.names()))];
  const answer = await leaveAlert(`${listed(names)} ${names.length === 1 ? 'is' : 'are'} changed in the Preview only. If you don’t save, the Preview goes back to the saved theme.`);
  if (answer === 'cancel') return false;
  if (answer === 'discard') { dirty.forEach(panel => panel.discard()); return true; }
  for (const panel of dirty) if (!(await panel.save())) return false;
  return true;
}
addEventListener('beforeunload', event => { if (unsaved()) event.preventDefault(); });

/** The next panel made for this theme message id opens full screen on a phone (it was just asked for). */
export function expectPanel(id) { expected = id || ''; }

export function themePanel(message, { api, project, preview, saved: onSaved, closed: wasClosed = false, close: onClose }) {
  let group = message.theme.group;
  const fresh = expected && expected === message.theme.id; if (fresh) expected = '';
  const card = node('section', 'pw-card pw-theme'); card.dataset.themePanel = message.theme.id; card.dataset.group = group;
  const panel = { edits: { light: {}, dark: {} }, fonts: {}, fontLive: {}, live: null };  // fonts: the families to save; fontLive: their tokens, for the Preview only
  let state = null, mode = 'light', previewDark = null, picker = null, expanded = false;
  if (preview) previewRef = preview;

  // -- the parts: the phone's bar and live app (shown full screen only), the head with the tabs, the body, the foot ----
  const bar = node('div', 'pw-theme__bar'), shut = button('Close', () => leaveScreen()), barTitle = node('b', 'pw-theme__bar-title', 'Theme');
  const modes = node('div', 'pw-seg pw-theme__modes'); modes.setAttribute('role', 'radiogroup'); modes.setAttribute('aria-label', 'Light or dark');
  for (const [value, text] of [['light', 'Light'], ['dark', 'Dark']]) { const radio = button(text, () => setMode(value), ''); radio.setAttribute('role', 'radio'); radio.dataset.value = value; modes.append(radio); }
  bar.append(shut, barTitle, modes);
  const live = node('div', 'pw-theme__live'), liveTag = node('span', 'pw-theme__tag', 'Live'); live.append(liveTag);
  const head = node('div', 'pw-card__head'), title = node('h3', 'pw-card__title', 'Theme'), where = node('span', 'pw-mono pw-theme__file');
  const tabs = node('div', 'pw-seg pw-theme__tabs'); tabs.setAttribute('role', 'tablist'); tabs.setAttribute('aria-label', 'Theme');
  head.append(title, tabs, where);
  const body = node('div', 'pw-card__body'), foot = node('div', 'pw-card__foot');
  const status = node('span', 'pw-help pw-theme__status'); status.setAttribute('role', 'status');
  const discard = button('Discard', () => panel.discard()), save = button('Save Theme', () => panel.save());
  foot.append(status, node('span', 'pw-theme__gap'), discard, save);
  const opener = node('div', 'pw-theme__opener'), openScreen = button('Open Theme', () => enterScreen(), 'pw-btn pw-btn--default'), openerStatus = node('span', 'pw-help');
  opener.append(openScreen, openerStatus);
  card.append(head);

  // -- values ----------------------------------------------------------------------------------------------------
  const base = (side, token) => state.defaults[side][token] ?? state.defaults.light[token] ?? '';
  const effective = (side, token) => {
    const edit = panel.edits[side][token];
    if (edit !== undefined) return edit ?? base(side, token);
    return state.saved[side][token] ?? base(side, token);
  };
  const changed = (side, token) => panel.edits[side][token] !== undefined ? panel.edits[side][token] !== null || state.saved[side][token] !== undefined : state.saved[side][token] !== undefined;
  panel.dirty = () => Object.keys(panel.edits.light).length + Object.keys(panel.edits.dark).length + Object.keys(panel.fonts).length > 0;
  function setEdit(side, token, value) {
    if (value === null && state.saved[side][token] === undefined) delete panel.edits[side][token];
    else if (value !== null && value === state.saved[side][token]) delete panel.edits[side][token];
    else panel.edits[side][token] = value;
  }
  function edit(side, tokens, value) { for (const token of tokens) setEdit(side, token, value); post(preview, state); refresh(); }
  /** The plain names of what is unsaved: “Primary”, “Radius 16 px”, “Chart 2”, “Body font”. */
  panel.names = () => {
    if (!state?.available) return [];
    const names = [], tokens = new Set([...Object.keys(panel.edits.light), ...Object.keys(panel.edits.dark)]);
    for (const spec of Object.values(state.groups)) {
      if (spec.rows) for (const row of spec.rows) if ([row.token, ...row.also, row.foreground, ...row.foreground_also].some(token => token && tokens.has(token))) names.push(row.label);
      if (spec.kind === 'length' && tokens.has(spec.token)) names.push(`${spec.title} ${trim(px(effective('light', spec.token)), 2)} px`);
    }
    if ('sans' in panel.fonts) names.push('Body font'); if ('heading' in panel.fonts) names.push('Headings');
    return names;
  };

  function setMode(next) {
    mode = next; card.dataset.mode = next;
    for (const radio of modes.children) { const on = radio.dataset.value === next; radio.setAttribute('aria-checked', String(on)); radio.tabIndex = on ? 0 : -1; }
  }
  setMode('light');
  panel.followPreview = dark => { previewDark = dark; setMode(dark ? 'dark' : 'light'); };

  // -- colours: plain names, light and dark, the swatch with “Aa” in its text colour, hex, contrast, Reset ----------
  function contrastOf(side, row, element, withText = false) {
    if (!row.minimum) { element.hidden = true; return; }
    const ratio = contrast(effective(side, row.foreground || row.token), effective(side, row.foreground ? row.token : row.against));
    const pass = ratio !== null && ratio >= row.minimum, words = ratio === null ? '—' : `${ratio.toFixed(1)} : 1`;
    const text = withText && row.foreground ? ` · with ${toHex(effective(side, row.foreground)) === '#ffffff' ? 'white' : toHex(effective(side, row.foreground)) === '#000000' ? 'black' : 'its'} text` : '';
    element.hidden = false; element.dataset.pass = String(pass);
    if (pass) element.replaceChildren(`${words} · AA ✓${text}`);
    else element.replaceChildren(glyph('caution'), ` ${words} · below AA${text}`);
  }
  const shownHex = value => (parseColour(value)?.a ?? 1) < 1 ? value : toHex(value) || value;
  function valueCell(side, row, tokens, textToken, chart = false) {
    const write = value => (chart ? chartEdit(tokens, value) : edit(side, tokens, value));
    const cell = node('span', 'pw-theme__val'); cell.dataset.mode = side; cell.setAttribute('role', 'cell');
    const swatch = button('Aa', () => togglePicker(swatch, side, row), 'pw-swatch'), hex = node('input', 'pw-theme__hex'), check = node('span', 'pw-contrast');
    swatch.setAttribute('aria-haspopup', 'dialog'); swatch.setAttribute('aria-expanded', 'false'); swatch.setAttribute('aria-label', `${row.label}, ${side}: change colour`);
    hex.setAttribute('aria-label', `${row.label}, ${side}`); hex.spellcheck = false; hex.autocomplete = 'off';
    hex.onchange = () => { const value = hex.value.trim(); if (value && parseColour(value)) { write(value.startsWith('#') ? value.toLowerCase() : value); remember(value); } else hex.value = shownHex(effective(side, row.token)); };
    hex.onkeydown = event => { if (event.key === 'Enter') { event.preventDefault(); hex.dispatchEvent(new Event('change')); } };
    const more = node('span', 'pw-theme__chevron', '›'); more.setAttribute('aria-hidden', 'true');
    cell.append(swatch, hex, check, more);
    cell.update = () => {
      const value = effective(side, row.token);
      swatch.style.background = value; swatch.style.color = textToken ? effective(side, textToken) : '';
      if (document.activeElement !== hex) hex.value = shownHex(value);
      contrastOf(side, row, check);
    };
    return cell;
  }
  function colourRows(rows, chart = false) {
    body.setAttribute('role', 'table');
    const parts = [];
    if (!chart) {
      const header = node('div', 'pw-theme__row pw-theme__row--head'); header.setAttribute('role', 'row');
      for (const [text, side] of [['Colour, with its text'], ['Light', 'light'], ['Dark', 'dark'], ['']]) { const cell = node('span', '', text); cell.setAttribute('role', 'columnheader'); if (side) cell.dataset.mode = side; header.append(cell); }
      body.append(header);
    }
    const shown = !chart && state.groups[group].shown ? state.groups[group].shown : rows.length;
    rows.forEach((row, index) => {
      const line = node('div', 'pw-theme__row' + (chart ? ' pw-theme__row--chart' : '') + (index >= shown ? ' pw-theme__row--extra' : '')); line.dataset.token = row.token; line.setAttribute('role', 'row');
      const name = node('span', 'pw-theme__name'); name.setAttribute('role', 'rowheader'); name.append(node('b', '', row.label)); if (row.where) name.append(node('small', '', row.where));
      line.append(name);
      const tokens = [row.token, ...row.also], textToken = row.foreground || row.against;
      const sides = chart ? ['light'] : SIDES;
      for (const side of sides) { const cell = valueCell(side, row, tokens, textToken, chart); if (chart) cell.dataset.mode = 'both'; line.append(cell); parts.push(cell); }
      const all = [row.token, ...row.also, row.foreground, ...row.foreground_also].filter(Boolean);
      const reset = button('Reset', () => { for (const side of SIDES) for (const token of all) setEdit(side, token, null); post(preview, state); refresh(); }, 'pw-theme__reset');
      line.append(reset); parts.push({ update: () => { reset.disabled = !SIDES.some(side => all.some(token => changed(side, token))); } });
      // On a phone a row is one tap: it opens the picker page for the side shown (Ph12_Theme).
      line.addEventListener('click', event => { if (!phone() || event.target.closest('input, .pw-theme__reset, .pw-swatch')) return; const cell = line.querySelector(`.pw-theme__val[data-mode="${chart ? 'both' : mode}"]`); togglePicker(cell.querySelector('.pw-swatch'), chart ? 'light' : mode, row); });
      body.append(line);
    });
    if (!chart && shown < rows.length) {
      const extra = rows.slice(shown), more = button(`▸ ${extra.length} more: ${extra.map(row => row.label).join(', ')}`, () => { expanded = true; body.removeAttribute('data-collapsed'); more.remove(); }, 'pw-theme__more');
      more.setAttribute('aria-expanded', 'false');
      if (!expanded) { body.dataset.collapsed = ''; body.append(more); }
    }
    let warn = null;
    if (chart) {
      body.append(node('p', 'pw-help pw-theme__note', 'Series in this order. A warning appears when two become hard to tell apart, also for the common kinds of colour blindness.'));
      warn = node('p', 'pw-theme__warn'); warn.setAttribute('role', 'status'); body.append(warn);
    }
    return () => {
      parts.forEach(part => part.update());
      if (warn) {
        const close = [];
        for (let a = 0; a < rows.length; a++) for (let b = a + 1; b < rows.length; b++) { const gap = distance(effective('light', rows[a].token), effective('light', rows[b].token)); if (gap !== null && gap < 0.1) close.push(`${rows[a].label} and ${rows[b].label}`); }
        warn.hidden = !close.length; warn.replaceChildren(...(close.length ? [glyph('caution'), ` Hard to tell apart: ${close.join(' · ')}`] : []));
      }
    };
  }
  // A chart colour is one value for light and dark (the drawing shows one): an edit writes both.
  const chartEdit = (tokens, value) => { for (const side of SIDES) for (const token of tokens) setEdit(side, token, value); post(preview, state); refresh(); };

  // -- the picker: saturation field, hue strip, hex and the oklch it maps to, five recent colours, Esc reverts --------
  const recent = () => readState('theme-recent', []).filter(value => typeof value === 'string' && parseColour(value)).slice(0, 5);
  function remember(value) { const hex = toHex(value); if (hex) writeState('theme-recent', [hex, ...recent().filter(item => item !== hex)].slice(0, 5)); }
  function closePicker(keep = true) {
    if (!picker) return;
    const current = picker; picker = null;
    current.cleanup();
    if (!keep) current.revert(); else if (current.moved) remember(current.value());
    current.element.remove(); current.swatch?.setAttribute('aria-expanded', 'false');
    delete card.dataset.picking;
    if (phone() && card.dataset.screen !== undefined) current.swatch?.closest('.pw-theme__row')?.focus?.();
    else current.swatch?.focus();
  }
  function togglePicker(swatch, side, row) {
    if (picker?.swatch === swatch) { closePicker(); return; }
    closePicker();
    const chart = state.groups[group].kind === 'chart';
    const targets = { colour: [row.token, ...row.also], text: [row.foreground, ...row.foreground_also].filter(Boolean) };
    const before = {};  // Esc puts back exactly what the edits were
    for (const s of SIDES) for (const token of [...targets.colour, ...targets.text]) before[s + ':' + token] = panel.edits[s][token];
    let target = 'colour';
    const tokens = () => targets[target], read = () => effective(side, tokens()[0]);
    const element = node('div', 'pw-picker'); element.setAttribute('role', 'dialog'); element.setAttribute('aria-label', `${row.label}, ${side}`);
    const back = button('‹ Theme', () => closePicker(), 'pw-picker__back pw-link');
    const heading = node('b', 'pw-picker__title', chart ? row.label : `${row.label} · ${side}`);
    const which = node('div', 'pw-seg pw-picker__which'); which.setAttribute('role', 'radiogroup'); which.setAttribute('aria-label', 'What to change');
    if (targets.text.length) for (const [value, text] of [['colour', 'Colour'], ['text', row.foreground_label || 'Text on it']]) { const radio = button(text, () => { target = value; sync(); }, ''); radio.setAttribute('role', 'radio'); radio.dataset.value = value; which.append(radio); }
    const field = node('div', 'pw-picker__field'), dot = node('span', 'pw-picker__dot'); field.append(dot); field.tabIndex = 0; field.setAttribute('role', 'slider'); field.setAttribute('aria-label', 'Saturation and brightness');
    const hue = node('div', 'pw-picker__hue'), thumb = node('span', 'pw-picker__thumb'); hue.append(thumb); hue.tabIndex = 0; hue.setAttribute('role', 'slider'); hue.setAttribute('aria-label', 'Hue'); hue.setAttribute('aria-valuemin', '0'); hue.setAttribute('aria-valuemax', '360');
    const line = node('div', 'pw-picker__line'), hex = node('input', 'pw-theme__hex'), oklch = node('span', 'pw-help pw-picker__oklch');
    hex.setAttribute('aria-label', `${row.label}, ${side}: hex`); hex.spellcheck = false; hex.autocomplete = 'off'; line.append(hex, oklch);
    const check = node('span', 'pw-contrast pw-picker__contrast');
    const recents = node('div', 'pw-picker__recent'); recents.setAttribute('aria-label', 'Recent colours');
    const help = node('span', 'pw-help pw-picker__help', 'Drag to try; the Preview follows. Esc puts the old value back.');
    const reset = button('Reset', () => { for (const token of tokens()) for (const s of chart ? SIDES : [side]) setEdit(s, token, null); post(preview, state); refresh(); sync(); }, 'pw-btn');
    const done = button('Done', () => closePicker(), 'pw-btn pw-btn--default');
    const actions = node('div', 'pw-picker__foot'); actions.append(reset, done);
    element.append(back, heading, which, field, hue, line, check, recents, help, actions);
    let hsv = toHsv(read()) || { h: 0, s: 0, v: 0 };
    const apply = value => { if (chart) chartEdit(tokens(), value); else edit(side, tokens(), value); current.moved = true; show(false); };
    function show(fromValue = true) {
      if (fromValue) { const next = toHsv(read()); if (next) hsv = next.s === 0 || next.v === 0 ? { ...next, h: hsv.h } : next; }
      field.style.background = `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${fromHsv(hsv.h, 1, 1)})`;
      dot.style.left = hsv.s * 100 + '%'; dot.style.top = (1 - hsv.v) * 100 + '%'; thumb.style.left = hsv.h / 360 * 100 + '%';
      field.setAttribute('aria-valuetext', `saturation ${Math.round(hsv.s * 100)}%, brightness ${Math.round(hsv.v * 100)}%`);
      hue.setAttribute('aria-valuenow', String(Math.round(hsv.h)));
      const value = read(); if (document.activeElement !== hex) hex.value = shownHex(value); oklch.textContent = 'or ' + (toOklch(value) || value);
      contrastOf(side, row, check, true);
    }
    function sync() { for (const radio of which.children) radio.setAttribute('aria-checked', String(radio.dataset.value === target)); hsv = toHsv(read()) || hsv; show(); }
    const pick = () => apply(fromHsv(hsv.h, hsv.s, hsv.v));
    function drag(area, move) {
      area.addEventListener('pointerdown', event => {
        event.preventDefault(); area.setPointerCapture(event.pointerId); area.focus();
        const at = e => { const box = area.getBoundingClientRect(); move(Math.min(1, Math.max(0, (e.clientX - box.left) / box.width)), Math.min(1, Math.max(0, (e.clientY - box.top) / box.height))); pick(); };
        at(event); area.onpointermove = at; area.onpointerup = area.onpointercancel = () => { area.onpointermove = null; };
      });
    }
    drag(field, (x, y) => { hsv = { ...hsv, s: x, v: 1 - y }; });
    drag(hue, x => { hsv = { ...hsv, h: x * 360 }; });
    field.onkeydown = event => {
      const step = event.shiftKey ? 0.1 : 0.02, moves = { ArrowLeft: ['s', -step], ArrowRight: ['s', step], ArrowUp: ['v', step], ArrowDown: ['v', -step] }, found = moves[event.key];
      if (!found) return; event.preventDefault(); hsv = { ...hsv, [found[0]]: Math.min(1, Math.max(0, hsv[found[0]] + found[1])) }; pick();
    };
    hue.onkeydown = event => {
      const step = event.shiftKey ? 20 : 2, found = { ArrowLeft: -step, ArrowDown: -step, ArrowRight: step, ArrowUp: step }[event.key];
      if (found === undefined) return; event.preventDefault(); hsv = { ...hsv, h: (hsv.h + found + 360) % 360 }; pick();
    };
    hex.onchange = () => { const value = hex.value.trim(); if (value && parseColour(value)) { hsv = toHsv(value) || hsv; apply(value.startsWith('#') ? value.toLowerCase() : value); } else hex.value = shownHex(read()); };
    hex.onkeydown = event => { if (event.key === 'Enter') { event.preventDefault(); hex.dispatchEvent(new Event('change')); } };
    for (const value of recent()) { const choice = button('', () => { hsv = toHsv(value) || hsv; apply(value); }, 'pw-swatch'); choice.style.background = value; choice.setAttribute('aria-label', `Use ${value}`); recents.append(choice); }
    recents.hidden = !recents.children.length;
    const current = {
      element, swatch, moved: false, value: read,
      revert: () => { for (const s of SIDES) for (const token of [...targets.colour, ...targets.text]) { const was = before[s + ':' + token]; if (was === undefined) delete panel.edits[s][token]; else panel.edits[s][token] = was; } post(preview, state); refresh(); },
      cleanup: () => { hex.onchange = null; document.removeEventListener('pointerdown', outside, true); document.removeEventListener('keydown', escape, true); removeEventListener('resize', place); document.removeEventListener('scroll', place, true); },
    };
    const escape = event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closePicker(false); } };
    const outside = event => { if (!element.contains(event.target) && event.target !== swatch && !leaveDialog?.open) closePicker(); };
    function place() {  // a popover under the swatch on the desk; on a phone, its own page in the full-screen panel
      if (card.dataset.screen !== undefined) return;
      const box = swatch.getBoundingClientRect(), width = element.offsetWidth || 260, height = element.offsetHeight || 320;
      element.style.left = Math.max(8, Math.min(innerWidth - width - 8, box.left)) + 'px';
      element.style.top = (box.bottom + 6 + height > innerHeight ? Math.max(8, box.top - height - 6) : box.bottom + 6) + 'px';
    }
    picker = current; swatch.setAttribute('aria-expanded', 'true');
    if (card.dataset.screen !== undefined) { card.dataset.picking = ''; card.append(element); }
    else { element.classList.add('pw-picker--popover'); document.body.append(element); place(); }
    document.addEventListener('pointerdown', outside, true); document.addEventListener('keydown', escape, true); addEventListener('resize', place); document.addEventListener('scroll', place, true);
    sync(); (targets.text.length ? which.firstElementChild : field).focus();
  }

  // -- radius and spacing: one slider each, the derived sizes on samples ---------------------------------------------
  const px = text => { const found = String(text).match(/^([\d.]+)(rem|px)$/); return found ? Number(found[1]) * (found[2] === 'rem' ? 16 : 1) : 0; };
  const trim = (value, places) => String(Number(value.toFixed(places)));
  function lengthRows(spec) {
    const token = spec.token, wrap = node('div', 'pw-slider'), id = `theme-${message.theme.id}-${token}`;
    const label = node('label', '', spec.label), value = node('span', 'pw-mono pw-theme__value'), slider = node('input'), reset = button('', () => edit('light', [token], null), 'pw-theme__reset');
    label.htmlFor = id; slider.id = id; slider.type = 'range'; slider.min = spec.min; slider.max = spec.max; slider.step = spec.step;
    slider.oninput = () => edit('light', [token], `${trim(Number(slider.value) / 16, 5)}rem`);
    wrap.append(label, value, slider, reset);
    const samples = node('div', 'pw-samples'); body.append(wrap, samples); body.removeAttribute('role');
    const sample = (text, style) => { const element = node('span', 'pw-sample', text); Object.assign(element.style, style); return element; };
    return () => {
      const current = effective('light', token), size = px(current), unit = token === 'spacing' ? 4 : 3;
      slider.value = String(size); value.textContent = `${(size / 16).toFixed(unit)}rem · ${trim(size, 2)} px`;
      reset.textContent = `Reset (${trim(px(base('light', token)), 2)} px)`; reset.disabled = !changed('light', token);
      const ink = effective(mode, 'foreground'), paper = effective(mode, 'background'), line = effective(mode, 'border');
      const look = { color: ink, background: paper, borderColor: ink };
      if (token === 'radius') {
        const r = n => Math.max(0, size + n) + 'px';
        samples.replaceChildren(
          sample(`Button · sm ${trim(Math.max(0, size - 4), 2)} px`, { ...look, borderRadius: r(-4) }), sample(`Button · md ${trim(Math.max(0, size - 2), 2)} px`, { ...look, borderRadius: r(-2) }),
          sample(`Card · lg ${trim(size, 2)} px`, { ...look, borderRadius: r(0), padding: '12px', width: '160px' }), sample(`Dialog · xl ${trim(size + 4, 2)} px`, { ...look, borderRadius: r(4), padding: '12px', width: '140px' }),
          sample('Field · md', { ...look, borderColor: effective(mode, 'input'), borderRadius: r(-2), padding: '6px 10px', width: '150px', color: effective(mode, 'muted-foreground') }));
      } else {
        const u = n => size * n + 'px', radius = px(effective('light', 'radius')), gap = node('span', 'pw-sample pw-sample--gap'), boxes = node('span', 'pw-sample__boxes');
        boxes.style.gap = u(4); boxes.append(node('span', 'pw-sample__box'), node('span', 'pw-sample__box')); gap.append(boxes, node('span', '', `gap-4 = ${trim(size * 4, 2)} px`));
        samples.replaceChildren(
          sample(`Button · py-2 px-4 = ${trim(size * 2, 2)} × ${trim(size * 4, 2)} px`, { ...look, padding: `${u(2)} ${u(4)}`, borderRadius: Math.max(0, radius - 2) + 'px' }),
          sample(`Card · p-6 = ${trim(size * 6, 2)} px`, { ...look, padding: u(6), borderRadius: radius + 'px', width: '200px', borderColor: line === paper ? ink : ink }), gap);
      }
    };
  }

  // -- fonts (built before the drawings; the designer has not drawn this group yet): every Google Fonts family -------
  function fontRows() {
    body.removeAttribute('role');
    const parts = [];
    for (const [key, label, token] of [['sans', 'Body font', 'font-sans'], ['heading', 'Headings', 'font-heading']]) {
      const row = node('div', 'pw-slider pw-theme__font'), name = node('label', '', label), current = node('span', 'pw-theme__value'), search = node('input', 'pw-field'), list = node('div', 'pw-theme__fonts'), sample = node('p', 'pw-theme__specimen', 'The quick brown fox · いろはにほへと');
      const reset = button('Reset', () => { if (state.fonts[key]) { panel.fonts[key] = null; panel.fontLive[token] = null; } else { delete panel.fonts[key]; delete panel.fontLive[token]; } post(preview, state); refresh(); }, 'pw-theme__reset');
      search.type = 'search'; search.placeholder = 'Search Google Fonts'; search.setAttribute('aria-label', `${label}: search Google Fonts`); list.setAttribute('role', 'listbox'); list.setAttribute('aria-label', `${label}: fonts`);
      search.id = `theme-${message.theme.id}-${key}`; name.htmlFor = search.id;
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
      row.append(name, current, search, reset, list, sample); body.append(row);
      parts.push(() => {
        const family = key in panel.fonts ? panel.fonts[key] : state.fonts[key];
        current.textContent = family || (key === 'sans' ? 'Basecoat’s default (Geist Sans, else the system font)' : 'Same as the body font');
        reset.disabled = !family && !(key in panel.fonts); specimen(family);
      });
    }
    body.append(node('p', 'pw-help pw-theme__note', 'Save downloads the chosen fonts into the project (static/fonts, with their licence): the app never loads them from Google.'));
    return () => parts.forEach(part => part());
  }

  // -- the tabs: one group per panel, switched in place; unsaved changes stay across groups --------------------------
  let update = () => {};
  function showGroup(next) {
    closePicker();
    group = next; card.dataset.group = next;
    const spec = state.groups[next];
    title.textContent = `Theme · ${spec.title}`; card.setAttribute('aria-label', `Theme · ${spec.title}`);
    for (const tab of tabs.children) { const on = tab.dataset.group === next; tab.setAttribute('aria-selected', String(on)); tab.tabIndex = on ? 0 : -1; }
    body.replaceChildren(); body.removeAttribute('data-collapsed');
    update = spec.kind === 'colour' ? colourRows(spec.rows) : spec.kind === 'chart' ? colourRows(spec.rows, true) : spec.kind === 'length' ? lengthRows(spec) : fontRows();
    refresh();
  }
  tabs.onkeydown = event => {
    const list = [...tabs.children], index = list.findIndex(tab => tab.dataset.group === group), step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (!step) return; event.preventDefault(); const next = list[(index + step + list.length) % list.length]; showGroup(next.dataset.group); next.focus();
  };

  function refresh() {
    if (!state?.available) return;
    update();
    const names = panel.names(), dirty = panel.dirty();
    save.disabled = discard.disabled = !dirty; save.classList.toggle('pw-btn--default', dirty);
    const words = dirty ? `${names.length || 1} change${names.length === 1 ? '' : 's'} not saved: ${names.join(', ')} · the Preview shows it now` : 'No changes yet';
    status.textContent = words; openerStatus.textContent = words;
    liveTag.textContent = dirty ? 'Live · unsaved' : 'Live';
  }
  panel.discard = () => {
    closePicker(false);
    panel.edits = { light: {}, dark: {} }; panel.fonts = {}; panel.fontLive = {}; post(preview, state); refresh();
  };
  /** Save Theme: one request; the panel gives way to the saved line in the chat (Open Again brings it back). */
  panel.save = async () => {
    if (!panel.dirty()) return true;
    closePicker();
    save.disabled = true; status.textContent = Object.values(panel.fonts).some(Boolean) ? 'Saving, and downloading the font…' : 'Saving…';
    try {
      const result = await api('/api/theme/save', { project, light: panel.edits.light, dark: panel.edits.dark, fonts: panel.fonts });
      if (result.state) { state = result.state; saved = state.saved; }
      panel.edits = { light: {}, dark: {} }; panel.fonts = {}; panel.fontLive = {};
      for (const other of open) if (other !== panel && result.state) other.reload(result.state);
      if (result.unchanged) { refresh(); status.textContent = result.message; post(preview, state); return true; }
      collapse(true); post(preview, state); onSaved?.(result);
      return true;
    } catch (error) { status.textContent = error.message; save.disabled = false; return false; }
  };

  // -- on a phone: full screen with the live app on top (Ph12_Theme) --------------------------------------------------
  let liveFrame = null, liveOrigin = '', liveTimer = 0;
  async function startLive() {
    clearTimeout(liveTimer);
    const url = await previewRef?.liveUrl?.().catch(() => '');
    if (card.dataset.screen === undefined) return;
    if (!url) { live.replaceChildren(node('p', 'pw-help pw-theme__nolive', 'The app is not running yet: the changes show in the Preview once it is.'), liveTag); liveTimer = setTimeout(startLive, 2000); return; }
    liveFrame = node('iframe'); liveFrame.title = 'The app, live'; liveFrame.src = url; liveOrigin = new URL(url).origin;
    live.replaceChildren(liveFrame, liveTag);
  }
  const fromLive = event => { if (liveFrame && event.source === liveFrame.contentWindow && event.origin === liveOrigin && event.data?.type === 'pi-theme-ready') { post(preview, state); panel.followPreview(Boolean(event.data.dark)); } };
  panel.live = sent => { try { liveFrame?.contentWindow?.postMessage({ type: 'pi-theme', ...sent }, liveOrigin); } catch { /* not loaded yet: it says when it is ready */ } };
  function enterScreen() {
    if (card.dataset.screen !== undefined || !state?.available) return;
    card.dataset.screen = ''; card.prepend(bar, live); document.documentElement.classList.add('pw-theme-screen-open');
    addEventListener('message', fromLive); startLive(); shut.focus();
  }
  async function leaveScreen() {
    if (picker) { closePicker(); return; }
    if (panel.dirty() && !(await themeLeave())) return;
    exitScreen();
  }
  function exitScreen() {
    if (card.dataset.screen === undefined) return;
    closePicker(); clearTimeout(liveTimer); removeEventListener('message', fromLive);
    delete card.dataset.screen; bar.remove(); live.replaceChildren(liveTag); live.remove(); liveFrame = null;
    document.documentElement.classList.remove('pw-theme-screen-open');
    openScreen.focus();
  }
  card.addEventListener('keydown', event => { if (event.key === 'Escape' && card.dataset.screen !== undefined && !picker) { event.preventDefault(); leaveScreen(); } });

  function collapse(afterSave = false) {
    exitScreen(); open.delete(panel); post(preview, state); onClose?.(true);
    const line = node('div', 'pw-card__line'), again = button('Open Again', () => { card.replaceChildren(head, body, foot, opener); open.add(panel); post(preview, state); refresh(); onClose?.(false); }, 'pw-link');
    line.append(node('b', '', title.textContent), node('span', '', afterSave ? 'saved' : 'closed'), again);
    card.replaceChildren(line);
  }

  // -- no theme file: the designer's card, with Add a Theme File (one request you can undo) ---------------------------
  function noTheme() {
    card.className = 'pw-card pw-theme-none'; card.setAttribute('aria-label', 'This project has no theme file');
    const top = node('div', 'pw-card__head'); top.append(icon('note'), node('h3', 'pw-card__title', state.message.replace(/\.$/, '')));
    const words = node('div', 'pw-card__body'); words.append(node('p', '', state.detail || ''));
    card.replaceChildren(top, words);
    if (state.can_add) {
      const bottom = node('div', 'pw-card__foot'), add = button('Add a Theme File', async () => {
        add.disabled = true; note.textContent = 'Adding…';
        try { const result = await api('/api/theme/add', { project }); card.className = 'pw-card pw-theme'; card.replaceChildren(head); await load(); onSaved?.(result); }
        catch (error) { note.textContent = error.message; add.disabled = false; }
      }, 'pw-btn pw-btn--default'), note = node('span', 'pw-help', 'adds Basecoat’s default colours, radius and spacing as one request you can undo');
      bottom.append(add, note); card.append(bottom);
    }
  }

  async function load() {
    try { state = await api(`/api/theme?project=${encodeURIComponent(project)}`); }
    catch (error) { state = { available: false, message: error.message }; }
    if (!state.available) { noTheme(); return; }
    saved = state.saved; where.textContent = state.path;
    if (!state.groups[group]) group = 'colours';
    tabs.replaceChildren(...Object.entries(state.groups).map(([key, spec]) => {
      const tab = button(spec.title, () => showGroup(key), ''); tab.setAttribute('role', 'tab'); tab.dataset.group = key; return tab;
    }));
    card.append(body, foot, opener); open.add(panel);
    if (previewDark !== null) panel.followPreview(previewDark);
    showGroup(group);
    if (wasClosed) collapse();
    else if (fresh && phone()) enterScreen();
  }
  card.setAttribute('aria-label', 'Theme');
  panel.reload = next => { if (!state?.available || !next?.available) return; state = { ...state, saved: next.saved, fonts: next.fonts }; refresh(); };
  load();
  return card;
}

/** The saved line (R12_ThemeParts): ✓ Theme saved: primary, radius · styles/input.css · 14:38, and Undo, in theme words. */
export function themeSavedLine(message, { api, project, ask, send, changed }) {
  const info = message.theme_saved, names = info.names || [];
  const line = node('p', 'pw-done__head pw-theme-saved'), time = message.timestamp ? new Date(message.timestamp).toTimeString().slice(0, 5) : '';
  const what = info.added ? 'Theme file added' : `Theme saved: ${names.map(name => name.replace(/^font-(.*)$/, '$1 font')).join(', ')}`;
  const words = node('span', 'pw-glyph'); words.append(glyph('done'), what);
  line.append(words, node('span', 'pw-theme-saved__where', `· ${info.path}${time ? ' · ' + time : ''}`));
  if (message.commit && project) {
    const plain = names.map(name => name.replace(/^font-(.*)$/, '$1 font')).map(name => name[0].toUpperCase() + name.slice(1).replace(/-/g, ' '));
    const undo = button('Undo', () => undoRequest(message.commit, { project, api, ask, send, changed, wording: info.added
      ? { message: 'Undo adding the theme file?', detail: 'The theme file and Basecoat’s CSS leave the project again. Undo is saved as a new change, so nothing is lost: it can be redone.', danger: 'Undo' }
      : { message: 'Undo the theme save?', detail: `${listed(plain)} ${plain.length === 1 ? 'goes' : 'go'} back to how ${plain.length === 1 ? 'it was' : 'they were'} before this save, in the file and the Preview. Undo is saved as a new change, so nothing is lost: it can be redone.`, danger: 'Undo' } }).catch(() => {}), 'pw-btn');
    line.append(undo);
    api('/api/undo', { project, commit: message.commit, preview: true }).then(data => { if (data.undone) { undo.disabled = true; line.append(node('span', 'pw-help', `undone at ${data.undone_at}`)); } }).catch(() => { undo.disabled = true; });
  }
  return line;
}

/** The harness's hint under Pi's answer when Pi was asked something the panel does (R12_ThemeParts): Open Radius…. */
export function themeHint(group, openGroup) {
  const titles = { colours: 'Colours', radius: 'Radius', spacing: 'Spacing', charts: 'Chart', fonts: 'Fonts' };
  const line = node('p', 'pw-notice'); line.setAttribute('role', 'note');
  const link = button(`Open ${titles[group] || 'Theme'}…`, () => openGroup(group), 'pw-link');
  line.append(icon('note'), node('span', 'pw-notice__who', 'Harness'), node('span', 'pw-notice__text', 'The Theme panel can do this without Pi, and you see it change as you drag.'), link);
  return line;
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
export function forgetPanels(preview) { open.clear(); saved = { light: {}, dark: {} }; document.documentElement.classList.remove('pw-theme-screen-open'); post(preview, null); }
