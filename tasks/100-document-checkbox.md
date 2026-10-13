# 100: Document checkboxes use pw-check

Kind: code

Request 2026-10-13 (UI review of http://127.0.0.1:3000): "blue checkmarks in the mark down".

- [x] Red (browser): task checkbox in the document has class `pw-check`, no system accent.
- [x] `js/workspace.mjs` renderBlocks: `pw-check`, top margin as DocumentBlock preview.
- Also: the box sits 7px down, on the first text line (DocumentBlock preview). Red/green: tests/browser/design.cjs.
