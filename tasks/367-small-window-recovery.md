# 367: Recover small-window replies and suppress routine phase-only reports

Kind: code

Request 2026-10-24: compaction says session too small, the first request fails, and a manual Retry answers; routine Discussion phase refusals still produce empty reports.

- [x] Red: reproduce compaction refusal and phase-only report noise.
- [x] Recover output-limit stops with a bounded request-only context projection, preserving saved history and authoritative instructions, phase and approvals.
- [x] Hide nothing-changed reports containing only routine G-015 phase refusals; preserve audit evidence and reports with other failures or actions.
- [x] Green: workflow and all browser suites; commit, push, install and smoke test.

## Scenarios

### US-369 terminal: an output-limited reply recovers when the session is too small to compact
Given a reasoning-only output-limit stop with Pi unable to compact a small session
When the harness retries within the existing budget
Then the current request is retained, old tool output is excluded from the model context, saved history is unchanged and the phase remains authoritative

### US-370 routine phase refusals do not create an unattended report card
Given an unattended Discussion request that changed nothing and only received phase refusals
When I reload the chat
Then no report card appears and its audit record remains available

## Verification

Red: compaction-dependent recovery and phase-only report visibility regressions failed before implementation. Green: workflow plus all six browser suites, including real Pi J16 with a model that refuses retries retaining old tool results, and US-370 reload suppression. Unit coverage preserves original request, durable history and fresh retry tool results. No downloads or private project changes. Live-model quality and native accessibility remain unverified; installed smoke is reported at session closeout.
