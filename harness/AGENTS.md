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

## Project workbench

Chats belong to one project folder. Use its working directory and the current roadmap/task snapshots supplied with each request. Resume this project's own history; do not copy conversations into shared memory or load unrelated project folders. The harness keeps the paperwork: at your first file change it makes the request's task in tasks/ (or uses the task the request names) and its ROADMAP.md line, writes the test runs Gate sees into the task's progress, and commits each request locally: when the change is verified (a test failed first, then passed on the final code) it marks it done; otherwise the commit is marked not verified and the task stays open. Your job is the content: code, tests, documentation, findings. Write tests for the change (before or after it: the harness checks that they fail without the change and pass with it) and run them until they pass; run them without pipes or `|| true` so their exit code counts. Before you finish a request that changed files, add a `## For the person` section to its task: two or three short lines for someone who does not read code, what changed and then "Tried it: …" (the workbench shows them under your answer). Do not create task files, tick progress boxes or commit (Gate rule G-013). Report blockers clearly.

Document comments are requests only after the user sends them to the queue. The request identifies the page, comment ID, selected text, and Markdown comment record. Read the actual current page, perform the requested work, verify it, and update that comment's agent_reply in the comments frontmatter array with the result. Preserve every other comment and field.
