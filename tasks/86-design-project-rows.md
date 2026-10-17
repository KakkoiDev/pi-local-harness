# 86: Pi Workbench 1-bit, sidebar project rows

Kind: code

Request 2026-10-13: "finish now". Found while re-checking [design/IMPLEMENTATION.md](../design/IMPLEMENTATION.md) § 13: the sidebar project list rendered `.conversation` / `.conversation-select`, classes with no CSS since task 70, so the rows were bare buttons with no selected state. The List component (`.pw-list` of `.pw-row`) is what `#project-list` already declares.

- [x] Red (`tests/browser/chat.cjs`): the current project row is a `.pw-row`, full width, with the selection colours. The project counts use `#project-list .pw-row`.
- [x] `js/workspace.mjs` `renderProjects`: one `button.pw-row` per project with a `.pw-row__label`; dropped the wrapper `div`.
