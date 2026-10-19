# 330: The harness's own development uses the testing protocols it gives the apps Pi builds

Kind: code
No scenarios: only the repository's own checks, task files and contributor docs change; nothing the person sees or types in the workbench or terminal Pi changes.

Request 2026-10-19: “I want that all the testing protocols we are setting up for the harness, be used in the harness
development method as well. Dogfeeding the technique.”

Plan: [328, test-core](../docs/plans/328-test-core.md); builds on [task 329](329-task-scenarios-become-e2e-tests.md)
(gate/scenarios.py, gate/controls.py) and test-core's tools (PR #1: e2e_coverage.py, scenarios.py, flaky_lint.py; MIT,
same author). The checks live in tests/dogfood.py and run in tests/verify_workflow.py.

- [x] Red (unit): tests/test_dogfood.py fails on a fixture that breaks each rule: a code task from 330 on without
  `## Scenarios`; a scenario without a story id, with a missing story, with other words than its story, missing a step;
  `US-new` in a done task; a new control without an e2e step; a control removed while a test uses it (static and
  rendered); a baseline entry that got its step; a removed control with its test listed as "Removed"; a new flaky wait;
  a fixed flaky wait still in the baseline; verify_workflow failing on a task without scenarios.
- [x] Scenario ↔ story check: the heading is the story's id and title word for word (`### US-NNN <title>`, stories in
  tests/browser/*.cjs `story('US-NNN', …)` and tests/harness/*.test.mjs `test('US-NNN …')`; template titles match any
  words in the `${…}` place); `US-new` while the story is not written, refused once the task is done; `No scenarios:
  <reason>` for a code task that changes nothing the person sees or types. Required from task 330; older tasks checked
  when they have scenarios.
- [x] Control coverage of the workbench's own UI: index.html (gate/controls.py's parser, plus data-command) and the
  buttons and links js/*.mjs renders with literal names, against tests/browser/*.cjs (`#id`, data-command, getByRole,
  getByLabel, getByText, has-text). Baseline tests/baselines/workbench-controls.txt (146 uncovered controls, 17 names
  tests use that the UI does not have: absence checks and elements a test injects); it only shrinks.
- [x] Flaky rules over tests/browser/*.cjs (after test-core's flaky_lint.py; a timer counts only when used as a sleep):
  baseline tests/baselines/flaky-browser.txt (32 hits); new ones fail; `/* flaky-lint: allow <reason> */` keeps one.
- [x] Cheap flaky fixes: US-122 waits for the Laya notice itself (not whichever notice is last); chat.cjs's ⌘K check
  waits for the focus and presses again if the reloaded page was not listening yet; chat.cjs's “a frame for any late
  scroll” waits two animation frames instead of 300 ms.
- [x] Scenarios on the open code tasks (55–329): each has `## Scenarios` (US-new, or an existing story's id and title)
  or a `No scenarios:` line. Legacy tasks 14–30 (another project's tasks, no Kind) were left as they are.
- [x] Docs: docs/contributing-for-agents.md § 4 (scenarios first, story per scenario, Red first, control coverage, no
  fixed waits; the template has `## Scenarios`), AGENT.md points to it. harness/AGENTS.md describes Pi's work in the
  person's projects, not this repository's method, so it is unchanged.
- [ ] Growing a baseline needs a `Controls baseline: + …` line in the commit message: documented, not checked by code
  (verify_workflow runs before the commit message exists; a Gate commit rule would be its own task).
- [ ] The remaining 146 uncovered controls and 32 flaky waits are not fixed here: the baselines list them for later tasks.
- [x] Green: python3 tests/verify_workflow.py; tests/browser/run.py all.
