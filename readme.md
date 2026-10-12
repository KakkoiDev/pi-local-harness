# Pi local harness

A local workbench for **one agent, one chat per project, and real Markdown files**.
Start `plh` (or `pi-local-harness`) from any directory. It starts Pi in your home
directory, Laya on port **8000**, and the web workbench on **3000**. Plain `pi` keeps
its normal behavior. Whisper loads only when you submit audio.

## Install and start

Requirements: Pi's `pi` command, Python 3, a running local Ollama-compatible model
server, and `uv` for audio transcription.

```sh
python3 harness/install.py
plh
# From a checkout, without installing:
./start.sh
```

The installer copies the runtime into `~/.local/share/pi-local-harness` and creates
`~/.local/bin/plh` and `~/.local/bin/pi-local-harness`. Put `~/.local/bin` on your PATH
if necessary. The installed runtime survives moving or deleting the checkout.
Re-run the installer after updating the source. It backs up previous installations
and detaches the recognized old global harness extension and its model defaults,
preserving unrelated Pi settings, packages, extensions, and custom instructions.

The console prints actual service URLs once, as colored, underlined terminal links.
They scroll away with the transcript. Startup fails clearly if a configured port is
already occupied; it never kills another process. Closing Pi stops its services.

## Projects, documents, and chat

Open the printed Web URL. **New project** lets you choose a parent directory and
creates a folder with `ROADMAP.md` and `tasks/001-first-task.md`. **Add existing
folder** registers any accessible folder in place; it does not move its files.
Projects can live anywhere. Registration alone does not create or overwrite docs.

The left sidebar contains projects and a search field (⌘/Ctrl K). Project and
file searches stay scoped to their lists. The browser remembers the last project,
view, and selected document. First-run actions guide you to create/register a folder. Each project has exactly one persistent chat.
The **Work** tab shows its actual folder, file tree, active work, queue, roadmap,
and task documents. Edit Markdown as heading, paragraph, list, checkbox, quote,
and code blocks, or switch to Markdown source. Unsupported Markdown is retained
as raw text; this is a small block editor, not a complete Notion renderer.
Changes autosave to the actual files. Concurrent filesystem changes produce a
version conflict rather than silently overwriting your draft. Trash moves Markdown
pages into the data directory's `.trash`.

Select document text and add a comment, then explicitly **Send to agent**. Comments
do nothing until sent. You can also prompt below a document or use **Open project
chat**. All requests enter one durable FIFO queue. Cancel waiting work; Stop ends
the active worker. You can browse another project while work continues. Interrupted
work is marked interrupted after restart and is never automatically repeated.

Every queued turn starts a Pi RPC worker in that project's folder, resumes **only
that project's Pi session**, and includes fresh roadmap/tasks and file inventory.
Document requests also include the selected current document. Switching back
restores that project's conversation; it never merges other project chats. Older
conversation context can be compacted by Pi. Scope is an instruction and cwd, not
a filesystem sandbox.

Files and work progress refresh roughly every two seconds. Text/code files are
viewable and editable; binary files are listed but not rendered as text. The tree
skips `.git`, dependency/cache folders, and symlinks, with a 2,000-file limit.
The text viewer limits files to 512 KB. Roadmap/task context is bounded to 60,000
characters per turn, with a 12,000-character limit per document.

## Data and configuration

`~/pi-local-harness-data` contains shared `AGENTS.md`, `config.json`, `.projects.json`
(folder registry), `.queue.json`, `.comments/`, `.trash/`, and `chats/` (metadata,
Pi session files, uploads). `projects/` stores projects created through the API
without a chosen external parent. Registered external projects stay in place.
Chat transcripts are never automatically copied into shared memory.

The first `plh` launch creates this directory, a default `config.json`, and
`AGENTS.md` if they are missing. Later launches preserve existing configuration.

Edit `~/pi-local-harness-data/config.json`, then restart `plh`:

```json
{
  "model": "ollama/gemma4:26b-mlx",
  "effort": "high",
  "laya_port": 8000,
  "web_port": 3000,
  "whisper_model": "mlx-community/whisper-base-mlx"
}
```

Both terminal Pi and browser workers use this model/effort configuration. Port `0`
selects an available port. `PI_AGENT_DATA` selects a different data directory;
`PI_LAYA_PORT` and `PI_WEB_PORT` override ports. See the
[operations guide](harness/README.md) for other environment settings.

## Architecture: who does what

