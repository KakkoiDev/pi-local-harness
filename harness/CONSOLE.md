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
| `/models` | Installed Ollama models: tools, thinking, vision, size; the chosen one. |
| `/ollama` | Ollama: version, models folder, parallel slots, loaded models. |
| `/projects` | Projects and their folders (missing folders marked). |
| `/config` | `config.json` with each key explained. (`/settings` and `/model` are Pi's own.) |
| `/paths` | Where the harness keeps its data. |
| `/doctor` | Checks with what is wrong and what to do. |

The same commands run from any shell: `python3 -m harness.admin <command> [--json]`.

## How the harness works (short)

- `plh` starts Pi with this extension. The extension starts Gate (checks every command before and after it runs) and the
  web workbench (`harness/services.py`), and holds `<data>/.agent-lock` while you work: one agent at a time.
- The web workbench runs requests from its one queue (`<data>/activity/<id>.md` per request). Each request carries a
  small chosen context (`harness/context.py`), not the whole project.
- Data lives in the data folder (`/paths`): projects, chats, comments (`.comments/`), Activity, Gate's history
  (`gate-events.jsonl`), the model choice (`model.json`), settings (`config.json`).

## Changing things

Changes (settings, the model, Ollama's settings, pulling or removing models) are not available as commands yet. When
they are, you may only **propose** a change; it runs after the person says yes, with a backup and a log line. Never
change these files or Ollama's settings with shell commands.
