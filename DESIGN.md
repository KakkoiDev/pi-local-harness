# Workbench design

Pi Workbench follows *Human Interface Guidelines: The Apple Desktop Interface* (1987) in principle, drawn one bit deep: black ink on white paper, one menu bar, windows that tile on a dotted desktop, select-then-command. The full system is the “Pi Workbench System 1” design system; this file is the short version every change must respect. How to build it: [design/IMPLEMENTATION.md](design/IMPLEMENTATION.md). Where everything lives: [design/README.md](design/README.md).

## Rules

- **Two colours.** `--paper` and `--ink`, and their inversion for selection. `--ink-disabled` only for disabled controls and placeholders. The Inverse theme swaps paper and ink. No other colours, no gradients, no blurred shadows.
- **Three faces, three jobs.** Pixelify Sans for chrome (menus, buttons, labels), Source Serif 4 for what people and Pi write (chat, documents, comments), IBM Plex Mono for commands, code and paths. Shipped as local files.
- **One menu bar** holds every command: π, File, Edit, View, Project, Agent, Window. Commands are Title Case verbs; an ellipsis means a dialog follows. Shortcuts are accelerators, never the only way. No action depends on right-click or long press.
- **Windows.** The active window has a striped title bar; inactive ones are blank. Views: Chat ⌘1, Work ⌘2, Activity ⌘3, Laya ⌘4. Side windows (Projects, Files, Review, Event Info) tile beside the main window; on phone they become full screens or bottom sheets.
- **State is a glyph and a word**, never colour: Running, Waiting, Completed, Failed, Stopped, Interrupted, Cancelled; Approved, Blocked, Revise, Verified, Drift.
- **Default buttons** carry the outer ring; one per window, dialog or sheet; always the safe or expected action.
- **Forgiveness.** Destructive actions ask with an alert whose default is safe. Comment deletes can be undone and are kept for good. Conflicts keep the draft and offer Download Draft….
- **Stability.** Live polling never moves focus, selection or the text under the cursor. The menu bar never changes shape; unavailable commands are disabled, not hidden.
- **Phone (≤760px).** Phone bar instead of the menu bar, 44px targets, safe-area insets, no fake status bar. The phone's own long press selects text; every app action is a tap.
- **Accessibility.** Real buttons, links and form controls; ARIA menubar pattern; 2px ink focus outline; 21:1 contrast; no motion.
