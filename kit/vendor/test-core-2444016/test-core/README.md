# test-core in this repository

A pinned copy of [test-core](https://github.com/KakkoiDev/test-core) (the commit is in `MANIFEST.json`). Do not edit
the files under `tools/` and `functional/` here: change test-core, then run its `adopt/adopt.py THIS_REPO --update`.
`README.md`, `vocabulary.json` and `scenarios-template.md` are this project's.

## What is here
- `functional/`: primitives -> blocks -> scenarios. Python: put `test-core` on the path (pytest:
  `pythonpath = ["test-core"]`) and `from functional import Registry, scenario_tests`. JavaScript:
  `import { Registry, loadScenarios, runScenario } from '<path>/test-core/functional/js/index.js'`.
  Read `functional/README.md`.
- `functional/blocks/`: test blocks generated from Pi Workbench's App Blocks (LogIn, DataTable, EditForm, EmptyState,
  Toasts, KpiTile, BarChart, SidePanel): their steps, a page object each, their states and a self-test.
- `tools/`: `vocab.py` (scenarios use known steps), `scenarios.py` (each scenario has its test), `e2e_coverage.py`
  (every control has an e2e step; a removed control fails its test), `flaky_lint.py` (no fixed waits),
  `blocks_from_app_blocks.py` (regenerate the blocks from a Pi Workbench folder).
- `.github/workflows/test-core.yml`: runs those checks; set its `env` block to this repository's folders.

## Writing a task's scenarios
Copy `scenarios-template.md` into the task. Headings are `### <ID> <title>` (story id, or `US-new`; `### Scenario:
<title>` also works). Use only known steps; add a new phrase to `vocabulary.json` first, then give it a function per
level in your step registry. Check: `python3 test-core/tools/vocab.py check TASK.md --vocab test-core/vocabulary.json
test-core/functional/blocks/vocabulary.json`.

## Rules (test-core's AGENTS.md)
Arrange/Act/Assert; red before green; wait for the state, never for time; tests never reach the network; every
Chromium launch passes `--use-mock-keychain --password-store=basic`.
