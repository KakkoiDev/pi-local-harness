# 333: Put action recording in test-core with a thin Workbench adapter

Kind: code
No scenarios: completed checkpoints cover the external test-core primitives and an unconnected storage foundation only. Neither exposes a control or changes a conversation. Preview transport and visible adapter/report scenarios must be added before their implementation.

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

Library checkpoint: test-core `codex/recorder-core`, commit `1d25d1a`, PR https://github.com/KakkoiDev/test-core/pull/3 (stacked on PR #2; owner merges). Workbench workflow gate passed before the core commit. Full adapter work remains open.

## Owner decisions · 2026-10-19

Round 15 is available locally. Recording starts on per project; keep at most 20 flows for 7 days. Recent means 30 minutes. Raw typed text remains excluded. This storage checkpoint exposes no runtime controls; adapter/browser scenarios precede their implementation.

## Storage foundation checkpoint

Red: tests.test_recordings failed importing the absent adapter. Green: nine scratch-only tests cover redaction, default-on persistence, cross-instance off enforcement, 20-flow/7-day retention into project-separated recording Trash, 30-minute recency, clearing/isolation, invalid IDs/symlinks, concurrent writers, storage failure and untrusted metadata. This foundation is not connected to HTTP or Preview yet. Its errors must be caught by the upcoming transport so failures never block an app or chat. Installer coverage includes the pinned local test-core primitives; no core PR was merged.
