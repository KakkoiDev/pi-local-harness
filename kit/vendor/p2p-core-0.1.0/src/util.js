/**
 * Small helpers with no dependencies. Everything here works in a browser
 * (secure context or not) and in Node 20+, because the local server and the
 * tests import some of it too.
 */

/** A tiny event emitter. `on` returns the function that removes the handler. */
export class Emitter {
  constructor() { this.handlers = new Map(); }
  on(name, fn) {
    if (typeof fn !== 'function') throw new TypeError(`p2p-core: ${name} handler must be a function`);
    if (!this.handlers.has(name)) this.handlers.set(name, new Set());
    this.handlers.get(name).add(fn);
    return () => this.handlers.get(name)?.delete(fn);
  }
  emit(name, ...args) {
    const set = this.handlers.get(name);
    if (!set) return 0;
    for (const fn of [...set]) {
      try { fn(...args); } catch (err) { console.error(`p2p-core: a "${name}" handler threw`, err); }
    }
    return set.size;
  }
  count(name) { return this.handlers.get(name)?.size || 0; }
  clear() { this.handlers.clear(); }
}

const ID_CHARS = '0123456789AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz';

/** A random id in trystero's alphabet, so ids look the same whichever transport made them. */
export function randomId(length = 20) {
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  let out = '';
  for (const b of bytes) out += ID_CHARS[b % ID_CHARS.length];
  return out;
}

// ------------------------------------------------------------------ sha-256
//
// A synchronous SHA-256 in plain JS. `crypto.subtle` exists only in secure
// contexts, and a game served from a laptop on the classroom network
// (http://192.168.1.20:8787) is not one — but it still needs the room name to
// depend on the password. So we carry our own. It hashes short strings.

const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

/** Hex SHA-256 of a UTF-8 string. */
export function sha256(text) {
  const data = new TextEncoder().encode(String(text));
  const bitLength = data.length * 8;
  const padded = new Uint8Array(((data.length + 9 + 63) >> 6) << 6);
  padded.set(data);
  padded[data.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 8, Math.floor(bitLength / 2 ** 32));
  view.setUint32(padded.length - 4, bitLength >>> 0);

  const h = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ]);
  const w = new Uint32Array(64);
  const rotr = (x, n) => (x >>> n) | (x << (32 - n));
  for (let offset = 0; offset < padded.length; offset += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getUint32(offset + i * 4);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, hh] = h;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (hh + S1 + ch + K[i] + w[i]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) >>> 0;
      hh = g; g = f; f = e; e = (d + t1) >>> 0;
      d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    h[0] += a; h[1] += b; h[2] += c; h[3] += d; h[4] += e; h[5] += f; h[6] += g; h[7] += hh;
  }
  return [...h].map((x) => x.toString(16).padStart(8, '0')).join('');
}

// ------------------------------------------------------------- base64url

export function bytesToBase64Url(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64UrlToBytes(text) {
  const b64 = String(text).replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

// ---------------------------------------------------- JSON with binary data
//
// The tab, server and pairing transports carry JSON text. Binary payloads
// (ArrayBuffer, typed arrays) ride inside it as {"$p2pb": "<base64url>"} and
// come out the other side as a Uint8Array — the same thing trystero hands a
// receiver for binary data, so a game sees one shape whichever way it arrived.

const BIN = '$p2pb';

export function isBinary(value) {
  return value instanceof ArrayBuffer || ArrayBuffer.isView(value);
}

function toBytes(value) {
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
}

export function encodeJson(value) {
  return JSON.stringify(value, function replacer(key, v) {
    const raw = this[key];
    return isBinary(raw) ? { [BIN]: bytesToBase64Url(toBytes(raw)) } : v;
  });
}

export function decodeJson(text) {
  return JSON.parse(text, (key, v) => (
    v && typeof v === 'object' && typeof v[BIN] === 'string' && Object.keys(v).length === 1
      ? base64UrlToBytes(v[BIN]) : v
  ));
}

/** Roughly how many bytes a payload costs on the wire. Used for `maxMessageBytes`. */
export function payloadSize(value) {
  if (value === undefined) return 0;
  if (isBinary(value)) return value.byteLength;
  if (typeof value === 'string') return new TextEncoder().encode(value).length;
  try { return new TextEncoder().encode(encodeJson(value)).length; } catch { return Infinity; }
}

// ---------------------------------------------------- compressed text codes

/**
 * Compress a string into a short url-safe code (for pairing QR codes). Uses
 * the platform's CompressionStream when there is one; the first character
 * says which form follows, so either side can read either.
 */
export async function packCode(text) {
  if (typeof CompressionStream === 'function') {
    try {
      const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('deflate-raw'));
      const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
      return 'Z' + bytesToBase64Url(bytes);
    } catch { /* fall through to the plain form */ }
  }
  return 'P' + bytesToBase64Url(new TextEncoder().encode(text));
}

export async function unpackCode(code) {
  const clean = String(code).trim().replace(/\s+/g, '');
  const kind = clean[0];
  const bytes = base64UrlToBytes(clean.slice(1));
  if (kind === 'P') return new TextDecoder().decode(bytes);
  if (kind === 'Z') {
    if (typeof DecompressionStream !== 'function') {
      throw new Error('p2p-core: this browser cannot read compressed pairing codes');
    }
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new Response(stream).text();
  }
  throw new Error('p2p-core: that is not a pairing code');
}

// ------------------------------------------------------- network addresses

/**
 * Whether an address can only be a machine on the same network as us: private
 * IPv4 ranges, link-local, loopback, IPv6 unique-local, and the `.local` mDNS
 * names browsers hand out instead of a real local IP.
 */
export function isLocalAddress(address) {
  if (!address) return false;
  const a = String(address).toLowerCase().replace(/^\[|\]$/g, '');
  if (a.endsWith('.local') || a === 'localhost') return true;
  if (/^127\./.test(a) || a === '::1') return true;
  if (/^10\./.test(a) || /^192\.168\./.test(a) || /^169\.254\./.test(a)) return true;
  const m = /^172\.(\d+)\./.exec(a);
  if (m && Number(m[1]) >= 16 && Number(m[1]) <= 31) return true;
  if (/^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(a)) return false; // carrier NAT: not "your" network
  if (/^f[cd][0-9a-f]{2}:/.test(a) || /^fe[89ab][0-9a-f]:/.test(a)) return true;
  return false;
}

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
