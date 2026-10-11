# Task 12: Update Agent SOPs (Request-to-Task Pipeline)

## Goal
Implement the mandatory "Request-to-Task" pipeline in AGENT.md and the project dashboard to ensure all future requests are tracked via TDD task files.

## TDD Workflow
- [x] **Establish Baseline**: Commit current state.
- [x] **Red State**:
    - [x] Write a test verifying that `AGENT.md` contains "Request-to-Task Pipeline".
    - [x] Revert the previous accidental inline update to ensure the test is **RED**.
    - [x] Run test $\rightarrow$ Verify **RED**.
    - [x] `git commit` (SOP Test Red).
- [x] **Green State**:
    - [x] Add Rule #11 "Request-to-Task Pipeline" to `AGENT.md`.
    - [x] Run test $\rightarrow$ Verify **GREEN**.
    - [x] `git commit` (SOP Test Green).
- [x] **Closure**:
    - [x] Update `todo.md` to reflect the process improvement.
    - [x] `git commit` (Task Completed).

## Acceptance Criteria
- `AGENT.md` contains the mandatory "Request-to-Task Pipeline" section.
- The transition from request $\rightarrow$ task $\rightarrow$ TDD $\rightarrow$ commit is codified.
- Full Git audit trail provided.
