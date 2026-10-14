# TerminalOutput

How terminal Pi (`plh`) draws System 1 on a character grid (round 6). Boards: the canvas's Terminal page, T_Principles … T_Workbench.

## Translation table

| App | Terminal |
| --- | --- |
| Window title bar | Title rule: `── Title ───…`, title bold, a dim summary at the right. No side borders, so output copies as text. |
| Info-bar double rule | `═══` under table headers only. |
| Inversion | The footer segment that needs you, and the open completion item. Pi’s own select lists mark the chosen row with “→” instead (as built). |
| Glyph + word | ✓ Completed/Allowed · ✗ Failed/Blocked · ! Needs attention/Revise · ▶ Running · ○ Waiting · ■ Stopped · ~ Interrupted · ? Escalated · ● In use. ASCII fallback: ok, NO, !!, >. |
| Secondary text | Dim: times, IDs (first 8 characters), paths, hints. Never a state. |
| Commands | Typed lowercase (`/status`); titles and buttons Title Case; an ellipsis means a question follows. Every output ends with a dim hint naming the next command. |
| Confirmation | Pi’s own select list: the action first, Cancel first for destructive changes; the chosen row marked “→”; Pi prints its hint “↑↓ navigate · enter select · escape cancel”. |
| Colour | None carries meaning: bold, dim, inverse, underline. Links are OSC 8, underlined, in the theme's link colour. |

## Parts

- **Output**: title rule + body indented 2. Inner parts: key/value card (labels padded to the longest), table (header, `═`, rows with glyph + word in the first column, ellipsis at the column width; 80-column layouts on the board), checklist (`✓ ok` / `✗ fix` / `! note`, label, detail, then `→ the command that fixes it`), list (KEY VALUE FROM; changed values say where from in bold), prose (guide answers wrapped at 72).
- **Header** (startup): name and build, Web, Gate, Phone (or why it is off), “Ask in words, or type /harness for commands.” First start adds one suggestion line. QR at the right from 100 columns, below otherwise.
- **Footer**: one line at every width, under Pi’s own footer (folder, context, model): model · thinking │ state │ Gate today │ phone. State reads “▶ Working” or “▶ Working · worker in <project>”. Only /queue clears the attention segment. Not built yet: “○ Loading <model>…”, “▶ Working · web: <project>”.
- **Tool call**: `▶ tool  argument` then `✓ Gate allowed · ✓ exit 0 · 0:12` for bash, `✓ Gate allowed · ✓ done · 0:01` for read and edit. A failure reads `✗ failed` plus “It failed on its own; Gate did not block it.” Gate's verdict and the tool's own result are separate words.
- **Confirmation**: bold question; detail rows (what changes from → to, where it is saved: model choice in `model.json`, settings in `config.json`; for `/models remove`: Moves · Frees · Undo); then Pi’s select list with “→” on the chosen row. Result: one line with glyph and `/undo`.
- **Proposal**: Pi never changes anything; it prefills the input line with the command and a dim hint (“Pi proposed this · Return runs it · Esc clears”). Return opens the confirmation.
- **Notification**: only when something needs the person; one inverted warning line with what, where and the command.
- **Noise**: no timestamp lines (time dim on the message header; `/verbose on` for durations); `[CANARY]` always stripped.

## Names (round 6 notes, as built)

- `/models use|pull|remove <name>`; remove moves the files to the Trash. `/ollama set <key> <value>`, `/ollama restart`.
- `/config` lists the 15 settings; `/config <key>` explains one; `/config set <key> <value>` asks first.
- `/queue` (no `all`); `/job <8-char id>`; no `/job … stop` (stop from the web Activity); no /job for terminal turns.
- Refusal: “■ Another request is running. Pi works on one request at a time; yours was not sent.”
- Recovery: one retry by itself (“Pi asks again another way · Esc stops it”), then “✗ Harness stopped retrying.”
- `/doctor` names existing commands that fix a problem (`→ /ollama restart`, `→ /config set …`), each asking first. A stale agent lock is a note: it clears itself.
- Pi’s own banner and any tmux warning sit above the harness header.
