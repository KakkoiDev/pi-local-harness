# TerminalOutput

How terminal Pi (`plh`) draws System 1 on a character grid (round 6). Boards: the canvas's Terminal page, T_Principles … T_Workbench.

## Translation table

| App | Terminal |
| --- | --- |
| Window title bar | Title rule: `── Title ───…`, title bold, a dim summary at the right. No side borders, so output copies as text. |
| Info-bar double rule | `═══` under table headers only. |
| Inversion | The selected row in a list, the default button, and the footer segment that needs you. Nothing else. |
| Glyph + word | ✓ Completed/Allowed · ✗ Failed/Blocked · ! Needs attention/Revise · ▶ Running · ○ Waiting · ■ Stopped · ~ Interrupted · ? Escalated · ● In use. ASCII fallback: ok, NO, !!, >. |
| Secondary text | Dim: times, IDs (first 8 characters), paths, hints. Never a state. |
| Commands | Typed lowercase (`/status`); titles and buttons Title Case; an ellipsis means a question follows. Every output ends with a dim hint naming the next command. |
| Default button | Inverted; Return presses it, Esc cancels, the hint line says so. Destructive changes default to Cancel. |
| Colour | None carries meaning: bold, dim, inverse, underline. Links are OSC 8, underlined, in the theme's link colour. |

## Parts

- **Output**: title rule + body indented 2. Inner parts: key/value card (labels padded to the longest), table (header, `═`, rows with glyph + word in the first column, ellipsis at the column width; 80-column layouts on the board), checklist (`✓ ok` / `✗ fix` / `! note`, label, detail, then `→ the command that fixes it`), list (KEY VALUE FROM; changed values say where from in bold), prose (guide answers wrapped at 72).
- **Header** (startup): name and build, Web, Gate, Phone (or why it is off), “Ask in words, or type /harness for commands.” First start adds one suggestion line. QR at the right from 100 columns, below otherwise.
- **Footer**: model · thinking │ state │ Gate today │ phone. At 60 columns: model │ state │ phone.
- **Tool call**: `▶ tool  argument` then `✓ Gate allowed · ✓ exit 0 · 0:12`. Gate's verdict and the command's own exit are separate words.
- **Confirmation**: bold question; what changes from → to, where it is saved, side effects; `[Action]` inverted default, Cancel; hint. Result: one line with glyph and `/undo`.
- **Proposal**: Pi never changes anything; it prefills the input line with the command and a dim hint (“Pi proposed this · Return runs it · Esc clears”). Return opens the confirmation.
- **Notification**: only when something needs the person; one inverted warning line with what, where and the command.
- **Noise**: no timestamp lines (time dim on the message header; `/verbose on` for durations); `[CANARY]` always stripped.
