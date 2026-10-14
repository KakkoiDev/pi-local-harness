# 131: The menu bar status is a button

Kind: code

Request 2026-10-13: "design updated" (re-synced in task 126); build what the agent-scope brief asked for. Inventory of design vs code: 2026-10-13 review.

- [x] Red (browser): #agent-status opens /activity; states rest, attention (caution, framed), idle, offline (opens nothing); phone bar the same at 44px.
- [x] Decided: only-queued reads "1 waiting"; attention names the real state and wins until Activity is opened.

Done 2026-10-14: `#agent-status` is a `.pw-statusbtn` button (the inner `#agent-state` stays the live region) that opens Activity; attention (failed, stopped or interrupted, not yet seen) names the real state ("Stopped · 1 needs attention", "2 need attention" for mixed kinds), is framed and wins until Activity is opened; "1 waiting" when only queued; offline it opens nothing; the phone bar's status is the same button.