```mermaid
flowchart TD
    Launch[plh: config + home cwd] --> Pi[Terminal Pi + harness extension]
    Pi --> Services[Owned Laya and web servers]
    Browser[Project workbench] --> Queue[Durable single-agent queue]
    Queue --> Worker[Pi RPC worker: project cwd + own session]
    Docs[Current roadmap, tasks, selected document] --> Worker
    Worker --> Extension[Same harness: shared services]
    Pi --> Model[Configured local model]
    Worker --> Model
    Model --> Proposal[Proposed tool call]
    Proposal --> Gate[Laya: check before execution]
    Gate -->|ALLOW| Tool[Pi executes tool]
    Gate -->|BLOCK + reason| Model
    Tool --> Audit[Laya: audit actual result]
    Audit --> Model
```

**The model proposes. Laya checks. Pi executes.** Browser workers reuse existing
services; they never launch a second web/Laya pair. A shared process lock prevents
overlapping terminal and browser agent turns within the same data directory.

Laya runs at Pi's `tool_call` event **before execution**. Allowed proposals receive
a one-use ID. Blocked proposals never execute; specific corrective feedback guides
the model's next reasoning step. After `tool_result`, an audit checks the original
proposal, execution status, and write/edit postconditions. Gate failures fail
closed; failed/unavailable audits become failed tool results.

Ordinary shell commands work in both profiles: `env`, `ls /`, `whoami`, builds,
tests, and scoped cleanup such as `rm -rf ./build`. Broad deletion (`rm -fr *`),
root/home deletion, disk erasure, raw disk writes, and recursive system permission
changes are blocked. Common shell wrappers are checked. This is an accident guard,
not a sandbox for arbitrary scripts. [Rules and sources](specs/shell-safety.md).
The **Laya** tab shows the actual shared ledger: checks, arguments, outcomes,
reasons, and timestamps. Its latest 200 events reset when services restart.

## Recovery, memory, media, and timestamps

Every **10 seconds**, the watchdog checks the latest 100 nonempty thought lines.
Two non-overlapping occurrences of the same consecutive three lines trigger
recovery. A thought phase with no active Pi operation, or 60 seconds without
streamed activity, triggers hang recovery. Normal idle and tool execution are
exempt. Pi exposes operation/stream state, not definitive GPU utilization.

Recovery aborts, waits for the turn to end, compacts, reloads shared `AGENTS.md`,
and reasks the original question with previous reasoning and the incident. Missing
`[CANARY]` in completed assistant text follows the same path. One automatic retry
is allowed per question. Memory reloads before every turn. The agent can record
verified lessons/preferences; automatic incident lessons are currently fixed and
deduplicated by kind. Evidence-verified promotion remains an open roadmap task.

Paste accessible image/audio paths in terminal Pi (quote paths containing spaces),
or attach/drop/paste images and text files in web chat. Images are passed as bytes.
Audio uses lazy local MLX Whisper speech transcription; the transcript goes to
Gemma. This does not mean the 26B model consumes native audio or interprets
non-speech sounds. First audio use may install dependencies/download weights;
startup does not load Whisper. Microphone recording needs browser permission.
Uploads support images, common audio, and UTF-8 text/code: eight files, 12 MiB each,
20 MiB total in the UI. Unsupported binary formats return an error.

Question, assistant, tool, and completion events receive local timestamps in Pi.
Web messages and queue jobs also record timestamps. Services bind to loopback and
reject foreign browser origins. The layout supports mobile sizes; physical-phone
access needs a separate connection setup.

## Where to change things

| File | Responsibility |
|---|---|
| `plh.py`, `harness/install.py` | Dedicated launcher, config, stable installation |
| `harness/extension.mjs` | Pi hooks, memory, recovery, service ownership |
| `harness/services.py` | Laya/web sockets and shutdown |
| `harness/web_chat.py`, `harness/work_queue.py` | Project chat, uploads, RPC, FIFO jobs |
| `harness/documents.py` | Folder registry, Markdown, revisions, comments |
| `index.html`, `chat.css`, `js/chat.mjs`, `js/workspace.mjs` | Project workbench |
| `js/markdown-blocks.mjs` | Loss-preserving Markdown block conversion |
| `laya/engine.py`, `laya/shell_guard.py`, `laya/ledger.py` | Gate, shell rules, audits |
| `harness/media.mjs`, `harness/transcribe.py` | Image paths and lazy speech input |
| `ROADMAP.md`, `tasks/` | Completed and remaining work |

Run `python3 -m unittest discover -s tests`, `node --test tests/harness/*.test.mjs`,
and `python3 tests/verify_workflow.py`. Browser regression instructions are in
[the operations guide](harness/README.md). Browser/RPC fixtures test boundaries;
they do not claim to measure model intelligence.
