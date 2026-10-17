# 260: Verification cannot be faked; check-ins never strand the plan

Kind: code

Request 2026-10-18 (from Claude's review, docs/reviews/2026-10-18-claude-review.md, P0-1, items 6, 7, 10, 11, 12 and
the P2 lines on Files scope, Accept and Continue, implementation_paths): "fix, test-first … verification cannot be
faked; check-ins never strand the plan".

Scope: gate/paperwork.py, gate/protocol.py, gate/ledger.py, harness/extension.mjs, harness/web_chat.py (one route),
tests/test_trustworthy_verification.py, tests/harness/request-end-timeout.test.mjs and the existing tests whose fake
evidence the new rules refuse.

- [x] Red: the reviewer's repros become real tests (tests/test_trustworthy_verification.py,
  tests/harness/request-end-timeout.test.mjs) and fail before the fixes.
- [x] 1. Red must be real: the `failed_run` shortcut is gone, the harness always proves Red itself; Protocol.runs for
  the project are cleared after a harness commit; a `--help`/`--version` run or a run whose counts show no test ran
  is not Green. Stale Red plus a comment edit, in-request Red plus `--help` Green, and a weakened test all end not
  verified.
- [x] 2. implementation_paths treats common test names as tests (`*.test.*`, `*.spec.*`, `*_test.go`, `__tests__/`,
  `spec/`, `tests?/`); changes outside the task's Files: scope make the task not verified, are named in the reason
  and are left out of its commit.
- [x] 3. A docs or chore planned task is verified only when the request changed a non-paperwork file in its Files.
- [x] 4. Questions and plain messages never derail the plan: a request without writes that is not Build/Continue does
  not attach to the active task, end it or raise a check-in; a choice never creates a task; a planned task that is not
  the active one is never relabelled or completed; a request outside the plan with no content change makes no task
  and no commit.
- [x] 5. A choice pause carries the paused request's `before` for every path, so code written before the pause is the
  resumed request's own.
- [x] 6. Check-ins never strand the plan: `/request/end` uses the long turn timeout; `/phase` returns the pending
  check-in; Implementation can be chosen and the check-in accepted from any phase while it waits; accepting an
  unverified check-in retries the same task (the card names it) instead of skipping it.
- [x] 7. The Red proof runs in a temporary copy of the project and never touches the person's files.
- [x] 8. Recovery: `Paperwork.reopen` (person-only, web route `POST /api/tasks/reopen`) reopens a falsely completed
  task: boxes and roadmap line open again, the plan points at it, a harness commit records it.
- [x] Green: `python3 tests/verify_workflow.py`, `node --test tests/harness/*.test.mjs`.

Result: 21 new unit tests (tests/test_trustworthy_verification.py) and one Node test failed first (observed) and pass
now; the reopen route is covered in tests/test_harness_services.py (404 before, then 200/400). Existing paperwork tests
that faked Red with `protocol.record(False)` on projects with no tests now write a real test first (the harness proves
Red itself). `python3 tests/verify_workflow.py` passed; `node --test tests/harness/*.test.mjs` 165 pass, 0 fail.

Not verified: the browser suites (Playwright is not installed here and installing it is a download); the fake Pi's
`/request/end` timeout changed, so run `python3 tests/browser/run.py all` before release. Not done: the reviewer's
other findings (P0-2 person-only controls reachable by any local process, P0-3 renames, 4, 5, 8, 9, 13-18); `reopen`
is reachable only from the web API, which P0-2 says any local process can call. The Red proof copies tracked and
untracked, non-ignored files and links ignored top-level folders (node_modules, a virtualenv); tests that need `.git`
or ignored files deeper in the tree fail in the copy and leave the task not verified.

## Needs design

- A "Reopen task" control for the person (Plan card or task menu) calling `POST /api/tasks/reopen`; nothing in the UI
  calls it yet.
- The check-in card for an unverified task: the server now sends `question: 'Retry Task'` and `retry: true`, and
  accepting it keeps the same task; the card's copy should say "Retry" instead of "Accept and Continue".
- Showing a pending check-in after a reload: `/api/phase` now returns `check_in` (task, verified, next, reason); the
  page does not read it yet.
- How to show "changes outside the task's Files" in the not-verified message.
