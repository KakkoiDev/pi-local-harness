/**
 * Pairing by code: no server, no relays, no internet.
 *
 * One device makes an invite (a code, shown as a QR code), the other scans or
 * pastes it and gets an answer code back, and the first device scans or pastes
 * that. Two codes, because with nothing in the middle the two browsers have to
 * carry each other's connection details by hand. After that it is an ordinary
 * end-to-end encrypted WebRTC link.
 *
 * More than two players: let ONE person invite everybody. Every device passes
 * messages on for the devices it paired with, so everyone reaches everyone,
 * and peers that are only reachable through someone else show up as ordinary
 * peers. If the person in the middle leaves, the people behind them go too.
 *
 * The codes include STUN servers, so a code sent over a chat app also works
 * across the internet, most of the time (see TURN in the README).
 */
import { decodeJson, encodeJson, packCode, randomId, sha256, unpackCode } from '../util.js';
import { classifyConnection } from '../route.js';

const GATHER_MS = 3000;
const DEFAULT_ICE = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
];

function waitForIce(connection) {
  return new Promise((resolve) => {
    if (connection.iceGatheringState === 'complete') { resolve(); return; }
    const done = () => {
      if (connection.iceGatheringState !== 'complete') return;
      connection.removeEventListener('icegatheringstatechange', done);
      resolve();
    };
    connection.addEventListener('icegatheringstatechange', done);
    setTimeout(resolve, GATHER_MS);
  });
}

