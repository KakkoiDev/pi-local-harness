# Plan 328: test-core, the testing library small models build with

Date: 2026-10-19. Status: planned (the repository is not created yet; this file moves into it as its first notes).
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
| JavaScript | Jest (the person's choice; `node --test` stays allowed for no-dependency starters) | Jest + supertest-style local server | @playwright/test |

To decide with the person before pinning: Jest vs Vitest for ES-module projects (Jest needs a transform for ESM), and
whether the browser binary comes from `plh setup browser` (already pinned) rather than `playwright install`.

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

## Lessons already learned (record them in test-core's README)

- **Headless Chromium on macOS needs `--use-mock-keychain` (and `--password-store=basic`).** Without it, every test
  browser started with a scratch home asks macOS for a keychain ("A keychain cannot be found to store Chromium"), over
  and over; "Reset To Defaults" on that dialog would reset the person's login keychain. Fixed in Pi Workbench on
  2026-10-19 for every launcher, with tests/test_browser_keychain.py guarding it.
- Tests never reach the network: stand-ins for downloads (uv/uvx, the Tailwind binary) live in the recipes.
- Wait for state, never for time; a test that passes alone and fails in the full suite is a bug in the test.
- Live journeys against a real local model are opt-in and separate from the offline gate.

## Order

1. The person confirms the tool choices above and the repository (KakkoiDev/test-core, public like the other cores).
2. Scaffold the repo with the pinned tools, the recipes and their own tests (each recipe runs in CI).
3. Pi Workbench adapter: test cards routed like App Blocks; Project Start bases use the recipes; the E2E rule above in
   Gate's end-of-request check.
