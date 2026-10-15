/**
 * joinRoom — the one function a game needs.
 *
 * A room merges every way of reaching other players (other tabs, the internet
 * relays, a local server, pairing codes, a test network) into one list of
 * peers and one way to send messages. A peer reachable two ways is one peer;
 * messages to it take the best way available.
 *
 * The room has the same shape as a trystero room (makeAction, onPeerJoin,
 * onPeerLeave, leave, getPeers, addStream...), so code written for trystero
 * moves over by changing the import, and gains friendlier calls on top:
 * send / onMessage / peers / profile / host election / status.
 */
import { selfId as trysteroSelfId } from '../vendor/trystero/nostr.js';
import { Emitter, payloadSize, sha256 } from './util.js';
import { RELAYS } from './relays.js';
import { tabsTransport } from './transports/tabs.js';
import { relaysTransport } from './transports/relays.js';
import { serverTransport } from './transports/server.js';
import { pairTransport } from './transports/pair.js';
import { memoryTransport } from './transports/memory.js';

export const VERSION = '0.1.0';

/** Best first: when a peer is reachable several ways, messages take the first. */
const PRIORITY = ['tabs', 'memory', 'pair', 'relays', 'server'];

/** Which kind of place a peer is in, per transport. Relays and pairing are decided by the route. */
const SCOPE = { tabs: 'sameBrowser', server: 'sameNetwork', memory: 'any' };

const MODES = {
  auto: { tabs: true, relays: true, server: 'auto', pair: true },
  online: { tabs: true, relays: true, server: false, pair: true },
  offline: { tabs: true, relays: false, server: 'auto', pair: true },
  tabs: { tabs: true, relays: false, server: false, pair: false },
};

const KNOWN_OPTIONS = new Set([
  'app', 'appId', 'room', 'roomId', 'mode', 'allow', 'relays', 'turn', 'rtcConfig', 'password',
  'server', 'protocol', 'acceptPeer', 'maxPeers', 'maxMessageBytes', 'rateLimit', 'validate',
  'profile', 'kinds', 'network', 'transports', 'selfId', 'debug',
]);

const INTERNAL = { hello: '~hi', refuse: '~no', profile: '~pf', ping: '~pg', pong: '~po' };
const MAX_KIND_BYTES = 12;
const PENDING_BUFFER = 100;
const UNHANDLED_BUFFER = 100;
const UNHANDLED_MS = 10000;

function checkKind(kind, internal = false) {
  if (typeof kind !== 'string' || !kind) {
    throw new TypeError('p2p-core: a message kind must be a non-empty string, like "move" or "chat"');
  }
  if (!internal && kind.startsWith('~')) {
    throw new Error(`p2p-core: message kinds starting with "~" are reserved ("${kind}")`);
  }
  if (new TextEncoder().encode(kind).length > MAX_KIND_BYTES) {
    throw new Error(`p2p-core: message kind "${kind}" is longer than ${MAX_KIND_BYTES} bytes. Use a shorter name.`);
  }
}

function normalise(raw) {
  if (!raw || typeof raw !== 'object') {
    throw new TypeError("p2p-core: joinRoom needs options, at least { app: 'my-game' }");
  }
  for (const key of Object.keys(raw)) {
    if (!KNOWN_OPTIONS.has(key)) console.warn(`p2p-core: unknown option "${key}" is ignored. See README.md for the list.`);
  }
  const app = raw.app ?? raw.appId;
  if (typeof app !== 'string' || !app.trim()) {
    throw new TypeError("p2p-core: joinRoom needs an app name, e.g. joinRoom({ app: 'my-game' })");
  }
  const room = String(raw.room ?? raw.roomId ?? 'lobby');
  const mode = raw.mode ?? 'auto';
  if (!MODES[mode]) {
    throw new Error(`p2p-core: mode "${mode}" is not one of ${Object.keys(MODES).join(', ')}`);
  }
  const allow = { sameBrowser: true, sameNetwork: true, otherNetworks: true, ...(raw.allow || {}) };
  return {
    ...raw,
    app,
    room,
    mode,
    allow,
    relays: raw.relays ?? RELAYS,
    turn: raw.turn ?? [],
    maxPeers: raw.maxPeers ?? Infinity,
    maxMessageBytes: raw.maxMessageBytes ?? 64 * 1024,
    rateLimit: raw.rateLimit ?? 0,
    validate: raw.validate ?? {},
    kinds: raw.kinds ?? [],
  };
}

