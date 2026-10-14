# Project Dashboard

## Completed portfolio foundation

- [x] [01-Setup](tasks/01-setup.md)
- [x] [02-Layout & Sections](tasks/02-layout-sections.md)
- [x] [03-Refinement](tasks/03-refinement.md)
- [x] [04-Watchdog-Sentinel (superseded by task 16)](tasks/04-watchdog-sentinel.md)
- [x] [05-Architectural Spec](tasks/05-architectural-spec.md)
- [x] [06-Core Components](tasks/06-core-components.md)
- [x] [07-Project Components](tasks/07-project-components.md)
- [x] [08-htmx Integration](tasks/08-htmx-integration.md)
- [x] [09-Final Migration](tasks/09-final-migration.md)
- [x] [10-Regression Suite](tasks/10-regression-suite.md)
- [x] [11-Update Branding](tasks/11-update-branding.md)
- [x] [12-SOP Update](tasks/12-sop-update.md)
- [x] [13-Orchestration Layer](tasks/13-orchestration-layer.md)
- [x] [Guardian Architecture Blueprint](specs/master_blueprint.md)

## Harness implementation

- [ ] [14-Website Agent Interaction](tasks/14-agent-interaction.md) — UI/API exist; website LLM integration and persona remain open.
- [ ] [15-Gate Core](tasks/15-implement-gate-core.md) — allow/block and audits work; revise/escalate behavior and full integration coverage remain open.
- [x] [16-Sentinel Reliability Checks](tasks/16-sentinel.md)
- [ ] [17-Pilot Console](tasks/17-pilot-console.md) — pi status display exists; supervisory web dashboard remains open.
- [ ] [18-Data Model Protocols](tasks/18-data-model.md) — basic dataclasses exist; richer structured protocols remain open.
- [ ] [19-Capture and Replay Evaluation](tasks/19-evaluation.md)
- [x] [20-Pi Harness Boot Sequence](tasks/20-boot-sequence.md)
- [x] [21-Pi Local Harness](tasks/21-pi-harness.md)
- [x] [22-Multimodal Paths and Global Memory](tasks/22-multimodal-global-memory.md)
- [x] [23-Message Timestamps and Startup Defaults](tasks/23-message-timestamps.md)
- [x] [24-Roadmap Status Reconciliation](tasks/24-roadmap-status.md)

Last updated: 2026-10-13. See task files for individual completed and remaining steps,
and harness/README.md for the installed pi workflow.

## Reliability and portability improvements

- [x] [25-Laya enforcement](tasks/25-laya-enforcement.md)
- [ ] [26-Verified incident memory](tasks/26-verified-memory.md)
- [ ] [27-Recovery console](tasks/27-recovery-console.md)
- [ ] [28-Japanese audio evaluation](tasks/28-japanese-audio.md)
- [x] [29-Portable pi package](tasks/29-portable-package.md)
- [ ] [30-Local evaluation suite](tasks/30-local-evaluations.md)

- [x] [31-Destructive shell guard and architecture guide](tasks/31-destructive-shell-guard.md)

- [x] [32-Mobile multimodal web chat](tasks/32-web-chat.md)

- [x] [33-Clickable Pi service URLs](tasks/33-clickable-service-links.md)

- [x] [35-Single startup display and visible links](tasks/35-startup-display.md)

- [x] [34-Live Laya activity tab](tasks/34-laya-tab.md)

- [x] [36-Scrolling startup links](tasks/36-scrolling-startup-links.md)

- [x] [37-Home workspace and one active agent](tasks/37-home-single-agent.md)

- [x] [38-Project documents, project chat, and agent queue](tasks/38-project-documents.md)
- [x] [39-Dedicated PLH launcher and configuration](tasks/39-plh-launcher.md)

- [x] [40-Correct harness data directory and first-launch config](tasks/40-harness-data-directory.md)

- [x] [41-Workbench navigation and visual polish](tasks/41-workbench-ux.md)
- [x] [42-Draft safety and resilient live UX](tasks/42-resilient-ux.md)

