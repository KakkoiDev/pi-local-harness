# Lessons already learned

From Pi Workbench, recorded when test-core was planned (plan 328, 2026-10-19). Newest lessons go at the end.

## 1. Headless Chromium on macOS: `--use-mock-keychain` and `--password-store=basic`

Every Chromium a test starts must pass both flags:

```js
chromium.launch({ headless: true, args: ['--use-mock-keychain', '--password-store=basic'] })
```

```python
browser_type.launch(headless=True, args=["--use-mock-keychain", "--password-store=basic"])
```

Without them, every test browser started with a scratch home asks macOS for a keychain ("A keychain cannot be found to
store Chromium"), again and again, one dialog per browser.

**Never press "Reset To Defaults" on that dialog.** It resets the person's login keychain. Press Cancel, and fix the
launcher instead.

Pi Workbench fixed this for every launcher on 2026-10-19 and guards it with a test that reads every launcher; test-core
does the same (every config and fixture that launches Chromium is checked for both flags).

## 2. Tests never reach the network

Downloads have stand-ins inside the recipes (in Pi Workbench: uv/uvx and the Tailwind binary are small scripts on the
test's `PATH`). Network calls from the page are stubbed with `page.route`; calls from code are stubbed at the client.
Apps under test are served locally on port 0.

## 3. Wait for state, never for time

A fixed sleep is either too short on a slow machine or wastes time on a fast one. Wait for the element, the response or
the value. A test that passes alone and fails in the full suite is a bug in the test (shared state, order or time).

## 4. Wait for the app to be ready before the first click

A click that lands before the page's script has attached its handlers is lost, or submits a form natively (putting
its fields in the URL). Found by test-core's first CI run: the sign-in journey passed on a fast laptop and failed on
the slower CI machine. The app marks itself ready (`<body data-ready="true">`); page objects wait for it in `open()`.

## 5. Live journeys are opt-in

Journeys against a real local model or a real service are separate from the offline gate and never block it.
