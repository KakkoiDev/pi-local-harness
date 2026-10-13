# 116: The harness compacts long chats before they overflow

Kind: code

Request 2026-10-13: "how do we manage long context that need compaction when the chat gets too long?" Pi 1.1.0 auto-compacts at context > window - 16,384 and keeps 20,000 recent tokens: with a 32,768 window that keeps more than the threshold. Changing Pi settings files would also change plain `pi`, so the policy lives in the harness extension.

- [x] Red (tests/harness/extension.test.mjs): after a turn, when `ctx.getContextUsage()` is above 60% of the window, the extension calls `ctx.compact()` once with instructions to keep the open work and decisions; not while a turn runs; not twice in a row.
- [x] Moved to task 117: the per-job usage reading is only needed by the context meter.
- Not yet seen with the real model: the first chat that passes about 19.6k tokens will show it. With task 114 the history grows by conversation only, so that takes many turns.
