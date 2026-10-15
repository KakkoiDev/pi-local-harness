/**
 * Anyone, anywhere: trystero over public nostr relays, then direct WebRTC.
 *
 * The relays are only the noticeboard two browsers use to find each other and
 * swap connection details; once connected, data goes browser to browser (or
 * through a TURN server, if you configured one and a direct link was
 * impossible). Needs internet and a secure context (https or localhost),
 * because nostr signs its notices with crypto.subtle.
 */
import {
  joinRoom as trysteroJoinRoom,
  getRelaySockets as trysteroRelaySockets,
} from '../../vendor/trystero/nostr.js';
import { classifyConnection } from '../route.js';

const SOCKET_OPEN = 1;

export function relaysTransport({
  relays,
  password,
  turn,
  rtcConfig,
  joinRoom = trysteroJoinRoom,
  getRelaySockets = trysteroRelaySockets,
} = {}) {
  let ctx = null;
  let room = null;
  let state = 'off';
  let poll = null;
  let lastOpen = -1;
  let detail = '';
  const actions = new Map();
  const peers = new Set();

  function relayReach() {
    let sockets = {};
    try { sockets = getRelaySockets() || {}; } catch { sockets = {}; }
    const list = relays.map((url) => {
      // Browsers normalise `wss://host` to `wss://host/`; trystero keys the
      // sockets by whichever string it was handed, so look for both.
      const socket = sockets[url] || sockets[`${url}/`] || sockets[url.replace(/\/$/, '')];
      return { url, open: socket?.readyState === SOCKET_OPEN };
    });
    return { total: list.length, open: list.filter((r) => r.open).length, relays: list };
  }

  function register(kind) {
    if (!room || actions.has(kind)) return;
    const [send, on] = room.makeAction(kind);
    on((data, id, meta) => ctx.receive(id, kind, data, meta));
    actions.set(kind, send);
  }

  return {
    name: 'relays',
    start(context) {
      ctx = context;
      if (typeof globalThis.RTCPeerConnection !== 'function' && joinRoom === trysteroJoinRoom) {
        state = 'unavailable';
        detail = 'this browser has no WebRTC';
        ctx.statusChanged();
        return;
      }
      if (joinRoom === trysteroJoinRoom && globalThis.isSecureContext === false) {
        // Normal on a local server's http:// address, so a status, not an error.
        state = 'unavailable';
        detail = 'needs https or localhost';
        ctx.statusChanged();
        return;
      }
      const config = { appId: ctx.appId, relayUrls: [...relays] };
      if (password) config.password = password;
      if (turn?.length) config.turnConfig = turn;
      if (rtcConfig) config.rtcConfig = rtcConfig;
      try {
        room = joinRoom(config, ctx.roomId, (failure) => {
          ctx.error(new Error(`p2p-core: ${failure?.error || 'a peer could not be decrypted'}`
            + ' — is everyone using the same password?'));
        });
      } catch (err) {
        state = 'error';
        ctx.error(err);
        ctx.statusChanged();
        return;
      }
      state = 'connecting';
      room.onPeerJoin((id) => { peers.add(id); ctx.peerJoin(id); });
      room.onPeerLeave((id) => { peers.delete(id); ctx.peerLeave(id); });
      room.onPeerStream?.((stream, id, meta) => ctx.stream(id, stream, meta));
      room.onPeerTrack?.((track, stream, id, meta) => ctx.track(id, track, stream, meta));
      for (const kind of ctx.kinds()) register(kind);
      // Trystero never reports a relay failing; it reconnects quietly. So we
      // look, once a second, and tell the room when the count changes.
      const check = () => {
        const { open } = relayReach();
        const next = open > 0 ? 'ready' : 'connecting';
        if (open !== lastOpen || next !== state) {
          lastOpen = open;
          state = next;
          ctx.statusChanged();
        }
      };
      poll = setInterval(check, 1000);
      check();
    },
    register,
    send(kind, data, ids, meta) {
      register(kind);
      const send = actions.get(kind);
      if (!send) return undefined;
      // trystero takes one id as a string, several as an array, everyone as null.
      return send(data, !ids ? null : ids.length === 1 ? ids[0] : ids, meta);
    },
    stop() {
      clearInterval(poll);
      for (const id of [...peers]) { peers.delete(id); ctx.peerLeave(id); }
      try { room?.leave(); } catch { /* already gone */ }
      room = null;
      actions.clear();
      state = 'off';
    },
    status() {
      return { name: 'relays', state, detail, peers: peers.size, ...relayReach() };
    },
    connection(id) {
      return room?.getPeers?.()[id] || null;
    },
    async route(id) {
      const connection = room?.getPeers?.()[id];
      if (!connection) return null;
      return classifyConnection(connection);
    },
    async ping(id) {
      return room?.ping ? room.ping(id) : null;
    },
    addStream(stream, ids, meta) { return room?.addStream(stream, ids || null, meta); },
    removeStream(stream, ids) { return room?.removeStream(stream, ids || null); },
    addTrack(track, stream, ids, meta) { return room?.addTrack(track, stream, ids || null, meta); },
    removeTrack(track, ids) { return room?.removeTrack(track, ids || null); },
    get raw() { return room; },
  };
}
