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
| US-002 | create a Web app project (round 12: the Web app package in Project Start) | The web starter (app/main.py) and packaging.json; Create ran the base's tests (Gate's test evidence) and they passed; everything committed, its Chat opens | desk | stories.cjs US-002; tests/test_capabilities.py |
| US-003 | create an App with no server (the package) | The static starter (js/app.mjs); its base tests ran with Node and passed; committed | desk | stories.cjs US-003 |
| US-004 | create a Terminal app (the package) | The terminal starter (app/tui.py); its base tests passed; committed | desk | stories.cjs US-004 |
| US-005 | create an Empty folder project (“Start from an empty folder instead”) | Only ROADMAP.md and tasks/, committed | desk | stories.cjs US-005 |
| US-133 | start a project with capabilities (round 12, plan 253) | Name → Capabilities → Packages → Summary; my sentence's suggestions are marked, never checked; a package lists what it can't carry; the Summary counts the base's files and tests; Create copies each capability's files and tests, runs them, and commits once they pass | desk | stories.cjs US-133; tests/test_capabilities.py |
| US-134 | see why a capability can't be chosen, on the phone too | A capability that is not available yet stays listed, disabled, with its reason; a conflict shows under the row before I choose it; one full-screen page per step (“2 of 4”), 44 px rows | phone | stories.cjs US-134 |
| US-135 | be sure a broken base is never created | A failing base test creates nothing: the partial folder goes to the Trash, the failing test and its capability are named; Add a Capability… keeps nothing either | desk | stories.cjs US-135; tests/test_capabilities.py |
| US-136 | add a capability to a project later, and take it back | Project › Add a Capability…: what changes, Safety, Undo; “Already in this project” rows; kept as one request by the harness only if every test passes; Undo This Request… takes it back | desk | stories.cjs US-136; tests/test_capabilities.py |
| US-006 | add an existing folder | Used in place, nothing written; its files show in Work | desk | stories.cjs US-006 |
| US-010 | rename a project and keep talking with Pi | The folder is renamed, chat stays; the next request runs in the new folder | desk, phone | stories.cjs US-010 (the fake Pi stops like Pi 1.1.0 on a session folder that is gone; fixed by task 262); rename UI: design.cjs (Task 154) |
| US-011 | create a project with the old name of a renamed one | It gets its own, empty chat | desk | stories.cjs US-011; task 262 gives every project its own id (item 16) |
| US-012 | move a project into another folder | Moves, keeps its id, chat, comments and Activity; cannot move into itself; Undo moves it back | desk, phone | design.cjs (Task 154: Move Project…); tests/test_project_commands.py |
| US-013 | remove a project from the list and add it back | The folder stays; Add Existing Folder brings the same chat back | desk, phone | design.cjs (Task 154: Remove from List…); tests/test_project_commands.py |
| US-014 | move a project to the Trash and put it back | The Mac Trash (PI_TRASH_DIR in tests); Put Back + Add Existing Folder restores it | desk, phone | design.cjs (Task 154: Move Project to Trash…) |
| US-015 | locate a project whose folder went missing | Listed as "folder missing"; Locate Folder… points it at the new place | desk | design.cjs (Audit task 150: gone folder; Task 154: Locate) |
| US-016 | find a project and switch between projects | ⌘K search, the Projects home, ‹ Projects; each project keeps its own chat | desk, phone | chat.cjs (Second project, No matching projects); design.cjs (107) |
| US-017 | keep project commands from colliding with Pi's work | Rename/move/trash wait while Pi works in that project | desk | stories.cjs US-017 (“Pi is answering about this project.”, nothing moves); tests/test_project_commands.py; P2 “rename is allowed while terminal Pi works” is open |
| US-130 | be told plainly when terminal Pi blocks a rename (round 12, task 262) | Its own alert “Can’t rename “Class Notes” while terminal Pi works in it.” with when the terminal request started, Show in Activity · OK (default); the name dialog closes; nothing moves. After a rename a running Preview restarts in the new folder with one note line | desk | stories.cjs US-122; tests/test_project_commands.py (TerminalBusy, the Preview note) |

