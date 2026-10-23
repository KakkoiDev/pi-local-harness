// The Preview (round 7, PreviewWindow card; boards P_Beside … P_Japanese): the project's own app, live, beside the chat.
// One body with two homes: its own window to the right of the chat while the chat keeps 480px, else a third view of
// the main window (Chat · Work · Preview ⌥⌘P). The harness runs the app (harness/preview.py); this file shows it.
import { installRecording } from './recording.mjs';
import { readState, writeState } from './ui.mjs';
/* Task 304: the app runs in a sandboxed frame with its own origin (another port): scripts, forms, dialogs and links in a new tab work, but it can never navigate the workbench page itself (no top navigation). */
export const APP_SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-downloads';

const $ = id => document.getElementById(id);
const SVG = {
  running: '<path d="M3.5 2v12l10-6z" fill="currentColor"/>',
  stopped: '<path d="M5 .5h6L15.5 5v6L11 15.5H5L.5 11V5z" fill="currentColor"/>',
  none: '<circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.5"/>',
  starting: '<circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor"/><path d="M8 4v4.5l3 2" fill="none" stroke="currentColor" stroke-width="1.5"/>',
  done: '<path d="M2 8.5 6 12.5 14 3.5" fill="none" stroke="currentColor" stroke-width="2"/>',
  caution: '<path d="M8 .8 15.4 14.5H.6z" fill="none" stroke="currentColor"/><path d="M8 5.5v4.5M8 11.5v1.5" stroke="currentColor" stroke-width="1.5"/>',
  undo: '<path d="M5.5 2.5 2 6l3.5 3.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M2.5 6h7a4 4 0 0 1 0 8H6" fill="none" stroke="currentColor" stroke-width="1.5"/>',
};
export function glyph(name, size = 12) {
  const span = document.createElement('span'); span.className = 'pw-glyph';
  span.innerHTML = `<svg viewBox="0 0 16 16" width="${size}" height="${size}" aria-hidden="true">${SVG[name]}</svg>`;
  return span;
}
const node = (tag, className = '', text) => { const element = document.createElement(tag); if (className) element.className = className; if (text !== undefined) element.textContent = text; return element; };
const button = (label, onclick, { primary = false, disabled = false } = {}) => { const element = node('button', 'pw-btn' + (primary ? ' pw-btn--default' : ''), label); element.type = 'button'; element.disabled = disabled; element.onclick = onclick; return element; };

const SIZES = { phone: { width: 390, height: 844, label: 'Phone' }, tablet: { width: 768, height: 1024, label: 'Tablet' } };

/** The size's frame for a stage: {width, height, scale, caption} (Phone 390, Tablet 768 × 1024 scaled to fit, Full). */
export function frameFor(size, stage) {
  const room = { width: Math.max(200, stage.width - 32), height: Math.max(200, stage.height - 40) };
  if (size === 'full') return { width: room.width, height: room.height, scale: 1, caption: `Full · ${Math.round(room.width)} wide` };
  const { width, height, label } = SIZES[size] || SIZES.phone;
  const scale = Math.min(1, room.width / width, size === 'tablet' ? room.height / height : 1);
  const shown = { width: Math.round(width * scale), height: Math.round(size === 'tablet' ? height * scale : Math.min(height, room.height)) };
  return { ...shown, scale, caption: size === 'tablet' ? `Tablet · 768 × 1024${scale < 1 ? ` · shown at ${Math.round(scale * 100)}%` : ''}` : `Phone · 390 wide` };
}

/** The app's address with the page and the language asked for (the starters read ?lang=). */
export function appAddress(url, path = '/', language = '') {
  const address = new URL(path.startsWith('/') ? path : '/' + path, url);
  if (language) address.searchParams.set('lang', language);
  return address.href;
}

/** The message Ask Pi to Fix sends (P_Fixing): the last line in the words, the 8 lines beside it. */
export function fixMessage(error) {
  const lines = String(error || '').split('\n').filter(line => line.trim());
  return { message: `The app stopped. Its last line: ${lines.at(-1) || 'none'}. Please fix it so the app starts again.`, lines: lines.slice(-8) };
}

