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
| A decision row labelled Laya needs provenance reconciliation | Resolved by the log review: Laya ran for two requests on 8184f73 (abstention at 0.54); the rest were pre-Laya |
| Approved tests run project code with the person's permissions | Task 311 (sandbox) |
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
secrets, small fixes), 290 (conversation), 291 (generated media).

## The second bug hunt (2026-10-18)

| Finding (hunt item) | Handled by |
|---|---|
| 1 Terminal Pi exits on lines wider than the terminal (P0); 9, 10, 25 footer, tool row, console crashes | Task 302 |
| 2, 3, 13, 14, 15, 27 starters: README commands refused, tests fail out of the box, app.css, skeleton tied to notes, failed first commit, cleanup gaps | Task 303 |
| 4, 5, 26 Preview server: symlinks, dotfiles, listings, Host; Open on Phone without user check; terminal preview Origin; iframe sandbox | Task 304 |
| 12, 26 clickjacking, nosniff, error text | Task 305 |
| 6, 7, 8, 18 polling cost, Red proof under the lock, 2,000-file limit, unbounded logs | Task 306 |
| 11, 21, 22, 23, 24 Working state, Japanese gaps, phone overflow and targets, model errors in Work, stopped/failed line | Task 307; the failed-reply line also task 290 |
| 16 first-turn context full of starter files | Task 293 |
| 17 task_box corruption; doc drift 7, 12-15 | Task 308 |
| 19 browser tool opens the workbench, not the app | Task 297 |
| 20 and doc drift 1-6, 8, 10, 11 (harness tool refused, AGENTS.md memory refused, wake-ups, shell rules, /guide topics, commit protocol, command lists, README) | Task 290 |
| Doc drift 9: the risk notice promises push/publish/download Gate refuses | Task 309 |
| Proposals 1-7 (check tool, first command, compact context, see the app, generic skeleton, recovery journey, stable plan view) | Tasks 296, 303, 293, 297, 303, 298, 306 |
| Needs design (dark mode default, Markdown links in Work, repeated question, composer text, stopped requests, phone menu in Japanese, Working on <project>) | Designer round 12 part C |
| Incident: the hunt created three test folders in the person's home; moved unchanged to the scratchpad, nothing registered | Reported to the person |

## The person's requests in this session (2026-10-18)

| Request | Handled by |
|---|---|
| Fix all review findings | Tasks 260-263 (in progress), 290, 291 |
| Generated media outside an approved task (option A) | Task 291 |
| More bugs and improvements; designer handoff | The bug hunt above; design/briefs/round-12.md |
| gaming-core: controller, keyboard and mouse input | KakkoiDev/gaming-core#1 (open, for the person to merge); Pong paddles off-screen: plan 266 item 2 |
| App features (login, side panels…), charts, other elements | Round 12 part A; plan 266 items 6-7; chart library: the person's choice (Chart.js 4 recommended) |
| Any app: online shop, admin dashboard, portfolio, Notion, Slack, GitHub clones | Round 12 part A "Whole apps"; plan 266 item 7 |
| Any 2D game: RPG, shooter, cozy, roguelike, card game… | Round 12 "Whole games"; plan 266 item 2 (genre starters) |
| visual-core pixel art and SVG with deterministic tools and a content library | Plan 266 items 3-5; round 12 art direction |
| HTMX + Python compiled to any platform | Plan 253; tasks being written (planning track); decisions: task 310 |
| End-to-end tests for every user story | Task 264 (in progress) |
| Gate makes every judgement, with its UX | Plan 267 (being written); task 298 |
| Core-libraries handoff (visual, coding, gaming, music) | docs/handoff/core-libraries.md, plan 266 item 8 (adapters) |
| Colibri | Task 294 |

## Second pass (gaps found and closed)

Test runs unsandboxed (task 311); two Gate processes sharing the data folder (task 306); `plh setup browser`'s hash and
the Red proof's audit (task 308); Pong paddles off-screen (plan 266 item 2).

## Found by the user-story tests (task 264)

NEW-1 (`propose_plan` put the Request line under Decisions, so G-017 blocked every first planned task): fixed on
harness-next. NEW-2 (Planning answers never reach the plan's Decisions): task 293. US-042 (draft wiped) and US-075 (crash
shows nothing in the chat): task 290. US-044 (two quick answers) needs a scripted race: task 290.
