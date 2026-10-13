# 69: Pi Workbench System 1, tokens, components, icons

Kind: code

Request 2026-10-13: "implement this new design." Build step 2 of [design/IMPLEMENTATION.md](../design/IMPLEMENTATION.md) § 12.

- [x] Red: `tests/harness/icons.test.mjs`: `js/ui.mjs` exports the design system's `icon`, `hydrateIcons`, `stateGlyph`; `stateGlyph('BLOCK')` is a glyph plus the word "Blocked".
- [x] Red: `tests/test_frontend.py`: `index.html` links `tokens.css`, then `components.css`, then `chat.css`.
- [x] `js/ui.mjs`: own icon set removed; re-exports from `../design/icons.mjs`. That relative path resolves in the browser (`/design/icons.mjs`, now allowlisted instead of the `/js/icons.mjs` alias) and in Node (tests), and in the installed package (task 68 copies `design/`).
- [x] `index.html` links the two design stylesheets before `chat.css`, so the old layout still wins until step 3.
- [x] Browser test passes. Interim look: old layout, new icons; `send`, `menu`, `stop`, `chat` icons draw the fallback file glyph until step 3 replaces those buttons with words.
