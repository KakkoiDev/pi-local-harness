# 139: New Conversation and Earlier Conversations

Kind: code

Request 2026-10-13: "design updated" (re-synced in task 126); build what the agent-scope brief asked for. Inventory of design vs code: 2026-10-13 review.

- [ ] Red: Agent › New Conversation… (alert, default New Conversation) starts a fresh chat for the project; the old one is kept read only (composer hidden, "Earlier conversation · read only", Back to Current); "‹ Earlier conversation" line; Agent › Earlier Conversations ▸ newest first.
- [ ] Menu bar submenus.

## Scenarios

### US-new Agent › New Conversation… asks first, then starts a fresh chat and keeps the old one
Given a project with a chat
When I choose Agent › New Conversation… and confirm New Conversation
Then the chat is empty and ready
And an “‹ Earlier conversation” line leads to the old one

### US-new an earlier conversation opens read only, and Back to Current returns
Given a project with an earlier conversation
When I open it from Agent › Earlier Conversations (newest first)
Then it shows “Earlier conversation · read only” with no composer
And Back to Current returns to the current chat
