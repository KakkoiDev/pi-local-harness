# 64: Per-task report for check

Kind: code

Request 2026-10-13: one page per task for the check phase.

- [ ] Red: on commit, Gate appends to `tasks/NN-*.md` a report: commit hash, red and green times, refusals, blocked items, canary trips.
- [ ] Red: canary trips per task are counted, so a model or context change that loses instructions shows up.
- [ ] Green: full suite.

## Scenarios

### US-new a committed task’s file ends with its report: commit, test times, refusals, blocked items and canary trips
Given Pi built task 1 and Gate committed it
When I open the task file in Work
Then it ends with a report naming the commit, the red and green times, the refusals, blocked items and canary trips
