# 246: Recover sharing when a Tailscale Serve session stops

Kind: code

The person reported that sharing worked and suddenly stopped after about ten minutes. The current harness starts foreground Serve once and never notices its exit. The exact cause of the reported outage is not yet established.

- [x] Red: a fake Serve exits after readiness and sharing never restarts.
- [x] Restart only the owned foreground Serve session after an exit, for the workbench and Preview.
- [x] Bound captured output and stop recovery when the owner closes sharing.
- [x] Green: isolated lifecycle tests and the workflow gate pass.

Done when: A temporary Serve-session exit recovers without restarting Pi Workbench, and closing sharing stops its exact owned process without leaving another share behind.

## Result

The isolated fake Serve exited after readiness: the old code never relaunched it. The shared helper now owns a supervisor that restarts its foreground session, retries temporary failures, retains only bounded output, and cancels startup and recovery on shutdown. Tests cover recovery, exact child shutdown, and closing during readiness. Remote-access and Preview tests pass. No running personal connection was changed.

This fixes a demonstrated recovery gap, not a confirmed diagnosis of the person’s ten-minute incident. Their device error and whether localhost stayed reachable are still needed to distinguish a Serve exit from sleep, VPN connectivity or the app itself. Tailscale documents that a foreground session must be restarted after a daemon restart: https://tailscale.com/docs/reference/tailscale-cli/serve .
