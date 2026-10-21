# Round 19 design handoff: final design integration

Design only. Nothing here has been implemented, and no runtime behaviour has been tested. A clean design review is not evidence that the behaviour exists.

The decision record is [round-19-final-integration](../../design/briefs/round-19-final-integration.md) (21 Oct 2026, owner-delegated). It settles the ten round 18 addendum questions and the language rule (section A), and approves user-journey recording on Pi WorkStation and the Preview (section B). It supersedes conflicting addendum proposals (`64dad882`). The Constitution and the twenty round 17 decisions in [plan 360](../plans/360-round-17-product-decisions.md) remain authoritative.

The full specification is `design/IMPLEMENTATION.md` › "2026-10-21 · Round 19". It holds the coverage matrices for sections A–C, the per-part states tables, who may invoke each action, persistence boundaries, cancellation, focus destinations, keyboard, responsive behaviour, exact EN/JA, the changed-text lists, data contracts and Given/When/Then journeys.

## Status of earlier proposals

| Item | Status |
| --- | --- |
| Round 18 addendum Q1–Q10 and Delete Conversation | **Decided** in round 19 (A1–A10). The addendum boards are retitled "Settled in round 19 (A*n*)" or "Superseded by round 19 (A*n*), see R19_…"; their Alternative cells read "Not chosen (round 19)" |
| Addendum placement of Delete Conversation in Agent and phone Chat ▾ | **Withdrawn**: round 9 keeps conversation commands out of those menus. Ph18A_ConversationMenu is kept for history and marked superseded |
| Recording (round 15 RecordingStatus, FlowAttachment, ProblemReport) | **Extended** for WorkStation and Preview (section B); the new RecordingHistory card was added |
| Japanese | 議論 / 計画 / 実装; キャンセル for cancel; 取り消し only for undo. Not reviewed by a native speaker |

## Changed files

- `design/briefs/round-19-final-integration.md`: the decision record, as supplied.
- `design/canvas/`:
  - 47 new boards (33 `R19_`, 14 `Ph19_`) on the page "Round 19: final design integration".
  - The 28 round 18 addendum boards, retitled and partly revised.
  - `canvas.json`.
- `design/system/components/`:
  - New cards: DraftVersions, ConversationTrash, RecordingHistory.
  - New "Round 19" sections in StatusButton, WorkOverview, AttentionItem, MenuBar, Menu, PhoneBar, ConversationList, SearchScope, SourceList, Composer, Message, ContextReceipt, CompactionMarker, ContextLine, RecordingStatus, FlowAttachment and ProblemReport.
  - Previews updated where the look changes.
  - `bundle.css`.
- `design/components.css`: the `round19_a`…`round19_d` CSS appended. All of it is new classes or modifiers; nothing is redefined.
- `design/system/design-system.json`, `design/IMPLEMENTATION.md`, `design/README.md`, `docs/handoff/round-18-addendum-2026-10-21.md` (status updated) and this file.

## Coverage: the 14 acceptance groups

| # | Boards (journeys) | Components |
| --- | --- | --- |
| 1 | R19_ServiceHealth, Ph19_ServiceHealth (R19_OverviewWalk) | StatusButton, WorkOverview |
| 2 | R19_AskScope, R19_AskRevoked (R19_AskWalk) | SearchScope, SourceList |
| 3 | R19_AskDrafts, Ph19_AskDrafts, Ph19_AskOffline (R19_AskWalk) | DraftVersions |
| 4 | R19_AskActions, R19_AskTrash, Ph19_AskActions, Ph19_AskTrash, R19_ProjectChatActions, Ph19_ProjectChatActions, Ph19_ProjectChatTrash (R19_AskWalk, R19_ProjectChatWalk) | ConversationList, ConversationTrash, Message |
| 5 | R19_OverviewSelection (R19_OverviewWalk) | WorkOverview, Menu, MenuBar |
| 6 | R19_ProjectMention, Ph19_ProjectMention (R19_ProjectChatWalk) | Composer |
| 7 | R19_ProjectChatResend, R19_AskResend (R19_ProjectChatWalk, R19_AskWalk) | ContextReceipt, SearchScope |
| 8 | R19_ProjectChatReceipts (R19_ProjectChatWalk) | ContextReceipt, CompactionMarker |
| 9 | R19_RecFirstUse, R19_RecControl, R19_RecStop, Ph19_RecFirstUse, Ph19_RecStatus (R19_RecWalk) | RecordingStatus |
| 10 | R19_RecCoverage (R19_RecWalk) | RecordingStatus, FlowAttachment |
| 11 | R19_RecSessions, R19_RecStates (R19_RecWalk) | RecordingStatus, RecordingHistory |
| 12 | R19_RecStates (R19_RecWalk) | RecordingStatus |
| 13 | R19_RecHistory, R19_RecAttach, R19_RecEvidence, Ph19_RecAttach, Ph19_RecReport (R19_RecWalk) | FlowAttachment, ProblemReport, RecordingHistory |
| 14 | 320, 1024 and dark (Inverse) cells across all parts; R19_Rec1024, R19_RecResponsive; all four walkthroughs | all |

Exact strings are on R19_OverviewStrings, R19_AskStrings, R19_ProjectChatStrings and R19_RecStrings.

## Implementation dependencies (behaviour specified; data or services missing)

