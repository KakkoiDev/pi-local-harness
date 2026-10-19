# a11y-smoke (Python)

A quick accessibility check on every page state a person sees, plus keyboard reach. Not a full audit: it catches what
is most often broken (controls without a name, inputs without a label, images without alt, no `lang`, not exactly one
`h1`, positive `tabindex`, duplicate ids).

- Kind: e2e · Tools: pytest-playwright, `recipes/shared/a11y-smoke.js` (no extra library)
- Use for: after each journey step that shows a new state (signed in, list filled, dialog open, other language).

## Copy
Copy, never retype: `recipes/python/a11y-smoke/a11y_smoke.py` and `recipes/shared/a11y-smoke.js` (fix the path in
`CHECK` if you move them), and the tests `recipes/python/a11y-smoke/test_a11y_smoke.py`.

## Fill
- Bring the page to the state, wait for it with `expect(...)`, then `assert a11y_problems(page) == []`. The list says
  what to fix.
- Keyboard: `tab_until(page, locator)` presses Tab until the control has focus.
- Keep the "finds real problems" test: it proves the check can fail.

## Run
`pytest recipes/python/a11y-smoke -q`

## Don't
- Don't silence a problem by adding `aria-label` everywhere: a visible `<label>` helps everyone.
- Don't treat a passing smoke check as a full accessibility review.
