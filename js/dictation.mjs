// Voice input for any text field (comments, replies, the whole-file question): a Dictate button records, the Mac
// transcribes (POST /api/transcribe, Whisper), and the text lands at the cursor for review before sending.
// The chat composer keeps its own Record button (js/chat.mjs), which also attaches the audio when transcription fails.
import { icon } from './ui.mjs';

let active = null; // one recording at a time: {key, button, field, recorder, started}
// A field's key survives a re-render (a thread reply is rebuilt when its request changes state): the recording
// then continues on the new button and its text lands in the new field.
const keyOf = field => field.dataset.thread ? 'thread:' + field.dataset.thread : field.id;

function readBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(new Error('Cannot read the recording'));
    reader.readAsDataURL(blob);
  });
}

function insertAtCursor(field, text) {
  const start = field.selectionStart ?? field.value.length, end = field.selectionEnd ?? start;
  const before = field.value.slice(0, start), spaced = (before && !/\s$/.test(before) ? ' ' : '') + text;
  field.value = before + spaced + field.value.slice(end);
  field.selectionStart = field.selectionEnd = start + spaced.length;
  field.dispatchEvent(new Event('input', { bubbles: true })); // drafts and enabled states follow
  field.focus();
}

function show(button, mode, seconds = 0) {
  button.setAttribute('aria-pressed', String(mode === 'recording'));
  button.disabled = mode === 'transcribing';
  if (mode === 'recording') {
    button.replaceChildren(document.createTextNode(`${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`));
    button.setAttribute('aria-label', 'Stop dictating'); // Composer card, Dictate (round 5)
  } else {
    button.replaceChildren(icon(mode === 'transcribing' ? 'running' : 'mic')); // the hourglass while the Mac transcribes (C_Dictate)
    button.setAttribute('aria-label', mode === 'transcribing' ? 'Transcribing…' : 'Dictate');
  }
}

/** A Dictate button for `field`. `api(path, body)` posts JSON; `report(message)` shows an error the person can read. */
export function dictateButton(field, { api, report }) {
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'pw-btn pw-btn--icon pw-btn--rec dictate'; button.title = 'Dictate (the Mac transcribes it)';
  const key = keyOf(field);
  if (active?.key === key) { active.button = button; active.field = field; show(button, 'recording', Math.floor((Date.now() - active.started) / 1000)); }
  else show(button, 'idle');
  button.onclick = async () => {
    if (active?.key === key) { active.recorder.stop(); return; }
    if (active) { report('Finish the other dictation first.'); return; }
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { report('Voice input is unavailable in this browser.'); return; }
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream), chunks = [], started = Date.now();
      active = { key, button, field, recorder, started };
      const timer = setInterval(() => { if (active) show(active.button, 'recording', Math.floor((Date.now() - started) / 1000)); }, 1000);
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      recorder.onstop = async () => {
        clearInterval(timer); stream.getTracks().forEach(track => track.stop());
        const target = active; active = null; show(target.button, 'transcribing');
        try {
          const blob = new Blob(chunks, { type: recorder.mimeType });
          const { text } = await api('/api/transcribe', { mime: recorder.mimeType, data: await readBase64(blob) });
          const current = target.field.isConnected ? target.field : key.startsWith('thread:') ? document.querySelector(`[data-thread="${key.slice('thread:'.length)}"]`) : document.getElementById(key);
          if (text && current) insertAtCursor(current, text); // the field may have been rebuilt while transcribing
        } catch (error) { report(error.message); }
        finally { show(target.button, 'idle'); }
      };
      recorder.start(); show(button, 'recording', 0);
    } catch (error) {
      stream?.getTracks().forEach(track => track.stop()); active = null; show(button, 'idle'); // release the microphone
      report(error.message);
    }
  };
  return button;
}
