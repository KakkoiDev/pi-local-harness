# Third-party notices

Everything under `vendor/` is a pinned, unmodified copy, committed so that nothing is fetched at
runtime and no build step is needed.

| Path | What | Version | Licence |
|---|---|---|---|
| `vendor/trystero/` | [trystero](https://github.com/dmotz/trystero) nostr strategy, the esm.sh browser bundle | 0.21.5 | MIT, © Dan Motzenbecker — `vendor/trystero/LICENSE` |
| `vendor/trystero/nostr.js` (bundled inside) | [@noble/secp256k1](https://github.com/paulmillr/noble-secp256k1) | 1.7 | MIT, © Paul Miller |
| `vendor/qrcode-generator/qrcode.mjs` | [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) | 2.0.4 | MIT, © Kazuhiko Arase (licence in the file header) |
| `vendor/jsqr/jsQR.js` | [jsQR](https://github.com/cozmo/jsQR), loaded only when the browser has no BarcodeDetector | 1.4.0 | Apache-2.0 — `vendor/jsqr/LICENSE` |

"QR Code" is a registered trademark of DENSO WAVE INCORPORATED.

The trystero files are byte-for-byte the copy schness and kakkoi-online shipped (whitespace aside),
so a p2p-core build and a pre-p2p-core build of those apps still find each other.
