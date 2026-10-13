# 115: Comments and whole-file questions run in their own context

Kind: code

Request 2026-10-13: keep the chat clean: "Just the talk I had with the AI and the comments are in another context that exists only as documents." Decision: Chat holds only what is typed in Chat; comment and whole-file requests run as one-off Pi requests (no session) with the task 114 context plus the whole thread (passage, comment, replies, earlier Pi answers); the answer goes to the thread or under the document only; Activity still lists them.

- [x] Red (tests/test_web_chat.py): a comment job and a document job leave the project conversation unchanged and run Pi with `--no-session`; the comment prompt includes earlier Pi answers in the thread; the answer lands in the comment / job.
- [x] Red (browser): the live reply of a comment job does not appear in Chat.
- [x] `WebChat.send` detached path; `pi_command(None)`.
- Found: a follow-up question on a thread with an answer lost the new answer (`agent_result` filled only an empty `agent_reply`). Now the harness records Pi's reply unless Pi wrote a new answer itself during the run.
- "Open Chat" links removed where the answer is in the document (Review items of sent comments, Activity detail of document jobs). The Chat live/waiting filter skips document jobs; not covered by a running-job test (the fixture's waiting job only starts from chat messages).
- Red: tests/test_web_chat.py DocumentContextTest. chat.cjs: the chat now holds only typed messages (one user message, replies numbered from 1).
