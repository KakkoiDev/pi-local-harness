# scenario-e2e (JavaScript)

Every task in a plan carries Given/When/Then scenarios. Each scenario becomes one end-to-end test whose title is the
scenario's title: Given = Arrange, When = Act, Then = Assert.

- Kind: e2e · Tools: @playwright/test, `tools/scenarios.py`
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
1. `python3 tools/scenarios.py skeleton TASK.md --lang js > tests/e2e/task-12.spec.js`: one `test('<title>', ...)`
   per scenario with the steps as comments.
2. Fill each test: Given lines arrange (fixtures, API calls), When lines act like a person, each Then line is one
   `await expect(...)`. Keep the step comments.
3. Run it red first, then green.
4. `python3 tools/scenarios.py check TASK.md --tests tests/e2e/task-12.spec.js` (add
   `--junit .test-output/playwright-junit.xml` to require that each one ran and passed).

Copy, never retype: `recipes/js/scenario-e2e/task-scenarios.spec.js` shows all three scenarios of the example done.

## Run
`npx playwright test recipes/js/scenario-e2e`

## Don't
- Don't rename a test without renaming its scenario; don't put two scenarios in one test.
