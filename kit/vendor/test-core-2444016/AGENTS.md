# test-core agent rules

Read the host project's AGENTS.md, CLAUDE.md or README first. Keep its test framework if it already has one; test-core
recipes still apply to the shape of each test.

## Pick, copy, fill

1. Name the kind of test you need (unit, integration, e2e journey, fixtures, builder, network stub, offline or phone,
   Japanese text, accessibility smoke, scenario, flaky rules). Find it in `CATALOG.json` or with
   `python3 tools/catalog.py find <words>`.
2. Read only that recipe's card. Copy its file, never retype it. Rename the names, keep the structure.
3. Copy with `python3 tools/catalog.py copy <name> --language python|js --out <folder>` (it never overwrites), or
   by hand from the card's list. Replace `sample_app` with the project's app.
4. Do not install another test library or guess an API from another version: the versions are pinned in
   `package.json`, `package-lock.json`, `pyproject.toml` and `requirements.lock`.

## Rules for every test

- **Arrange, Act, Assert**, in that order, one behaviour per test. The test's name says the behaviour.
- **Red before Green.** Run the test before the change and see it fail for the right reason; then make it pass.
- **Wait for state, never for time.** No `sleep`, no `waitForTimeout`. Wait for a locator, a response, a value.
- **Offline.** Tests never reach the network: stub it (recipe `network-stub`) or serve the app locally on port 0.
- **Find elements by role and label first**, then by visible text, and by `data-testid` only where nothing else fits.
- **Every Chromium launch passes `--use-mock-keychain` and `--password-store=basic`** ([NOTES.md](NOTES.md)).
- A test that passes alone and fails in the full suite is a bug in the test: shared state, order or time.
- Temporary files go in the test framework's temporary folder (`tmp_path`, `os.tmpdir()`), never in the home folder.
- Stop a process you started only by its exact PID, never by name or pattern.

## The E2E rule

Every control a person can use has at least one end-to-end step that uses it. Every Given/When/Then scenario of a task
is one end-to-end test whose name is the scenario's title. When you remove a control, remove its test knowingly and
say so ("Removed: the Delete button and its test"); `tools/e2e_coverage.py` fails on a test whose control is gone and
reports controls no test uses. Run it on the project:
`python3 tools/e2e_coverage.py --pages <pages> --tests <e2e tests and page objects> [--messages <messages/*.json>]`.
For each task's scenarios: `python3 tools/scenarios.py skeleton TASK.md --lang python|js`, fill the tests, then
`python3 tools/scenarios.py check TASK.md --tests <files> --junit <report>`.

## Scenarios with a fixed vocabulary

Write a task's scenarios with known steps only (`python3 tools/vocab.py check TASK.md --vocab <files>`); a new phrase
goes into the vocabulary file first. Headings are `### <ID> <title>` (story id, or `US-new`; `### Scenario: <title>`
also works). Implement a step by picking the test block with the same words (`functional/blocks/vocabulary.json`), or
register it once per level in the project's `Registry` from primitives (recipe `scenario-steps`, functional/README.md).
Never edit `functional/blocks/python` or `functional/blocks/js`: change `functional/blocks/spec.json` and run
`tools/blocks_from_app_blocks.py`.

## Boundaries

Live journeys against a real model or a real service are opt-in and separate from the offline gate. No credentials,
no real accounts and no production data in tests: use builders and fixtures with obvious test values.
