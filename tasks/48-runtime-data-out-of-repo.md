# 48: Keep runtime records out of the repository

Audit 2026-10-13: recovery trips appended to the tracked `incident_log.md` and
`session.log` in the repository, and the Laya audit log defaulted to `session.log`
there, so normal use dirtied the checkout. Compiled `__pycache__` files, a vim swap
file, and `session.log` were tracked despite `.gitignore`.

- [x] Red: recovery records must land in `PI_AGENT_DATA`, not the module root.
- [x] Red: the Laya audit log must default to `PI_AGENT_DATA/laya-audit.log`.
- [x] Write `incident_log.md`/`session.log` under the data directory; move the audit default.
- [x] Untrack `__pycache__`, `.ideas.md.swp`, `session.log`; ignore swap and log files.
- [x] Green: Node 22/22 and the services test pass; update roadmap.

The repository `incident_log.md` remains the curated history; runtime trips no longer append to it.
