# 65: Remove portfolio leftovers

Kind: chore

Request 2026-10-13 (audit #14): remove code from the portfolio site this repo started as.

- [x] Remove `get_news.py`, `get_news_rss.py`, `utils.py`, `project-ai.html`, `project-db.html`, `js/components.js` and their tests.
- [x] Remove `/chat` and `/tool_call` from `agent_api.py`, `get_news` from `laya/engine.py` and `specs/judges.md`.
- [x] Check `sentinel.py` and `watch_dev.sh` (they post to the removed `/chat` on port 8000); remove if nothing current uses them.
- [x] Green: full suite; readme file table updated.

Also removed: `sentinel.py` (retired per harness/README), its tests `test_sentinel.py` and
`test_canary.py` (the live canary is `harness/memory.mjs`, tested in `tests/harness/`),
`watch_dev.sh`, and `run_server` from `agent_api.py`. `specs/03_sentinel.md`,
`specs/07_lifecycle.md`, and `specs/04_pilot_console.md` still describe the old stack.
