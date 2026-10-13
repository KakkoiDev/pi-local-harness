# 99: plh follows the checkout

Kind: code

Request 2026-10-13: "when using plh I get the old build, why? do all the installs and make sure that plh gets auto-udpated as we progress on this project"

Why: `plh` runs the copy `harness/install.py` made in `~/.local/share/pi-local-harness` (last run 2026-10-13 01:23, before tasks 69-98). Pulling or committing never refreshed it.

- [x] Red (`tests/test_auto_update.py`): install records source and commit; launch installs a new commit first; uncommitted edits stay out; same commit does no work; `auto_update: false` opts out; a missing checkout still starts; three backups kept.
- [x] `harness/install.py`: writes `install.json` (`source`, `commit`, `prefix`, `agent`, `data`); keeps the three newest `pi-local-harness.before-*`.
- [x] `plh.py`: on launch, if the checkout's HEAD differs, install `git archive HEAD` and re-exec the new `plh`; any failure warns and starts the installed build.
- [x] readme: auto-update, `auto_update`, restart still needed for a running session.
- [ ] Reinstall on this Mac and launch the new build.
