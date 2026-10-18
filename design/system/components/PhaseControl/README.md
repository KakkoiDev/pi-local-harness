# PhaseControl

The project's phase: **Discussion**, **Planning** or **Implementation** (task 247, CONSTITUTION.md Articles 2–4, 8–10). One phase per project, shared by the web and terminal Pi, saved across restarts. Only the person changes it (and Run on its own's two automatic moves); Pi's tool calls never do. Boards: the canvas page **Phases** (R11_*, Ph11_*, T_Phases).

| Phase | Pi may | Composer placeholder |
| --- | --- | --- |
| Discussion (the start) | read, discuss, search the web; write no file | Ask, discuss, or describe what you want |
| Planning | write ROADMAP.md and tasks/ only (the harness lays out the task files; Pi fills them) | Describe the task to plan, or answer Pi |
| Implementation | change the files of the task in progress, and its tests | Ask about the task in progress |

## Desk

- First in the composer row: `button.pw-phase#phase-button` with `aria-haspopup="menu" aria-expanded aria-controls="phase-menu" aria-label="Phase: <name>. Change phase"`: phase glyph (speech bubble, plan, hammer) + `.pw-phase__label` + ▾. Inverted while open.
- Menu `div.pw-menu.pw-phase-menu#phase-menu role="menu"` opening above the row: three `role="menuitemradio"` items, each the name, its shortcut (⌃⌥D · ⌃⌥P · ⌃⌥I (round 12; were ⇧⌘1–3)) and one `small` line of what Pi may do; then a separator and `.pw-menu__note`: “Only you change the phase. Pi can’t. Saved with the project; terminal Pi shares it.”
- **Disabled, with its reason, never hidden**: Implementation with no planned task reads “No planned task yet. Plan one first.” (`aria-disabled="true"`).
- **Keyboard**: Space, Return or ↓ opens with focus on the checked item; ↑ ↓ move; Return or Space chooses; Esc closes and returns focus to the button; Tab closes and moves on. ⌃⌥D, ⌃⌥P, ⌃⌥I choose without opening. A disabled item announces its reason and can't be chosen.
- **Choosing** applies at once: the button changes, and a `.pw-phase-line` appears in the chat: “Phase: Planning · chosen by you · 14:05” (or “Start Building · you”, “from the terminal (/discuss)”, or the dotted auto tag + “Run on its own”). Allowed while Pi works; it applies to Pi's next file write.
- **Saving**: `aria-busy="true"`, dotted border, “Planning…”. **Failed**: the button returns to the old phase, and an alert line under the composer row: “Couldn’t change the phase to Planning: the project file couldn’t be saved. The project stays in Discussion.” **Try Again**.
- **Run on its own** on: a dotted `auto` tag inside the button, meaning Pi may move Planning → Implementation and continue between tasks.

## Phone

- Its own row above the field: the button (44 px) and, beside it, the current phase's one-line meaning. It opens a sheet “Phase”: three 64 px `.pw-option` rows with 22 px radios, name and meaning, the disabled one with its reason; the note under them. Choosing closes the sheet.

## Refusal

A phase refusal uses Gate's blocked tool row: the tool line, `.pw-tool__reason` (the sentence), then “■ Not in this phase”, the phase (glyph + name), **Change Phase…** (opens the control / sheet) and a **Why?** disclosure listing what the phase allows. Gate's own block keeps “Gate blocked” and Show in Gate. Copy:

- Discussion, any write: “Not written: the project is in Discussion. Pi can read, search and talk, but can’t write files. To plan this change, choose Planning in the phase button (⌃⌥P).”
- Planning, code: “Not written: the project is in Planning. Pi can only write ROADMAP.md and tasks/. To change code, choose Start Building on the plan, or Implementation (⌃⌥I).”
- Implementation, outside the task: “Not written: <file> is not part of task <n>, <title>. Pi can change only the task’s files. To include it, add it to the task in Planning, or plan a new task.”

Pi then says what it couldn't do, and never picks the phase or claims to change it.