/** Which transports to run, from mode, allow, server and the explicit overrides. */
export function planTransports(options) {
  if (options.network) return { memory: true };
  const plan = { ...MODES[options.mode] };
  if (options.server) plan.server = options.server;
  if (options.server === false) plan.server = false;
  const { allow } = options;
  if (!allow.sameNetwork && !allow.otherNetworks) {
    plan.relays = false;
    plan.server = false;
    plan.pair = false;
  }
  if (!allow.sameNetwork) plan.server = false;
  if (plan.tabs && !allow.sameBrowser) plan.tabs = 'silent';
  for (const [name, value] of Object.entries(options.transports || {})) {
    if (!(name in plan) && name !== 'memory') {
      console.warn(`p2p-core: unknown transport "${name}" in options.transports`);
      continue;
    }
    plan[name] = value;
  }
  return plan;
}

export function joinRoom(rawOptions) {
  const options = normalise(rawOptions);
  const { app, allow } = options;
  const plan = planTransports(options);

  const selfId = options.selfId
    ?? (options.network ? options.network.newId() : trysteroSelfId);
  if (plan.relays && options.selfId && options.selfId !== trysteroSelfId && !plan.relays.joinRoom) {
    throw new Error('p2p-core: a custom selfId cannot be used with the internet relays');
  }
  const roomKey = options.password
    ? sha256(`p2p-core\n${app}\n${options.room}\n${options.password}`).slice(0, 32)
    : options.room;

  const events = new Emitter();
  /** id -> record. `peer` is the public object handed to the game. */
  const records = new Map();
  /** Other tabs of this browser that asked not to be peers (allow.sameBrowser === false). */
  const siblings = new Set();
  const kindHandlers = new Map();
  const actionHandlers = new Map();
  const actionCache = new Map();
  const unhandled = new Map();
  const kinds = new Set(Object.values(INTERNAL));
  const pings = new Map();
  let profile = options.profile;
  let left = false;
  let lastHost = selfId;
  let statusQueued = false;

  const stats = {
    sent: 0,
    received: 0,
    dropped: { unknownPeer: 0, tooBig: 0, rateLimited: 0, invalid: 0, unhandled: 0, refused: 0 },
  };

  const debug = (...args) => { if (options.debug) console.log('[p2p-core]', ...args); };

  // ------------------------------------------------------------ transports

  const transports = new Map();
  const make = {
    tabs: (value) => tabsTransport({ silent: value === 'silent' }),
    relays: (value) => relaysTransport({
      relays: options.relays,
      password: options.password,
      turn: options.turn,
      rtcConfig: options.rtcConfig,
      ...(typeof value === 'object' ? value : {}),
    }),
    server: (value) => serverTransport(typeof value === 'object' ? value : { url: value === true ? 'auto' : value }),
    pair: (value) => pairTransport({
      turn: options.turn,
      rtcConfig: options.rtcConfig,
      ...(typeof value === 'object' ? value : {}),
    }),
    memory: () => memoryTransport(options.network),
  };
  for (const name of PRIORITY) {
    if (plan[name]) transports.set(name, make[name](plan[name]));
  }

  /** Every id each transport is connected to, siblings and refused peers included. */
  const members = new Map();

  function contextFor(transport) {
    const here = new Set();
    members.set(transport.name, here);
    return {
      selfId,
      appId: app,
      roomId: roomKey,
      key: `${app}:${roomKey}`,
      kinds: () => [...kinds],
      peerJoin: (id) => { here.add(id); transportJoin(transport.name, id); },
      peerLeave: (id) => { here.delete(id); transportLeave(transport.name, id); },
      receive: (id, kind, data, meta) => receive(transport.name, id, kind, data, meta),
      stream: (id, stream, meta) => {
        if (records.get(id)?.state === 'accepted') events.emit('stream', stream, id, meta);
      },
      track: (id, track, stream, meta) => {
        if (records.get(id)?.state === 'accepted') events.emit('track', track, stream, id, meta);
      },
      sibling: (id) => {
        siblings.add(id);
        const record = records.get(id);
        if (record) dropRecord(record);
      },
      statusChanged: queueStatus,
      error: (err) => { if (!left) events.emit('error', err); },
    };
  }

  function queueStatus() {
    if (statusQueued || left) return;
    statusQueued = true;
    queueMicrotask(() => {
      statusQueued = false;
      if (!left) events.emit('status', status());
    });
  }

  // --------------------------------------------------------------- peers

  function bestTransport(record) {
    for (const name of PRIORITY) if (record.via.has(name)) return name;
    return null;
  }

  function publicPeer(record) {
    record.peer.via = PRIORITY.filter((name) => record.via.has(name));
    record.peer.transport = record.peer.via[0] || null;
    return record.peer;
  }

  const needsHello = options.protocol !== undefined || typeof options.acceptPeer === 'function';
  const filtersRoute = allow.sameNetwork !== allow.otherNetworks;

  function transportJoin(name, id) {
    if (left || id === selfId || siblings.has(id)) return;
    let record = records.get(id);
    if (!record) {
      record = {
        id,
        via: new Set(),
        state: 'pending',
        hello: null,
        helloSent: 0,
        scope: null,
        accepted: null,
        buffer: [],
        bucket: { tokens: options.rateLimit * 2, at: Date.now() },
        peer: { id, profile: undefined, joinedAt: null, via: [], transport: null },
      };
      records.set(id, record);
    }
    const fresh = !record.via.has(name);
    record.via.add(name);
    debug('transport join', name, id, record.state);
    if (record.state === 'accepted') {
      if (fresh) events.emit('update', id, publicPeer(record));
      return;
    }
    if (record.state === 'refused') return;
    sendHello(record, false);
    evaluate(record);
  }

  function transportLeave(name, id) {
    const record = records.get(id);
    if (!record || !record.via.delete(name)) return;
    debug('transport leave', name, id);
    if (record.via.size) {
      if (record.state === 'accepted') events.emit('update', id, publicPeer(record));
      return;
    }
    dropRecord(record);
  }

  function dropRecord(record) {
    records.delete(record.id);
    clearTimeout(record.helloTimer);
    if (record.state === 'accepted' && !left) {
      events.emit('leave', record.id, publicPeer(record));
      checkHost();
    }
  }

  function sendHello(record, seen) {
    record.helloSent++;
    internalSend(INTERNAL.hello, { v: options.protocol ?? null, p: profile ?? null, s: seen, lib: VERSION }, record);
    // A hello sent while the other side is still wiring itself up can vanish.
    // Until we have heard theirs, say it again, a few times.
    clearTimeout(record.helloTimer);
    if (needsHello && !record.hello && record.helloSent < 8 && !left) {
      record.helloTimer = setTimeout(() => {
        if (records.get(record.id) === record && !record.hello) sendHello(record, false);
      }, 1500);
    }
  }

  function scopeFor(record) {
    for (const name of PRIORITY) {
      if (record.via.has(name) && SCOPE[name]) return SCOPE[name];
    }
    return record.scope; // relays / pair: decided by the route, below
  }

  async function classify(record) {
    if (record.classifying) return;
    record.classifying = true;
    const name = record.via.has('pair') ? 'pair' : 'relays';
    let route = null;
    // The browser picks the candidate pair a moment after the channel opens.
    for (let i = 0; i < 10 && !left; i++) {
      route = await transports.get(name)?.route?.(record.id);
      if (route && route.path !== 'unknown') break;
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
    record.classifying = false;
    // Unknown counts as the same network. Refusing a classmate because their
    // browser would not describe its own connection is the worse mistake.
    record.scope = route?.local === false ? 'otherNetworks' : 'sameNetwork';
    record.route = route;
    evaluate(record);
  }

  async function evaluate(record) {
    if (record.state !== 'pending' || records.get(record.id) !== record || left) return;
    if (needsHello && !record.hello) return;
    if (options.protocol !== undefined && record.hello.v !== options.protocol) {
      refuse(record, 'version', `A peer is using an incompatible version (${record.hello.v ?? 'none'}, this page has ${options.protocol}).`);
      return;
    }
    let scope = scopeFor(record);
    if (!scope && filtersRoute) { classify(record); return; }
    scope ||= 'any';
    if (scope !== 'any' && !allow[scope]) {
      refuse(record, 'not-allowed', `A peer was refused: this room does not allow ${scope}.`);
      return;
    }
    const acceptedCount = [...records.values()].filter((r) => r.state === 'accepted').length;
    if (acceptedCount >= options.maxPeers) {
      refuse(record, 'full', 'A peer was refused: the room is full.');
      return;
    }
    if (typeof options.acceptPeer === 'function' && record.accepted === null) {
      record.accepted = 'deciding';
      let verdict = false;
      try {
        verdict = await options.acceptPeer({ id: record.id, profile: record.hello?.p ?? undefined, via: [...record.via] });
      } catch (err) {
        events.emit('error', err);
      }
      record.accepted = !!verdict;
      if (!verdict) { refuse(record, 'rejected', 'A peer was refused by acceptPeer.'); return; }
      evaluate(record);
      return;
    }
    if (record.accepted === 'deciding') return;
    accept(record);
  }

  function accept(record) {
    record.state = 'accepted';
    record.peer.joinedAt = Date.now();
    if (record.hello) record.peer.profile = record.hello.p ?? undefined;
    debug('accepted', record.id);
    events.emit('join', record.id, publicPeer(record));
    checkHost();
    const queued = record.buffer;
    record.buffer = [];
    for (const [kind, data, meta] of queued) deliver(record, kind, data, meta);
  }

  function refuse(record, reason, message) {
    record.state = 'refused';
    record.buffer = [];
    stats.dropped.refused++;
    internalSend(INTERNAL.refuse, { r: reason }, record);
    debug('refused', record.id, reason);
    events.emit('refused', record.id, reason);
    if (reason === 'version') events.emit('error', new Error(`p2p-core: ${message}`));
  }

  function checkHost() {
    const host = hostId();
    if (host !== lastHost) {
      lastHost = host;
      events.emit('host', host);
    }
  }

  function hostId() {
    let host = selfId;
    for (const record of records.values()) {
      if (record.state === 'accepted' && record.id < host) host = record.id;
    }
    return host;
  }

  // ------------------------------------------------------------ receiving

  function receive(name, id, kind, data, meta) {
    if (left || siblings.has(id)) return;
    const record = records.get(id);
    if (!record) { stats.dropped.unknownPeer++; return; }
    if (kind.startsWith('~')) { internalReceive(record, kind, data); return; }
    if (record.state === 'pending') {
      if (record.buffer.length < PENDING_BUFFER) record.buffer.push([kind, data, meta]);
      return;
    }
    if (record.state !== 'accepted') { stats.dropped.refused++; return; }
    deliver(record, kind, data, meta);
  }

  function rateOk(record) {
    if (!options.rateLimit) return true;
    const now = Date.now();
    const bucket = record.bucket;
    bucket.tokens = Math.min(options.rateLimit * 2, bucket.tokens + ((now - bucket.at) / 1000) * options.rateLimit);
    bucket.at = now;
    if (bucket.tokens < 1) return false;
    bucket.tokens -= 1;
    return true;
  }

  function deliver(record, kind, data, meta) {
    if (options.maxMessageBytes && payloadSize(data) > options.maxMessageBytes) { stats.dropped.tooBig++; return; }
    if (!rateOk(record)) { stats.dropped.rateLimited++; return; }
    const validator = options.validate[kind];
    if (validator) {
      let ok = false;
      try { ok = validator(data, record.id) !== false; } catch { ok = false; }
      if (!ok) { stats.dropped.invalid++; debug('invalid', kind, data); return; }
    }
    stats.received++;
    const handlers = kindHandlers.get(kind);
    const action = actionHandlers.get(kind);
    let handled = 0;
    if (handlers?.size) {
      for (const fn of [...handlers]) {
        try { fn(data, record.id, publicPeer(record), meta); } catch (err) { console.error(`p2p-core: a "${kind}" handler threw`, err); }
      }
      handled++;
    }
    if (action) {
      try { action(data, record.id, meta); } catch (err) { console.error(`p2p-core: a "${kind}" action handler threw`, err); }
      handled++;
    }
    handled += events.emit('message', kind, data, record.id, publicPeer(record));
    if (!handled) {
      // Nobody listening yet. Hold it briefly: a handler registered a moment
      // late should still hear the first message, which is so often the
      // important one ("hello", "start", "your colour").
      stats.dropped.unhandled++;
      if (!unhandled.has(kind)) unhandled.set(kind, []);
      const list = unhandled.get(kind);
      list.push({ record, data, meta, at: Date.now() });
      if (list.length > UNHANDLED_BUFFER) list.shift();
    }
  }

  function flushUnhandled(kind) {
    const list = unhandled.get(kind);
    if (!list) return;
    unhandled.delete(kind);
    const now = Date.now();
    queueMicrotask(() => {
      for (const item of list) {
        if (now - item.at > UNHANDLED_MS || records.get(item.record.id) !== item.record) continue;
        stats.dropped.unhandled--;
        stats.received--;
        deliver(item.record, kind, item.data, item.meta);
      }
    });
  }

  function internalReceive(record, kind, data) {
    if (kind === INTERNAL.hello) {
      if (!data || typeof data !== 'object') return;
      const first = !record.hello;
      record.hello = { v: data.v ?? undefined, p: data.p ?? undefined, lib: data.lib };
      if (!data.s) sendHello(record, true);
      if (record.state === 'accepted') {
        record.peer.profile = record.hello.p;
        if (first || data.p !== undefined) events.emit('update', record.id, publicPeer(record));
      } else if (record.state === 'pending') {
        evaluate(record);
      }
    } else if (kind === INTERNAL.profile) {
      if (record.state !== 'accepted') { if (record.hello) record.hello.p = data; return; }
      record.peer.profile = data ?? undefined;
      events.emit('update', record.id, publicPeer(record));
    } else if (kind === INTERNAL.refuse) {
      if (record.state === 'refused') return;
      const wasAccepted = record.state === 'accepted';
      record.state = 'refused';
      events.emit('refused', record.id, `they-refused:${data?.r ?? 'unknown'}`);
      if (data?.r === 'version') events.emit('error', new Error('p2p-core: a peer is using an incompatible version.'));
      if (wasAccepted) { events.emit('leave', record.id, publicPeer(record)); checkHost(); }
    } else if (kind === INTERNAL.ping) {
      internalSend(INTERNAL.pong, data, record);
    } else if (kind === INTERNAL.pong) {
      const waiting = pings.get(data);
      if (waiting) { pings.delete(data); waiting(); }
    }
  }

  // --------------------------------------------------------------- sending

  function register(kind) {
    if (kinds.has(kind)) return;
    kinds.add(kind);
    for (const transport of transports.values()) transport.register(kind);
  }

  function internalSend(kind, data, record) {
    const name = bestTransport(record);
    if (!name) return undefined;
    try {
      return transports.get(name).send(kind, data, [record.id]);
    } catch (err) {
      events.emit('error', err);
      return undefined;
    }
  }

  function targets(to) {
    if (to === undefined || to === null) {
      return [...records.values()].filter((r) => r.state === 'accepted');
    }
    const ids = Array.isArray(to) ? to : [to];
    const out = [];
    for (const id of ids) {
      const record = records.get(id);
      if (record?.state === 'accepted') out.push(record);
      else debug(`send: ${id} is not a peer in this room; skipped`);
    }
    return out;
  }

  function send(kind, data, to, meta) {
    checkKind(kind);
    if (left) throw new Error('p2p-core: this room has been left; join again to send');
    if (data === undefined) throw new TypeError(`p2p-core: send("${kind}") needs data. Send null for "nothing".`);
    if (typeof data === 'function') throw new TypeError(`p2p-core: send("${kind}") cannot send a function`);
    if (options.maxMessageBytes && payloadSize(data) > options.maxMessageBytes) {
      throw new Error(`p2p-core: a "${kind}" message is ${payloadSize(data)} bytes, over maxMessageBytes `
        + `(${options.maxMessageBytes}). Send less, or raise maxMessageBytes on every peer.`);
    }
    register(kind);
    const groups = new Map();
    for (const record of targets(to)) {
      const name = bestTransport(record);
      if (!name) continue;
      if (!groups.has(name)) groups.set(name, []);
      groups.get(name).push(record.id);
    }
    const sending = [];
    for (const [name, ids] of groups) {
      stats.sent += ids.length;
      // When this list is everybody the transport can reach, say "everybody"
      // (trystero's null), as a trystero app would. Never otherwise: a
      // broadcast would also reach refused peers and sibling tabs.
      const everyone = to == null && [...(members.get(name) || [])].every((id) => ids.includes(id));
      try { sending.push(transports.get(name).send(kind, data, everyone ? null : ids, meta)); } catch (err) { events.emit('error', err); }
    }
    return Promise.all(sending).then(() => undefined);
  }

  function onMessage(kind, fn) {
    if (typeof kind === 'function') return events.on('message', kind);
    checkKind(kind);
    if (typeof fn !== 'function') throw new TypeError(`p2p-core: onMessage("${kind}", fn) needs a function`);
    register(kind);
    if (!kindHandlers.has(kind)) kindHandlers.set(kind, new Set());
    kindHandlers.get(kind).add(fn);
    flushUnhandled(kind);
    return () => kindHandlers.get(kind)?.delete(fn);
  }

  /** trystero's makeAction: [send(data, to), onReceive(fn(data, peerId)), onProgress]. */
  function makeAction(kind) {
    checkKind(kind);
    if (actionCache.has(kind)) return actionCache.get(kind);
    register(kind);
    const pair = [
      (data, to, meta) => send(kind, data, to ?? undefined, meta),
      (fn) => { actionHandlers.set(kind, fn); flushUnhandled(kind); },
      () => {},
    ];
    actionCache.set(kind, pair);
    return pair;
  }

  // --------------------------------------------------------------- status

  function status() {
    const out = {};
    for (const [name, transport] of transports) out[name] = transport.status();
    const accepted = [...records.values()].filter((r) => r.state === 'accepted').length;
    return {
      selfId,
      peers: accepted,
      online: Object.values(out).some((t) => t.state === 'ready'),
      transports: out,
    };
  }

  // ------------------------------------------------------------ the room

  const room = {
    selfId,
    app,
    roomId: options.room,
    options,
    stats,
    version: VERSION,

    send,
    onMessage,
    makeAction,
    onPeerJoin: (fn) => events.on('join', fn),
    onPeerLeave: (fn) => events.on('leave', fn),
    onPeerUpdate: (fn) => events.on('update', fn),
    onRefused: (fn) => events.on('refused', fn),
    onError: (fn) => events.on('error', fn),
    onStatus: (fn) => events.on('status', fn),
    onHostChange: (fn) => events.on('host', fn),
    onPeerStream: (fn) => events.on('stream', fn),
    onPeerTrack: (fn) => events.on('track', fn),

    peers: () => [...records.values()].filter((r) => r.state === 'accepted').map(publicPeer),
    peer: (id) => { const r = records.get(id); return r?.state === 'accepted' ? publicPeer(r) : null; },
    count: () => [...records.values()].filter((r) => r.state === 'accepted').length,
    hostId,
    isHost: () => hostId() === selfId,

    get profile() { return profile; },
    setProfile(next) {
      profile = next;
      for (const record of records.values()) {
        if (record.state === 'accepted') internalSend(INTERNAL.profile, next ?? null, record);
      }
    },

    status,
    /** How a peer is connected: { path, local, rtt, transport }. */
    async route(id) {
      const record = records.get(id);
      if (!record) return null;
      const name = bestTransport(record);
      const route = await transports.get(name)?.route?.(id);
      return route ? { ...route, transport: name } : { path: 'unknown', local: null, rtt: null, transport: name };
    },
    /** Round trip to a peer in milliseconds, over whichever way it is reached. */
    ping(id, timeoutMs = 5000) {
      const record = records.get(id);
      if (record?.state !== 'accepted') return Promise.reject(new Error(`p2p-core: ${id} is not a peer in this room`));
      const token = Math.random().toString(36).slice(2);
      const started = performance.now();
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => { pings.delete(token); reject(new Error('p2p-core: ping timed out')); }, timeoutMs);
        pings.set(token, () => { clearTimeout(timer); resolve(Math.round(performance.now() - started)); });
        internalSend(INTERNAL.ping, token, record);
      });
    },

    // WebRTC media. Only peers reached over the relays can receive streams.
    addStream(stream, to, meta) { return media(to, (t, ids) => t.addStream(stream, ids, meta)); },
    removeStream(stream, to) { return media(to, (t, ids) => t.removeStream(stream, ids)); },
    addTrack(track, stream, to, meta) { return media(to, (t, ids) => t.addTrack(track, stream, ids, meta)); },
    removeTrack(track, to) { return media(to, (t, ids) => t.removeTrack(track, ids)); },
    /** trystero's getPeers(): { peerId: RTCPeerConnection } for peers reached over WebRTC. */
    getPeers() {
      const out = {};
      for (const record of records.values()) {
        if (record.state !== 'accepted') continue;
        for (const name of ['relays', 'pair']) {
          const connection = record.via.has(name) && transports.get(name)?.connection?.(record.id);
          if (connection) { out[record.id] = connection; break; }
        }
      }
      return out;
    },

    pair: {
      get available() { return transports.has('pair'); },
      /** Make an invite code for another device. Returns { code, finish(answer), connected, cancel() }. */
      invite() { return pairing().invite(); },
      /** Answer an invite code. Returns { code (show this to the inviter), connected }. */
      accept(code) { return pairing().accept(code); },
    },

    /** The underlying transport, for advanced use: 'tabs', 'relays', 'server', 'pair', 'memory'. */
    transport: (name) => transports.get(name) || null,

    leave() {
      if (left) return;
      left = true;
      for (const transport of transports.values()) {
        try { transport.stop(); } catch (err) { console.error('p2p-core: stopping', transport.name, err); }
      }
      for (const record of records.values()) clearTimeout(record.helloTimer);
      records.clear();
      events.clear();
    },
    get left() { return left; },
  };

  function pairing() {
    const transport = transports.get('pair');
    if (!transport) {
      throw new Error('p2p-core: pairing is off for this room (mode "tabs", or allow.sameNetwork and '
        + 'allow.otherNetworks are both false, or transports.pair is false).');
    }
    return transport;
  }

  /** Media goes over the relays' WebRTC links; peers reached only another way are skipped. */
  function media(to, call) {
    const relays = transports.get('relays');
    const ids = targets(to).filter((record) => {
      if (record.via.has('relays')) return true;
      events.emit('error', new Error(`p2p-core: ${record.id} is not reached over the relays, so it cannot receive media`));
      return false;
    }).map((record) => record.id);
    if (!relays || !ids.length) return [];
    return call(relays, ids);
  }

  for (const kind of options.kinds) { checkKind(kind); kinds.add(kind); }

  const starting = [];
  for (const transport of transports.values()) {
    try {
      starting.push(Promise.resolve(transport.start(contextFor(transport))).catch((err) => events.emit('error', err)));
    } catch (err) {
      queueMicrotask(() => events.emit('error', err));
    }
  }
  room.ready = Promise.all(starting).then(() => room);
  debug('joined', app, options.room, 'as', selfId, 'with', [...transports.keys()].join(', '));
  return room;
}
