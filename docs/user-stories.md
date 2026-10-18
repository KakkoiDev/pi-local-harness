# Pi Workbench user stories

Every thing a person does with Pi Workbench, with what they must see (and what must be on disk), where they do it, and
the test that proves it end to end. Task 264. Sources: CONSTITUTION.md, README.md, harness/GUIDE.md, harness/CONSOLE.md,
docs/reference.md, docs/plans/236-plan-mode.md and rounds 7-11 of design/IMPLEMENTATION.md. Known defects are those of
[the 2026-10-18 review](reviews/2026-10-18-claude-review.md) (P0-1…P0-3, items 4-18, the P2 list); NEW-1 and NEW-2
are defects these journeys found that the review does not list.

**Surfaces:** desk = the web workbench in a desktop browser; phone = the same at 390 px (Tailscale); terminal = `plh`.

**Tests.** A *journey* drives the whole story through the real UI (or the terminal's own command handlers) and the real
services, with the scripted fake Pi, and checks the screen and the disk (files, git commits, task boxes, decision-log
rows):

- `stories.cjs` = `tests/browser/stories.cjs` (`python3 tests/browser/run.py stories`; `PI_STORIES=US-03` runs a few).
  Pi is scripted by `tests/browser/stories/<name>.json` through the fake Pi's `TEST_SCRIPT=<name>` trigger
  (`tests/fixtures/fake-pi.py`), which drives Gate the way the harness extension does. The scratch workbench is
  `tests/browser/workbench.cjs`.
- `stories.test.mjs` = `tests/harness/stories.test.mjs` (part of `node --test` and `tests/verify_workflow.py`): terminal
  stories with the extension's command handlers against a scratch workbench's real services.
- `design.cjs` and `chat.cjs` = the existing browser suites (`tests/browser/*.cjs`); they are journeys too, named here by
  their section comment.

A story whose only test is a unit or integration test (Python `tests/test_*.py`, Node `tests/harness/*.test.mjs` other
than stories) is marked *partial*: the behaviour is tested, the person's whole path is not. **xfail** marks a journey
that fails today because of a known defect; it is written with its full assertion and turns green (XPASS, "remove the
marker") when the fix merges.

## First run and install

| ID | As a person I… | Acceptance | Surfaces | Test |
|---|---|---|---|---|
| US-001 | open an empty workbench and create my first project | Only "Create Your First Project…" leads on; the composer is disabled until a project exists; the new folder has ROADMAP.md, tasks/001, a git repo; its Chat opens in Discussion | desk | stories.cjs US-001; chat.cjs (first project, F1) |
| US-007 | install with `python3 harness/install.py` and start `plh` | `plh` installs the checkout's commit, starts Pi, Gate and the web, prints the build, Web/Gate/phone addresses | terminal | partial: tests/test_auto_update.py (test_launch_installs_a_new_commit_before_starting_pi, test_the_installed_copy_can_start_its_services), tests/harness/startup-display.test.mjs |
| US-008 | reload after an update and get told what to do if the page cannot load | "start plh again" instead of dead tabs | desk | chat.cjs (startup-error: installed failure) |
| US-009 | install the optional parts (`plh setup laya`, `music`, `browser`) | Pinned, checked downloads into the toolchain folder; a mismatched download installs nothing | terminal | partial: tests/test_setup.py, tests/test_laya.py · not coverable end to end (downloads) |

## Projects

| ID | As a person I… | Acceptance | Surfaces | Test |
|---|---|---|---|---|
| US-002 | create a Web app project | The web starter (app/main.py), everything committed, its Chat opens | desk | stories.cjs US-002 |
| US-003 | create an App with no server | The static starter (js/app.mjs), committed | desk | stories.cjs US-003 |
| US-004 | create a Terminal app | The terminal starter (app/tui.py), committed | desk | stories.cjs US-004 |
| US-005 | create an Empty folder project | Only ROADMAP.md and tasks/, committed | desk | stories.cjs US-005 |
| US-006 | add an existing folder | Used in place, nothing written; its files show in Work | desk | stories.cjs US-006 |
| US-010 | rename a project and keep talking with Pi | The folder is renamed, chat stays; the next request runs in the new folder | desk, phone | stories.cjs US-010 (the fake Pi stops like Pi 1.1.0 on a session folder that is gone; fixed by task 262); rename UI: design.cjs (Task 154) |
| US-011 | create a project with the old name of a renamed one | It gets its own, empty chat | desk | stories.cjs US-011; task 262 gives every project its own id (item 16) |
| US-012 | move a project into another folder | Moves, keeps its id, chat, comments and Activity; cannot move into itself; Undo moves it back | desk, phone | design.cjs (Task 154: Move Project…); tests/test_project_commands.py |
| US-013 | remove a project from the list and add it back | The folder stays; Add Existing Folder brings the same chat back | desk, phone | design.cjs (Task 154: Remove from List…); tests/test_project_commands.py |
| US-014 | move a project to the Trash and put it back | The Mac Trash (PI_TRASH_DIR in tests); Put Back + Add Existing Folder restores it | desk, phone | design.cjs (Task 154: Move Project to Trash…) |
| US-015 | locate a project whose folder went missing | Listed as "folder missing"; Locate Folder… points it at the new place | desk | design.cjs (Audit task 150: gone folder; Task 154: Locate) |
| US-016 | find a project and switch between projects | ⌘K search, the Projects home, ‹ Projects; each project keeps its own chat | desk, phone | chat.cjs (Second project, No matching projects); design.cjs (107) |
| US-017 | keep project commands from colliding with Pi's work | Rename/move/trash wait while Pi works in that project | desk | stories.cjs US-017 (“Pi is answering about this project.”, nothing moves); tests/test_project_commands.py; P2 “rename is allowed while terminal Pi works” is open |

## Chat and requests

| ID | As a person I… | Acceptance | Surfaces | Test |
|---|---|---|---|---|
| US-020 | ask Pi something and read its answer | The answer renders as Markdown without the reply marker; it is in Activity; it survives a reload | desk, phone | chat.cjs; design.cjs (103, 143) |
| US-021 | send more while Pi works | Messages join the waiting message: one request | desk | design.cjs (Messages sent while Pi works join…) |
| US-022 | stop a request or cancel a waiting one | Stop (⌘.) ends it; Activity says Stopped; a waiting one is cancelled | desk, phone | chat.cjs (stop, Cancel the waiting request?) |
| US-023 | see what Pi sees before I send | "Pi sees:" lists the files with their reason; Why? explains each | desk, phone | design.cjs (Task 134 ContextLine, round 11 reasons); tests/test_context.py |
| US-024 | attach files or dictate | Images and text attach (drop, paste); Record transcribes into the composer | desk, phone | chat.cjs (attachments, Drop to attach); transcription: not coverable (Whisper download), partial tests/test_remote_access.py |
| US-025 | keep my drafts | Chat and document drafts survive reloads | desk | chat.cjs (drafts/conflicts) |
| US-026 | choose the model and thinking level | Menu bar menus; switching says when ready; a model without thinking dims the levels | desk, phone, terminal | design.cjs (147, round 5 task 163); tests/test_model_choice.py |
| US-027 | see the files Pi read on its own | "Also read:" after the answer | desk | design.cjs (Task 136) |

## The three phases and their controls

| ID | As a person I… | Acceptance | Surfaces | Test |
|---|---|---|---|---|
| US-031 | talk in Discussion without Pi writing anything | A write is refused ("Not written: the project is in Discussion"), shown in Activity and Gate with the project; nothing on disk | desk | stories.cjs US-031 |
| US-037 | change the phase with the phase button | ⇧⌘1–3 or the menu; each change is a phase line; Implementation is disabled with nothing planned | desk, phone | design.cjs (round 11 phase lifecycle); stories.cjs US-030, US-095 |
| US-038 | see why a refused change was refused and change phase from there | Gate's row is named by the phase, with Change Phase… and Why? | desk, phone | design.cjs (phase-refusal card) |
| US-039 | have the phase saved and shared with the terminal | The same phase after a restart and in `/status` | desk, terminal | stories.test.mjs US-100 |

## Choices

| ID | As a person I… | Acceptance | Surfaces | Test |
|---|---|---|---|---|
| US-040 | answer a question in Planning | One question per card, recommended first and preselected, Something else… last; the answer lands in the planned task's Decisions (chosen) and the decision log (person) | desk, phone | stories.cjs US-040 **xfail NEW-2** (item 6 is fixed by task 260: the choice no longer makes its own task and the plan shows) |
| US-041 | answer a question in Discussion | The settled card survives a reload; no commit, no file changed; the decision log has the answer | desk | stories.cjs US-041 |
| US-042 | answer a choice while I am typing something else | My draft stays in the composer | desk | stories.cjs US-042 **xfail item 9** (task 290) |
| US-043 | type my own answer | Something else… opens a field; typing in the composer answers the card | desk, phone | design.cjs (Round 10: A study group) |
| US-044 | get exactly one answer per question, even if I answer quickly | No merged or lost answers | desk | none (item 8, task 290: answers merge or are lost; a race needing two queued answers is not scripted yet) |

## Plans, Start Building, check-ins, Accept, Stop Here

| ID | As a person I… | Acceptance | Surfaces | Test |
|---|---|---|---|---|
| US-030 | plan, Start Building and get the first task built and verified | Plan card → Start Building (the only approval, "Plan approved: chosen") → Pi works test-first → check-in "done", Red/Green ticked, roadmap ticked, one harness commit, Next: the plan's publication audit task → Accept and Continue; decision log: plan_layout code, plan_approval person, box_ticked code, step_done code, task_acceptance person | desk | stories.cjs US-030 |
| US-032 | build an approved plan task by task | Task 1 check-in → Accept and Continue starts task 2 → Accept Task; one commit per task; every box ticked; two person acceptances logged | desk | stories.cjs US-032 |
| US-033 | see that a task without a passing test is not verified | Committed "(not verified)", the task stays open with the reason, the roadmap line open; Review First is the default | desk | stories.cjs US-033; design.cjs (empty code task) |
| US-034 | trust "verified" | A comment-only edit with an old failing run and a `--help` "green" is not verified | desk | stories.cjs US-034 (fixed by task 260) |
| US-035 | ask a question while a task is in progress | The question is answered; no check-in; the task stays in progress | desk | stories.cjs US-035 (fixed by task 260) |
| US-036 | plan another task and build only some of the waiting ones | Plan Another Task → Discussion with the waiting strip → Build the Planned Tasks… with checkboxes → Start Building approves only the checked ones | desk, phone | stories.cjs US-036; design.cjs (round 11 waiting review at 1440/390) |
| US-046 | stop after a task without accepting it | Stop Here keeps the check-in waiting; Accept Task later | desk | design.cjs (Stop Here, Accept Task) |
| US-047 | change a plan before approving it | Change… asks "What should change in the plan?" in the composer | desk, phone | design.cjs (Send Change) |
| US-048 | review a task before accepting | Review First opens the task file | desk, terminal | stories.cjs US-033 (Review First opens the task in Work); tests/harness/terminal-planning.test.mjs (review shows the actual task) |
| US-087 | step back to Discussion during a check-in and come back to accept | Implementation can be chosen again and Accept Task finishes | desk | stories.cjs US-087 (fixed by task 260) |
| US-088 | answer a question Pi asks in the middle of building | The code written before the question is part of the verified, committed task; the answer is in its Decisions | desk | stories.cjs US-088 (fixed by task 260) |
| US-089 | trust that an approved docs task that changed nothing is not "verified" | No “done” check-in, its box stays open, nothing is committed as done | desk | stories.cjs US-089 (fixed by task 260) |
| US-049 | get the plan filled before code counts | Missing Goal or Done when: one wake-up, then "Plan incomplete (G-014)", task open | desk | design.cjs (Task 233 plan-incomplete row); tests/test_paperwork.py |

## Run on its own

| ID | As a person I… | Acceptance | Surfaces | Test |
|---|---|---|---|---|
| US-045 | let Pi run on its own through a plan | Risk notice with Cancel default → Turn On; Pi takes the recommended choice (auto), the plan is approved (auto, phase line "Run on its own"), two tasks are built and each verified check-in accepted automatically; two task commits; automatic decision rows. The run then goes on to the plan's audit task, so its report comes later (US-086 checks a report) | desk | stories.cjs US-045 |
| US-052 | see the risks every time I turn it on, from anywhere | Composer checkbox, Agent menu, Settings, `/auto on`: the same alert, Cancel the default | desk, terminal | design.cjs (Same global switch…); stories.test.mjs US-102 |
| US-053 | read the report of the last run | Four sections with counts, shown again if unseen; `/report` in the terminal | desk, terminal | design.cjs (AwayCard states); partial: tests/test_autonomy.py |
| US-054 | have a run stop at an unverified task | The check-in waits with Review First; the report says not verified; the next task never starts; one marked commit | desk | stories.cjs US-054 |
| US-086 | let Pi build the approved tasks one after another on its own | Each verified check-in is accepted automatically (decision log: code, automatic); two task commits; the report Done · 2 tasks; Got It hides it for good | desk | stories.cjs US-086 |

## Undo

| ID | As a person I… | Acceptance | Surfaces | Test |
|---|---|---|---|---|
| US-050 | undo a request and redo it | Undo This Task… lists the files → a new harness commit, the file is gone, an "Undone" row → Redo Request… brings it back | desk | stories.cjs US-050; tests/test_undo.py |
| US-051 | undo after editing the same file myself | "can't be undone yet … Nothing was changed" → Save Them, Then Undo commits "Your edits · HH:MM" → "can't be undone by itself", Ask Pi Instead the default; my edit kept | desk | stories.cjs US-051 |
| US-055 | undo the last console change | `/undo` puts back `/config set`, asking first | terminal | stories.test.mjs US-103 |
| US-056 | undo a block deletion or a file rename in Work | ⌘Z / the toast's Undo, never into another document | desk | design.cjs (Audit task 150: Undo after deleting a block; 146 rename Undo) |

## Work: files, editing, comments and review, Ask Pi

| ID | As a person I… | Acceptance | Surfaces | Test |
|---|---|---|---|---|
| US-057 | edit Markdown as blocks or source | Autosaves to the file; blocks move, change type, are added from the handle | desk, phone | chat.cjs (Edited roadmap, ruler and block handle); design.cjs (100, 105, 112) |
| US-058 | create, rename, move and trash files | New File…, New Task… (numbered, on the roadmap), Rename or Move…, Move to Trash… with Undo | desk, phone | design.cjs (109, 146) |
| US-059 | comment on a passage and ask Pi about it | Comment (⇧⌘M) stays with the file until Ask Pi; Pi's answer in the thread, not in Chat; Review lists every comment and state | desk, phone | design.cjs (108, 115, 135); chat.cjs (comments, Send Request) |
| US-061 | accept a suggestion from Pi | Apply Change rewrites the passage | desk | chat.cjs (TEST_SUGGEST, Apply Change) |
| US-062 | ask Pi about the whole file | Ask Pi About This File…; the answer stays with the document | desk, phone | design.cjs (108, Ph8_Ask) |
| US-063 | handle a file changed outside | "Changed outside", Reload from disk, my draft kept | desk | chat.cjs (Reload “ROADMAP.md” from disk?) |
| US-064 | find in files | Find in Files needs Work, then searches | desk | chat.cjs (Find in Files) |

## Preview

| ID | As a person I… | Acceptance | Surfaces | Test |
|---|---|---|---|---|
| US-060 | see a page Pi built, at phone and tablet sizes | Show in Preview starts it; the page renders; Phone ≤ 390 px, Tablet 768; Open on Phone says why phone access is off | desk | stories.cjs US-060 |
| US-065 | preview a Web app (uvicorn) | Starts, reloads after Pi's change ("Pi changed N files. Reloaded.") | desk | not coverable yet: the first start runs `uv` and installs packages (a download); partial tests/test_preview.py |
| US-066 | preview an App with no server (Tailwind build) | Builds styles and serves | desk | not coverable yet: `uv tool run pytailwindcss` downloads; partial tests/test_preview.py (plain site) |
| US-067 | run a Terminal app in Preview | Restart, sizes 80 × 24 · 120 × 40 · Fit, the phone key row | desk, phone | design.cjs (Terminal Preview controls, with the status faked); the real textual-serve start: not coverable (download) |
| US-068 | ask Pi to fix an app that stopped | The last 8 lines; Ask Pi to Fix sends the last line and the 8 lines | desk | partial: tests/test_preview.py, tests/harness/preview-ui.test.mjs |
| US-069 | open my app on my phone | The app's own tailnet address and a QR | desk | not coverable: needs a real tailnet (the off state is in US-060 and design.cjs Task 141) |
| US-116 | adjust my app's colours by hand (task 312) | “I want to adjust the site’s colours” opens Pi Workbench's theme panel with no request for Pi (a code decision in decisions.jsonl); a colour picker restyles the Preview at once; Save commits “Theme: primary” as my own change, only the changed token in styles/input.css; Undo This Request… restores the file and the Preview | desk | stories.cjs US-116; tests/test_theme.py, tests/harness/theme.test.mjs |
| US-117 | ask for the theme panel in Japanese or from the menu (task 312) | 「サイトの色を調整したい」 opens it without Pi; Project › Theme… opens another; a project without the starter's CSS says “This project has no theme file.”; Save refuses a request without the person's secret | desk | stories.cjs US-117 |

## Activity and Gate

| ID | As a person I… | Acceptance | Surfaces | Test |
|---|---|---|---|---|
| US-076 | follow a request in Activity | Its state, steps, Gate checks per command, Tests from Gate's record, back to where it came from | desk, phone | design.cjs (Task 157, Task 228, 127, 128); stories.cjs US-031, US-070 |
| US-077 | read every Gate check | Rows name their project and source; filter by project; why it was allowed or blocked | desk, phone | design.cjs (129, 130); chat.cjs (Gate · All Projects) |
| US-078 | see the status and what needs me | The menu-bar status button; attention wins until Activity is opened | desk, phone | design.cjs (Task 131, Round 8 point 8) |

## Settings, language, Japanese UI

| ID | As a person I… | Acceptance | Surfaces | Test |
|---|---|---|---|---|
| US-082 | change settings | Settings apply at once (appearance, Return sends, lessons, daily update check) | desk, phone | chat.cjs (Settings apply immediately); design.cjs (Round 9 settings) |
| US-090 | use the workbench in Japanese | Settings › Language 日本語: composer, phase button (相談/計画) and plan card (実装開始) in Japanese, Pi's words unchanged, after a reload too | desk | stories.cjs US-090; design.cjs (Plan 198 Japanese, round 10 ja) |
| US-091 | use terminal Pi in Japanese | Fixed check-in words and screens follow the saved language | terminal | stories.test.mjs US-091 (web Settings 日本語 → /plan answers “フェーズ：計画”); tests/harness/terminal-planning.test.mjs, tests/harness/language.test.mjs |
| US-092 | type Japanese with an IME | The confirming Enter never sends | desk | design.cjs (121) |

## Phone (390 px) parity

| ID | As a person I… | Acceptance | Surfaces | Test |
|---|---|---|---|---|
| US-095 | plan and Start Building on my phone | Phase sheet, the plan card's 44 px Start Building, no sideways scroll | phone | stories.cjs US-095 |
| US-096 | do on the phone what the desk does | π sheet, view menu, ⋯ sheets, files as levels, comments sheet, Ask sheet, 44 px targets | phone | design.cjs (123, Round 8 points 2-11) |
| US-097 | add the workbench to my Home Screen | π › Add to Home Screen… with iPhone and Android steps | phone | design.cjs (install dialog, manifest icons) |
| US-098 | reach the workbench from my phone over Tailscale | Only configured hosts and logins are trusted | phone | partial: tests/test_remote_access.py; not coverable end to end (a real tailnet) |

## Terminal Pi console

| ID | As a person I… | Acceptance | Surfaces | Test |
|---|---|---|---|---|
| US-100 | plan and build from the terminal | `/plan`; Pi proposes; `/build` shows the tasks with Done when and Start Building first; the phase and approval are the web's | terminal | stories.test.mjs US-100 |
| US-101 | `/build` with nothing planned | Says to `/plan` first; nothing changes | terminal | stories.test.mjs US-101 |
| US-102 | turn Run on its own on and off with `/auto` | Risks with Cancel first; Turn On reaches the web; `/auto off` | terminal | stories.test.mjs US-102 |
| US-103 | change a setting and undo it | `/config set` asks first, saves, logs; `/undo` puts it back | terminal | stories.test.mjs US-103 |
| US-104 | read the live workbench | `/status`, `/projects` from the running services | terminal | stories.test.mjs US-104 |
| US-105 | find commands and how-tos | `/harness` list, Tab completion, `/guide <words>` | terminal | stories.test.mjs US-105; tests/harness/console.test.mjs (/harness opens a list…, Tab completes…) |
| US-106 | have Pi propose console changes, never make them | Pi's change goes on my input line; Return runs it, I confirm | terminal | stories.test.mjs US-106 (Pi’s harness tool puts /config set on my input line; config.json unchanged); tests/harness/console.test.mjs |
| US-107 | read Gate, the queue and one request in the terminal | `/gate`, `/gate why`, `/queue`, `/job` | terminal | stories.test.mjs US-107 (a web request in /queue all, /job, and its Gate check in /gate) |
| US-108 | manage models | `/models use|pull|remove|check`, each asks first; remove goes to the Trash | terminal | partial: tests/test_admin_ollama.py; pull: not coverable (download) |
| US-109 | answer plan, choice and check-in lists in the terminal | Recommendation first; unverified defaults to Review First | terminal | tests/harness/terminal-planning.test.mjs; tests/harness/choices.test.mjs |
| US-110 | see the phase in the footer and use phase commands outside a project | The footer's second segment; a project picker | terminal | stories.test.mjs US-110 (picker outside a project); tests/harness/phases.test.mjs, tests/harness/footer.test.mjs |

## Updates

| ID | As a person I… | Acceptance | Surfaces | Test |
|---|---|---|---|---|
| US-111 | check for updates in the web | π › Check for Updates…: up to date, can't check, blocked (Nothing was changed, Ask Pi to …), available → Updating → Updated | desk, phone | design.cjs (Round 9 update states, with the backend faked) |
| US-112 | update from the terminal | `/update` says what changed; `/update now` asks first, never overwrites my edits | terminal | partial: tests/test_updates.py, tests/test_auto_update.py, tests/harness/updates-window.test.mjs; P2 "/update now promises an install that does not happen when auto_update is false" is open |

## Music

| ID | As a person I… | Acceptance | Surfaces | Test |
|---|---|---|---|---|
| US-113 | ask for a short track and hear it in the chat | An audible WAV in the answer, with editable source | desk | chat.cjs (Make a tune TEST_MUSIC); tests/test_music_artifacts.py |
| US-114 | make or revise music in a plain folder | Allowed where the person decides | desk | not coverable yet: item 17 needs the person's decision; the render tests skip without node_modules (P2) |

## Audit

| ID | As a person I… | Acceptance | Surfaces | Test |
|---|---|---|---|---|
| US-115 | check my app is ready to publish | `/audit` asks first, runs offline, records each command in the last task, failed boxes stay open | terminal | partial: tests/harness/console.test.mjs (/audit uses the current project folder), tests/test_audit.py, tests/test_audit_backend.py |

## Privacy and person-only controls

| ID | As a person I… | Acceptance | Surfaces | Test |
|---|---|---|---|---|
| US-080 | keep secrets out of what Pi sees | .env, secrets/ and .gitignored files are never in "Pi sees" | desk | stories.cjs US-080 (fixed by task 263) |
| US-081 | be the only one who changes the phase, approves or accepts | A local process without the page's secret is refused | desk | stories.cjs US-081 (task 261: person routes need the page’s X-Pi-Person secret) |
| US-083 | never lose a file for good | Every delete goes to the Trash | desk, terminal | design.cjs (146, 154); tests/test_project_commands.py |

## Recovery

| ID | As a person I… | Acceptance | Surfaces | Test |
|---|---|---|---|---|
| US-070 | see a crash in Activity and retry it | Failed, with "Pi exited unexpectedly: …"; Ask Pi to Retry… queues it again; the failed run stays | desk | stories.cjs US-070; chat.cjs (A_Retry) |
| US-075 | see a crash in the chat | The chat says the request failed | desk | stories.cjs US-075 **xfail P2 (crash mid-answer: the chat shows nothing)** |
| US-071 | get my workbench back after plh crashed mid-request | After a restart the request is Interrupted, never repeated; the chat goes on | desk | stories.cjs US-071 |
| US-072 | get one clean answer after Pi loops | Recovery aborts, compacts, asks again once; one answer | desk, terminal | stories.cjs US-072; tests/harness/extension.test.mjs (ten-second loop check, abort/compact/reask) |
| US-073 | reload while Pi works | The answer still arrives | desk | stories.cjs US-073; chat.cjs (bug 173, back to a live chat) |
| US-074 | be told when Gate refuses or cannot check a command | A refused command is a logged block with its rule; a Gate failure is G-011, reported | desk | stories.cjs US-074 (fixed by task 263) |
| US-079 | reconnect after plh stopped | "Connection interrupted. Your drafts are kept." and Reconnect | desk | chat.cjs (offline banner) |
| US-084 | have long work never time out, only silence | Steady progress past the limit completes; silence fails with “Pi sent nothing for …” (the limit is 2 s in the scratch workbench) | desk | stories.cjs US-084; tests/test_web_chat.py |
| US-085 | find out what is wrong | `/doctor` checks and says what to do | terminal | stories.test.mjs US-085; tests/test_admin.py |

## Coverage

Counted from the tables above: 110 stories, each once, under its best status (a story with a journey and a
unit test counts as a journey). New in task 264: 39 browser journeys in stories.cjs and 11 terminal journeys in stories.test.mjs.

| Status | Count | Stories |
|---|---|---|
| Covered by a passing journey (stories.cjs, stories.test.mjs, design.cjs, chat.cjs) | 94 | US-001, US-002, US-003, US-004, US-005, US-006, US-008, US-010, US-011, US-012, US-013, US-014, US-015, US-016, US-017, US-020, US-021, US-022, US-023, US-024, US-025, US-026, US-027, US-030, US-031, US-032, US-033, US-034, US-035, US-036, US-037, US-038, US-039, US-041, US-043, US-045, US-046, US-047, US-048, US-049, US-050, US-051, US-052, US-053, US-054, US-055, US-056, US-057, US-058, US-059, US-060, US-061, US-062, US-063, US-064, US-067, US-070, US-071, US-072, US-073, US-074, US-076, US-077, US-078, US-079, US-080, US-081, US-082, US-083, US-084, US-085, US-086, US-087, US-088, US-089, US-090, US-091, US-092, US-095, US-096, US-097, US-100, US-101, US-102, US-103, US-104, US-105, US-106, US-107, US-110, US-111, US-113, US-116, US-117 |
| Expected failure (xfail), with its review item | 3 | US-040 (NEW-2, nearest open task 293), US-042 (item 9, task 290), US-075 (P2 crash mid-answer) |
| Partial: unit or integration tests only, no journey yet | 6 | US-007, US-068, US-108, US-109, US-112, US-115 |
| Not coverable yet | 6 | US-009 (downloads (Laya, music, browser setup)), US-065 (the first start runs uv and installs packages), US-066 (uv tool run pytailwindcss downloads), US-069 (a real tailnet), US-098 (a real tailnet), US-114 (item 17 waits for the person’s decision; the render tests skip without node_modules) |
| No test | 1 | US-044 (item 8, task 290: two quick answers; the race is not scripted yet) |

The browser journeys run in about two minutes (`python3 tests/browser/run.py stories`), the terminal ones in about two
seconds (`node --test tests/harness/stories.test.mjs`).

### NEW-1 and NEW-2 (found by these journeys, not in the review)

- **NEW-1, fixed on harness-next.** At c2f527e, `propose_plan` (gate/paperwork.py) laid out each task ending with
  `## Decisions`, then appended `Request <date>: “…”` to the first task under that heading; G-017 refused every line
  there without `(chosen|auto|given)`, so every write of the first planned task was refused and Planning → Start
  Building → build never produced code. After merging tasks 260-263, US-030 and US-045 pass.
- **NEW-2, open (nearest: task 293).** An answer given in Planning before the plan exists is kept in harness data
  (task 260's fix of item 6) and never reaches the planned task's `## Decisions`; the plan card says "0 decisions",
  against harness/GUIDE.md ("During Planning and Implementation, answers are kept in the task’s Decisions section").
  US-040 stays an expected failure.

Journeys that start after an approval (US-032, US-033, US-050, US-051, US-054, US-060, US-086…089) use
`givenApprovedTasks`: the task files System 1 lays out, approved with Start Building through the same Paperwork the
services use, as design.cjs does.

Web POSTs from Node send the page's person secret (`X-Pi-Person`, read from the page as js/ui.mjs `personHeaders`
does), like the person's own page; US-081 checks that a POST without it is refused.
