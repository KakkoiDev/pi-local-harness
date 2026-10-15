# 212: The harness stops what Pi leaves running when a request ends

Kind: code

Found during the bench (2026-10-15): a `python3 -m http.server 8765` Pi started in a scenario was still running hours
later. The person: "yes, fix it."

- [x] Red (python, `tests/test_web_chat.py`, fake Pi `TEST_SPAWN`): a server Pi starts in the background is gone once
  the request ends.
- [x] `harness/web_chat.py`: Pi runs in its own process group; when the request ends, what is left in it is stopped
  (SIGTERM, then SIGKILL). The Preview's app runs in its own session and is not touched.
- [x] Green: verify_workflow, both browser suites.
- Not covered: a process that leaves the group itself (`setsid`, a daemon), and terminal Pi, where the person's own
  session is the group.
