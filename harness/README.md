# Harness operations

Read [the reference](../docs/reference.md) first for architecture and project workflows.

```sh
python3 harness/install.py
plh                         # alias: pi-local-harness
./start.sh                   # launch directly from this checkout
```

`plh` starts from home regardless of your shell cwd. Web jobs run in their chosen
project folder. Plain `pi` does not auto-load the harness after legacy migration.
The installer preserves unknown/custom Pi instructions; check those separately
if you intentionally added your own harness references.

Configuration lives in `~/pi-local-harness-data/config.json`. Shared instructions
are `~/pi-local-harness-data/AGENTS.md`, following Pi's plural instruction filename.
PLH explicitly injects this file before turns and after recovery; it need not live
in Pi's global directory. Project-local Pi instructions can also apply. Pi may add a short lesson to it with write
or edit in any phase (task 290): Gate exempts this one file (`$PI_HARNESS_MEMORY`, else `<data>/AGENTS.md`) from
the project phases, size-guarded (at most 32 KiB, 4 KiB more at a time, never cut below half).

Every setting is a key in `config.json` and an environment variable plh passes on; `harness/settings.py` lists them all
with their defaults and meaning, and the console shows and changes them (`/config`, `/config set <key> <value>`; each
applies the next time plh starts). A variable already set in your shell wins over config.json. The main ones:

| config.json | Variable | Default | Purpose |
|---|---|---|---|
| `gate_port`, `web_port` | `PI_GATE_PORT`, `PI_WEB_PORT` | 8000, 3000 | Ports; 0 chooses one |
| `silence_seconds` | `PI_HARNESS_SILENCE_SECONDS` | 3600 | A request stops after this long without a word from Pi |
| `model_silence_seconds` | `PI_HARNESS_MODEL_SILENCE_SECONDS` | 120 | While Pi waits for the model: this long with no token, thought or tool call fails the request (“the model stopped answering”) and the next one starts |
| `hang_seconds` | `PI_HANG_MS` (×1000) | 60 | Thought-phase inactivity before abort, compact and re-ask |
| `ollama_url` | `PI_OLLAMA_URL` | http://127.0.0.1:11434 | Where Ollama answers |
| `tool_repair`, `tool_repair_port` | `PI_TOOL_REPAIR`, `PI_TOOL_REPAIR_PORT` | true, 0 | Pi reaches Ollama through the tool-call repair proxy (task 326); 0 chooses its port |
| `gate_auth` | `PI_GATE_AUTH` | admin | Gate profile; both enforce destructive-shell rules |
| `whisper_model` | `PI_WHISPER_MODEL` | whisper-base-mlx | Transcription model |
| `remote_hosts`, `remote_users` | `PI_WEB_REMOTE_HOSTS`, `PI_WEB_REMOTE_USERS` | none | Phone access over the tailnet |
| `web_data`, `audit_log` | `PI_WEB_DATA`, `PI_HARNESS_LOG_FILE` | data folder | Chats and uploads; Gate's audit log |

`PI_AGENT_DATA` (the data folder, `~/pi-local-harness-data`) is chosen before plh starts, since config.json lives in it.
The harness also sets variables for its own requests (`PI_HARNESS_*`); `/config` lists them.

`harness/model.json` holds the default model (`ollama/gemma4:26b-mlx`). The person chooses
another installed Ollama model and the thinking level in the web menu bar; the choice lives in
`<data>/model.json` and both terminal Pi (from its next start) and browser workers use it
(`harness/model.py`: `current()`, `effective()`). Switching unloads the previous model
(`keep_alive: 0`) before loading the new one. `config.json` cannot set the model; its `effort`
is the default thinking level (`PI_WEB_EFFORT`). `PI_OLLAMA_URL` points at a different Ollama
(tests use a closed port). Extra `plh` arguments such as `--model` still reach the
terminal Pi for that one session only. `PI_WEB_CWD` is retained only for legacy
nonproject sessions; project jobs always use their registered folder.

Services are owned by the launched Pi process. Occupied ports fail without
killing other processes. Startup links appear once in a scrolling transcript
entry, with OSC 8 hyperlinks where the terminal supports them. RPC notices use
plain URLs. Display entries do not enter model context.

