# Task 12: Update Agent SOPs (Request-to-Task Pipeline)

## Goal
Implement the mandatory "Request-to-Task" pipeline in AGENT.md and the project dashboard to ensure all future requests are tracked via TDD task files.

## TDD Workflow
- [ ] **Establish Baseline**: Commit current state.
- [ ] **Red State**:
    - [ ] Write a test verifying that `AGENT.md` contains "Request-to-Task Pipeline".
    - [ ] Revert the previous accidental inline update to ensure the test is **RED**.
    - [ ] Run test $\rightarrow$ Verify **RED**.
    - [ ] `git commit` (SOP Test Red).
- [ ] **Green State**:
    - [ ] Add Rule #11 "Request-to-Task Pipeline" to `AGENT.md`.
    - [ ] Run test $\rightarrow$ Verify **GREEN**.
    - [ ] `git commit` (SOP Test Green).
- [ ] **Closure**:
    - [ ] Update `todo.md` to reflect the process improvement.
    - [ ] `git commit` (Task Completed).

## Acceptance Criteria
- `AGENT.md` contains the mandatory "Request-to-Task Pipeline" section.
- The transition from request $\rightarrow$ task $\rightarrow$ TDD $\rightarrow$ commit is codified.
- Full Git audit trail provided.
