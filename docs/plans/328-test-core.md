# Plan 328: test-core, the testing library small models build with

Date: 2026-10-19. Status: the person approved; repository created: https://github.com/KakkoiDev/test-core (public). This file seeds its notes.
The person: "I would like to make a test-core repo to have all the tools and recipes already locked in for agents to
have no wonder about how to make: unit, integration and e2e tests. In python and js. And for the best libs to be
already selected: like Jest and Playwright for JS." And: "the tests must always include an E2E test… even dumb agents
would notice when they remove features. And be forced to knowingly remove the E2E test attached to… a button it
removed."

Same shape as gaming-core, visual-core and the music core: pinned, vendored tools; one recipe per kind of test; a
checker; the model picks a recipe and fills it, deterministic code runs and checks it (CONSTITUTION.md).

## Chosen tools (pinned, licence-checked, no downloads at test time)

| Language | Unit | Integration | End to end |
|---|---|---|---|
| Python | pytest (stdlib unittest stays readable by it) | pytest + FastAPI TestClient / httpx | pytest-playwright |
| JavaScript | Vitest (the person's choice, 2026-10-19: faster and lighter on low-end machines, native ES modules; `node --test` stays allowed for no-dependency starters) | Vitest + a local server | @playwright/test |

Decided: Vitest for JavaScript unit and integration tests. Still to settle while pinning: the browser binary comes from
`plh setup browser` (already pinned) rather than `playwright install`.

## Recipes (each a card + a copyable file, like kit/blocks)

Unit (pure function, table-driven), integration (route + database in a temp folder), e2e journey (page object, roles
and labels first, `data-testid` only where no role fits), auth state reuse, network stub, file upload, offline page,
phone viewport, Japanese text, accessibility smoke, visual snapshot (optional), flaky-test rules (no sleeps; wait for
state), test data builders, and "the test proves the change" (Red before Green, as the harness already requires).

## The E2E rule for generated apps (also a harness task)

Every user-facing control has at least one e2e step that uses it (by role/label or test id). System 1 keeps an index
(control → tests). Removing a control while its e2e test stays fails the check ("this test uses a control that no
longer exists"); removing the test too is allowed only as a stated part of the task, shown to the person on the check-in
("Removed: the Delete button and its test"). A new control without an e2e step is "not verified".

Built in Pi Workbench by task 329 (gate/controls.py): controls in Jinja templates, static HTML and App Blocks markup, by
data-testid, else role and name, else id; the tests that reach them through Playwright's getByRole/getByLabel/
getByText/getByTestId (and the Python spellings) or `#id`. A project without e2e tests is not checked; the starters ship
one, so new projects are.

## Every task has its scenarios, and each scenario becomes an e2e test

The person, 2026-10-19: "I would like each task to have that type of user story [Given–When–Then] and then have the
system 2 build that as an e2e test." System 1 lays out and checks; System 2 writes the words and the tests:

- propose_plan's tasks carry `scenarios: [{title, given, when, then}]`; a code task that changes what the person sees
  needs at least one. The task file gets `## Scenarios` in one fixed format (`### <title>`, then Given/When/Then lines);
  the plan card shows them.
- In Implementation the model writes one e2e test per scenario, named exactly after its title, with the project's e2e
  runner (Playwright for web and static apps, a Textual pilot test for terminal apps); the recipe card
  (`kit/cards/e2e-scenarios.md` until test-core's recipes are vendored) joins the context of such a task.
- Before "verified", every scenario's test passed on the final code in a run Gate saw (the runner's printed names);
  a missing, failing or skipped one is "not verified", naming the scenario.

## Lessons already learned (record them in test-core's README)

- **Headless Chromium on macOS needs `--use-mock-keychain` (and `--password-store=basic`).** Without it, every test
  browser started with a scratch home asks macOS for a keychain ("A keychain cannot be found to store Chromium"), over
  and over; "Reset To Defaults" on that dialog would reset the person's login keychain. Fixed in Pi Workbench on
  2026-10-19 for every launcher, with tests/test_browser_keychain.py guarding it.
- Tests never reach the network: stand-ins for downloads (uv/uvx, the Tailwind binary) live in the recipes.
- Wait for state, never for time; a test that passes alone and fails in the full suite is a bug in the test.
- Live journeys against a real local model are opt-in and separate from the offline gate.

## Every task has its scenarios, and they become its e2e tests (the person, 2026-10-19)

"I would like each task to have that type of user story [Given–When–Then] and then have the system 2 build that as an
e2e test." Each planned task carries one or more Given/When/Then scenarios in its file; the model writes one e2e test
per scenario from a test-core recipe; System 1 checks that every scenario has a test of the same name that ran and
passed before the task can be verified (Pi Workbench task 329).

## Test blocks: functional programming for tests (the person, 2026-10-19)

Agreed in conversation:
- **Gherkin with a fixed vocabulary.** Every task's scenarios are written in Given/When/Then using only a small, fixed
  step vocabulary that System 1 owns and parses ("Given a habit {name} with a {n}-day streak", "When I tick {name}",
  "Then its streak shows {n}"). The model may only use known steps when planning; System 1 refuses unknown ones and
  offers the nearest. Later the model implements each step by picking the test block with the same words, so every
  step maps to exactly one block, checkable without the model.
- **Primitives → blocks → scenarios, at every level.** Small pure primitives (find a control by role/label, act, read
  what a person sees, build data, stub the network, freeze time) compose into blocks; blocks compose into scenarios.
  Unit, integration and e2e tests are all built from the same primitives at different levels (a step can run against a
  function, a route or a browser page).
- **Test blocks are generated from App Blocks, like a UI library.** Each App Block (LogIn, DataTable, KpiTile, Cart…)
  gets its test block (its Given/When/Then pieces, generated from the block's markup and states), with a self-test;
  the primitives stay available for anything custom.
- **Removal is loud.** A test belongs to its scenario, not to the control: if a control disappears, the block that uses
  it fails with "uses a control that no longer exists"; removing a feature on purpose means removing its scenario and
  test, listed on the check-in.
- **A playground** (like the designer's Blocks Playground) runs each test block live against its App Block demo: the
  "Storybook for tests".
- Designer brief: design/briefs/round-14.md.

## Order

1. The person confirms the tool choices above and the repository (KakkoiDev/test-core, public like the other cores).
2. Scaffold the repo with the pinned tools, the recipes and their own tests (each recipe runs in CI).
3. Pi Workbench adapter: test cards routed like App Blocks; Project Start bases use the recipes; the E2E rule above in
   Gate's end-of-request check.
