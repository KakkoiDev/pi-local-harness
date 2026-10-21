# Round 18 design handoff: Overview and scoped context, finalized

Design only. No application behavior was implemented, and nothing drawn here ships because it is drawn. This round applies the 20 decisions in [plan 360](../plans/360-round-17-product-decisions.md) to round 17 without reopening them. The full specification is in `design/IMPLEMENTATION.md` › “2026-10-20 · Round 18”: exact EN/JA copy, states, keyboard and focus, responsive behavior, the superseded round 17 text and the privacy rules. The brief is [round-18-overview-decisions](../../design/briefs/round-18-overview-decisions.md).

## Existing vs proposed

Everything in round 18 is **Proposed**. What exists today is unchanged: approval and check-in cards, PhaseControl, request retry in the project chat, queued-job cancel, the Activity and Gate windows, and the “Pi sees:” context line. Several agents stays **Proposed later** (R17_SeveralAgents).

## Decisions → boards and components

| # | Decision | Boards | Components |
| --- | --- | --- | --- |
| 1 | Oldest first within a kind; history newest first; the focused row never moves | R18_OverviewFocus, R18_OverviewHistory | AttentionItem, WorkOverview |
| 2 | Show filters per window | R18_OverviewWindows | WorkOverview |
| 3 | Resolved history for 7 days; unresolved items never expire | R18_OverviewHistory, R18_OverviewFocus | WorkOverview, AttentionItem |
| 4 | Work-blocking service status and priority; no false Working/Idle | R18_OverviewService, R18_OverviewStatus, R18_OverviewStates, Ph18_OverviewService | StatusButton, PhoneBar, WorkOverview, AttentionItem |
| 5 | Projects window hidden at 1024 unless opened explicitly | R18_Overview1024, R18_OverviewWindows | MenuBar |
| 6 | ⌘/Ctrl+Return on a focused row; Open in New Window; popup blocked | R18_OverviewRowActions, R18_Overview, R18_OverviewWalk | AttentionItem, WorkOverview |
| 7 | Cancelled interrupted request leaves an honest history row | R18_OverviewHistory, Ph18_OverviewHistory | AttentionItem, WorkOverview |
| 8 | A new dashboard conversation searches all authorized projects, stated | R18_AskConversations, R18_AskHistory | ConversationList (new), SearchScope |
| 9 | Conversations kept and listed, with New Conversation | R18_AskHistory, R18_AskConversations, Ph18_AskHistory | ConversationList |
| 10 | Citations open in Page view at the section; Source view one click away | R18_AskCitePage, R18_AskCiteStates, Ph18_AskCite | SourceList |
| 11 | A revoked or removed citation becomes a numbered, disabled, redacted placeholder | R18_AskCiteStates, R18_AskConversations, R18_AskRetryStates | SourceList, SearchScope |
| 12 | Retry only the missing projects; new attempt; original kept; full refresh separate | R18_AskRetry, R18_AskRetryStates | SearchScope |
| 13 | Ask About {project} on every project row | R18_Overview, R18_OverviewAskAbout, R18_OverviewRowActions, Ph18_OverviewRowMenu, R18_AskAbout, R18_AskPrefill | WorkOverview, ConversationList |
| 14 | A receipt for every submitted message, recorded at send | R18_ProjectScope, R18_ContextReceipt, R18_ContextStates, R18_ProjectScopeStates, R18_Context1024, Ph18_ContextSheet | ContextReceipt, Message, ContextLine |
| 15 | Retry sends at once, deduplicated, rechecked; draft kept; “Nothing to retry.” | R18_AskRetryStates, Ph18_AskRetry, R18_AskNarrow | SearchScope |
| 16 | Ask in Overview prefills and waits for Send; draft conflict | R18_ProjectScope, R18_ProjectScopeStates, Ph18_ProjectScope, R18_AskPrefill, Ph18_AskDraft | Message, ConversationList |
| 17 | Compact counts; expanded left-out names and reasons, authorized only | R18_ContextReceipt, R18_ContextStates | ContextReceipt |
| 18 | Three found rows, then Show All | R18_ContextReceipt, R18_ContextStates, Ph18_ContextSheet | ContextReceipt |
| 19 | Boundary notice only for an explicitly named project | R18_ProjectScope, R18_ProjectScopeStates, Ph18_ProjectScope | Message, ContextLine |
| 20 | 概要 | R18_OverviewStrings, R18_AskStrings, R18_ContextStrings | WorkOverview, MenuBar, Message |

## Changed files

- `design/canvas/`:
  - The new page “Round 18: Overview decisions” (41 boards) and `canvas.json`.
  - R15_VisualStates and R15_VisualInspect, which now use the repaired classes.
- `design/system/components/`:
  - New card: ConversationList.
  - Round 18 sections added to WorkOverview, AttentionItem, StatusButton, PhoneBar, MenuBar, SearchScope, SourceList, ContextReceipt, ContextLine, Message, ContextMeter, VisualResult and Dialog.
  - Previews updated where the look changed.
  - `bundle.css`.
- `design/components.css` (round18_fix, round18_a, round18_b and round18_c appended), `design/system/design-system.json` (lastChange), `design/IMPLEMENTATION.md`, `design/README.md` (sync note) and this file.

## Design-system repairs

- **ContextMeter:** `.pw-meter--near` is now defined.
- **VisualResult:** the undefined `pw-bar` now reuses the ContextMeter bar. The bar counts finished candidates, not time.
- **Dialog:** `.pw-dialog__head` is now defined and documented, and VisualResult's inspect dialog uses it.

