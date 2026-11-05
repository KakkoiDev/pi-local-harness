# 382: Show readiness from actual verification evidence

Kind: code

Planned 2026-11-05. Not implemented. See docs/plans/377-gg-adoption-and-stock-pi-bench.md, section 5.

- [ ] Red: reproduce stale passing checks, missing required checks and model claims disagreeing with seeded test failures.
- [ ] Normalize existing check evidence with source-tree fingerprints and required/applicability status; do not add another evidence database.
- [ ] Reuse backend snapshots for check-in/publish/terminal; never average away a failure or let model prose verify a task.
- [ ] Get missing designer states/copy before adding UI; preserve phase/scope/approval and existing automatic-run semantics.
- [ ] Run evidence/staleness tests, workflow and all affected browser/real-Pi acceptance journeys.

## Scenarios

### US-new readiness never treats stale or missing checks as passing
Given a required test was passed before the source changed
When I inspect readiness before accepting the task
Then the stale evidence is identified and the task is not verified from the old result

## Needs design

Review the designer handoff in plan 377 against rounds 18–19. Add board/component references for new actual-input, reference-provenance or readiness states before new frontend work. Backend work may proceed independently.
