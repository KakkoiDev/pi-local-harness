# L-007: Reasoning loops

**Seen** Repeatedly; 2026-10-15 in task 173, where Pi re-derived the same design many times before acting (its own
account) and the loop watch fired a recovery.

**Why it matters** Time and context spent without progress; a small model rarely gets out of it alone.

**Done** Checked: the harness watches the thinking every 10 seconds; an exact three-line sequence seen twice, or no
activity for the hang time, stops the turn and asks again once with the previous reasoning, then stops (tasks before
150; `harness/watch.mjs`, `harness/extension.mjs`). Told: a lesson line is added to AGENTS.md the first time
(`harness/memory.mjs`).

**Open** The watch catches exact repeats only; re-deriving the same design in other words is not caught.
