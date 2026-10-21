# Round 18 addendum handoff: ten follow-up questions (proposed)

Design only. **Every item here is a proposal awaiting the owner's approval, not a decision.** Round 18 and the twenty approved decisions in [plan 360](../plans/360-round-17-product-decisions.md) remain the specification until the owner approves a proposal.

The questions are the ten "Genuinely new unresolved issues" in [the round 18 handoff](round-18-design-2026-10-20.md). `design/briefs/round-18-follow-up-questions.md` exists only in an uncommitted development worktree and was not read here.

A reviewer accepted the first recommendations' direction on 21 Oct, with corrections; those corrections are now the Recommended drawings (revision 2). The full specification is in `design/IMPLEMENTATION.md` › "2026-10-21 · Round 18 addendum": exact EN/JA copy, accessibility, keyboard and focus, phone layouts and journeys. The boards are on the canvas page "Round 18 addendum: follow-up questions" (28 boards).

## Questions → artifacts → status

All rows are **proposed, awaiting approval (revised after review)**.

| # | Question | Recommended (revision 2) | Alternative | Boards | Components |
| --- | --- | --- | --- | --- | --- |
| 1 | Blocking services | Blocking is per operation: Ollama blocks generation; Gate blocks tool steps; Preview, speech and search failures affect only their own feature. Status reads "Can't run work · Ollama stopped" / "Can't run tools · Gate stopped" (ツールを実行できません · Gate 停止中) / "Can't run work · Ollama and Gate stopped". "need you" counts only decisions. Overview gets a **Stopped services** section (停止中のサービス) above Needs you, never counted in it | "2 services stopped", with services inside Needs you | R18A_ServicesStopped, Ph18A_ServicesStopped | StatusButton, WorkOverview, AttentionItem, PhoneBar |
| 2 | Projects registered later | Keep the starting set ("Searching 5 of 6 projects"); offer the new project unchecked | Live "all" with a divider | R18A_AskAdded | SearchScope |
| 3 | Shared drafts | Both versions are kept until the person chooses (Use This Version · Use Other Version · Show Both); the other version stays until **Discard Other Version…**; sending does not discard it | Device-only drafts | R18A_AskDraft, Ph18A_AskDraft | ConversationList |
| 4 | Revoked info in prose | The person's question stays; the generated answer and the generated title are hidden, and the title becomes "Conversation · 20 Oct 14:31" (会話 · 10月20日 14:31) | Redact sources only (privacy risk) | R18A_AskRevoked, Ph18A_AskRevoked | SourceList, ConversationList |
| 5 | Refresh labels | "Ask Again in All Projects (5)" / "in 2 Projects" / "in Class Notes" | — | R18A_AskRefresh, Ph18A_AskRefresh | SearchScope |
| 6 | New Conversation vs New File | ⌃⌥N stays New File…. New Conversation has no shortcut. In Overview, New File… is disabled, and New Task… is disabled until a project row is selected, then reads "New Task in Class Notes…" | ⌃⌥N only in Ask | R18A_NewConversationKeys, R18A_AskNew | Menu, MenuBar, ConversationList |
| 7 | Ordinary-word names | An @ chip (list anchored to the caret; project chat only; comments deferred), or the exact name with "project" ("the Notes project", 「Notes」プロジェクト). Quoted words alone never count | @ only | R18A_ProjectMention, Ph18A_ProjectMention | Composer, Message |
| 8 | Phase before resend | Resend in today's phase and say so. A waiting plan blocks it only in Implementation; Discussion is allowed; Planning is drawn allowed, with a note | Confirmation alert | R18A_AskAgainPhase, Ph18A_AskAgainPhase | ContextReceipt |
| 9 | Receipt lifetime | Compaction keeps receipts. Clearing or deleting moves the conversation and its receipts to the Trash; restoring brings both back | Dropped at compaction | R18A_ReceiptLifetime, Ph18A_ReceiptLifetime, Ph18A_ConversationMenu | ContextReceipt, CompactionMarker |
| 10 | Cancel, Check Again, New marker | Cancel Request… (依頼をキャンセル…) only where the request opens. Check Again probes once and never restarts. Clearing the New tag is visual only and never resolves the item | 60 s timer | R18A_CancelCheckNew, Ph18A_CancelRequest | AttentionItem, WorkOverview |
| + | Delete Conversation (raised in review) | In the conversation's menu and on each history item. It moves to the Trash with messages and receipts; a toast offers Undo (取り消す) | — | R18A_AskDelete, Ph18A_AskDelete, R18A_ReceiptLifetime | ConversationList, ContextReceipt |

