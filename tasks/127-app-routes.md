# 127: Routes /activity and /gate

Kind: code

Request 2026-10-13: "design updated" (re-synced in task 126); build what the agent-scope brief asked for. Inventory of design vs code: 2026-10-13 review.

- [x] Red: `/activity` and `/gate` serve the app; parseRoute gives the app window; old `/p/<id>/activity|gate` redirect; the close box returns to the last project route.
- [x] js/router.mjs, harness/web_chat.py, js/chat.mjs.
- The return path is kept in browser state, so it survives a reload of /activity.
- Found: window boxes (close, zoom, Review close) carried data-command but were never wired; clicks did nothing (⌘W worked). Now dispatched to the same commands as the menus.
