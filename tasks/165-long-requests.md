# 165: Long requests are fine; only silence fails

Kind: code

Request 2026-10-14: "go this error Pi response exceeded ten minutes. this is a problem as agents might take long to answer and are guided by the gate so they don't go off track. so long running tasks should be ok."

- [x] Red (python, `tests/test_web_chat.py` LongRequestTest, the fake Pi's new `TEST_TICK`): work that keeps reporting runs past the limit; a Pi that sends nothing fails with "Pi sent nothing for …".
- [x] `WebChat.send` has no total time limit any more (it was 600 s). It fails only after `SILENCE` (one hour, `PI_HARNESS_SILENCE_SECONDS`) without any event from Pi; a pause for the chat (task 164) is not silence. Stop always ends a request.
- [x] readme: the rule.
- [x] Green: verify_workflow.
