# 312: Tinker with the site's look in the chat (theme panel)

Kind: code

The person (2026-10-18): "I want to adjust the sites colors" → "Here are the color values" → a panel with the colour
names (primary, secondary…) and a colour picker that changes the Preview in real time; the same for the radius, and so on.

System 1 does this end to end (CONSTITUTION.md): code, or Laya when code is unsure, recognises the request and opens the
panel; Pi is not called, no model writes CSS, nothing waits on a model.

## Facts the design rests on

- The starters (kit/starter, kit/starter-static) use Tailwind v4: no `tailwind.config.js`; the theme is CSS. Basecoat
  defines every token as a CSS variable on `:root` and `html.dark` (kit/vendor/basecoat-1.0.2/css/base/base.css:
  `--primary`, `--primary-foreground`, `--secondary`, `--accent`, `--muted`, `--destructive`, `--background`,
  `--foreground`, `--card`, `--border`, `--input`, `--ring`, `--chart-1..5`, `--sidebar-*`, `--radius`), mapped into
  Tailwind by `@theme inline`. Spacing is Tailwind's `--spacing` (one base unit).
- So a live change needs no rebuild: setting the variable on the Preview's root restyles the page at once. Saving writes
  one block to the project's `styles/input.css`, which the Preview's Tailwind watch already rebuilds.

## Work

- [x] **The theme file:** one marked block in `styles/input.css` after the imports (`/* theme: edited in the workbench */
  :root { … } html.dark { … }`), holding only changed tokens. A reader/writer that parses Basecoat's defaults plus this
  block, keeps everything else in the file untouched, and refuses (with a plain message) a file it cannot parse.
- [x] **Groups:** colours (light and dark side by side, each token with its foreground pair and a contrast check: AA
  pass/fail shown, never blocking), radius (one slider, with the derived sm/md/lg/xl shown), spacing (the base unit),
  fonts (later; needs the font decision), charts (the five chart colours). One group per panel.
- [x] **Recognising the request (System 1):** a fixed phrase list in English and Japanese (colours/色, radius/角丸,
  spacing/余白, theme/テーマ…) answered by code; uncertain matches go to Laya as a "theme panel?" judgement; if Laya
  abstains, the normal path (Pi) runs, with a "Open the theme panel" suggestion. Also a menu entry (Project › Theme…) and
  `/theme` in terminal Pi (prints the tokens and the file path; the panel is browser-only).
- [x] **Live preview:** the Preview frame is another origin (task 304 hardens it), so the Preview server injects a tiny
  same-file helper that accepts only `postMessage` from the workbench origin with `{token, value}` for names in the
  allow-list and sets them on `document.documentElement`; nothing else. Changes apply as the picker moves; light/dark
  toggle in the panel follows the Preview's.
- [x] **Save / Reset / Undo:** Save writes the block and commits it as the person's own change ("Theme: primary, radius"),
  undoable with the existing Undo; Reset returns a token to Basecoat's default; closing without Save restores the Preview.
  A person's edit, so allowed in every phase (phases limit Pi, not the person); never done by Pi or Run on its own.
- [x] **Pi knows:** after a save, Pi's context says the theme tokens changed and that styles use the tokens
  (`bg-primary`, `rounded-lg`), never hard-coded colours; the starter cards say so too, so Pi's later pages follow the theme.
- [x] **Projects without the starter's CSS:** the panel says "This project has no theme file" and offers nothing else
  (no guessing at arbitrary CSS).
- [x] Tests: the reader/writer round-trips and leaves other lines alone; the helper refuses other origins and unknown
  tokens; a browser story: "I want to adjust the site's colours" opens the panel without a Pi request, a picker change
  restyles the Preview, Save commits, Undo restores; the same in Japanese.

Design: designer round 12 part D (the panel, desk and phone, English and Japanese).

## Decisions

- 2026-10-18, built before the designer's drawings (the person asked), in the existing 1-bit parts: the panel is a
  `pw-card` with `.pw-theme__*` classes (chat.css), so round 12 part D can restyle it without touching the code.
- Fonts (the person): every Google Fonts family, from Google's public metadata cached in `<data>/cache` (refreshed at
  most daily, offline from the cache). The panel's sample may load a font from Google for the person's eyes; the app
  never does: Save downloads the woff2 files (400 and 700) and the licence into `static/fonts/<family>/` and writes
  `@font-face` into the block (harness/theme_fonts.py). The Preview cannot show an unsaved font the Mac lacks.
- Live link: the Preview frame now loads the app through a small proxy (harness/preview.py `Frame`) that adds
  `harness/theme-helper.js` to its HTML pages; Open on Phone and terminal apps still use the app itself.
- The block ends with `/* theme: end */`, so the reader knows where it stops. Undo takes back a person's commit only
  when it is a theme save (title `Theme: …` and the `Workbench-Change: theme` trailer).
