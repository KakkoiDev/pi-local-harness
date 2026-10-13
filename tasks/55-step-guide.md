# 55: Laya guides each step

Kind: code

Request 2026-10-13: Laya is the judge and guide; the model executes the step it is
given and never skips one.

- [ ] Red: Laya computes the current task (first unchecked ROADMAP.md item) and its current step from the kind and recorded evidence.
- [ ] Red: tool calls outside the step are revised with the step to do instead (red step: edits only under test paths; check-task step: only the task file; and so on).
- [ ] Red: the extension adds "Laya: task NN, step X. Do: ..." to every turn's context.
- [ ] Step state is derived from the persisted record (task 53) and git, so it survives interruptions and restarts.
- [ ] Green: full suite.

Open: test paths are `tests/`, `test_*`, `*_test.*`, `*.test.*`; other layouts need a
`Tests:` line in the task file.
