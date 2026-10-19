### Scenario: The browser finds the manifest, the icon and the service worker
- Given the app open in the browser
- When the browser reads the manifest the page links to
- Then the manifest names the app, its icon loads and the service worker is active
