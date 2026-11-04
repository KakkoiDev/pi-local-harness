# 376: The sandbox profile keeps its boundary for every setting

Kind: code
No scenarios: tests only; nothing the person sees or types changes.

Request 2026-11-04: "do recommended actions" of docs/reports/outside-tools-study-2026-10-30.md, rank 5: profile
property tests (OS-4), after OpenShell's prover, without an SMT solver.

- [x] Red (unit): over every network setting and both data-folder layouts (a project elsewhere, a project inside the
  data folder), a small reader of the profile text, where later rules win, finds that no profile allows a write under
  the project's `.git` or the data folder (except `toolchain`), no profile allows reading a `SECRET_FOLDERS` entry or
  the data folder's files, and only `internet` allows all network. Each property fails when the profile is broken on
  purpose (the `.git` rule, the secret rule, the network rule).
- [x] Green: `python3 tests/verify_workflow.py`.

## Verification

The properties pass for the current profile over 3 network settings and 2 layouts. Red: each one fails on a profile
broken on purpose (`test_each_property_catches_a_broken_profile`), and with the `.git` write rule removed from
`gate/sandbox.py` itself, the boundary test failed (`'allow' != 'deny'`) until it was restored. The reader models
only the rule forms `profile()` writes; Seatbelt itself is still exercised by the behaviour tests above it.
