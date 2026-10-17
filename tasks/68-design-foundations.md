# 68: Pi Workbench 1-bit, foundations

Kind: code

Request 2026-10-13: "implement this new design." (handoff zip `pi-workbench-handoff.zip`) and "and keep design system and all explainations in the repo."

Build step 1 of [design/IMPLEMENTATION.md](../design/IMPLEMENTATION.md) § 12. No visual change.

- [x] Design sources in the repo: `design/` (tokens, components, icons, layout, reference markup, IMPLEMENTATION.md), `design/system/` (design system export), `design/canvas/` (artboards), `design/README.md` (map of all of it), `DESIGN.md` replaced by the handoff's rules.
- [x] Red: `tests/test_web_robustness.py::test_design_files_and_fonts_are_served_with_their_types`, 404 before the allowlist change.
- [x] Red: `tests/test_plh.py` install test asserts `design/` and `fonts/` are copied.
- [x] `harness/web_chat.py`: allowlist `/design/tokens.css`, `/design/components.css`, `/js/icons.mjs` (2026-10-13, task 69: replaced by `/design/icons.mjs`) and the five `/fonts/*.woff2` (`FONTS`); `mimetypes.add_type('font/woff2','.woff2')` (Python 3.14 here already knows it; kept for older Pythons the handoff warns about, so reverting it does not fail the test on this machine).
- [x] `harness/install.py` copies `design` and `fonts`.
- [x] `fonts/README.md`: file names, families, sources, licence, fallback behaviour.
- [x] Font files and `fonts/OFL.txt`: need the user's permission to download. Until then the fallback stacks in `tokens.css` apply. 2026-10-13: permission given ("yes"), shipped in task 87.
