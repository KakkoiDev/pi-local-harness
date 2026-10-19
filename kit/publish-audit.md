# {number}: Ready to publish

Kind: code
Files: README.md, manifest.webmanifest, app/, static/, js/, messages/, tests/

The harness runs the publication audit (the same checks as `/audit`) when this task's work ends, in the web workbench and
in the terminal. Each box records its command. Pi may change the app's code and its descriptions (the Files above) to make
the checks pass: remove an unused file or function, fix a type, name the app in the README and the manifest. No new feature.

- [ ] No unused files: run the entry-point reachability check.
- [ ] No unused code: check JavaScript exports or Vulture at 80% confidence.
- [ ] Every referenced file exists: run the project's referenced-files test.
- [ ] Types: run the project's strict type check.
- [ ] All tests pass: run and log the full test suite.
- [ ] The README and the manifest describe this app: check names and starter leftovers.

Done when: Every publication check passes on the current app and the implementation tasks are complete.
