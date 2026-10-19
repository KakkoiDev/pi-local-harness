# 61: Red means a test failure

Kind: code

Request 2026-10-13: Pi's bash output ends with "Command exited with code N" (`bash.js:269`).
A red run must be a test failure, not a missing command.

- [ ] Red: exit codes 126 and 127 (not executable, not found) are not recorded as red.
- [ ] Red: the recorded run keeps its exit code.
- [ ] Green: full suite.

## Scenarios

### US-new a test command that is not found does not count as the failing test, so the task is not verified
Given an approved code task whose test command does not exist
When Pi runs it (exit 127), writes the code and runs it again
Then the task ends “not verified”, and Activity shows the run with its exit code
