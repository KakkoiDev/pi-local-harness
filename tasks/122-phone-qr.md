# 122: The phone address as a QR code at startup

Kind: code

Request 2026-10-13: "in the cli, I want to have a qr code with the tailscale address" (under the `Phone: https://…ts.net` startup line).

- [x] Red (tests/harness/startup-display.test.mjs): after a `Phone:` line, rows of a QR code for that address (half blocks, dark on light, 4-module quiet zone); no QR when the terminal is narrower than it; other lines unchanged.
- [x] `harness/vendor/qrcode.mjs` (qrcode-generator 2.0.4, MIT) vendored unchanged; no npm dependency.
- [x] Decode check: the printed modules decode back to the address with macOS Vision.
- Decoded on this Mac (CIDetector, Swift) back to https://kakkoidevs-mac-mini.tailc6310e.ts.net. Version 4, error correction M: 41 columns with the quiet zone, 21 text rows.
