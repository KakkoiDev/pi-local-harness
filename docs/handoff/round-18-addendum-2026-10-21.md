# Round 18 addendum handoff: ten follow-up questions (proposed)

Design only. **Every item here is proposed and awaiting owner approval; none is a decision.** Round 18 and the twenty approved decisions in [plan 360](../plans/360-round-17-product-decisions.md) remain the specification until the owner approves a proposal. There was no `design/briefs/round-18-follow-up-questions.md` in the repository, so the recommendations are the designer's.

The questions are the ten "Genuinely new unresolved issues" in [the round 18 handoff](round-18-design-2026-10-20.md). The full specification (exact EN/JA copy, accessibility, keyboard and focus, phone layouts and journeys) is in `design/IMPLEMENTATION.md` › "2026-10-21 · Round 18 addendum". The boards are on the canvas page "Round 18 addendum: follow-up questions".

## Questions → artifacts → approval status

| # | Question | Recommended | Alternative | Boards | Components | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Several blocking services | "Can't run work · 2 services stopped · 2 need you" (作業を実行できません · 2 つのサービスが停止中 · 対応待ち 2 件); one Service item per service, oldest first; the aria-label names each service | "Ollama stopped +1" | R18A_ServicesStopped, Ph18A_ServicesStopped | StatusButton, AttentionItem, WorkOverview, PhoneBar | Awaiting approval |
| 2 | Projects registered later | Keep the starting set, "Searching 5 of 6 projects"; the new project offered unchecked | Live "all" plus a transcript divider | R18A_AskAdded | SearchScope | Awaiting approval (keeps round 18's drawing) |
| 3 | Shared drafts, conflicts | Saved per conversation and person; "This draft changed in another window at 14:52." Use Newer Draft · Keep This Version; Restore once | Device-only drafts | R18A_AskDraft, Ph18A_AskDraft | ConversationList | Awaiting approval |
| 4 | Revoked info in prose | Withhold the whole answer when access ended ("This answer used a project you can no longer open, so it's hidden."); decision 11 unchanged when the person removed the project | Keep prose, redact sources (privacy risk) | R18A_AskRevoked, Ph18A_AskRevoked | SourceList | Awaiting approval; needs an owner privacy call |
| 5 | Refresh labels | "Ask Again in All Projects (5)" / "in 2 Projects" / "in Class Notes" (すべてのプロジェクト（5）でもう一度質問 …) | — | R18A_AskRefresh, Ph18A_AskRefresh | SearchScope | Awaiting approval; would supersede "Ask All Projects Again" |
| 6 | New Conversation vs New File | ⌃⌥N stays New File…; New Conversation has no shortcut; New File… is disabled in Overview with its reason | ⌃⌥N only in Ask | R18A_NewConversationKeys, R18A_AskNew | Menu, MenuBar, ConversationList | Awaiting approval; would remove round 18's ⌃⌥N |
| 7 | Ordinary-word project names | An @ chip, or the exact name beside "project" or in quotes; case must match | @ only | R18A_ProjectMention, Ph18A_ProjectMention | Composer, Message | Awaiting approval |
| 8 | Phase change before resend | Resend in the current phase and say so; disabled while a plan waits | Confirmation alert | R18A_AskAgainPhase, Ph18A_AskAgainPhase | ContextReceipt | Awaiting approval |
| 9 | Receipt lifetime | Lives as long as its message; compaction keeps receipts; deleting a conversation deletes them | Dropped at compaction | R18A_ReceiptLifetime, Ph18A_ReceiptLifetime | ContextReceipt, CompactionMarker | Awaiting approval |
| 10 | Cancel Request, Check Again, New marker | Cancel only where the request opens, with Keep Request as the default; Check Again probes once, never restarts, 10 s cooldown; the New tag clears on focus, open or close, with no timer | 60 s timer | R18A_CancelCheckNew, Ph18A_CancelRequest | AttentionItem, WorkOverview | Awaiting approval; the three items drawn beyond plan 360 in round 18 stay unapproved |

Strings boards: R18A_OverviewStrings, R18A_AskStrings, R18A_ProjectChatStrings. Walkthrough boards: R18A_OverviewWalk, R18A_AskWalk, R18A_ProjectChatWalk.

## Changed files

- `design/canvas/`: 25 new `R18A_*`/`Ph18A_*` boards, and `canvas.json` (a new page; no existing board moved).
- `design/system/components/`: "Round 18 addendum (proposed, awaiting approval)" sections in StatusButton, AttentionItem, WorkOverview, MenuBar, Menu, PhoneBar, ConversationList, SearchScope, SourceList, Composer, Message, ContextReceipt, CompactionMarker and ContextLine. Labelled preview blocks were appended where the look changes.
- `design/system/components/bundle.css` and `design/components.css`: `round18add_a/b/c` appended. Every rule uses an addendum-only class or modifier, so approved rendering is unchanged.
- `design/system/design-system.json` (lastChange), `design/IMPLEMENTATION.md`, `design/README.md` (sync note) and this file.

## Data that would be needed if approved (✱)

| Questions | What is missing |
| --- | --- |
| Q1 | Service health records `{service, stopped_at, blocking}` ordered by stop time. Gate has no health record today. |
| Q2 | Conversation scope stored as explicit project ids plus `all_at_start`, and the project's `registered_at`. |
| Q3 | A draft record `{conversation_id, person_id, text, saved_at, window_id}`, a push of newer saves to open windows, one kept earlier version cleared on send, and an ordering guarantee for near-simultaneous saves. |
| Q4 | Per-answer `used_project_ids[]`, a per-project loss reason (`removed_by_person` / `access_ended`), and evaluation at display time. |
| Q7 | Mentions stored as `{project_id, label_at_send}`, the reference rule run on the host at send time (`scope_notice`), and an authorized project-list endpoint for the @ list. |
| Q8 | `phase_at_send` on the job, and a resend that uses the current phase and is refused while an approval card is pending. |
| Q9 | Compaction never touches `context_receipt`, earlier conversations keep their receipts, and a delete-conversation operation (none exists today). |
| Q10 | A cancel endpoint and `cancelled` state for interrupted requests, and a one-shot service probe with `checked_at`. |

## Acceptance journeys (if approved)

They are written in Given/When/Then form, with stable accessible names, on the three walkthrough boards and in IMPLEMENTATION.md:

- **Overview:** two services stop and recover one by one; New File… is refused in Overview; New Conversation with no shortcut; cancelling an interrupted request; Check Again; the New tag across reload and two windows.
- **Ask across projects:** the kept set versus widening on purpose; two windows' drafts; keeping and restoring a draft; reload and phone; access ended versus a project removed by the person; scope-named refresh; nothing left to refresh.
- **Project chat:** @ chips; explicit versus ordinary-word references; reload and two windows; resending in today's phase; a waiting plan; compaction keeping receipts; New Conversation and delete; keyboard and phone.

## Validation

- **Ran:**
  - An HTML and class-definition check on all 25 boards and every preview: 0 problems.
  - A search for addendum CSS that redefines an existing class. Three rules were found and scoped or removed, so none remain.
  - Checks that board references exist and that every board title carries the approval label.
  - Renders of every board (desk, 1024 and 320 px cells, phone) and of the changed previews, each inspected.
  - `python3 -m unittest tests.test_design_brand tests.test_frontend tests.test_web_robustness`.
- **Not verified:** screen-reader output, real autosave and cross-window or cross-device timing, browser focus and popup behaviour, and a native-speaker review of the Japanese.

## Remaining questions for the owner

1. **Approval:** approve, change or reject each of the ten recommendations.
2. **Q4:** should the person's own question and the conversation title, which can name a project whose access ended, also be hidden?
3. **Japanese phase names:** no approved names exist. This addendum uses 議論 / 計画 / 実装, and one round 15 board says 話し合い.
4. **Japanese cancel wording:** 取り消し (the addendum's alert) or キャンセル (round 18's history row).
5. **Q6:** confirm that New Task… is also disabled in Overview ("Open a project to add a task.").
6. **Q9:** Delete Conversation… is new; where it appears beyond the earlier-conversation bar is not drawn.
7. **Q7:** whether the @ list follows the caret, and whether @ mentions extend to comment composers.
8. **Q1:** which services count as work-blocking is the host's call; Gate is drawn as blocking.
