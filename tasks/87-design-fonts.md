# 87: Pi Workbench System 1, design fonts

Kind: code

Request 2026-10-13: font downloads approved ("yes"). Spec: [design/IMPLEMENTATION.md](../design/IMPLEMENTATION.md) § 2 "Files to add and wire up" (`fonts/*.woff2`, `fonts/OFL.txt`) and rule 1 "Fonts are local files".

- [x] Red: `tests/test_frontend.py` checks every name in `harness/web_chat.py` `FONTS` is a WOFF2 file in `fonts/` and `OFL.txt` holds the three OFL 1.1 texts; `tests/browser/chat.cjs` checks all five faces load. Both fail without the files.
- [x] `fonts/`: five WOFF2 files and `OFL.txt`, unmodified upstream files pinned to commits in `fonts/README.md`. 880 KB total.
- Browser test at 320/390/768/1440px (touch targets, no sideways scroll) passes with the real fonts.
