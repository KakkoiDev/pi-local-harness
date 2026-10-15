/**
 * A small live line saying who is here and how they are reached. Useful in a
 * settings panel, and the first thing to read out when "we can't see each
 * other" (ISSUES.md #2 in kakkoi-online had three causes nobody could tell
 * apart without it).
 *
 *   import { connectionBadge, describeStatus } from './status-ui.js';
 *   settings.append(connectionBadge(room));
 *   console.log(describeStatus(room.status()));   // plain text, no DOM
 */

/** One plain sentence for a room status. */
export function describeStatus(status) {
  const t = status.transports;
  const parts = [];
  const players = status.peers === 1 ? '1 other player' : `${status.peers} other players`;
  if (t.relays) {
    if (t.relays.state === 'unavailable') parts.push('internet: off (needs https)');
    else parts.push(`internet: ${t.relays.open} of ${t.relays.total} relays answering`);
  }
  if (t.server && t.server.state !== 'off') {
    parts.push(t.server.state === 'ready' ? 'local server: connected' : `local server: ${t.server.detail || t.server.state}`);
  }
  if (t.tabs && t.tabs.state === 'ready') parts.push('other tabs: on');
  if (t.pair && t.pair.links) parts.push(`paired devices: ${t.pair.links}`);
  if (t.memory) parts.push('test network');
  return `${players} · ${parts.join(' · ')}`;
}

/** What is likely wrong, in words a player can act on, or null when all is well. */
export function diagnose(status, waitedMs = 0) {
  const t = status.transports;
  if (status.peers > 0) return null;
  if (t.relays && t.relays.state !== 'unavailable' && t.relays.open === 0 && waitedMs > 6000) {
    return 'No relay is answering. This network may block them — try another network, or play offline with a local server or pairing.';
  }
  if (t.relays?.state === 'unavailable' && !t.server?.state?.startsWith('ready')) {
    return 'This page is not https, so the internet relays are off. Open it over https, or use the local server or pairing.';
  }
  if (waitedMs > 90000) {
    return 'Nobody has turned up yet. Check that everyone opened the same link, and that neither network blocks direct connections (see TURN in the README).';
  }
  return null;
}

export function connectionBadge(room, { className = 'p2p-badge' } = {}) {
  const node = document.createElement('p');
  node.className = className;
  node.setAttribute('role', 'status');
  node.setAttribute('aria-live', 'polite');
  const paint = () => { node.textContent = describeStatus(room.status()); };
  paint();
  room.onStatus(paint);
  room.onPeerJoin(paint);
  room.onPeerLeave(paint);
  return node;
}
