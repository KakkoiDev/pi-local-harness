# Harness console

This terminal session is the Pi Workbench harness console (plan 158). The person can type these commands; they run at
once, without the model, and their output appears in the session so you can explain it. Prefer them over reading files
by hand: they read live data.

| Command | What it shows |
|---|---|
| `/harness` | A list to choose from (the choice goes on the input line); `/harness list` prints what the harness is and this list. Tab completes each command's words. |
| `/status` | Services, model, queue and Gate counts, data folder, build. |
| `/queue [all\|running\|waiting\|failed\|stopped\|interrupted\|completed]` | Requests in Activity (the one queue of the one agent). |
| `/job <id>` | The Markdown record of one request (the first 8 characters of its id are enough). |
| `/gate [n] [blocked]` · `/gate why <id>` · `/gate rules [id]` | Gate checks, newest first; one check in full (with the rule that decided it); the rules Gate always enforces. |
| `/models` · `/models use <name> [effort]` · `/models check [name] [--all] [--force]` · `/models pull <name>` · `/models remove <name>` | Installed Ollama models: tools, thinking, vision, whether it answers two requests at once, size; the chosen one. `use` switches the model (asks first); `check` measures "at once" (about half a minute per model); `pull` downloads, `remove` moves it to the Trash (both ask first). |
| `/ollama` · `/ollama set <key> <value>` · `/ollama restart` | Ollama: version, models folder, parallel slots, loaded models. `set` changes `num_parallel`, `keep_alive`, `context_length` or `models_folder` and restarts Ollama (asks first). |
| `/projects` | Projects and their folders (missing folders marked). |
| `/config` · `/config set <key> <value>` | `config.json` with each key explained; `set` changes one (asks first). (`/settings` and `/model` are Pi's own.) |
| `/paths` | Where the harness keeps its data. |
| `/doctor` | Checks with what is wrong and what to do. |
| `/undo` | Undo the last change made from the console (asks first). |
| `/verbose on\|off` | Every timestamp in the transcript, or (default) one header per Pi message. |
| `/guide [words]` | How to use Pi Workbench, as questions and answers (`harness/GUIDE.md`). |

When you ask the tool for a change (config set, models use|pull|remove, ollama set, undo), nothing changes: the command goes
on the person's input line and they press Return to run it and confirm. Say that in one line; never repeat the command
list in prose (point to `/harness`).

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
is deleted (a removed model goes to the Trash). You may only **propose** a change (tell the person which command to type); it runs after their yes. Never
change these files or Ollama's settings with shell commands.
