# {number}: Ready to publish

Kind: code

The harness checks this task with `/audit` after the app's work is complete. Each box records its command.

- [ ] No unused files: run the entry-point reachability check.
- [ ] No unused code: check JavaScript exports or Vulture at 80% confidence.
- [ ] Every referenced file exists: run the project's referenced-files test.
- [ ] Types: run the project's strict type check.
- [ ] All tests pass: run and log the full test suite.
- [ ] The README and the manifest describe this app: check names and starter leftovers.

Done when: Every publication check passes on the current app and the implementation tasks are complete.
