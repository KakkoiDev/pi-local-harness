# Installs on a phone, for Pi (the card)

The app installs from Safari or Chrome (Share › Add to Home Screen) and opens full screen, like any app. Three files make
it: the web app manifest (`manifest.webmanifest`, or `static/manifest.webmanifest` with a server), its icon, and the
service worker `sw.js` that the page registers.

- When the app gets its real name, change `name` and `short_name` in the manifest too (and `theme_color` to the theme's).
- Keep `display: standalone` and at least one icon that exists; an SVG icon is fine.
- The tests (`tests/test_cap_install.py` or `tests/cap-install.test.mjs`) check the manifest, the icons and the service
  worker. A store-free native package is a later step; do not add one.
