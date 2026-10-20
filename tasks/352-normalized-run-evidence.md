# 352: Normalize selected tool-run evidence

Kind: code

No scenarios: internal pure report API only; no command, route or viewer is exposed. Task 350 owns the designed inspection experience and Agentplay adapter.

Request 2026-10-20: "build all you can right now".

- [x] Red: scope, exact deduplication, concurrent calls, refusal versus execution, conflicting results, malformed records, long runs and secret omission.
- [x] Build a bounded pure normalizer for explicitly supplied Gate and Pi RPC records; retain provenance without exporting arguments, outputs or arbitrary labels.
- [x] Green: focused tests, workflow and browser regression suites.

The caller must supply the selected project's records and an explicit scope on every envelope. This API does not discover files, read session logs, install Agentplay, or reconstruct missing arguments. Gate-only evidence never proves execution. Task 350 remains open.

## Evidence and limits

Red: the focused suite first failed because `harness.run_evidence` did not exist. Additional Red cases caught REVISE/ESCALATE being treated as unknown and damaged Unicode crashing analysis; both were corrected. Green: 18 focused tests and 10 installed-copy tests pass. The full workflow passed (Python, Node and dogfood checks); `python3 tests/browser/run.py all` exited 0, including the journey with 99 passing stories and zero failures. The final commit is chained to another workflow check.

Recheck the core with `python3 -m unittest discover -s tests -p test_run_evidence.py`. No new tool, UI control, live-log scan, model download or running-service restart is included. Task 350's Agentplay adapter and user-facing stories remain open.
