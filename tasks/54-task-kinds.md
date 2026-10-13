# 54: Task kinds decide the required steps

Kind: code

Request 2026-10-13: Laya must know what each task is. Every task file carries a
`Kind:` line. Steps per kind:

| Kind | Steps |
|---|---|
| code | red, implement, green, check task, check roadmap, commit |
| chore | edit, green, check task, check roadmap, commit |
| docs | edit, check task, check roadmap, commit |
| planning | ROADMAP.md and tasks/ only, commit |

A task without a valid `Kind:` line blocks its commit with a reason naming the line to add.

- [x] Red: a `Kind: docs` task commits without test runs; `Kind: config` needs green but not red. 2026-10-13: renamed `chore` in task 91.
- [x] Red: a missing or unknown kind blocks the commit and names the fix.
- [x] `laya/protocol.py` reads the kind from the task file whose box is newly checked.
- [x] Green: full suite.
