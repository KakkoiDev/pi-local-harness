# p2p-core

Multiplayer for browser games with no build step. One `joinRoom()`, and players find each other in
every way available:

| Who | How p2p-core connects them | Needs |
|---|---|---|
| Two tabs of the same browser | `BroadcastChannel` | nothing — works offline |
| Two browsers on one computer, devices on one Wi-Fi, people anywhere | public nostr relays → direct WebRTC ([trystero](https://github.com/dmotz/trystero)) | internet, https or localhost |
| A classroom or LAN party **with no internet** | a laptop running `npx p2p-core serve` | one laptop, one Wi-Fi |
| Two devices with **no server at all** | pairing codes (QR or copy/paste) → direct WebRTC | a shared network or a hotspot |
| Your tests | an in-memory network | Node or a browser |

A peer reachable two ways is one peer; messages take the best way. You can turn each kind of
player on or off (`allow`), and choose which ways run (`mode`).

It is plain ES modules. No bundler, no npm dependency at runtime. trystero (nostr) is vendored
inside and pinned.

```js
import { joinRoom } from './vendor/p2p-core/p2p-core.js';

const room = joinRoom({ app: 'my-game' });

room.onPeerJoin((id, peer) => console.log(peer.profile?.name ?? id, 'joined'));
room.onPeerLeave((id) => console.log(id, 'left'));
room.onMessage('move', (data, from) => moveOther(from, data));

room.send('move', { x: 10, y: 20 });          // everyone
room.send('chat', 'hi', someId);              // one peer
```

Open the page in two tabs: they see each other. Open it on a phone: it sees them too.

---

## Install

There is no npm account; releases are git tags, installed by URL.

**For a no-build app that commits its dependencies** (recommended):

```sh
npm i -D github:KakkoiDev/p2p-core#v0.1.0
npx p2p-core vendor              # copies the browser files to vendor/p2p-core/
```

```js
import { joinRoom } from './vendor/p2p-core/p2p-core.js';
```

Re-run `npx p2p-core vendor` after upgrading. Commit `vendor/p2p-core/`.

**Straight from a CDN** (no install; jsDelivr serves GitHub tags):

```js
import { joinRoom } from 'https://cdn.jsdelivr.net/gh/KakkoiDev/p2p-core@v0.1.0/p2p-core.js';
```

**As a tarball URL** (for tools that dislike `github:`):

```sh
npm i https://github.com/KakkoiDev/p2p-core/archive/refs/tags/v0.1.0.tar.gz
```

Always pin a tag. `#main` moves.

---

## Modes and who may join

```js
joinRoom({
  app: 'my-game',
  room: 'lobby',               // default 'lobby'
  mode: 'auto',                // default
  allow: { sameBrowser: true, sameNetwork: true, otherNetworks: true },   // default
});
```

`mode` picks which ways of connecting run:

| mode | other tabs | internet relays | local server | pairing codes |
|---|---|---|---|---|
| `auto` (default) | ✓ | ✓ | if this page was served by one | ✓ |
| `online` | ✓ | ✓ | – | ✓ |
| `offline` | ✓ | – | if this page was served by one | ✓ |
| `tabs` | ✓ | – | – | – |

`server: 'http://192.168.1.20:8787'` forces a local server in any mode; `server: false` turns it
off. `transports: { relays: false }` (etc.) overrides one transport.

`allow` says which players are accepted, whatever carried them:

| allow | means | how it is decided |
|---|---|---|
| `sameBrowser` | other tabs/windows of this browser | they are on the tab channel. When `false`, tabs of one browser ignore each other on **every** transport. |
| `sameNetwork` | other browsers on this computer, other devices on this network | local-server peers count as this. Over WebRTC: the link's address is private, link-local, mDNS, or on our subnet. |
| `otherNetworks` | anyone else | a WebRTC link through a public address or a TURN server |

Turning both `sameNetwork` and `otherNetworks` off leaves only tabs. Turning one off keeps the
transports running and refuses peers of the other kind after looking at the actual connection.
When the browser will not say what a link is, it counts as `sameNetwork` (refusing a classmate is
the worse mistake). "Same device, different browser" is part of `sameNetwork`: browsers hide enough
of their addresses that it cannot be told apart reliably.

---

## No internet

### A local server (classrooms, LAN parties)

On any laptop on the Wi-Fi, in the game's folder:

```sh
npx p2p-core serve .            # or: npx p2p-core serve path/to/game --port 8787
```

It prints the address and a QR code. Everyone opens that address. A game in mode `auto` or
`offline` notices it was served by p2p-core and connects through it. No configuration.

- Node 20+ on the laptop, nothing else. The server has no dependencies.
- The page is plain `http://`. That is fine for the server transport, but the internet relays and
  the camera need https, so those switch themselves off. Service workers will not register either.
- Messages pass through the laptop. WebRTC links are end-to-end encrypted; this one is not.
  Someone running the server can read the game's messages.
- The library is also served at `/__p2p-core/lib/p2p-core.js`, for quick experiments.

### Pairing codes (no server at all)

```js
import { openPairing } from './vendor/p2p-core/extras/pairing-ui.js';
button.onclick = () => openPairing(room);
```

A ready-made dialog: one device invites (shows a QR code), the other scans it and shows an
answer, the first scans that. Copy and paste works everywhere the camera does not (plain http, no
camera, desktop). The devices then talk directly over WebRTC.

To build your own UI:

```js
const invite = await room.pair.invite();        // on device A
show(invite.code);
const answer = await room.pair.accept(code);    // on device B
show(answer.code);
await invite.finish(answerCode);                // on device A — connected
```

For more than two, **let one person invite everyone**. Every device passes messages on, so all
see all; if the inviter leaves, the others lose each other. Codes carry STUN servers, so a code
sent over a chat app usually works across the internet too.

---

## TURN, and networks that block direct links

WebRTC tries to connect devices **directly**. A free STUN server tells each device its public
address so the two can reach each other through their routers. That works for most home Wi-Fi.
Some networks forbid it, such as mobile carriers, offices and school firewalls. Two players on
networks like that can wait forever.

A **TURN** server relays the traffic when a direct link is impossible. Data stays end-to-end
encrypted through it. It costs bandwidth, so it is never free at scale: Cloudflare and Metered
offer hosted TURN, or run `coturn` on a small server.

```js
joinRoom({
  app: 'my-game',
  turn: [{ urls: 'turn:turn.example.com:3478', username: 'user', credential: 'pass' }],
});
```

Anyone can read credentials in a web page; prefer short-lived ones from your provider's API.
`await room.route(id)` tells you how a peer is connected: `direct-local`, `direct-internet`,
`relayed` (through TURN), `local-server`, `same-browser`.

---

## Security options

All optional.

| option | what it does |
|---|---|
| `password: 'secret'` | Changes the room on every transport, so people without it are somewhere else. Over the relays it also encrypts the connection handshake (trystero's password). |
| `protocol: 3` | Your wire-format version. Peers with another version are refused, and `onError` says so. Bump it when you change message shapes. |
| `acceptPeer: (peer) => bool` | Decide who gets in, seeing their `profile`. Async allowed. Refusal is mutual. |
| `maxPeers: 7` | Accept at most this many other players. |
| `validate: { move: (d) => Number.isFinite(d?.x) }` | Drop messages that do not fit. Counted in `room.stats.dropped.invalid`. |
| `rateLimit: 30` | Messages per second accepted from each peer. |
| `maxMessageBytes: 65536` | Largest message accepted, and sent (`send` throws above it). |

Messages from peers who have left, or were refused, are dropped. Everything a peer sends was
written by a computer you do not control: check every field before it becomes game state.

---

## API

### `joinRoom(options) → room`

| option | default | |
|---|---|---|
| `app` | required | your game. Only players of the same app meet. |
| `room` | `'lobby'` | room within the app |
| `mode` | `'auto'` | see Modes |
| `allow` | all true | see Modes |
| `server` | `'auto'` in auto/offline | local server URL, or `false` |
| `relays` | `RELAYS` | nostr relays (shared list; see below) |
| `turn` | `[]` | TURN servers |
| `rtcConfig` | – | extra `RTCPeerConnection` config |
| `profile` | – | anything JSON: sent to every peer, read as `peer.profile` |
| `kinds` | `[]` | message kinds to register at once |
| `network` | – | a `createTestNetwork()`: run in memory |
| `debug` | `false` | log to the console |
| security | – | see above |

`appId` and `roomId` are accepted too, for trystero habits.

### The room

```js
room.selfId                         // this page's id
room.send(kind, data, to?)          // to: id, [ids], or omitted for everyone → Promise
room.onMessage(kind, (data, from, peer) => {})     // → off()
room.onMessage((kind, data, from, peer) => {})     // every kind
room.onPeerJoin((id, peer) => {})   // → off()
room.onPeerLeave((id, peer) => {})
room.onPeerUpdate((id, peer) => {}) // profile or transports changed
room.onRefused((id, reason) => {})
room.onError((error) => {})
room.onStatus((status) => {})
room.onHostChange((hostId) => {})

room.peers()      // [{ id, profile, via: ['tabs', 'relays'], transport: 'tabs', joinedAt }]
room.peer(id)     // one, or null
room.count()
room.hostId()     // lowest id in the room: everyone agrees, no messages needed
room.isHost()
room.setProfile({ name: 'Ann' })

room.status()     // { peers, online, transports: { relays: { open: 6, total: 10, ... }, ... } }
await room.route(id)   // { path, local, rtt, transport }
await room.ping(id)    // ms

room.pair.invite() / room.pair.accept(code)
room.addStream(stream, to?) / room.onPeerStream(fn)   // media: over the relays only
room.leave()
```

Message kinds are 1–12 bytes (a trystero limit) and may not start with `~` (reserved). Data is
anything JSON, or binary (`ArrayBuffer`, typed arrays: they arrive as `Uint8Array`).

**trystero compatibility.** The room also has trystero's shape, so code written for trystero
moves over by changing its import: `makeAction(kind) → [send, onReceive]`, `onPeerJoin`,
`onPeerLeave`, `onPeerStream`, `getPeers()`, `addStream`, `leave`. Unlike trystero,
`onPeerJoin` and friends add a handler rather than replacing the last one.

**Register handlers early.** Over the internet relays a message of a kind this page never
mentioned is dropped by trystero. Call `onMessage(kind, …)` for every kind at startup (or list them
in `kinds`). A message that arrives before its handler is held for 10 seconds and delivered when
the handler appears.

---

## Extras

Optional modules in `extras/`, each usable on its own:

| module | for |
|---|---|
| `matchmaking.js` — `matchmake(room)` | 1-on-1 games: pairs players two by two, private channel with the opponent, "room full" for a third. From schness. |
| `presence.js` — `presence(room, { hz })` | real-time positions: sends only changes (plus keep-alive), draws others smoothly interpolated. From kakkoi-online. |
| `state.js` — `sharedState(room)` | a key/value object everyone sees the same: lobbies, scores, turns. No host. |
| `pairing-ui.js` — `openPairing(room)` | the pairing dialog. Styled by `ui.css`; restyle with `--p2p-*` variables. |
| `status-ui.js` — `connectionBadge(room)`, `describeStatus`, `diagnose` | one line saying who is here and how, and what is likely wrong when nobody is. |
| `qr.js` — `qrSvg`, `scanQr`, `readQrFromImage` | draw and read QR codes. |

```js
import { matchmake } from './vendor/p2p-core/extras/matchmaking.js';
const match = matchmake(joinRoom({ app: 'chess', room: `match-${gameId}` }));
match.onMatch(({ host }) => start(host ? 'white' : 'black'));
match.on('move', apply);
match.send('move', move);
```

`examples/index.html` (a playground with dots, chat and pairing) and `examples/match.html` (rock
paper scissors) use all of it. `npm run serve`, then open `/examples/`.

---

## Testing your game

```js
import { joinRoom, createTestNetwork } from './vendor/p2p-core/p2p-core.js';

const network = createTestNetwork();
const a = joinRoom({ app: 'my-game', network });
const b = joinRoom({ app: 'my-game', network });
await network.settle();                 // joins delivered
a.send('move', { x: 1 });
await network.settle();                 // message delivered
```

Runs in Node or a browser, without relays or timers you did not ask for. Messages go through
JSON as they would on a wire. `network.drop(fn)` loses messages, `network.disconnect(id)` pulls
a cable, and `network.latency = 50` slows everything.

---

## Service workers

Precache the runtime files so the game opens offline:

```sh
npx p2p-core files ./vendor/p2p-core/
```

prints one path per line, without docs, types and the lazily loaded QR scanner. Paste them into
your service worker's list and bump its cache version.

---

## The relay list

`RELAYS` is shared by every p2p-core app, and only ever grows. Two players meet only on a relay
they both dial, and a player on a cached older build still dials the old list: removing an entry
strands them. `test/relays.test.js` enforces it. The one exception is a relay that refuses our
notes: it was never a meeting place, so it moves to `REFUSING_RELAYS` (in `src/relays.js`) with the
evidence, and stops filling every player's console with warnings. Passing your own `relays` is allowed, but then
only players with an overlapping list find you.

trystero opens its relays once per page, with the first room's list. A second room in the same
page with a different list still uses the first.

---

## Limits worth knowing

- The relays need **https or localhost** (nostr signs with `crypto.subtle`). On a plain-http page
  they switch off and say so in `room.status()`.
- **Media streams** go over the relays' WebRTC links only, not tabs, the local server or pairing.
- **`maxPeers` is decided by each side.** With many people arriving at once, two players can
  briefly disagree on who got in. For exactly-two games use `matchmake`.
- WebRTC full mesh is fine for a handful of players and gets heavy beyond about ten, because every
  message goes to every peer. The local server scales further (it is a hub).
- Old browser builds of an app still running pre-p2p-core trystero code interoperate: the
  vendored trystero is the same 0.21.5, and `makeAction` names go on the wire unchanged.

---

## Developing p2p-core

```sh
npm test                  # node --test: unit and transport tests
npm run test:browser      # Chromium: tabs, local server, pairing, trystero over a local nostr relay
npm run serve             # the examples at http://localhost:8787/examples/
```

`npm run test:browser` needs Chromium; set `CHROMIUM=/path/to/chrome` if it is not at
`/opt/pw-browsers/chromium`. In CI it is installed by the workflow.

Releasing: bump `version` in `package.json` and `VERSION` in `src/room.js` (a test checks they
match), add to `CHANGELOG.md`, commit, then tag `vX.Y.Z` and push the tag. That is the release.
