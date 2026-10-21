# Round 19 design handoff: final design integration

Design only. Nothing here has been implemented, and no runtime behaviour has been tested. A clean design review is not evidence that the behaviour exists.

## Decision records (owner-delegated, 21 Oct 2026)

- [round-19-final-integration](../../design/briefs/round-19-final-integration.md):
  - Section A settles the ten round 18 addendum questions and the language rule.
  - Section B approves user-journey recording on Pi WorkStation and the Preview.
  - Section C lists the 14 acceptance groups.
- [round-19-follow-up-decisions](../../design/briefs/round-19-follow-up-decisions.md): decisions 1–15 close every gap reported after `01070dd1`.
- [round-19-closeout](../../design/briefs/round-19-closeout.md): six final corrections close the gaps reported after `e6b7b027`. They correct existing round 19 work; they are not a new round.

These supersede conflicting round 18 addendum proposals (`64dad882`). The Constitution and the twenty round 17 decisions in [plan 360](../plans/360-round-17-product-decisions.md) remain authoritative.

The full specification is `design/IMPLEMENTATION.md` › "2026-10-21 · Round 19". It holds:

- the A–C coverage matrices, the 1–15 decision map and the closeout map;
- per-part states, who may invoke each action, persistence, cancellation and focus destinations;
- keyboard, responsive behaviour and exact EN/JA;
- changed text, implementation dependencies and Given/When/Then journeys.

## Canvases

| Canvas | Manifest | Holds |
| --- | --- | --- |
| Pi Workbench — Desktop Interface | `design/canvas/canvas.json` | Rounds up to 18 and the round 18 addendum (484 boards). **Not synchronized with round 19.** |
| Pi WorkStation — Round 19 onward | `design/canvas/canvas-round19.json` | Round 19 (62 boards), in four pages |

`design/canvas/INDEX.md` lists both, with their links. Every board file stays in `design/canvas/`. Nothing was deleted or pruned from the first canvas. Its changes in round 19 are the retitling, the six R18A_Ask* boards with duplicate ids fixed, and, in the closeout, the alert icon repair on 25 older boards and 8 addendum boards regenerated without stale `ov-keys` references. Its manifest is unchanged.

## Status

| Item | Status |
| --- | --- |
| Round 18 addendum Q1–Q10 and Delete Conversation | Decided in round 19 (A1–A10). The addendum boards are retitled "Settled" or "Superseded"; their alternatives read "Not chosen (round 19)". |
| Gaps reported after `01070dd1` | Decided by follow-up decisions 1–15. The obsolete "Gap → recommendation" labels are replaced by the decided rules in the cards and the spec. |
| Gaps reported after `e6b7b027` | Decided by the closeout (1–6) and drawn; see below. |
| Delete Conversation in the Agent or phone Chat ▾ menu | Withdrawn (round 9). Ph18A_ConversationMenu is kept for history and marked superseded. |
| Japanese | 議論 / 計画 / 実装; キャンセル for cancel; 取り消し only for undo; 元に戻す for restore. **No native-speaker review has taken place.** |

## Follow-up decisions → boards

| # | Boards | Components |
| --- | --- | --- |
| 1 Unsaved | R19_AskUnsaved, R19_AskDrafts, Ph19_AskOffline, R19_ProjectChatUnsaved | DraftVersions, Composer |
| 2 Not saved / Retry | R19_AskUnsaved, R19_ProjectChatUnsaved | DraftVersions, Composer |
| 3 Deleted in another window | R19_AskRemote, Ph19_AskRemote, R19_ProjectChatUnsaved, Ph19_ProjectChatDeleted | ConversationTrash, DraftVersions, Composer |
| 4 Project removed or re-registered | R19_ProjectRemove, Ph19_ProjectRemove, R19_AskRemoved | Dialog, Menu, ConversationTrash |
| 5 Stale selection | R19_OverviewSelection, R19_ServiceHealth | WorkOverview, Menu, MenuBar |
| 6 Provider names | R19_ServiceHealth, Ph19_ServiceHealth | StatusButton, WorkOverview |
| 7 Phone title row | R19_PhoneTitleRow, Ph19_ProjectChatActions | Message, ConversationList |
| 8 Recorder limits | R19_RecLimits, R19_RecStates, R19_RecHistory | RecordingStatus, RecordingHistory, FlowAttachment |
| 9 Phone opt-in | Ph19_RecOptIn, Ph19_RecSettings, R19_RecIdentity | RecordingStatus |
| 10 Identity, shared profile | R19_RecIdentity | RecordingStatus, RecordingHistory |
| 11 Preview-only test drafts | R19_RecTestDrafts, R19_RecHistory | FlowAttachment, RecordingHistory |
| 12 Theme wrappers, duplicate ids | Dark and light cells on R19_OverviewSelection, R19_AskRemoved, R19_PhoneTitleRow, R19_ProjectChatUnsaved and R19_RecResponsive; the six R18A_Ask* boards | All, via `round19_theme.css` |
| 13 Restore copy | R19_AskRemote, R19_AskTrash, R19_ProjectChatUnsaved | ConversationTrash, ContextReceipt |
| 14 Second canvas | `canvas-round19.json`, INDEX.md | — |
| 15 @ in comments deferred | R19_ProjectMention (note) | Composer |