- [x] [43-Document comments and Markdown activity](tasks/43-document-comments-activity.md)
- [x] [44-Navigation regression and update recovery](tasks/44-navigation-regression.md)

## Audit 2026-10-13 fixes

- [x] [45-Laya API lockdown](tasks/45-laya-api-lockdown.md)
- [x] [46-Pi CLI compatibility](tasks/46-pi-cli-compatibility.md)
- [x] [47-Real verification gate](tasks/47-real-verification-gate.md)
- [x] [48-Runtime data out of the repository](tasks/48-runtime-data-out-of-repo.md)
- [x] [49-Web handler robustness](tasks/49-web-handler-robustness.md)
- [x] [50-Pinned model](tasks/50-pinned-model.md)
- [x] [51-Commit protocol gate](tasks/51-commit-protocol-gate.md)
- [x] [52-Protocol review fixes](tasks/52-protocol-review-fixes.md)

## Laya as guide and judge

- [x] [53-Durable test evidence](tasks/53-durable-test-evidence.md)
- [x] [54-Task kinds decide the required steps](tasks/54-task-kinds.md)
- [ ] [55-Gate guides each step](tasks/55-step-guide.md)
- [ ] [56-Discussion, planning, implementation, check](tasks/56-work-phases.md)
- [ ] [57-Show phase, task, step, and a manual release](tasks/57-phase-visibility.md)

## Unattended runs

- [ ] [58-Fresh context per task](tasks/58-fresh-context-per-task.md)
- [ ] [59-Stuck detection](tasks/59-stuck-detection.md)
- [ ] [60-ntfy notifications](tasks/60-ntfy-notifications.md)
- [ ] [61-Red means a test failure](tasks/61-real-exit-codes.md)
- [ ] [62-Stale agent lock recovery](tasks/62-stale-agent-lock.md)
- [ ] [63-Node version check at launch](tasks/63-node-version-check.md)
- [ ] [64-Per-task report for check](tasks/64-task-report.md)
- [x] [65-Remove portfolio leftovers](tasks/65-remove-portfolio-leftovers.md)

## Remote use

- [ ] [66-Phone access over Tailscale and voice input](tasks/66-tailscale-voice-input.md)
- [x] [67-Parallel inference experiment (check MLX fix first)](tasks/67-parallel-inference-experiment.md)

## Pi Workbench System 1

Design: [DESIGN.md](DESIGN.md), [design/README.md](design/README.md), build order in [design/IMPLEMENTATION.md](design/IMPLEMENTATION.md) § 12.

