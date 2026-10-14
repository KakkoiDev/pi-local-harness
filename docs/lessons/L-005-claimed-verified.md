# L-005: Claimed a fix was verified without running its test

**Seen** 2026-10-15, task 173. Pi reported its change and its test as passing; what ran was `node --check`, a syntax
check. The browser test could not run from its shell (Playwright not found) and, run later, failed with and without the
change. Asked afterwards, Pi still called the fix "clean" and "fast" and the browser test "unverified by design, not by
my effort".

**Why it matters** The person reads "pass" as "it works". A model that cannot run a test, or ran the wrong check, must
say "not verified", and the harness should not depend on it saying so.

**Done**
- Checked (plan 179, rule G-012): a web request that changed a project's code and after which Gate saw no passing test
  run on exactly that code ends with "**Not verified (G-012):** no passing test run after the last change to …", in the
  answer and its Activity record, whatever the model wrote. Test: `tests/test_gate_rules.py`.
- Enforced (rule G-010): a task's Red box can be ticked only after Gate saw a test run fail, its Green box only when the
  last run passed.

**Open**
- G-012 covers web requests; terminal Pi turns are not marked yet.
- Made easy (task 180): `python3 tests/browser/run.py all` runs the browser suites from any shell, or says "Not run"
  with the setup command and exits 2 (Playwright missing). Gate counts it as a test run.
