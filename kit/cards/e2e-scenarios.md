# Scenarios become e2e tests, for Pi (the recipe card)

The task in progress has a `## Scenarios` section: each `### <title>` with its Given, When and Then lines. The harness
checks, before it calls the task verified:

- every scenario has **one e2e test named exactly after its title**, and that test **passed on the final code** in a
  test run of this request;
- every button, link and field you add to a page or template is used by an e2e test, and an e2e test never uses a
  control you removed (remove the control and its test together; the person sees both on the check-in).

## Write the test

One test per scenario, in the project's e2e folder, the scenario's words as the test's name:

| Project | File | Name for “Add a note and see it in the list” | Run (names shown) |
|---|---|---|---|
| App with no server (`js/app.mjs`) | `tests/e2e/<feature>.e2e.test.mjs` | `test('Add a note and see it in the list', …)` | `node --test tests/e2e/<feature>.e2e.test.mjs` |
| Web app (`app/main.py`) | `tests/e2e/test_<feature>_e2e.py` | `def test_add_a_note_and_see_it_in_the_list(base, page):` | `uv run pytest -v tests/e2e` |
| Terminal app (`app/tui.py`) | `tests/test_tui.py` | `async def test_add_a_note_and_see_it_in_the_list():` (Textual's `run_test()` pilot) | `uv run pytest -v tests/test_tui.py` |
| Playwright Test project | `tests/e2e/<feature>.spec.ts` | `test('Add a note and see it in the list', …)` | `npx playwright test --reporter=list` |

Copy the starter's example (`tests/e2e/notes.e2e.test.mjs` or `tests/e2e/test_notes_e2e.py`): it serves the app on a
local port, starts Chromium with `--use-mock-keychain` and `--password-store=basic`, and skips with the reason when no
browser is set up. Never download a browser in a test.

- **Given** sets the state up (open the page, add what must already be there, through the app or its database).
- **When** acts as the person does: `getByRole('button', { name: 'Add Note' })`, `getByLabel('New note')`
  (Python: `get_by_role("button", name="Add Note")`, `get_by_label("New note")`). Use the visible English name, as a
  plain string. `data-testid` only where no role or label fits (`getByTestId('export')`).
- **Then** checks what the person sees: a list item with the text, a message, the new count.
- Wait for state (`locator(...).waitFor()`, `wait_for()`), never for time. No sleeps.
- Run the tests with their names shown (node's default reporter, `pytest -v`, `--reporter=list`): the harness reads
  each test's name and result from the run.

A skipped test is not a passed one: when the harness says a scenario's test was skipped, no browser is set up for the
project's tests. Never install one yourself; say so in the task's `## For the person` section, and the person decides
(set up Playwright for the project, or Accept Anyway… on the check-in).
