# 219: Updating Pi Workbench is easy: /update

Kind: code

The person, 2026-10-15: "I want to make it easy for the user to update the app when a new version comes out."

- [x] `harness/updates.py`: the clone Pi Workbench was installed from asks GitHub whether a new version is there and
  what changed, in plain words (no "feat:", no task numbers); an update is only a fast-forward; never over edits that
  are not committed or over the clone's own commits (it says why). Tests (python, `tests/test_updates.py`) with
  throwaway repositories as GitHub.
- [x] Terminal: `/update` (what is new) and `/update now` (asks first; the new version installs when plh starts again,
  through the existing auto_update). CONSOLE.md and the guide ("How do I update Pi Workbench?").
- [ ] The web: π › Check for Updates… and an "update available" mark: in the round 8 brief for the designer.
- [ ] A check at start (daily, quiet) once the designer has drawn where it shows.
