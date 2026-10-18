# 304: The Preview never serves outside the project

Kind: code

Source: the second bug hunt (2026-10-18) and its documentation-drift part; numbers are the hunt report's items. Items 4, 5, 26.

- [x] Replace the bare `python -m http.server` with a handler that resolves every path inside the project, refuses
  dot-paths (.env, .git), turns off listings and checks the Host (no DNS rebinding).
- [x] Open on Phone applies the workbench's own Tailscale user check (remote_users) to the published app.
- [x] The terminal-app Preview's WebSocket checks the Origin; the Preview iframe gets a sandbox.
- [x] Tests: an outside symlink, .env and .git all 404; a foreign Host is refused; a foreign Origin cannot start the app.

Notes (2026-10-18): harness/preview_files.py replaces `http.server`; the Preview's proxy (Frame) and the phone guard
(harness/preview_guard.py, in front of `tailscale serve`) check the Host; harness/terminal-preview.py refuses a foreign
Host or Origin before textual-serve starts the app. Not covered: a stack app's own uvicorn port still answers any Host
when reached directly (the workbench's frame goes through Frame, the phone through the guard).
