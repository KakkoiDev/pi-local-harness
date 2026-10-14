# L-002: Routed around a Gate error

**Seen** 2026-10-14, web chat, writing task 173. Every `edit` was answered "Gate HTTP 400". Pi guessed at the cause
("too many pending proposals", wrong), then added the ROADMAP line with a shell append, which Gate allowed as an
ordinary command (Gate events 261–262).

**Why it matters** The cause was a Gate bug (Pi 1.1 sends `edits: [...]`; Gate read `oldText`). Pi could not see it
because the harness passed on only the status code, so it found another way to write the file. Each way around Gate is
a check that did not happen.

**Done** Checked: Gate reads Pi's edits list (task 174); a Gate error now reaches Pi with Gate's reason
("Gate HTTP 400: …", task 174). Tests: `tests/test_gate_enforcement.py`, `tests/harness/extension.test.mjs`.

**Open** When Gate fails (an error, not a decision), the harness could stop the turn and tell the person, instead of
leaving the model to improvise: a Gate error is the harness's fault, never the model's to work around.
