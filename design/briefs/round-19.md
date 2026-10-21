# Round 19: final design integration brief

21 October 2026. The owner delegated selection of the best recommendations and requested a gap review. The decisions below supersede this brief's earlier pending recommendations and conflicting round 18 addendum proposals. They authorize design; they do not claim runtime implementation. Constitution and the twenty settled round 17 decisions remain authoritative. No new download, external publication, phase transition or guardrail exception is authorized.

## Inputs and deliverables

Read CONSTITUTION.md, DESIGN.md, design/README.md, design/IMPLEMENTATION.md, relevant component cards, round 15 recording designs, round 17/18 decisions and revision 2 of the round 18 addendum (64dad882, following ca54a1e0). The addendum branch is design/round-18-addendum. Integrate its actual files before revising them; do not redraw from this summary alone. The development brief design/briefs/round-18-follow-up-questions.md may not yet be present in another checkout: this document is self-contained about the decisions needed for round 19.

Produce synchronized component specifications, HTML previews and canvas boards, exact EN/JA strings, responsive states, focus/keyboard rules, changed-text list, data contracts and Given/When/Then journeys. Existing designs are authoritative except where explicitly superseded below. Preserve round 9's removal of conversation commands from Agent and phone view menus.

## A. Settled round 18 addendum decisions

1. **Service health is per operation.** Gate blocks tool execution; the selected provider blocks generation, not necessarily Ollama. Preview, speech and retrieval failures affect their own features. Stopped services have a separate Overview section; Needs you counts decisions, never services. For several failures use a concise aggregate with details for each affected operation. Unknown/checking/stale health is not healthy or definitely stopped. Check Again performs one read-only probe, coalesces duplicate clicks while pending and never restarts anything. A failed optional search is disclosed; it never silently widens scope or claims a complete answer.
2. **Conversation scope is explicit.** All Projects keeps its starting authorized set; later projects are offered unchecked and added only by explicit selection. Removal or revocation takes effect immediately. Display authorized selected/available counts without revealing inaccessible projects. Scope changes affect future sends, not historical receipts. A queued send rechecks authorization.
3. **Drafts are backend-local, per person and conversation.** Authorized devices/windows share them. Saves use revision checks; no silent last-write-wins. Conflicts form a version list for any number of versions, showing device/window, server save time and save state. Choosing an active version or sending it preserves other unresolved versions. Discard requires an explicit action and recoverable Trash behavior. Offline typing remains available with an honest Unsaved state; reconnect preserves both conflicting edits. Never put raw drafts in browser persistent storage as a fallback. Prefill never overwrites an existing draft. No automatic expiry of unresolved drafts is introduced.
4. **Revoked content is withheld at display and send time.** Keep the person's own submitted question. Hide generated answers and generated titles derived from inaccessible projects; use a neutral date-based title. Apply the same rule to snippets, exports, search results, cached views and attachments. Recheck authorization on restoration, retry and citation opening. If provenance is missing, withhold potentially affected generated content rather than asking System 2 whether disclosure is safe. Preserve round 17 decision 11 for a project merely removed by its owner; do not conflate removal with revoked access.
5. **Resend names its actual scope.** Use Ask Again in All Projects (5), in 2 Projects, or in Class Notes as appropriate. When no authorized searchable project remains, disable the action and explain No projects available to search. Do not offer an apparently successful empty refresh or silently switch scope. Distinguish transient indexing failure from no authorized projects.
6. **Command homes and selection.** New File retains its existing shortcut; New Conversation has no shortcut. Put conversation commands in a conversation-specific menu beside its title and on history items, with equivalent desktop/phone access; never Agent or view menus. New File is disabled in Overview. New Task is disabled until a project is explicitly selected, then names that project. Selection survives moving focus into menus; hover/focus alone does not select. Clear selection when the project is removed or inaccessible, and revalidate before acting. Only the invoking window's selection is used.
7. **Project references are explicit.** A selected @ chip or exact project name with an explicit project phrase counts; quotes alone do not. Recognition is a deterministic host rule with EN/JA examples, not an LLM judgement. Do not use ambiguous duplicate-name text to widen scope; offer authorized disambiguation. The @ list is anchored to the caret in project chat only; comments are deferred. Handle wrapped lines, scrolling, IME composition, touch keyboard, arrows/Enter/Escape and empty results. Mentions never grant permission or silently include an unselected project.
8. **Resend uses current permissions.** Show the phase it will use. A waiting plan permits Discussion and Planning resends; it blocks Implementation resend. Recheck phase, scope and authorization at submission. Retry/resend creates a new linked request, never replays tool effects, approves a plan or changes phase. A failed submission preserves the draft. Distinguish retry with recorded inputs from asking again with current files; do not silently fall back between them.
9. **Receipts follow messages.** Compaction preserves receipts and evidence references; it does not imply source contents remain unchanged. Delete Conversation lives in its title menu and history row menu on desktop/phone. It moves the conversation, messages, receipts and associated draft versions to local conversation Trash as one recoverable operation, with Undo. A conversation with active/queued work cannot be deleted until that work is explicitly stopped or cancelled; do not add implicit cancellation. Restore preserves IDs/links where possible, rechecks access and never resumes work automatically. Restore is idempotent; show a conflict instead of overwriting an existing conversation. No permanent-delete control or new retention period is introduced.
10. **Cancel and New are separate from resolution.** Cancel Request appears at the request's own location, with Keep Request the default confirmation. Cancellation is idempotent and does not undo already completed effects; show already finished, cancelling and failed states honestly. It never cancels a different request after navigation. New clears on deliberate focus/open, with no timer; hover and background refresh do not clear it. Clearing New never answers, acknowledges or resolves the underlying item.
11. **Language consistency.** Use 議論 / 計画 / 実装 for phases; キャンセル for cancellation; 取り消し for undo. Review all new EN/JA wording together, including read-only and compaction states. Claim native-speaker review only if one occurred.

