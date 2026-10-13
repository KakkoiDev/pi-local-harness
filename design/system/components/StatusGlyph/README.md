# StatusGlyph

One glyph and one word for every state. Never colour.

| State | Glyph | Word |
| --- | --- | --- |
| running | hourglass | Running |
| queued | clock | Waiting |
| completed | check | Completed |
| failed | stop octagon | Failed |
| stopped | filled square | Stopped |
| interrupted | broken line | Interrupted |
| Laya ALLOW / SUCCESS | check | Approved / Verified |
| Laya BLOCK / DRIFT_DETECTED | stop octagon | Blocked / Drift |
| Laya REVISE, EXECUTION_FAILED, POSTCONDITION_FAILED | caution | Revise / Exit ≠ 0 / Check failed |
| Laya ESCALATE | note | Escalated |

`stateGlyph(state)` in icons.mjs builds `<span class="pw-glyph">`.
