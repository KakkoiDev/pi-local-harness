# 31: Block massive destructive shell operations

Allow normal shell commands. Deterministically reject obvious broad recursive deletes
and disk formatting/writes; do not treat every shell command as high risk.

- [x] Add regression tests and confirm red for normal commands and destructive variants.
- [x] Implement the guard and update existing policy tests/documentation.
- [x] Verify green, update the roadmap, and commit the completed task.

Regression evidence: blocked feedback initially lacked a reason (red); 14 policy/ledger/guard tests, 12 Node lifecycle tests, and real HTTP checks pass. Blocking occurs before execution and directs the next model reasoning step.
