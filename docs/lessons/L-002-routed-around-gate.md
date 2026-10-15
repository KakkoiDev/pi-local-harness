# L-002: Routed around a Gate error

**Seen** 2026-10-14, web chat, writing task 173. Every `edit` was answered "Gate HTTP 400". Pi guessed at the cause
("too many pending proposals", wrong), then added the ROADMAP line with a shell append, which Gate allowed as an
ordinary command (Gate events 261–262).

**Why it matters** The cause was a Gate bug (Pi 1.1 sends `edits: [...]`; Gate read `oldText`). Pi could not see it
because the harness passed on only the status code, so it found another way to write the file. Each way around Gate is
a check that did not happen.

**Done** Checked: Gate reads Pi's edits list (task 174); a Gate error now reaches Pi with Gate's reason
("Gate HTTP 400: …", task 174). Tests: `tests/test_gate_enforcement.py`, `tests/harness/extension.test.mjs`.

Enforced (rule G-011; plan 179, changed by plan 184): when Gate fails (an error, not a decision), the check is tried
again (1, 3 and 6 seconds); if it still fails, that one call does not run, Pi is told it may continue within the rules,
the person sees "✗ Gate could not check a tool call." and the failure is reported (`/reports`). The run is not stopped:
the person does not want to watch it. An edit of a file that does not exist is a decision now (G-004, "use write to
create it"), not an error. Test: `tests/harness/extension.test.mjs`.

**Open** Nothing known.
