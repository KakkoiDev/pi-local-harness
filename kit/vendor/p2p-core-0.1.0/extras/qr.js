/**
 * QR codes: draw one, and read one with the camera.
 *
 *   import { qrSvg, scanQr } from './qr.js';
 *   container.append(qrSvg('https://example.com'));
 *   const text = await scanQr(videoElement);      // resolves with what it read
 *
 * Drawing uses the vendored qrcode-generator. Reading uses the browser's
 * BarcodeDetector where there is one (Chrome on Android, Safari 17+) and falls
 * back to the vendored jsQR, which is only downloaded the first time it is
 * needed. The camera needs a secure context (https or localhost); on a plain
 * http page `canScan()` is false and the pairing dialog offers paste instead.
 */
import qrcode from '../vendor/qrcode-generator/qrcode.mjs';

const SVG = 'http://www.w3.org/2000/svg';

/** The modules of a QR code: rows of booleans, true = dark. */
export function qrMatrix(text, correction = 'L') {
  const qr = qrcode(0, correction);
  qr.addData(String(text), 'Byte');
  qr.make();
  const size = qr.getModuleCount();
  return Array.from({ length: size }, (_, r) => Array.from({ length: size }, (__, c) => qr.isDark(r, c)));
}

/**
 * An <svg> of the code, built from DOM nodes rather than a markup string, so
 * it works under a strict Content-Security-Policy. Colours default to CSS
 * variables with black-on-white fallbacks: a QR code must stay dark on light
 * to scan, whatever the theme.
 */
export function qrSvg(text, { ink = 'var(--p2p-qr-ink, #000)', paper = 'var(--p2p-qr-paper, #fff)', quiet = 4, label = 'QR code' } = {}) {
  const matrix = qrMatrix(text);
  const size = matrix.length;
  const span = size + quiet * 2;
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', `0 0 ${span} ${span}`);
  svg.setAttribute('shape-rendering', 'crispEdges');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', label);
  const ground = document.createElementNS(SVG, 'rect');
  ground.setAttribute('width', String(span));
  ground.setAttribute('height', String(span));
  ground.setAttribute('fill', paper);
  svg.append(ground);
  let d = '';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) if (matrix[r][c]) d += `M${c + quiet} ${r + quiet}h1v1h-1z`;
  }
  const path = document.createElementNS(SVG, 'path');
  path.setAttribute('d', d);
  path.setAttribute('fill', ink);
  svg.append(path);
  return svg;
}

/** Whether this page can use the camera at all. */
export function canScan() {
  return !!(globalThis.isSecureContext && navigator.mediaDevices?.getUserMedia);
}

let jsQrLoading = null;
async function loadJsQr() {
  if (globalThis.jsQR) return globalThis.jsQR;
  jsQrLoading ||= import('../vendor/jsqr/jsQR.js').then(() => globalThis.jsQR);
  return jsQrLoading;
}

/** Read a QR code from ImageData (a canvas, a photo the player picked). Resolves with the text or null. */
export async function readQrFromImage(image) {
  const jsQR = await loadJsQr();
  return jsQR(image.data, image.width, image.height, { inversionAttempts: 'attemptBoth' })?.data || null;
}

async function makeDetector() {
  if (typeof globalThis.BarcodeDetector === 'function') {
    try {
      const formats = await globalThis.BarcodeDetector.getSupportedFormats?.();
      if (!formats || formats.includes('qr_code')) {
        const detector = new globalThis.BarcodeDetector({ formats: ['qr_code'] });
        return async (video) => (await detector.detect(video))[0]?.rawValue || null;
      }
    } catch { /* fall back to jsQR */ }
  }
  const jsQR = await loadJsQr();
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });
  return async (video) => {
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return null;
    const scale = Math.min(1, 640 / Math.max(w, h));
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const image = context.getImageData(0, 0, canvas.width, canvas.height);
    return jsQR(image.data, image.width, image.height, { inversionAttempts: 'attemptBoth' })?.data || null;
  };
}

/**
 * Turn on the camera into `video` and resolve with the first QR code read.
 * `signal` (an AbortSignal) stops it early. The camera is always turned off
 * again, whichever way it ends.
 */
export async function scanQr(video, { signal, facingMode = 'environment', accept = () => true } = {}) {
  if (!canScan()) throw new Error('p2p-core: the camera needs https or localhost');
  const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode }, audio: false });
  try {
    video.srcObject = stream;
    video.setAttribute('playsinline', '');
    video.muted = true;
    await video.play().catch(() => {});
    const detect = await makeDetector();
    for (;;) {
      if (signal?.aborted) throw new DOMException('Scan cancelled', 'AbortError');
      let text = null;
      try { text = await detect(video); } catch { text = null; }
      if (text && accept(text)) return text;
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  } finally {
    for (const track of stream.getTracks()) track.stop();
    video.srcObject = null;
  }
}
