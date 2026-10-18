# 290: Conversation repairs: answers, drafts, lost messages, stale questions

Kind: code

From docs/reviews/2026-10-18-claude-review.md (items 4, 5, 8, 9, 18 and P2 lines) and GPT-Sol's report (duplicate-choice
and draft race, generic-crash partial replies, "repetitive blocking questions"), plus the bug hunt's documentation drift.

- [x] Choice answers go through their own route (question id, option id, idempotency key), resolved atomically, never
  merged with other queued messages; the card locks once answered; a stale question id is a no-op.
- [x] A choice click, Start Building and Continue never touch the composer's draft or attachments.
- [x] A system question never swallows the person's message: the original text reaches Pi after the answer.
- [x] The phase question never re-triggers on its own answer (request_advice skips "Choice: …" answers); keyword-only
  phase cards without Laya become an inline notice, not a blocking card.
- [x] Approval or a new plan settles or clearly shows an older pending question; a failed request clears or shows its
  pending choice; two ask_choices in one batch: the second is refused ("one question at a time").
- [x] A crash or stop mid-answer keeps the partial text in the chat, marked failed or stopped, exactly once; Gate gets
  the request's end.
- [x] Activity shows a choice or plan pause as waiting, not Completed; "stopped by a question" differs from "stopped by
  you".
- [x] Pi's harness tool can propose changes again (Gate allows previews without --yes; `update` and `models check` are
  reads); AGENTS.md's lesson-writing either works (Gate exemption for the memory file, size-guarded) or is removed.
- [x] Docs match behaviour: wake-ups (`wake_ups`, default 5), the shell rules and the git read form, the commit protocol,
  /guide topics built from GUIDE.md's headings, console command lists, README's /update and Laya limits.
- [x] The model-facing guides use paths that resolve from the project and never tell Pi to run what Gate refuses (`uv add`,
  kit/ paths: bug hunt item 20).

## Needs design

Built as the smallest version with existing classes; the designer has not drawn these yet.

- The inline harness notice under an answer (`p.pw-help.message-notice` with the note icon), used for a phase word
  ("Pi cannot change the phase…"). Today it is plain help text.
- A question settled without an answer (approval or a new plan replaced it): an old-style settled line, “Park or drop? ·
  not answered: settled by Start Building” (`pw-card--settled pw-card--old`, no glyph).
- The line under an answer a crash or a stop cut short (`p.pw-help.message-ended`): “Stopped by you before Pi
  finished.” with the stopped icon, or “Failed before Pi finished: <reason>” with the caution icon. Shown even when Pi
  wrote nothing yet (review P2, US-075), with Retry (queues the same request again, as Activity's Ask Pi to Retry…
  without a note) and, when Gate committed what the request changed, Undo This Request… (the DoneRow's undo), in a
  `pw-done__actions` row.

## Verified, and not verified

Tests: `tests/test_conversation_repairs.py` (Gate, queue and routes, with the review's repros adapted),
`tests/harness/conversation.test.mjs` (the extension: held words, the phase notice, one question at a time, the memory
path in the prompt), the new browser suite `tests/browser/conversation.cjs` (one answer per card, drafts and
attachments kept, Start Building and Continue, a settled card, the notice, failed and stopped lines, Activity's
Waiting), and the existing suites.

Not verified: the real Pi 1.1.0 binary (the fake Pi stands in, as in every suite), so the held message reaching the
model is checked at the extension boundary only; an installed Laya (none in tests): with Laya installed and abstaining,
a phase word still raises the card, by design (Article 2), only a keyword without Laya became a notice.
