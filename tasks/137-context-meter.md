# 137: Context meter in Chat

Kind: code

Request 2026-10-13: "design updated" (re-synced in task 126); build what the agent-scope brief asked for. Inventory of design vs code: 2026-10-13 review.

- [ ] Red: the extension writes per-turn usage; the conversation stores it; #context-meter shows "Context 14k of 32k", near state at 50%, "summarised HH:MM" after compaction; phone footer without the bar.
- [ ] Decided: shows the usage Pi reports, which includes the chosen context.
