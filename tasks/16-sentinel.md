# Sentinel reliability checks

- [x] Inspect pi's streamed thought events.
- [x] Check every 10 seconds for exact three-line repetitions within the last 100 thought lines.
- [x] Detect thought-phase hangs with operation state and deterministic stream timeout.
- [x] Abort, compact, and reask with incident context, reasoning, and current memory.
- [x] Recover missing CANARY responses and bound automatic retries.
- [x] Verify normal idle sessions, loop recovery, hang recovery, and canary reinjection.

Implemented in `harness/watch.mjs`, `harness/extension.mjs`, and `harness/memory.mjs`.
The standalone log-based Sentinel is retired.
