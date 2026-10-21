// The app origin holds no host credential. Only the embedding parent's allowed origin controls capture.
import { installRecorder } from './recorder-core.mjs';
const origins = __ORIGINS__;
const session = crypto.randomUUID();
let parentOrigin = null, sequence = 0, generation = null, run = null;
const pending = new Map();
const recorder = installRecorder({ enabled: false, maxSteps: 50, post: steps => new Promise((resolve, reject) => {
  const id = ++sequence;
  const timeout = setTimeout(() => { pending.delete(id); reject(new Error('Delivery unavailable')); }, 5000);
  pending.set(id, () => { clearTimeout(timeout); resolve(); });
  parent.postMessage({ type: 'pi-recording-steps', session, generation, run, id, steps }, parentOrigin);
}) });
addEventListener('message', event => {
  if (event.source !== parent || !origins.includes(event.origin)) return;
  if (event.data?.type === 'pi-recording-probe') { ready(event.data.probe); return; }
  if (event.data?.session !== session) return;
  if (event.data.type === 'pi-recording-control') {
    parentOrigin = event.origin;
    if (generation !== event.data.generation || run !== event.data.run) { recorder.setEnabled(false); generation = event.data.generation; run = event.data.run; }
    const enabled = event.data.enabled === true;
    if (recorder.enabled !== enabled) recorder.setEnabled(enabled);
  }
  if (event.data.type === 'pi-recording-ack') { pending.get(event.data.id)?.(); pending.delete(event.data.id); }
});
function ready(probe) { for (const origin of origins) parent.postMessage({ type: 'pi-recording-ready', session, probe }, origin); }
ready();
addEventListener('pagehide', () => recorder.stop(), { once: true });
