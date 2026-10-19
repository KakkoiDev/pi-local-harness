# fixtures (JavaScript)

Start a test already signed in, with sample data in place: Playwright fixtures made with `test.extend`.

- Kind: fixtures · Tools: @playwright/test fixtures, `page.request`
- Use for: every e2e test that is not about signing in or about an empty start.

## Copy
Copy, never retype: `recipes/js/fixtures.js` (all the shared fixtures; import `{ test, expect }` from it instead of
from `@playwright/test`) and `recipes/js/data-builders/builders.js`. In use: `recipes/js/fixtures/fixtures.spec.js`.

## What the fixtures give
- `appURL`: your app on a free port with its own database in the test's output folder, fresh for every test.
- `signedInPage`: signs in with one API request (`page.request.post('/api/login')`); the cookie lands in the page's
  context, then the page opens already signed in.
- `sampleTasks`: records made with the builders, added through the API.
- `context`: refuses every request that leaves 127.0.0.1.

For a slow login shared by many tests, Playwright's `storageState` (save once in a setup project, reuse) is the next
step; with a fresh server per test, signing in by API is simpler and just as fast.

## Paths after copying
`fixtures.js` imports `../../sample_app/server.js` and `./data-builders/builders.js`: point both at your app and at
where you put `builders.js`.

## Run
`npx playwright test recipes/js/fixtures`

## Don't
- Don't sign in through the form in every test: one journey tests the form, the rest use `signedInPage`.
- Don't make a fixture depend on another test having run first.