Images attach directly; audio is transcribed with `uv run --python 3.12` and MLX
Whisper only on demand. Japanese is supported by the multilingual Whisper model;
the Japanese quality evaluation remains open. First-use delay depends on downloads.
A previous cached two-second English recording took 1.35 seconds on this machine;
that measurement is not a startup-delay guarantee.

## The console in terminal Pi

The terminal session `plh` opens is the harness console (plan 158). Type `/harness` to choose from the list (“Ask in words” first; a choice goes on the input line; `/harness list`
prints it; Tab completes model names, settings, guide topics and request ids): `/status`, `/queue`,
`/job <id>`, `/gate [n] [blocked]`, `/gate why <id>`, `/models`, `/ollama`, `/projects`, `/config`, `/paths`, `/doctor`,
`/auto`, `/report`, `/audit`, `/setup packages` (task 331: install the project's packages, after asking), `/undo`, `/reports`, `/decisions` (the last request's decisions and their authors), `/bench`, `/guide [words]` (topics built from GUIDE.md's
questions), `/update`; `/harness` itself lists them.
They run at once, without the model; the output appears in the session, so you can ask Pi to explain it. The same
commands run from any shell: `python3 -m harness.admin <command> [--json]`. Pi's own `/settings` and `/model` are Pi's.
`/config set <key> <value>`, `/models use <name> [effort]` and `/undo` ask before changing anything, back up the
file they change (`<data>/backups/`) and log it (`<data>/admin-log.jsonl`); from a shell they need `--yes`. `/models check [name] [--all] [--force]` measures whether a model answers two
requests at once (stored in `<data>/model-capabilities.json` per model digest, Ollama version and `OLLAMA_NUM_PARALLEL`;
the workbench also measures the chosen model by itself the first time, while the queue is idle). `/ollama set <key>
<value>` (`num_parallel`, `keep_alive`, `context_length`, `models_folder`) restarts Ollama so it reads the value; `/ollama
restart`; `/models pull <name>`; `/models remove <name>` moves the model's manifest and the files only it uses to the
Trash, laid out like the models folder (Put Back, then merge). Nothing runs while Pi works. Pi may only propose a change; it runs after your yes.

## Phone access over Tailscale and voice input

The web server always binds to `127.0.0.1`. `tailscale serve` on the Mac runs an
HTTPS proxy on the tailnet name and forwards to that loopback port. Nothing else
listens on the network. Phones need HTTPS for the microphone; tailscale serve
provides it.

Setup, once, on the Mac that runs `plh`:

1. Tailscale running and logged in (`tailscale status` lists this Mac). HTTPS
   certificates enabled for the tailnet (admin console, DNS page).
2. In `~/pi-local-harness-data/config.json` add both lists, then restart `plh`:
   `"remote_hosts": ["mini.example.ts.net"]`, `"remote_users": ["you@example.com"]`.
   Hosts are bare names: no `https://`, no port. Users are Tailscale login names.
   `plh` refuses to start with only one of the two lists set.
3. `plh` starts `tailscale serve <web port>` itself (`tailscale_serve` in
   `harness/services.py`) and prints `Phone: https://<first remote_hosts entry>` in
   the Pi startup lines, followed by a QR code of that address to scan with the phone (hidden when the
   terminal is narrower than about 41 columns). If serve fails, the line reads `Phone access off: <reason>`
   and the local web UI still works. π › Open on Phone… then says "Phone access is off." with the reason, and
   links the page where Serve is enabled for the tailnet when Tailscale's message names it (Copy Link).
4. On the phone (Tailscale app connected) open the Phone URL.

Lifecycle: serve runs in the foreground (no `--bg`) as a child of the services
process; quitting Pi terminates it. Nothing is left in the tailnet config, unless
you also ran `tailscale serve --bg` yourself: undo that with `tailscale serve reset`.
Set `PI_TAILSCALE` to use a different tailscale binary (tests use a fake).

Checked 2026-10-13 on the Mac mini (tailscale 1.9x, task 110):
- A foreground serve leaves no config behind: after the services stop, `tailscale serve status` reads "No serve config".
- With Serve not yet enabled for the tailnet, `tailscale serve` prints the enable link on stdout and waits.
  `tailscale_serve` reads its output for 2 seconds, stops it, and Pi shows
  `Phone access off: Serve is not enabled on your tailnet; enable it once at https://login.tailscale.com/f/serve?node=…`.
  Open that link once (tailnet admin), then restart `plh`.
- With `remote_hosts`/`remote_users` unset, Pi shows `Phone access off: set remote_hosts and remote_users in config.json`.

