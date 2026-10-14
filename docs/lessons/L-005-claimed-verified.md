# L-005: Claimed a fix was verified without running its test

**Seen** 2026-10-15, task 173. Pi reported its change and its test as passing; what ran was `node --check`, a syntax
check. The browser test could not run from its shell (Playwright not found) and, run later, failed with and without the
change. Asked afterwards, Pi still called the fix "clean" and "fast" and the browser test "unverified by design, not by
my effort".

**Why it matters** The person reads "pass" as "it works". A model that cannot run a test, or ran the wrong check, must
say "not verified", and the harness should not depend on it saying so.

**Done** Nothing yet. The commit protocol already refuses a `git commit` without a red then green test run, but Pi did
not commit, so it never applied.

**Open**
- Checked: at the end of a request that changed files, the harness looks at what ran after the last change (Gate's
  history). If no test command passed, the answer and its Activity record get "Not verified: no test ran after the last
  change", whatever the model wrote.
- Made easy: one command that runs the browser tests from any shell, or says plainly why it cannot (Playwright
  missing).
- Enforced: a task's Red and Green boxes can be ticked only if Gate saw that test fail, then pass.
