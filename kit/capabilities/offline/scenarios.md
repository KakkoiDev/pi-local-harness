### Scenario: The app opens without a connection after the first visit
- Given the app opened once, its service worker active
- When the connection is cut and the page is opened again
- Then the app opens and is ready
