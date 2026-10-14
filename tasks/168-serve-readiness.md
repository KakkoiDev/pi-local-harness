# 168: tailscale serve: a slow failure is not a running serve

Kind: code

Found 2026-10-14 while testing task 166: `TailscaleServeTest` failed now and then (also on the committed code): a fake tailscale that fails at once was still starting after 2 s (likely macOS checking the new executable), so the harness took it for a running serve.

- [x] Red (python): a serve that prints "Available within your tailnet" is ready at once.
- [x] `tailscale_serve` returns as soon as tailscale prints "Available …"; otherwise it waits up to 6 s (was 2 s) before taking a still-running serve as ready.
- [x] Green: test_remote_access twice, verify_workflow.
