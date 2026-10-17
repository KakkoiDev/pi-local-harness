# 304: The Preview never serves outside the project

Kind: code

Source: the second bug hunt (2026-10-18) and its documentation-drift part; numbers are the hunt report's items. Items 4, 5, 26.

- [ ] Replace the bare `python -m http.server` with a handler that resolves every path inside the project, refuses
  dot-paths (.env, .git), turns off listings and checks the Host (no DNS rebinding).
- [ ] Open on Phone applies the workbench's own Tailscale user check (remote_users) to the published app.
- [ ] The terminal-app Preview's WebSocket checks the Origin; the Preview iframe gets a sandbox.
- [ ] Tests: an outside symlink, .env and .git all 404; a foreign Host is refused; a foreign Origin cannot start the app.
