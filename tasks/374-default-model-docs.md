# 374: The docs name the default model the harness actually uses

Kind: docs

Request 2026-11-04: "do recommended actions" of docs/reports/outside-tools-study-2026-10-30.md, rank 3: fix the
default-model contradiction in `docs/reference.md:170` and `harness/README.md:46` (F4).

- [x] Red (unit): where `docs/reference.md` or `harness/README.md` names the model in `harness/model.json`, it is the
  one in that file (`ollama/gpt-oss:20b`), so the docs cannot drift from it again unnoticed.
- [x] Both lines name `ollama/gpt-oss:20b`, as `harness/model.json`, `docs/reference.md:353`, `harness/README.md:211`
  and `harness/GUIDE.md` already do.
- [x] Green: `python3 tests/verify_workflow.py`.

## Verification

The docs test failed on `ollama/gemma4:26b-mlx`, passes with the fix, and fails again with the two lines reverted.
