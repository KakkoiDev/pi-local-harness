# 205: The starter for an app with no server, and Basecoat 1.0's variants taught right

Kind: code

Plan 198, "Apps with no server at all". Decisions 2026-10-15: "ok for the type comments", "go for it".

- [x] `kit/starter-static/`: the same notes app, browser only: `index.html` with Basecoat, `js/logic/notes.mjs` (pure
  functions), `js/store.mjs` (IndexedDB; a backup is a file: Save a Backup, Restore a Backup…), `js/i18n.mjs` with
  `messages/en.json` and `ja.json`, `js/app.mjs` (the page), a service worker that keeps the whole app offline, the
  manifest; JSDoc types checked by TypeScript 7 in strict mode; tests with `node --test`. Only uv is needed:
  `uvx --from nodejs-wheel-binaries==24.19.0 npx --yes -p typescript@7.0.2 tsc -p .` (0.4 s) and `… node --test`.
- [x] `kit/new_project.py --static`; the Preview builds a no-server app's styles too, then serves its files.
- [x] Tests (python, `tests/test_starter.py`): the project is whole, strict `checkJs`, no htmx; the logic touches no DOM,
  storage, clock or randomness; both languages have the same keys; `PI_KIT_HEAVY=1` runs its types and tests through uv.
  (python, `tests/test_preview.py`): the styles are built before the files are served.
- [x] Found in the browser: **Basecoat 1.0 writes variants as attributes** (`class="btn" data-variant="outline"`); the
  pre-1.0 classes (btn-outline, btn-ghost) live only in its legacy layer, which projects do not load, so the buttons
  rendered as plain text in both starters. The kit's card taught the old classes, and its test passed because it
  searched every CSS file, legacy included. Fixed: the card (rule 2: variants and sizes are attributes), its test now
  reads only what `basecoat.css` imports and checks each `data-variant` exists, and both starters. The later "Basecoat
  class check after every edit" must use the same loaded stylesheet.
- [x] Found in the browser: an error message stayed in English after switching to Japanese; problems are kept and
  translated again with the page.
- [x] Opened in the browser: add, reload (kept), the empty-title message, Japanese, the outlined buttons. The service
  worker registers in headless Chromium (the app's built-in pane does not support service workers).
- [x] Found by the course's writer: a new project had no repository, so the harness's first commit would fail.
  `new_project.py` now starts it with `git init -b main` and a first commit ("Start from the Pi Workbench starter");
  tested. And the Basecoat card now says the project's own rules go at the end of `styles/input.css` (`static/app.css`
  is the build's output).
