# 318: Repair the independent review findings and hand back to Claude

Kind: code

Owner request 2026-10-18: fix all detected issues and make a full report to Claude. Scope: capability test privacy/network policy, project-bound paths for themes/fonts/capabilities, failing baseline refusal, keyboard/search preservation, Project Start intent persistence, browser readiness and regression coverage. The owner added the critical visible-question/blocked-conversation failure: persist live cards before displaying them, preserve answers during finalization, keep phase intent advisory and exercise concurrent answers and continued conversation. Larger planned features and cross-package journeys remain their existing tasks, not implementation in this repair.

- [x] Red: isolated regressions for data access, escaped paths, failing baseline, filtered keyboard selection and startup readiness.
- [x] Repair the reproduced bugs without downloads; install and restart the authorized Workbench build after verification; retain existing designs.
- [x] Add focused unit/integration and browser coverage, run the full workflow and complete browser suites.
- [x] Report changes, evidence, review limits and outstanding roadmap/user-story work to Claude; reconcile stale coverage notes.

## Evidence

Red: isolated review regressions initially failed (including live-card persistence and uncertain phase intent); US-142 failed its filtered-row assertion before repair. Green: complete workflow passed; all 63 stories and the dedicated conversation suite passed separately. The final combined browser run is checked again before commit. Build installation and restart are release steps recorded in the session response.

## For the person

Answer cards work as soon as they appear, keep your answer and let you continue talking. Project Start keeps its search and keyboard selection.
Tried it: scratch browsers, concurrent tabs, reloads, drafts, attachments and the complete workflow.
