# 39: Dedicated PLH launcher and config

- [x] Add regressions for launch from any folder, home cwd, model/effort/ports, and plain Pi isolation.
- [x] Package a stable installed copy with plh/pi-local-harness commands and workspace config.
- [x] Update README, validate launcher, and commit/push; install only the concrete tested result.

Validation: launcher/config/installation regressions passed, including safe upgrade and command collisions. The stable home installation passed startup with the real Pi runtime. Legacy global settings/memory were backed up and unrelated settings preserved.
