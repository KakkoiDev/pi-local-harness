# 335: Compare shipped starter files, excluding interpreter caches

Kind: chore
No scenarios: only the repository test assertion changes; no application code, screen or command changes.

Request 2026-10-19: finish the handoff and repair issues found by its checks.

- [x] Red: the full workflow failed when a prior import left __pycache__ in the pinned source; the starter correctly omitted those files.
- [x] Compare all shipped source files and explicitly check that the new project has no interpreter cache; retain manifest checksum verification.
- [x] Green: focused starter regression and the full workflow.

The initial full run reported 912 tests, three errors in the starter-copy assertion and four existing optional skips.
No vendor file or runtime copy rule is changed.
