# 311: Test runs are sandboxed

Kind: code

From docs/reviews/2026-10-18-claude-review.md (P1-A, P2 runners) and GPT-Sol's report ("approved project tests execute
project code under the account's permissions"). In Implementation a test run executes code the model wrote, with the
person's permissions: it can write anywhere, delete, use the network or call the workbench.

- [x] Run Gate-allowed test commands under macOS `sandbox-exec` (a profile allowing writes only in the project, a temp
  folder and the toolchain cache, no network) with a scrubbed environment (no PI_HARNESS_*, no tokens); Linux equivalent
  noted for the port.
- [x] A clear message when the sandbox refuses something a test legitimately needs, and a person-approved way to widen it.
- [x] Tests: a test that writes outside the project, opens a socket, or reads the token fails; normal starter tests pass.

Notes (2026-10-18): gate/sandbox.py and gate/sandbox-run.sh; Gate hands the extension the sandboxed command for every
allowed test run (the audit keeps the allowed one). The Red proof (gate/paperwork.py), Project Start's base check
(kit/capabilities.py), Add a Capability's full suite (harness/project_start.py) and /audit (harness/audit.py) run the
same way; kit/blocks/check.py only parses HTML and runs no project code. Linux: bubblewrap, written out in
gate/sandbox.py, not built. The review's P2 runner list was already refused by task 261; `--cov-report=html:/tmp/x`
(a path after a kind) is now refused too, and the sandbox neutralises what a refused list might miss.
