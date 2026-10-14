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

## How do I rename, move or delete a project?

Open it, then the **Project** menu: Rename Project…, Move Project…, Remove from List… (the folder stays), Move Project to
Trash… (the Finder's Put Back brings it back). On a phone, the ⋯ on the project's row. Chat, comments and Activity stay
with the project.

## Chat or Work?

**Chat** (⌘1) is the project's one conversation with Pi: ask, plan, request changes. **Work** (⌘2) shows the files: edit
Markdown as blocks or source, comment on a passage, and ask Pi about a passage or the whole file.

## How do comments work?

Select text in Work and choose **Comment** (⇧⌘M). A comment stays with the file until you choose **Ask Pi**; Pi's answer
appears in the thread, not in Chat. **Add Note** keeps a reply without sending it. Review (⌥⌘R) lists every comment and
its state: not sent, waiting, Pi working, answered.

## What does Pi see?

Under each place you send something, "Pi sees:" lists the files Pi gets with that request (the plan, the current file,
files you mention, related ones). After an answer, "Also read:" lists the files Pi opened itself.

## Where do I see what Pi is doing?

The status at the top right of the menu bar: Ready, Working, waiting, or what needs attention. Click it for **Activity**
(⌘3): every request with its state, steps and record, and a button back to where it came from. **Gate** (⌘4) lists every
command check, allowed or blocked, and why.

## Can Pi work on a long task?

Yes. A request has no time limit; it stops only if Pi sends nothing for an hour (`/config set silence_seconds …`). Stop
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
`/config`, `/paths`, `/guide`, `/undo`. They run at once, without the model, and Pi can explain their output. Pi's own
commands (`/settings`, `/model`, `/new`, `/compact`…) still work.

## Something is wrong. What do I do?

Run `/doctor` in terminal Pi: it checks the data folder, settings, Ollama, the chosen model, the agent lock and the
workbench, and says what to do for each problem. A page that "could not load" after an update: quit `plh`, start it
again, reload. "Connection interrupted" in the browser: `plh` stopped; start it and choose Reconnect.

## Where is my data?

In `~/pi-local-harness-data` (`/paths` lists each part): settings, the model choice, chats, comments, Activity records,
Gate's history, backups and the app's own trash. Project files stay in their own folders.
