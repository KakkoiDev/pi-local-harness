# 229: Starters split into a skeleton to keep and a sample to replace

Kind: code

The person, 2026-10-16: "should we make it clean up the base project then? Or is it useful scaffolding for follow up
requests in case the model is limited in intelligence?" Decided (Claude's recommendation; the person said "go ahead",
2026-10-16): keep the skeleton, replace the sample. The skeleton (storage, i18n, the test setup, service worker, manifest, build
commands, the folder rules) is what helps a small model on every later request. The sample (the notes feature) only
shows the pattern once and then misleads: in ~/Code/pong it stayed as dead code, the app still installs as "Notes",
the README describes a notes app, and messages/*.json hold "Add Note".

## Where
- kit/starter-static/, kit/starter/ (web), kit/starter-tui/; kit/new_project.py (`new_project`).
- New: `kit/starters.json` (or a section in kit/libraries.json): for each starter, the list of sample files and the
  sample's names to rename (manifest name, README title, messages keys prefixed `notes.`).

## Steps
- [x] List, per starter, which files are sample and which are skeleton (static: js/logic/notes.mjs,
  tests/notes.test.mjs, the notes UI in index.html/js/app.mjs, `notes.*` messages, manifest name "Notes", README's
  notes text are sample; js/store.mjs, js/i18n.mjs, sw.js, tests/i18n.test.mjs, tsconfig.json, styles/ are skeleton).
- [x] Red: a test that, after a first request changed the app's main files, a sample file left unchanged is reported.
- [x] The paperwork (gate/paperwork.py, at the end of the first code request in a project made from a starter) checks
  the list: sample files unchanged since the starter commit, and the sample names still in manifest/README/messages.
  If any remain: wake Pi once (like G-012) with the list and the instruction: "This project started from the sample
  notes app. Replace or remove what the new app does not use: <files>. Keep the skeleton (<files>). Update sw.js's file
  list, the manifest's name and the README to the new app."
- [x] harness/AGENTS.md and the starter README: one paragraph saying the same, so Pi knows before it starts.
- [x] Green.

## Done when
A first request that turns the starter into another app leaves no notes file, no "Notes" name and no notes text, and
keeps the skeleton working (its tests pass).

## Result

`kit/starters.json` distinguishes sample files and names from skeleton infrastructure for all three starters.
The first code request compares samples to the original starter commit, reports unchanged samples and remaining
notes names once, and keeps the same request open for cleanup. Documentation requests do not consume this check;
a stopped request never queues another turn. Storage infrastructure stays, with domain-specific parts adapted.

Green: paperwork/Gate/services/starter/project-kind suites (51 tests, three optional heavy checks skipped), 103 Node
tests, both browser suites. Installed-copy coverage requires the registry. No real project or model was used.
