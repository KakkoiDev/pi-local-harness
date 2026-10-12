# Local pi harness

Installed entry points:

- `~/.pi/agent/AGENTS.md`: global instructions, user preferences, and deduplicated incident lessons.
- `~/.pi/agent/extensions/local-harness.ts`: link to the extension in this checkout.

Start pi normally, or run `./start.sh --provider ollama --model gemma4:26b-mlx`.
The extension starts Laya on `127.0.0.1:8000` and the frontend on `127.0.0.1:3000`,
then displays the actual ports in the console widget and status line.
The Laya and Web URLs use OSC 8 terminal hyperlinks in the widget and interactive
startup notice. Click using your terminal’s link-opening gesture (often Cmd-click
on macOS or Ctrl-click elsewhere). Terminals without hyperlink support still show
the readable URLs; RPC startup notices remain plain text. The loop-check line is status text. Shutdown stops its owned services.
An occupied port produces a startup error; it never kills an unrelated process.
Only one harness instance may use these fixed ports at a time; use port `0` for automatic assignment.

Every 10 seconds the extension checks the latest 100 nonempty, trimmed thought lines.
Two non-overlapping occurrences of an identical consecutive three-line sequence trigger recovery.
Thought deltas are buffered across chunks. No semantic similarity or model judgment is used.
A thought phase with no active pi operation, or no streamed activity for 60 seconds, triggers hang recovery.
Normal idle time and tool execution do not trigger it. Pi exposes operation and stream state,
not a definitive CPU/GPU "model stopped computing" signal; the stream timeout is a deterministic fallback.

Recovery aborts the active turn, waits for `agent_end`, compacts, and reasks the last question
with the preceding reasoning, original image attachments, incident explanation, and current global AGENTS.md.
One automatic recovery is allowed per user question. A second failure stops the run and records the incident.
Completed assistant text missing `[CANARY]` follows the same compaction and reinjection path.
Tool-only messages and aborted/error responses are exempt from the canary test.
Memory reloads before every turn; incident lessons are appended once per incident kind.

Paste an accessible image or audio path into your prompt. Quote paths containing spaces:

```
Describe "/Users/me/Desktop/my image.png"
Transcribe /Users/me/Desktop/recording.m4a
```

Images attach as bytes; Gemma MLX aliases advertise `text,image` in pi.
Gemma 26B does not accept audio. Audio files are transcribed locally using MLX Whisper
(`mlx-community/whisper-base-mlx`) and the transcript is added to the question.
This enables speech understanding, not non-speech audio interpretation. The first transcription
installs its Python dependencies and downloads model weights using `uv`; later calls reuse the cache.

Configuration:

| Variable | Default | Purpose |
|---|---|---|
| `PI_LAYA_PORT` | `8000` | Laya port; `0` chooses an available port |
| `PI_WEB_PORT` | `3000` | Frontend port; `0` chooses an available port |
| `PI_HANG_MS` | `60000` | Maximum thought stream inactivity |
| `PI_LAYA_AUTH` | `admin` | Authorization profile; both profiles apply the destructive-shell guard |
| `PI_HARNESS_MEMORY` | global `AGENTS.md` | Override memory file |
| `PI_WEB_DATA` | `~/.pi/agent/web-chat` | Persistent web conversations and uploads |
| `PI_WEB_MODEL` | `gemma4:26b-mlx` | Model used by browser Pi sessions |
| `PI_WEB_CWD` | Launching Pi working directory | Workspace used by browser Pi tools |
| `PI_WHISPER_MODEL` | `mlx-community/whisper-base-mlx` | Local speech model |

Ordinary shell commands are allowed in both profiles. Broad destructive operations are
blocked before execution with a reason delivered to the model. Unknown tools remain blocked.
Laya judges actual pi tool calls through `/gatekeep` and audits their results through `/audit`.
The frontend uses its same-origin `/api/conversations` API and real Pi RPC sessions.
The legacy Laya `/chat` endpoint remains a demo echo and is unused by the frontend.
See [the architecture guide](../readme.md) for web storage, uploads, and session lifecycle.
The standalone log-based Sentinel is retired because log inactivity cannot identify active model hangs.

Checks:

```
node --test tests/harness/*.test.mjs
python3 -m unittest discover -s tests -p test_harness_services.py
python3 -m unittest discover -s tests -p test_pi_startup.py
python3 tests/verify_workflow.py
```

## Startup defaults and message timestamps

Plain `pi` uses `ollama/gemma4:26b-mlx` with high thinking effort after running
`python3 harness/configure_startup.py`. Explicit CLI model/thinking options still override these defaults.
Whisper remains lazy-loaded: opening pi does not import or load Whisper. A cached
transcription of a two-second test recording took 1.35 seconds total on this machine,
including Python startup, model loading, and transcription.

The interactive transcript displays durable timestamp entries for question submission,
assistant message start/completion, tool results, and final task completion. For example:

```
[2026-10-12 23:10:04 +09:00] Question submitted
[2026-10-12 23:10:09 +09:00] Assistant message completed
[2026-10-12 23:10:09 +09:00] Task completed
```

Timestamps use the machine's local timezone and include seconds and UTC offset.
They are custom session entries, rendered on session reload, and never added to model
context or the CANARY text. Aborted/failed messages and tasks are labeled stopped/failed.
RPC clients receive the timestamp entries as structured `entry_appended` events.

Laya now snapshots each allowed proposal before execution and returns a one-use audit ID.
Audits detect tool/argument drift, execution errors, and write/edit content mismatches on disk.
Rejected or unavailable audits become failed pi tool results so the model cannot silently claim success.