How a request is trusted (`WebHandler.trusted` in `harness/web_chat.py`):

| Request | Rule |
|---|---|
| `Host: localhost:PORT` or `127.0.0.1:PORT` | Allowed; an `Origin`, if sent, must be `http://` that same host |
| Any other Host | Host minus `:443` in `remote_hosts`, `Tailscale-User-Login` in `remote_users`, and `Origin`, if sent, exactly `https://<host>` |

The person's controls need more (task 261): `/api/phase`, `/api/phase/build`, check-in accept and stop,
`/api/plan/wait`, `/api/auto` and a message that answers a waiting choice must carry `X-Pi-Person`, this run's secret,
which the server writes into the served page (`<meta name="pi-person">`) and `js/ui.mjs` `personHeaders()` sends.
Without it they answer 403 “Reload the page”. The phone gets the secret with the page.

A card's answer has its own route (task 290): `POST /api/choices/answer` with `project`, the question's `id` (Gate gives
each question one), `option` (the chosen option's index) or `text` (the person's words), and `key` (one per card, so a
repeated click is the same answer). The answer is resolved atomically: the card is locked, the answer becomes a request
of its own that runs before the chat's other waiting messages and is never joined with them, a second answer gets the
first (`answered`), and an answer to a question that is no longer the one waiting is a no-op (`stale`). A
`Choice: <question> → <answer>` message sent to `/api/jobs/create` takes the same path. Start Building and Continue
send their own requests (`control`), never the composer's draft or attachments.

Tailscale serve sets `Tailscale-User-Login` from the tailnet identity and removes
any copy the client sent. Funnel (public internet) requests carry no login, so they
are refused. A refused remote request returns 403 with the received Host, login and
Origin: copy those values into config.json if they are yours.

Not verified on this machine (2026-10-13): which exact Host header tailscale serve
forwards. The 403 message shows it; use what it says.

Voice input: the mic button records with the browser's MediaRecorder (`audio/webm`
on Chrome, `audio/mp4` on iOS Safari). On stop, `js/chat.mjs` `dictate()` posts the
recording to `POST /api/transcribe` `{mime, data: base64}`; the server writes a temp
file, runs `harness/transcribe.py` (MLX Whisper via `uv`, needs `ffmpeg`), deletes
the file and returns `{text}`. The text is inserted at the cursor in the prompt box
for review; nothing is sent until you press send. If transcription fails, the error
shows and the recording is attached to the message instead (the old behavior).
The first transcription downloads the Whisper model and can take minutes.

Tests: `tests/test_remote_access.py`.

Recovery uses deterministic repeated thought lines, Pi operation state, and stream
timeouts. It aborts, compacts, reloads instructions, and reasks once. No backend
GPU-running signal is inferred.

## Validation

```sh
python3 tests/verify_workflow.py   # roadmap/task checkboxes + both suites below
python3 -m unittest discover -s tests
node --test tests/harness/*.test.mjs
# Browser suites (Playwright and Chromium; setup in docs/contributing-for-agents.md § 3):
NODE_PATH=/path/to/node_modules node tests/browser/design.cjs   # design conformance
NODE_PATH=/path/to/node_modules node tests/browser/chat.cjs     # regression
```

A browser suite passed only if it exits 0.

Set `PI_TEST_CHROME` to an installed Chromium executable if needed. Browser checks
use temporary files and a labeled fake Pi RPC boundary fixture; startup tests use
the installed real Pi runtime without making an LLM request, so the `pi` and `node`
first on `PATH` must match (verified: Pi 1.1.0 on Node 24.21). The web chat's exact
Pi command is checked against that installed Pi. HTTP/browser tests
need permission to bind localhost sockets in restricted environments.

Gate serves only `/health`, `/gatekeep`, and `/audit`. The workbench uses project
APIs and real Pi RPC workers.

## Activity and comment records

`activity/<task-id>.md` is the durable task source; `.comments/<document-hash>.md`
holds text threads. Metadata is authoritative YAML frontmatter using JSON-compatible
values; the body is a readable summary. Existing JSON records migrate once and are
kept as backups. Queued attachments use separate payload files; they are not embedded
as base64 in the Markdown. A running task resumes as interrupted after restart.
Document-level requests belong above the document; text comments require a unique
selected passage. Activity links restore the appropriate project and source.
