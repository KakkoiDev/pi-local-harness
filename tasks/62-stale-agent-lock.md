# 62: Stale agent lock recovery

Kind: code

Audit #11: after a Pi crash, `.agent-lock` blocks the queue until deleted by hand
(`web_chat.py:106-111`, `agent-lock.mjs:5`). Unattended runs make this matter.

- [ ] Red: a lock whose PID is alive but is not a Pi process is treated as stale.
- [ ] Red: a lock older than the active process start time is treated as stale.
- [ ] Green: full suite.