**Japanese conventions:** phases are 議論 / 計画 / 実装; キャンセル means cancel and 取り消し is used only for undo. R15_VisualWalk's 「話し合い」 is corrected to 「議論」.

## Changed files

- **`design/canvas/`:**
  - 28 `R18A_*`/`Ph18A_*` boards (25 revised in place, 3 new: R18A_AskDelete, Ph18A_AskDelete, Ph18A_ConversationMenu).
  - `canvas.json`.
  - R15_VisualWalk (the Japanese phase name).
- **`design/system/components/`:** the "Round 18 addendum (proposed, awaiting approval)" sections, marked "Revised 21 Oct after review", in StatusButton, AttentionItem, WorkOverview, MenuBar, Menu, PhoneBar, ConversationList, SearchScope, SourceList, Composer, Message, ContextReceipt, CompactionMarker and ContextLine, with their labelled preview blocks.
- **CSS:** `bundle.css` and `design/components.css` carry `round18add_a/b/c`, all addendum-only classes; no existing class is redefined.
- **Other:** `design-system.json`, `design/IMPLEMENTATION.md`, `design/README.md` and this file.

## Data needed if approved (✱)

| Questions | Missing |
| --- | --- |
| Q1 | Service health records `{service, stopped_at, blocks: generation\|tools}`, including Gate's; the "need you" count computed from decisions only; a project state "waiting for Gate before a tool step". |
| Q2 | Conversation scope as explicit project ids plus `all_at_start`; each project's `registered_at`. |
| Q3 | Draft versions per conversation and person `{version_id, text, saved_at, window_id}`, all kept until explicitly chosen or discarded; a push to open windows. |
| Q4 | `used_project_ids[]` per answer; the reason a project became unavailable (`removed_by_person` / `access_ended`); a generated-title flag, so the title can be withheld. |
| Q6 | The Overview's selected project row available to the File menu. |
| Q7 | Mentions stored as `{project_id, label_at_send}`; the host's reference rule (`scope_notice`); an authorized project-list endpoint. |
| Q8 | `phase_at_send`; the resend refused only while a plan waits and the phase is Implementation. |
| Q9 / Delete | Compaction never touches receipts; a conversation Trash that holds messages and receipts together, with restore. None exists today. |
| Q10 | A cancel endpoint and `cancelled` state for interrupted requests; a one-shot service probe. |

## Acceptance journeys (if approved)

Given/When/Then with stable names are on R18A_OverviewWalk, R18A_AskWalk and R18A_ProjectChatWalk, and in IMPLEMENTATION.md. Revision 2 adds:

- Gate-only and both-stopped status, with no double count.
- Two draft versions kept, chosen and discarded.
- The person's question kept while the answer and title are hidden.
- Delete Conversation, then Undo and restore from the Trash.
- An @ list at the caret, and quoted words not counting.
- A waiting plan blocking only in Implementation.
- New Task in Overview with and without a selected row.

## Validation

- **Ran:**
  - An HTML and class-definition check on all 28 boards and every preview: 0 problems.
  - A check that no addendum CSS redefines an existing class: none.
  - Checks that board references exist and that every board title carries the approval label.
  - Renders of the changed boards (desk, 1024 and 320 px cells, phone) and previews, each inspected.
  - `python3 -m unittest tests.test_design_brand tests.test_frontend tests.test_web_robustness`.
- **Not verified:** screen-reader output, real autosave and cross-window timing, caret anchoring on long or wrapped lines, browser focus and popup behaviour, and a native-speaker review of the Japanese.

## Remaining questions for the owner

1. **Approval:** approve, change or reject each revised recommendation.
2. **Planning with a waiting plan (Q8):** should Ask Again with Current Files be allowed? It is drawn allowed, with a note.
3. **Where conversation commands live:** round 9 removed Compact Now, New Conversation… and Earlier Conversations from the Agent menu and the phone view menu. Delete Conversation… needs a confirmed home on the desktop and phone; it is drawn in Agent and the phone's Chat ▾ menu.
4. **Trash:** how the Trash lists and restores conversations is not drawn.
5. **Three or more draft versions:** they would need a list form of Show Both.
6. **"Selected project row" in Overview:** confirm it means the Projects list's current row, kept while focus moves to the menu bar.
7. **Disabled refresh label (Q5):** "Ask Again in This Conversation" is the designer's wording.
8. **Japanese review:** "Open Read Only" (読み取り専用で開く) and the compaction marker strings are new translations.
