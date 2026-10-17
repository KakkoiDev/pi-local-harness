# 78: Pi Workbench 1-bit, Settings

Kind: code

Request 2026-10-13: "implement this new design." Build step 11 of [design/IMPLEMENTATION.md](../design/IMPLEMENTATION.md) § 12 (§ 8 Settings and persistence).

- [x] Red (`tests/browser/chat.cjs`): ⌘, opens `#settings-dialog`; Inverse, Gray and Return sends off, then Save, give `html[data-theme=dark]`, `html[data-pattern=gray]` and a black body; Return in the prompt adds a line; after a reload the theme and pattern are set by the inline head script (chat.mjs does not apply them at startup); Paper, Dots and Return sends on restore the defaults; Cancel keeps the saved appearance.
- [x] `index.html`: Settings dialog (Appearance: Paper, Inverse, Match System; Desktop pattern radiogroup Dots, Gray, Plain; "Return sends a message (Shift-Return adds a line)"; Cancel, Save default); inline head script reads `plh.appearance` and `plh.desktopPattern` before the stylesheets apply; the static `data-appearance="light"` on `<html>` is gone.
- [x] `js/chat.mjs`: `applySettings`, `openSettings`, pattern radiogroup with arrow keys, Save on form submit (the dialog's `close` event fires a task later, which a test caught); commands `settings` and `desktop-pattern` (focuses the pattern group); the prompt's Return honours `plh.returnSends`.
- [x] `chat.css`: patterns key off `html[data-pattern]`, so the head script can set them before `#desk` exists.
- Differs from the spec: § 8 says `#desk[data-pattern]`; it is `html[data-pattern]` for the reason above.
- Not tested: Match System, Plain, the pattern arrow keys, Desktop Pattern… from the menu.
