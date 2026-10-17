# 311: Test runs are sandboxed

Kind: code

From docs/reviews/2026-10-18-claude-review.md (P1-A, P2 runners) and GPT-Sol's report ("approved project tests execute
project code under the account's permissions"). In Implementation a test run executes code the model wrote, with the
person's permissions: it can write anywhere, delete, use the network or call the workbench.

- [ ] Run Gate-allowed test commands under macOS `sandbox-exec` (a profile allowing writes only in the project, a temp
  folder and the toolchain cache, no network) with a scrubbed environment (no PI_HARNESS_*, no tokens); Linux equivalent
  noted for the port.
- [ ] A clear message when the sandbox refuses something a test legitimately needs, and a person-approved way to widen it.
- [ ] Tests: a test that writes outside the project, opens a socket, or reads the token fails; normal starter tests pass.
