# offline-phone (Python)

Check the app offline and at a phone's size.

- Kind: e2e · Tools: pytest-playwright `context.set_offline`, `browser_context_args` (viewport, touch)
- Use for: an offline banner or offline-safe buttons; any page a person may open on a phone.

## Copy
Copy, never retype: `recipes/python/offline-phone/test_offline.py` and `recipes/python/offline-phone/test_phone.py`.

## Fill
- Offline: `page.context.set_offline(True)`, then `expect` what the person sees (banner, disabled buttons);
  `set_offline(False)` and `expect` the way back.
- Phone: keep the `browser_context_args` override at the top of a file of its own; every test in that file runs in
  the phone context. Check no sideways scroll, the main action `to_be_in_viewport()`, targets at least 44 px, `tap()`.

## Run
`pytest recipes/python/offline-phone -q`

## Don't
- Don't fake offline by stopping the server: that tests errors, not offline.
- Don't use a device preset that switches the browser to WebKit when only Chromium is installed; set the size here.
