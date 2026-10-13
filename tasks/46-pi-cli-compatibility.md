# 46: Web chat Pi command and older Pi compatibility

Audit 2026-10-13: the web chat started Pi with `--no-mcp`, which Pi 0.87.1 and 0.77.0
reject (`Error: Unknown option: --no-mcp`), so every web job failed. The fake Pi fixture
accepted any argument, hiding it. Pi 0.77 also crashed on the unguarded
`registerEntryRenderer` in the startup display.

- [x] Red: real installed Pi must accept the web chat's exact command (`get_state` over RPC).
- [x] Red: startup display must load on a Pi without entry renderers.
- [x] Extract `pi_command`, drop `--no-mcp`; guard the renderer and fall back to a notification.
- [x] Green: mutation re-adding `--no-mcp` fails the new test; Python 61/61 and Node 22/22 pass.
- [x] Document the Pi/Node pairing the startup tests need; update roadmap.
