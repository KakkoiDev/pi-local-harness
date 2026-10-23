# 61: Red means a test failure

Kind: code

Request 2026-10-13: Pi's bash output ends with "Command exited with code N" (`bash.js:269`).
A red run must be a test failure, not a missing command.

- [x] Red: exit codes 126 and 127 (not executable, not found) are not recorded as red.
- [x] Red: the recorded run keeps its exit code.
- [x] Green: full suite.

## Scenarios

### US-358 a test command that is not found does not count as the failing test, so the task is not verified
Given an approved code task whose test command does not exist
When Pi runs it (exit 127), writes the code and runs it again
Then the task ends “not verified”, and Activity shows the run with its exit code

## Implementation notes · 23 October 2026

The audit previously received only 0/1 from Pi's error flag. The extension now preserves the anchored bash runtime exit footer. Gate excludes 126/127 from protocol and task Red/Green evidence, retains their audit records, and does not teach the curator a false failed-test observation.

## For the person
A missing or non-executable test command cannot count as the required failing test. Activity keeps the actual exit code.
Tried it: focused Gate tests and the missing-runner chat journey; full Python/Node workflow and all browser suites passed.
