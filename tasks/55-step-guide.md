# 55: Gate guides each step

Kind: code

Taken over by task 247 (2026-10-17), under CONSTITUTION.md. The historical boxes below are not claims of implementation. Use three phases; validation belongs inside Implementation, with no separate Check phase. System 1 derives progress from recorded evidence. The phase controls and transitions are requested in design/briefs/round-11.md.

Request 2026-10-13: Gate is the judge and guide; the model executes the step it is
given and never skips one.

- [ ] Red: Gate computes the current task (first unchecked ROADMAP.md item) and its current step from the kind and recorded evidence.
- [ ] Red: tool calls outside the step are revised with the step to do instead (red step: edits only under test paths; check-task step: only the task file; and so on).
- [ ] Red: the extension adds "Gate: task NN, step X. Do: ..." to every turn's context.
- [ ] Step state is derived from the persisted record (task 53) and git, so it survives interruptions and restarts.
- [ ] Green: full suite.

Decided 2026-10-13: test settings live in the ROADMAP.md header, written during planning
and shown at approval:

    Tests: tests/
    Test command: python3 -m unittest discover -s tests

- [ ] Red: the red step allows edits only under `Tests:`; only `Test command:` counts as a red or green run.
- [ ] Red: without the header, defaults apply (`tests/`, `test_*`, `*_test.*`, `*.test.*`, any known runner).

## Scenarios

### US-new during the failing-test step, Pi’s edit to app code is refused with the step to do, and the chat says why
Given an approved code task in Implementation, at its failing-test step
When Pi tries to edit a file outside the test folder
Then the chat and Gate show the edit was refused, naming the step and what to do instead
And the file is unchanged

### US-new the plan card shows the test folder and test command before I approve the plan
Given Pi proposed a plan whose ROADMAP.md header has Tests: and Test command:
When I look at the plan card in Planning
Then it shows the test folder and the test command next to the tasks
