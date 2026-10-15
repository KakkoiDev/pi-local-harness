# p2p-core for coding agents

Read this before writing multiplayer code with p2p-core. README.md is the full manual.

## The five lines that are almost always right

```js
import { joinRoom } from './vendor/p2p-core/p2p-core.js';   // path to wherever it was vendored
const room = joinRoom({ app: 'my-game', profile: { name } });
room.onMessage('move', (data, from) => { /* validate data, then use it */ });
room.onPeerJoin((id, peer) => { /* add player */ });
room.onPeerLeave((id) => { /* remove player */ });
room.send('move', { x, y });                                 // to everyone
```

## Rules

1. **One `joinRoom` per page per room.** Call it once at startup; keep the room. `room.leave()` when done.
2. **Register every `onMessage(kind, …)` at startup**, before peers arrive. Over the internet, a kind
   nobody registered is dropped. (Late handlers still get messages held for 10 s, but do not rely on it.)
3. **Kinds are short strings**: 1–12 bytes, not starting with `~`. `'move'`, `'chat'`, `'state'`.
4. **Data is JSON** (or binary). No functions, no class instances, no `undefined` (send `null`).
5. **Never trust incoming data.** Check every field (`Number.isFinite`, string length, allowed values),
   or pass `validate: { kind: fn }` to `joinRoom`. Drop what does not fit; never throw on it.
6. **Do not send every frame.** 10–20 times a second is plenty for positions; use
   `extras/presence.js`, which also skips unchanged states and smooths movement.
7. **Do not invent a host-election or matchmaking protocol.** Use `room.hostId()` / `room.isHost()`
   (lowest id, agreed by everyone without messages), `extras/matchmaking.js` for 1-on-1, and
   `extras/state.js` for shared key/value state.
8. **Bump `protocol`** (a `joinRoom` option) whenever you change the shape of a message, so old and new
   builds refuse each other cleanly instead of misreading each other.
9. **Do not edit `vendor/p2p-core/`** in an app. Upgrade with `npx p2p-core vendor` after installing a
   new tag. Do not edit the relay list; it is shared and append-only.
10. **Tests use `createTestNetwork()`**, never the real relays: `joinRoom({ app, network })`, then
    `await network.settle()` after anything that sends.

## Recipes

Same browser only (two tabs, offline): `joinRoom({ app, mode: 'tabs' })`

No internet, one laptop on the Wi-Fi: run `npx p2p-core serve <game folder>`, everyone opens the
printed address. The default mode finds the server by itself.

No server at all:
```js
import { openPairing } from './vendor/p2p-core/extras/pairing-ui.js';
pairButton.onclick = () => openPairing(room);   // QR codes + copy/paste fallback
```

Only people on this network: `joinRoom({ app, allow: { otherNetworks: false } })`

Not other tabs of this browser: `joinRoom({ app, allow: { sameBrowser: false } })`

Private room: `joinRoom({ app, room: code, password: secret })`

1-on-1 game:
```js
import { matchmake } from './vendor/p2p-core/extras/matchmaking.js';
const match = matchmake(joinRoom({ app: 'chess', room: `match-${id}` }));
match.onMatch(({ host }) => start(host));      // host: true on exactly one side
match.on('move', apply);                       // only from the opponent
match.send('move', m);                         // only to the opponent
match.onOpponentLeave(showGone);
match.onRoomFull(showFull);
```

Smooth positions:
```js
import { presence } from './vendor/p2p-core/extras/presence.js';
const others = presence(room, { hz: 10, round: true });
others.follow(() => ({ x: me.x, y: me.y }));
// each frame:
for (const { id, state } of others.all()) draw(id, state);
document.addEventListener('visibilitychange', () => (document.hidden ? others.sleep() : others.wake()));
```

Shared state:
```js
import { sharedState } from './vendor/p2p-core/extras/state.js';
const shared = sharedState(room, { initial: { level: 1 } });
shared.onChange(render);
shared.set('level', 2);
```

Show connection status: `settings.append(connectionBadge(room))` from `extras/status-ui.js`.

## When "they can't see each other"

Read `room.status()` (or `describeStatus(room.status())`):

- `relays.open === 0` — the network blocks the relays. Try another network, the local server, or pairing.
- `relays.state === 'unavailable'` — page is plain http. Use https, localhost, the local server, or pairing.
- relays open, still nobody after a minute — different `app`/`room`/`password`/`protocol`, or a network
  that blocks direct links (needs TURN: README → TURN).
- `room.onRefused((id, reason) => …)` names refusals: `version`, `not-allowed`, `full`, `rejected`.