The new rules are scoped to these classes, so no global styles change.

## Privacy and redaction (must hold in the implementation)

- **Authorization on every display:** names, paths, sections, lines, excerpts and counts are checked against the person's current authorization each time they are shown. The host strips anything unauthorized before the response; the UI never just hides it.
- **No trace of revoked projects:** a project the person can no longer open leaves no placeholder and no “1 hidden”. The only trace is a cited source's number, shown as “Source unavailable”.
- **Boundary notice:** it never names another project, and never appears for an unknown or unauthorized name.
- **No rights from history:** history, old receipts, Ask About and retrieval scope never grant access or writes. Retry rechecks authorization when it is pressed.
- **Never shown or stored:** no engine, index, query or rank terms in the UI, no question text in URLs or logs, and nothing published to the Second Brain.

## Data contracts still missing (✱)

- **Overview:**
  - A service health record `{service, state, since, blocking}`. Whether a service is blocking is decided by the host.
  - A per-project state that can be `unknown`, with a reason.
  - Queued counts that stay valid while the model server is down.
  - For each attention item: `id`, `created_at`, `resolved_at` and `resolution` (answered | approved | continued | recovered | cancelled).
  - A cancel endpoint for interrupted requests. Only queued-job cancel exists today.
  - Deep links for every item and row.
  - A per-window Show state, kept in the window address or session.
- **Dashboard conversations:**
  - A per-person list `{id, title, scope{project_ids[], all_at_start}, updated_at, message_count, draft}`, plus the current conversation for each window.
  - A draft store for each conversation.
  - Title generation.
  - Answer coverage `{searched_ids[], missing[{project_id, reason}], at}`.
  - Retry attempts `{id, parent_answer_id, target_ids[], state, coverage}`, idempotent per parent answer across windows.
  - A source record `{n, project_id, path, heading, anchor, lines, source_hash, read_at}`, plus a display-time resolver that returns changed / moved / deleted / authorized.
  - The Page-view work route, with a way back to the conversation and the cited source.
  - A server-side prefill `{source, project_id?, text?}` that is never sent automatically.
- **Project receipts:**
  - A write-once `context_receipt` per submitted job: always, found, left out with reason (budget | not_searched), search state, `interrupted_at`.
  - A read-time projection with `availability` current | changed | gone, where gone strips every identifying field.
  - `scope_notice {project_id}`, set only when the message explicitly names an authorized project.
  - A resend with `resend_of`, deduplicated while one is in flight.

Runtime records and conformance remain with task357 and the feature tasks.

## Acceptance journeys

The round 17 journeys 1–10 still apply. Round 18 adds journeys 11–18 in IMPLEMENTATION.md:

11. Conversation history
12. Selective retry
13. Draft preservation
14. Scope isolation
15. Source revocation
16. Service failure
17. Old receipts
18. Focus, windows and keyboard

The walk boards (R18_OverviewWalk, R18_AskWalk, R18_ContextWalk) give the stable accessible names for end-to-end tests.

## Validation

- **Ran:**
  - An HTML nesting and `pw-` class-definition check on all 41 new boards and every card preview: 0 problems, 0 undefined classes.
  - A check that every board named in the round 18 section exists.
  - Renders of every board and of the changed previews, each inspected.
  - `python3 -m unittest tests.test_design_brand tests.test_frontend tests.test_web_robustness`.
- **Not verifiable here:** screen-reader output, real popup blocking, live focus behavior and multi-window sync. These need the built frontend.

## Genuinely new unresolved issues

1. **Two blocking services down at once.** The decided words name one service. Proposed: “Can't run work · 2 services stopped · 2 need you”.
2. **Projects registered after an “All projects” conversation started.** Drawn: the conversation keeps its starting set, “Searching 5 of 6 projects”, so scope never widens silently. The alternative is a live “all”.
3. **Where drafts are stored.** Per conversation, but device-local or synced? A rule is also needed for two windows editing one draft. Drawn: the last edit wins.
4. **An answer whose prose names a project whose access was revoked.** Decision 11 keeps the prose. The host may need to withhold the whole answer when access is revoked rather than the project removed.
5. **Full refresh in a narrowed conversation.** “Ask All Projects Again” is the wrong name there. Drawn: “Ask Again in 2 Projects” / “Ask Again in Class Notes”.
6. **⌃⌥N overlaps New File.** It is limited to the Ask pane. Decide whether Overview's File menu lists New Conversation.
7. **Project names that are ordinary words** (“Notes”, “Search”). They need an explicit-mention rule for the boundary notice.
8. **Ask Again with Current Files after a phase change.** It resends in the current phase and never changes phase. Should its description say which phase?
9. **Receipt lifetime** when a conversation is cleared or compacted. No retention policy is set.
10. **Drawn beyond the decisions, needing owner approval:**
    - Cancel Request… for interrupted requests in Activity, with a confirmation that defaults to Keep Request.
    - Check Again on a service detail.
    - A “New” tag on a newly arrived item, kept until it is focused or 60 seconds pass.

## Follow-up review brief (21 October 2026)

The owner requested a round18 follow-up covering all ten issues above. See [the agent brief](../../design/briefs/round-18-follow-up-questions.md) for proposed answers, design/validation work and commit/push instructions. These proposals await owner approval; adding the brief does not approve them.
