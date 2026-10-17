[CANARY]

Done — the README task is finished; both deliverables are on disk and verified:

- **`README.md`** (project root) documents the `pager` helper: what it does, a usage example (`page([1..10], 2, 3) → [4, 5, 6]`), and how to run the tests (`python -m unittest discover -s tests -v`).
- **`tasks/002-write-a-readme-for-this.md`** has its "For the person" section.

No further changes are needed. The harness can commit.

---
On the recovery loop: this turn triggered `missing-canary` a third time even though my visible text began with `[CANARY]`. The likely cause is that the harness inspects the *final* completed-message chunk, and I kept opening subsequent chunks after a tool call instead of the marker being the absolute first token — so the prefix got treated as omitted. My adjusted approach: no more tool calls this turn, with `[CANARY]` as the literal first characters of the reply.

The underlying request (writing the README) was completed two turns ago; the repeats were purely this canary-format issue, not unfinished work.