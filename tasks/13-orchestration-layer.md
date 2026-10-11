# Task 13: Orchestration & Verification Layer

## Goal
Implement a structured "Request $\rightarrow$ Planner $\rightarrow$ Verifier" orchestration layer to ensure 100% compliance with the Request-to-Task pipeline.

## Proposed Implementation Strategy
1. **Request Classification (The Planner)**: 
   - Instead of jumping straight to implementation, the agent will start every complex request with a "Planning Turn".
   - The agent acts as the "Classifier" to map the request to one or more tasks.
   - The agent presents the proposed task list to the user for approval.
2. **The Automated Verifier**:
   - Create a tool `tests/verify_workflow.py` that audits the current state.
   - The verifier will ensure:
     - Every entry in `todo.md` corresponds to a file in `tasks/`.
     - Every completed task in `todo.md` has all its checkboxes checked.
     - There are no "orphaned" tasks.
3. **Process Integration**:
   - Add the "Verification Step" to the end of every major task.

## TDD Workflow
- [x] **Establish Baseline**: Commit current state.
- [x] **Red State**:
    - [x] Develop the `tests/verify_workflow.py` script.
    - [x] Create a "corrupt" state (e.g., an unchecked box in a "completed" task).
    - [x] Run the verifier $\rightarrow$ Verify **RED**.
    - [x] `git commit` (Verifier Red).
- [x] **Green State**:
    - [x] Fix the corruption in `tasks/` and `todo.md`.
    - [x] Run the verifier $\rightarrow$ Verify **GREEN**.
    - [x] `git commit` (Verifier Green).
- [x] **Closure**:
    - [x] Codify the "Planning $\rightarrow$ Implementation $\rightarrow$ Verification" loop in `AGENT.md`.
    - [x] `git commit` (Task Completed).

## Acceptance Criteria
- The `verify_workflow.py` script successfully detects SOP violations.
- `AGENT.md` includes the new "Orchestration" sequence.
- All current tasks are verified as compliant.
