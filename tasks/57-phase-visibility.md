# 57: Show phase, task, step, and a manual release

Kind: code

Taken over by task 247 (2026-10-17), under CONSTITUTION.md. The historical boxes below are not claims of implementation. Use three phases; validation belongs inside Implementation, with no separate Check phase. System 1 derives progress from recorded evidence. The phase controls and transitions are requested in design/briefs/round-11.md.

Request 2026-10-13: the user sees where the model is and can release a stuck step.

- [ ] Red: the Gate tab and project view show phase, task, step, and the last REVISE reason.
- [ ] Red: a release action skips the current step once and records who skipped it in the task file.
- [ ] Green: full suite and browser test.
