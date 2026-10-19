# 219: Updating Pi Workbench is easy: /update

Kind: code

The person, 2026-10-15: "I want to make it easy for the user to update the app when a new version comes out."

- [x] `harness/updates.py`: the clone Pi Workbench was installed from asks GitHub whether a new version is there and
  what changed, in plain words (no "feat:", no task numbers); an update is only a fast-forward; never over edits that
  are not committed or over the clone's own commits (it says why). Tests (python, `tests/test_updates.py`) with
  throwaway repositories as GitHub.
- [x] Terminal: `/update` (what is new) and `/update now` (asks first; the new version installs when plh starts again,
  through the existing auto_update). CONSOLE.md and the guide ("How do I update Pi Workbench?").
- [ ] The web: π › Check for Updates… and an "update available" mark: in the round 9 brief for the designer (design/briefs/round-9.md).
- [ ] A check at start (daily, quiet) once the designer has drawn where it shows.

## Scenarios

### US-new π › Check for Updates… lists what is new in plain words, and Update says to restart plh
Given a newer version of Pi Workbench is on GitHub
When I choose π › Check for Updates… and then Update
Then the sheet lists the changes in plain words
And after Update it says “Updated. Restart plh to use it.”

### US-new Check for Updates… says why it will not update a copy with its own commits
Given my copy of Pi Workbench has commits that are not on GitHub
When I choose π › Check for Updates…
Then it says the copy has its own changes and is not updated automatically

### US-new a newer version found by the daily check puts a mark on the π menu
Given the daily check found a newer version
When I open the workbench
Then the update-available mark shows where the designer drew it
