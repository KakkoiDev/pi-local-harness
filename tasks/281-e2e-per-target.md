# 281: End-to-end tests for each package, and the one-rule-change proof

Kind: code

Plan 253, proof steps 2 to 5. Packaging is not complete because files were produced: each packaged artifact runs and its
behaviour is checked (CONSTITUTION.md Article 9). Every run is logged (task 228); a target that cannot run says so
(task 180), never passes silently.

Files: tests/browser/packaging.cjs, tests/browser/run.py (a "packaging" suite), tests/fixtures/ (a scratch copy of the
acceptance app), docs/plans/253-one-app-many-packages.md (results).

- [ ] Red: the packaging suite fails because no target journey exists.
- [ ] Server: build dist/server in a scratch copy, start it on a free port, and in the headless shell at phone and
  desktop sizes: an empty title shows the 422 message, create, set priority, edit, list order, reload keeps the data,
  delete.
- [ ] Web: serve dist/web as static files, the same journey; then go offline (network emulation) and reload: the app
  starts, reads and writes notes, and the data is still there after another reload.
- [ ] Mobile: the bundled webDir at phone size with the native bridge stubbed, the same journey; with the Android
  toolchain installed, install the APK on an emulator, create a note, stop and relaunch the app, the note is there;
  without it, the suite reports "did not run" for that step. iPhone stays a written check with the person.
- [ ] One rule change: in the scratch copy, change the priority order rule in app/logic only, rebuild every target, and
  the three journeys show the new order with no other file changed.
- [ ] Green: the suite passes for server, web and the stubbed mobile step; results, sizes and start times recorded in
  plan 253; the full workflow passes.

Acceptance: the same source, packaged three ways, passes the same journey on each, and one change in app/logic reaches
all three.
