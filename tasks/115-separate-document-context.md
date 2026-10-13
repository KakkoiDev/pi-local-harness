# 115: Comments and whole-file questions run in their own context

Kind: code

Request 2026-10-13: keep the chat clean: "Just the talk I had with the AI and the comments are in another context that exists only as documents." Decision: Chat holds only what is typed in Chat; comment and whole-file requests run as one-off Pi requests (no session) with the task 114 context plus the whole thread (passage, comment, replies, earlier Pi answers); the answer goes to the thread or under the document only; Activity still lists them.

- [ ] Red (tests/test_web_chat.py): a comment job and a document job leave the project conversation unchanged and run Pi with `--no-session`; the comment prompt includes earlier Pi answers in the thread; the answer lands in the comment / job.
- [ ] Red (browser): the live reply of a comment job does not appear in Chat.
- [ ] `WebChat.send` detached path; `pi_command(None)`.
