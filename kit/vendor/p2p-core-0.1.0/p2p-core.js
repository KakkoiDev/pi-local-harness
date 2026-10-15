/**
 * p2p-core — multiplayer for browser games with no build step.
 *
 *   import { joinRoom } from './vendor/p2p-core/p2p-core.js';
 *   const room = joinRoom({ app: 'my-game' });
 *   room.onPeerJoin((id) => console.log(id, 'joined'));
 *   room.onMessage('move', (data, from) => draw(from, data));
 *   room.send('move', { x: 1, y: 2 });
 *
 * README.md is the manual; AGENTS.md is the short version for coding agents.
 */
export { joinRoom, planTransports, VERSION } from './src/room.js';
export { RELAYS } from './src/relays.js';
/** This page's id on the relays: what every room in this page is called, unless given `selfId`. */
export { selfId } from './vendor/trystero/nostr.js';
export { createTestNetwork } from './src/transports/memory.js';
export { detectServer } from './src/transports/server.js';
export { classifyCandidates } from './src/route.js';
