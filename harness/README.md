# Harness operations

Read [the root README](../readme.md) first for architecture and project workflows.

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
in Pi's global directory. Project-local Pi instructions can also apply.

| Environment | Default | Purpose |
|---|---|---|
| `PI_AGENT_DATA` | `~/pi-local-harness-data` | Registry, memory, queue, shared agent lock |
| `PI_GATE_PORT` | Config: 8000 | Gate; 0 chooses a port |
| `PI_WEB_PORT` | Config: 3000 | Web; 0 chooses a port |
| `PI_HANG_MS` | 60000 | Thought stream inactivity timeout |
| `PI_GATE_AUTH` | admin | Both profiles enforce destructive-shell rules |
| `PI_HARNESS_MEMORY` | Data directory `AGENTS.md` | Advanced direct-extension override |
| `PI_WEB_DATA` | Data directory `chats/` | Persistent web session/upload location |
| `PI_WHISPER_MODEL` | Config: whisper-base-mlx | Lazy transcription model |
| `PI_WEB_REMOTE_HOSTS` | Config: remote_hosts | Comma-separated tailnet hosts trusted by the web server |
| `PI_WEB_REMOTE_USERS` | Config: remote_users | Comma-separated Tailscale logins trusted by the web server |

The model is pinned in `harness/model.json` (`ollama/gemma4:26b-mlx`); terminal and
browser workers both read it, and `config.json` cannot change it. PLH derives browser
`PI_WEB_EFFORT` from config. Extra `plh` arguments such as `--model` still reach the
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
   the Pi startup lines. If serve fails, the line reads `Phone access off: <reason>`
   and the local web UI still works.
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
# Requires Playwright and Chromium:
NODE_PATH=/path/to/node_modules node tests/browser/chat.cjs
```

Set `PI_TEST_CHROME` to an installed Chromium executable if needed. Browser checks
use temporary files and a labeled fake Pi RPC boundary fixture; startup tests use
the installed real Pi runtime without making an LLM request, so the `pi` and `node`
first on `PATH` must match (verified: Pi 0.87.1 on Node 24.16). The web chat's exact
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
