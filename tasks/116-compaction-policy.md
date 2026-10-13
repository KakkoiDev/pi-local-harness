# 116: The harness compacts long chats before they overflow

Kind: code

Request 2026-10-13: "how do we manage long context that need compaction when the chat gets too long?" Pi 1.1.0 auto-compacts at context > window - 16,384 and keeps 20,000 recent tokens: with a 32,768 window that keeps more than the threshold. Changing Pi settings files would also change plain `pi`, so the policy lives in the harness extension.

- [ ] Red (tests/harness/extension.test.mjs): after a turn, when `ctx.getContextUsage()` is above 60% of the window, the extension calls `ctx.compact()` once with instructions to keep the open work and decisions; not while a turn runs; not twice in a row.
- [ ] Each job records its context usage after the turn (`job.usage`) for the context meter (task 117).
