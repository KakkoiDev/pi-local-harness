# 55: Gate guides each step

Kind: code

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
