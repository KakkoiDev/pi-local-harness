# 297: Generated apps stay runnable, with journey tests reused across targets

Kind: code

GPT-Sol's improvement 6: keep a working preview, and test complete journeys (create, edit, reload, recover) next to unit
tests, reusable across packaging targets (plan 253).

- [ ] Each starter ships a journey test runner (headless shell) and one journey per sample feature.
- [ ] The harness runs the project's journeys as part of verification when the task touches UI.
- [ ] The Preview shows when the app stopped working, with the failing journey.
- [ ] The browser tool defaults to the project's app inside a project, is a read in every phase, and the Preview's console
  errors are attached to the next turn (bug hunt item 19, proposal 4).

## Scenarios

### US-new the Preview says when the app stopped working and names the failing journey
Given a project whose journey test passed and whose app shows in the Preview
When a change breaks that journey
Then the Preview shows that the app stopped working, with the failing journey's name

### US-new a task that touches the page is not verified while one of the project's journeys fails
Given an approved task that changes the app's page
When Pi's unit tests pass but a journey of the project fails
Then the check-in says "not verified" and names the journey

### US-new a console error in the Preview reaches Pi with my next message
Given the Preview shows a console error
When I ask Pi why the page is broken
Then Pi's answer quotes the console error without my pasting it
