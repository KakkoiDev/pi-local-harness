/**
 * One-on-one matchmaking: everyone who opens the same room is paired off two
 * by two, and each pair gets a private conversation.
 *
 *   import { joinRoom } from '../p2p-core.js';
 *   import { matchmake } from './matchmaking.js';
 *
 *   const room = joinRoom({ app: 'chess', room: 'match-' + gameId });
 *   const match = matchmake(room);
 *   match.onMatch(({ opponentId, host }) => start(host ? 'white' : 'black'));
 *   match.on('move', (move) => apply(move));      // only from your opponent
 *   match.send('move', { from: 'e2', to: 'e4' });  // only to your opponent
 *   match.onOpponentLeave(() => showReconnect());
 *   match.onRoomFull(() => showExpired());          // two others already paired
 *
 * Extracted from schness, where it was hardened against lost hellos and
 * crossed offers. The lower peer id offers; the other accepts; the offerer
 * confirms with "start". An offer that is not answered in time is dropped and
 * the search resumes, so three people opening one link at once still pair two
 * of them and tell the third the room is full.
 *
 * Works with a p2p-core room or a bare trystero room (pass `selfId` then).
 * The wire names (hello/offer/accept/decline/start, with a `v` field) are
 * schness's, so builds before and after the move still find each other.
 */

/** The waiting peer with the next id above ours, if any. Lower ids offer. */
export function chooseHostCandidate(selfId, peers) {
  return [...peers.entries()]
    .filter(([id, peer]) => peer?.waiting === true && selfId < id)
    .map(([id]) => id)
    .sort()[0] ?? null;
}

/** Two peers are already playing each other here. */
export function roomIsFull(peers) {
  return [...peers.values()].filter((peer) => peer?.waiting === false).length >= 2;
}