// On this Mac the frame loads the app at 127.0.0.1; from another device (a phone on the tailnet) it cannot, so the
// Preview uses the app's own tailnet address (P_OnPhone, Ph_Preview).
const REMOTE = typeof location !== 'undefined' && !['127.0.0.1', 'localhost', '[::1]'].includes(location.hostname);
const phoneScreen = () => matchMedia('(max-width:760px)').matches;

export function installPreview({ api, project, send, showView, view, working, onLayout, openOnPhone, phoneOff, themeReady, toast }) {
  const body = $('preview-body'), beside = $('preview'), slot = $('preview-view');
  let status = { state: 'none' }, shown = false, timer = 0, lastNote = '', fixing = false, mode = 'beside', loadedSrc = '';
  const settings = () => readState('preview.' + (project()?.id || ''), { open: false, seen: false, size: 'phone', language: document.documentElement.lang === 'ja' ? 'ja' : 'en', path: '/' });  // the app starts in the workbench's language
  const save = change => writeState('preview.' + (project()?.id || ''), { ...settings(), ...change });

  // Its parts, built once (the card's markup).
  const host = node('span', 'pw-address__host'), path = node('input'); path.setAttribute('aria-label', 'Page');
  const address = node('label', 'pw-address'); address.append(host, path);
  const reload = button('Reload', () => status.terminal?restart():load(true));
  const sizes = segment('Size', [['phone', 'Phone'], ['tablet', 'Tablet'], ['full', 'Full']], value => { save({ size: value }); draw(); });
  let terminalNatural={width:816,height:488},terminalAdjustments=0,control=false;
  const terminalSizes=segment('Terminal size',[['80x24','80 × 24'],['120x40','120 × 40'],['fit','Fit']],value=>{save({terminalSize:value});terminalAdjustments=0;terminalNatural=value==='120x40'?{width:1216,height:808}:{width:816,height:488};draw();});
  const languages = segment('App language', [['en', 'English'], ['ja', '日本語']], value => { save({ language: value }); load(true); });
  const bar1 = node('div', 'pw-toolbar'), bar2 = node('div', 'pw-toolbar'); bar1.append(address, reload); bar2.append(sizes.element, languages.element);
  const note = node('p', 'pw-preview__note'); note.setAttribute('role', 'status'); note.hidden = true;
  const stage = node('div', 'pw-preview__stage pw-desk');
  const keys=node('div','pw-terminal-keys');
  const frame = node('div', 'pw-preview__frame'), iframe = node('iframe'), caption = node('span', 'pw-preview__caption');
  iframe.title = 'The app'; iframe.setAttribute('sandbox', APP_SANDBOX); frame.append(iframe);
  const state = node('span', 'pw-glyph'); state.setAttribute('role', 'status');
  const stopStart = button('Stop', () => (status.state === 'running' || status.state === 'starting' ? stop() : start()));
  const onPhone = button('Open on Phone…', () => phone().then(url => url && openOnPhone(project().name, url)), { disabled: true });
  const openApp = button('Open App', () => phone().then(url => url && window.open(url, '_blank', 'noopener')), { disabled: true }); // Ph_Preview: Safari, then Add to Home Screen
  const inBrowser = button('Open in Browser', () => window.open(appAddress(base(), settings().path, settings().language), '_blank', 'noopener'), { disabled: true });
  let asked = false;
  const base = () => (REMOTE && status.phone ? status.phone : status.url);
  async function phone() {  // the app's tailnet address, served while it runs
    const found = await api('/api/preview/phone', { project: project().id });
    if (found.url) { status.phone = found.url; return found.url; }
    if (/Phone access is off/.test(found.problem || '')) phoneOff?.();
    else await (await import('./dialogs.mjs')).ask({ icon: 'note', message: 'The app could not be opened on a phone.', detail: found.problem || '', danger: 'Cancel', safe: 'OK', plain: true });
    return null;
  }
  const recording = installRecording({ api, project, iframe, toast, available: () => status.state === 'running' && !status.terminal && !REMOTE });
  const foot = node('div', 'pw-preview__foot'); foot.append(state, stopStart, recording.status, node('span', 'pw-preview__gap'), onPhone, inBrowser);
  const themeNote = node('p', 'pw-preview__note pw-preview__note--theme', '◐ Showing the unsaved theme · Save or Discard in the chat'); themeNote.hidden = true;  // task 312, round 12
  body.append(bar1, bar2, note, themeNote, recording.notice, stage,keys, foot);
  // Task 312: the theme panel's changes go to the helper the Preview's proxy adds to the app (harness/theme-helper.js);
  // each page it loads says it is ready, and gets the panel's last changes again.
  let themeMaps = null;
  const postTheme = maps => { themeMaps = maps; if (!iframe.src || status.terminal) return; try { iframe.contentWindow?.postMessage({ type: 'pi-theme', ...maps }, new URL(iframe.src).origin); } catch { /* not loaded yet: sent again when it is ready */ } };
  window.addEventListener('message', event => {
    if (event.source !== iframe.contentWindow || !iframe.src || event.origin !== new URL(iframe.src).origin || event.data?.type !== 'pi-theme-ready') return;
    if (themeMaps) postTheme(themeMaps);
    themeReady?.(Boolean(event.data.dark));
  });
  const terminalKey=(key,value)=>{if(!iframe.src)return;iframe.contentWindow.postMessage({type:key==='Control'?'pi-terminal-control':'pi-terminal-key',key,value},new URL(iframe.src).origin);};
  for(const [key,label] of [['Escape','Esc'],['Tab','Tab'],['ArrowUp','↑'],['ArrowDown','↓'],['Control','Ctrl'],['Enter','Return']]){const el=button(label,()=>{if(key==='Control'){control=!control;el.setAttribute('aria-pressed',String(control));}terminalKey(key,control);});if(key==='Control')el.setAttribute('aria-pressed','false');keys.append(el);}
  window.addEventListener('message',event=>{if(!status.terminal||event.source!==iframe.contentWindow||!iframe.src||event.origin!==new URL(iframe.src).origin)return;
   if(event.data?.type==='pi-terminal-control'){control=false;keys.querySelector('[aria-pressed]')?.setAttribute('aria-pressed','false');}
   const selected=settings().terminalSize||'80x24',target=selected==='120x40'?[120,40]:[80,24],{width,height}=event.data||{};
   if(event.data?.type==='pi-terminal-size'&&selected!=='fit'&&Number.isInteger(width)&&width>0&&Number.isInteger(height)&&height>0&&terminalAdjustments<4&&(width!==target[0]||height!==target[1])){terminalAdjustments++;terminalNatural={width:Math.ceil(terminalNatural.width*target[0]/width),height:Math.ceil(terminalNatural.height*target[1]/height)};draw();}
  });
  path.onkeydown = event => { if (event.key === 'Enter') { event.preventDefault(); save({ path: path.value.trim() || '/' }); load(true); } };

  function segment(label, items, choose) {
    const element = node('div', 'pw-seg'); element.setAttribute('role', 'radiogroup'); element.setAttribute('aria-label', label);
    const radios = items.map(([value, text]) => { const radio = node('button', '', text); radio.type = 'button'; radio.setAttribute('role', 'radio'); radio.dataset.value = value; radio.onclick = () => { choose(value); sync(value); }; return radio; });
    const sync = value => radios.forEach(radio => { radio.setAttribute('aria-checked', String(radio.dataset.value === value)); radio.tabIndex = radio.dataset.value === value ? 0 : -1; });
    element.append(...radios);
    return { element, sync, enable: on => radios.forEach(radio => { radio.disabled = !on; }) };
  }

  // Beside the chat while it keeps 480px, else a view (P_Narrow). The body moves between the two homes.
  function layout() {
    const desk = $('desk'), main = $('main-window');
    const others = [...desk.children].filter(child => child !== main && child !== beside && !child.hidden && getComputedStyle(child).display !== 'none').reduce((sum, child) => sum + child.offsetWidth + 24, 0);
    const room = desk.clientWidth - 48 - others;
    const next = matchMedia('(max-width:760px)').matches || room - 480 - 24 < 480 ? 'view' : 'beside';
    if (next !== mode) {
      mode = next;
      // Narrowed under the chat: the Preview becomes a view, and stays the one shown. Work with Review leaves no room
      // either (it ran past the edge at 1440 px, task 224): the Preview steps aside without taking over Work.
      if (mode === 'view' && !beside.hidden) { beside.hidden = true; if (shown && view() === 'chat') showView('preview'); }
      else if (mode === 'beside' && settings().open && !['activity', 'gate'].includes(view())) { beside.hidden = false; if (view() === 'preview') showView('chat'); refresh(true); }
    }
    const home = mode === 'view' ? slot : beside;
    if (body.parentElement !== home) home.append(body);
    $('preview-tab').hidden = mode !== 'view'; $('preview-toggle').hidden = mode === 'view';
    onLayout?.(mode);
  }
  window.addEventListener('keydown',event=>{if(status.terminal&&visible()&&(event.metaKey||event.ctrlKey)&&event.code==='Period'){event.preventDefault();terminalKey('Interrupt');}});
  new ResizeObserver(layout).observe($('desk'));

  function visible() { return mode === 'beside' ? !beside.hidden && !['activity', 'gate'].includes(view()) : view() === 'preview'; }
  function setShown(next) {
    shown = next; save({ open: next, seen: true });
    if (mode === 'beside') beside.hidden = !next; else if (next) showView('preview'); else if (view() === 'preview') showView('chat');
    $('preview-toggle').setAttribute('aria-pressed', String(next));
    for (const item of document.querySelectorAll('[data-command="toggle-preview"][aria-checked]')) item.setAttribute('aria-checked', String(next));
    if (next) { refresh(true); } else { clearTimeout(timer); }
  }

  async function refresh(starting = false) {
    clearTimeout(timer);
    const current = project(); if (!current) return;
    try {
      status = await api(`/api/preview?project=${encodeURIComponent(current.id)}`);
      if (starting && status.state === 'none' && status.kind === 'app') status = await api('/api/preview/start', { project: current.id });
      if (fixing && status.state === 'running') fixing = false; // the reloader brought it back after Pi's fix
      if (fixing && status.state === 'stopped' && !(await working())) { fixing = false; status = await api('/api/preview/start', { project: current.id }); }
    } catch (error) { status = { state: 'none', kind: 'error', message: error.message }; }
    draw(); void recording.refresh();
    if (visible()) timer = setTimeout(refresh, status.state === 'running' ? 2000 : 1000);
  }
  async function restart(){await stop();await start();}
  async function start() { status = await api('/api/preview/start', { project: project().id }); fixing = false; draw(); refresh(); }
  async function stop() { await api('/api/preview/stop', { project: project().id }); status = { state: 'none', kind: 'app', stopped: true }; loadedSrc = ''; draw(); }

  function load(force = false) {
    if (status.state !== 'running') return;
    if (REMOTE && !status.phone) { if (!asked) { asked = true; phone().then(url => { if (url) load(true); }); } return; }
    const src = appAddress(base(), settings().path, settings().language);
    if (force || src !== loadedSrc) { loadedSrc = src; iframe.src = src; }
  }

  function empty(title, ...parts) {
    const box = node('div', 'pw-preview__empty'); const heading = node('p'); heading.append(node('b', '', title));
    box.append(glyph(status.state === 'stopped' ? 'stopped' : status.state === 'starting' ? 'starting' : 'none', 16), heading, ...parts);
    return box;
  }

  function draw() {
    const current = project(), chosen = settings();
    $('preview-title').textContent = current ? `Preview · ${current.name}` : 'Preview';
    host.textContent = status.terminal?'Runs':status.kind === 'notweb' || !current ? '—' : current.name; path.value = status.terminal?status.command:chosen.path;reload.textContent=status.terminal?'Restart':'Reload';
    const terminal=Boolean(status.terminal);keys.hidden=!terminal||!phoneScreen();terminalSizes.sync(chosen.terminalSize||'80x24');bar2.replaceChildren(terminal?terminalSizes.element:sizes.element,languages.element);
    sizes.sync(chosen.size); languages.sync(chosen.language);
    const running = status.state === 'running', app = status.kind !== 'notweb' && status.kind !== 'empty';
    body.classList.toggle('pw-preview--dim', status.kind === 'notweb');
    path.disabled = !running||terminal;reload.disabled = !running; sizes.enable(app); languages.enable(app);
    onPhone.disabled = inBrowser.disabled = openApp.disabled = !running;
    // Ph8_Preview (round 8): on a phone the app takes the width; the foot is the state, Stop / Start and Open App. The app's
    // language moved to Preview's view menu (Ph8_PreviewMenu).
    const small = phoneScreen(); bar2.hidden = small;
    if (small && foot.lastElementChild !== openApp) foot.replaceChildren(state, stopStart, recording.status, node('span', 'pw-preview__gap'), openApp);
    if (!small && foot.lastElementChild !== inBrowser) { bar2.replaceChildren(terminal?terminalSizes.element:sizes.element, languages.element); foot.replaceChildren(state, stopStart, recording.status, node('span', 'pw-preview__gap'), onPhone, inBrowser); }
    const word = { running: 'Running', starting: 'Starting…', stopped: 'Stopped' }[status.state] || (status.stopped ? 'Stopped' : 'No app');
    state.replaceChildren(glyph(status.state === 'running' ? 'running' : status.state === 'starting' ? 'starting' : status.state === 'stopped' || status.stopped ? 'stopped' : 'none'), word);
    stopStart.textContent = running || status.state === 'starting' ? 'Stop' : 'Start';
    stopStart.disabled = !app;
    // The note line, after a change reloaded the app (P_Changed); the page in the frame reloads with it.
    const said = status.note ? status.note.text + status.note.time : '';
    note.hidden = !status.note;
    if (status.note) { note.replaceChildren(glyph(/^Undo/.test(status.note.text) ? 'undo' : 'done'), node('span', '', status.note.text), node('time', '', status.note.time)); }
    if (said && said !== lastNote) { lastNote = said; load(true); }
    if (running) {
      let fit = frameFor(phoneScreen() ? 'full' : chosen.size, { width: (stage.clientWidth || 448) + (phoneScreen() ? 32 : 0), height: (stage.clientHeight || 600) + (phoneScreen() ? 40 : 0) });
      if(terminal){const natural=chosen.terminalSize==='fit'?{width:Math.max(200,stage.clientWidth-32),height:Math.max(200,stage.clientHeight-40)}:terminalNatural;const scale=Math.min(1,Math.max(200,stage.clientWidth-32)/natural.width);fit={width:Math.round(natural.width*scale),height:Math.round(natural.height*scale),scale,caption:chosen.terminalSize==='fit'?'Fit':(chosen.terminalSize==='120x40'?'120 × 40':'80 × 24')+' · click it to type; ⌘. sends Control-C'};}
      frame.style.width = fit.width + 'px'; frame.style.height = fit.height + 'px';
      const natural = terminal?(chosen.terminalSize==='fit'?{width:fit.width,height:fit.height}:terminalNatural):chosen.size === 'tablet' ? SIZES.tablet : { width: fit.width, height: fit.height };
      iframe.style.width = natural.width + 'px'; iframe.style.height = natural.height + 'px';
      iframe.style.transform = fit.scale < 1 ? `scale(${fit.scale})` : ''; iframe.style.transformOrigin = '0 0';
      frame.toggleAttribute('data-scaled', fit.scale < 1); caption.textContent = fit.caption;
      if (stage.firstElementChild !== frame) stage.replaceChildren(frame, caption);
      load();
      return;
    }
    loadedSrc = '';
    if (status.state === 'starting') {
      const parts = [];
      if (status.first) parts.push(node('p', 'pw-help', 'The first start installs what the app needs: about 15 seconds. After that it starts in a moment.'));
      if (status.last) parts.push(node('p', 'pw-help pw-mono', status.last));
      stage.replaceChildren(empty('Starting the app…', ...parts));
    } else if (status.state === 'stopped') {
      const lines = String(status.error || '').split('\n'), pre = node('pre', 'pw-preview__error');
      lines.forEach((line, index) => { if (index) pre.append('\n'); if (index === lines.length - 1) pre.append(node('b', '', line)); else pre.append(line); });
      const actions = node('div', 'pw-done__actions');
      const box = empty('The app stopped because of an error.', node('p', 'pw-help', `${new Date().toTimeString().slice(0, 5)} · the app’s last lines:`), pre);
      if (fixing) { box.append(node('p', '', 'Pi is fixing this. The app starts again by itself when Pi finishes.')); actions.append(button('Start Again', start)); }
      else actions.append(button('Ask Pi to Fix', askToFix, { primary: true }), button('Start Again', start));
      box.append(actions); box.setAttribute('role', 'alert'); stage.replaceChildren(box);
    } else if (status.kind === 'notweb') {
      stage.replaceChildren(empty(status.message.split(':')[0] + '.', node('p', 'pw-help', status.message.split(': ').slice(1).join(': '))));
    } else if (status.kind === 'packages') { /* task 331: no second install path: the person's Install Packages… */
      stage.replaceChildren(empty(status.message, node('p', 'pw-help', status.line || '')));
    } else if (status.kind === 'app') {
      stage.replaceChildren(empty('The app is stopped.', node('p', 'pw-help', 'Start runs it again.')));
    } else {
      stage.replaceChildren(empty(status.message || 'This project has no app to show yet.', node('p', 'pw-help', 'Ask Pi for one in the chat, for example “Make a notes app for my class, in Japanese and English.” It appears here as soon as it runs.')));
    }
  }

  async function askToFix() {
    const { message, lines } = fixMessage(status.error);
    fixing = true; draw();
    try { await send({ message, origin: 'preview', lines }); } catch (error) { fixing = false; draw(); throw error; }
  }

  // A project change: its own Preview state (open or closed, size, language, page). The first time a project has an
  // app, the Preview opens by itself, once (P_Answers).
  async function projectChanged() {
    recording.changed();
    clearTimeout(timer); status = { state: 'none' }; lastNote = ''; loadedSrc = ''; fixing = false; asked = false;
    const current = project(); if (!current) { beside.hidden = true; return; }
    try { status = await api(`/api/preview?project=${encodeURIComponent(current.id)}`); } catch { status = { state: 'none' }; }
    const chosen = settings();
    if (chosen.open || (!chosen.seen && status.kind === 'app' && mode === 'beside')) setShown(true);
    else { shown = false; beside.hidden = true; $('preview-toggle').setAttribute('aria-pressed', 'false'); draw(); }
  }

  layout(); draw();
  return {
    toggle: () => setShown(!(mode === 'beside' ? !beside.hidden : view() === 'preview')),
    show: (page = '/') => { save({ path: page }); setShown(true); },
    projectChanged, refresh, layout, mode: () => mode,
    commands: () => ({ language: settings().language, app: status.kind !== 'notweb' && status.kind !== 'empty', running: status.state === 'running' }),
    setLanguage: value => { save({ language: value }); draw(); load(true); },
    reload: () => status.terminal?restart():load(true),
    postTheme,
    themeNote: on => { themeNote.hidden = !on; },
    // Task 312 on a phone: the theme panel shows the app live on top of itself (Ph12_Theme), through the same proxy and
    // helper as this frame. '' when the app does not run (yet), is a terminal app, or this page is remote (no helper).
    liveUrl: async () => {
      const current = project(); if (!current || REMOTE) return '';
      let found = await api(`/api/preview?project=${encodeURIComponent(current.id)}`);
      if (found.state === 'none' && found.kind === 'app') found = await api('/api/preview/start', { project: current.id });
      return found.state === 'running' && !found.terminal && found.url ? appAddress(found.url, settings().path, settings().language) : '';
    },
    openApp: () => openApp.click(),
    stateWord: () => ({ running: '▶ Running', starting: '◷ Starting…', stopped: '⬣ Stopped' }[status.state] || (status.kind === 'app' ? '○ Not started' : '○ No app')),
    viewShown: on => { if (mode === 'view') { shown = on; if (on) refresh(true); else clearTimeout(timer); } },
  };
}
