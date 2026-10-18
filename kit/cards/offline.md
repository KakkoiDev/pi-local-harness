# Works offline, for Pi (the card)

The app has no server: its data is in IndexedDB on the device (`js/store.mjs`), and `sw.js` caches the files the page
needs, so it opens without a connection.

- Every file the page loads goes in the literal `SHELL` list in `sw.js`: each new module in `js/`, each language file
  in `messages/`, each vendored library. `tests/cap-offline.test.mjs` names any file missing from it.
- Change the cache name (`app-v1` → `app-v2`) when the list changes, so phones pick up the new files.
- Keep the data in `js/store.mjs`; rules stay pure in `js/logic/`. Never `fetch` data from another site for the app to
  work: it must work on a train.
