/**
 * An in-memory network for tests. Every room joined with the same `network`
 * object can see every other one, in the same process, with no browser, no
 * relays and no timers you did not ask for.
 *
 *   const network = createTestNetwork();
 *   const a = joinRoom({ app: 'game', network });
 *   const b = joinRoom({ app: 'game', network });
 *   await network.settle();          // let joins and messages land
 *
 * Messages are delivered asynchronously (as on a real network), in order.
 * `network.settle()` waits until nothing is in flight. `network.latency` adds
 * a delay, `network.drop(fn)` loses the messages `fn` returns true for, and
 * `network.disconnect(id)` pulls one peer's cable.
 */
import { encodeJson, decodeJson, randomId } from '../util.js';

export function createTestNetwork({ latency = 0 } = {}) {
  /** key -> Map(id -> endpoint) */
  const rooms = new Map();
  let inFlight = 0;
  let waiters = [];
  let dropRule = null;
  const log = [];

  function settleCheck() {
    if (inFlight === 0) {
      const done = waiters;
      waiters = [];
      for (const resolve of done) resolve();
    }
  }

  function deliver(fn) {
    inFlight++;
    const run = () => {
      try { fn(); } finally { inFlight--; queueMicrotask(settleCheck); }
    };
    if (network.latency > 0) setTimeout(run, network.latency);
    else setTimeout(run, 0);
  }

  const network = {
    latency,
    log,
    newId: () => randomId(20),
    attach(key, id, endpoint) {
      if (!rooms.has(key)) rooms.set(key, new Map());
      const room = rooms.get(key);
      const others = [...room.keys()];
      room.set(id, endpoint);
      for (const other of others) {
        deliver(() => { room.get(other)?.join(id); });
        deliver(() => { room.get(id)?.join(other); });
      }
    },
    detach(key, id) {
      const room = rooms.get(key);
      if (!room?.has(id)) return;
      room.delete(id);
      for (const other of room.keys()) deliver(() => room.get(other)?.leave(id));
    },
    send(key, from, ids, kind, data) {
      const room = rooms.get(key);
      if (!room) return;
      // Through JSON, as on a real wire: a game that sends something that does
      // not survive the trip finds out in its tests, not in production.
      const wire = encodeJson(data === undefined ? null : data);
      for (const [id, endpoint] of room) {
        if (id === from || (ids && !ids.includes(id))) continue;
        const entry = { from, to: id, kind, data: decodeJson(wire) };
        if (dropRule?.(entry)) continue;
        log.push(entry);
        deliver(() => { if (rooms.get(key)?.get(id) === endpoint) endpoint.receive(from, kind, decodeJson(wire)); });
      }
    },
    /** Resolves once every queued join, leave and message has been delivered. */
    settle() {
      return new Promise((resolve) => {
        waiters.push(resolve);
        setTimeout(settleCheck, 0);
      });
    },
    drop(rule) { dropRule = rule; },
    /** Simulate a lost connection: everybody sees `id` leave. */
    disconnect(id) {
      for (const [key, room] of rooms) if (room.has(id)) network.detach(key, id);
    },
  };
  return network;
}

export function memoryTransport(network) {
  let ctx = null;
  let attached = false;
  const peers = new Set();
  return {
    name: 'memory',
    start(context) {
      ctx = context;
      network.attach(ctx.key, ctx.selfId, {
        join: (id) => { if (!peers.has(id)) { peers.add(id); ctx.peerJoin(id); } },
        leave: (id) => { if (peers.delete(id)) ctx.peerLeave(id); },
        receive: (id, kind, data) => { if (peers.has(id)) ctx.receive(id, kind, data); },
      });
      attached = true;
      ctx.statusChanged();
    },
    register() {},
    send(kind, data, ids) {
      if (attached) network.send(ctx.key, ctx.selfId, ids, kind, data);
    },
    stop() {
      if (!attached) return;
      attached = false;
      network.detach(ctx.key, ctx.selfId);
      for (const id of [...peers]) { peers.delete(id); ctx.peerLeave(id); }
    },
    status() { return { name: 'memory', state: attached ? 'ready' : 'off', peers: peers.size }; },
    async route(id) { return peers.has(id) ? { path: 'memory', local: true, rtt: 0 } : null; },
  };
}
