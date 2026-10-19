# offline-phone (JavaScript)

Check the app offline and at a phone's size.

- Kind: e2e · Tools: @playwright/test `context.setOffline`, `test.use({ viewport, isMobile, hasTouch })`
- Use for: an offline banner or offline-safe buttons; any page a person may open on a phone.

## Copy
Copy, never retype: `recipes/js/offline-phone/offline.spec.js` and `recipes/js/offline-phone/phone.spec.js`.

## Fill
- Offline: `await page.context().setOffline(true)`, `expect` what the person sees; `setOffline(false)` and the way back.
- Phone: `test.use({...})` at the top of a file of its own. Check no sideways scroll, `toBeInViewport()`, targets at
  least 44 px, `tap()`.

## Run
`npx playwright test recipes/js/offline-phone`

## Don't
- Don't fake offline by stopping the server; don't use a device preset that switches to WebKit when only Chromium is
  installed.
