# 207: The Preview: the project's app beside the chat

Kind: code

Round 7 (design/IMPLEMENTATION.md points 1–6, 10, 11; PreviewWindow card; boards P_Beside … P_Japanese, P_Narrow).

- [x] Server (python, `tests/test_preview.py`): a project that is not an app says what it is (P_NotWeb); the first
  start and the app's last line while starting (P_Starting); "Pi changed N files. Reloaded." / "Undo changed …" after a
  commit or an undo (P_Changed); `{'kind': 'app'}` for an app not yet started (the Preview opens by itself once).
- [x] Found while trying it: under `uvicorn --reload`, a crashed app keeps its port, so "the port answers" said Running
  while every page hung, and Stopped never came. Now a page must come back; a hanging app is Stopped with its last
  lines (at once when its last line is an error), the reloader keeps running, and a fix brings it back by itself.
  Start Again ends a hanging process first.
- [x] The starters read `?lang=` and remember it (the Preview's English · 日本語).
- [x] `js/preview.mjs`: one body with two homes, beside the chat (480px) while the chat keeps 480px, else a third
  view (Chat · Work · Preview ⌥⌘P); the toggle in the chat's bar and Window → Preview ⌥⌘P; address and Reload; Phone ·
  Tablet (scaled, "shown at 56%") · Full; the app's language; the note line; the four states; Stop / Start; Open in
  Browser; Ask Pi to Fix (the last line in the words, the 8 lines in a fold-out, "· from Preview"); "Pi is fixing
  this"; open or closed, size, language and page remembered per project; hidden in Activity and Gate (app windows).
- [x] Tests (node, `tests/harness/preview-ui.test.mjs`): sizes, the address, Ask Pi to Fix's message. Browser suites:
  the view tabs, New Project kinds, the Preview gone in Activity. Tried in the browser on a scratch workbench: a Web
  app starting, running, Japanese, Tablet, broken (P_Error) and back by itself after the fix; a no-server app created
  from New Project… opening its Preview by itself.
- [x] Open on Phone… and the phone view: task 210.
- Browser suite note: design.cjs line 694 (#agent-status → Activity) fails about one run in three, before this work too.
