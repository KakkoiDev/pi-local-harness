/**
 * The public nostr relays every p2p-core app dials to find other players.
 *
 * Two players meet only on a relay they both dial, and trystero dials every
 * url in this list (not a sample), so the list is a shared rendezvous rather
 * than a preference. Two rules follow, and both are enforced by
 * `test/relays.test.js`:
 *
 *   1. ONLY EVER ADD. A player running a cached older build still dials the
 *      old list. Removing an entry strands them on a relay newer builds no
 *      longer join. Service workers keep old builds alive for a visit or two.
 *      The one exception is a relay that refuses our notes: it was never a
 *      meeting place, so it moves to REFUSING_RELAYS below, with the evidence.
 *
 *   2. KEEP IT LONG. These are volunteer relays that come and go; matchmaking
 *      survives until the last one stops answering.
 *
 * It is the union of the lists schness and kakkoi-online shipped, which were
 * themselves drawn from trystero's maintained default list. An app can pass
 * its own `relays` to `joinRoom`, but then only players using that same list
 * can find it.
 */
export const RELAYS = Object.freeze([
  'wss://relay.snort.social',
  'wss://nostr.sathoarder.com',
  'wss://nostr.vulpem.com',
  'wss://relay.primal.net',
  'wss://nostr.mom',
  'wss://offchain.pub',
  'wss://eu.purplerelay.com',
  'wss://nostr.data.haus',
  'wss://relay.fountain.fm',
]);

/**
 * Relays that refuse our notes. They carry no rendezvous, so leaving them out
 * strands nobody — the one way an entry may leave RELAYS — and dialling them
 * fills every player's console with trystero's "relay failure" warnings.
 * kakkoi-online's FAILURES.md (2026-08-16) recorded each refusal.
 */
export const REFUSING_RELAYS = Object.freeze([
  'wss://relay.nostromo.social',   // "blocked: not on white-list"
  'wss://nostr.grooveix.com',      // "blocked: only certain pubkeys are allowed to post"
  'wss://relay.nostraddress.com',  // "auth-required: authenticate to publish events"
]);
