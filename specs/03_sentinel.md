# Sentinel reliability layer

Implemented by the pi extension in `harness/extension.mjs`, `harness/watch.mjs`, and
`harness/memory.mjs`. The standalone log-based daemon is retired.

## Deterministic loop detection

Every 10 seconds, compare consecutive triples within the latest 100 nonempty,
trimmed streamed thought lines. Two identical, non-overlapping occurrences trigger
recovery. Chunk boundaries are buffered. Detection does not use semantic similarity
or an LLM judgment.

## Thought-phase hang detection

Only an active thought phase is eligible. Recovery triggers if pi reports no active
operation while still in that phase, or if streamed activity has stopped for the
configured timeout (`PI_HANG_MS`, default 60000 ms). Idle sessions and tool execution
are excluded. Backend CPU/GPU utilization is not exposed by pi's extension API;
stream inactivity is the deterministic fallback.

## Instruction drift and recovery

A completed assistant text response must start with [CANARY]. Aborted/error
responses and tool-only messages are exempt.

Recovery aborts the active operation, waits for agent_end, compacts, and reasks the
original question with preceding reasoning, incident explanation, original image
attachments, and the current global AGENTS.md. If compaction fails, the full recovery
context is still supplied in the reask. Automatic recovery is limited to one retry
per user question. Each incident is logged and its predefined lesson is deduplicated
in persistent memory. No unrelated process is killed.

Completion: tasks/16-sentinel.md. Verification: tests/harness/core.test.mjs and
tests/harness/extension.test.mjs.
