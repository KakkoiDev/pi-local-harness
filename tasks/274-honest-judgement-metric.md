# 274: The bench reports who made each judgement, honestly; target: the model makes none

Kind: code

Plan 267, section 4; CONSTITUTION.md Article 11; extends task 249. Review P2: every Gate preflight is logged as a code
"decision" and Laya abstentions as Laya decisions, so the model's share trends to 0%; P1-15: test runs write into the
live decisions.jsonl.

Files: harness/decision_log.py (kinds catalogue, request ids), harness/judgement_kinds.json (new: every judgement kind
in plan 267's inventory with its target author), gate/paperwork.py and gate/ledger.py (writers), bench/runner.py,
bench readme column, tests/test_decision_log.py, tests/test_bench_metric.py.

- [ ] Red: tests fail for (a) a Gate ALLOW on a read counted as a judgement; (b) a Laya abstention counted as a Laya
  judgement; (c) a propose_plan kind, a model recommendation or a model test command used without a `model` record;
  (d) a test writing to the person's live decisions.jsonl; (e) the bench showing a share with no coverage figure.
- [ ] harness/judgement_kinds.json lists every judgement kind (J-01 …) with its target author; `record` refuses an
  unknown kind; every record carries the request id (or null for a control outside a request).
- [ ] What counts: a judgement is a decision with more than one outcome that changed what happened; routine Gate
  passes are counted separately as checks; a Laya abstention is recorded as `laya_abstained` and the judgement is
  attributed to whoever then decided (the person, or auto taking System 1's recommendation).
- [ ] Every place code still uses a model-supplied value as a decision (until tasks 268-272 land) writes a `model` record,
  so the share is honest during the transition.
- [ ] Tests use an isolated data folder; a guard refuses writes to the person's data folder from the test runner.
- [ ] The bench per run: judgements by author per request, the model's share, abstentions, and coverage = judgement
  kinds observed with a writer / kinds in the catalogue; the README column shows "model share (coverage)"; legacy runs
  stay "Not recorded".
- [ ] Green: the new tests and the existing decision-log and bench tests pass; the full workflow passes.

Acceptance: the bench's "model's share of judgements" counts every judgement in the catalogue, cannot be lowered by
logging more checks, and reaches 0 only when no model-made judgement remains.
