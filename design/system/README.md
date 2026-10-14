# Pi Workbench System 1

The interface of Pi Workbench, the local agent workbench in `pi-local-harness`: one person, one local agent, one chat per project, real Markdown files. It follows *Human Interface Guidelines: The Apple Desktop Interface* (Addison-Wesley, 1987) in principle: one menu bar, windows you can tell apart at a glance, select-then-command, visible modes, forgiving actions. It reuses none of Apple's artwork. Everything is black on white, one bit deep.

Start here, then read a component's card before using it. The implementation handoff for the repo (tokens.css, components.css, icons.mjs and IMPLEMENTATION.md) uses the same class names and token names as this system.

## Principles

1. **See and point.** Every command lives in a menu, on a button, or both. Nothing is reachable only by a gesture, a right-click or a long press. Right-click and keyboard shortcuts are accelerators for things you can also find.
2. **Select, then command.** Select a project, a file, a passage or a task, then choose what to do with it. The phone works the same way: the phone's own long press selects text, and every app action is a tap.
3. **Modeless by default.** You can always type, select or comment. The only mode is the agent working, and it is always visible in the menu bar, one click from Activity.
4. **Feedback for everything.** Saving says Saved. Queueing says Waiting. Gate's decisions are shown next to the command they judged.
5. **Forgiveness.** Destructive actions ask with an alert whose default button is the safe one. Deleting a comment can be undone, and deleted comments are kept for good. Nothing the agent was interrupted doing is repeated automatically.
6. **Perceived stability.** The menu bar never changes shape. Windows stay where they are. Live polling never moves focus or the text under the cursor.

## Content fundamentals

- **Commands are Title Case verbs**: New Project…, Move to Trash, Ask Pi About Paragraph…. An ellipsis means a dialog or sheet follows before anything happens.
- **Name things the way the person knows them**: project, page, task, comment, request. Not job, conversation id or proposal.
- **Status is a word, not a colour**: Running, Waiting, Completed, Failed, Stopped, Interrupted; Approved, Blocked, Revise, Verified.
- **Alerts state what happened and what is safe**: "“59-stuck-detection.md” changed on disk while you were editing. Your draft is safe in this window."
- **Pi speaks in the transcript, never in the chrome.** Chrome text is short and plain; it never says "I".
- No emoji, no exclamation marks, no "Oops".

## Visual foundations

**Colour.** Two colours and their inversion. `paper` is the ground, `ink` is everything drawn on it. Selection, open menus, pressed buttons and the current row invert (`selection-bg` on `selection-fg`). `ink-disabled` is only for disabled controls and placeholders. `wash` is a hover hint only. The Inverse theme swaps paper and ink; nothing else changes.

**Type.** Three families, each with one job.

| Family | Token | Used for |
| --- | --- | --- |
| system-ui | `--font-chrome` | Menus, buttons, labels, status, window titles. The platform’s own interface face (San Francisco, Segoe UI, Cantarell…). |
| Source Serif 4 | `--font-text` | What people and Pi write: chat messages, documents, comments. A text face standing in for New York. |
| IBM Plex Mono | `--font-mono` | Commands, code, paths, Markdown source. |

The two named faces are SIL Open Font License fonts; the repo ships them as local woff2 files so the app works offline (see IMPLEMENTATION.md). The chrome face needs no file.

**Lines, not shadows.** Borders are 1px `ink`. Window shadows are a 2px offset of solid ink (`shadow-window`), never a blur. Header separators are a 3px double rule. Separators inside lists are dotted. Corners are square except buttons (`radius-button`), touch buttons (`radius-touch`) and your own chat messages (`radius-bubble`).

**The desktop.** The ground behind windows is `desk` with a 1px `desk-dot` every 4px (`.pw-desk`). The person can switch it to 50% gray or plain under π › Desktop Pattern…. Scroll tracks and modal scrims use the 50% dither.

**Windows.** The active window has a striped title bar with a close box on the left and a zoom box on the right. Inactive windows have a blank title bar with a centred title and no boxes. Below the title bar: an optional toolbar, then an info bar closed by a double rule, then content, then an optional status bar.

**Default button.** The one button Return presses carries a 3px ring at 2px distance (`shadow-default-ring`). At most one per window, dialog or sheet, and it is always the safe or expected action.

