# 138: Compaction marker and Compact Now

Kind: code

Request 2026-10-13: "design updated" (re-synced in task 126); build what the agent-scope brief asked for. Inventory of design vs code: 2026-10-13 review.

- [ ] Red: a compaction is recorded on the conversation (time, message count, summary) and shown as the CompactionMarker after the last summarised message; Agent › Compact Now; toast "Conversation summarised."
- [ ] Fix: the worker must not stop Pi before the extension's compaction finishes.

## Scenarios

### US-new Agent › Compact Now summarises the chat, says so, and marks where the summary ends
Given a chat with several messages and Pi idle
When I choose Agent › Compact Now
Then the toast “Conversation summarised.” shows
And a compaction marker appears after the last summarised message

### US-new the compaction marker is still there after a reload
Given a chat that was summarised
When I reload the page
Then the compaction marker is in the same place, with its time and message count
