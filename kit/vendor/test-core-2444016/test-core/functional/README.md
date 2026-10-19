# functional: primitives → blocks → scenarios

Functional programming for tests. Small pure **primitives** (find a control, act, read what a person sees, build data,
stub the network, freeze time, a temporary database) compose into **blocks**; blocks compose into **scenarios**. The
same primitives serve every level: a step runs against a function (unit), a route (integration) or a browser page
(e2e). Scenarios are Gherkin Given/When/Then written with a **fixed vocabulary** that code owns and parses: a small
model may only use known steps, and implements a step by picking the block with the same words.

Python (`functional/`, pytest, Playwright sync) and JavaScript (`functional/js/`, Vitest, @playwright/test) have the
same concepts and the same names (snake_case / camelCase).

## Scenarios

A task file's `## Scenarios` section. The recommended heading is `### <ID> <title>`: the story id (`US-312`, or `US-new`
while the story is not written yet) and the title, word for word the test's name; `Scenario:` may come first.
`### Scenario: <title>` (anywhere) and `### <title>` keep working. One step per line, `And`/`But` continue the step
above, a `- ` bullet is allowed.

```markdown
## Scenarios

### US-12 Add a task
Given I am signed in with an empty list
When I add the task "Buy milk"
Then I see "Buy milk" in the list
And the count says "1 task"
```

A step pattern has `{name}` places: `When I add the task {title}`. A value is quoted (`"Buy milk"`, `“Buy milk”`,
`「牛乳」`) or one word without spaces (`3`, `Saturday`); an unquoted whole number is a number.

## The API

| Concept | Python | JavaScript |
|---|---|---|
| Read scenarios | `parse_scenarios(text)`, `load_scenarios(path)` → `Scenario(id, title, name, steps)` | `parseScenarios(text)`, `loadScenarios(pathOrURL)` |
| Patterns | `compile_pattern`, `match_pattern`, `nearest`, `similarity`, `shape` | `compilePattern`, `matchPattern`, `nearest`, `similarity`, `shape` |
| Step registry | `Registry(*others, block=)`, `@steps.step(pattern, level=)`, `add`, `include`, `find(step, level)`, `patterns`, `vocabulary()`, `check_vocabulary(file)` | `new Registry(...others, { block })`, `steps.step(pattern, fn, { level })`, `add`, `include`, `find`, `patterns`, `vocabulary()`, `checkVocabulary(file)` |
| Errors | `UnknownStep` (with the nearest known steps), `AmbiguousStep`, `StepNotAtLevel`, `StepFailed`, `ControlMissing` | the same classes |
| Run | `run_scenario(scenario, level=, registry=, world=)` → `World`; `resolve(...)` | `await runScenario(scenario, { level, registry, world })`; `resolve(...)` |
| pytest | `globals().update(scenario_tests(path, level=, registry=, world=fn))`: one test per scenario, `test_<heading>`; `fn`'s parameters are fixtures | a loop: `for (const s of loadScenarios(path)) test(s.name, async ({ page }) => runScenario(s, ...))` |
| Find | `control(within, role=, name=, label=, test_id=, text=, css=, exact=, include_hidden=, block=)` | `control(within, { role, name, label, testId, text, css, exact, includeHidden, block })` |
| Act | `goto`, `click`, `fill`, `check`, `uncheck`, `select`, `press` | the same |
| Read | `seen_text`, `expect_text`, `expect_no_text`, `expect_count`, `expect_visible`, `expect_hidden`, `expect_attribute`, `expect_value`, `expect_checked`, `expect_name`, `expect_description` | `seenText`, `expectText`, … `expectDescription` |
| Data | `builder(**defaults)` → `build(**overrides)` (`"Task {n}"` numbers each record) | `builder(defaults)` → `build(overrides)` |
| Network | `stub_network(routes, page=None)`: `page.route`, or an httpx client on a MockTransport | `stubNetwork(routes, { page })`: `page.route`, or a stand-in `fetch` |
| Time | `freeze_time(at, page=None)` → `FrozenClock` (`now`, `advance`); with a page, the browser's clock too | `freezeTime(at, { page })` → `{ now, advance }` |
| Database | `temp_database(folder, schema="")` → path | `tempDatabase(folder, schema)` → path |
| Routes | `http_client(app_or_url)`: TestClient in process, or httpx | `httpClient(baseURL)`: fetch keeping the session cookie |
| Settings | `primitives.settings.timeout` (ms a control may take to appear) | `settings.timeout` |

A target for the read primitives is a page or locator (waits for the state, reads the rendered text), a response, or a
plain value: the unit level reads the string a function returns with the same `expect_text`.

## Levels

`level` is `"unit"`, `"integration"` or `"e2e"`. One phrase has at most one function per level; a scenario runs at the
level asked for, and a step without a function there fails before anything runs (`StepNotAtLevel`). The world is what
the steps share: unit puts the value under test there, integration a client, e2e `page` and `base_url` / `baseURL`.
Recipe `scenario-steps` runs the example task at all three levels in both languages.

## Vocabulary files

```json
{"name": "Tasks", "levels": ["unit", "integration", "e2e"],
 "steps": [{"step": "When I add the task {title}", "params": {"title": "text"}, "ja": "タスク {title} を追加する"},
           {"step": "Then the table shows {n} rows", "params": {"n": "int"}, "block": "DataTable", "levels": ["e2e"]},
           {"step": "Then the table is in the {state} state", "params": {"state": {"one_of": ["Default", "Empty"]}}}]}
```

`python3 tools/vocab.py check TASK.md --vocab FILE...` passes when every step matches exactly one known step with
values of the right type (and, with `--level`, has a function there); unknown steps fail with the nearest known ones.
`Registry.check_vocabulary(file)` keeps the code and the file equal (the tests do it for both languages).

## Test blocks from App Blocks

`tools/blocks_from_app_blocks.py --kit <Pi Workbench folder>` reads the App Block catalogue (`kit/blocks/index.json`,
each card and its markup) and `functional/blocks/spec.json` (the vocabulary of each block), and writes, like a UI
library: `functional/blocks/python/<block>.py` and `functional/blocks/js/<Block>.js` (a page object with the block's
controls, its steps in a `Registry`, `STATES` from the card, the checked states, `DEMO` and `SELF_TEST`), the index of
both, and `functional/blocks/vocabulary.json`. Generated: LogIn, DataTable, EditForm, EmptyState, Toasts, KpiTile,
BarChart, SidePanel. `--check` fails when the committed files differ (CI runs it on the fixture copy
`tests/fixtures/app-blocks`).

`functional/blocks/selftest.py` / `selftest.js`: `self_test(page, block, kit=...)` serves the block's demo markup on
`page.route` and runs its `SELF_TEST` steps: the self-test, and the core of a test playground (each step uses the
control it names in the live demo).

A project composes registries: `Registry(project_steps, blocks.steps)`, or only the blocks it uses.

## Removal is loud

A test belongs to its scenario, not to a control. When a control disappears:
- at run time, `control(...)` fails with `LogIn: uses a control that no longer exists: link "Sign Up"`;
- when generating, a spec control missing from the App Block's markup stops generation with the same words;
- statically, `tools/e2e_coverage.py` reads `control(...)` calls like `get_by_role(...)`: a test or block whose
  control is gone is an orphan.

Removing a feature on purpose means removing its scenario and its test, and saying so ("Removed: <control> and its
test").

## Rules

No fixed waits (each primitive waits for a state); offline (stub the network, serve the app on port 0); every Chromium
launch passes `--use-mock-keychain --password-store=basic` (the fixtures do it).
