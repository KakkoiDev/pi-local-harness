# Pi Workbench guide

A short guide for new users, as questions and answers. In terminal Pi, `/guide` prints it and `/guide <words>` prints
the matching sections; Pi reads it through its `harness` tool to answer "how do I…?".

## What is this?

Pi Workbench is a local workbench for one person and one local AI agent, Pi. Each project is a real folder on your Mac
with one chat, a plan (`ROADMAP.md`, `tasks/`) and Markdown files you edit and comment on. Everything runs on this Mac:
the model (Ollama), Pi, Gate (which checks every command Pi runs) and the web workbench.

## How do I start it?

Type `plh` in a terminal. It updates itself from its checkout if needed, starts Pi in this terminal, and starts Gate and
the web workbench. The first lines show the build, the Web and Gate addresses, the phone address (or why phone access
is off), and "Ask in words, or type /harness for commands". Quitting Pi (Ctrl-C twice, or `/quit`) stops everything.

## How do I open the workbench in the browser?

Open the Web address from the startup lines, normally http://127.0.0.1:3000 (`/status` shows the real port). Bookmark it;
it works as long as `plh` runs. After `plh` updates, quit it, start it again and reload the page.

## How do I start a project?

In the workbench, **New Project…** (⌘N) creates a folder with `ROADMAP.md` and a first task. **Add Existing Folder…** (⌘O)
uses a folder you already have, in place. The Projects window lists them; choose one to open its Chat.
For an app made from a starter, the first code request includes one check for leftover sample notes files and names.
Pi gets a cleanup pass while keeping the storage, languages, tests and build setup.
A Terminal app runs in Preview with keys and text. Restart runs it again; choose 80 × 24, 120 × 40 or Fit. On a phone,
the key row sends Esc, Tab, arrows and Return; Ctrl applies to the next letter. ⌘. sends Control-C.
After code changes, Gate also checks the Goal and linked tasks. Pi gets one chance to fill missing plan details;
otherwise the request is saved with “Plan incomplete” and its task stays open.

## How do I rename, move or delete a project?

