/**
 * What a WebRTC link actually is, read from the connection rather than
 * assumed.
 *
 *   path: 'direct-local'    both ends on the same network (or the same device)
 *         'direct-internet' straight across the internet, through the routers
 *         'relayed'         through a TURN server: a direct link was impossible
 *         'unknown'         connected, but the browser would not say how
 *   local: true when the link stays inside the local network
 *   rtt:   round-trip time in milliseconds, when the browser measured one
 */
import { isLocalAddress } from './util.js';

export async function classifyConnection(connection) {
  if (!connection?.getStats) return null;
  let stats;
  try { stats = await connection.getStats(); } catch { return null; }
  let pair = null;
  const byId = new Map();
  stats.forEach((report) => {
    byId.set(report.id, report);
    if (report.type === 'transport' && report.selectedCandidatePairId) {
      pair = { selectedId: report.selectedCandidatePairId, ...(pair || {}) };
    }
  });
  let selected = pair?.selectedId ? byId.get(pair.selectedId) : null;
  if (!selected) {
    stats.forEach((report) => {
      if (report.type !== 'candidate-pair') return;
      if (report.selected || (report.state === 'succeeded' && report.nominated)) selected = report;
    });
  }
  if (!selected) return { path: 'unknown', local: null, rtt: null };
  const local = byId.get(selected.localCandidateId);
  const remote = byId.get(selected.remoteCandidateId);
  const rtt = Number.isFinite(selected.currentRoundTripTime)
    ? Math.round(selected.currentRoundTripTime * 1000) : null;
  return { ...classifyCandidates(local, remote), rtt };
}

/** Pure decision, split out so it can be tested without a browser. */
export function classifyCandidates(local, remote) {
  const types = [local?.candidateType, remote?.candidateType];
  if (types.includes('relay')) return { path: 'relayed', local: false };
  const address = (c) => c?.address || c?.ip || '';
  const remoteAddress = address(remote);
  if (isLocalAddress(remoteAddress)) return { path: 'direct-local', local: true };
  // A host candidate is the peer's own network card. Browsers usually hide its
  // address behind an mDNS name, or report nothing, and those only resolve on
  // the same network.
  if (remote?.candidateType === 'host') {
    if (!remoteAddress) return { path: 'direct-local', local: true };
    // A public address on a network card: both ends on one machine, or on one
    // subnet of a network that hands out public addresses (some campuses and
    // clouds do) is still the same network. Anything else is the internet.
    if (local?.candidateType === 'host' && sameSubnet(address(local), remoteAddress)) {
      return { path: 'direct-local', local: true };
    }
    return { path: 'direct-internet', local: false };
  }
  if (remote?.candidateType === 'srflx' || (remoteAddress && !isLocalAddress(remoteAddress))) {
    return { path: 'direct-internet', local: false };
  }
  return { path: 'unknown', local: null };
}

/** Same IPv4 /24 or IPv6 /64. Deliberately narrow: a wrong "same network" lets a stranger in. */
export function sameSubnet(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;
  const v4 = /^(\d+\.\d+\.\d+)\.\d+$/;
  if (v4.test(a) && v4.test(b)) return v4.exec(a)[1] === v4.exec(b)[1];
  if (a.includes(':') && b.includes(':')) {
    const prefix = (x) => x.toLowerCase().split(':').slice(0, 4).join(':');
    return !a.includes('::') && !b.includes('::') && prefix(a) === prefix(b);
  }
  return false;
}
