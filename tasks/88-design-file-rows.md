# 88: Pi Workbench System 1, file tree rows

Kind: code

Request 2026-10-13: "make best call decisions". Found in the task 87 screenshot: `#file-tree` rows were bare `button.file-item` (centred text, grey button face), same cause as task 86. `#file-tree` is a `.pw-list`.

- [x] Red (`tests/browser/chat.cjs`): the open file row is a full-width, left-aligned `.pw-row` with the selection colours and a `.pw-row__label`. Fails with the fix stashed.
- [x] `js/workspace.mjs` `renderFiles`: `button.pw-row.file-item` (the phone 44px rule and the search test keep `.file-item`); dropped the unused `active` class.