- [x] [68-Design foundations](tasks/68-design-foundations.md)
- [x] [69-Design tokens, components, icons](tasks/69-design-tokens-icons.md)
- [x] [70-Design markup and layout](tasks/70-design-markup-layout.md)
- [x] [71-Design menu bar](tasks/71-design-menu-bar.md)
- [x] [72-Design dialogs](tasks/72-design-dialogs.md)
- [x] [73-Design chat states](tasks/73-design-chat-states.md)
- [x] [74-Design ruler and block handle](tasks/74-design-ruler-block-handle.md)
- [x] [75-Design comments](tasks/75-design-comments.md)
- [x] [76-Design Activity](tasks/76-design-activity.md)
- [x] [77-Design Laya](tasks/77-design-laya.md)
- [x] [78-Design Settings](tasks/78-design-settings.md)
- [x] [79-Design Phone](tasks/79-design-phone.md)
- [x] [80-Design Open on Phone](tasks/80-design-phone-url.md)
- [x] [81-Design Laya Checks](tasks/81-design-laya-checks.md)
- [x] [82-Design Apply Change](tasks/82-design-apply-change.md)
- [x] [83-Design Activity and Laya Fields](tasks/83-design-activity-laya-fields.md)
- [x] [84-Design Turn Into Submenu](tasks/84-design-turn-into.md)
- [x] [85-Design Phone Filters](tasks/85-design-phone-filters.md)
- [x] [86-Design Project Rows](tasks/86-design-project-rows.md)
- [x] [87-Design Fonts](tasks/87-design-fonts.md)
- [x] [88-Design File Rows](tasks/88-design-file-rows.md)
- [x] [89-Design Model Copy](tasks/89-design-model-copy.md)
- [x] [90-Design Tablet Layout](tasks/90-design-tablet.md)
- [x] [91-Kind chore](tasks/91-kind-chore.md)
- [x] [92-Open decisions 2026-10-13](tasks/92-decisions-2026-10-13.md)
- [x] [93-System chrome font](tasks/93-system-chrome-font.md)
- [x] [94-Show resolved row](tasks/94-show-resolved-row.md)
- [x] [95-Breakpoint overflow](tasks/95-breakpoint-overflow.md)
- [x] [96-Laya renamed Gate](tasks/96-rename-gate.md)
- [x] [97-Files window: Plan above Files](tasks/97-files-plan-group.md)
- [x] [98-Block adding matches the design](tasks/98-block-adding-audit.md)
- [x] [99-plh follows the checkout](tasks/99-plh-auto-update.md)
- [x] [100-Document checkboxes use pw-check](tasks/100-document-checkbox.md)
- [x] [101-Empty states use pw-empty](tasks/101-empty-states.md)
- [x] [102-Inline comment thread opens below its passage](tasks/102-inline-thread-below.md)
- [x] [103-Chat renders Markdown and hides the reply marker](tasks/103-chat-markdown.md)
- [x] [104-Work view drops the extra top buttons](tasks/104-work-chrome.md)
- [x] [105-Blocks are added from the handle and the page end](tasks/105-notion-blocks.md)
- [x] [106-Views and selections live in the URL](tasks/106-url-routes.md)
- [x] [107-Projects home, then inside a project](tasks/107-projects-home.md)
- [x] [108-Comments reach Pi from the Review list](tasks/108-comments-to-pi.md)
- [x] [109-New File… replaces New Page…](tasks/109-new-file.md)
- [ ] [110-Startup says how to turn on phone access](tasks/110-phone-off-hint.md)
- [x] [111-Re-sync the design copies](tasks/111-design-resync.md)
- [x] [112-Block types look different](tasks/112-block-type-styles.md)
- [x] [113-Live Reasoning stays open](tasks/113-live-reasoning-stays-open.md)
- [x] [114-Small, chosen context per request](tasks/114-smart-context.md)
- [x] [115-Comments and whole-file questions run in their own context](tasks/115-separate-document-context.md)
- [x] [116-The harness compacts long chats before they overflow](tasks/116-compaction-policy.md)
- [ ] [117-Show what Pi sees and how full the chat is](tasks/117-context-visible.md)
- [ ] [118-Activity and Gate are app-level windows](tasks/118-agent-scope.md)
- [x] [119-Brief for the designer: agent scope and context](tasks/119-designer-brief.md)
- [x] [120-Back up the design artifacts](tasks/120-design-backup.md)
- [x] [121-Enter that confirms Japanese input never sends](tasks/121-ime-enter.md)
- [x] [122-Phone address as a QR code](tasks/122-phone-qr.md)
- [x] [123-The phone matches the phone boards](tasks/123-phone-matches-boards.md)
- [x] [124-Phone comment composer and thread sheets](tasks/124-phone-comment-sheets.md)
- [x] [125-Reasoning renders Markdown and wraps](tasks/125-reasoning-markdown.md)
- [x] [126-Re-sync the design after the agent-scope brief](tasks/126-design-resync-2.md)
- [x] [127-Routes /activity and /gate](tasks/127-app-routes.md)
- [x] [128-Activity and Gate are app windows; the project window has Chat | Work](tasks/128-app-windows.md)
- [x] [129-Gate events know their project and source](tasks/129-gate-project-source.md)
- [x] [130-Projects window: Projects group and Agent section](tasks/130-agent-section.md)
- [x] [131-The menu bar status is a button](tasks/131-status-button.md)
- [x] [132-Phone and tablet for app-level Activity and Gate](tasks/132-phone-agent.md)
- [x] [133-Server: the context preview Pi will get](tasks/133-context-preview.md)
- [x] [134-"Pi sees:" lines](tasks/134-context-line.md)
- [x] [135-Thread and Review states, Show in Activity, whole-file answer cards](tasks/135-comment-states.md)
- [x] [136-"Also read:" after answers](tasks/136-also-read.md)
- [ ] [137-Context meter in Chat](tasks/137-context-meter.md)
- [ ] [138-Compaction marker and Compact Now](tasks/138-compaction-marker.md)
- [ ] [139-New Conversation and Earlier Conversations](tasks/139-new-conversation.md)
- [x] [140-Document blocks follow the DocumentBlock card](tasks/140-block-markup.md)
- [x] [141-New File help and Open on Phone when phone access is off](tasks/141-dialogs-phone-off.md)
- [x] [142-Voice input gives only what was said](tasks/142-whisper-clean-text.md)
- [x] [143-Markdown tables render as tables in chat](tasks/143-chat-tables.md)
- [x] [144-The phone composer stays small](tasks/144-phone-composer-height.md)
- [x] [145-Re-sync the design after round 3](tasks/145-design-resync-3.md)
- [x] [146-Rename, move and trash files and folders](tasks/146-rename-move-trash-files.md)
- [x] [147-Choose the model and the thinking level from the menu bar](tasks/147-model-and-thinking-menus.md)
- [x] [148-Messages sent while Pi works join one waiting request](tasks/148-join-waiting-messages.md)
- [ ] [149-Re-sync the design after round 4, and build its changes](tasks/149-design-resync-4.md)
- [x] [150-Fix what the 2026-10-14 audit found](tasks/150-audit-fixes.md)
- [ ] [151-Plan a reusable UI component library](tasks/151-ui-component-library.md)
- [ ] [152-Plan the move to htmx 4 with server-sent events](tasks/152-htmx-sse.md)
- [x] [153-A removed model falls back; voice input in comments; the thinking menu keeps its width](tasks/153-missing-model-and-comment-voice.md)
- [x] [154-Rename, move, remove and trash a project](tasks/154-project-commands.md)
- [x] [155-The block handle shows the hand](tasks/155-block-handle-cursor.md)
- [ ] [156-Plan the chat orchestrating a worker](tasks/156-chat-orchestrates-worker.md)
- [x] [157-From "working" to its activity, and back in one click](tasks/157-working-to-activity-and-back.md)
- [x] [158-Plan terminal Pi as the harness console](tasks/158-terminal-console.md)
- [x] [159-The harness console in terminal Pi: read commands](tasks/159-console-read-commands.md)
- [x] [160-The console changes settings and the model, after a yes](tasks/160-console-changes.md)
- [x] [161-Measure whether a model answers two requests at once](tasks/161-model-capability-check.md)
- [x] [162-The console changes Ollama's settings and manages models](tasks/162-console-ollama-and-models.md)
- [ ] [163-Re-sync the design after round 5, and build its changes](tasks/163-design-resync-5.md)
- [x] [164-Requests run in two lanes; the chat goes first with a one-at-a-time model](tasks/164-queue-lanes.md)
- [x] [165-Long requests are fine; only silence fails](tasks/165-long-requests.md)
- [x] [166-Every setting and variable in the console](tasks/166-every-setting-in-the-console.md)
- [x] [167-A guide for new users, and the console as a tool for Pi](tasks/167-guide-and-harness-tool.md)
- [x] [168-tailscale serve: a slow failure is not a running serve](tasks/168-serve-readiness.md)
- [x] [169-Console output: a missing config.json is fine; the queue names projects](tasks/169-console-output-fixes.md)
- [x] [170-Design terminal Pi with the designer (round 6)](tasks/170-terminal-design-round-6.md)
- [x] [171-Build terminal Pi from the round 6 boards](tasks/171-terminal-round-6-build.md)