## B. User-journey recording: both WorkStation and Preview

Approved scope covers both surfaces. Extend round 15's RecordingStatus, FlowAttachment and ProblemReport components. Shared capture belongs in test-core; storage, permissions and presentation belong in WorkStation. Recording is evidence collection, never a grant of agent authority.

### Storage, defaults and visible controls

- Preview keeps the approved defaults: on per project, at most 20 flows for 7 days, recent means 30 minutes. For WorkStation choose the same limits separately per project, and a separate WorkStation-only bucket for journeys outside any project. Neither bucket is shared memory or automatic cross-project model context.
- WorkStation recording is offered through a first-use explanation with Enable Recording and Not Now; it starts only after Enable. That choice persists locally. Keep existing Preview defaults, but make its active state visible. Do not begin silent global UI recording.
- Provide a persistent accessible status/control on Projects, project chat, files, settings and Overview, plus Preview's existing status. Label the controlled surface clearly. Stopping one surface does not claim the other is stopped; offer an explicit Stop All Recording action without deleting existing evidence.
- Store on the harness host, not a cloud service. Explain to remote-device users where the evidence lives. No background model submission, Second Brain promotion or external upload follows from enabling capture.
- A flow is one surface/window session, rotated on project/surface change, reload or explicit reproduction boundaries. Event batches do not each consume a flow slot. Bound each flow and show truncation rather than implying complete history. Limits and timing are host-controlled.

### Capture and privacy contract

- Record privacy-safe structural focus/blur, pointer interactions (including canvas target and coordinates), supported key down/up, scroll and viewport changes where implemented. Record key releases from actual events. Do not promise exact replay or complete capture of canvas internals, shadow DOM, cross-origin frames, browser chrome or native dialogs.
- Never store typed text, passwords, chat/document contents, clipboard data, private labels, sensitive key sequences, full URLs/query strings or secret-bearing attributes. File attachments expose no file contents or private paths through recording. Normalize and redact on the host as well as capture side; app-origin messages are untrusted.
- Sensitive fields and unsupported regions are omitted; show coverage limitations without recording their content. Masking/redaction itself must not leak field names or values. A privacy opt-out applies before transport, not just in a viewer.
- Attribute batches using stable project/surface/session IDs captured at event time. Pending events never migrate to the next selected project. Reject late batches after stop, clear or access loss; a fresh generation/session is required to resume. Mirror stop state across authorized windows and show disconnected/unknown state truthfully.
- Preview communicates through a guarded parent bridge with origin and source validation. Never inject host authentication secrets into the app. Unsupported/injection-blocked Preview is unavailable, not Recording on. Recorder failures never block app usage, chat, pending question answers or editor saves.

### Inspect, attach, clear and reproduce

