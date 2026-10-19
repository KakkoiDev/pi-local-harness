# 332: Every starter and capability ships the same test protocol (test-core)

Kind: code

Request 2026-10-19: “let's update the *-core libs and the default projects to make sure that they implement the same
e2e tests and functional tests.”

Plan: [328, test-core](../docs/plans/328-test-core.md). Builds on [task 329](329-task-scenarios-become-e2e-tests.md)
(one scenario e2e example per starter, gate/scenarios.py, gate/controls.py) and [task 330](330-dogfood-testing-protocols.md).
Default projects = the three starters (kit/starter, kit/starter-static, kit/starter-tui) and Project Start's
capabilities (kit/capabilities/*). System 1 (the project's own checks, the base check) decides; Pi writes the tests.

- [x] Vendor test-core (MIT, KakkoiDev) at PR #2's commit 24440169d2cdbf3f66415c51eaa9f55105c5df0e (branch
  feat/functional-tests, on top of PR #1; not merged yet; first vendored at PR #1's 9906fb6, switched as the
  coordinator asked) into kit/vendor/test-core-2444016: `test-core/` is exactly what test-core's adopt kit writes
  (`adopt/adopt.py <target> --no-workflow`: the tools, the `functional` library with the test blocks generated from App
  Blocks, MANIFEST.json, adopt.py for `--verify`) plus its LICENSE and the shared a11y check; `recipes/` keeps
  scenario-e2e, scenario-steps, a11y-smoke, flaky-rules, offline-phone and fixtures (Python and JavaScript).
  kit/libraries.json (commit, sha256 of the main file and the manifest, the browser pins), THIRD_PARTY_NOTICES.md,
  card kit/cards/test-core.md. Every new project gets the copy at `test-core/` (pytest `pythonpath = [".",
  "test-core"]`, pyright `extraPaths` in the web and terminal starters).
- [x] Red (unit): tests/test_kit.py (pinned, every file's checksum, the card); tests/test_starter.py ProtocolTest (each
  starter has test-core's files byte for byte, SCENARIOS.md with Given/When/Then and one test per scenario; its protocol
  check is in the base check and passes offline; a scenario without a test, a test naming a removed control, a new
  control without an e2e step and a fixed wait each fail it, naming what is wrong); tests/test_capabilities.py (each
  capability's scenario and one e2e test per package named after it; Add a Capability… appends the scenario and the
  check still passes, Undo takes it back; a project from before the protocol gets the helper and test-core with it);
  tests/test_context.py (a code task brings the card).
- [x] Every starter: SCENARIOS.md (notes: add, delete, an empty note says why, Japanese and back; static: backup and
  restore; web and static: the accessibility smoke check), one e2e test per scenario named after its title (Playwright
  for web and static, Textual's pilot for the terminal app), `test-core/` copied at Create; the empty-note tests use
  test-core's generated EditForm block (the field shows the error: aria-invalid and its description).
- [x] The browser decision in one helper per stack: tests/e2e/conftest.py (web: `base`, `page`, `serve`,
  `a11y_problems`; the server starts on a listening socket, no sleep) and tests/e2e/browser.mjs (static: `serve`,
  `startBrowser`, `newPage`, `open`, `a11yProblems`). Skipped with the reason when no Playwright or browser is set up
  (task 329's rule); every request but 127.0.0.1 refused; Chromium with `--use-mock-keychain --password-store=basic`.
  The static page sets `<body data-ready="true">` when it can take a click (test-core NOTES.md 4).
- [x] The project's own check, in the base check (kit/capabilities.json base_tests), offline and fast:
  tests/test_protocol.py (web, terminal) and tests/protocol.test.mjs (static) run scenarios.py check, e2e_coverage.py
  (web: the templates read with their English texts; static: data-t texts in both languages) and flaky_lint.py.
  The e2e tests themselves never run at Create.
- [x] Every capability: a scenario (kit/capabilities/<id>/scenarios.md, appended to the project's SCENARIOS.md under the
  capability's name) and one e2e test per package (charts, qrcode, install: web and static; offline, multiplayer,
  game: static; database: web (browser) and terminal (pilot), now one folder per package).
- [x] Docs: kit/cards/e2e-scenarios.md, kit/cards/test-core.md (joins every code task's context, harness/context.py),
  the starter READMEs, harness/AGENTS.md, harness/GUIDE.md, kit/README.md, docs/user-stories.md.
- [x] Red (browser): US-340, US-341, US-342 create a project from each starter in Project Start and check its protocol
  files and the protocol check Create ran (uv stubbed); US-343 Add a Capability… brings its scenario and e2e test.
- [x] Every e2e test run for real here: the static and capability tests in headless Chromium (PI_TEST_CHROME), the web
  ones with Python Playwright 1.56.0 from the uv cache, the terminal ones with Textual; strict pyright passes.
- [ ] Task 331 (Create installs packages) is not merged here: the browser decision stays in the two helpers above, so
  it changes one file per stack; the starters' pyproject.toml and uv.lock do not list Playwright yet (re-locking needs
  the network: the person decides when, with the pins in kit/libraries.json).
- [ ] The terminal app has no control coverage (e2e_coverage.py reads HTML pages only): its keys and widgets are reached
  through the scenarios' pilot tests.
- [x] Green: python3 tests/verify_workflow.py; tests/browser/run.py all.

## Scenarios

### US-340 a web app from Project Start has its scenarios, one e2e test each and test-core’s checks; Create runs the checks offline and they pass
Given Project Start with the Web app package and the Database capability
When I create the project
Then SCENARIOS.md, one e2e test per scenario, the browser helper and test-core's tools are in it, and the base check ran the protocol check and it passed

### US-341 an app with no server has its scenarios, one e2e test each and test-core’s checks; Create runs the checks offline and they pass
Given Project Start with the App with no server package and Works offline
When I create the project
Then SCENARIOS.md, one e2e test per scenario, tests/e2e/browser.mjs and test-core's tools are in it, and the base check ran tests/protocol.test.mjs and it passed

### US-342 a terminal app has its scenarios, one pilot test each and test-core’s checks; Create runs the checks offline and they pass
Given Project Start with the Terminal app package
When I create the project
Then SCENARIOS.md, one pilot test per scenario and test-core's tools are in it, and the base check ran the protocol check and it passed

### US-343 Add a Capability… brings its scenario into SCENARIOS.md with its e2e test, and the project’s checks still pass
Given an app with no server
When I add Share by QR code with Add a Capability…
Then its scenario is in SCENARIOS.md under its name, its e2e test is in tests/e2e/, and the base check with the protocol check passed

## For the person

Every new project now comes with a list of what it does (SCENARIOS.md) and one browser test for each item, plus a
check that keeps the list, the tests and the buttons in step. Tried it: all three starters and every capability, with
the browser tests run in a real Chromium.
