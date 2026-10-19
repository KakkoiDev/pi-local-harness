# scenario-steps (JavaScript)

A task's Given/When/Then scenarios run as they are: each step of a fixed vocabulary has one function per level, built
from test-core's primitives, and the same task file runs as unit, integration and e2e tests. Read
[functional/README.md](../../../functional/README.md) first.

- Kind: scenario · Tools: Vitest, @playwright/test, `functional/js/`, `tools/vocab.py`
- Use for: a task whose scenarios should be checked at more than one level, or a project with a step vocabulary.

## The pieces
- `recipes/shared/task-example.md` and `recipes/shared/task-example.vocab.json`: the scenarios and the vocabulary.
- `task-steps.js`: `export const steps = new Registry()`, then `steps.step('<phrase>', fn, { level })` per phrase and
  level. Unit runs the pure functions (`sample_app/static/tasks.js`), integration the routes (`httpClient`,
  `tempDatabase`), e2e the page (`control`, `fill`, `click`, `expect*`).
- `task-steps-unit.test.js`, `task-steps-integration.test.js` (Vitest) and `task-steps.spec.js` (Playwright): a loop
  `for (const scenario of loadScenarios(TASK)) test(scenario.name, ... runScenario(scenario, { level, registry, world }))`.
  The loop stays in the test file because Playwright reads a test's fixtures from its destructured parameter.

## Steps
1. Write the scenarios with known steps only (`python3 tools/vocab.py check TASK.md --vocab VOCAB.json`).
2. Copy `task-steps.js` and the test file of each level you need; replace the app and the step bodies.
3. Run red first, then green: `npx vitest run recipes/js/scenario-steps && npx playwright test recipes/js/scenario-steps`.
4. `python3 tools/scenarios.py check TASK.md --tests <the test files> --junit <report>`: a file that calls
   `loadScenarios(...)` with the task file's name implements all its scenarios.

## Don't
- Don't write a step function outside the registry, or a phrase that is not in the vocabulary file.
- Don't wait for time inside a step: wait for the state (`expect*`, `control`).
