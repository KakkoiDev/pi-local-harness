# Handoff to the designer AI · 24 October 2026

Review the shipped task 321 integration, reconcile round 15 with the person's final decisions, then prepare remaining designs. This handoff is design work, not permission to change backend behavior. Read CONSTITUTION.md first; System 1 decides and the person's explicit phase/acceptance controls remain authoritative.

## Read locally

- design/IMPLEMENTATION.md, round 15 B; design/system/components/PreviewWindow/README.md.
- R15_PreviewAddress, R15_PreviewUsers, R15_PreviewBlocked, R15_PreviewStates, R15_PreviewNarrow, R15_PreviewStrings; Ph15_PreviewAddress, Ph15_PreviewAddressSheet, Ph15_PreviewStopped.
- tasks/321-preview-address-and-browser-windows.md and docs/handoff/development-audit-2026-10-24.md.
- design/briefs/plan-checklist.md; existing round 19 briefs, decisions and closeout. Preserve both canvas manifests and existing boards.

## Decisions already made — do not reopen

1. Keep the local web Preview port stable for a project's current harness session. Stopping/restarting the harness may change it. App-server and Preview ports can differ; explain the usable one. Do not imply that the local proxy controls the separate phone/terminal lifecycle.
2. Omit browser-window counts and popup-block detection. Secure `noopener` windows do not reliably expose handles. Show the fallback link and Copy Address whenever the app can be opened, without claiming the browser blocked anything.
3. New windows preserve the page and App language and never start/restart an app. Windows share browser sign-in/storage; a second account requires a private session or another browser profile. WorkStation never promises to open a private window.
4. Remote devices use only the guarded Tailscale address. Do not show localhost as a usable remote address.

## Review and reconcile

The implementation uses the approved pw-address/pw-addr/pw-reason classes, a native modal dialog with Close, contained focus and Escape restoration, the visible address/port, disabled reasons, Window menu/⌃⌥B, status note and always-available fallback. New strings have Japanese entries. Review desktop 1440/1024 and phone 390/320, keyboard/focus, touch targets, dark/light themes, long names/addresses and Japanese wrapping. Reconcile the old “blocked” and count drawings and card text with decisions 1–4; leave no contradictory acceptance journey.

Review the implemented anchored desktop dialog and bottom phone sheet against the boards, especially placement near viewport edges, the Close control, focus and stopped-state updates. The implementation uses native modal focus containment with the existing approved component classes; specify any visual corrections before reworking the integration. Review the space used by fallback + status + first-use account notice so they remain readable without crowding the app. Do not remove the fallback to save space.

## Remaining design requests — consult the existing plan before expanding scope

- Task 362: finish the approved-plan checklist above the composer, task and step progress, waiting-for-check state and phone folding. Its backend progress snapshot exists; design/briefs/plan-checklist.md has the scenarios.
- Task 350: embed selected run/tool evidence in Actions, including live/history selection, refused versus executed, provenance, unknown/truncated data, copy/export and read-only behavior. A standalone Agentplay viewer is not the requested product.
- Tasks 338–342: ICM skill management, permanent Brain/configuration workspace, AI-powered Python/HTMX starter, and Jikko-based editor. The owner wants WorkStation to integrate these projects. Start from docs/plans/337-pi-workstation-skills-and-knowledge.md; do not turn proposals or an unverified runtime revision into approved behavior.
- Preserve and audit round 19 recorder/report/history/repair designs against their existing decisions. Recording covers WorkStation and Preview, with consent, limits, retention, shared-profile privacy and cross-window stop behavior. Do not redraw settled flows without identifying the actual missing state.

For each deliverable include desktop/1024/390/320, English/Japanese, dark/light, loading/empty/error/stopped/permission states, keyboard and screen-reader behavior, components, exact copy, required backend data, Given/When/Then journeys and an explicit changed-earlier-text list. Clearly distinguish existing approved behavior from genuinely new product decisions. Update both design system and HTML/canvas exports, manifests/index and IMPLEMENTATION.md consistently.

Commit only your design/spec/handoff files with attribution and push a design branch, without force-push or overwriting implementation. If credentials prevent pushing, report the exact local branch/commit and failure; do not claim publication. Include a concise handoff mapping every decision to boards/components and noting what needs runtime verification. Never include transfer bundles, runtime files, secrets or personal data in a commit.
