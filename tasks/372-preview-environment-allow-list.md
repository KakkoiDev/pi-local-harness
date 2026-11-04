# 372: The Preview's app gets no secret from the person's environment

Kind: code
No scenarios: the person sees and types the same; only the environment the app's process starts with changes.

Request 2026-11-04: "do recommended actions" of docs/reports/outside-tools-study-2026-10-30.md, rank 1: Preview
environment allow-list (OS-2, OS-1 step a), which fixes F1's environment half.

- [x] Red (unit): an app started by the Preview, with fake `GITHUB_TOKEN`, `OPENAI_API_KEY` and `PI_HARNESS_TOKEN` set
  in the harness's environment, sees none of them; it still gets PATH, HOME, APP_LANG and the Tailwind variables.
- [x] Red (unit): the variables a sandboxed run keeps are one list, `gate.sandbox.ENVIRONMENT`, and
  `gate/sandbox-run.sh` keeps exactly those.
- [x] Build the Preview's environment from that allow-list (plus TMPDIR, APP_LANG and the Tailwind variables), not
  from the harness's whole environment minus `PI_*`.
- [x] Green: `python3 tests/verify_workflow.py`.

## Verification

Both Red tests failed first (the app saw `GITHUB_TOKEN`; `gate.sandbox` had no `ENVIRONMENT`), pass now, and the
environment test fails again with the Preview change reverted. Only fake values were used. `tests/test_preview.py`
and `tests/test_sandbox.py` pass under Python 3.13; on this Mac the Homebrew Python 3.14 has a stray `tests` package
(from cryptography) that breaks the sandbox probes before and after this change.
