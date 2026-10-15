/**
 * Smooth positions for real-time games: say where you are a few times a
 * second, and draw everyone else gliding, not teleporting.
 *
 *   import { presence } from './presence.js';
 *
 *   const players = presence(room, { hz: 10 });
 *   players.follow(() => ({ x: me.x, y: me.y }));   // broadcast this, 10 times a second
 *   function frame(now) {
 *     for (const { id, state } of players.all(now)) draw(id, state.x, state.y);
 *     requestAnimationFrame(frame);
 *   }
 *
 * Extracted from kakkoi-online:
 *   - A state identical to the last one sent is not sent again, except every
 *     `keepAliveMs`, because people stand still a lot and a phone sending ten
 *     identical packets a second gets hot.
 *   - Others are drawn `interpDelayMs` in the past, sliding between the two
 *     samples either side of that moment. Being an eyeblink behind is
 *     invisible; jumping 15 pixels at a time is not.
 *   - Numbers are interpolated; anything else (a name, a facing) takes the
 *     latest value.
 *   - `round: true` sends whole numbers only (pixel positions): fewer bytes.
 *   - `sleep()` / `wake()` stop and restart the broadcast without leaving the
 *     room — call them on `visibilitychange`.
 */

/** Where something was at time `t`, sliding between the samples either side. */
export function sampleAt(history, t) {
  if (!history.length) return null;
  if (t <= history[0].t) return history[0].state;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].t > t) continue;
    const a = history[i];
    const b = history[i + 1];
    if (!b) return a.state;
    const span = b.t - a.t;
    const f = span > 0 ? (t - a.t) / span : 1;
    return blend(a.state, b.state, f);
  }
  return history[0].state;
}

function blend(a, b, f) {
  if (typeof a === 'number' && typeof b === 'number') return a + (b - a) * f;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object' || Array.isArray(a) !== Array.isArray(b)) return b;
  const out = Array.isArray(b) ? [] : {};
  for (const key of Object.keys(b)) out[key] = key in a ? blend(a[key], b[key], f) : b[key];
  return out;
}

/** Forget samples already walked past, keeping the one we came from. */
export function prune(history, t) {
  while (history.length > 2 && history[1].t <= t) history.shift();
}

function same(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function presence(room, {
  kind = 'pos',
  hz = 10,
  keepAliveMs = 2000,
  interpDelayMs = 150,
  historySize = 12,
  validate,
  round = false,
} = {}) {
  const every = 1000 / Math.max(1, hz);
  const others = new Map();
  const listeners = [];
  let source = null;
  let timer = null;
  let lastSent = null;
  let lastSentAt = 0;
  const stats = { sent: 0, skipped: 0, received: 0, invalid: 0 };

  const prepare = (state) => (round ? roundNumbers(state) : state);

  function receive(state, id) {
    if (validate && validate(state, id) === false) { stats.invalid++; return; }
    stats.received++;
    const now = performance.now();
    let entry = others.get(id);
    if (!entry) { entry = { history: [], state, latest: state, at: now }; others.set(id, entry); }
    entry.history.push({ t: now, state });
    if (entry.history.length > historySize) entry.history.shift();
    entry.latest = state;
    entry.at = now;
    for (const fn of listeners) fn(id, state);
  }

  const offMessage = room.onMessage(kind, (state, id) => receive(state, id));
  const offLeave = room.onPeerLeave((id) => others.delete(id));
  // Someone new knows nothing about us: tell them at once, not at the next change.
  const offJoin = room.onPeerJoin((id) => { if (source) sendTo(id); });

  function current() {
    try { return prepare(typeof source === 'function' ? source() : source); } catch { return null; }
  }

  function sendTo(id) {
    const state = current();
    if (state != null) room.send(kind, state, id);
  }

  function tick(force = false) {
    const state = current();
    if (state == null) return;
    const now = performance.now();
    if (!force && lastSent !== null && same(state, lastSent) && now - lastSentAt < keepAliveMs) {
      stats.skipped++;
      return;
    }
    room.send(kind, state);
    stats.sent++;
    lastSent = state;
    lastSentAt = now;
  }

  return {
    stats,
    /** Broadcast this state (an object, or a function returning one) `hz` times a second. */
    follow(state) {
      source = state;
      clearInterval(timer);
      timer = setInterval(() => tick(), every);
      tick(true);
    },
    /** Send now, even if nothing changed (after a teleport, a map change...). */
    push() { tick(true); },
    sleep() { clearInterval(timer); timer = null; },
    wake() {
      if (!timer && source) { timer = setInterval(() => tick(), every); tick(true); }
    },
    /** Smoothed state of one peer at time `now` (performance.now()), or null. */
    get(id, now = performance.now()) {
      const entry = others.get(id);
      if (!entry) return null;
      const when = now - interpDelayMs;
      const state = sampleAt(entry.history, when);
      prune(entry.history, when);
      return state;
    },
    /** The raw last state a peer sent, not smoothed. */
    latest(id) { return others.get(id)?.latest ?? null; },
    /** Smoothed states of everyone: [{ id, state }]. Call once per frame. */
    all(now = performance.now()) {
      return [...others.keys()].map((id) => ({ id, state: this.get(id, now) })).filter((e) => e.state != null);
    },
    /** fn(id, state) on every update that arrives. */
    onUpdate(fn) { listeners.push(fn); },
    forget(id) { others.delete(id); },
    stop() {
      clearInterval(timer);
      timer = null;
      offMessage?.();
      offLeave?.();
      offJoin?.();
      others.clear();
    },
  };
}

/** Whole numbers travel as fewer bytes and nobody can see half a pixel. */
function roundNumbers(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? Math.round(value) : value;
  if (Array.isArray(value)) return value.map(roundNumbers);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, v] of Object.entries(value)) out[key] = roundNumbers(v);
    return out;
  }
  return value;
}
