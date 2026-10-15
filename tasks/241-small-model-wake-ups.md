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
- [ ] Red: extension tests for 1 and 3 (fake pi events with the replies from the bench: bug-pagination and
  history-page-lifts in task 225); Gate test for 2.
- [ ] Implement; each wake counts toward `canWake()`'s limit.
- [ ] Run the e4b bench again (task 225's commands) and the 27b one; record both in this file.
