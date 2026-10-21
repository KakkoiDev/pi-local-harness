// Local shared-profile adapter. Capture never starts before the host confirms the person's opt-in.
import { installRecorder } from '/harness/vendor/test_core_recording/recorder.mjs';
import { ask } from './dialogs.mjs';
const node = (tag, css = '', text = '') => { const e = document.createElement(tag); e.textContent = text || ''; if (css) e.className = css; return e; };
export function installWorkstationRecording({ api, project }) {
  const status = node('button', 'pw-recstat pw-recstat--bar', 'WorkStation recording status unknown'); status.id = 'ws-recording-status'; status.type = 'button'; status.setAttribute('aria-haspopup', 'dialog'); status.setAttribute('aria-expanded', 'false'); status.setAttribute('aria-controls', 'ws-recording-popover');
  document.getElementById('agent-status').before(status); status.style.minWidth = '0'; status.parentElement.style.minWidth = '0';
  const strip = node('div', 'pw-recbar', ''); strip.hidden = true; document.getElementById('phonebar').after(strip);
  const popup = node('section', 'pw-recpop', ''); popup.id = 'ws-recording-popover'; popup.hidden = true; popup.setAttribute('role', 'dialog'); popup.setAttribute('aria-label', 'Recording Pi WorkStation'); document.body.append(popup);
  const settings = node('fieldset', 'settings-group', ''); settings.append(node('legend', 'pw-label', 'Recording'));
  const options = node('button', 'pw-btn', 'Recording Options…'); options.type = 'button'; settings.append(options);
  document.getElementById('settings-cancel').parentElement.before(settings);
  const notice = node('div', 'pw-notice', 'New: Pi WorkStation can record what you do in its windows, so Pi can see what led to a problem. It stays off until you turn it on.'); notice.setAttribute('role', 'note'); notice.hidden = true; document.getElementById('welcome-copy').after(notice);
  let state = null, flow = null, epoch = 0, identity = null, fault = false, busy = false;
  const scope = () => !document.getElementById('settings-dialog')?.open && /^\/p\//.test(location.pathname) ? project()?.id || null : null;
  const request = body => api('/api/recordings', { surface: 'workstation', project: identity, ...body });
  const close = () => { popup.hidden = true; status.setAttribute('aria-expanded', 'false'); };
  function draw() {
    const active = Boolean(state?.enabled && !fault && !flow?.truncated);
    if (recorder.enabled !== active) recorder.setEnabled(active);
    status.dataset.state = fault || !state ? 'paused' : active ? 'on' : 'off';
    status.textContent = fault ? 'WorkStation recording paused' : !state ? 'WorkStation recording status unknown' : !state.enabled ? 'WorkStation not recording' : flow?.truncated ? 'Flow full · no more actions saved' : 'Recording WorkStation · ' + (identity ? project()?.name || 'this project' : 'outside projects');
    status.setAttribute('aria-label', status.textContent + '. Recording options');
    if (state?.enabled && !fault && !flow?.truncated && innerWidth <= 1100) status.textContent = 'Recording WorkStation';
    status.style.maxWidth = innerWidth <= 1100 ? '180px' : '340px';
    notice.hidden = !state || state.notice_seen || state.enabled;
    const phone = matchMedia('(max-width:760px)').matches;
    if (phone) { if (status.parentElement !== strip) strip.append(status); strip.hidden = !state?.ever_enabled && !fault && Boolean(state); }
    else { const anchor = document.getElementById('agent-status'); if (status.nextElementSibling !== anchor) anchor.before(status); strip.hidden = true; }
  }
  const recorder = installRecorder({ enabled: false, maxSteps: 50, post: async steps => {
    if (scope() !== identity || busy || fault || !state?.enabled) { if (scope() !== identity) void refresh(); return; }
    const ticket = epoch, bucket = identity; busy = true;
    try {
      const reply = await api('/api/recordings', { surface: 'workstation', project: bucket, action: 'append', generation: state.generation, run: state.run, flow_id: flow?.id, flow: { steps } });
      if (ticket !== epoch || bucket !== scope()) return;
      if (reply.flow) flow = reply.flow;
      else { recorder.setEnabled(false); await refresh(); }
    } catch { if (ticket === epoch) fault = true; }
    finally { if (ticket === epoch) { busy = false; draw(); } }
  } });
  async function refresh() {
    if (scope() !== identity) { identity = scope(); epoch++; flow = null; state = null; busy = false; recorder.setEnabled(false); close(); }
    const ticket = epoch, bucket = identity;
    try {
      const next = await api('/api/recordings', { surface: 'workstation', project: bucket, action: 'status' });
      if (ticket !== epoch || bucket !== scope()) return;
      if (state && (state.generation !== next.generation || state.run !== next.run)) { epoch++; flow = null; busy = false; recorder.setEnabled(false); }
      state = next; fault = false;
    } catch { if (ticket === epoch) fault = true; }
    draw();
  }
  async function change(enabled) {
    const ticket = epoch, bucket = identity; recorder.setEnabled(false);
    try { const next = await request({ action: 'enabled', enabled }); if (ticket !== epoch || bucket !== scope()) return; epoch++; state = next; flow = null; busy = false; fault = false; close(); }
    catch { fault = true; }
    draw(); status.focus();
  }
  function button(text, action) { const b = node('button', 'pw-btn', text); b.type = 'button'; b.onclick = () => void action(); return b; }
  async function show() {
    if (scope() !== identity || !state) await refresh();
    if (!state?.enabled && !fault) {
      const result = await ask({ message: 'Record what you do in Pi WorkStation?', detail: 'Shared profile on this computer. Kept: structural actions and focus. Never kept: what you type, passwords, chat and file contents. On the host: 7 days, at most 20 flows per project or outside projects. Preview has its own setting.', danger: 'Enable Recording', safe: 'Not Now', plain: true });
      if (result === 'danger') await change(true);
      else { try { state = await request({ action: 'notice' }); draw(); } catch { fault = true; draw(); } }
      return;
    }
    popup.replaceChildren(node('h3', '', 'Recording Pi WorkStation · this window'), node('p', '', 'Shared profile on this computer. Anyone using this profile can see its recordings.'), node('p', '', identity ? 'Kept with this project only.' : 'Outside projects · a separate history.'), node('p', '', 'Structural actions only; what you type is never recorded. Kept on the computer running Pi WorkStation for 7 days, at most 20 flows per scope.'), button(fault ? 'Try Again' : 'Stop Recording WorkStation', fault ? refresh : () => change(false)));
    popup.hidden = false; status.setAttribute('aria-expanded', 'true'); popup.style.position = 'fixed'; popup.style.top = Math.max(30, status.getBoundingClientRect().bottom + 4) + 'px'; popup.style.right = '8px'; popup.style.maxWidth = 'calc(100vw - 16px)'; popup.style.zIndex = '100'; popup.querySelector('button').focus();
  }
  notice.append(button('Recording Options…', show), button('Not Now', async () => { try { state = await request({ action: 'notice' }); draw(); } catch { fault = true; draw(); } }));
  status.onclick = options.onclick = () => { if (!popup.hidden) close(); else void show(); };
  popup.addEventListener('keydown', event => { if (event.key === 'Escape' || event.key === 'Tab') { close(); status.focus(); event.preventDefault(); } });
  addEventListener('resize', draw); addEventListener('pagehide', () => recorder.stop(), { once: true });
  void refresh(); const timer = setInterval(() => void refresh(), 1000);
  addEventListener('pagehide', () => clearInterval(timer), { once: true });
}
