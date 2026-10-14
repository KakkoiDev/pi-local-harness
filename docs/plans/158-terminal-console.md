# Plan 158: terminal Pi as the harness console

Status: **phases 1 to 3 built** (tasks 159, 160, 2026-10-14): read commands; `/config set`, `/models use`, `/undo` with confirmation, backup and log. Next: `/models check` (plan 156 § 7), phase 4 (Ollama, pull and remove models), phase 5 (model tools). Task: [tasks/158-terminal-console.md](../../tasks/158-terminal-console.md).
Read [docs/contributing-for-agents.md](../contributing-for-agents.md) first.

Request 2026-10-14: "I want the plh harness that opens in the terminal in pi to be a "backend" of sorts where I can run scripts and see raw data, explore and be guided by the harness that knows itself and exposes tools for me to gain insight on how it works and perform admin level actions. Update settings, even in ollama, etc..."

## 1. Where we are

- `plh` (`plh.py`) checks for an update, picks the model, and `exec`s Pi with the harness extension (`.pi/extensions/local-harness.ts` → `harness/extension.mjs`). Every argument after `plh` goes to Pi, so `plh <subcommand>` is not free: it would be read as Pi's arguments.
- The extension hooks Pi's events (Gate before and after each tool, memory, recovery, the agent lock). It registers **no commands and no tools** yet.
- Pi 1.1.0's extension API has `pi.registerCommand(name, options)` (a slash command typed by the person, no model call) and `pi.registerTool(tool)` (a tool the model can call).
- Admin facts are spread out: `<data>/config.json`, `<data>/model.json`, `<data>/.projects.json`, `gate-events.jsonl`, `activity/`, the Ollama app's `~/Library/Application Support/Ollama/db.sqlite` (the models folder, task 153), `launchctl` variables (`OLLAMA_NUM_PARALLEL`, task 67), the web server's `/api/*`.

## 2. Goal

The terminal session `plh` opens is the harness's console:

1. **Commands** you type, which run at once without the model: status, raw data, model checks, settings.
2. **Tools** Pi can call when you ask in words ("why did Gate block that?", "which model runs parallel?"): the same functions, so the answer comes from data, not memory.
3. **Self-knowledge**: a console guide (`harness/CONSOLE.md`) loaded into terminal sessions. It covers what each part does, where data lives, which commands exist and what is safe.
4. **Admin actions** with a confirmation, a backup and a record: harness settings, the model choice, Ollama's settings.

The web stays the place for daily work; the console is for insight and administration.

## 3. One backend, three doors

`harness/admin.py` holds every admin function, each returning plain data (dicts and lists):

- **Read:** `status()`, `config()`, `models()`, `capabilities()`, `queue(state=None)`, `job(id)`, `gate(n, outcome=None, project=None)`, `projects()`, `ollama_settings()`, `paths()`, `doctor()`.
- **Change:** `set_config(key, value)`, `pull_model(name)`, `remove_model(name)` (to the Trash),, `choose_model(model, effort)`, `model_check(model=None, force=False, all=False)` (plan 156 § 7), `set_ollama(key, value)`, `restart_ollama()`, `forget_project(id)`.

Three doors use those functions:

- **Slash commands** in terminal Pi (the extension calls `python3 -m harness.admin <command> --json` and prints a table).
- **Tools** for the model (the same subprocess; see § 5 for what is allowed).
- **Scripts**: `python3 -m harness.admin <command>` from any shell, with `--json` for raw data. This is also the one place tests exercise.

When the services are running, reads that need live state (the queue, Gate) go through the local HTTP API on the shared port. Otherwise they read the files directly.

## 4. Commands (first set)

