# Brief: terminal Pi, the AI-assisted console

Date: 2026-10-14. Round 6. Plan: [docs/plans/158-terminal-console.md](../../docs/plans/158-terminal-console.md). Built so far: tasks 159–162 (console commands, changes after a yes), 166 (every setting), 167 (guide, Pi's `harness` tool).

The person: "The web UI is the Human interface wysiwyg where we point and click instead of remembering. but the pi harness is still in the terminal. except that it is now AI assisted. so it's OK to have no point and click and to type instructions."

## The idea

Two doors to one harness. The **web workbench** is the place to point and click. **Terminal Pi** (what `plh` opens) is the place to type: you ask in words ("is anything stuck?", "switch to qwen", "how do I open this on my phone?") and Pi answers from live data with its `harness` tool, or you type a command (`/status`, `/doctor`, `/gate blocked`) and it runs at once without the model. Settings, models and Ollama are changed here, always after your yes. The terminal should feel like the same Pi Workbench 1-bit family: plain words, state as glyph plus word, one clear default, nothing that only colour can say.

## What it looks like today (real text)

Startup, once, at the top of the transcript:

```
Gate: http://127.0.0.1:8000
Web: http://127.0.0.1:3000
Phone access off: set remote_hosts and remote_users in config.json
Loop check: every 10 seconds
Console: type /harness for the harness commands (/status, /doctor, /queue, /gate, /models, /ollama …)
```

(With phone access on, the Phone line is followed by a QR code drawn in the terminal.)

A command's output is a message in the transcript, a title line and a monospace block:

```
Harness console: /status

Web workbench: running on 127.0.0.1:3000
Model: gemma4:26b-mlx · high thinking · Ollama answers
Queue: 0 running · 0 waiting · 2 need attention · 0 completed
Gate today: 14 checks · 1 not allowed
Projects: 3 · Data: ~/pi-local-harness-data · Build: 7f3b86b
```

```
Harness console: /doctor

ok  Data folder: ~/pi-local-harness-data
NO  Agent lock: left by process 41250, which is gone
     → Remove the stale lock: ~/pi-local-harness-data/.agent-lock
ok  Ollama: http://127.0.0.1:11434 answers, version 0.40.3
```

```
Harness console: /queue

STATUS     CREATED      PROJECT  MESSAGE                                      ID
stopped    10-14 10:31  Demo     Phone row check number 0 with a long requ…   f954b438570c4b3b857917d712e5ab23
```

A change asks with Pi's confirmation dialog (title, detail, Yes / No), then reports "Done. … /undo restores the previous value." or "Not changed."

What the person saw in a real session (pasted 2026-10-14), noise worth designing away:

- Every Pi message is wrapped in timestamp lines: `[2026-10-14 15:12:56 +09:00] Assistant message started` … `completed`, and `Tool result failed: bash`.
- Answers start with `[CANARY]`, a marker the harness uses to detect instruction drift; it is shown to the person.
- A failed command reads `Gate audit failed: EXECUTION_FAILED. The tool reported a failed execution.` and again `Error: Gate: EXECUTION_FAILED: …`, which sounds like Gate blocked something when the command simply exited with an error.
- Pi's long answer listed the commands as prose instead of pointing to `/harness`.

## What the terminal can draw (Pi 1.1 extension API)

- **Header** at startup (replaces the startup block) and a **footer** / status items under the input (always visible).
- **Widgets** above or below the input (a few lines, live).
- **Notifications** (info, warning, error).
- **Dialogs**: select from a list, confirm (yes/no), one-line input, multi-line editor.
- **Custom renderers** for our own messages (the console outputs) and for tool calls (how the `harness` tool and Gate's checks look), with the terminal theme's colours, bold, inverse, dim.
- **The input line**: prefill it (for example with a command for the person to confirm with Return), argument completion for slash commands, keyboard shortcuts.
- **Terminal title**, the working indicator and its message.
- Links (OSC 8: clickable in most terminals), the QR code (block characters).

Limits: a monospace grid from about 60 to 200 columns; light or dark terminal themes we do not choose; 16 colours at most, so state must also be a glyph and a word; output may be copied as plain text; no mouse needed for anything.

## What to draw (boards wanted)

1. **Principles** for the terminal member of the Pi Workbench 1-bit family: how inversion, frames, the double rule, glyph + word, Title Case commands and the default button translate to a character grid. One page.
2. **Startup header**: Gate, Web, Phone (or why it is off, and the QR), the console hint. First start versus every start (compact?). At 60 and 120 columns.
3. **Footer / status**: what is always visible: model · thinking, the workbench state (Ready, Working · 1 waiting, Failed · 1 needs attention), Gate today, phone on/off. How it changes when something needs attention.
4. **Console outputs** as designed components: the status card, tables (queue, gate, models: column choices at 80 columns), the doctor checklist (ok / NO with what to do), the config list (long: 14 settings plus the harness's own variables), guide answers, errors.
5. **Changes**: the confirmation (title, what changes from what to what, where it is saved; which button is the default) and the result. And the moment **Pi proposes** a change it may not make itself: today Pi tells the person which command to type. Should the extension prefill the input line with that command so Return runs it (then the confirmation asks)?
6. **Gate and recovery in the terminal**: a block, a revise, a command that failed (not Gate's doing), "Harness recovery: Loop detected…", "Harness refused: One agent is already working". Words and look.
7. **Noise**: the timestamp lines and `[CANARY]`. Show, dim, hide, or show on demand?
8. **Finding your way**: `/harness` as a menu (select dialog?) or a list; argument completion (model names, config keys, guide topics); `/guide` answers. "Ask in words" as the first suggestion?
9. **The workbench from the terminal**: when a web request starts, finishes or needs attention while you are in the terminal: a widget, a notification, the footer, or nothing?

## Questions

- One look for every console output (a framed block with a title), or a different component per command?
- Should commands also exist as words Pi recognises ("status", "doctor") without the slash, or is the slash the clear line between "run now" and "ask Pi"?
- How much colour, if any, given unknown themes? (Today: none in console output; underlined cyan links in the startup lines.)
