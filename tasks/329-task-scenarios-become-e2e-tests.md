# 329: Every task has its scenarios, and each scenario becomes an e2e test

Kind: code

Request 2026-10-19: “I would like each task to have that type of user story [Given–When–Then] and then have the system
2 build that as an e2e test.” And earlier: “the tests must always include an E2E test… even dumb agents would notice
when they remove features. And be forced to knowingly remove the E2E test attached to… a button it removed.”

Plan: [328, test-core](../docs/plans/328-test-core.md) (“The E2E rule for generated apps” and “Every task has its
scenarios”). Delivers part of [task 295](295-build-repair-loop-and-success-criteria.md) (executable success criteria).
System 1 decides and checks; the model writes the scenarios and the tests.

- [x] Red (unit): the scenario format, clean and parse (tests/test_scenarios.py FormatTest).
- [x] Red (unit): test names and results from node spec/TAP, Playwright's list reporter, pytest -v and unittest -v; a
  test name matches its scenario title by words (RunnerNamesTest).
- [x] Red (unit): propose_plan writes `## Scenarios` after the steps and the plan card returns them; a code task that
  changes a page without a scenario is refused (PlanScenariosTest).
- [x] Red (unit): the scenario-test check: missing, not run, failed, skipped, passed only before the last change, passed
  on the final code (CheckTest, PlanScenariosTest).
- [x] Red (unit): the control checker: controls in Jinja templates (names from `t("key")` and messages/en.json) and static
  HTML; the tests that use them (Playwright JS and Python, `#id`); a control removed while a test uses it, removed with
  its test, a new control without an e2e step, a project without e2e tests (tests/test_e2e_controls.py, ControlRuleTest).
- [x] propose_plan's task schema has `scenarios: [{title, given, when, then}]` (harness/planning.mjs); the tool-call
  repair knows `user_stories`/`stories` → `scenarios` and `name` → `title` (harness/tool_repair.py).
- [x] gate/scenarios.py: clean, needed, section, parse, results, defined, check; the task file's fixed format.
- [x] gate/controls.py: the deterministic control index and the end-of-request rule (HEAD → working tree).
- [x] Paperwork: a test run's names are kept with the code state (Gate passes the output); before "verified" every
  scenario's test passed on the final code and the control rule holds; else "not verified" naming the scenario, the test
  or the control; "Removed: …" goes on the check-in (verified or not). Red and Green rules unchanged.
- [x] The plan card (web and terminal) shows each task's scenarios; the check-in shows "Removed"; designer note in
  design/briefs/round-13.md; Japanese strings in messages/ja.json.
- [x] The recipe card kit/cards/e2e-scenarios.md joins the context of a code task with scenarios (harness/context.py).
- [x] Starters: kit/starter and kit/starter-static ship one e2e example named after its scenario (offline; skipped with
  the reason when no Playwright or browser is set up; Chromium with `--use-mock-keychain --password-store=basic`); the
  base check never runs it, so Create downloads nothing; listed as sample files.
- [x] Red (browser): US-280 the plan card shows scenarios; US-281 a missing scenario test ends not verified naming it;
  US-282 removing a button and its test shows "Removed: …" on the check-in.
- [x] Docs: harness/GUIDE.md, harness/guides/planning.md, harness/AGENTS.md, kit/README.md, docs/user-stories.md.
- [ ] The terminal app's controls (Textual widgets in app/tui.py) are not in the control index yet: it covers the
  starters' web stack (Jinja, static HTML, App Blocks markup) as asked; scenario tests in Textual pilot tests do count.
- [ ] The web starter's e2e example was run only on its skip path (no Python Playwright on this machine); the static one
  passed in a real headless Chromium.
- [x] Green: python3 tests/verify_workflow.py; tests/browser/run.py all.