**Size.** Desktop controls are 32px high (`size-control`), rows 30px (`size-row`), the menu bar 28px, title bars 26px. At or below 760px (`bp-phone`) every control is 44px (`size-touch`) and chrome text is 16px.

## Layout

- **Desktop (above 760px).** Menu bar, then the desktop with 24px padding. Windows tile left to right with 24px gaps: Projects (or Files) window 260–300px, the main window flexible, an optional third window (Review, Event Info) 320–380px. Windows do not overlap.
- **Phone (760px and below).** The menu bar becomes the phone bar: π (projects and app commands as a sheet), the current view as a popup, and the agent status. Each window is full-screen. Side windows become bottom sheets. The Review window becomes the Comments sheet.

## Views

| View | ⌘ | Window | What it holds |
| --- | --- | --- | --- |
| Chat | ⌘1 | project name | The project's single conversation and the composer. |
| Work | ⌘2 | file name | Files window, document editor with inline comment threads, Review window. |
| Activity | ⌘3 | Activity · All Projects | App-level. The one queue of the one agent: every request from every project, comment and terminal Pi. Running, Waiting, Completed, Failed, Stopped, Interrupted. |
| Gate | ⌘4 | Gate · All Projects | App-level. Every command check, before and after execution, from every project and terminal Pi. |

Chat and Work belong to the project named in the title bar; their tabs are the only tabs in that window. Activity and Gate cover every project: they open from the Agent section of the Projects window, the menu bar status (Activity) and the Window menu, and they show the Projects home on the left. Their close box (⌘W) goes back to where you were. Addresses: `/projects`, `/p/<project>/chat`, `/p/<project>/work/<file>`, `/activity`, `/gate`.

## Iconography

16px glyphs on a pixel grid, 1px strokes, drawn in `currentColor` so they invert with selection. Alerts use 36px Stop, Caution and Note icons. Status glyphs always sit beside their word. Icons are never decoration: if a control has a word, it usually needs no icon. The set lives in `icons.mjs` in the repo and in the Icons asset group here.

## Keyboard

| Keys | Command |
| --- | --- |
| ⌘N / ⌘O | New Project… / Add Existing Folder… |
| ⇧⌘N / ⌘T | New File… / New Task… |
| ⌘S | Save |
| ⌘⌫ | Move to Trash |
| ⌘W | Close Window |
| ⌘Z | Undo (including Undo Delete Comment) |
| ⇧⌘M | Comment on Selection |
| ⌘F / ⌘K | Find in Files… / Find Project… |
| ⌘1 / ⌘2 | Chat, Work (the project window) |
| ⌘3 / ⌘4 | Activity · All Projects, Gate · All Projects (app-level windows) |
| ⌥⌘R | Show or hide Review |
| ⌘⌥] / ⌘⌥[ | Next / previous comment |
| Return / ⇧Return | Queue message / new line (desktop only) |
| ⌘. | Stop the running request |
| Esc | Close menu, popup, sheet or dialog (Cancel) |

On Windows and Linux, ⌘ is Ctrl.

## Accessibility

- Ink on paper is 21:1 in both themes. Disabled text is 4.5:1 or better.
- State is never colour: it is shape, inversion, border style (solid, dotted, double) and a word.
- Every control is a real `<button>`, `<a href>`, `<input>`, `<select>` or `<textarea>`; the menu bar follows the ARIA menubar pattern with arrow keys.
- Focus is a 2px ink outline at 2px offset.
- Reduced motion: there is no motion to reduce; transitions are off.

## What Pi sees

Each request carries a small chosen context (about 4k tokens) that never enters the chat history. The interface shows it twice: **Pi sees: …** (ContextLine) under every place you can send something to Pi, and **Also read: …** at the end of each answer for the files Pi opened itself. The Chat status bar shows how full the conversation is (ContextMeter); when the harness summarises earlier turns, a CompactionMarker marks the place. Comments and whole-file questions run outside the chat: their answers appear in the thread or under the Review window, never in Chat.

## Terminal Pi

The same system on a character grid: what `plh` opens. Two doors to one harness: the web workbench to point and click, the terminal to type, in words or with slash commands. See the TerminalOutput card and the canvas's Terminal page.
