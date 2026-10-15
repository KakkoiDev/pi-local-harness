# 199: The kit: pinned libraries with their agent cards, the toolchain's pins

Kind: code

Plan 198, phase 0. Request 2026-10-15: "premade tools and techniques so it doesn't have to figure them out, and reuse
those libs and others … the core libs packaged directly in the harness … uv and other utils packaged in it."
Decisions: pyright for Python types; downloads approved; the recommended order (kit and starter first).

- [x] `kit/vendor/`: htmx 4.0.0 (0BSD; with its own agent guides and its Python upgrade checker), Basecoat 1.0.2 (MIT;
  the full CSS tree, its scripts and Jinja macros), p2p-core 0.1.0 (MIT; its AGENTS.md is its card), LittleJS 1.27.0
  (MIT; the minified ES module and its types). `kit/libraries.json` with versions, licences, sources and checksums;
  `kit/THIRD_PARTY_NOTICES.md`.
- [x] Cards: htmx (the lines that are almost always right; the htmx 4 rules), Basecoat, LittleJS (points to LittleJS-AI).
- [x] `kit/toolchain.json`: uv, Python 3.12, pyright through uv with Node as a Python package. Measured on this machine:
  pyright 0.56 s on Node and 1.44 s on Bun; TypeScript's checker 0.07 s on Node, 0.04 s on Bun, 0.07 s native (tsgo):
  Bun is not needed.
- [x] Red (python, `tests/test_kit.py`): every library matches its checksum, has its licence and notice and a card; the
  Basecoat card names only Basecoat's classes (the first draft had a `.form` class that does not exist); the htmx card's
  examples use only attributes htmx 4 has.
