# 130: Projects window: Projects group and Agent section

Kind: code

Request 2026-10-13: "design updated" (re-synced in task 126); build what the agent-scope brief asked for. Inventory of design vs code: 2026-10-13 review.

- [x] Red (browser): Agent rows Activity/Gate with live meta ("1 running · 1 waiting", "Nothing running", "1 needs attention"; "12 checks · 1 blocked", "No checks yet"), aria-current on the open one; project meta running / waiting / failed.
- [x] Attention is marked seen when Activity opens.

Done 2026-10-13: `#projects-nav` holds the Projects group (`#project-list`) and the Agent group (`#agent-activity`, `#agent-gate`, live meta from `/api/workspace` jobs and gate counts). Attention = failed, stopped or interrupted requests whose ids were not on screen when Activity was last open (`plh.activitySeen`). Fence icon added to `design/icons.mjs`.
Also, from the person's reports during this task: the phone Record button keeps its 44px shape while recording (dot + elapsed time, `aria-label` "Stop Recording"); Chat ⌘1 and Work ⌘2 are in the Window menu and work from Activity and Gate (they open the last project, as the round-3 design confirms), and the app windows' info bar starts with "‹ project" on the desk.
