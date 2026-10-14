# Harness console

This terminal session is the Pi Workbench harness console (plan 158). The person can type these commands; they run at
once, without the model, and their output appears in the session so you can explain it. Prefer them over reading files
by hand: they read live data.

| Command | What it shows |
|---|---|
| `/harness` | What the harness is and this list. |
| `/status` | Services, model, queue and Gate counts, data folder, build. |
| `/queue [running\|waiting\|failed\|stopped\|interrupted\|completed]` | Requests in Activity (the one queue of the one agent). |
| `/job <id>` | The Markdown record of one request. |
| `/gate [n] [blocked]` · `/gate why <id>` | Gate checks, newest first; one check in full. |
| `/models` · `/models use <name> [effort]` · `/models check [name] [--all] [--force]` | Installed Ollama models: tools, thinking, vision, whether it answers two requests at once, size; the chosen one. `use` switches the model (asks first); `check` measures "at once" (about half a minute per model). |
| `/ollama` | Ollama: version, models folder, parallel slots, loaded models. |
| `/projects` | Projects and their folders (missing folders marked). |
| `/config` · `/config set <key> <value>` | `config.json` with each key explained; `set` changes one (asks first). (`/settings` and `/model` are Pi's own.) |
| `/paths` | Where the harness keeps its data. |
| `/doctor` | Checks with what is wrong and what to do. |
| `/undo` | Undo the last change made from the console (asks first). |

The same commands run from any shell: `python3 -m harness.admin <command> [--json]`.

## How the harness works (short)

- `plh` starts Pi with this extension. The extension starts Gate (checks every command before and after it runs) and the
  web workbench (`harness/services.py`), and holds `<data>/.agent-lock` while you work: one agent at a time.
- The web workbench runs requests from its one queue (`<data>/activity/<id>.md` per request). Each request carries a
  small chosen context (`harness/context.py`), not the whole project.
- Data lives in the data folder (`/paths`): projects, chats, comments (`.comments/`), Activity, Gate's history
  (`gate-events.jsonl`), the model choice (`model.json`), settings (`config.json`).

## Changing things

`/config set`, `/models use` and `/undo` ask the person before changing anything; each change backs up the file it
changes (`<data>/backups/`) and is a line in `<data>/admin-log.jsonl`. Ollama's settings and pulling or removing models
come next. You may only **propose** a change (tell the person which command to type); it runs after their yes. Never
change these files or Ollama's settings with shell commands.
