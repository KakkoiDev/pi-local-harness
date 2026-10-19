# scenario-e2e (Python)

Every task in a plan carries Given/When/Then scenarios. Each scenario becomes one end-to-end test whose name is the
scenario's title: Given = Arrange, When = Act, Then = Assert.

- Kind: e2e · Tools: pytest-playwright, `tools/scenarios.py`
- Use for: every planned task. A task is verified when each of its scenarios has a test that ran and passed.

## The scenario block in a task file
```markdown
### Scenario: Add a task
- Given I am signed in with an empty list
- When I add the task "Buy milk"
- Then I see "Buy milk" in the list
- And the count says "1 task"
```
(A ```gherkin block with `Scenario:` lines works too.) Example: `recipes/shared/task-example.md`.

## Steps
1. `python3 tools/scenarios.py skeleton TASK.md --lang python > tests/e2e/test_task_12.py`: one test per
   scenario, marked `@pytest.mark.scenario("<title>")`, function `test_<title in snake case>`, the steps as comments.
2. Fill each test: the Given lines arrange (fixtures, API calls), the When lines act like a person (click, fill), each
   Then line is one `expect(...)`. Keep the step comments.
3. Run it red first (before the feature exists), then green.
4. `python3 tools/scenarios.py check TASK.md --tests tests/e2e/test_task_12.py` (add
   `--junit report.xml` from `pytest --junitxml report.xml` to require that each one ran and passed).

Copy, never retype: `recipes/python/scenario-e2e/test_task_scenarios.py` shows all three scenarios of the example done.

## Run
`pytest recipes/python/scenario-e2e -q`

## Don't
- Don't rename a test without renaming its scenario (the check matches the title).
- Don't put two scenarios in one test, or one scenario across two tests.
