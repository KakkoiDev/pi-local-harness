# 138: Compaction marker and Compact Now

Kind: code

Request 2026-10-13: "design updated" (re-synced in task 126); build what the agent-scope brief asked for. Inventory of design vs code: 2026-10-13 review.

- [ ] Red: a compaction is recorded on the conversation (time, message count, summary) and shown as the CompactionMarker after the last summarised message; Agent › Compact Now; toast "Conversation summarised."
- [ ] Fix: the worker must not stop Pi before the extension's compaction finishes.