The 14 acceptance groups map to boards in the IMPLEMENTATION.md matrix. Strings are on R19_OverviewStrings, R19_AskStrings, R19_ProjectChatStrings and R19_RecStrings. Journeys are on R19_OverviewWalk, R19_AskWalk, R19_ProjectChatWalk and R19_RecWalk.

## Closeout of `e6b7b027` → boards

| # | Correction | Boards | Components |
| --- | --- | --- | --- |
| 1 | Remove from List failure: project stays listed, Try Again; “Nothing changed.” only when the host confirms; uncertain result asks to check the list; reconcile before retry | R19_ProjectRemove, Ph19_ProjectRemoveError (new), R19_OverviewStrings, R19_OverviewWalk | Dialog, WorkOverview |
| 2 | Alert icons and the Failed glyph use paper and ink (21:1 in both themes) with cutouts kept | source `gen/preview.py` and all regenerated boards; 25 older boards on the first canvas; Alert and other previews; `assets/Icons/alert-*.svg`, `failed.svg` | Alert |
| 2a | Duplicate ids in two previews | — | PhaseControl, PreviewWindow |
| 3 | Saved / Kept / Recorded draft times | R19_AskUnsaved, R19_AskRemote, Ph19_AskRemote, R19_AskDrafts, R19_AskTrash, R19_ProjectChatUnsaved, Ph19_ProjectChatDeleted, R19_AskStrings, R19_ProjectChatStrings, R19_AskWalk, R19_ProjectChatWalk | DraftVersions, ConversationTrash, Composer |
| 4 | “Flow full · no more actions saved”, no Start New Flow button | R19_RecLimits, R19_RecStates, R19_RecResponsive, R19_RecHistory, R19_RecStrings, R19_RecWalk | RecordingStatus |
| 5 | Shared-profile report draft notice | R19_RecIdentity, R19_RecStrings, R19_RecWalk | ProblemReport |
| 6 | Single-version list and “Removed from the list” approved, with the project-list explanation | R19_AskUnsaved, R19_AskRemoved, R19_AskTrash | DraftVersions, ConversationTrash |

Stale accessibility references were fixed in the generators, not by hand: `gen/r18a.py` emits `aria-describedby="ov-keys"` only from a window that draws the keyboard hint, the chat generator drops `aria-controls="preview"` when no Preview is drawn, and the recorder's first-use dialog has its id.

## Changed files (this pass)

**Closeout pass:**

- **Decision record:** `design/briefs/round-19-closeout.md` (the closeout, as supplied).
- **`design/canvas/`:** the new board Ph19_ProjectRemoveError; 32 round 19 boards revised (closeout content, regenerated icons and accessibility references); `canvas-round19.json` (new board and heights); 25 older boards with the icon repair; 8 addendum boards regenerated.
- **`design/system/`:** Alert, Composer, ConversationTrash, Dialog, DraftVersions, ProblemReport, RecordingStatus and WorkOverview cards; previews of those plus PhaseControl, PreviewWindow and RecordingHistory; `assets/Icons/alert-*.svg`, `failed.svg` and their README; `design-system.json`.
- **Other:** `design/IMPLEMENTATION.md`, `design/README.md`, `design/canvas/INDEX.md` and this file.

**Follow-up pass (`e6b7b027`):**

- **Decision record:** `design/briefs/round-19-follow-up-decisions.md` (as supplied, with a note on where its references live).
- **`design/canvas/`:**
  - 14 new round 19 boards. The other 47 were updated: all of them now load `round19_theme.css` and link the second canvas's stylesheet copy, and several carry the follow-up content.
  - The six R18A_Ask* boards with duplicate ids fixed.
  - `canvas.json`, now the first canvas's manifest again, without round 19.
  - `canvas-round19.json` (new), `INDEX.md` (new) and `_blob/6b8d723e397cc49af3680173bfa74436.css`, a copy of the shared stylesheet under the second canvas's id.
