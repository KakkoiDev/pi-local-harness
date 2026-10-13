# 64: Per-task report for check

Kind: code

Request 2026-10-13: one page per task for the check phase.

- [ ] Red: on commit, Gate appends to `tasks/NN-*.md` a report: commit hash, red and green times, refusals, blocked items, canary trips.
- [ ] Red: canary trips per task are counted, so a model or context change that loses instructions shows up.
- [ ] Green: full suite.
