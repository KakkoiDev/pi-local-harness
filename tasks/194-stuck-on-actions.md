# 194: Stuck detection on what Pi does, not only on what it thinks

Kind: code

Strategy 3 of the ones picked on 2026-10-15, after OpenHands' stuck detector. The first bench run had Pi retry the
same failing calls 12 times and nothing reacted; the loop watch only reads the thinking.

- [x] Red (node, `tests/harness/stuck.test.mjs`): the same call with the same result 4 times, the same call failing 3
  times in a row, two calls alternating 6 times are stuck; different calls, or the same call with a new result ("3
  passed" then "4 passed"), are not; times, durations and long ids do not make a result new.
- [x] Red (node, extension test): three identical failing calls stop the turn ("Harness stopped a repeat."), report a
  recovery with trigger "stuck", and Pi is asked again another way.
- [x] `harness/stuck.mjs` (`StepWatch`); the extension records every tool result (Gate's refusals too), resets at each
  question, and uses the recovery path (within `wake_ups`; not in bare mode). Lesson L-007 updated.
