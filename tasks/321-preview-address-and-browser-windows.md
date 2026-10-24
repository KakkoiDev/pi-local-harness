# 321: Show Preview ports and open more browser windows

Kind: code

Owner request: see the Preview port and open a second or more browser windows for multi-user feature tests; include this in Claude's report.

- [x] Obtain the design for these additions before implementation (owner clarification).
- [x] Red: browser regression for the visible address and repeated opening of the guarded app.
- [x] Show the browser Preview address/port and the app-server port when different; preserve page/language when opening windows.
- [x] Explain that independent accounts require separate browser profiles/private sessions; keep stopped/terminal controls accurate.
- [x] Run workflow and complete browser checks, update Claude's report, commit, push and build.

## Scenarios

### US-362 the Preview shows its address and port, and the app server’s port when it differs
Given a project whose app runs in the Preview
When I look at the Preview
Then its address and port are shown, and the app server's port too when it is different

### US-363 opening the Preview in a new window keeps the page and language, as many times as I like
Given the Preview on a page of the app in Japanese
When I open it in a new window twice
Then each window shows the same page in Japanese, and the Preview controls still say whether the app is running

### US-364 the Preview explains that a second account needs a private window or another browser profile
Given the Preview with a second window open
When I look for how to test as two users
Then the Preview says independent accounts need a private window or a separate browser profile

## Session decisions and backend progress (2026-10-24)

The person approved a stable Preview address for the current harness session, and omitting unreliable window counts and popup detection in favor of an always-available fallback link and Copy Address. The implementation follows round 15, with those two owner-approved changes.

The local web Preview proxy now retains its bound listener through Stop/Start and crash recovery; stopped apps return 503 instead of serving stale content. The listener closes with the harness. Terminal WebSocket previews remain separate. Page input cannot override the app origin. Both regressions failed before implementation. The Address/window controls and all five browser scenarios are implemented. Japanese copy is included; the local web port is stable within the harness session, while terminal WebSocket and phone share lifecycles remain separate.

### US-361 Preview keeps its address after restarting and a page cannot select another host
Given a running app in Preview
When I stop and start it, then enter a page beginning with two slashes
Then its Preview address stays the same and the page stays on the app's origin

### US-365 a remote Preview opens only its guarded address and never shows the Mac’s localhost address
Given a running Preview opened from another device
When I inspect its address and open the app
Then only the guarded Tailscale address is shown and used

## Verification and release

The visible-address browser story failed before implementation. URL-origin, stable-listener and failed-health-probe regressions also failed before their fixes. All five new browser stories (US-361–365), Preview/theme integration tests, the full workflow and all six browser suites pass, including the real-Pi fake-model golden journey. Screenshots were reviewed at 1440, 1024, 390 and 320 px. No new download was needed; optional Ruff was unavailable. The commit/push/build release is recorded in the session closeout. Real Tailscale devices, screen-reader output and a native Japanese review remain manual checks.
