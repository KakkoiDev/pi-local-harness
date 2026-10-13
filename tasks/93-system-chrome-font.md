# 93: Chrome uses the system font

Kind: code

Request 2026-10-13: "the font is terribly hard to read"; chose "System font" over pixel-for-titles and larger Pixelify.

- [x] Red: `tests/test_frontend.py` `--font-chrome` starts with `system-ui` and `tokens.css` has no Pixelify; `tests/browser/chat.cjs` the menu bar's computed font starts with `system-ui`.
- [x] `design/tokens.css`: `--font-chrome:system-ui,-apple-system,"Helvetica Neue",sans-serif`; Pixelify `@font-face` removed.
- [x] Removed `fonts/PixelifySans-Variable.woff2`, its licence from `fonts/OFL.txt`, its name from `FONTS`; `fonts/README.md`, `DESIGN.md`, IMPLEMENTATION.md § 2 note the change.
- Not changed: `design/system/` and `design/canvas/` (the handoff as delivered) still show Pixelify.
