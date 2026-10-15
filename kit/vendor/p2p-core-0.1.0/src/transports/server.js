/**
 * The local server: `npx p2p-core serve` on any laptop on the network.
 *
 * For classrooms and LAN parties with no internet. The server hands the game's
 * files to every device and passes messages between them over WebSockets, so
 * nothing needs the internet, a secure context or WebRTC. The price is that the
 * server's operator could read the messages (WebRTC links are end-to-end
 * encrypted; this is not), and that media streams need a WebRTC route.
 *
 * `url` is 'auto' (use the server this page was loaded from, if it is one), or
 * the address the server printed: http://192.168.1.20:8787 or ws://... — both
 * work.
 *
 * Wire format (JSON text, binary as base64 — see util.js):
 *   → { t: 'join', room, id }      → { t: 'm', to, k, d }      → { t: 'bye' }
 *   ← { t: 'peers', ids }          ← { t: 'join', id }         ← { t: 'leave', id }
 *   ← { t: 'm', from, k, d }       ← { t: 'error', message }
 */
import { decodeJson, encodeJson } from '../util.js';

export const SERVER_PATH = '/__p2p-core';

/** The WebSocket address for a server given as http(s)://, ws(s)://, or host:port. */
export function serverSocketUrl(url) {
  let text = String(url).trim();
  if (!/^[a-z]+:\/\//i.test(text)) text = `http://${text}`;
  const parsed = new URL(text);
  if (parsed.protocol === 'http:') parsed.protocol = 'ws:';
  if (parsed.protocol === 'https:') parsed.protocol = 'wss:';
  if (!parsed.pathname.endsWith('/ws')) parsed.pathname = `${SERVER_PATH}/ws`;
  return parsed.toString();
}

/**
 * Was this page served by `p2p-core serve`? Answers quickly either way: a
 * GitHub Pages site answers 404 at once, and nothing waits more than 1.5s.
 */
export async function detectServer(base = globalThis.location?.href, fetchImpl = globalThis.fetch) {
  if (!base || !/^https?:/.test(base) || typeof fetchImpl !== 'function') return null;
  const info = new URL(`${SERVER_PATH}/info`, base);
  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = setTimeout(() => controller?.abort(), 1500);
  try {
    const response = await fetchImpl(info, { signal: controller?.signal, cache: 'no-store' });
    if (!response.ok) return null;
    const body = await response.json();
    return body?.p2pCore ? new URL('/', base).toString() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function serverTransport({ url = 'auto', WebSocketImpl = globalThis.WebSocket, fetchImpl } = {}) {
  let ctx = null;
  let socket = null;
  let state = 'off';
  let stopped = false;
  let retry = 1000;
  let timer = null;
  let address = null;
  let detail = '';
  const peers = new Set();

  function setState(next, why = '') {
    state = next;
    detail = why;
    ctx.statusChanged();
  }

  function dropAll() {
    for (const id of [...peers]) { peers.delete(id); ctx.peerLeave(id); }
  }

  function connect() {
    if (stopped) return;
    let ws;
    try {
      ws = new WebSocketImpl(address);
    } catch (err) {
      setState('error', err.message);
      return;
    }
    socket = ws;
    setState('connecting');
    ws.onopen = () => {
      retry = 1000;
      ws.send(JSON.stringify({ t: 'join', room: ctx.key, id: ctx.selfId }));
      setState('ready');
    };
    ws.onmessage = (event) => {
      let msg;
      try { msg = decodeJson(String(event.data)); } catch { return; }
      if (!msg || typeof msg !== 'object') return;
      if (msg.t === 'peers' && Array.isArray(msg.ids)) {
        for (const id of msg.ids) if (typeof id === 'string' && id !== ctx.selfId && !peers.has(id)) {
          peers.add(id);
          ctx.peerJoin(id);
        }
      } else if (msg.t === 'join' && typeof msg.id === 'string' && msg.id !== ctx.selfId) {
        if (!peers.has(msg.id)) { peers.add(msg.id); ctx.peerJoin(msg.id); }
      } else if (msg.t === 'leave' && peers.has(msg.id)) {
        peers.delete(msg.id);
        ctx.peerLeave(msg.id);
      } else if (msg.t === 'm' && peers.has(msg.from) && typeof msg.k === 'string') {
        ctx.receive(msg.from, msg.k, msg.d);
      } else if (msg.t === 'error') {
        ctx.error(new Error(`p2p-core server: ${msg.message}`));
      }
    };
    ws.onclose = () => {
      if (socket !== ws) return;
      socket = null;
      dropAll();
      if (stopped) return;
      setState('connecting', `reconnecting in ${Math.round(retry / 1000)}s`);
      timer = setTimeout(connect, retry);
      retry = Math.min(retry * 2, 15000);
    };
    ws.onerror = () => { /* onclose follows and handles it */ };
  }

  return {
    name: 'server',
    async start(context) {
      ctx = context;
      if (typeof WebSocketImpl !== 'function') { setState('unavailable'); return; }
      let base = url;
      if (url === 'auto') {
        setState('connecting', 'looking for a local server');
        base = await detectServer(globalThis.location?.href, fetchImpl);
        if (!base) { setState('off', 'this page was not served by `p2p-core serve`'); return; }
      }
      if (stopped) return;
      try {
        address = serverSocketUrl(base);
      } catch {
        setState('error', `"${base}" is not a server address`);
        return;
      }
      if (globalThis.location?.protocol === 'https:' && address.startsWith('ws:')) {
        ctx.error(new Error('p2p-core: an https page cannot reach a plain-http local server. '
          + `Open the game from the server itself (${base.replace(/^ws/, 'http')}) instead.`));
      }
      connect();
    },
    register() {},
    send(kind, data, ids) {
      if (socket?.readyState !== 1) return;
      socket.send(encodeJson({ t: 'm', to: ids || null, k: kind, d: data }));
    },
    stop() {
      stopped = true;
      clearTimeout(timer);
      if (socket) {
        try { socket.send(JSON.stringify({ t: 'bye' })); } catch { /* closing anyway */ }
        const ws = socket;
        socket = null;
        try { ws.close(); } catch { /* already closed */ }
      }
      dropAll();
      state = 'off';
    },
    status() {
      return { name: 'server', state, peers: peers.size, url: address, detail };
    },
    async route(id) {
      return peers.has(id) ? { path: 'local-server', local: true, rtt: null } : null;
    },
  };
}
