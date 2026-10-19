# 57: Show phase, task, step, and a manual release

Kind: code

Taken over by task 247 (2026-10-17), under CONSTITUTION.md. The historical boxes below are not claims of implementation. Use three phases; validation belongs inside Implementation, with no separate Check phase. System 1 derives progress from recorded evidence. The phase controls and transitions are requested in design/briefs/round-11.md.

Request 2026-10-13: the user sees where the model is and can release a stuck step.

- [ ] Red: the Gate tab and project view show phase, task, step, and the last REVISE reason.
- [ ] Red: a release action skips the current step once and records who skipped it in the task file.
- [ ] Green: full suite and browser test.

## Scenarios

### US-new Gate and the project view show the phase, the task, the step and the last refusal
Given Pi is building task 1 and Gate just refused a call
When I open the Gate tab and the project view
Then both show the phase, task 1, its current step and the refusal’s reason

### US-new the release action skips a stuck step once, and the task file says I skipped it
Given Pi is stuck on a step Gate keeps refusing
When I choose the release action for that step
Then Pi moves on to the next step
And the task file records that I skipped the step
