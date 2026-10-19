# 137: Context meter in Chat

Kind: code

Request 2026-10-13: "design updated" (re-synced in task 126); build what the agent-scope brief asked for. Inventory of design vs code: 2026-10-13 review.

- [ ] Red: the extension writes per-turn usage; the conversation stores it; #context-meter shows "Context 14k of 32k", near state at 50%, "summarised HH:MM" after compaction; phone footer without the bar.
- [ ] Decided: shows the usage Pi reports, which includes the chosen context.

## Scenarios

### US-new the chat shows how much of the context is used, and turns to near at half
Given a chat where Pi answered and reported its usage
When I look at the context meter in Chat
Then it reads “Context 14k of 32k” for that usage
And it shows the near state once usage passes half

### US-new after a compaction the context meter says when it was summarised
Given a chat whose conversation Pi summarised
When I look at the context meter
Then it reads “summarised HH:MM” with the time of the compaction

### US-new on the phone the context shows in the footer without the bar
Given a chat with usage, at phone width
When I look at the chat footer
Then the context words show and the bar does not
