# 58: Fresh context per task

Kind: code
No scenarios: Starting the next task in a new Pi session changes only what Pi's session holds, not anything the person sees or types.

Request 2026-10-13: after each commit, the next task starts in a new Pi session holding
AGENT.md, ROADMAP.md, and the next task file, not the previous task's history.

- [ ] Investigate: whether a Pi 0.87.1 extension can start a new session (record the API or the blocker here).
- [ ] Red: after a successful commit in build phase, the next turn runs in a new session with only that context.
- [ ] Green: full suite.
