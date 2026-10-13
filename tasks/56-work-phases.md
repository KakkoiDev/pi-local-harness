# 56: Discussion, planning, implementation, check

Kind: code

Request 2026-10-13: work cycles through four phases per project.

| Phase | Model may | Enters when |
|---|---|---|
| discussion | read, talk; no writes | project start, or the user asks for changes in check |
| planning | write ROADMAP.md and tasks/ only; each new task needs `Kind:` and checkboxes | the user says to plan |
| implementation | follow Laya's steps (task 55) through every unchecked roadmap item | the user approves the plan |
| check | read only; waits for the user | the last roadmap item is committed |

- [ ] Red: each phase blocks the tools listed as not allowed, with a reason naming the phase.
- [ ] Red: phase changes happen only on the user's command, except implementation to check.
- [ ] Red: the phase is persisted per project and survives a restart.
- [ ] Web UI and plh: commands to move phase (plan, approve, back to discussion).
- [ ] Green: full suite.

Open: exact commands (`/plan`, `/approve`, `/discuss`, or buttons).
