# 56: Discussion, planning, implementation, check

Kind: code

Taken over by task 247 (2026-10-17), under CONSTITUTION.md. The historical boxes below are not claims of implementation. Use three phases; validation belongs inside Implementation, with no separate Check phase. System 1 derives progress from recorded evidence. The phase controls and transitions are requested in design/briefs/round-11.md.

Request 2026-10-13: work cycles through four phases per project.

| Phase | Model may | Enters when |
|---|---|---|
| discussion | read, talk; no writes | project start, or the user asks for changes in check |
| planning | write ROADMAP.md and tasks/ only; each new task needs `Kind:` and checkboxes | the user says to plan |
| implementation | follow Gate's steps (task 55) through every unchecked roadmap item | the user approves the plan |
| check | read only; waits for the user | the last roadmap item is committed |

- [ ] Red: each phase blocks the tools listed as not allowed, with a reason naming the phase.
- [ ] Red: phase changes happen only on the user's command, except implementation to check.
- [ ] Red: the phase is persisted per project and survives a restart.
- [ ] Web UI: a phase bar (Discuss, Plan, Build, Check) with one next-step button: "Plan this", "Approve plan" (shows new roadmap items, kinds, and test settings), "Ask for changes".
- [ ] Pi CLI: `/plan`, `/approve`, `/discuss` registered by the extension.
- [ ] Red: during build, approved roadmap and task text is add-only: ticking boxes, new boxes, and notes are allowed; removing or rewording an approved line is revised.
- [ ] Red: `- [~] Blocked: <reason>` stops the run and moves the project to check.
- [ ] Green: full suite.

Decided 2026-10-13: one Gate token for web and CLI. The goal is keeping a forgetful model
on track, not stopping a model that tries to cheat; no extra guard against the model
calling Gate's phase endpoint itself.
