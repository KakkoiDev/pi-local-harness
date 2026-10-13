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
| `PI_LAYA_PORT` | Config: 8000 | Laya; 0 chooses a port |
| `PI_WEB_PORT` | Config: 3000 | Web; 0 chooses a port |
| `PI_HANG_MS` | 60000 | Thought stream inactivity timeout |
| `PI_LAYA_AUTH` | admin | Both profiles enforce destructive-shell rules |
| `PI_HARNESS_MEMORY` | Data directory `AGENTS.md` | Advanced direct-extension override |
| `PI_WEB_DATA` | Data directory `chats/` | Persistent web session/upload location |
| `PI_WHISPER_MODEL` | Config: whisper-base-mlx | Lazy transcription model |

PLH derives browser `PI_WEB_PROVIDER`, `PI_WEB_MODEL`, and `PI_WEB_EFFORT` from
config. CLI Pi flags can override the terminal invocation only; use config to
change terminal and browser together. `PI_WEB_CWD` is retained only for legacy
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

Recovery uses deterministic repeated thought lines, Pi operation state, and stream
timeouts. It aborts, compacts, reloads instructions, and reasks once. No backend
GPU-running signal is inferred. The retired standalone log sentinel is unused.

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

The legacy Laya `/chat` route is a demo echo. The workbench uses project APIs and
real Pi RPC workers; never connect model conversations to that demo route.

## Activity and comment records

`activity/<task-id>.md` is the durable task source; `.comments/<document-hash>.md`
holds text threads. Metadata is authoritative YAML frontmatter using JSON-compatible
values; the body is a readable summary. Existing JSON records migrate once and are
kept as backups. Queued attachments use separate payload files; they are not embedded
as base64 in the Markdown. A running task resumes as interrupted after restart.
Document-level requests belong above the document; text comments require a unique
selected passage. Activity links restore the appropriate project and source.
