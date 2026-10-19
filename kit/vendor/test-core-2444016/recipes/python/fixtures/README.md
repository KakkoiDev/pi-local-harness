# fixtures (Python)

Start a test already signed in, with sample data in place: pytest fixtures in `conftest.py`.

- Kind: fixtures · Tools: pytest fixtures, pytest-playwright `page`, `page.request`
- Use for: every e2e test that is not about signing in or about an empty start.

## Copy
Copy, never retype: `recipes/python/conftest.py` (all the shared fixtures) and `recipes/python/live_server.py`.
The fixtures in use: `recipes/python/fixtures/test_fixtures.py`.

## What the fixtures give
- `app_url`: your app on a free port with its own temporary database, fresh for every test.
- `signed_in_page`: signs in with one API request (`page.request.post(".../api/login")`); the cookie lands in the
  page's browser context, then the page opens already signed in.
- `sample_tasks`: records made with `builders.py` (recipe data-builders), added through the API.
- `browser_type_launch_args`: `--use-mock-keychain`, `--password-store=basic` and `TEST_CORE_CHROME`.
- `context`: refuses every request that leaves 127.0.0.1.

## Fill
Change `create_app`, the login request and the sample records to your app's. Keep fixtures function-scoped unless
setting them up is slow and they are read-only.

## Run
`pytest recipes/python/fixtures -q`

## Don't
- Don't sign in through the form in every test: one journey tests the form, the rest use `signed_in_page`.
- Don't make a fixture depend on another test having run first.
