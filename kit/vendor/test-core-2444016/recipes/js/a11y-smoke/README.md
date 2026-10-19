# a11y-smoke (JavaScript)

A quick accessibility check on every page state a person sees, plus keyboard reach. Not a full audit: it catches
controls without a name, inputs without a label, images without alt, no `lang`, not exactly one `h1`, positive
`tabindex` and duplicate ids.

- Kind: e2e · Tools: @playwright/test, `recipes/shared/a11y-smoke.js` (no extra library)
- Use for: after each journey step that shows a new state (signed in, list filled, dialog open, other language).

## Copy
Copy, never retype: `recipes/js/a11y-smoke/a11y-smoke.js` and `recipes/shared/a11y-smoke.js` (fix the path if you move
them), and the tests `recipes/js/a11y-smoke/a11y-smoke.spec.js`.

## Fill
- Bring the page to the state, wait for it with `expect`, then `expect(await a11yProblems(page)).toEqual([])`.
- Keyboard: `await tabUntil(page, locator)` presses Tab until the control has focus.
- Keep the "finds real problems" test: it proves the check can fail.

## Run
`npx playwright test recipes/js/a11y-smoke`
