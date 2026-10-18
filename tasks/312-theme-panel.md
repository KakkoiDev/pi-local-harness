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

## Round 12: rebuilt to the designer's drawing (card ThemePanel; boards R12_ThemeColours, R12_ThemeRadius, R12_ThemeParts, Ph12_Theme, Ph12_ThemePick)

- [x] One card per request, labelled "Pi Workbench · no model", with tabs Colours · Radius · Spacing · Chart (and Fonts,
  not drawn yet: see design/briefs/round-12.md). Unsaved changes stay across tabs; the foot counts them ("1 change not
  saved: Primary · the Preview shows it now") beside Discard and Save Theme.
- [x] Colours: the designer's eight rows (Primary … Border · Input · Ring) with plain names and where they show, light
  and dark, a swatch with "Aa" in its text colour, hex, contrast (never blocking), Reset per row; the first five in the
  chat, then "▸ 3 more". The picker (js/theme-panel.mjs): saturation field, hue strip, hex and the oklch it maps to,
  five recent colours, Esc puts the old value back; Colour · Text on it when the row has a text colour.
- [x] Radius and Spacing: one slider in px (radius 0–24, spacing 3–6 in 0.5 steps; the block gets rem) with samples of
  the derived sizes. Chart: five colours, one value for light and dark, a warning when two are closer than 0.1 in OKLab.
- [x] The Preview's note line "◐ Showing the unsaved theme · Save or Discard in the chat" while anything is unsaved.
- [x] Save Theme: one request; the panel becomes "saved · Open Again" and the chat gets "✓ Theme saved: … ·
  styles/input.css · 14:38" with Undo, whose alert reads in theme words ("Undo the theme save?").
- [x] Leaving unsaved (sending a message, switching chat or project, Close on the phone) asks "Save the theme changes
  before going on?": Don't Save · Cancel · Save (default). Closing the page with unsaved changes asks the browser's way.
- [x] No theme file: the designer's card; **Add a Theme File** (person route /api/theme/add) writes the starters'
  styles/input.css and Basecoat's CSS (vendor/basecoat) as one undoable commit of the person's ("Theme: added the theme
  file"). A project whose styles/input.css is its own CSS is never overwritten.
- [x] Entry points: the request, Project › Theme… ⌃⌥K, and the Harness notice under Pi's answer ("Open Radius…").
- [x] Phone: full screen (Close · Theme · Light/Dark), the app live on top in its own frame through the Preview's proxy
  ("Live · unsaved"), 56 px rows with 32 px swatches, the picker as its own page (Reset · Done).
- [x] Tests: tests/test_theme.py (groups, Add a Theme File and its Undo), tests/harness/theme.test.mjs (HSV, oklch,
  distance), stories US-116 (updated: picker, Esc, drag, Save Theme, Undo in theme words), US-117 (⌃⌥K, the no-file
  card), US-118 (3 more, tabs, samples, chart warning), US-119 (Don't Save · Cancel · Save), US-120 (Add a Theme File),
  US-121 (phone full screen).

Decision (round 12): the theme stays the marked block in `styles/input.css` rather than the drawing's separate
`app/static/theme.css`. The starters' Tailwind build already compiles input.css (harness/preview.py), the block keeps
the person's own rules untouched and is read back exactly, Pi's context note and kit/cards/basecoat.md already point at
it, and a separate file would add an @import and a migration for no gain the person would see. The panel shows the
real path.
