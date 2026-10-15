/**
 * Shared state: a key/value object every peer in the room sees the same.
 * Lobbies, scoreboards, whose turn it is, which level is loaded.
 *
 *   import { sharedState } from './state.js';
 *
 *   const shared = sharedState(room, { initial: { level: 1 } });
 *   shared.onChange((key, value) => render());
 *   shared.set('level', 2);              // everyone sees level 2
 *   shared.set({ score: 10, turn: id }); // several keys at once
 *   shared.get('level');                 // 2
 *   shared.all();                        // { level: 2, score: 10, turn: ... }
 *
 * No host and no server. Each key keeps the write with the highest logical
 * clock (ties go to the higher peer id), so everyone converges on the same
 * values whatever order messages arrive in, and a peer who joins late gets
 * the current values from everyone already there.
 *
 * Last write wins PER KEY: two players setting the same key at the same moment
 * means one of the writes is lost. Use one key per player ("score:<id>") for
 * things several people change at once, or let one peer (room.isHost()) be
 * the only writer of a key.
 */
export function sharedState(room, { kind = 'state', initial = {} } = {}) {
  /** key -> { value, clock, by, deleted } */
  const entries = new Map();
  const listeners = [];
  let clock = 0;

  for (const [key, value] of Object.entries(initial)) {
    entries.set(key, { value, clock: 0, by: '', deleted: false });
  }

  const newer = (a, b) => !b || a.clock > b.clock || (a.clock === b.clock && a.by > b.by);

  function apply(key, entry) {
    if (!newer(entry, entries.get(key))) return false;
    entries.set(key, entry);
    clock = Math.max(clock, entry.clock);
    for (const fn of [...listeners]) {
      try { fn(key, entry.deleted ? undefined : entry.value, entry.by); } catch (err) { console.error('p2p-core sharedState: onChange threw', err); }
    }
    return true;
  }

  function snapshot() {
    return [...entries].filter(([, e]) => e.clock > 0).map(([key, e]) => [key, e.deleted ? null : e.value, e.clock, e.by, e.deleted ? 1 : 0]);
  }

  const offMessage = room.onMessage(kind, (data) => {
    if (!Array.isArray(data)) return;
    for (const item of data) {
      if (!Array.isArray(item) || typeof item[0] !== 'string' || !Number.isFinite(item[2]) || typeof item[3] !== 'string') continue;
      apply(item[0], { value: item[1], clock: item[2], by: item[3], deleted: item[4] === 1 });
    }
  });
  const offJoin = room.onPeerJoin((id) => {
    const all = snapshot();
    if (all.length) room.send(kind, all, id);
  });

  function write(changes) {
    const out = [];
    for (const [key, value, deleted] of changes) {
      if (typeof key !== 'string') throw new TypeError('p2p-core sharedState: keys are strings');
      if (value === undefined && !deleted) throw new TypeError(`p2p-core sharedState: "${key}" needs a value; use remove() to delete`);
      const entry = { value: deleted ? null : value, clock: ++clock, by: room.selfId, deleted: !!deleted };
      apply(key, entry);
      out.push([key, entry.value, entry.clock, entry.by, deleted ? 1 : 0]);
    }
    if (out.length) room.send(kind, out);
  }

  return {
    get: (key) => { const e = entries.get(key); return e && !e.deleted ? e.value : undefined; },
    all() {
      const out = {};
      for (const [key, e] of entries) if (!e.deleted) out[key] = e.value;
      return out;
    },
    /** set(key, value) or set({ key: value, ... }). */
    set(keyOrObject, value) {
      if (keyOrObject && typeof keyOrObject === 'object') write(Object.entries(keyOrObject).map(([k, v]) => [k, v, false]));
      else write([[keyOrObject, value, false]]);
    },
    remove(key) { write([[key, null, true]]); },
    /** fn(key, value, byPeerId). value is undefined for a removed key. */
    onChange(fn) {
      listeners.push(fn);
      return () => { const i = listeners.indexOf(fn); if (i >= 0) listeners.splice(i, 1); };
    },
    stop() { offMessage(); offJoin(); listeners.length = 0; },
  };
}
