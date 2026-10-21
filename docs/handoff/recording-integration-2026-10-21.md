# Recording integration checkpoint for Claude

21 October 2026. Round19 design closeout 2e7407f6 is fast-forwarded into main and pushed. The two canvases and settled decisions are design artifacts; this is not a claim that Overview, cross-project Ask, conflict drafts or conversation Trash are implemented.

## Implemented in this checkpoint

- Vendored test-core recorder at 46c62fa (PR3 remains upstream review scope): structural focus/blur, canvas/general element clicks, redacted input lengths and genuine navigation-key releases. No dependency downloads.
- Preview injects a default-disabled helper through its loopback proxy. Only the allowed parent origin/window can enable it. Document probes, capture sessions, settings generations and a host-run identifier prevent old documents or stopped/cleared/restarted runs from feeding a current flow. App-side messages remain untrusted, normalized evidence, never authority.
- Person-only POST /api/recordings validates registered project identity and surface. GET supplies Preview status. Storage accumulates batches into a flow under locks, honors consent atomically, rejects oversized batches before writes, and moves retention/clear results to recording Trash.
- Preview is on by default with a first-use notice, visible status, stop/start and clear confirmation. WorkStation is separately off until opt-in; its status, notice and Settings control explain the shared local profile. Phone status remains available after enabling and later stopping. Project and outside-project histories are separate. Settings actions are outside-project scope.
- Limits: 500 normalized events per flow, 50 events per request, 64 KiB request body; 20 flows/7 days per bucket. A full flow is marked truncated and stops capture. No raw typed text, labels, paths or chat/file contents are exported by the capture primitive.
- Recorder storage is initialized lazily: an unavailable recording directory cannot prevent WorkStation startup (a regression test first reproduced the crash). Recorder failures never disable ordinary message submission. No automatic model-context attachment, external publication or replay occurs.
- Fixed a pre-existing startup race exposed by design tests: a late selectChat completion could close a newer phone menu. Menu-choice revision tracking preserves the person's newer action. US354 reproduces it using a held conversation response, without sleeps or retries.

## Verification and review

Red was observed for the absent HTTP transport, storage generations/accumulation/limits, WorkStation opt-in, notice dismissal, restart protection, enabled-phone persistence and the late-menu race. The dedicated browser suite covers US352–354 through real scratch services and Preview; it includes refusal/redaction, opt-in/decline, failure without blocked chat and phone state. Host tests also execute the actual bridge helper with forged origin/window/session controls. Installer tests require every new runtime file.

Release browser run: recording, design, chat, stories, conversation and journey all passed (including 99 user stories; no expected or unexpected failures). Focused recorder/layout/runner checks: 25 passed. The full workflow gate is chained to each release commit. Earlier runs found real regressions (Node import side effects, added-helper injection expectations, narrow navigation overflow and late-menu closure); these were corrected rather than skipped. An intermediate control-scan failure was fixed by the standard DOM-helper convention and exercised selectors. No baseline gaps were added; the newly exercised OK control was removed from the existing gap baseline.

## Still open in task333

Recording History/restore UI; report/reproduction/flow attachments; System1 context selection; Stop All; full localization coverage; authenticated per-person profiles beyond the explicitly shared local profile; scroll/viewport capture and unsupported/cross-origin/browser-native coverage; richer gap/idempotent-delivery metadata and flow registration. Review exact-replay limitations and transport failure semantics before presenting this as a complete journey recorder. Browser crashes cannot guarantee final queued-event delivery.

Current UI intentionally exposes only the working capture/stop/clear/consent slice, not unimplemented report or history commands. The approved round19 designs remain the source for completing those controls and their tests. Keep task333 open. Other roadmap implementation tasks are unchanged by merging designs.

## How to check manually

Restart the installed harness after updating. Open a scratch project with a local HTML app in Preview; inspect the first-use notice, focus fields and click a canvas. Check status counts, stop, reload and clear. WorkStation recording requires its own Enable Recording confirmation from the status button or Settings. Try stopping it on a phone-sized window. Use scratch data for injected storage failures and confirm a normal chat message still sends.
