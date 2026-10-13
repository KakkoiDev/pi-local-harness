# 61: Red means a test failure

Kind: code

Request 2026-10-13: Pi's bash output ends with "Command exited with code N" (`bash.js:269`).
A red run must be a test failure, not a missing command.

- [ ] Red: exit codes 126 and 127 (not executable, not found) are not recorded as red.
- [ ] Red: the recorded run keeps its exit code.
- [ ] Green: full suite.
