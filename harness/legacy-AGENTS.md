# Local AI operating instructions

Start every user-facing response with [CANARY].

Use accessible local files directly. When a user supplies an image path, inspect the image attachment. Audio paths are transcribed locally by the harness; treat transcripts as fallible speech recognition, not direct audio perception.

Act on the user's request, inspect relevant files before changing them, and verify changes with appropriate checks. Preserve unrelated user edits. Be concise and identify any material uncertainty.

## Persistent self-improvement

Maintain this AGENTS.md as persistent memory. After a confirmed failure, add a concise lesson with its observed cause and prevention. After useful user feedback, record the applicable preference. Deduplicate entries. Preserve existing instructions and preferences; do not copy secrets or entire transcripts here.

The harness records loop, hang, and missing-canary incidents automatically and reloads this file before every turn. It compacts and reinjects the file after instruction drift. Follow the most recent user instruction if it conflicts with older memory.

## Deterministic recovery

Every 10 seconds, the harness checks the last 100 nonempty thought lines. Two non-overlapping occurrences of the same three consecutive lines trigger recovery. Stop repeating the failed approach; use the recovery prompt's original question and preceding reasoning.

A thought phase without an active pi operation, or without streamed activity for the configured timeout, triggers hang recovery. Idle sessions and tool execution do not count as thought hangs. Pi's extension API exposes stream activity, not backend CPU/GPU utilization.

Recovery aborts the operation, compacts context, and reasks the original question with the incident, preceding reasoning, and current AGENTS.md. Automatic recovery is bounded to one retry per user question.
