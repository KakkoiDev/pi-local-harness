# 241: Wake a small model that stops before acting

Kind: code

From the bench with gemma4:e4b (task 225): every run "completed" in about a minute with 0 wake-ups. Proposed by Claude
on 2026-10-15; the person's "go ahead" (2026-10-16) answered the pong list, so confirm this one with the person before
starting if it is unclear.

## The three gaps (harness/extension.mjs `agent_settled`: it wakes Pi only when code changed and is not verified)
1. Stopped without acting: the request asked for a change, nothing changed, and the last reply announces a next step
   ("I will", "I'll start", "First,", "Let me", "Next, I") or holds a tool call written as text (a line like
   `bash{command: …}`, `` `read(…)` ``, `<|tool_call|>`, `call:`). Wake Pi once: "Nothing ran: your tool call was
   written as text. Call the tool." or "You said: '<sentence>'. Do it now with a tool call."
2. G-004 repeated on the same file: the second refusal shows the file's current lines closest to the attempted old
   text (difflib.get_close_matches over windows of the same number of lines), so the model can copy them exactly.
3. Leaked template tokens (`<channel|>`, `<|…|>`) in an answer: removed from what the person sees, counted as a sign
   of a broken turn (an incident in session.log).

## Steps
- [x] Red: extension tests for 1 and 3 (fake pi events with the replies from the bench: bug-pagination and
  history-page-lifts in task 225); Gate test for 2.
- [x] Implement; each wake counts toward `canWake()`'s limit.
- [ ] Run the e4b bench again (task 225's commands) and the 27b one; record both in this file.

## Result

The fake-extension tests reproduce both stopped-with-a-promise and tool-call-as-text replies. They prove one no-action wake per request, retaining the original request and counting against the shared retry budget. An aborted turn or a question is not woken. Finalized assistant text has leaked template tokens removed through Pi's message replacement hook; the incident count is kept in reports and session.log. Bare Pi keeps its original answer for comparison.

The second G-004 on a file includes the closest current windows of the attempted old text. The diagnostic is bounded in memory and output and never changes the file. Red and targeted green runs are in scratch logs. Live benchmark comparison remains open until recorded below.

## README request found during task 244 preflight

Build 5d7f250's e4b run solved pagination (58 seconds, verified), but the README run stopped after promising to read pager.py (13 seconds, one tool, no wake). The change-intent verbs omitted “write.” The real request and answer reproduce a failing fake-extension test; adding write/document and the matching Japanese verbs makes that test pass. This retains the existing once-per-request and shared retry limits. The first two completed runs and interrupted Pong scratch are retained under ignored `.bench-local/244-2026-10-17/`, excluded from the final comparison. The complete local batch restarts on the fixed committed build.

## Activity finalized-answer bridge found during local runs

Pi's supported message_end replacement cleans the stored conversation, but Activity formerly kept only streamed deltas. A completed slugify run therefore retained a leaked template token in its request record despite the extension counting its removal. Fake-Pi and queue tests reproduce the mismatch and split tokens. The worker now sends its finalized answer to the queue; Activity hides complete and incomplete template markers while streaming, then saves the final answer for reloads. Bare mode keeps the unmodified baseline. The 31 queue/web tests pass. The earlier local runs remain pre-fix evidence under ignored `.bench-local/244-final-2026-10-17/`, excluded from the final comparison.
