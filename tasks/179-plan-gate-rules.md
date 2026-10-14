# 179: Gate's rules as one always-enforced system

Kind: code

Request 2026-10-15: "maybe we should take the gate control base (what it will enforce) out of the AGENT.md file and make
it a separate system that we want always enforced."

- [x] Plan: `docs/plans/179-gate-rules.md` (one registry of rules in code, each with a message, a lesson and a test;
  `/gate rules`; the prompt summary generated from it; AGENT.md trimmed; new rules from `docs/lessons/` in phase 3).
- [x] Go-ahead 2026-10-15 ("do it and commit and push"); defaults taken: strict, scope per rule.
- [x] Red (python, `tests/test_gate_rules.py`; node, extension test): every rule complete and named in its test; decisions
  and audits carry their rule id; AGENT.md no longer restates the commit order; G-008, G-009, G-010, G-012; `/gate rules`;
  G-011 stops the turn; the prompt carries the summary.
- [x] `gate/rules.py` (G-001 to G-012); `engine.rejection` returns (rule, reason); the ledger refuses with a rule and records
  it on each event; the protocol answers "failed run seen", "passing now" and "verification" for G-010 and G-012.
- [x] G-011 in the extension (block, abort, notice; the web request fails with the reason); an edit of a missing file is a
  G-004 decision, not a Gate error.
- [x] G-012 in web requests: the answer and its record end "Not verified (G-012)" when code changed and no passing run
  was seen on it.
- [x] `harness/gate-rules.md` generated (`python3 -m gate.rules`) and put in every system prompt; AGENT.md points to
  `/gate rules`.
- [x] Docs: contributing guide, console guide, lessons L-002 to L-006 and their index, plan status.