export function pairTransport({ turn = [], iceServers = DEFAULT_ICE, rtcConfig = {}, Connection } = {}) {
  let ctx = null;
  let state = 'off';
  let stopped = false;
  /** linkId -> { id (remote peer id), channel, connection } */
  const links = new Map();
  /** peerId -> linkId it is reached through */
  const via = new Map();
  const seen = new Set();
  const seenOrder = [];
  const pending = new Set();

  const RTC = () => Connection || globalThis.RTCPeerConnection;
  const roomTag = () => sha256(`p2p-core-pair:${ctx.key}`).slice(0, 10);

  function remember(msgId) {
    seen.add(msgId);
    seenOrder.push(msgId);
    if (seenOrder.length > 2000) seen.delete(seenOrder.shift());
  }

  function linkSend(link, message) {
    if (link.channel?.readyState !== 'open') return;
    try { link.channel.send(encodeJson(message)); } catch (err) { ctx.error(err); }
  }

  function others(exceptLinkId) {
    return [...links.entries()].filter(([linkId]) => linkId !== exceptLinkId).map(([, link]) => link);
  }

  function addPeers(ids, linkId) {
    const fresh = [];
    for (const id of ids) {
      if (typeof id !== 'string' || id === ctx.selfId || via.has(id)) continue;
      via.set(id, linkId);
      fresh.push(id);
      ctx.peerJoin(id);
    }
    if (fresh.length) for (const link of others(linkId)) linkSend(link, { t: 'join', ids: fresh });
  }

  function removePeers(ids, linkId) {
    const gone = [];
    for (const id of ids) {
      if (via.get(id) !== linkId) continue;
      via.delete(id);
      gone.push(id);
      ctx.peerLeave(id);
    }
    if (gone.length) for (const link of others(linkId)) linkSend(link, { t: 'leave', ids: gone });
  }

  function route(message, fromLinkId) {
    const targets = message.to;
    if (!targets) {
      for (const link of others(fromLinkId)) linkSend(link, message);
      return;
    }
    const byLink = new Map();
    for (const id of targets) {
      const linkId = via.get(id);
      if (!linkId || linkId === fromLinkId) continue;
      if (!byLink.has(linkId)) byLink.set(linkId, []);
      byLink.get(linkId).push(id);
    }
    for (const [linkId] of byLink) linkSend(links.get(linkId), message);
  }

  function wire(connection, channel, linkId, resolveConnected) {
    const link = { id: null, channel, connection };
    channel.onopen = () => {
      links.set(linkId, link);
      // Introduce ourselves and everyone we can already reach, so the new
      // device sees the whole group at once.
      const reachable = [ctx.selfId, ...[...via.keys()]];
      linkSend(link, { t: 'peers', ids: reachable, self: ctx.selfId });
      state = 'ready';
      ctx.statusChanged();
    };
    channel.onmessage = (event) => {
      let msg;
      try { msg = decodeJson(String(event.data)); } catch { return; }
      if (!msg || typeof msg !== 'object') return;
      if (msg.t === 'peers' && Array.isArray(msg.ids)) {
        if (typeof msg.self === 'string') link.id = msg.self;
        addPeers(msg.ids, linkId);
        if (link.id) resolveConnected?.(link.id);
      } else if (msg.t === 'join' && Array.isArray(msg.ids)) {
        addPeers(msg.ids, linkId);
      } else if (msg.t === 'leave' && Array.isArray(msg.ids)) {
        removePeers(msg.ids, linkId);
      } else if (msg.t === 'm' && typeof msg.id === 'string' && typeof msg.k === 'string') {
        if (seen.has(msg.id)) return;
        remember(msg.id);
        if ((!msg.to || msg.to.includes(ctx.selfId)) && via.has(msg.from)) ctx.receive(msg.from, msg.k, msg.d);
        route(msg, linkId);
      }
    };
    const close = () => {
      if (!links.has(linkId)) return;
      links.delete(linkId);
      removePeers([...via.entries()].filter(([, l]) => l === linkId).map(([id]) => id), linkId);
      if (!links.size) state = 'idle';
      ctx.statusChanged();
    };
    channel.onclose = close;
    connection.addEventListener('connectionstatechange', () => {
      if (['failed', 'closed', 'disconnected'].includes(connection.connectionState)) close();
    });
  }

  function newConnection() {
    const RTCPeer = RTC();
    if (typeof RTCPeer !== 'function') throw new Error('p2p-core: this browser has no WebRTC, so it cannot pair');
    return new RTCPeer({ iceServers: [...iceServers, ...turn], ...rtcConfig });
  }

  async function describe(connection, kind) {
    await waitForIce(connection);
    const { type, sdp } = connection.localDescription;
    return packCode(JSON.stringify({ v: 1, k: kind, r: roomTag(), i: ctx.selfId, t: type, s: sdp }));
  }

  async function readCode(code, kind) {
    let parsed;
    try { parsed = JSON.parse(await unpackCode(code)); } catch {
      throw new Error('p2p-core: that code could not be read. Copy all of it, or scan it again.');
    }
    if (parsed?.v !== 1 || parsed.k !== kind) {
      throw new Error(kind === 'o'
        ? 'p2p-core: that is an answer code. Give it to the person who made the invite.'
        : 'p2p-core: that is an invite code, not an answer. Paste it on the other device.');
    }
    if (parsed.r !== roomTag()) {
      throw new Error('p2p-core: that code is for a different game, room or password.');
    }
    if (parsed.i === ctx.selfId) throw new Error('p2p-core: that code came from this same page.');
    return parsed;
  }

  return {
    name: 'pair',
    start(context) {
      ctx = context;
      state = typeof RTC() === 'function' ? 'idle' : 'unavailable';
      ctx.statusChanged();
    },
    register() {},
    send(kind, data, ids) {
      const message = { t: 'm', id: randomId(12), from: ctx.selfId, to: ids || null, k: kind, d: data };
      remember(message.id);
      route(message, null);
    },
    stop() {
      stopped = true;
      for (const [linkId, link] of [...links]) {
        try { link.channel.close(); link.connection.close(); } catch { /* gone */ }
        links.delete(linkId);
      }
      for (const id of [...via.keys()]) { via.delete(id); ctx.peerLeave(id); }
      for (const connection of pending) { try { connection.close(); } catch { /* gone */ } }
      pending.clear();
      state = 'off';
    },
    status() {
      return { name: 'pair', state, peers: via.size, links: links.size };
    },
    async route(id) {
      const linkId = via.get(id);
      if (!linkId) return null;
      const link = links.get(linkId);
      if (link?.id !== id) return { path: 'via-peer', local: null, rtt: null, through: link?.id };
      return classifyConnection(link.connection);
    },
    connection(id) {
      const link = links.get(via.get(id));
      return link?.id === id ? link.connection : null;
    },

    /** Make an invite. Show `code` to the other device, then pass its answer to `finish`. */
    async invite() {
      if (stopped) throw new Error('p2p-core: this room has been left');
      const connection = newConnection();
      pending.add(connection);
      const linkId = randomId(10);
      const channel = connection.createDataChannel('p2p-core', { ordered: true });
      let resolveConnected;
      const connected = new Promise((resolve) => { resolveConnected = resolve; });
      wire(connection, channel, linkId, resolveConnected);
      await connection.setLocalDescription(await connection.createOffer());
      const code = await describe(connection, 'o');
      return {
        code,
        connected,
        async finish(answerCode) {
          const answer = await readCode(answerCode, 'a');
          await connection.setRemoteDescription({ type: answer.t, sdp: answer.s });
          pending.delete(connection);
          return connected;
        },
        cancel() { pending.delete(connection); try { connection.close(); } catch { /* gone */ } },
      };
    },

    /** Answer someone's invite. Show the returned `code` back to them. */
    async accept(inviteCode) {
      if (stopped) throw new Error('p2p-core: this room has been left');
      const offer = await readCode(inviteCode, 'o');
      const connection = newConnection();
      const linkId = randomId(10);
      let resolveConnected;
      const connected = new Promise((resolve) => { resolveConnected = resolve; });
      connection.ondatachannel = ({ channel }) => wire(connection, channel, linkId, resolveConnected);
      await connection.setRemoteDescription({ type: offer.t, sdp: offer.s });
      await connection.setLocalDescription(await connection.createAnswer());
      const code = await describe(connection, 'a');
      return { code, connected };
    },
  };
}
