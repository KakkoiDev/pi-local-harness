# 334: Retry a planning request that ends without submitting its plan

Kind: code

Request 2026-10-19: finish the handoff, including the small-model Planning failure.

- [x] Red: a planning request with no submitted plan must return a bounded continuation rather than nothing changed.
- [x] System 1 retries once per request, retaining the request; no retry after Stop, a phase change, a pending plan or a question pause.
- [x] Green: workflow and all browser suites; record limits for real-model verification.

## Scenarios

### US-350 terminal: a missing plan is retried once and approval still waits for me
Given I chose Planning for a registered project
When Pi ends my planning request without submitting its plan
Then the harness retries once, accepts the submitted plan and waits for my explicit Start Building

## Evidence

Red: the Python regression and US-350 both returned `nothing changed` instead of `continue` before implementation.
Targeted Green: 66 paperwork tests, extension retry tests and the terminal journey. Full workflow passed; all five browser suites passed, including 99/99 stories and the 15/15 journey.
This is one bounded recovery for the recorded L04 symptom, not proof that Gemma now completes the live journey.
No live model was run, and no personal project or installed runtime was changed.

The final negative regression also excludes read-only requests such as “Explain the current plan”.
The retry is recorded once as `planning_retry` / `code` / `planning.missing_plan`.
