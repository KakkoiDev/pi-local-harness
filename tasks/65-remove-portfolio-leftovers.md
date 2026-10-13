# 65: Remove portfolio leftovers

Kind: config

Request 2026-10-13 (audit #14): remove code from the portfolio site this repo started as.

- [ ] Remove `get_news.py`, `get_news_rss.py`, `utils.py`, `project-ai.html`, `project-db.html`, `js/components.js` and their tests.
- [ ] Remove `/chat` and `/tool_call` from `agent_api.py`, `get_news` from `laya/engine.py` and `specs/judges.md`.
- [ ] Check `sentinel.py` and `watch_dev.sh` (they post to the removed `/chat` on port 8000); remove if nothing current uses them.
- [ ] Green: full suite; readme file table updated.
