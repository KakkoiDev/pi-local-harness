# Round 17 design handoff: Overview and scoped context

Design only. No application behaviour was implemented. The full specification (exact copy, states, interactions, accessibility, responsive behaviour, superseded text) is `design/IMPLEMENTATION.md` › “2026-10-20 · Round 17”. Inputs: `design/briefs/project-work-dashboard.md`, `docs/plans/354-project-work-dashboard.md`, `docs/reports/scoped-context-retrieval-2026-10-20.md`, `docs/architecture/harness.md`.

## Existing vs proposed

Everything in round 17 is **Proposed**, except R17_ContextExisting, which redraws the shipped “Pi sees:” line and Why? sheet for comparison. R17_SeveralAgents is **Proposed later**: a direction only, not something to build now. Answering, approving, retrying, PhaseControl and explicit approvals stay exactly as shipped. Overview only opens them, and opening never resolves anything.

## Changed files

- `design/canvas/canvas.json`: new page “Round 17: Overview and scoped context”, 35 boards.
- `design/canvas/`, Overview (A): R17_Overview, R17_Overview1024, R17_OverviewEntry, R17_OverviewFollow, R17_OverviewWindows, R17_OverviewHistory, R17_OverviewStates, R17_SeveralAgents, R17_OverviewStrings, R17_OverviewWalk, Ph17_Overview, Ph17_OverviewItem, Ph17_OverviewStates, Ph17_Entry, Ph17_EntryPi.
- `design/canvas/`, Ask across projects (B): R17_Ask, R17_AskScope, R17_AskStates, R17_Ask1024, R17_AskSource, R17_AskNarrow, R17_AskStrings, R17_AskWalk, Ph17_Ask, Ph17_AskScope, Ph17_AskSources.
- `design/canvas/`, project scope and context (C): R17_ProjectScope, R17_ContextReceipt, R17_ContextExisting, R17_ContextStates, R17_Context1024, R17_ContextStrings, R17_ContextWalk, Ph17_ProjectScope, Ph17_ContextSheet.
- `design/system/components/`, new cards: WorkOverview, AttentionItem, SearchScope, SourceList, ContextReceipt (README and preview each).
- `design/system/components/`, Round 17 sections added: StatusButton, Menu, MenuBar, PhoneBar, ContextLine, Message.
- `design/system/components/bundle.css`, `design/components.css`: the classes `pw-ov*`, `pw-attn*`, `pw-prow*`, `pw-fresh`, `pw-needs`, `pw-ask`, `pw-scope`, `pw-coverage`, `pw-sources`, `pw-cite`, `pw-askro`, `pw-handoff`, `pw-receipt*`, `pw-context__sep` and `pw-context__found`.
- `design/system/design-system.json` (lastChange), `design/IMPLEMENTATION.md`, `design/README.md` (sync note) and this file.

## Superseded text (summary; exact old → new in IMPLEMENTATION.md)

- **Status button.** It now opens Overview · All Projects (⌃⌥0), no longer Activity (⌘3). Its label is now “Agent status: 5 need you, working on Class Notes. Open Overview”. Attention follows the Needs you count, so opening a window no longer clears it.
- **Window menu, Agent section, phone view popup and π sheet.** Each gains Overview as its first app-level item. Activity ⌃⌥3 and Gate ⌃⌥4 stay where they are.
- **Why? sheet.** It is now titled “What Pi uses for this message” (on the phone, “What Pi uses”). The reason word “related” is retired, and those files are listed under “Found for this question”. The footer adds “or other projects”.

## Data that does not exist yet

- **Attention records:** stable attention ids, a service-problem record, `replaced_by` on replaced questions and `recovered_at` on failures.
- **Overview snapshot:** a snapshot `as_of` time with a change count since a given time, the latest recorded activity per project, and the agent role (shown only once it is recorded).
- **Overview conversation:** a server-side conversation `{id, scope, messages}`; answers carrying `sources[]` and `coverage`; sources carrying `source_hash` and `changed_at`; and an Open route back to `/overview` that keeps the conversation and the focused source.
- **Context receipt:** a per-job `context_receipt` (always / found / left out / search state) and `scope_notice`, from the report's selection receipt §6. No score, rank, query text or engine field reaches the UI.

## Product questions (resolved after this handoff)

All 20 questions below are resolved by the owner-authorized [decision record](../plans/360-round-17-product-decisions.md). The original questions are retained for provenance; the decision record supersedes their drawn defaults. See the [round18 designer prompt](../../design/briefs/round-18-overview-decisions.md) for the required revision.

1. **Order within a kind:** oldest first (drawn), or newest first?
2. **Show filter:** per window (drawn), or app-wide?
3. **Recorded problems retention:** 7 days (drawn), or the last 20?
4. **Service problems:** should one change the status button's words? Drawn: it is counted in “need you” only.
5. **Projects window at 1024:** keep it beside Overview, or hide it (drawn)?
6. **⌘/Ctrl+Return:** should it open an item in a new window?
7. **Cancelled interrupted request:** should it leave a history row?
8. **New conversation scope:** start from the last scope used, or from all projects (drawn)?
9. **Conversation history:** keep and list conversations, or one conversation plus New (drawn)?
10. **Opening a cited Markdown file:** Page view, or Source view (drawn)?
11. **Source from a removed project:** greyed (drawn), or hidden with a count?
12. **Ask Again:** re-ask only the missing project, or everything (drawn)?
13. **Overview rows:** add a per-row “Ask about this project”?
14. **Receipt scope:** a receipt for every message (drawn), or only the latest?
15. **Ask Again behaviour:** resend at once (drawn), or refill the composer?
16. **Ask in Overview:** prefill (drawn), or send at once?
17. **Left-out matches:** show their names, or only their count?
18. **Found rows:** is 3 visible found rows the right cap?
19. **Boundary notice:** show it only when another project is named, or also when something absent is named?
20. **Japanese name:** confirm 概要 for Overview.

Known pre-existing gaps, not from this round: the ContextMeter preview uses the undefined classes `pw-bar` and `pw-meter--near`, and the VisualResult preview (round 15) uses `pw-dialog__head`.

## Acceptance journeys

These are the ten Given/When/Then journeys at the end of the Round 17 section of `design/IMPLEMENTATION.md`:

1. Help needed across projects.
2. Resolved elsewhere.
3. Disconnected and recovered.
4. Recorded failures vs requests waiting.
5. Ask across projects with cited sources.
6. Narrow the scope.
7. Partial, no matches, unavailable.
8. Project boundary.
9. What Pi used.
10. Reload, phone, keyboard.

Each journey names its boards, and the walk boards (R17_OverviewWalk, R17_AskWalk, R17_ContextWalk) give the stable accessible names for end-to-end tests.
