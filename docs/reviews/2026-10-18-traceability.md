# Traceability: every item in GPT-Sol's return report has a plan

Date: 2026-10-18. Source: GPT-Sol's return report (docs/handoff, tasks 251-259) and the owner's requests recorded in it.
Each line: the item, and where it is handled. "In progress" = a repair track is working on it now on its own branch.

## Reported defects

| Item from the report | Handled by |
|---|---|
| Code task marked verified with only paperwork changed (P0) | Task 255 (partial), task 260 (in progress: real Red, no `--help` Green, scope, docs/chore) |
| Choice/plan aborts become failed requests with unsaved replies | Task 256 (fixed, confirmed); remaining abort variants and orphaned choices: task 290 |
| Renaming a project leaves a stale Pi cwd | Task 262 (in progress) |
| Repeated choice replies merge and can overwrite drafts | Task 290 |
| Question-to-task scope | Task 260 item 4 (in progress) |
| Generic crash partial replies | Task 290 |
| Live chat navigation (bug 173) | Task 257 (fixed, confirmed) |
| Decision-share instrumentation incomplete; component builds and a trace id needed | Task 292; honest decision log: task 261 (in progress) |
| Gate build identity insufficiently recorded | Task 292 |
| Context selection relevance still needs work | Task 263 (secrets and build output, in progress), task 293 (relevance, compaction) |
| Seventeen saved runs have no test-run records | Task 292 (find why the live log is absent) |
| Laya abstained on most cases (30% coverage) | Task 301 |
| 236's benchmark box open (accepted by the person) | Stays open; rerun after the repairs (task 244) |
| 243: Show lessons and the 10-second worker wait deferred | Task 243 (open boxes); installer Dock/tray: plan 221 |

## Requested features and directions

| Item from the report | Handled by |
|---|---|
| Project Start modal with capabilities (auth, multiplayer, collision, dashboards, offline, GitHub Pages, phone) | Plan 266 item 9; designer round 12 part B |
| One app, many packages (Python/HTMX; full stack, frontend only, mobile) | Plan 253; its tasks are being written now (planning track, plan 267's companion) |
| Seven improvement areas (endorsed by the owner): | |
| 1 Reliable build-and-repair loop | Task 295; task 260 (trustworthy completion first) |
| 2 Executable success criteria | Task 295 |
| 3 Capability catalog with contracts | Plan 266 items 2, 7; designer round 12 part A |
| 4 Tools that match app-building tasks | Task 296 |
| 5 Relevant task context and durable decisions | Task 293 |
| 6 Continuously runnable apps, journey tests | Task 297; the harness's own user-story tests: task 264 (in progress) |
| 7 Understandable progress and recovery | Task 298; designer round 12 part C; plan 267 (judgement UX) |
| Further proposals: safe evolution, data through change | Task 299 |
| Evaluate ongoing development (multi-turn) | Task 300 |
| Accessibility and language in the foundation | Plan 266 item 7 (blocks), round 12 part A (every block: labels, keyboard, Japanese) |
| Colibri model support | Task 294 (task 258 only recorded it) |
| Core libraries (visual, coding, gaming, music) | docs/handoff/core-libraries.md, plan 266; gaming-core input: KakkoiDev/gaming-core#1 (open) |
| Luna benchmark | Task 244 (waits for the person's key) |
| DeepSeek Flash benchmark | Task 245 (waits for the person) |
| Gate makes every judgement (the owner, 2026-10-18) | Plan 267 (being written) |
| End-to-end tests for every user story (the owner, 2026-10-18) | Task 264 (in progress) |
| Order: trustworthy completion, reliable execution and recovery, one complete app journey, reusable blocks, broader app types and packaging | Followed: tasks 260-263 and 290-292 first; then 293, 295-298; then plan 266 and 253 |

## The review's own findings

Every P0-P3 item of docs/reviews/2026-10-18-claude-review.md is in tasks 260 (verification, check-ins, scope), 261
(person-only controls, model-written decisions, runners, decision log), 262 (rename, ids), 263 (isolation, Gate crash,
secrets, small fixes), 290 (conversation), 291 (generated media). The bug hunt's findings are added when it reports.
