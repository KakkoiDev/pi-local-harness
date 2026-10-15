/**
 * A ready-made dialog for pairing by code: no server, no internet.
 *
 *   import { openPairing } from './pairing-ui.js';
 *   button.onclick = async () => {
 *     const peerId = await openPairing(room);   // null if they closed it
 *   };
 *
 * One device chooses "Invite", the other "Join". The inviter shows a QR code;
 * the joiner scans it (or pastes the code) and shows an answer QR; the
 * inviter scans that. Where the camera is unavailable (plain http, no camera,
 * permission refused) every step falls back to copy and paste.
 *
 * Built from DOM nodes with classes styled by `ui.css` (loaded automatically
 * next to this file), so it works under a strict Content-Security-Policy.
 * Restyle it by overriding the `--p2p-*` variables or the `.p2p-*` classes.
 * Pass `text` to translate it.
 */
import { canScan, qrSvg, scanQr } from './qr.js';

const TEXT = {
  title: 'Play without internet',
  intro: 'Connect two devices directly. One invites, the other joins.',
  invite: 'Invite a device',
  join: 'Join with a code',
  close: 'Close',
  back: 'Back',
  making: 'Making an invite…',
  inviteShow: 'On the other device, choose “Join with a code” and scan this.',
  copy: 'Copy code',
  copied: 'Copied',
  answerPrompt: 'Then scan the answer it shows, or paste it here:',
  scanAnswer: 'Scan answer',
  scanInvite: 'Scan invite',
  pastePrompt: 'Or paste the code:',
  connect: 'Connect',
  answerShow: 'Show this to the device that invited you.',
  waiting: 'Waiting for the other device…',
  connected: 'Connected!',
  noCamera: 'No camera here — copy and paste the codes instead (by chat, AirDrop, or typing).',
  stopScan: 'Stop camera',
};

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function button(label, onClick, kind = '') {
  const node = el('button', `p2p-button ${kind}`.trim(), label);
  node.type = 'button';
  node.addEventListener('click', onClick);
  return node;
}

let stylesAdded = false;
function addStyles() {
  if (stylesAdded || document.querySelector('link[data-p2p-ui]')) { stylesAdded = true; return; }
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = new URL('./ui.css', import.meta.url).href;
  link.dataset.p2pUi = '';
  document.head.append(link);
  stylesAdded = true;
}

export function openPairing(room, { text = {}, parent = document.body } = {}) {
  addStyles();
  const t = { ...TEXT, ...text };
  const dialog = el('dialog', 'p2p-dialog');
  dialog.setAttribute('aria-labelledby', 'p2p-pair-title');
  const heading = el('h2', 'p2p-title', t.title);
  heading.id = 'p2p-pair-title';
  const body = el('div', 'p2p-body');
  const footer = el('div', 'p2p-footer');
  const error = el('p', 'p2p-error');
  error.setAttribute('role', 'alert');
  dialog.append(heading, body, error, footer);
  parent.append(dialog);

  let scanning = null;
  let pendingInvite = null;
  let settled = false;
  let resolveResult;
  const result = new Promise((resolve) => { resolveResult = resolve; });

  const stopScan = () => { scanning?.abort(); scanning = null; };
  const fail = (err) => { error.textContent = err?.message?.replace(/^p2p-core: /, '') || String(err); };
  const clearError = () => { error.textContent = ''; };

  function finish(peerId) {
    if (settled) return;
    settled = true;
    stopScan();
    if (!peerId) pendingInvite?.cancel?.();
    dialog.close();
    dialog.remove();
    resolveResult(peerId);
  }

  dialog.addEventListener('cancel', (event) => { event.preventDefault(); finish(null); });

  function setFooter(...buttons) {
    footer.replaceChildren(...buttons, button(t.close, () => finish(null), 'p2p-quiet'));
  }

  function codeBlock(code) {
    const wrap = el('div', 'p2p-code');
    const qr = el('div', 'p2p-qr');
    qr.append(qrSvg(code, { label: 'Pairing code' }));
    const copy = button(t.copy, async () => {
      try { await navigator.clipboard.writeText(code); copy.textContent = t.copied; } catch {
        field.select();
      }
    });
    const field = el('textarea', 'p2p-field');
    field.readOnly = true;
    field.rows = 2;
    field.value = code;
    field.setAttribute('aria-label', 'Pairing code');
    wrap.append(qr, copy, field);
    return wrap;
  }

  /** A paste box plus, where possible, a camera, either of which calls `use(code)`. */
  function codeInput(scanLabel, use) {
    const wrap = el('div', 'p2p-input');
    if (canScan()) {
      const video = el('video', 'p2p-video');
      video.hidden = true;
      const scan = button(scanLabel, async () => {
        clearError();
        if (scanning) { stopScan(); video.hidden = true; scan.textContent = scanLabel; return; }
        scanning = new AbortController();
        video.hidden = false;
        scan.textContent = t.stopScan;
        try {
          const code = await scanQr(video, { signal: scanning.signal, accept: (s) => /^[ZP][A-Za-z0-9_-]{20,}$/.test(s.trim()) });
          scanning = null;
          video.hidden = true;
          scan.textContent = scanLabel;
          await use(code);
        } catch (err) {
          scanning = null;
          video.hidden = true;
          scan.textContent = scanLabel;
          if (err?.name !== 'AbortError') fail(err);
        }
      }, 'p2p-primary');
      wrap.append(scan, video);
    } else {
      wrap.append(el('p', 'p2p-note', t.noCamera));
    }
    const label = el('label', 'p2p-label', t.pastePrompt);
    const field = el('textarea', 'p2p-field');
    field.rows = 2;
    field.spellcheck = false;
    field.autocapitalize = 'off';
    label.append(field);
    const go = button(t.connect, async () => {
      clearError();
      if (!field.value.trim()) return;
      try { await use(field.value); } catch (err) { fail(err); }
    });
    wrap.append(label, go);
    return wrap;
  }

  function showStart() {
    stopScan();
    clearError();
    body.replaceChildren(el('p', 'p2p-text', t.intro));
    setFooter(button(t.invite, showInvite, 'p2p-primary'), button(t.join, showJoin));
  }

  async function showInvite() {
    clearError();
    body.replaceChildren(el('p', 'p2p-text', t.making));
    setFooter(button(t.back, showStart));
    try {
      pendingInvite = await room.pair.invite();
    } catch (err) { fail(err); return; }
    pendingInvite.connected.then(finish);
    body.replaceChildren(
      el('p', 'p2p-text', t.inviteShow),
      codeBlock(pendingInvite.code),
      el('p', 'p2p-text', t.answerPrompt),
      codeInput(t.scanAnswer, async (code) => {
        await pendingInvite.finish(code);
        body.replaceChildren(el('p', 'p2p-text p2p-wait', t.waiting));
      }),
    );
  }

  function showJoin() {
    clearError();
    body.replaceChildren(codeInput(t.scanInvite, async (code) => {
      const answer = await room.pair.accept(code);
      answer.connected.then(finish);
      body.replaceChildren(
        el('p', 'p2p-text', t.answerShow),
        codeBlock(answer.code),
        el('p', 'p2p-text p2p-wait', t.waiting),
      );
    }));
    setFooter(button(t.back, showStart));
  }

  showStart();
  dialog.showModal();
  return result;
}
