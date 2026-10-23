# 333: Put action recording in test-core with a thin Workbench adapter

Kind: code
Scenarios below cover the next Preview adapter slice; report/context/reproduction journeys must be added before their implementation.

Request 2026-10-19: action recorder belongs in test-core; Workbench focuses on the agentic loop.

- [x] Inspect the stopped prototype without modifying it and identify reusable boundaries.
- [x] Red before Green for a reusable privacy boundary, deliberately failing replay skeletons and in-app recorder.
- [x] Add adoption integration, bounded delivery and browser tests in test-core.
- [x] Open the test-core PR and record exact verification evidence in the handback.
- [ ] Finish guarded Preview injection and project-owned flow storage as a thin adapter, including retention, consent enforcement and context attachment through System 1.
- [ ] Design any new report controls first; only draft an issue after the person's explicit yes. Raw typed-text inclusion requires a separate explicit choice and implementation review.
- [ ] Cover the complete adapter/report/context journey, run the required suites and update the handback.

## Evidence boundaries

The initial library slice intentionally uses structural selectors and redacts all values; it does not retain raw text for later export. It has no transport or persistence. Its replay skeletons always fail until an expected outcome is supplied. This is not a shipped recorder in Workbench. Keep this task open until the adapter and its journeys are verified. Do not copy the stopped prototype wholesale: short raw values and passing assertion-free replay skeletons were found during review.

Library checkpoint: test-core `codex/recorder-core`, commit `46c62fa`, PR https://github.com/KakkoiDev/test-core/pull/3 (stacked on PR #2; owner merges). Workbench workflow gate passed before the core commit. Full adapter work remains open.

## Owner decisions · 2026-10-19

Round 15 is available locally. Recording starts on per project; keep at most 20 flows for 7 days. Recent means 30 minutes. Raw typed text remains excluded. This storage checkpoint exposes no runtime controls; adapter/browser scenarios precede their implementation.

## Storage foundation checkpoint

Red: tests.test_recordings failed importing the absent adapter. Green: nine scratch-only tests cover redaction, default-on persistence, cross-instance off enforcement, 20-flow/7-day retention into project-separated recording Trash, 30-minute recency, clearing/isolation, invalid IDs/symlinks, concurrent writers, storage failure and untrusted metadata. This foundation is not connected to HTTP or Preview yet. Its errors must be caught by the upcoming transport so failures never block an app or chat. Installer coverage includes the pinned local test-core primitives; no core PR was merged.

## Scenarios

### US-352 Preview records focus and canvas clicks and stopping rejects late actions
Given a registered scratch project with an app running in Preview
When I focus an input, click a canvas, stop recording, reload, enable recording and clear history
Then safe structural focus and click steps are retained, stopped actions are refused, and history moves to Trash

## Round 19 design dependency

The owner confirmed recording must cover both WorkStation and Preview. Missing WorkStation controls, scope/privacy states and mixed-surface journeys are collected in [the round 19 brief](../design/briefs/round-19.md). Round19 is merged at `2e7407f6`; its WorkStation controls supply the design for this implementation. Earlier briefs remain historical decision records.

### US-353 WorkStation recording requires opt-in and never blocks conversation
Given a scratch WorkStation on the Projects screen
When I enable WorkStation recording, switch into a project, then stop it or its storage becomes unavailable
Then structural actions stay in their original scope, stopping is independent of Preview, and I can still send a message

## Adapter implementation checkpoint · 21 October 2026

Red: transport absent; storage did not accumulate batches, invalidate clear/stop generations or enforce atomic limits. WorkStation opt-in, host-persisted notice dismissal and host-run rejection each failed before implementation.

Implemented: Preview bridge checks source/origin, document probe, generation and host run; project-owned storage; default-off WorkStation opt-in and separate outside-project/project buckets; visible first-use notices; persisted stop/notice state; clear to recording Trash; 500-event flows, 50-event batches and 64 KiB transport; full-flow truncation; shared-profile disclosure; recording failures isolated from message submission. Local test-core commit46c62fa is vendored with provenance. No dependency downloads.

US-352 exercises real iframe focus/canvas capture, redaction, stop, reload and clear. US-353 exercises opt-in/decline, scope switching, independent Preview setting and usable chat during recorder failure. Full-suite results go in the handoff after verification.

Still open: Recording History and restoration UI; report/reproduction/attachment flow; System1 context selection; full EN/JA copy coverage and cross-device identity integration. These are decided designs, not new product questions. Keep this task open.

### US-354 A late chat load preserves the phone menu I just opened
Given startup is waiting for the selected conversation
When I open the phone project menu before that conversation finishes loading
Then the menu stays open and New Project remains usable

## Stop All checkpoint · 23 October 2026

- [x] Red: missing host action returned 400; the browser could not find Stop All Recording; Tab closed its popover before reaching that control.
- [x] Stop both surfaces across registered projects; preserve history and invalidate old batches even after re-enabling. Use person authentication and existing project registry, with no submitted file paths.
- [x] US356 exercises both popovers, keyboard access, focus return and mirrored notices across two windows. Host tests cover refusal without person authentication and failure without claiming success.

Full release verification is required by the chained commit gate and the complete browser runner. History, restoration, report attachments and System1 context remain open; this checkpoint does not finish task333.

## For the person

Stop All Recording stops WorkStation and every registered Preview without clearing history. Preview and WorkStation have separate action-recording controls; WorkStation asks before enabling. A recorder failure leaves the conversation usable.
Tried it: scratch browser journeys cover focus/canvas capture, stop/reload/clear, opt-in, a storage failure while sending, and a late-loading phone menu. Full release results are in docs/handoff/recording-integration-2026-10-21.md.

### US-356 Stop All Recording stops both surfaces across windows without losing history
Given two WorkStation windows and recorded Preview actions in two projects
When I choose Stop All Recording from either recording popover
Then both surfaces stop in both windows, old batches are refused, and the recorded history stays available