export function matchmake(room, {
  selfId = room.selfId,
  protocol = 1,
  helloIntervalMs = 4000,
  pendingTimeoutMs = 6000,
} = {}) {
  if (!selfId) throw new Error('p2p-core matchmake: pass { selfId } when using a bare trystero room');
  const [sendHello, onHello] = room.makeAction('hello');
  const [sendOffer, onOffer] = room.makeAction('offer');
  const [sendAccept, onAccept] = room.makeAction('accept');
  const [sendDecline, onDecline] = room.makeAction('decline');
  const [sendStart, onStart] = room.makeAction('start');

  const handlers = { match: [], full: [], leave: [], error: [], stream: [] };
  const fire = (name, ...args) => {
    for (const fn of handlers[name]) {
      try { fn(...args); } catch (err) { console.error(`p2p-core matchmake: ${name} handler threw`, err); }
    }
  };
  const channels = new Map();
  const peers = new Map();
  let phase = 'waiting';
  let target = null;
  let opponentId = null;
  let pendingTimer = null;

  const packet = (extra = {}) => ({ v: protocol, ...extra });

  room.onPeerJoin((id) => sendHelloPacket(id));
  room.onPeerLeave((id) => {
    peers.delete(id);
    if (id === opponentId) {
      opponentId = null;
      phase = 'closed';
      fire('leave');
    } else if (id === target) {
      resetPending();
      seek();
    }
  });

  onHello((data, id) => {
    if (!validPacket(data)) return;
    peers.set(id, { waiting: data.waiting === true });
    if (phase === 'waiting' && roomIsFull(peers)) {
      phase = 'full';
      fire('full');
      return;
    }
    seek();
  });
  onOffer((data, id) => {
    if (!validPacket(data)) return;
    if (phase !== 'waiting') { sendDecline(packet(), id); return; }
    phase = 'pending-guest';
    target = id;
    armPending();
    sendAccept(packet(), id);
  });
  onAccept((data, id) => {
    if (!validPacket(data) || phase !== 'pending-host' || id !== target) return;
    clearPending();
    opponentId = id;
    phase = 'matched';
    sendStart(packet(), id);
    announceUnavailable();
    fire('match', { opponentId: id, host: true });
  });
  onStart((data, id) => {
    if (!validPacket(data) || phase !== 'pending-guest' || id !== target) return;
    clearPending();
    opponentId = id;
    phase = 'matched';
    announceUnavailable();
    fire('match', { opponentId: id, host: false });
  });
  onDecline((data, id) => {
    if (!validPacket(data) || id !== target || !phase.startsWith('pending')) return;
    resetPending();
    peers.set(id, { waiting: false });
    seek();
  });
  room.onPeerStream?.((stream, id) => {
    if (phase === 'matched' && id === opponentId) fire('stream', stream);
  });

  function validPacket(data) {
    if (data?.v === protocol) return true;
    fire('error', 'A peer is using an incompatible game version.');
    return false;
  }
  function sendHelloPacket(to) { sendHello(packet({ waiting: phase === 'waiting' }), to); }
  function announceUnavailable() { sendHello(packet({ waiting: false })); }
  function announceWaiting() { if (phase === 'waiting') sendHello(packet({ waiting: true })); }
  function seek() {
    if (phase !== 'waiting') return;
    const candidate = chooseHostCandidate(selfId, peers);
    if (!candidate) return;
    phase = 'pending-host';
    target = candidate;
    armPending();
    sendOffer(packet(), candidate);
  }
  function armPending() {
    clearPending();
    pendingTimer = setTimeout(() => {
      resetPending();
      announceWaiting();
      seek();
    }, pendingTimeoutMs);
  }
  function clearPending() {
    if (pendingTimer) clearTimeout(pendingTimer);
    pendingTimer = null;
  }
  function resetPending() {
    clearPending();
    target = null;
    if (!opponentId) phase = 'waiting';
  }

  // A hello sent while the other page is still registering its handlers can
  // disappear. Re-announce while waiting, so two open browsers recover
  // without a refresh even if both first hellos were lost.
  const helloTimer = setInterval(announceWaiting, helloIntervalMs);
  queueMicrotask(announceWaiting);

  /** A private channel with the opponent: [send(data), onReceive(fn(data))]. */
  function channel(kind) {
    if (channels.has(kind)) return channels.get(kind).api;
    const [send, on] = room.makeAction(kind);
    const listeners = [];
    on((data, id) => {
      if (phase === 'matched' && id === opponentId) {
        for (const fn of [...listeners]) fn(data, id);
      }
    });
    const api = [
      (data) => {
        if (phase !== 'matched' || !opponentId) throw new Error('No opponent is connected');
        return send(data, opponentId);
      },
      (fn) => { listeners.push(fn); return () => listeners.splice(listeners.indexOf(fn) >>> 0, 1); },
    ];
    channels.set(kind, { api });
    return api;
  }

  return {
    selfId,
    get opponentId() { return opponentId; },
    get matched() { return phase === 'matched'; },
    get phase() { return phase; },
    onMatch: (fn) => handlers.match.push(fn),
    onRoomFull: (fn) => handlers.full.push(fn),
    onOpponentLeave: (fn) => handlers.leave.push(fn),
    onError: (fn) => handlers.error.push(fn),
    onPeerStream: (fn) => handlers.stream.push(fn),
    channel,
    send: (kind, data) => channel(kind)[0](data),
    on: (kind, fn) => channel(kind)[1](fn),
    addStream(stream) {
      if (phase !== 'matched' || !opponentId) throw new Error('No opponent is connected');
      return room.addStream(stream, opponentId);
    },
    removeStream(stream) {
      if (opponentId) return room.removeStream(stream, opponentId);
      return undefined;
    },
    /** The opponent's RTCPeerConnection, when the link is WebRTC. */
    connection() {
      return opponentId ? room.getPeers?.()[opponentId] || null : null;
    },
    /** Stop matchmaking. Leaves the room too, unless { keepRoom: true }. */
    leave({ keepRoom = false } = {}) {
      clearPending();
      clearInterval(helloTimer);
      phase = 'closed';
      if (!keepRoom) room.leave();
    },
  };
}
