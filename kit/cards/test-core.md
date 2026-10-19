# The test protocol, for Pi (the card: test-core)

Every project from the kit has the same protocol (test-core, MIT, pinned in the kit and copied into the project's
`test-core/` by its adopt kit; never edit it: `python3 test-core/adopt.py --verify test-core` checks every file).
The workbench gives the basics; you keep them true.

- **`SCENARIOS.md`** lists what the app does: `### Scenario: <title>`, then `- Given …`, `- When …`, `- Then …`
  (`- And …` continues). When your task has scenarios, add them here word for word under the feature's `## ` heading.
  Removing a feature removes its scenarios and its tests together, and you say so.
- **One e2e test per scenario, named after its title.** Web app: `tests/e2e/test_<feature>_e2e.py`,
  `def test_<title in snake case>(base, page):`. No server: `tests/e2e/<feature>.e2e.test.mjs`,
  `test('<title>', { skip }, …)`. Terminal app: a Textual pilot test in `tests/test_tui.py`.
- **The browser is decided in one helper**: `tests/e2e/conftest.py` (fixtures `base`, `page`, `serve`,
  `a11y_problems`) or `tests/e2e/browser.mjs` (`serve`, `startBrowser`, `newPage`, `open`, `a11yProblems`). Use it;
  never launch or download a browser yourself. Without a browser the tests are skipped and say why.
- **The checks** run with the base check and the project's tests (`tests/test_protocol.py`, `tests/protocol.test.mjs`):
  `scenarios.py check SCENARIOS.md --tests <e2e tests>` (each scenario has its test); `e2e_coverage.py` (every button,
  link and field on the pages has an e2e step; no test names a control that is gone); `flaky_lint.py tests` (no sleep
  or fixed timeout, no `.only`, no `networkidle`, no real host). A failure names what to add or remove.
- **Each test**: Given arranges, When acts as the person does, Then checks what the person sees. Find controls by role
  and label (`get_by_role("button", name="Add Note")`, `getByLabel('New note')`). Wait for state, never for time.
  The app with no server sets `<body data-ready="true">` when it can take a click: keep that line, its tests wait for it.
- **Test blocks**: `test-core/functional/` composes primitives into blocks into scenarios. Where a page uses an App
  Block, use its generated test block instead of re-finding its controls: LogIn, DataTable, EditForm, EmptyState,
  Toasts, KpiTile, BarChart, SidePanel (Python `from functional.blocks.python.edit_form import EditForm`, pytest has
  `test-core` on its path; JavaScript `import { EditForm } from '../../test-core/functional/blocks/js/EditForm.js'`).
  Their steps are a fixed vocabulary (`test-core/functional/blocks/vocabulary.json`); the starters' empty-note test
  uses EditForm.
- **Accessibility**: one test per page runs test-core's smoke check (`a11y_problems(page)`, `a11yProblems(page)`) and
  expects `[]`: every control named, every field labelled, one `<h1>`, `lang` set, no positive tabindex, unique ids.
- **Offline**: tests serve the app on 127.0.0.1 and every other host is refused; build `static/app.css` before the
  e2e tests (the service worker caches it).

The recipes these files follow: test-core's scenario-e2e, scenario-steps, a11y-smoke, flaky-rules, offline-phone and
fixtures (`kit/vendor/test-core-2444016/recipes/`, Python and JavaScript).
