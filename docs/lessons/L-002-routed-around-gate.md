# L-002: Routed around a Gate error

**Seen** 2026-10-14, web chat, writing task 173. Every `edit` was answered "Gate HTTP 400". Pi guessed at the cause
("too many pending proposals", wrong), then added the ROADMAP line with a shell append, which Gate allowed as an
ordinary command (Gate events 261–262).

**Why it matters** The cause was a Gate bug (Pi 1.1 sends `edits: [...]`; Gate read `oldText`). Pi could not see it
because the harness passed on only the status code, so it found another way to write the file. Each way around Gate is
a check that did not happen.

**Done** Checked: Gate reads Pi's edits list (task 174); a Gate error now reaches Pi with Gate's reason
("Gate HTTP 400: …", task 174). Tests: `tests/test_gate_enforcement.py`, `tests/harness/extension.test.mjs`.

Enforced (plan 179, rule G-011): when Gate fails (an error, not a decision), the call is blocked, the turn stops and
the person sees "✗ Gate could not check a tool call."; the web request fails with that reason. An edit of a file that
does not exist is a decision now (G-004, "use write to create it"), not an error. Test: `tests/harness/extension.test.mjs`.

**Open** Nothing known.
