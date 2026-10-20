# Harness console

This terminal session is the Pi WorkStation harness console (plan 158). The person can type these commands; they run at
once, without the model, and their output appears in the session so you can explain it. Prefer them over reading files
by hand: they read live data.

| Command | What it shows |
|---|---|
| `/harness` | A list to choose from (the choice goes on the input line); `/harness list` prints what the harness is and this list. Tab completes each command's words. |
| `/discuss` · `/plan` · `/build` | Choose the project’s shared phase. `/build` reviews the planned tasks and asks before starting; with none planned, use `/plan` first. |
| `/status` | Services, model, queue and Gate counts, data folder, build. |
| `/queue [all\|running\|waiting\|failed\|stopped\|interrupted\|completed]` | Requests in Activity (the one queue of the one agent). `/queue edit <id> <new words>` and `/queue remove <id>` change a message that still waits (asks first; only the person's terminal, never Pi's harness tool; refused once Pi started it). |
| `/job <id>` | The Markdown record of one request (the first 8 characters of its id are enough). |
| (tool) `browser` | Pi opens a page (a scratch workbench by default) at a chosen size, clicks and types, and measures: scrolled and scrollable elements, positioned elements, boxes, styles, console errors, a screenshot. |
| `/bench` | The bench: fixed scenarios run with the real model through the harness (`python3 -m bench run`); solved, verified, time, wake-ups and refusals per model and harness build, and the latest runs. |
| `/decisions [--all]` | The last request's decisions with their authors (you, auto, Laya, code, model; `~` marks automatic ones), as the web chat's decision row shows them. `--all` adds the decisions code made, with rules, paths and commands (Settings › Pi › Detail: Expert does too). |
| `/reports [kind]` | Incidents the harness met while Pi worked alone (a rule sent something back, Gate failed, a recovery, a wake-up, an unverified end, a stop), for the analysis. |
| `/gate [n] [blocked]` · `/gate why <id>` · `/gate rules [id]` | Gate checks, newest first; one check in full (with the rule that decided it); the rules Gate always enforces. |
| `/models` · `/models use <name> [effort]` · `/models check [name] [--all] [--force]` · `/models pull <name>` · `/models remove <name>` | Installed Ollama models: tools, thinking, vision, whether it answers two requests at once, size; the chosen one. `use` switches the model (asks first); `check` measures "at once" (about half a minute per model); `pull` downloads, `remove` moves it to the Trash (both ask first). |
| `/ollama` · `/ollama set <key> <value>` · `/ollama restart` | Ollama: version, models folder, parallel slots, loaded models. `set` changes `num_parallel`, `keep_alive`, `context_length` or `models_folder` and restarts Ollama (asks first). |
| `/projects` | Projects and their folders (missing folders marked). |
| `/auto on\|off\|status` | Run on its own for every project; `on` shows the risks every time, with Cancel first. |
| `/report` | The last automatic run’s report: tasks done, decisions, what left the Mac or used the Trash, problems. |
| `/config` · `/config set <key> <value>` | `config.json` with each key explained; `set` changes one (asks first). (`/settings` and `/model` are Pi's own.) |
| `/paths` | Where the harness keeps its data. |
| `/doctor` | Checks with what is wrong and what to do. |
| `/audit [folder]` | Run publication checks offline after confirmation: files, unused code, references, strict types, all tests, and consistent app names. The audit task records each command and failed checks stay open. |
| `/setup packages [folder]` | Task 331: install this project’s packages from its lock file (`uv sync --frozen`, or `npm ci`), after showing how many packages and how big the download is. Your terminal only: Pi’s harness tool only puts the command on your input line, even with Run on its own. The decision log keeps your decision. |
| `/undo` | Undo the last change made from the console (asks first). |
| `/verbose on\|off` | Every timestamp in the transcript, or (default) one header per Pi message. |
| `/guide [words]` | How to use Pi WorkStation, as questions and answers (`harness/GUIDE.md`). |
| `/update` · `/update now` | Whether a new version of Pi WorkStation is on GitHub and what changed; `now` updates its clone (asks first), and the new version installs the next time `plh` starts. |

With Run on its own off, when you ask the tool for a change (config set, models use|pull|remove, ollama set, undo), nothing changes: the command goes
on the person's input line and they press Return to run it and confirm. Say that in one line; never repeat the command
list in prose (point to `/harness`). Gate lets you propose such a change in any phase, since a preview changes nothing;
`update` and `models check` only read. With Run on its own on, the tool applies the change itself, so Gate checks it as
a write.

You run the same commands with your **`harness` tool** (`command`, `args`). Use it instead of bash or searching the
disk: it runs from the harness's own folder. For "how do I…?" questions about the workbench, call it with `guide` and
a few words (`guide phone`, `guide model`); answer from that, in a few lines. The person can also run
`python3 -m harness.admin <command> [--json]` from the harness folder.

## How the harness works (short)

- `plh` starts Pi with this extension. The extension starts Gate (checks every command before and after it runs) and the
  web workbench (`harness/services.py`), and holds `<data>/.agent-lock` while you work: one agent at a time.
- The web workbench runs requests from its one queue (`<data>/activity/<id>.md` per request). Each request carries a
  small chosen context (`harness/context.py`), not the whole project.
- Data lives in the data folder (`/paths`): projects, chats, comments (`.comments/`), Activity, Gate's history
  (`gate-events.jsonl`), the model choice (`model.json`), settings (`config.json`).

## Changing things

`/config set`, `/models use` and `/undo` ask the person before changing anything; each change backs up the file it
changes (`<data>/backups/`) and is a line in `<data>/admin-log.jsonl`. Ollama changes and model removals are logged the same way; nothing
is deleted (a removed model goes to the Trash). With Run on its own off, you may only **propose** a change (tell the person which command to type); it runs after their yes. Never
change these files or Ollama's settings with shell commands.

`/auto on|off|status` controls Run on its own for all projects immediately; on shows the risks every time, with Cancel first. `/config set auto true` uses the same confirmation. `/report` shows the last run’s four report sections.

The phase button in the web chat and these terminal commands share the same saved project phase. Pi cannot choose it with a tool. Gate checks the next tool call against that phase, including checked read-only shell commands in Discussion and Planning.

The footer shows the phase as its second segment. `/status` includes Phase and Planned tasks. Plan previews offer Start Building, Plan Another Task, Change… and Open ROADMAP.md. `/build` lets you toggle waiting tasks before Start Building. After each task choose Accept and Continue, or Accept Task on the last; Stop Here keeps it waiting for acceptance. A typed “yes” grants neither approval nor acceptance.
