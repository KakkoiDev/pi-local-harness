# 227: A loop recovery keeps the request open

Kind: code

The person, 2026-10-15 (the pong project, ~/Code/pong): "how come the harness didn't commit itself?" It did, too early.
At 22:07 the loop detector stopped Pi and queued a "continue" message. `agent_end` (harness/extension.mjs, the block
`const recovery = pending; pending = undefined;`) cleared `pending` before `agent_settled` ran; `agent_settled` then saw
an aborted turn, did not wake Pi, and called `settledNow()`: `/request/end` committed "not verified" and wrote "The task
stays open", and `requestId` became undefined. Pi kept working for 6 minutes (pong.mjs, 10 passing tests); at 22:13
there was no request left to finish, so nothing was verified, committed or ticked.

## Where
- harness/extension.mjs: `pi.on('agent_end', …)` (recovery: `const recovery = pending; pending = undefined;`, `reask`),
  `pi.on('agent_settled', …)` (`if (pending) return;`, `settledNow`), `pi.on('input', …)` (`event.source === 'extension'`
  returns early, so the re-ask starts no request).
- Tests: tests/harness/extension.test.mjs (find the tests that drive `agent_end` / `agent_settled` with a fake `pi`;
  copy their setup).

## Steps
- [x] Red: a test where a recovery is pending at `agent_end`: then `agent_settled` (aborted) must NOT call
  `/request/end`, and the request id must still be set when the re-asked turn settles; that final settle calls
  `/request/end` once.
- [x] Fix: keep a `recovering` flag from the moment the recovery is queued until the re-asked turn starts
  (`agent_start` after the re-ask, or the re-ask's `input` with source `extension`). `agent_settled` returns while
  `recovering`. Do not reset `retries` for the re-ask (the limit `canWake()` must still count recoveries).
- [x] Same for the "wake Pi to finish" path (G-012): check it cannot end the request between the wake and the next turn.
- [x] Green: the test passes; run `node --test tests/harness/*.test.mjs`.

## Done when
A request interrupted by a loop, hang or drift recovery is committed once, at its real end, with the verification of
the final code. The paperwork test shows one `/request/end` per request.

## Result

Regression tests cover loop, hang, instruction-drift and G-012 wake-ups, including a second settle while the
continuation waits. Each retains the original request and ends it exactly once after the resumed turn verifies.
The existing bounded-retry test now starts the resumed turn before settling it, matching Pi’s lifecycle.

Validation: all 100 Node tests passed. Full workflow verification uses `PYTHONDONTWRITEBYTECODE=1`: the existing
`test_the_harness_proves_red_itself_whatever_order_pi_worked_in` otherwise reuses stale bytecode when same-size
Python source is restored within one timestamp second. It fails alone normally and passes alone with this setting.
