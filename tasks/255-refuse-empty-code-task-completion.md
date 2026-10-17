# 255: Refuse completion of code tasks without an implementation change

Kind: code

Request 2026-10-18: “look for bugs and fix them. add unit, integration and e2e tests.”

Scope: gate/paperwork.py, tests/test_completion_evidence.py, tests/fixtures/fake-pi.py, tests/browser/design.cjs, docs/handoff/claude-return-2026-10-17.md.

- [x] Red: reproduce an approved code task becoming verified with no implementation, paperwork-only or tests-only changes, including stale passing evidence.
- [x] Fix completion to retain the open task and truthful unverified check-in without a fabricated feature commit.
- [x] Integration: actual Gate lifecycle cannot certify the empty implementation; docs tasks and real verified changes retain their supported paths.
- [x] E2E: actual Gate settlement reaches the web check-in as not verified and survives reload.
- [x] Green: focused tests, browser design suite and full workflow; report the separate chat failure and update the return handoff with evidence and limits.

Result: focused unit/integration suite 56 tests passed. Design browser suite passed, including actual Gate settlement and reload. Both chat runs failed the pre-existing bug-173 scroll-gap assertion (10px versus <=3px). This separate reproducible defect is not fixed or verified by task 255. No scroll code or assertion was weakened. Full Python/Node workflow passed with bytecode caching disabled. The guard covers approved code tasks with no non-test implementation diff; it does not judge semantic completeness. Publication audits retain their separate evidence path.
