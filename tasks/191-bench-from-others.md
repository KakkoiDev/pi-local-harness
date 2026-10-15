# 191: Bench: regression tests, pass^k, first try, the bare baseline, a scripted user

Kind: code

Request 2026-10-15: "check how others build similar bench tools" then "do recommended": SWE-bench's PASS_TO_PASS,
τ-bench's pass^k and simulated user, Aider's first attempt, Terminal-Bench's neutral agent.

- [x] Red (python, test_bench): a run records its regression tests, whether it is resolved, the user's turns, first try
  and mode; the summary gives resolved, first try, verified and pass^k per model, build, prompt level and mode; when the
  fake Pi asks a question the scripted user answers once.
- [x] Red (python, test_gate_rules; node, extension test): bare mode keeps Gate's core rules (G-001 to G-007) and drops
  the rest; the extension registers no extra tools, adds no rules summary, never wakes Pi, keeps no paperwork.
- [x] Scenarios name their regression tests and replies; `bench check` also requires the regression tests to pass at
  the start and with the solution; `--bare`; `/bench` shows the new columns.
