# 268: System 1 decides a task's Kind and write scope; the model only proposes content

Kind: code

Plan 267, judgements J-01, J-02, J-11 (inventory). Today the model's propose_plan `kind` decides whether Red and Green
are laid out and required (paperwork.py:316, 331; protocol.py:292-293: "Kind: chore" skips Red), and its `files` become
the write scope, with no Files line meaning every file is allowed (planning.py:32). Review P1-7: "The model picks the
kind." Builds on the review's verification repair (task 260) where they touch the same code.

Files: gate/paperwork.py (propose_plan, task_for), gate/protocol.py (task_kind, missing), gate/planning.py
(file_allowed, requires_plan), gate/kinds.py (new: the Kind rule), harness/planning.mjs (tool schema),
harness/AGENTS.md and harness/guides/planning.md (remove the kind judgement), tests/test_task_kind.py,
tests/test_scope.py.

- [ ] Red: tests fail for (a) a plan whose Files include `app/main.py` proposed with kind "chore" or "docs" is laid out
  without Red/Green; (b) a task with no Files line allows any write; (c) a Kind line edited in Planning changes the
  verification path; (d) requires_plan treats "fix the typo" as needing no plan (Article 8: small fixes too).
- [ ] gate/kinds.py, rule K-001: Kind derived from Files by code: any implementation path (paperwork.implementation_paths)
  makes `code`; only documentation paths (protocol.is_documentation) make `docs`; only configuration paths listed in
  kit/conventions (lockfiles, .gitignore, manifest) make `chore`, which still needs Green when anything executable
  changed. The model's `kind` argument is dropped from the schema; a value sent anyway is ignored and logged.
- [ ] Rule K-002: an empty Files list is refused at propose_plan with a message the model can act on; "no Files line"
  never means "everything".
- [ ] Rule K-003: companions added by code, not the model: for each code file, its test file per the starter's
  conventions; for a new table, the next migration number.
- [ ] Scope widening in Implementation: a write outside Files becomes one system card "Allow <path> for this task?"
  with the recommended option chosen by code (allow when the path is a K-003 companion of a file in scope; otherwise
  "Keep the scope and re-plan"), "Something else…" last; Run on its own takes the recommendation and lists it.
- [ ] The "small change" regex in requires_plan is removed (every request follows the phases); change size is measured
  after the fact from the diff, for display only.
- [ ] Every Kind, Files and widening decision written to decisions.jsonl as code with its rule id (K-001 to K-003).
- [ ] Green: the new tests and the existing paperwork, phase and completion tests pass; the full workflow passes.

Acceptance: no model-supplied value decides a task's verification path or write scope; the approval card (task 273)
can show Kind and Files with the rule that set them.
