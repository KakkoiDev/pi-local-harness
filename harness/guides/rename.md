---
triggers: rename, renamed, refactor, move, moved, call it, confusing name, everywhere
---
A rename or refactor: find every occurrence first (grep -rn "<name>" across code, tests and docs, and imports), change
them all, run the tests, then grep again to confirm none are left. Behaviour must not change.
