# Fonts

The workbench ships its three typefaces as local files so it works offline and sends no request outside localhost. `design/tokens.css` loads them with `@font-face`; `harness/web_chat.py` serves exactly these names (the `FONTS` list) with `Content-Type: font/woff2`.

| File | Family | Source |
| --- | --- | --- |
| `PixelifySans-Variable.woff2` | Pixelify Sans, chrome (menus, buttons, labels) | github.com/eifetx/Pixelify-Sans |
| `SourceSerif4-Variable.woff2` | Source Serif 4, text people and Pi write | github.com/adobe-fonts/source-serif |
| `SourceSerif4-Italic-Variable.woff2` | Source Serif 4 Italic | github.com/adobe-fonts/source-serif |
| `IBMPlexMono-Regular.woff2` | IBM Plex Mono 400, commands, code, paths | github.com/IBM/plex |
| `IBMPlexMono-Medium.woff2` | IBM Plex Mono 500 | github.com/IBM/plex |

All three families are SIL Open Font License 1.1; put the licence texts in `OFL.txt` beside them.

While a file is missing the server answers 404 for it and the browser falls back to the stacks in `tokens.css` (Chicago/Charcoal/system-ui, New York/Georgia, Monaco/ui-monospace). Nothing breaks; it only looks less like the design.
