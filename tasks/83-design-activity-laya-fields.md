# 83: Pi Workbench System 1, Activity and Laya fields

Kind: code

Request 2026-10-13: "finish now", pointing at the deviations listed after task 80: "Activity has no Phase, Last command or Laya counts. Laya has no Project or From." Spec: [design/IMPLEMENTATION.md](../design/IMPLEMENTATION.md) § 6.3 and § 6.4. Task 81's `tools[]` and `tool_call` make the data exist.

- [x] Red (`tests/browser/chat.cjs`): after the `TEST_TOOL` job, the Activity detail lists Phase `Completed`, Last command `cat README.md`, Laya `1 approved · 0 blocked`; the Laya row shows Command, Project `First project`, From `Chat`; Event Info lists Project; Open Request selects the job in Activity.
- [x] `js/workspace.mjs`: Phase (was Progress), Last command, Laya counts; `openJob(id)` for other views.
- [x] `js/chat.mjs`: `eventJob(event)` maps an event to its job through `tool_call`; Laya columns Time, Check, Decision, Command, Project, From (as [Laya]); Event Info Project, From, Open Request.
- [x] `chat.css`: Laya column widths.
- Events without a tool call (a direct `/gatekeep` call, events from before task 81, jobs no longer in the queue) show blank Project and From and no Open Request.
