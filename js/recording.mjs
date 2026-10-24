// Preview adapter: structural events only. All async work is bound to its original project and document.
const element = (tag, text, css) => { const e = document.createElement(tag); if (text) e.textContent = text; if (css) e.className = css; return e; };
export function installRecording({ api, project, iframe, available, toast = () => {} }) {
  const status = element('button', 'Recording status unknown', 'pw-recstat'); status.type = 'button'; status.id = 'recording-status';
  status.setAttribute('aria-haspopup', 'dialog'); status.setAttribute('aria-controls', 'recording-popover'); status.setAttribute('aria-expanded', 'false');
  const popup = element('section', '', 'pw-recpop'); popup.id = 'recording-popover'; popup.setAttribute('role', 'dialog'); popup.setAttribute('aria-label', 'Recording'); popup.hidden = true;
  document.getElementById('settings-dialog').append(popup);
  const settings=element('fieldset','','settings-group'); settings.append(element('legend','Preview recording','pw-label'),status); document.getElementById('settings-cancel').parentElement.before(settings);
  const notice = element('div', 'This Preview records which buttons and pages you use (never what you type).', 'pw-notice'); notice.setAttribute('role', 'note'); notice.id = 'preview-recording-notice'; notice.hidden = true;
  let state = null, identity = '', epoch = 0, flow = null, session = null, origin = null, busy = false, fault = false, probe = null;
  const sendControl = () => { if (session && origin) iframe.contentWindow?.postMessage({ type: 'pi-recording-control', session, generation: state?.generation, run: state?.run, enabled: Boolean(state?.enabled && available() && !fault && !flow?.truncated) }, origin); };
  function close() { popup.hidden = true; status.setAttribute('aria-expanded', 'false'); }
  function draw() {
    notice.hidden = true;
    const active = state?.enabled && available() && session && !fault;
    status.dataset.state = fault || !state ? 'paused' : active && !flow?.truncated ? 'on' : 'off';
    status.textContent = fault ? 'Recording paused' : !state ? 'Recording status unknown' : !state.enabled ? 'Not recording' : !available() ? 'Not recording · app stopped' : !session ? "Can't record this page" : flow?.truncated ? 'Flow full · no more actions saved' : `Recording · ${state.steps || 'no'} steps${state.steps ? '' : ' yet'}`;
    status.setAttribute('aria-label', `${status.textContent}. Recording options`);
    sendControl();
  }
  async function refresh() {
    const id = project()?.id, ticket = epoch;
    if (!id) return;
    try {
      const next = await api('/api/recordings?project=' + encodeURIComponent(id));
      if (id !== project()?.id || ticket !== epoch) return;
      if (state && (next.generation !== state.generation || next.run !== state.run)) { flow = null; busy = false; epoch++; }
      state = next; fault = false;
    } catch { if (ticket === epoch) fault = true; }
    draw();
  }
  function button(label, action) { const b = element('button', label, 'pw-btn'); b.type = 'button'; b.onclick = () => void action().catch(() => { fault = true; draw(); }); return b; }
  function show() {
    popup.replaceChildren(element('h3', 'Recording'));
    const facts = element('dl', '', 'pw-facts');
    for (const [key, value] of [['Kept', 'Buttons, focus and navigation keys (text not recorded)'], ['Not kept', 'What you type, passwords, chat or file contents'], ['Where', 'On this host, with this project only'], ['How long', '7 days, at most 20 flows']]) facts.append(element('dt', key), element('dd', value));
    const id = identity, ticket = epoch;
    const post = async body => { const next = await api('/api/recordings', { project: id, ...body }); if (ticket !== epoch || id !== identity) return; state = next; flow = null; epoch++; close(); draw(); status.focus(); };
    popup.append(facts, button(state?.enabled ? 'Stop Recording Preview' : 'Record This Preview', () => post({ action: 'enabled', enabled: !state?.enabled })), button('Stop All Recording', async () => {
      window.dispatchEvent(new Event('recording-stop-all-started'));
      try {
        await api('/api/recordings', { project: identity, action: 'stop_all' });
        await refresh(); close();
        toast('All recording stopped. What was recorded is kept.');
        document.getElementById('ws-recording-status')?.focus();
      } finally { window.dispatchEvent(new Event('recording-stop-all-finished')); }
    }), button('Clear History…', async () => {
      close();
      const { ask } = await import('./dialogs.mjs');
      const answer = await ask({ message: "Move this project's recorded Preview actions to the Trash?", danger: 'Move to Trash', safe: 'Cancel' });
      if (answer === 'danger') await post({ action: 'clear' });
      status.focus();
    }));
    popup.hidden = false; status.setAttribute('aria-expanded', 'true');
    const rect = status.getBoundingClientRect(); popup.style.position = 'fixed'; popup.style.left = Math.max(8, Math.min(rect.left, innerWidth - 360)) + 'px'; popup.style.bottom = Math.max(8, innerHeight - rect.top + 4) + 'px'; popup.style.maxWidth = 'calc(100vw - 16px)'; popup.style.zIndex = '100';
    popup.querySelector('button')?.focus();
  }
  document.getElementById('settings-dialog').addEventListener('close',close);
  window.addEventListener('recording-stop-all-started',()=>{if(state)state={...state,enabled:false};sendControl();});
  window.addEventListener('recording-settings-changed', () => void refresh());
  status.onclick = () => popup.hidden ? show() : close();
  popup.addEventListener('keydown', event => { if (event.key === 'Escape') { event.preventDefault(); close(); status.focus(); } });
  popup.addEventListener('keydown', event => { if (event.key === 'Tab') { const buttons = [...popup.querySelectorAll('button')]; if ((!event.shiftKey && document.activeElement === buttons.at(-1)) || (event.shiftKey && document.activeElement === buttons[0])) { close(); status.focus(); event.preventDefault(); } } });
  function reset() { epoch++; flow = null; session = null; origin = null; busy = false; probe = crypto.randomUUID(); close(); draw(); }
  iframe.addEventListener('load', () => { reset(); try { iframe.contentWindow?.postMessage({ type: 'pi-recording-probe', probe }, new URL(iframe.src).origin); } catch {} });
  window.addEventListener('message', async event => {
    if (event.source !== iframe.contentWindow || !available()) return;
    let expected; try { expected = new URL(iframe.src).origin; } catch { return; }
    if (event.origin !== expected) return;
    const data = event.data;
    if (data?.type === 'pi-recording-ready' && data.probe === probe && typeof data.session === 'string' && data.session.length < 100) { session = data.session; origin = event.origin; draw(); return; }
    if (data?.type !== 'pi-recording-steps' || data.session !== session || data.generation !== state?.generation || data.run !== state?.run || !state?.enabled || fault || busy || flow?.truncated || !Array.isArray(data.steps) || data.steps.length > 50) return;
    const id = identity, ticket = epoch, oldSession = session, generation = state.generation;
    busy = true;
    try {
      const reply = await api('/api/recordings', { project: id, action: 'append', generation, run: state.run, flow_id: flow?.id, flow: { steps: data.steps } });
      if (id !== identity || ticket !== epoch) return;
      if (!reply.flow) { await refresh(); return; }
      const previous = flow?.steps?.length || 0; flow = reply.flow; state.steps += flow.steps.length - previous; draw();
    } catch { if (ticket === epoch) { fault = true; draw(); } }
    finally { if (ticket === epoch) busy = false; event.source?.postMessage({ type: 'pi-recording-ack', session: oldSession, id: data.id }, event.origin); }
  });
  return { status, notice, refresh, changed() { reset(); identity = project()?.id || ''; state = null; void refresh(); } };
}