- **`design/system/components/`:** follow-up sections in DraftVersions, ConversationTrash, ConversationList, Composer, Message, ContextReceipt, StatusButton, WorkOverview, Menu, MenuBar, Dialog, RecordingStatus, RecordingHistory, FlowAttachment and ProblemReport, with their previews.
- **CSS:** `bundle.css` and `design/components.css` carry the `round19_*` blocks and the new `round19_theme` block.
- **Other:** `design-system.json`, `design/IMPLEMENTATION.md`, `design/README.md` and this file.

## Implementation dependencies (behaviour specified; to build)

- **Drafts:** a host draft store with revisions and versions, and one save in flight per draft. Late acknowledgements are matched to their revision, and a newer remote save becomes a conflict. Unsaved state is client-side, with `beforeunload` only while it exists. No browser persistence.
- **Trash:**
  - A conversation-deleted event pushed to open windows; late saves are refused for a trashed conversation.
  - Unsaved text kept as a draft version attached to the trashed conversation.
  - Transactional restore, with failure leaving the Trash item and its drafts intact.
- **Projects:**
  - A stable project id recorded with the folder.
  - Retained conversations and Trash keyed by that id, with removal metadata.
  - An identity comparison on Add Existing Folder…; names and paths are never trusted.
  - Access checks still applied to retained data.
- **Overview and status:**
  - The selection is kept per window with a staleness time and revalidated on reconnect and at submission.
  - Cached health is shown with its time.
  - A configured, non-secret provider display name, with the fallback "Model provider".
- **Recording:**
  - Host counters and atomic validation of the 500/50/64 KiB limits before any write.
  - Rejections reported so the gap can be drawn, and `truncated_at` set on full flows.
  - Consent stored per authenticated person or per shared local profile, mirrored to that person's windows.
  - A profile or session switch closes capture and clears client buffers.
  - Test-draft generation offered only for Preview-only flows.

These are implementation work for behaviour already decided. They are not product questions.

## Static design checks that ran

These checks read the drawings only. They do not verify host or backend behaviour.

- **HTML and classes:** nesting and `pw-` class definitions on all 62 round 19 boards, the 28 addendum boards and every card preview: 0 problems, 0 undefined classes.
- **CSS isolation:** no round 19 rule redefines an existing class. `round19_theme.css` only re-derives two tokens on theme wrappers, which compute identically on `<html>`, so app rendering is unchanged.
- **Duplicate ids:** none on round 19 or addendum boards or any card preview, PhaseControl and PreviewWindow included.
- **Accessibility references:** no `aria-controls`, `aria-labelledby`, `aria-describedby` or `aria-activedescendant` names an absent id on those files, except `aria-controls` on a popup drawn closed.
- **Icons:** no 36-px alert icon or Failed glyph on any board, preview or exported asset hard-codes white or black. Boards that do not load the shared stylesheet (Dialogs, PhoneEdit5) use `var(--paper, #ffffff)`.
- **References:** board references, both manifests and INDEX.md agree.
- **Renders:** desk, 1024, 320, phone, and dark and light wrappers on the new and changed boards and previews.
- **Tests:** `python3 -m unittest tests.test_design_brand tests.test_frontend tests.test_web_robustness`.

## Runtime behaviour still unverified (needs the built app)

- Remove from List: whether the host can tell “rejected, nothing changed” from “unknown”, and reconcile-before-retry.
- Which draft time the host records (save confirmation or preservation).
- `truncated_at` driving the “Flow full” status.
- Autosave timing, revision checks and late acknowledgements.
- The browser leave-page warning, and mobile page eviction (documented as a limitation).
- Cross-window deletion events and consent mirroring.
- Host enforcement of the recorder limits and atomic rejection.
- Profile and session switching.
- Preview bridge security.
- Capture coverage and key-up fidelity per browser.
- IME composition and caret anchoring.
- Screen-reader output, focus restoration, reduced motion and safe areas.
- Theme wrappers in the built app.

## Settled by the closeout

The six items listed here after `e6b7b027` (Remove from List failure, alert icons in dark wrappers, kept draft time, full flow, shared-profile report drafts, single draft version and the “Removed from the list” label) are all decided and drawn; see the closeout map above.

## Remaining defects (known)

- **EditB's comment-popover arrow** still uses a fixed white fill. It is part of a light-only board, not an icon, and was left as is.
- **Hand-made older boards.** The icon repair on the 25 older boards was applied to the board files. Their generators are not all in the repository, so a board rebuilt from an old source would need the same repair (`gen/preview.py` is fixed; the Dialogs board has no generator).
- **Closed-popup references.** `aria-controls` on a button whose popup is drawn closed points at an id that is not in the file. This is the drawing convention since round 17, not a defect in the built app.
- **Japanese:** no native-speaker review.

## Remaining blockers

- **Push:** this session cannot push to the repository, and the linked Mac clone has no GitHub credentials. The owner pushes `design/round-19`.
- **Runtime:** every implementation dependency above is unbuilt.