| Command | Does |
|---|---|
| `/harness` | What the harness is and what it is doing now; a list of the commands below with one line each (the guided entry point). |
| `/status` | Services and ports, the model and its capability, queue counts, today's Gate counts, the data folder, the installed build. |
| `/queue [running\|waiting\|failed]` | Jobs as a table; `/job <id>` prints the Markdown task record. |
| `/gate [n] [blocked]` | The last checks with decision, reason and command; `/gate why <event>` explains a decision. |
| `/models` | Installed models: thinks, sees, tools, capability (parallel, one at a time, unknown), size; the chosen one marked. |
| `/models use <name> [effort]` | Switch the model (the same switch as the web menu: unloads the previous one). |
| `/models check [name] [--all] [--force]` | The parallel-capability measurement (plan 156 § 7). |
| `/config` · `/config set <key> <value>` | `<data>/config.json` with each key explained; validates before writing. |
| `/ollama` · `/ollama set <key> <value>` · `/ollama restart` | Ollama's settings: models folder, `OLLAMA_NUM_PARALLEL`, context length, keep-alive, the Ollama version and its runner. |
| `/raw <name>` | Raw files: `config`, `model`, `projects`, `gate [n]`, `job <id>`, `context <job>` (what Pi was sent for that request). |
| `/doctor` | Checks and explains problems: Ollama reachable, models folder consistent, chosen model installed, Gate reachable, a stale agent lock, `tailscale serve`, disk space. |
| `/script <name>` | Runs a script from `harness/scripts/` (for example the parallel experiment), listed by `/script`. |

## 5. Decisions

| # | Decision | Recommendation |
|---|---|---|
| C1 | **Who may change things.** Commands (typed by you) can change settings after a confirmation in the terminal. Model tools can **read anything** but only **propose** a change: the change runs only after the person's yes. | Decided 2026-10-14 ("needs yes from human") |
| C2 | **Ollama in scope.** Read: all of it. Change: models folder (with moving models, as in task 153), `OLLAMA_NUM_PARALLEL`, default context length, keep-alive. **Models too**: `/models pull <name>` (shows size and progress, asks first) and `/models remove <name>` (its files go to the Trash, never deleted). | Decided 2026-10-14 ("harness should also manage the models") |
| C3 | **Backups.** Every change first copies the file it changes (`config.json`, Ollama's `db.sqlite`) to `<data>/backups/<time>-<name>`; `/undo` restores the last one. | Recommended |
| C4 | **Record.** Every admin change is a line in `<data>/admin-log.jsonl` (time, command, before, after, who: you or Pi-proposed) and shows in `/status`. | Recommended |
| C5 | **Where the commands live.** In terminal Pi as slash commands; `python3 -m harness.admin` for scripts. `plh` itself stays a launcher (no subcommands), so Pi's own arguments keep working. Pi's own `/settings`, `/model` and `/thinking` are left alone: the harness uses `/config` and `/models`. | Recommended |
| C6 | **Self-knowledge.** `harness/CONSOLE.md` is loaded only in terminal sessions (not web jobs), kept short, and checked by a test against the registered commands, so it cannot drift. | Recommended |
| C7 | **Web.** The console's read functions also back a later Settings › Advanced in the web; not part of this plan. | Later |

## 6. Safety

- Gate already checks every command Pi runs. Admin tools are a separate, explicit door: Pi does not need `sqlite3` or `launchctl` in bash to change Ollama, and Gate can keep refusing those in bash.
- Changes are validated (types, allowed keys, paths exist), confirmed (`ctx.ui.confirm` with what changes, from what to what), backed up (C3) and logged (C4).
- Restarting Ollama asks first and says what it interrupts (a running job is stopped).
- Nothing is deleted permanently; anything removed goes to the Trash.

## 7. Phases and tasks

1. `harness/admin.py` read functions plus `python3 -m harness.admin` with `--json`; unit tests against a temporary data folder and a fake Ollama.
2. The extension registers `/harness`, `/status`, `/queue`, `/job`, `/gate`, `/models`, `/raw`, `/doctor`; `harness/CONSOLE.md` loaded in terminal sessions; a Node test that every command in CONSOLE.md is registered.
3. Changes: `/config set`, `/models use`, `/models check` (with plan 156 phase 1), backups, the admin log, `/undo`.
4. Ollama: `/ollama`, `/ollama set`, `/ollama restart` (the models-folder move of task 153 becomes a tested function).
5. Model tools: read tools, plus `propose_admin_change` (C1).

## 8. Open questions for the person

- Anything else you look up by hand today that the console should show (logs, memory use, which session a job used)?
