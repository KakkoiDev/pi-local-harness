# 269: "Done" and "verified" come only from evidence System 1 chose and checked

Kind: code

Plan 267, judgements J-06, J-07, J-15, J-26, J-27. Today the model chooses the test command that counts as Green and
that prove_red runs (paperwork.py:442-456, 603-625), may weaken tests (review P0-1: `assertTrue(True)` passes), and
writes "Tried it: …" claims that nothing checks (AGENTS.md:25, done-row.mjs:35). Builds on task 260 (the review's
verification repair) and keeps its tests.

Files: gate/evidence.py (new: the project's check set), gate/protocol.py, gate/paperwork.py (ran, prove_red, _end),
gate/test_integrity.py (new), harness/AGENTS.md (the "For the person" paragraph), js/done-row.mjs (evidence line),
tests/test_evidence.py, tests/test_test_integrity.py.

- [ ] Red: tests fail for (a) Green accepted from a narrow command (`pytest tests/test_one.py -k nothing`, `--help`);
  (b) a task whose test file lost assertions or tests still verifies; (c) "Tried it: opened the page" shown with no
  recorded browser run; (d) a comment marked answered with no verified task.
- [ ] gate/evidence.py, rule E-101: the check set is chosen by code from the project type and the changed files
  (kit/starters.json identify + kit/toolchain.json): pytest and strict pyright for the web starter, `node --test` and
  tsc for the static starter, the browser check at two sizes when templates or styles changed. Green is the whole set
  passing on the exact code state; the model's command can still run, but never counts as Green alone.
- [ ] Rule E-102 (prove Red): the harness reverts the task's non-test changes in a scratch worktree and runs the same
  check set; Red holds only if a test added or changed in this task fails there.
- [ ] Rule E-103 (test integrity): fewer tests or assertions in a changed test file, an assertion on a constant, a
  removed test, or a skip added → not verified, and one system card: "Keep the tests as they were" (recommended),
  "Accept the smaller tests", "Something else…".
- [ ] "For the person": the "Tried it" line is written by code from recorded runs (which checks, which pages, at which
  sizes); the model writes only the plain-words "what changed" lines; a claim of checking in its text without a record is
  removed and logged.
- [ ] Comments: a queued comment is answered when its task is verified (code), not when the model writes agent_reply.
- [ ] Document comments (J-53): a suggestion by default; a direct edit only when the person chose "Apply directly" for
  that document (harness/documents.py:280-281).
- [ ] Harness-made tasks (J-34): "Done when" states the evidence rule (the check set passes, Red proven) instead of a
  copy of the title (gate/paperwork.py:643).
- [ ] Green: the new tests, task 260's tests and the browser design suite pass; the full workflow passes.

Acceptance: no model choice or claim can make a task verified; every "verified" names the checks that proved it.

## Scenarios

### US-new a task whose test lost its assertions ends “not verified”, and Keep the Tests as They Were is recommended
Given an approved task with a test file that had three assertions
When Pi's change leaves that test file with one assertion and the checks pass
Then the check-in says “not verified” and a card offers “Keep the tests as they were” (recommended), “Accept the smaller tests”, “Something else…”

### US-new the check-in’s “Tried it” line lists only the checks that ran, with the pages and sizes
Given a task whose template changed and Pi wrote “I opened the page” without a browser run
When the task ends
Then the “Tried it” line names only the recorded checks and sizes, and Pi's unrecorded claim is not shown

### US-new a queued comment shows as answered only when its task is verified
Given a comment I left that queued a task
When Pi replies to the comment but its task ends “not verified”
Then the comment is still open, and it shows as answered once the task is verified
