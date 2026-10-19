## Scenarios

<!-- One scenario per behaviour a person can see. The heading is `### <ID> <title>`: the story id (US-312), or US-new
while its story is not written yet, then the title, word for word the test's name. `### Scenario: <title>` without an
id still works. Given = the world, When = what the person does, Then = what the person sees; one line each, `And`
continues the step above. Use only known steps (test-core/vocabulary.json and the generated block steps in
test-core/functional/blocks/vocabulary.json):
  python3 test-core/tools/vocab.py check THIS_TASK.md --vocab test-core/vocabulary.json test-core/functional/blocks/vocabulary.json
-->

### US-new a wrong password keeps me on the log in page
Given I am on the log in page
When I log in as "aiko@example.com" with "not-the-password"
Then I see the log in error
And the email field has "aiko@example.com"
