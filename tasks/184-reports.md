# 184: Reports: every incident the harness meets, for the later analysis

Kind: code

Plan 184 part 1 (`docs/plans/184-autopilot.md`): "I would rather that the AI agent continue its run … Then we analyze
all the reported errors and make the harness better."

- [x] Red (python, `tests/test_reports.py`): a report is one JSON line (time, kind, detail, request, project); Gate
  reports each rule that sent something back (only those); `/reports` counts by kind and lists the latest.
- [x] `harness/reports.py` and `harness/reports.mjs` write `<data>/reports.jsonl` (never raising); Gate's ledger reports
  refusals; `/reports [kind]` in the console (terminal command, completion, console guide, FAQ).
