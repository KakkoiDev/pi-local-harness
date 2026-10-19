# 292: Every component records its build; one trace id per request

Kind: code
No scenarios: build records, trace ids, the test-run log and timestamps are log and data changes the person never sees or types.

GPT-Sol's report: "Record component builds and a common trace ID before claiming a comprehensive decision-share
metric"; the log review: no component records its build, Gate events have no request id, 17 saved runs have no test-run
records and `test-runs.jsonl` is absent in the live data.

- [ ] Web, Gate and the extension log their build (commit, dirty flag, install time) at start and in every request record.
- [ ] One trace id per request, carried by chat records, Gate events and audits, decisions, test runs and run reports.
- [ ] Find why the live data has no test-run log; make it written by every Gate-observed test run (task 228).
- [ ] Consistent timestamps (one ISO format with offset) in every log.
