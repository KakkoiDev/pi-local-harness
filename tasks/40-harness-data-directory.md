# 40: Correct default harness data directory

- [x] Regress first-launch creation and preservation of existing config.
- [x] Use ~/pi-local-harness-data across launcher, services, and installer; update docs.
- [x] Validate, update installed runtime, commit, and push.

Validation: first-launch test failed with the old folder name, then passed after the correction. Launcher and harness regressions pass. Existing config is preserved on subsequent launches.
