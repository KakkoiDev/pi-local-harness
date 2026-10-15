# 218: QR codes in the kit and in Pi's knowledge

Kind: code

The person, 2026-10-15: "I want to include an easy QR code generating lib in the harness and agent's knowledge."

- [x] Python: segno 1.6.6 (pure Python, no dependencies; strict pyright passes; SVG, PNG and terminal output), pinned
  in `kit/toolchain.json`. Browser: qrcode-generator 2.0.4 (MIT), the copy the workbench already uses, now in
  `kit/vendor/` with its licence, notice and checksum.
- [x] `kit/cards/qrcode.md`: one way per kind of project (web, terminal, no server), with the rules (no QR web
  service, error correction M, a margin, black on white).
- [x] `harness/guides/qr-code.md`: joins Pi's prompt when a request mentions QR codes (also 「QRコード」).
- [x] Tests: the kit's checksums and licences (`tests/test_kit.py`), the guides' size (`tests/harness/guides.test.mjs`).