- **Service health:** a per-operation record `{service_id, display_name, operation, kind, state, since, last_checked_at, stale_after}`, plus a read-only probe that is coalesced while pending and pushed to every window. The attention count covers decisions only.
- **Scope and access:** scope stored as project ids; authorization rechecked at display, at queued dispatch, at citation opening, at restore and at retry. Per-answer provenance `used_project_ids[]`, a loss reason `removed_by_owner | access_ended`, and `title_hidden`. Generated content without provenance is withheld.
- **Drafts:** a revision-checked store per person and conversation, holding versions labelled by source, save time and state. It pushes to open windows, keeps discarded versions in Trash, never expires them, and never falls back to browser storage.
- **Conversation Trash:**
  - Delete and restore are transactional over messages, receipts and draft versions, and preserve ids and links.
  - Restore is idempotent, detects link conflicts, and rechecks access.
  - An active-work query refuses deletion and powers Show Request.
- **Overview:**
  - Create-task carries `project_id` and is revalidated by the host (`project_unavailable`).
  - Cancel is idempotent by request id (`cancelled`, `already_finished`, `already_cancelled`, `error`).
  - The New marker is client-side, per window.
- **Project chat:**
  - Authorized project list for the @ list.
  - A deterministic EN/JA reference rule on the host, used only for the boundary notice.
  - A submission recheck of phase, plan waiting and access.
  - `resend_of` linking.
  - Receipts untouched by compaction; `receipt: none` for older messages.
- **Recording:**
  - A per-person recording choice on the host.
  - Session records with token and bucket, rotated at the defined boundaries.
  - Batch validation that rejects late, ended and spoofed batches, plus bridge origin/source checks.
  - Host-side normalization and redaction; coverage and truncation fields.
  - Attachment records; Trash for cleared flows.
  - A server-rendered external report payload whose confirmed hash must match what is sent.
  - A mirrored state stream to every window.

## Checks run

- **HTML and classes:** nesting and `pw-` class definitions on all 47 round 19 boards, the 28 revised addendum boards and every card preview: 0 problems, 0 undefined classes.
- **CSS isolation:** no round 19 rule redefines an existing class, and no class is shared between the four round 19 CSS files.
- **Duplicate ids:** none on round 19 boards. Six revised `R18A_Ask*` boards repeat ids across their multi-cell drawings; this was already the case in the addendum.
- **References and labels:** every board reference exists; no "awaiting approval" text is left on addendum boards; no personal names in round 19 samples (Aiko's MacBook is used as the host example).
- **Renders:** desk, 1024, 320, phone and dark cells, plus the new and changed previews.
- **Tests:** `python3 -m unittest tests.test_design_brand tests.test_frontend tests.test_web_robustness`.

## Unverified until the built app is tested

- Real autosave and revision checks.
- Cross-window timing and mirroring.
- Screen-reader output.
- Browser focus restoration.
- IME composition and caret anchoring.
- Touch-keyboard viewport behaviour.
- Preview bridge security (origin, source, token).
- Capture coverage and key-up fidelity per browser.
- Late-batch rejection timing.
- Storage-full behaviour.
- Reduced motion and safe areas.
- The Japanese wording, which has had no native-speaker review.

## Newly discovered gaps (recommendations only; not adopted)

1. **Offline typing lost when a window closes.** Unsaved typing can be lost if the window is closed while offline, because browser storage is excluded. Recommend a native "leave page" warning while Unsaved text exists.
2. **Online save failure.** It has no state in the decided vocabulary. Recommend "Not saved · Retry".
3. **Deleted on another device.** A conversation deleted on one device while it is open on another. Recommend that the other window switch to the read-only Trash detail.
4. **A project removed by its owner.** It is unspecified what happens to that project's conversation Trash. Recommend that the Trash travels with the project, and that the remove-project confirmation says so.
5. **Selection while Overview is disconnected.** Recommend keeping the selection, disabling New Task with the stale reason, and revalidating on reconnect.
6. **Remote provider display.** Recommend a `display_name` from the provider record; never show a URL.
7. **Phone conversation title.** It has no room in the PhoneBar and is drawn as a row under it. Recommend confirming that placement.
8. **Recording limits.** Per-flow and batch limits are host-controlled and unspecified. Recommend setting them in the implementation spec; the UI only shows "Truncated".
9. **Recording on the phone before enabling.** Recommend a π › Settings… row plus a one-time notice, with no new screen.
10. **Shared or multi-person devices.** Recording on them isn't covered. Recommend per-person recording only.
11. **Save as Test Draft for WorkStation flows.** Recommend offering it for Preview flows only until the owner decides.
12. **Dark tokens in boards.** `--selection-bg` and `--selection-fg` aren't redefined inside a `[data-theme="dark"]` wrapper. This affects drawings only, since the app sets the theme on `<html>`. Recommend adding them to the dark block of `tokens.css`.
13. **New strings needing review:** "Restore its conversation first." and "Conversation restored.".
14. **@ in comment composers** stays deferred, per A7.

## Remaining blockers

- **Canvas artifact limit:** the design canvas artifact holds at most 511 files per version and already has 486. The 47 round 19 boards therefore exist only in this repository; the artifact received the retitled addendum boards and a `canvas.json` without the round 19 page. Recommendation: the owner either approves moving archived pages (for example "Archive — not chosen") out of the artifact, or a second canvas artifact for rounds 19 and later. Nothing was deleted without instruction.

- **Push:** this session cannot push to the repository, and the linked Mac clone has no GitHub credentials. The branch must be pushed by the owner.
- **Runtime:** every implementation dependency above is unimplemented.
