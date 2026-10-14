# 136: "Also read:" after answers

Kind: code

Request 2026-10-13: "design updated" (re-synced in task 126); build what the agent-scope brief asked for. Inventory of design vs code: 2026-10-13 review.

- [x] Red (python + browser): files Pi read with its tools beyond its context are stored on the chat message, the comment and the job, and shown after the answer; nothing when there are none (`tests/test_web_chat.py` AlsoReadTest, design.cjs).
- [x] Server: `WebChat.send` collects the `read` tool's paths (inside the project, files only, not in the chosen context, once, at most 20), emits `also_read`, stores `also_read` on the chat message and on Pi's thread reply (`agent_result`); the queue keeps it on the job. Only the `read` tool counts: a `cat` through bash is not parsed.
- [x] Page: `alsoReadLine` (ContextLine `.pw-context--after`, wraps, no counter) after a Pi message in Chat, after Pi's answer in a thread, and on a whole-file request card. Names open in Work.
- [x] Green: verify_workflow, design.cjs, chat.cjs.