## Chat and requests

| ID | As a person I… | Acceptance | Surfaces | Test |
|---|---|---|---|---|
| US-020 | ask Pi something and read its answer | The answer renders as Markdown without the reply marker; it is in Activity; it survives a reload | desk, phone | chat.cjs; design.cjs (103, 143) |
| US-021 | send more while Pi works | Messages join the waiting message: one request | desk | design.cjs (Messages sent while Pi works join…) |
| US-022 | stop a request or cancel a waiting one | Stop (⌘.) ends it; Activity says Stopped; a waiting one is cancelled | desk, phone | chat.cjs (stop, Cancel the waiting request?) |
| US-220 | read the messages waiting for Pi | Under the running request, each waiting message of this chat in order: full text, attachments, “Queued HH:MM”; “Next: N requests waiting in …” folds them (kept after a reload); Activity lists them with their attachments (task 325) | desk | stories.cjs US-220 |
| US-221 | edit a waiting message before Pi starts it | Edit → new words, drop an attachment → Save: same place, “Edited”; Pi receives the edited text and only the kept attachment; decision log `queue_edit` by the person, without the words | desk | stories.cjs US-221; tests/test_queue_editing.py |
| US-222 | remove a waiting message | Remove… asks (Keep Waiting is the default); then it is gone, Cancelled “Removed by you before it started”, its attachment released, it never runs; decision log `queue_remove` | desk | stories.cjs US-222; tests/test_queue_editing.py |
| US-223 | not overwrite an edit made in another window | The stale window's Save is refused (“This message changed in another window; your edit was not saved.”) and its words go back into the composer | desk | stories.cjs US-223; tests/test_queue_editing.py |
| US-224 | edit a message that Pi starts meanwhile | “Pi already started this message; your edit was not sent.”; my words are in the composer; Pi got the message as it was | desk | stories.cjs US-224; tests/test_queue_editing.py (race with the worker) |
| US-225 | read and edit waiting messages on the phone | Full text, 44 px Edit and Remove…, the editor fits 390 px, no sideways scroll | phone | stories.cjs US-225 |
| US-226 | edit or remove a waiting message from terminal Pi | `/queue edit <id> <words>` (Save first) and `/queue remove <id>` (Cancel first) ask, then change it; Pi's harness tool cannot | terminal | stories.test.mjs US-226 |
| US-023 | see what Pi sees before I send | "Pi sees:" lists the files with their reason; Why? explains each | desk, phone | design.cjs (Task 134 ContextLine, round 11 reasons); tests/test_context.py |
| US-024 | attach files or dictate | Images and text attach (drop, paste); Record transcribes into the composer | desk, phone | chat.cjs (attachments, Drop to attach); transcription: not coverable (Whisper download), partial tests/test_remote_access.py |
| US-025 | keep my drafts | Chat and document drafts survive reloads | desk | chat.cjs (drafts/conflicts) |
| US-026 | choose the model and thinking level | Menu bar menus; switching says when ready; a model without thinking dims the levels | desk, phone, terminal | design.cjs (147, round 5 task 163); tests/test_model_choice.py |
| US-027 | see the files Pi read on its own | "Also read:" after the answer | desk | design.cjs (Task 136) |
| US-230 | have Pi's tool calls run even when a small model writes them as text (task 326) | `<execute_tool>read{path:notes.md}</execute_tool>` from the model becomes a real `read` call: it runs through Gate, the answer comes, the pseudo call is not shown; the decision log has `tool_call_repaired` by code (automatic, no file contents); Activity's request says “Tool calls fixed”, and a model that needed repairs in 3 recent requests is named there (never a blocking card); prose, code samples, unknown tools and bad arguments stay text | desk | stories.cjs US-230; tests/test_tool_repair.py, tests/test_tool_repair_proxy.py |
| US-231 | see which models can use tools (task 326) | The model menu says “tools” only for models Ollama lists with the tools capability; the others say “no tools” and are disabled | desk | design.cjs (147: the model menu's keys) |
| US-232 | get short answers from every model (task 326) | Every Pi session, web and terminal, is told “Answer as briefly as possible” (no restated request or plan, no filler) while questions stay cards and errors, verification and required controls stay complete; the bench records each answer's length in words | desk, terminal | partial: tests/harness/tool-repair.test.mjs (both sessions), tests/test_bench.py (answer_words) · brevity itself needs a real model |

## The three phases and their controls

| ID | As a person I… | Acceptance | Surfaces | Test |
|---|---|---|---|---|
| US-031 | talk in Discussion without Pi writing anything | A write is refused ("Not written: the project is in Discussion"), shown in Activity and Gate with the project; nothing on disk | desk | stories.cjs US-031 |
| US-037 | change the phase with the phase button | ⌃⌥D · ⌃⌥P · ⌃⌥I (round 12; were ⇧⌘1–3) or the menu; each change is a phase line; Implementation is disabled with nothing planned | desk, phone | design.cjs (round 11 phase lifecycle); stories.cjs US-030, US-095 |
| US-038 | see why a refused change was refused and change phase from there | Gate's row is named by the phase, with Change Phase… and Why? | desk, phone | design.cjs (phase-refusal card) |
| US-039 | have the phase saved and shared with the terminal | The same phase after a restart and in `/status` | desk, terminal | stories.test.mjs US-100 |
| US-132 | use one shortcut family the browser leaves alone (round 12) | ⌃⌥1–4 switch Chat · Work · Activity · Gate; ⌃⌥D · ⌃⌥P · ⌃⌥I choose the phase; menus and the phase menu show ⌃⌥; ⌘2 in a browser tab is left to the browser (installed as an app, ⌘ works too) | desk | stories.cjs US-124; design.cjs and chat.cjs press ⌃⌥ |

## Choices

| ID | As a person I… | Acceptance | Surfaces | Test |
|---|---|---|---|---|
| US-040 | answer a question in Planning | One question per card, recommended first and preselected, Something else… last; the answer lands in the planned task's Decisions (chosen) and the decision log (person) | desk, phone | stories.cjs US-040 (item 6 is fixed by task 260: the choice no longer makes its own task and the plan shows; NEW-2 by task 293) |
| US-041 | answer a question in Discussion | The settled card survives a reload; no commit, no file changed; the decision log has the answer | desk | stories.cjs US-041 |
| US-042 | answer a choice while I am typing something else | My draft stays in the composer | desk | stories.cjs US-042 (item 9, task 290) |
| US-123 | see who made each decision behind an answer, and change my answer (task 273) | “▸ 2 decisions · 1 automatic” under the answer; each row has its source tag (you · auto · Laya · code · model; auto and model dotted); Change… on my answer opens a card that names what it redoes; Change and Redo records my new answer (person, `decision.change`) and queues one request to redo what depended on it; a decision that cannot be changed here keeps Change… disabled with the reason | desk | stories.cjs US-119; tests/test_decision_rows.py |
| US-124 | answer a batch of questions at once (task 273) | “Question 1 of 3” with Take All Recommendations: the rest of the batch takes each recommendation as my answer, nothing is left waiting | desk | stories.cjs US-120; tests/test_decision_rows.py |
| US-043 | type my own answer | Something else… opens a field; typing in the composer answers the card | desk, phone | design.cjs (Round 10: A study group) |
| US-044 | get exactly one answer per question, even if I answer quickly | No merged or lost answers | desk | `conversation.cjs` (live answer, double click, concurrent conflicting tabs, reload and draft preservation) |

## Plans, Start Building, check-ins, Accept, Stop Here

| ID | As a person I… | Acceptance | Surfaces | Test |
|---|---|---|---|---|
| US-030 | plan, Start Building and get the first task built and verified | Plan card → Start Building (the only approval, "Plan approved: chosen") → Pi works test-first → check-in "done", Red/Green ticked, roadmap ticked, one harness commit, Next: the plan's publication audit task → Accept and Continue; decision log: plan_layout code, plan_approval person, box_ticked code, step_done code, task_acceptance person | desk | stories.cjs US-030 |
| US-032 | build an approved plan task by task | Task 1 check-in → Accept and Continue starts task 2 → Accept Task; one commit per task; every box ticked; two person acceptances logged | desk | stories.cjs US-032 |
| US-033 | see that a task without a passing test is not verified | Committed "(not verified)", the task stays open with the reason, the roadmap line open; Retry Task is the default (round 12; Review First opens the task) | desk | stories.cjs US-033; design.cjs (empty code task) |
| US-034 | trust "verified" | A comment-only edit with an old failing run and a `--help` "green" is not verified | desk | stories.cjs US-034 (fixed by task 260) |
| US-035 | ask a question while a task is in progress | The question is answered; no check-in; the task stays in progress | desk | stories.cjs US-035 (fixed by task 260) |
| US-036 | plan another task and build only some of the waiting ones | Plan Another Task → Discussion with the waiting strip → Build the Planned Tasks… with checkboxes → Start Building approves only the checked ones | desk, phone | stories.cjs US-036; design.cjs (round 11 waiting review at 1440/390) |
| US-046 | stop after a task without accepting it | Stop Here keeps the check-in waiting; Accept Task later | desk | design.cjs (Stop Here, Accept Task) |
| US-047 | change a plan before approving it | Change… asks "What should change in the plan?" in the composer | desk, phone | design.cjs (Send Change) |
| US-048 | review a task before accepting | Review First opens the task file | desk, terminal | stories.cjs US-033 (Review First opens the task in Work); tests/harness/terminal-planning.test.mjs (review shows the actual task) |
| US-087 | step back to Discussion during a check-in and come back to accept | Implementation can be chosen again and Accept Task finishes | desk | stories.cjs US-087 (fixed by task 260) |
| US-088 | answer a question Pi asks in the middle of building | The code written before the question is part of the verified, committed task; the answer is in its Decisions | desk | stories.cjs US-088 (fixed by task 260) |
| US-089 | trust that an approved docs task that changed nothing is not "verified" | No “done” check-in, its box stays open, nothing is committed as done | desk | stories.cjs US-089 (fixed by task 260) |
| US-126 | accept an unverified task anyway, on purpose (round 12, task 260) | The not-verified check-in names files outside the task; Retry Task is the default; Accept Anyway… asks “Accept task 1 without a passing test?” (Cancel is the default); then its ROADMAP.md line is ticked “(accepted without verification)” in a harness commit; decision log: task_acceptance person accept_anyway | desk | stories.cjs US-118; tests/test_round12_checkins.py |
| US-127 | reopen a task that was marked done (round 12, task 260) | Work shows Done and Reopen Task… on a done task file (Activity too, for a request that ended at a check-in); it asks “Reopen “Count clicks”?”; the boxes and the ROADMAP.md line open again; the code stays | desk | stories.cjs US-119; tests/test_round12_checkins.py (the label goes with the tick) |
| US-128 | decide when Pi needs a file outside the task (round 12, task 261) | Gate refuses the write and asks “Pi wants to change a file outside task 1 · Gate asks you”: Add to Task 1 (default) · Keep Out · Open the Task; Add writes the file into Files: and the task is built and verified with it; Keep Out, then a second need, asks “The plan needs to change”: Re-plan (Planning) · Keep the Plan. The plan card shows What you grant (Kind and Files with their sources). Under Run on its own, Add to Task is taken without asking and the end-of-run report lists “Widened task N without asking: <file> …” (a decision for the person) | desk | stories.cjs US-120; tests/test_round12_checkins.py (Keep Out, Re-plan, Keep the Plan, What you grant) |
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
| US-131 | follow a link in a Markdown file (round 12) | `[001-Plan this app](tasks/001-first-task.md)` in ROADMAP.md reads as a link in Work; a click opens the task file there; ⌘-click opens it in a new tab | desk | stories.cjs US-123 |

## Preview

| ID | As a person I… | Acceptance | Surfaces | Test |
|---|---|---|---|---|
| US-060 | see a page Pi built, at phone and tablet sizes | Show in Preview starts it; the page renders; Phone ≤ 390 px, Tablet 768; Open on Phone says why phone access is off | desk | stories.cjs US-060 |
| US-065 | preview a Web app (uvicorn) | Starts, reloads after Pi's change ("Pi changed N files. Reloaded.") | desk | not coverable yet: the first start runs `uv` and installs packages (a download); partial tests/test_preview.py |
| US-066 | preview an App with no server (Tailwind build) | Builds styles and serves | desk | not coverable yet: `uv tool run pytailwindcss` downloads; partial tests/test_preview.py (plain site) |
| US-067 | run a Terminal app in Preview | Restart, sizes 80 × 24 · 120 × 40 · Fit, the phone key row | desk, phone | design.cjs (Terminal Preview controls, with the status faked); the real textual-serve start: not coverable (download) |
| US-068 | ask Pi to fix an app that stopped | The last 8 lines; Ask Pi to Fix sends the last line and the 8 lines | desk | partial: tests/test_preview.py, tests/harness/preview-ui.test.mjs |
| US-069 | open my app on my phone | The app's own tailnet address and a QR | desk | not coverable: needs a real tailnet (the off state is in US-060 and design.cjs Task 141) |
| US-116 | adjust my app's colours by hand (task 312, round 12) | “I want to adjust the site’s colours” opens Pi Workbench's theme panel (“no model”) with no request for Pi (a code decision in decisions.jsonl); the swatch's picker restyles the Preview at once and Esc puts the old value back; Save Theme commits “Theme: primary” as my own change, only the changed token in styles/input.css; the saved line's Undo (“Undo the theme save?”) restores the file and the Preview | desk | stories.cjs US-116; tests/test_theme.py, tests/harness/theme.test.mjs |
| US-117 | ask for the theme panel in Japanese, from the menu or with ⌃⌥K (task 312) | 「サイトの色を調整したい」 opens it without Pi; Project › Theme… and ⌃⌥K open another; a project without the starter's CSS shows “This project has no theme file”; Save and Add a Theme File refuse a request without the person's secret | desk | stories.cjs US-117 |
| US-118 | see every colour and switch groups in the theme panel (task 312, round 12) | the first five colours, “▸ 3 more” opens the rest; tabs Colours · Radius · Spacing · Chart · Fonts keep unsaved changes; the radius slider shows its samples; the chart warns when two colours are hard to tell apart | desk | stories.cjs US-118 |
| US-119 | not lose theme changes by moving on (task 312, round 12) | sending a message with unsaved theme changes asks “Save the theme changes before going on?”: Cancel keeps both, Save saves then sends, Don’t Save drops the changes and sends | desk | stories.cjs US-119 |
| US-120 | give a project without a theme one (task 312, round 12) | Add a Theme File adds Basecoat's defaults (styles/input.css, vendor/basecoat) as one change of mine with Undo, and the panel opens | desk | stories.cjs US-120; tests/test_theme.py |
| US-121 | tune the theme on a phone (task 312, round 12) | the panel opens full screen with the app live on top (“Live · unsaved”), 56 px rows and 32 px swatches; a row opens the picker page; Close asks before dropping changes | phone | stories.cjs US-121 |

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
| US-125 | choose how much the decision rows show (task 273) | Settings › Pi › Detail: Beginner hides decisions made by code; Expert shows them with the rule and the command (from Gate's event, never from the decision log), kept in config.json | desk | stories.cjs US-121; tests/test_decision_rows.py; /decisions: tests/harness/decisions-command.test.mjs |

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
| US-129 | be told when my page is out of date after plh restarted (round 12, task 261) | A person control refused for an old secret shows “This page is out of date after plh restarted, so your choice wasn’t sent. …” with Reload Page inside the card I pressed, not the error line; after the reload the check-in still waits | desk | stories.cjs US-121; tests/test_round12_checkins.py (the 403 says stale) |
| US-140 | know that the tests Pi writes cannot harm my Mac, and decide myself when they need the network (task 311) | An allowed test run executes under the test sandbox: it writes only in the project, a temporary folder and the toolchain caches (never .git), reads neither the workbench's data nor ~/.ssh and the like, gets no PI_HARNESS_* or token variables, and has no network. A failing run that met the sandbox leaves a Harness notice under the answer saying what is allowed and that Project › Test Sandbox… widens it; that dialog (Cancel is the default) offers No network (recommended) · This computer only (localhost) · The internet, kept per project; a local process without the page cannot widen it | desk | stories.cjs US-140; tests/test_sandbox.py |
| US-141 | be sure the Preview never shows what is not my app, and that no site can frame the workbench (tasks 304, 305) | The Preview's file server serves only files inside the project: .env, .git, symlinks out and folder listings are 404; a foreign Host is 403 (no DNS rebinding); the app runs in a sandboxed frame that cannot navigate the workbench; Open on Phone admits only the workbench's own Tailscale logins (remote_users); a terminal app starts only for its own page; every workbench page and reply carries X-Frame-Options DENY, frame-ancestors 'none' and nosniff, and a 500 says nothing of the exception | desk | stories.cjs US-141; tests/test_preview.py; tests/test_web_hardening.py |
| US-083 | never lose a file for good | Every delete goes to the Trash | desk, terminal | design.cjs (146, 154); tests/test_project_commands.py |

## Recovery

| ID | As a person I… | Acceptance | Surfaces | Test |
|---|---|---|---|---|
| US-070 | see a crash in Activity and retry it | Failed, with "Pi exited unexpectedly: …"; Ask Pi to Retry… queues it again; the failed run stays | desk | stories.cjs US-070; chat.cjs (A_Retry) |
| US-075 | see a crash in the chat | The CutLine (round 12, `.pw-cut`, role status) says the request failed, with Retry (default) and Undo This Request… only when files changed | desk | stories.cjs US-075 (review P2) |
| US-122 | learn from the harness itself that Laya is not installed (round 12) | A phase word gets the dotted HarnessNotice (“Harness · Laya isn’t installed, so the phase button can’t suggest the next phase. Everything else works.”) with How to Install; no card blocks | desk | stories.cjs US-118; tests/test_decision_rows.py |
| US-071 | get my workbench back after plh crashed mid-request | After a restart the request is Interrupted, never repeated; the chat goes on | desk | stories.cjs US-071 |
| US-072 | get one clean answer after Pi loops | Recovery aborts, compacts, asks again once; one answer | desk, terminal | stories.cjs US-072; tests/harness/extension.test.mjs (ten-second loop check, abort/compact/reask) |
| US-073 | reload while Pi works | The answer still arrives | desk | stories.cjs US-073; chat.cjs (bug 173, back to a live chat) |
| US-074 | be told when Gate refuses or cannot check a command | A refused command is a logged block with its rule; a Gate failure is G-011, reported | desk | stories.cjs US-074 (fixed by task 263) |
| US-079 | reconnect after plh stopped | "Connection interrupted. Your drafts are kept." and Reconnect | desk | chat.cjs (offline banner) |
| US-084 | have long work never time out, only silence | Steady progress past the limit completes; silence fails with “Pi sent nothing for …” (the limit is 2 s in the scratch workbench) | desk | stories.cjs US-084; tests/test_web_chat.py |
| US-085 | find out what is wrong | `/doctor` checks and says what to do | terminal | stories.test.mjs US-085; tests/test_admin.py |

## The chat critical path (task 324)

The owner, 2026-10-18: "the critical path of user chatting with agent is completely broken. audit it." The audit is
[2026-10-18-chat-critical-path-audit.md](reviews/2026-10-18-chat-critical-path-audit.md).

| ID | As a person I… | Acceptance | Surfaces | Test |
|---|---|---|---|---|
| US-200 | never have my next message stuck behind a model that stopped answering | While Pi waits for the model, `model_silence_seconds` (120 s; 3 s in the scratch workbench) of silence fails the request: the CutLine says “Failed before Pi finished: the model stopped answering (no reply in … s).” with Retry; its Pi is stopped; my Planning message starts next | desk | stories.cjs US-200; tests/test_chat_critical_path.py |
| US-201 | send a message after choosing Planning and have it start | With nothing in flight, after a question card, after a reload | desk | stories.cjs US-201 |
| US-202 | never see the [CANARY] marker | Bare, `code` or **bold**: never in the chat (live, after a reload, in answers saved before the fix) nor in Activity | desk | stories.cjs US-202; tests/test_chat_critical_path.py; tests/harness/message-markdown.test.mjs |
| US-203 | chat with Pi from start to end | Streaming thoughts, a tool call with Stop, a reload mid-request, a second tab, Stop keeps the partial answer, Retry, messages sent while Pi works join and run in order, a phase change between messages, a check-in, and the chat goes on; no page errors | desk | stories.cjs US-203 |
| US-204 | be told plainly what went wrong, and go on | Ollama down (“Ollama is not answering … Start Ollama, then Retry.”), a model error (partial answer kept), Pi crashing, Gate refusing a command: each ends its request and the next message runs | desk | stories.cjs US-204 |
| US-205 | answer a card while Pi is still finishing | The answer runs as its own request after the worker; the worker ends Completed, not “Waiting for you”; one card, answered once, after a reload; another tab's phase change shows after a refresh | desk | stories.cjs US-205; conversation.cjs |
| US-206 | start the plan by choosing Planning | After a discussion, choosing Planning queues “Write the plan from our discussion.” (shown as “Harness · Planning started from your discussion”, never as my words) and a plan card arrives without typing; an empty chat starts nothing; choosing Implementation with an approved task starts it | desk | stories.cjs US-206 |
| US-207 | name a project with spaces and capitals | “Habit Tracker”: plan, build, sandboxed test runs, Gate's commit and the Preview all work | desk | stories.cjs US-207 |
| US-208 | answer Gate's question when Pi needs a file outside the task | The request pauses (Waiting for you) with the card, which survives a reload; Keep Out keeps the file out; a retry asks once whether the plan should change; Keep the Plan ends it; the chat goes on. A question System 1 raised for a request that ended never blocks later writes | desk | stories.cjs US-208, US-128; tests/test_person_controls.py |
| US-209 | stop Pi during an approved task and go on | The task stays in progress (no check-in for a stop); the next request writes the task's files and reaches its check-in; no call is refused “No approved task is in progress” | desk | stories.cjs US-209; tests/test_chat_critical_path.py |
| US-270 | trust that the work goes to the approved task in progress (live 2026-10-19) | Start Building commits the approval itself (“Plan approved: 3 tasks”: the task files, the planning task ticked, ROADMAP.md), so `git status` is clean; “Continue task 1: …” where Pi only reruns a test that already passed ends with the check-in “Task 1 of 3 not verified” (Retry Task the default, the reason says the test “already passed before any change”), never “Done”; tasks/001 (the planning task) is untouched, nothing is committed, no commit title says “(task NNN, plan)” | desk | stories.cjs US-270; tests/test_task_attribution.py |
| US-271 | the same under Run on its own | The automatic approval is committed the same way; the task where Pi only reruns a passing test stops at “Task 1 of 3 not verified” for the person (never accepted automatically); nothing committed after the approval; the planning task only got its boxes ticked | desk | stories.cjs US-271; tests/test_task_attribution.py |

## Coverage

Counted from the tables above: 154 stories, each once, under its best status (a story with a journey and a
unit test counts as a journey). Browser journeys in stories.cjs: 82 (12 from task 324, the chat critical path, 39 from task 264, 6 from task 312, 4 from round 12's task 273, 7 from round 12's check-ins and fixes, 4 from round 12's Project Start, 2 from the security hardening, tasks 304, 305 and 311, task 318’s keyboard/filter regression, 6 from task 325's waiting messages, plus 1 from task 326's tool-call repair) and 12 terminal journeys in stories.test.mjs.

| Status | Count | Stories |
|---|---|---|
| Covered by a passing journey (stories.cjs, stories.test.mjs, design.cjs, chat.cjs) | 139 | US-001, US-002, US-003, US-004, US-005, US-006, US-008, US-010, US-011, US-012, US-013, US-014, US-015, US-016, US-017, US-020, US-021, US-022, US-023, US-024, US-025, US-026, US-027, US-030, US-031, US-032, US-033, US-034, US-035, US-036, US-037, US-038, US-039, US-040, US-041, US-042, US-043, US-045, US-046, US-047, US-048, US-049, US-050, US-051, US-052, US-053, US-054, US-055, US-056, US-057, US-058, US-059, US-060, US-061, US-062, US-063, US-064, US-067, US-070, US-071, US-072, US-073, US-074, US-075, US-076, US-077, US-078, US-079, US-080, US-081, US-082, US-083, US-084, US-085, US-086, US-087, US-088, US-089, US-090, US-091, US-092, US-095, US-096, US-097, US-100, US-101, US-102, US-103, US-104, US-105, US-106, US-107, US-110, US-111, US-113, US-116, US-117, US-118, US-119, US-120, US-121, US-122, US-123, US-124, US-125, US-126, US-127, US-128, US-129, US-130, US-131, US-132, US-133, US-134, US-135, US-136, US-140, US-141, US-220, US-221, US-222, US-223, US-224, US-225, US-226, US-200, US-201, US-202, US-203, US-204, US-205, US-206, US-207, US-208, US-209, US-270, US-271, US-230, US-231 |
| Expected failure (xfail), with its review item | 0 | none |
| Partial: unit or integration tests only, no journey yet | 7 | US-007, US-068, US-108, US-109, US-112, US-115, US-232 |
| Not coverable yet | 6 | US-009 (downloads (Laya, music, browser setup)), US-065 (the first start runs uv and installs packages), US-066 (uv tool run pytailwindcss downloads), US-069 (a real tailnet), US-098 (a real tailnet), US-114 (item 17 waits for the person’s decision; the render tests skip without node_modules) |
| Conversation regression | 1 | US-044: live question and concurrent tabs (`conversation.cjs`) |

The browser journeys run in about two minutes (`python3 tests/browser/run.py stories`), the terminal ones in about two
seconds (`node --test tests/harness/stories.test.mjs`).

### NEW-1 and NEW-2 (found by these journeys, not in the review)

- **NEW-1, fixed on harness-next.** At c2f527e, `propose_plan` (gate/paperwork.py) laid out each task ending with
  `## Decisions`, then appended `Request <date>: “…”` to the first task under that heading; G-017 refused every line
  there without `(chosen|auto|given)`, so every write of the first planned task was refused and Planning → Start
  Building → build never produced code. After merging tasks 260-263, US-030 and US-045 pass.
- **NEW-2, fixed (task 293).** An answer given in Planning before the plan existed was kept in harness data
  (task 260's fix of item 6) and never reached the planned task's `## Decisions`; the plan card said "0 decisions".
  Gate now keeps such an answer until `propose_plan` lays out the plan and writes it into the first task's Decisions
  (an answer while a plan waits for Start Building goes into that plan). US-040 passes.

Journeys that start after an approval (US-032, US-033, US-050, US-051, US-054, US-060, US-086…089) use
`givenApprovedTasks`: the task files System 1 lays out, approved with Start Building through the same Paperwork the
services use, as design.cjs does.

Web POSTs from Node send the page's person secret (`X-Pi-Person`, read from the page as js/ui.mjs `personHeaders`
does), like the person's own page; US-081 checks that a POST without it is refused.

US-142: Project Start capability filtering and keyboard focus survive selection (`stories.cjs`).
