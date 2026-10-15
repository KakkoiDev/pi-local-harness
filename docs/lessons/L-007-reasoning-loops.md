# L-007: Reasoning loops

**Seen** Repeatedly; 2026-10-15 in task 173, where Pi re-derived the same design many times before acting (its own
account) and the loop watch fired a recovery.

**Why it matters** Time and context spent without progress; a small model rarely gets out of it alone.

**Done** Checked: the harness watches the thinking every 10 seconds; an exact three-line sequence seen twice, or no
activity for the hang time, stops the turn and asks again once with the previous reasoning, then stops (tasks before
150; `harness/watch.mjs`, `harness/extension.mjs`). Told: a lesson line is added to AGENTS.md the first time
(`harness/memory.mjs`).

Checked (task 194, after OpenHands' stuck detector): the harness also watches what Pi does: the same call with the same
result 4 times, the same call failing 3 times in a row, or two calls alternating 6 times stops the turn and asks again
another way ("Harness stopped a repeat."), within `wake_ups`; reported. The first bench run had 12 identical failing calls
that nothing caught. Tests: `tests/harness/stuck.test.mjs`, the extension test.

**Open** The thought watch catches exact repeats only; re-deriving the same design in other words is not caught.
