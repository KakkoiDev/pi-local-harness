# scenario-steps (Python)

A task's Given/When/Then scenarios run as they are: each step of a fixed vocabulary has one function per level, built
from test-core's primitives, and the same task file runs as unit, integration and e2e tests. Read
[functional/README.md](../../../functional/README.md) first.

- Kind: scenario · Tools: pytest, FastAPI `TestClient`, pytest-playwright, `functional/`, `tools/vocab.py`
- Use for: a task whose scenarios should be checked at more than one level, or a project with a step vocabulary.

## The pieces
- `recipes/shared/task-example.md`: the scenarios (`### <ID> <title>`, then Given/When/Then; the id is optional).
- `recipes/shared/task-example.vocab.json`: the fixed vocabulary. `python3 tools/vocab.py check TASK.md --vocab
  VOCAB.json` refuses any other step and shows the nearest known ones.
- `task_steps.py`: `steps = Registry()`, then one `@steps.step("<phrase>", level="unit"|"integration"|"e2e")` function
  per phrase and level. Unit runs the pure functions (`sample_app/tasks.py`), integration the routes
  (`http_client`, `temp_database`), e2e the page (`control`, `fill`, `click`, `expect_*`).
- `test_task_steps_unit.py`, `..._integration.py`, `..._e2e.py`: one line each,
  `globals().update(scenario_tests(TASK, level=..., registry=steps, world=world))`; `world`'s parameters are pytest
  fixtures. Each scenario becomes `test_<heading>`, marked `@pytest.mark.scenario("<heading>")`.

## Steps
1. Write the scenarios with known steps only (`tools/vocab.py check`). A new phrase goes into the vocabulary file first.
2. Copy `task_steps.py` and the test file of each level you need; replace the app and the step bodies.
3. Run red first, then green: `pytest recipes/python/scenario-steps -q`.
4. `python3 tools/scenarios.py check TASK.md --tests <the test files> --junit <report>` sees every scenario: a file that
   calls `scenario_tests(...)` with the task file's name implements all of them.

## Don't
- Don't write a step function outside the registry, or a phrase that is not in the vocabulary file.
- Don't give two phrases one meaning, or one phrase two meanings; `Registry.check_vocabulary` keeps code and file equal.
- Don't wait for time inside a step: wait for the state (`expect_*`, `control`).
