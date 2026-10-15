# 192: The harness proves Red itself; Pi need not work test-first

Kind: code

Strategy 1 of the ones picked on 2026-10-15 ("go ahead with that order"). The bench's feature-slugify run was solved
but not verified: Pi wrote its test after the code, so Gate never saw a failing run first, and the harness would not
commit correct work for an order a small model does not keep. Borrowed from SWE-bench's FAIL_TO_PASS.

- [x] Red (python, test_paperwork): code first, then a passing test: at the end the harness sets the code change aside,
  runs the last passing test command (it fails), puts the change back (it passes), writes "Red (proved by the
  harness)" and commits; tests that pass without the change do not verify it and say so; the change is always put back.
- [x] `Paperwork.prove_red`; a file with other edits from before the request is not set aside (the reason says so).
- [x] Pi's instructions (harness/AGENTS.md and AGENT.md): tests before or after the change; the upgrade in
  harness/install.py replaces either earlier wording (test_plh).