Open it, then the **Project** menu: Rename Project…, Move Project…, Remove from List… (the folder stays), Move Project to
Trash… (the Finder's Put Back brings it back). On a phone, the ⋯ on the project's row. Chat, comments and Activity stay
with the project.

Pi's chat session follows the folder: Pi remembers the folder it works in inside the chat's session, so after a rename or
move the workbench points that session at the new folder (a copy of the session before the change stays beside it, as
`session.jsonl.before-move-<time>` in the chat's folder). Terminal Pi (`plh`) keeps its own sessions per folder, outside
the workbench: after a rename or move, `pi -c` in the new folder starts a new session, and resuming an old one asks which
folder to continue in.

A running Preview stops and starts again in the new folder (Open on Phone has to be turned on again). Rename, Move and
Move to Trash wait while Pi works in that project or in the terminal.

## Chat or Work?

**Chat** (⌃⌥1) is the project's one conversation with Pi: ask, plan, request changes. **Work** (⌃⌥2) shows the files: edit
Markdown as blocks or source, comment on a passage, and ask Pi about a passage or the whole file.

## How do I change my app's colours, corners or fonts?

Say so in the chat ("I want to adjust the site's colours", or 「サイトの色を調整したい」), or choose **Project › Theme…**
(⌃⌥K). Pi Workbench answers by itself, without a model: a panel with tabs for **Colours** (light and dark side by side,
each with its contrast; the first five show, "▸ 3 more" opens the rest), **Radius**, **Spacing**, **Chart** and
**Fonts**. A swatch opens a picker (drag the field and the hue strip, type a hex; Esc puts the old value back), and the
Preview follows as you go. **Save Theme** writes only what you changed into `styles/input.css` as your own change; the
line "Theme saved: …" has **Undo**. Sending a message, switching project or closing the panel with unsaved changes asks
first (Don't Save · Cancel · Save). A chosen Google font is downloaded into the project, with its licence, when you
save. On a phone the panel opens full screen with the live app on top. A project with no theme file offers **Add a
Theme File** (Basecoat's defaults, one change you can undo). In terminal Pi, `/theme` prints the tokens.

## How do comments work?

Select text in Work and choose **Comment** (⇧⌘M). A comment stays with the file until you choose **Ask Pi**; Pi's answer
appears in the thread, not in Chat. **Add Note** keeps a reply without sending it. Review (⌥⌘R) lists every comment and
its state: not sent, waiting, Pi working, answered.

## What does Pi see?

Under each place you send something, "Pi sees:" lists the files Pi gets with that request (the plan, the current file,
files you mention, related ones). Web and terminal Pi choose again for each message and recovery. Project rules,
the plan and the active task take priority; private files (`.env*`, keys such as `*.pem` or `id_rsa`), files your
`.gitignore` ignores, build, cache and environment folders (`target/`, `dist/`, `venv/`, `node_modules/`, `*_cache/`…),
generated files, licences and notices, binaries and files over 40 KB are left out, not even listed by name. Activity
records each selection, why each file was chosen, and each file left out with its reason. After an answer, "Also read:" lists
the files Pi opened itself. The word beside each selected file explains its role: rules, plan, task, named, changed or related. **Why?** opens the recorded reason and full path for every selected file, in a popover on the desktop or a sheet with Done on the phone. Escape closes it and returns to Why?.

## Where do I see what Pi is doing?

The status at the top right of the menu bar: Ready, Working, waiting, or what needs attention. Click it for **Activity**
(⌃⌥3): every request with its state, steps and record, and a button back to where it came from. **Gate** (⌃⌥4) lists every
command check, allowed or blocked, and why.

## Can Pi work on a long task?

Yes. A request has no time limit; it stops only if Pi sends nothing for an hour (`/config set silence_seconds …`). When
Pi stops with work open (code changed and no test passed on it, a loop, a hang), the harness wakes it to continue, at
most `wake_ups` times per request (default 5; `/config set wake_ups …`, 0 for no limit). Stop
ends a request at any time: in Chat, in Activity, or ⌘. .

## How do I choose a model or thinking level?

In the menu bar, click the model name or the thinking level and choose. Switching unloads the previous model, so one is in
memory. In terminal Pi: `/models` lists the installed models and what they can do, `/models use <name> [effort]` switches
(it asks first). The model menu also says whether a model answers two requests at once ("parallel" or "one at a time").

## How do I get a new model, or remove one?

In terminal Pi: `/models pull <name>` downloads it (large models are many GB), `/models remove <name>` moves it to the
Trash. Both ask first. `/models check <name>` measures whether it answers two requests at once.

## How do I use it from my phone or another device?

The phone opens the workbench over your Tailscale network. Once: Tailscale running and logged in on this Mac, HTTPS
enabled for the tailnet, then `/config set remote_hosts ["your-mac.tailnet.ts.net"]` and `/config set remote_users
["you@example.com"]`, and restart `plh`. Then **π › Open on Phone…** shows the address and a QR code to scan. If it says
phone access is off, it also says why (often: enable Serve once for the tailnet, at the link shown).

While the workbench runs, it reconnects if its Tailscale Serve session exits. The same recovery applies to an app
shared from Preview. Closing the workbench or stopping that share ends recovery and its owned Serve process. This
does not keep a sleeping Mac reachable or reconnect a device that is signed out of Tailscale.

## Can I talk instead of typing?

Yes. **Record** in the chat composer, or the microphone (Dictate) next to a comment field. The Mac transcribes it (Whisper)
and the text lands where you were typing, for you to check before sending.

## How do I change a setting?

In terminal Pi: `/config` lists every setting with what it does and its variable; `/config set <key> <value>` changes one
(asks first, backs up, applies the next time `plh` starts); `/undo` puts back the last change. Ollama's own settings:
`/ollama`, `/ollama set <key> <value>`.

## What can the terminal console do?

Type `/harness` and choose from the list (the command goes on the input line; Tab completes model names, settings and
topics), or `/harness list` to print it: `/status`, `/doctor`, `/queue`, `/job <id>`, `/gate`, `/models`, `/ollama`, `/projects`,
`/config`, `/paths`, `/guide`, `/undo`, `/reports`, `/bench`, `/update`, `/auto`, `/report`, `/audit`; and `/discuss`,
`/plan`, `/build` for the phase. They run at once, without the model, and Pi can explain their output. Pi's own
commands (`/settings`, `/model`, `/new`, `/compact`…) still work.

## How do I change the language?

Open π › Settings…: Language is first and changes take effect immediately. Web and terminal Pi share the saved
choice; Pi reads it again on the next request. A Terminal app starts in that language; Preview's language control can
override it. Appearance and typing preferences apply to this browser.

## How do I add it to my phone's Home Screen?

While using the workbench away from the Mac, choose π › Add to Home Screen… for the iPhone or Android steps.
The π icon opens the workbench running on the Mac, so the Mac must stay on with Tailscale connected.

## How do I update Pi Workbench?

In the web workbench, π › Check for Updates… checks GitHub and shows what changed. A dot on π marks a known new
version. Update waits for Pi's request to finish; after it succeeds, quit `plh` and start it again. Settings can turn the
quiet daily check off. If the copy has edited files or its own commits, the window explains why it stopped and can
prepare a request asking Pi to help.

In terminal Pi, `/update` says whether a new version is on GitHub and what changed; `/update now` updates (it asks
first), then quit `plh` and start it again: the new version installs as it starts, while `auto_update` is on (the
default; with it off, `/config set auto_update true` first). Your projects and data are not
touched. An update never overwrites changes you made to Pi Workbench's own files: it says so instead.

## Something is wrong. What do I do?

Run `/doctor` in terminal Pi: it checks the data folder, settings, Ollama, the chosen model, the agent lock and the
workbench, and says what to do for each problem. A page that "could not load" after an update: quit `plh`, start it
again, reload. "Connection interrupted" in the browser: `plh` stopped; start it and choose Reconnect.

## Where is my data?

In `~/pi-local-harness-data` (`/paths` lists each part): settings, the model choice, chats, comments, Activity records,
Gate's history, backups and the app's own trash. Project files stay in their own folders.

### Which tests actually ran?

Open a request in Activity. Its Tests list comes from Gate: each command, exit code, printed counts, duration and
time. The data folder keeps `test-runs.jsonl` and the last 200 output lines in `test-runs/<id>.txt`. Bench results
include those records and output files too. Counts are shown only when the runner printed a recognised summary.

## How do I check whether my app is ready to publish?

Run `/audit` from the project in terminal Pi (or `/audit <folder>`). After confirmation it runs the publication checks offline and records each command in the last roadmap task. Failed commands leave their boxes open. The full test result is logged. Other roadmap tasks must also be complete. Missing tools require a separate approved installation; the audit never downloads them. App descriptions are checked for starter leftovers and consistent README, manifest and English app names; arbitrary prose still needs human review.

## Why does Pi ask me to choose?

When a project decision is missing from your request, its code and its conventions, Pi uses `ask_choices`: one question, two to four options, recommended first, and Something else… for your own words. Gate can quote an assumption in Pi’s text or reasoning and require a choice before further content changes. A pending or cancelled choice does not count as approval. During Discussion, answers stay in harness data without changing the project. During Planning and Implementation, the harness records each answer and shows it in the task’s Decisions section with its source and time. Pi cannot write a decision itself: a “(chosen …)” line it wrote is refused, and a line the harness did not record asks again before code changes.

Under each answer, “5 decisions · 2 automatic” opens the decisions behind it, each with its author: you, auto (Run on its own took the recommendation), Laya, code or model. Change… on a question’s answer says what it redoes, records your new answer and asks Pi to redo what depended on it; a phase changes from its row too, and an accepted task can be reopened. A numbered batch of questions (“2 of 3”) offers Take All Recommendations. Settings › Pi › Detail: Beginner hides decisions made by code; Expert shows all, with rules, paths and commands. In terminal Pi, `/decisions` lists the last request’s decisions (`/decisions --all` for everything).


Every project starts in Discussion. Use the composer’s phase button (⌃⌥D · ⌃⌥P · ⌃⌥I), or `/discuss`, `/plan` and `/build` in terminal Pi. The saved phase is shared by both clients. Discussion permits reading, talking and checked read-only shell commands; Planning permits ROADMAP.md and task Markdown only. Implementation requires an approved task with explicit `Files:` scope. Unknown shell commands are blocked; approved Implementation tasks may run the checked test runners. Small fixes follow the same permissions.

Plans start in Planning. Pi provides the Goal and task content through `propose_plan`; System 1 creates the task layout. Start Building is the only approval. Plan Another Task leaves the plan waiting in Discussion. Build the Planned Tasks… reviews the waiting scope with checkboxes. Each task gets its own verified commit and waits for Accept and Continue, or Accept Task on the last task. Stop Here pauses without accepting. A plain “yes” does not approve or accept a task. Each task needs a `Files:` line listing the files or folders Pi may change; `.git/` can never be one of them, and the harness commits with Git hooks off. A task is verified only from evidence: a test run that passed on the final code, and the harness's own proof that the same test fails in a temporary copy of the project without the change (your files are never touched); a `--help` run or a run where no test ran does not count. A docs or chore task needs a change to one of its files. Changes outside the task's `Files:` leave it not verified and stay out of its commit. Questions asked during Implementation do not end the task in progress. An unverified task's check-in names the changed files outside the task and defaults to Retry Task, which builds the same task again; it is never skipped. Accept Anyway… asks first, then accepts it without a passing test: its boxes are checked and its ROADMAP.md line reads “accepted without verification”. A done check-in shows its evidence: the test run Gate saw, the tests changed (a removed or weakened test makes Review First the default), Pi's “Tried it” and the next task. Reopen Task… (on a done task file in Work, or a request in Activity) unchecks the task's boxes and reopens its ROADMAP.md line; the code stays. A pending check-in can be accepted from any phase, and after a reload it comes back from the project's state, marked Restored.

When Pi needs a file outside the task's `Files:`, Gate refuses the write and asks you: Add to Task N writes the file into the task's Files line and the plan stays approved; Keep Out keeps it out. If Pi then needs a file you kept out, Gate asks whether the plan needs to change: Re-plan moves the project to Planning, Keep the Plan leaves later writes refused. The plan card shows What you grant (each task's Kind and Files, and where each came from) above the Decisions. After plh restarts, a page opened before cannot act for you: its controls say “This page is out of date…” with Reload Page. Rename, Move and Move to Trash wait while terminal Pi works (its own alert, with Show in Activity); a running Preview restarts in the renamed or moved folder and says so in one note line.

Shortcuts are one ⌃⌥ family the browser and macOS leave alone: Chat · Work · Activity · Gate ⌃⌥1–4, the phases ⌃⌥D · ⌃⌥P · ⌃⌥I, Preview ⌃⌥V, Run on Its Own ⌃⌥A, New File… ⌃⌥N, New Task… ⌃⌥T, Show Task Record ⌃⌥R. Installed as an app (its own window), the old ⌘ keys work too.

## How do I let Pi work on its own?

`/auto on` turns on Run on its own for every project, immediately and until `/auto off`. Every enable shows the risks and defaults to Cancel: Pi chooses recommended answers, approves plans, continues tasks, publishes, pushes, downloads, sends and uses the Trash without another question. What leaves the Mac cannot be taken back by Undo. `/auto status` shows the shared setting; `/report` shows the last run’s tasks, decisions, external actions and problems. An unverified task stops the run for review. The terminal prints the report counts at the end.


In terminal Pi, plan previews offer Start Building, Plan Another Task, Change… and Open ROADMAP.md. Change asks for your words and starts another planning turn; opening the file grants no approval. After a task, Accept and Continue starts the next request, Accept Task validates the last task, Review First shows the task text and Stop Here keeps the acceptance pending. An unverified task defaults to Retry Task, which builds the same task again.

Phase commands opened outside a project offer the registered-project picker; the selection applies to that command. Project phase and approved-plan state follow the project ID when it moves or is renamed. A pending plan needs explicit Start Building approval; selecting Implementation alone cannot approve it.

Checked shell reads are `ls`, `cat`, `head`, `tail`, `wc`, `grep`, `rg`, `find`, `diff`, `sed -n <lines>p` and `pwd`; Git only reads in this form: `git --no-pager --no-optional-locks -c core.fsmonitor=false status` (or `diff --no-ext-diff --no-textconv`). A refused command says what may run. Checked shell reads reject unquoted glob expansion and ripgrep configuration injection. Package-launching test commands require checked offline/no-install forms (`npx --no-install`, `uv run --offline`, `cargo test --offline`); Go test is not currently allowed by this grammar. Project test code still runs with the account’s permissions.

Discussion includes `web_search`: Bing returns titles, links and snippets; source text is treated as data. No query is sent by tests. Music reads are allowed in Discussion; creating, revising and rendering a composition are allowed in every phase, but only as a new numbered revision folder under `assets/music/<name>/` in the project, never overwriting (`gate/media.py`, task 291). Other writes into `assets/music/` follow the phase rules.

## Can Pi build a login page, an online shop or a game for me?

Yes, from the designer's App Blocks: 137 ready-made parts (log in, side panel, data table, charts, cart, kanban…),
whole apps (online shop, admin dashboard, notes, chat, CRM…), game genres (RPG, shooter, cozy, roguelike…) and art
direction. Name what you want in the chat, in English or Japanese ("add a login page", 「ログイン画面を作って」, "build an
online shop", "make an RPG"): Pi Workbench gives Pi exactly that card, never the whole library, and Pi copies its
markup, texts and states instead of inventing them. An app's card lists its blocks; Pi loads each one with its
`app_block` tool. `python3 kit/blocks/add.py <project> <Name>` (in the harness folder) copies what a block needs, such
as Chart.js for a chart, with licences, and `python3 kit/blocks/check.py <page>` checks a page for classes Basecoat
does not have, missing labels, charts without a table, hard-coded colours and CDN links.
