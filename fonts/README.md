# Fonts

The workbench ships its three typefaces as local files so it works offline and sends no request outside localhost. `design/tokens.css` loads them with `@font-face`; `harness/web_chat.py` serves exactly these names (the `FONTS` list) with `Content-Type: font/woff2`.

| File | Family | Source |
| --- | --- | --- |
| `PixelifySans-Variable.woff2` | Pixelify Sans, chrome (menus, buttons, labels) | github.com/eifetx/Pixelify-Sans |
| `SourceSerif4-Variable.woff2` | Source Serif 4, text people and Pi write | github.com/adobe-fonts/source-serif |
| `SourceSerif4-Italic-Variable.woff2` | Source Serif 4 Italic | github.com/adobe-fonts/source-serif |
| `IBMPlexMono-Regular.woff2` | IBM Plex Mono 400, commands, code, paths | github.com/IBM/plex |
| `IBMPlexMono-Medium.woff2` | IBM Plex Mono 500 | github.com/IBM/plex |

All three families are SIL Open Font License 1.1; `OFL.txt` holds the three licence texts.

Fetched 2026-10-13, unmodified, from these commits:

- Pixelify Sans: `eifetx/Pixelify-Sans@39df74a` `fonts/webfonts/PixelifySans[wght].woff2`, `OFL.txt`
- Source Serif 4: `adobe-fonts/source-serif@80d3f88` `WOFF2/VAR/SourceSerif4Variable-Roman.ttf.woff2`, `WOFF2/VAR/SourceSerif4Variable-Italic.ttf.woff2`, `LICENSE.md`
- IBM Plex Mono: `IBM/plex@763c36e` `packages/plex-mono/fonts/complete/woff2/IBMPlexMono-{Regular,Medium}.woff2`, `packages/plex-mono/LICENSE.txt`

`tests/test_frontend.py` checks every name in `FONTS` is a WOFF2 file here; the browser test checks all five faces load.

While a file is missing the server answers 404 for it and the browser falls back to the stacks in `tokens.css` (Chicago/Charcoal/system-ui, New York/Georgia, Monaco/ui-monospace). Nothing breaks; it only looks less like the design.
