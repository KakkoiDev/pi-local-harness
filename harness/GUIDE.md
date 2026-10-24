# Pi WorkStation guide

A short guide for new users, as questions and answers. In terminal Pi, `/guide` prints it and `/guide <words>` prints
the matching sections; Pi reads it through its `harness` tool to answer "how do I…?".

## What is this?

Pi WorkStation is a local workbench for one person and one local AI agent, Pi. Each project is a real folder on your Mac
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
(⌃⌥K). Pi WorkStation answers by itself, without a model: a panel with tabs for **Colours** (light and dark side by side,
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

## Can I change a message I sent while Pi was busy?

Yes, until Pi starts it. Under the running request the chat lists every message that waits, in the order Pi takes them:
its full text, its attachments and when you sent it (“Next: 1 request waiting in …” folds the list). **Edit** changes the
words and can drop an attachment; **Save** keeps its place in the queue. **Remove…** asks first, then Pi never receives it.
If Pi starts the message while you edit it, or you changed it in another window, your edit is not sent and your words go
back into the composer. Activity lists waiting messages too. In terminal Pi: `/queue waiting`, then
`/queue edit <id> <new words>` or `/queue remove <id>` (both ask first).

## Can Pi work on a long task?

Yes. A request has no time limit; it stops only if Pi sends nothing for an hour (`/config set silence_seconds …`), or
if the model itself stops answering: while Pi waits for the model, two minutes with no token, thought or tool call end
the request as failed, with what Pi wrote so far and Retry, and the next request starts (`/config set
model_silence_seconds …`; a running command or the harness's own checks are not the model). Before a turn's first word
the model gets longer: 15 minutes for the request's first turn (`model_start_seconds`, a big model may be loading) and 5
minutes for a turn after a tool result or one the harness starts, such as the next approved task (`model_turn_seconds`).
A finished answer stops the clock: the harness's own checks after it are not the model. When
Pi stops with work open (code changed and no test passed on it, a loop, a hang), the harness wakes it to continue, at
most `wake_ups` times per request (default 5; `/config set wake_ups …`, 0 for no limit). Stop
ends a request at any time: in Chat, in Activity, or ⌘. .

## How do I choose a model or thinking level?

In the menu bar, click the model name or the thinking level and choose. Switching unloads the previous model, so one is in
memory. In terminal Pi: `/models` lists the installed models and what they can do, `/models use <name> [effort]` switches
(it asks first). The model menu also says whether a model answers two requests at once (“parallel tested”, “serial in tested setup”, “parallel unknown” or “parallel check failed”).

## Can I use a model served by Colibri?

Yes, beside Ollama's. [Colibri](https://github.com/JustVugg/colibri) runs very large models (GLM-5.x, DeepSeek V4,
Kimi K3, Qwen3.6/3.8) from the SSD. Start its server yourself on port 8100: `coli serve --port 8100` with your model
(another address: the `colibri_url` setting; never 8000, Gate's port). `/models` then lists it under "Colibri at …";
if Colibri is not running, `/models` says so and how to start it. Pi can work only with a model that calls tools: GLM,
DeepSeek V4, Kimi K3, Qwen3.6 and Qwen3.8 do; OLMoE and Inkling do not, and a family Pi does not know is treated as no
tools. Big models are slow on a Mac (GLM-5.3 writes about 0.4 to 1.9 tokens per second), so a task can take hours.
Choosing it in the web model menu is coming; today the web API (`POST /api/model` with `"provider": "colibri"`) does it.

## How do I get a new model, or remove one?

In terminal Pi: `/models pull <name>` downloads it (large models are many GB), `/models remove <name>` moves it to the
Trash. Both ask first. `/models check <name>` measures whether it answers two requests at once.

## Why does Pi fix small models' tool calls?

Small local models such as gemma4:e4b-mlx can call tools, but they often write the call as text instead (for example
`<execute_tool>read{path:app/db.py}</execute_tool>`, or `read(path="app/db.py")` on the last line), and then nothing
runs. Pi WorkStation sits between Pi and Ollama and turns such text into a real call, by fixed rules: only for a tool the
request offered, only when the arguments fit that tool, and never from prose or a code example that merely mentions a
tool. The call then runs through Gate like any other. Each fix is logged as an automatic decision made by code, without
file contents; Activity shows "Tool calls fixed" on the request and names a model that keeps needing it. The model menu
says "tools" only for models that can call tools. Turn it off with `/config set tool_repair false` (next start of plh).

Every model is also asked to answer as briefly as possible: no restated request, repeated plan or filler. Questions
still come as cards, and errors, how a change was verified and what you must approve stay complete.

## How do I use it from my phone or another device?

The phone opens the workbench over your Tailscale network. Once: Tailscale running and logged in on this Mac, HTTPS
enabled for the tailnet, then `/config set remote_hosts ["your-mac.tailnet.ts.net"]` and `/config set remote_users
["you@example.com"]`, and restart `plh`. Then **π › Open on Phone…** shows the address and a QR code to scan. If it says
phone access is off, it also says why (often: enable Serve once for the tailnet, at the link shown).

An app shared from the Preview with Open on Phone admits the same Tailscale logins as the workbench (remote_users),
nobody else on the tailnet.

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

## How do I update Pi WorkStation?

In the web workbench, π › Check for Updates… checks GitHub and shows what changed. A dot on π marks a known new
version. Update waits for Pi's request to finish; after it succeeds, quit `plh` and start it again. Settings can turn the
quiet daily check off. If the copy has edited files or its own commits, the window explains why it stopped and can
prepare a request asking Pi to help.

In terminal Pi, `/update` says whether a new version is on GitHub and what changed; `/update now` updates (it asks
first), then quit `plh` and start it again: the new version installs as it starts, while `auto_update` is on (the
default; with it off, `/config set auto_update true` first). Your projects and data are not
touched. An update never overwrites changes you made to Pi WorkStation's own files: it says so instead.

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

### Can the tests Pi writes harm my Mac?

No: on macOS every test run Gate allows runs in the test sandbox (`sandbox-exec`). It may write only in the project, a
temporary folder and the toolchain caches (never in `.git`), cannot read the workbench's data folder or folders such as
`~/.ssh`, gets none of the harness's variables or tokens, and has no network. The base check of a new project, the Red
proof and `/audit` run the same way. When a test fails because of the sandbox, a Harness notice under the answer says
so. If a test really needs the network, choose **Project › Test Sandbox…**: No network (recommended), This computer
only (localhost) or The internet, kept for that project. Only you can change it, never Pi. On other systems the
sandbox is not there yet (Linux: bubblewrap, planned).

### When are my app's packages downloaded?

Once, when you press **Create** in New Project, and only then. A Web app or a Terminal app needs Python packages
(FastAPI, pytest, …): the Summary shows how many and how big the download is, from the project's lock file (the Web
app: 40 packages, about 108 MB, from PyPI; later projects reuse the shared uv cache), and says that pressing Create
approves it. Create runs `uv sync --frozen`, shows its progress, then runs the base's tests and the project's own
tests offline (`uv run --offline pytest -q`). If the download fails (no connection), the project is still created and
the note says its packages were not installed. For such a project, or one made before, **Project › Install Packages…**
shows the same numbers and installs them after you confirm (in terminal Pi: `/setup packages`). Only you can start
it, never Pi; a test run Gate refuses because the packages are missing shows a Harness notice with that button. After
that, Pi's test runs and the Preview use the installed packages offline: nothing else downloads. An app with no server
has no packages; a project with a `package.json` that has dependencies and a `package-lock.json` uses `npm ci` the
same way.

## How do I check whether my app is ready to publish?

Run `/audit` from the project in terminal Pi (or `/audit <folder>`). After confirmation it runs the publication checks offline and records each command in the last roadmap task. Failed commands leave their boxes open. The full test result is logged. Other roadmap tasks must also be complete. Missing tools require a separate approved installation; the audit never downloads them. App descriptions are checked for starter leftovers and consistent README, manifest and English app names; arbitrary prose still needs human review.

## Does choosing Planning start the plan?

Yes, when you have discussed something in the chat: choosing Planning with the phase button asks Pi to write the plan
from your discussion (the chat says "Harness · Planning started from your discussion"); if Pi is busy, it starts after
the current request. On an empty chat nothing starts: write what you want planned. Choosing Implementation with an
approved task starts that task. Pi itself never changes the phase.

## Why does Pi ask me to choose?

When a project decision is missing from your request, its code and its conventions, Pi uses `ask_choices`: one question, two to four options, recommended first, and Something else… for your own words. Gate can quote an assumption in Pi’s text or reasoning and require a choice before further content changes. A pending or cancelled choice does not count as approval. During Discussion, answers stay in harness data without changing the project. During Planning and Implementation, the harness records each answer and shows it in the task’s Decisions section with its source and time. Pi cannot write a decision itself: a “(chosen …)” line it wrote is refused, and a line the harness did not record asks again before code changes.

Under each answer, “5 decisions · 2 automatic” opens the decisions behind it, each with its author: you, auto (Run on its own took the recommendation), Laya, code or model. Change… on a question’s answer says what it redoes, records your new answer and asks Pi to redo what depended on it; a phase changes from its row too, and an accepted task can be reopened. A numbered batch of questions (“2 of 3”) offers Take All Recommendations. Settings › Pi › Detail: Beginner hides decisions made by code; Expert shows all, with rules, paths and commands. In terminal Pi, `/decisions` lists the last request’s decisions (`/decisions --all` for everything).


Every project starts in Discussion. Use the composer’s phase button (⌃⌥D · ⌃⌥P · ⌃⌥I), or `/discuss`, `/plan` and `/build` in terminal Pi. The saved phase is shared by both clients. Discussion permits reading, talking and checked read-only shell commands; Planning permits ROADMAP.md and task Markdown only. Implementation requires an approved task with explicit `Files:` scope. Unknown shell commands are blocked; approved Implementation tasks may run the checked test runners. Small fixes follow the same permissions.

Plans start in Planning. Pi provides the Goal and task content through `propose_plan`; System 1 creates the task layout. Start Building is the only approval, and the harness commits it at once (“Plan approved: N tasks”: the task files, the planning task it completes and ROADMAP.md), so no later request's commit carries it. Plan Another Task leaves the plan waiting in Discussion. Build the Planned Tasks… reviews the waiting scope with checkboxes. Each task gets its own verified commit and waits for Accept and Continue, or Accept Task on the last task. Stop Here pauses without accepting. A plain “yes” does not approve or accept a task. Each task needs a `Files:` line listing the files or folders Pi may change; `.git/` can never be one of them, and the harness commits with Git hooks off. A task is verified only from evidence: a test run that passed on the final code, and the harness's own proof that the same test fails in a temporary copy of the project without the change (your files are never touched); a `--help` run or a run where no test ran does not count. A docs or chore task needs a change to one of its files. Changes outside the task's `Files:` leave it not verified and stay out of its commit. Questions asked during Implementation do not end the task in progress. While an approved task is in progress, a request's work, test runs and notes go to that task: “task 1” never points at the done planning task or a task outside the plan. A test that already passed before the request changed anything is not evidence: a request in Implementation that changes no implementation file ends not verified for the task in progress (its check-in defaults to Retry Task), never “Done”. A request that only edits a task's file is committed with the task's Kind in the title, and a new plan as “Plan proposed: N tasks”. An unverified task's check-in names the changed files outside the task and defaults to Retry Task, which builds the same task again; it is never skipped. Accept Anyway… asks first, then accepts it without a passing test: its boxes are checked and its ROADMAP.md line reads “accepted without verification”. A done check-in shows its evidence: the test run Gate saw, the tests changed (a removed or weakened test makes Review First the default), Pi's “Tried it” and the next task. Reopen Task… (on a done task file in Work, or a request in Activity) unchecks the task's boxes and reopens its ROADMAP.md line; the code stays. A pending check-in can be accepted from any phase, and after a reload it comes back from the project's state, marked Restored.

Every planned task has its scenarios (task 329): Given, When, Then, written by Pi in `propose_plan` and laid out by the harness in the task file's `## Scenarios` section (`### <title>` and its three lines); the plan card shows them. A code task that changes a page, a template, a script or a terminal screen needs at least one. In Implementation Pi writes one e2e test per scenario, named exactly after its title (`kit/cards/e2e-scenarios.md` joins the context; the starters ship an example in `tests/e2e/`), and the task is verified only when each of those tests passed on the final code in a run Gate saw; a missing, failing or skipped scenario test leaves it not verified, naming the scenario. The E2E rule holds for every request in a project with e2e tests: a button, link or field removed while a test still uses it, or a new one no e2e test uses, leaves the task not verified; a control removed together with its test is allowed and the check-in lists it ("Removed: the “Reset” button and its test “Reset the notes”"). The starters' e2e examples skip with the reason when no browser is set up for the project's tests; Create never runs them and nothing is downloaded. Every project from the kit carries the same test protocol (task 332, test-core, pinned in kit/vendor/test-core-2444016): `SCENARIOS.md` lists the app's scenarios (each capability adds its own), one e2e test each through the project's one browser helper (`tests/e2e/conftest.py`, `tests/e2e/browser.mjs`), and `tests/test_protocol.py` or `tests/protocol.test.mjs`, part of the base check, runs test-core's checkers from `test-core/`: every scenario has its test, every control on the pages has an e2e step, no test waits for time. Pi gets `kit/cards/test-core.md` with every code task.

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
online shop", "make an RPG"): Pi WorkStation gives Pi exactly that card, never the whole library, and Pi copies its
markup, texts and states instead of inventing them. An app's card lists its blocks; Pi loads each one with its
`app_block` tool. `python3 kit/blocks/add.py <project> <Name>` (in the harness folder) copies what a block needs, such
as Chart.js for a chart, with licences, and `python3 kit/blocks/check.py <page>` checks a page for classes Basecoat
does not have, missing labels, charts without a table, hard-coded colours and CDN links.


### What if Pi describes a plan but never submits it?

For a planning request in Planning, the harness asks Pi once to call `propose_plan` if no plan was submitted. This
keeps the same request and does not approve the plan. Stop, a pending question, a pending plan and returning to
Discussion prevent that retry. A real-model success still depends on the model following the tool instruction.

## Are my clicks and focus changes recorded?

WorkStation and Preview structural recording start on unless previously disabled. Controls live in Settings, without a permanent recording bar or first-use banner. Settings › Allow action recording turns capture on or off for both surfaces and all projects; turning it off preserves history and refuses late batches. The detailed WorkStation and Preview controls remain in Settings for per-surface choices and clearing Preview history. Turning recording off gives Pi less interaction context and makes debugging harder. This checkpoint uses a shared local profile: anyone using it shares its recording choice and history.

Only structural actions, focus changes, supported navigation keys and redacted input lengths are captured. Typed text, passwords, chat/document contents, labels and full URLs are excluded. Unsupported pages may not record. These are lossy traces, not video or guaranteed replay. A recorder failure does not block messages or answers.

History stays on the host with its project. WorkStation actions outside projects use separate storage. Limits: 7 days, 20 flows per bucket, 500 actions per flow, 50 actions and 64 KiB per delivered batch. A full flow stops saving and says so. Disabling preserves history; clearing moves it to recording Trash and invalidates late delivery. Reload starts a new flow when recording is enabled.

The history browser, report/reproduction attachments and automatic context selection remain under implementation. This checkpoint never automatically sends recordings to Pi, publishes them or executes recorded actions.

## Can several chats or actions run at once?

GPT-OSS 20B is the default for new installations; an existing saved model choice stays in place until changed.
With `/config set parallel_server true` and a restart, plh starts its own isolated Ollama server with two 8K context
slots and one resident model. It does not change the Ollama app's global settings. A short streamed check runs while
idle. Only repeated interleaved generated tokens on that exact model and server configuration enable two requests.
`/models check --force` repeats the check. The model menu shows the result; a failed check is different from an
unknown result. Colibri and ordinary Ollama endpoints without verified serving settings keep one request at a time.

Two requests may work in separate project folders, including two chats. Requests sharing a project folder or chat
history wait. Each chat resumes only its own session. Stop affects only the selected request. The queue uses a total
two-request ceiling and a 16K combined context reservation (8K per request); memory pressure or an unavailable memory
reading reduces new admissions to one. A restart, model digest, engine version, endpoint or serving setting change
invalidates evidence. A managed server failure never redirects work to the owner's server.

GPT-OSS performs one bounded task self-review, with correctness, test and scope prompts, before verified changed tasks
finish. This is the same model reviewing its work; tests and Gate remain the authority, and approvals still apply.

A smoke checks simultaneous progress on short prompts. It does not establish answer quality, maximum concurrency or
safe long histories. The historical 16-stream 2K experiment is not a production capacity limit. Other backends may
parallelize a model that serialized here. Production starts conservatively at two, and the model's context window is
8K on the managed server, so long chats compact sooner. See [configuration and evidence](../docs/parallel-generation.md).

### How do I stop all action recording?

Open Settings and turn off Allow action recording, or choose Stop All Recording in either detailed recording panel. It stops WorkStation and the Preview recordings for every registered project, including other windows. Recorded history stays on the host. Turning Allow action recording back on enables both surfaces and starts new flows; pending batches from before the stop are refused. A storage failure is reported as a failure, since some recorders may already have stopped; ordinary chat and files remain usable.

### Why does startup say “Pi needs Node >= 22.19.0”?

The Node version on PATH is too old, unavailable, or did not report a supported stable version. Put Node 22.19.0 or newer on PATH and run `plh` again. Pi has not started; the launcher does not install Node for you. `plh setup` and the notice for an already-running WorkStation remain available.

## How do I test my app in several windows or as two users?

In Preview, **Address** shows the usable address and port, plus the app server's port when different. Copy Address
copies the current page and App language. The local web Preview port stays bound for this project's current harness
session, including Stop/Start and crash recovery; restarting the harness may change it. Terminal and Tailscale addresses
have their own lifecycles.

**Open in New Window** opens another copy of the current page and language without restarting the app. Use it repeatedly,
or Window › Open App in New Window (⌃⌥B). A fallback link and Copy Address stay available while the app runs. Opening
never starts a stopped app. On another device, only the guarded Tailscale address is used; this Mac's localhost address
would not work there.

Windows share browser sign-in and saved data. For independent accounts use a private window (⇧⌘N, Firefox ⇧⌘P) or
another browser profile. The workbench does not create a private session for you. Terminal windows start independent
runs of the terminal app.

### Why did Pi stop without an answer?

The harness detects a finished model turn with no user-visible answer, even after file reads, and wakes Pi once within its configured recovery budget. When the model filled its window while reasoning, it retries with the current request in a fresh model context and shortens selected context so the answer has room. The saved conversation is retained; old tool results are omitted for that retry, and Pi must read project files again for missing facts. This does not depend on Pi being able to compact a small session. This never changes phase or approves work. If it still cannot answer, the failed message explains the failure and offers Retry; the queue and composer remain usable. Run on its own reports with nothing changed and no tasks, decisions, external actions or non-routine problems are kept in the audit files but omitted from the conversation. Routine Discussion/Planning phase refusals alone do not create a report card; other failures remain visible.
