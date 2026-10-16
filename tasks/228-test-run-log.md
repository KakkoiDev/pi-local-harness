# 228: Every test run is logged

Kind: code

The person, 2026-10-16: "we should log the test runs for later analysis, like if we know exactly what ran or not." In the
pong project Pi said "10/10 pass"; nobody but Pi saw it.

## What to log
One JSON line per test command Gate sees (bash commands Gate recognises as tests, e.g. `node --test`, `python3 -m
unittest`, `pytest`, `uv run pytest`, `npx tsc`, `python3 tests/browser/run.py`): time, request id, project, cwd,
command, exit code, duration, and the counts parsed from the output when the runner prints them (pass, fail, skipped;
node's `ℹ pass N`, unittest's `Ran N tests` + `OK`/`FAILED (failures=N)`, pytest's `N passed, M failed`). Keep the last
200 lines of output in a separate file named by the run id, not in the JSON line.

## Where
- Gate already recognises test runs for G-010 and G-012 (grep `test` in gate/rules.py and gate/*.py for the
  recogniser; reuse it, do not write a second one).
- Write to `<data>/test-runs.jsonl` (the data folder: `PI_AGENT_DATA`, default ~/pi-local-harness-data) and
  `<data>/test-runs/<id>.txt`.
- Show it: Activity's request detail lists the request's test runs (command, result, counts, time); the bench copies
  the request's runs into its result.json (bench/runner.py).

## Steps
- [x] Red: python tests (tests/test_gate_*.py style) for the count parser on real outputs of node --test, unittest,
  pytest, tsc (no counts: exit code only).
- [x] Red: an audit of a test command writes one JSON line with the fields above.
- [x] Implement in Gate's audit path (after the command ran).
- [x] Activity detail: a "Tests" list (copy the existing detail list markup; no new design needed, it is a list of rows).
- [x] bench/runner.py: `test_runs` in result.json.
- [x] Green; `python3 tests/verify_workflow.py`.

## Done when
For any request one can answer "which tests ran, on what, with what result" from the log, the Activity detail and
the bench result, without trusting Pi's own words.

## Result

Gate saves one record for each recognised audited test run, including failures, and keeps the last 200 output
lines separately. Drift is excluded. The shared recogniser now includes `npx tsc`. Activity and bench records use
this evidence; bench folders retain the output files. Both browser suites passed, with the Tests list inspected at
1440, 1024 and 390 px and Japanese counts checked. Full workflow verification passed with
`PYTHONDONTWRITEBYTECODE=1` (the existing bytecode-cache issue documented in task 227).
