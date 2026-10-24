// Local shared-profile adapter. Capture follows the host preference and never includes typed text.
import { installRecorder } from '/harness/vendor/test_core_recording/recorder.mjs';
import { ask } from './dialogs.mjs';
const node = (tag, css = '', text = '') => { const e = document.createElement(tag); e.textContent = text || ''; if (css) e.className = css; return e; };
export function installWorkstationRecording({ api, project, toast = () => {} }) {
  const status = node('button', 'pw-recstat pw-recstat--bar', 'WorkStation recording status unknown'); status.id = 'ws-recording-status'; status.type = 'button'; status.setAttribute('aria-haspopup', 'dialog'); status.setAttribute('aria-expanded', 'false'); status.setAttribute('aria-controls', 'ws-recording-popover');
  const popup = node('section', 'pw-recpop', ''); popup.id = 'ws-recording-popover'; popup.hidden = true; popup.setAttribute('role', 'dialog'); popup.setAttribute('aria-label', 'Recording Pi WorkStation'); document.getElementById('settings-dialog').append(popup);
  const settings = node('fieldset', 'settings-group', ''); settings.id='recording-settings'; settings.append(node('legend', 'pw-label', 'Recording'));
  const options = node('button', 'pw-btn', 'Recording Options…'); options.type = 'button'; settings.append(options,status);
  const allowed=node('input'); allowed.type='checkbox'; allowed.className='pw-check'; allowed.id='settings-recording'; allowed.checked=true; allowed.disabled=true;
  const label=node('label','pw-label settings-option'); label.append(allowed,node('span','','Allow action recording'));
  settings.insertBefore(label,options);
  settings.append(node('p','pw-help','Buttons, focus and navigation only; never typed text, passwords, chat or file contents. Saved on this host for 7 days, at most 20 flows per scope. Anyone using this shared profile can see them.'),node('p','pw-help','Turning this off gives Pi less interaction context and makes problems harder to reproduce.'));
  let preference=true,preferenceBusy=false;
  allowed.onchange=async()=>{const enabled=allowed.checked;preferenceBusy=true;allowed.disabled=true;window.dispatchEvent(new Event('recording-stop-all-started'));try{const result=await api('/api/recordings',{surface:'workstation',action:'preferences',enabled});preference=result.enabled;window.dispatchEvent(new Event('recording-settings-changed'));}catch{toast('Could not save recording settings. Check the setting and try again.');}finally{allowed.checked=preference;allowed.disabled=false;preferenceBusy=false;window.dispatchEvent(new Event('recording-stop-all-finished'));}};
  document.getElementById('settings-cancel').parentElement.before(settings);

  let state = null, flow = null, epoch = 0, identity = null, fault = false, busy = false, localStop = false;
  const scope = () => !document.getElementById('settings-dialog')?.open && /^\/p\//.test(location.pathname) ? project()?.id || null : null;
  const request = body => api('/api/recordings', { surface: 'workstation', project: identity, ...body });
  const close = () => { popup.hidden = true; status.setAttribute('aria-expanded', 'false'); };
  function draw() {
    const active = Boolean(state?.enabled && !fault && !flow?.truncated && !localStop);
    if (recorder.enabled !== active) recorder.setEnabled(active);
    status.dataset.state = fault || !state ? 'paused' : active ? 'on' : 'off';
    status.textContent = fault ? 'WorkStation recording paused' : !state ? 'WorkStation recording status unknown' : !state.enabled ? 'WorkStation not recording' : flow?.truncated ? 'Flow full · no more actions saved' : 'Recording WorkStation · ' + (identity ? project()?.name || 'this project' : 'outside projects');
    status.setAttribute('aria-label', status.textContent + '. Recording options');
    if (state?.enabled && !fault && !flow?.truncated && innerWidth <= 1100) status.textContent = 'Recording WorkStation';
    status.style.maxWidth = innerWidth <= 1100 ? '180px' : '340px';

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
      if(!preferenceBusy){const prefs=await api('/api/recordings',{surface:'workstation',action:'preferences'});if(!preferenceBusy){preference=prefs.enabled;allowed.checked=preference;allowed.disabled=false;}}
      const next = await api('/api/recordings', { surface: 'workstation', project: bucket, action: 'status' });
      if (ticket !== epoch || bucket !== scope()) return;
      if (state && (state.generation !== next.generation || state.run !== next.run)) { epoch++; flow = null; busy = false; recorder.setEnabled(false); }
      if (state?.enabled && !next.enabled && !localStop) toast('WorkStation recording stopped in another window.');
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
  async function stopAll() {
    recorder.setEnabled(false); localStop = true;
    try {
      await request({ action: 'stop_all' });
      await refresh(); close();
      window.dispatchEvent(new Event('recording-settings-changed'));
      toast('All recording stopped. What was recorded is kept.');
    } catch { fault = true; draw(); }
    finally { localStop = false; }
    status.focus();
  }
  function button(text, action) { const b = node('button', 'pw-btn', text); b.type = 'button'; b.onclick = () => void action(); return b; }
  async function confirmRecording() {
    close();
    const result = await ask({ message: 'Record what you do in Pi WorkStation?', detail: 'Shared profile on this computer. Kept: structural actions and focus. Never kept: what you type, passwords, chat and file contents. On the host: 7 days, at most 20 flows per project or outside projects. Preview has its own setting.', danger: 'Enable Recording', safe: 'Not Now', plain: true });
    if (result === 'danger') await change(true);
    else { try { state = await request({ action: 'notice' }); draw(); } catch { fault = true; draw(); } }
    status.focus();
  }
  async function show() {
    if (scope() !== identity || !state) await refresh();
    if (!state?.enabled && !state?.ever_enabled && !fault) { await confirmRecording(); return; }
    popup.replaceChildren(node('h3', '', 'Recording Pi WorkStation · this window'), node('p', '', 'Shared profile on this computer. Anyone using this profile can see its recordings.'), node('p', '', identity ? 'Kept with this project only.' : 'Outside projects · a separate history.'), node('p', '', 'Structural actions only; what you type is never recorded. Kept on the computer running Pi WorkStation for 7 days, at most 20 flows per scope.'), button(fault ? 'Try Again' : state?.enabled ? 'Stop Recording WorkStation' : 'Record WorkStation', fault ? refresh : state?.enabled ? () => change(false) : confirmRecording), button('Stop All Recording', stopAll));
    popup.hidden = false; status.setAttribute('aria-expanded', 'true'); popup.style.position = 'fixed'; popup.style.top = 'max(32px, 15vh)'; popup.style.right = '8px'; popup.style.maxWidth = 'calc(100vw - 16px)'; popup.style.zIndex = '100'; popup.querySelector('button').focus();
  }

  status.onclick = options.onclick = () => { if (!popup.hidden) close(); else void show(); };
  popup.addEventListener('keydown', event => {
    const buttons = [...popup.querySelectorAll('button')];
    const leaving = event.key === 'Tab' && (event.shiftKey ? document.activeElement === buttons[0] : document.activeElement === buttons.at(-1));
    if (event.key === 'Escape' || leaving) { close(); status.focus(); event.preventDefault(); }
  });
  document.getElementById('settings-dialog').addEventListener('close',close);
  addEventListener('recording-settings-changed', () => void refresh());
  addEventListener('recording-stop-all-started', () => { localStop = true; recorder.setEnabled(false); });
  addEventListener('recording-stop-all-finished', async () => { await refresh(); localStop = false; draw(); });
  addEventListener('resize', draw); addEventListener('pagehide', () => recorder.stop(), { once: true });
  void refresh(); const timer = setInterval(() => void refresh(), 1000);
  addEventListener('pagehide', () => clearInterval(timer), { once: true });
}
