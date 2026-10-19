# flaky-rules (JavaScript)

A flaky test passes and fails with the same code. These rules keep tests deterministic; the tests here show each way
to wait, and `tools/flaky_lint.py` finds the usual causes.

- Kind: rules · Tools: @playwright/test `expect`, `waitForResponse`, `expect.poll`; `tools/flaky_lint.py`
- Use for: every test you write, and every test that failed once and passed on a re-run.

## Rules
1. **Wait for the state, never for time.** No `waitForTimeout`, no `setTimeout` promises. Use `await expect(locator)`
   (it retries), `page.waitForResponse(...)` started before the action, or `expect.poll(fn)` for other values.
2. **Wait for the app to be ready before acting.** A click before the page's script attached its handlers is lost,
   or submits the form natively. The sample app sets `<body data-ready="true">` when ready; the page object's
   `open()` waits for it. (Found by CI: the journey passed on a fast machine and failed on a slower one.)
3. **Every test makes its own data.** A fresh server and database per test (`appURL`), builders for records.
4. **No network.** Stub it (`network-stub`); serve the app on 127.0.0.1.
5. **No clock or randomness you don't control** (`vi.useFakeTimers()`, `vi.setSystemTime()` in unit tests).
6. **Find by role and label**, not CSS classes or positions (`nth(3)`).
7. **A re-run that passes is not a fix.** `retries: 0` in `playwright.config.js`; `forbidOnly: true` stops a
   forgotten `test.only`.

## Copy
Copy, never retype: `recipes/js/flaky-rules/wait-for-state.spec.js`.

## Run
`npx playwright test recipes/js/flaky-rules` and `python3 tools/flaky_lint.py tests/`. A line that truly needs a wait
says why: `// flaky-lint: allow <reason>`.
