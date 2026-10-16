# 230: A default test: every file the app refers to exists

Kind: code

The person, 2026-10-16: "the cleanup task should be careful about it. we could add a default test to make sure all
referenced files still exist." In ~/Code/pong, sw.js pre-caches `js/logic/notes.mjs` and the messages by name: delete
them and the offline cache stops installing (Cache.addAll fails on one 404), silently.

## Where
- kit/starter-static/tests/ (node --test), kit/starter/tests/ (unittest/pytest, see the starter), kit/starter-tui/tests/.

## Steps
- [x] static starter: `tests/files.test.mjs`: every path in sw.js's `SHELL` list, every `src`/`href` in index.html
  that is a local path, every icon in manifest.webmanifest, and every `import` path in js/**/*.mjs exists on disk.
  Read the files as text; no browser.
- [x] web starter: the same for templates (`url_for('static', path=…)` / static paths in templates), the manifest, sw.js.
- [x] Red first: run each test against a copy of the starter with one referenced file removed (a fixture in the
  harness's tests/), and see it fail with the missing path in the message.
- [x] The starters' README says what the test protects.
- [x] Green: `python3 -m unittest tests.test_starter tests.test_project_kinds` and the starters' own tests.

## Done when
Removing any referenced file from a new project makes its own tests fail, naming the file.

## Result

Both dependency-free guards name missing files. Harness regressions remove isolated page/template, cache, manifest
and nested-module references; query strings and multiline imports are covered. The terminal starter has no page,
manifest or service worker; its existing tests cover its local resources and all six pass.

Green: starter/project-kind suites (19 tests, three heavy opt-in checks skipped); starters' own suites in scratch
projects (static 6, web 10, terminal 6). Web/terminal dependencies came entirely from the existing uv cache with
`--offline --frozen`; no downloads. Asset guards used a fixture CSS output; styling/build tooling was not changed.