- History separates WorkStation, Preview and outside-project sessions. Mixed-surface reproduction explicitly identifies included sessions and destination project. Outside-project and other-project evidence requires deliberate selection; never auto-attach it to project chat.
- Inspection is read-only. Action selection never runs a command. Missing, truncated, stale, disconnected and unavailable evidence have distinct honest states. Any generated test is a draft that requires assertions and normal phase/verification rules; a captured journey is not a passing test.
- Removing evidence before send excludes it from that submission. After send, explain that removing a UI attachment cannot retract context already received by a model. Reports and reproductions preserve existing drafts and pending questions, and Done attaches without automatically sending.
- Clear identifies its exact surface/project scope, confirms, then moves evidence to Trash. Pending capture cannot repopulate cleared history. Restore does not restart recording. Existing sent reports/receipts are not silently erased; explain retained copies. Apply current access/redaction rules when opening restored evidence.
- Show on/off/paused/unavailable, initializing, storage full/failure, transport loss, restart and recovery. Do not announce every event to screen readers or steal focus. Respect reduced motion and phone safe areas. Focus recording must never cause recursive focus loops.
- Sending reports externally requires previewing the redacted payload and explicit confirmation. Recorder-related API calls do not bypass normal person authentication or project authorization.

## C. Required gap and acceptance matrix

Map every item below to a board/component, exact strings, backend dependency and Given/When/Then journey. Reuse existing boards when sufficient; no need to create one board per state.

1. Two failed services, selected remote provider, unknown health, partial recovery and concurrent Check Again; no double count or restart.
2. New/removed/revoked projects during scope selection, generation, queued send and citation viewing; no unauthorized prose or metadata leak.
3. Three conflicting drafts across desktop/phone, offline reconnect, prefill conflict, explicit discard/restore and send without losing unresolved versions.
4. Conversation command discovery on desktop/phone, active-work deletion refusal, delete/Undo, reload, Trash list/detail/restore, unavailable project, restored-title redaction and restore conflict.
5. Overview selection through menus, project removal between menu open and action, no selection and independent window selection.
6. Wrapped/IME @ input, duplicate ordinary-word names, keyboard dismissal and unauthorized/empty suggestions.
7. Current-phase resend in all three phases with a waiting plan; scope/phase change immediately before submission; no searchable projects; failed retry with usable draft.
8. Receipt after compaction, changed/missing source, Trash/restore and revoked evidence; no fabricated historical provenance.
9. Enable/decline WorkStation recording, Preview independently active, keyboard stop-one/stop-all, reload and remote-device explanation.
10. Focus/blur, canvas click, real key release and scroll coverage; secrets/typed content absent in captured, transported, stored, attached and exported data.
11. Switch projects/reload/close iframe with batches pending, stale or spoofed bridge messages, stop from another window, clear during delivery and resume with a new session.
12. Recorder quota/failure, unsupported Preview, offline/reconnect and server restart while answering a question; answer and draft remain usable.
13. Mixed-surface evidence selection, outside-project privacy, removal before/after send, reproduction cancel/Done, failed report send and explicit redacted external report confirmation.
14. Focus restoration after menus/dialogs, Escape/Tab behavior, long strings, 320/1024/desktop, dark mode, screen-reader status and no focus-capture loops.

## D. Delivery and review gate

For each affected component specify idle/loading/empty/error/disabled/stale/conflict states where applicable, who may invoke the action, persistence boundary, cancellation behavior and focus destination. Mark a state Not applicable with a reason instead of inventing controls. Use System 1 records for status, permissions and evidence; never model prose as authority. Keep report submission, task acceptance and phase transitions explicit.

Update implementation specs and handoff to cite this owner-delegated decision record, replacing obsolete Awaiting approval labels only for the decisions actually settled here. New scope discovered during design must be reported with a recommendation, not silently adopted. Record runtime data gaps as implementation dependencies, not new product questions when the behavior is already specified.

Validate HTML nesting, defined CSS classes, links, board references, EN/JA consistency and design tests. Inspect responsive renders and make sure new CSS does not change unrelated approved designs. Produce a coverage matrix for sections A–C and a changed-text list. Record real autosave, cross-window timing, screen-reader output, bridge security and browser focus as unverified until tested in the built app.

Commit only design/specification files with required attribution and push design/round-19 without force-pushing. Preserve unrelated work, transfer bundles, private data and runtime files outside commits. Do not merge into main without owner instruction. Report commit, branch, push result, checks, coverage and remaining blockers. A failed push must be reported honestly; a clean design review is not evidence that runtime behavior is implemented.

## Final review of design commit 01070dd1

[Final follow-up decisions](round-19-final-follow-up.md) resolve the additional gaps reported by the designer, including offline/save/deletion races, recording limits and identity, phone placement and canvas capacity. Apply both briefs together.
