### Scenario: The app opens again on the same database file
- Given the app ran once on a database file
- When it starts again on that file
- Then it opens as before, and no migration ran twice
