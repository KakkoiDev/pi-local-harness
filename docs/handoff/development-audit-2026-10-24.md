# Handoff to Claude: development audit and next work · 24 October 2026

For Claude and the next development session. This is a focused Preview audit and roadmap inventory, not a claim that every subsystem has been audited or every task completed.

## Task 321 implementation

- The Preview proxy previously closed on Stop/Start or crash recovery. Its browser address therefore changed. The project now keeps a bound local listener for the harness session and retargets it when the app restarts. Stop and crashed processes return 503; shutdown closes the listener. Different projects keep separate listeners. Stop and restart are serialized.
- Page input such as `//other.invalid/notes` previously replaced the app origin. Page resolution is now anchored to the app origin, including backslash/control-character cases; normal query, fragment and language selection are preserved.
- Failed health probes leaked their HTTP connections. Cleanup now runs on success and failure.

All three defects had failing regressions before their fixes. Tests cover Stop/Start, process exit/restart, stopped responses, project isolation, real listener shutdown, failed-probe cleanup and URL origin confinement. Browser US-361 exercises Stop/Start and the page field; US-362–365 cover address/copy/focus, repeated windows/shortcut/stopped controls, account guidance/responsive layout, and guarded remote routing on synthetic scratch data.

## Task 321 decisions already approved

Keep the usable Preview port stable during the current harness session. Omit window counts and popup-block detection; always provide the real fallback link and Copy Address. Windows share browser sign-in/storage: separate accounts need a private session or another profile. These decisions supersede the conflicting count/detection portions of round 15. Do not ask again.

Implemented: visible usable host/port, Address dialog using round 15 classes, local internal-port explanation, Copy Address, repeated synchronous `noopener` windows preserving page/language, always-present fallback link/copy while running, Window menu and Control+Option+B, disabled reasons, shared-account guidance and Japanese strings. Phone uses Open App and its guarded remote URL; localhost is never a remote fallback. The desktop dialog is anchored below Address; phone uses the existing bottom-sheet component and includes Open App. Native dialog focus is contained, Escape restores Address, and Close supports touch. Polling updates an open dialog without refocusing it. A delayed phone response cannot overwrite another project's address.

The retained local proxy does not promise stable terminal WebSocket or Tailscale ports across their lifecycles. It keeps the local web Preview port for the harness session, not across harness restarts.

## Audit instructions for Claude

Read CONSTITUTION.md, docs/handoff/gpt-sol.md, docs/contributing-for-agents.md, task 321, the round 15 PreviewWindow card and the designer handoff in this folder. Work in harness-next, preserve the owner's checkout and private projects/data. Review the final commit diff, not this report alone.

1. Audit retained listener ownership, stop/start serialization, crash recovery, project separation and shutdown cleanup. Check concurrency with project removal and rename, and whether in-flight requests need further cancellation. Verify no process not owned by the harness is stopped.
2. Audit page-origin confinement (slashes, backslashes, whitespace/control characters, queries/fragments), external redirects and the Host/phone guard boundaries. Do not interpret the browser test's fully intercepted synthetic host as a real tailnet proof.
3. Audit async project changes and phone/status replies. Specifically check delayed responses after selecting a different project, and returning to an earlier one. Review whether stale status refreshes beyond the phone response need a shared generation guard.
4. Check Address dialog updates, focus/Tab/Escape/Close, stopped controls, long addresses, Japanese, phone and screen-reader output. Check the dedicated shortcut fires once and does not intercept IME composition. Verify synchronous opening and `window.opener === null`; opening must not start/restart the app.
5. Check clipboard failure and insecure contexts. The UI reports failure and leaves selectable address text; no fake success or automatic download.
6. Audit tests for false positives and unnecessary setup sleeps. The phone design tests now wait for actual conversation readiness instead of opening a menu during hydration. The controls baseline only shrank. Check the existing menu control coverage heuristic when the phone menu and footer share text.
7. Continue the outstanding roadmap honestly; do not mark research/adapters as a finished product. Validate ICM's merged revision before adoption; Brain evidence stays scoped and System 1 controlled; Jikko is the editor basis; AI starter uses Python/HTMX and keeps credentials outside browser exports.

Recent preceding shipped work for audit context: 21b3a22 (task 365, language-load ordering), fd7fb1c (task 61, real exit codes and unavailable runners excluded from Red/Green), 91c6fea (task 63, early Node requirement), 4fdcde9 (task 364, capability-aware project agents). Their existing tests remain required; inspect those commits separately if reviewing the broader session.

## Roadmap audit

At the start of this slice there were 88 open roadmap entries; completing 321 leaves 87. Several older entries overlap shipped features; that alone is insufficient evidence to close their remaining checkboxes. Keep the task files authoritative and close only verified requirements.

Explicitly deferred: 236's failed benchmark acceptance; 243's Show lessons and worker-wait settings; Luna runs in 244 without a key; 245 until the person enables it. Use the 22 saved local benchmark runs as directed. Never request or store the person's key.

Ready priorities after Preview: workflow repair (322), recorder/history completion (333), headless API extraction (357), stale-lock identity/recovery (62), and remaining System 1 evidence/decision coverage. Inspect each task and its current tests before implementing.

Design-dependent work includes the build checklist (362); its backend exists but its task still identifies an undelivered canvas. Agentplay (350) must be integrated into Actions rather than shipped as a standalone viewer. Do not invent new controls where the approved boards are missing.

Integration work remains in 338–342 (ICM skills, permanent Brain/configuration workspace, AI-powered HTMX/Python starter and Jikko-based editor), and 275–281/347 (one source packaged across browser, server, Capacitor mobile and desktop). These are substantial contracts and platform proofs, not completed by the existing research/adapters.

No new packages or models were downloaded. Phonon additional runtime dependencies still need named approval. Ruff is optional and currently unavailable locally; a skipped Ruff run is not lint verification.

## Validation

Full Python/Node workflow and all six browser suites passed, including the real-Pi fake-model golden journey. All five task 321 stories passed; Preview/theme integration tests passed (43 tests), with URL helper regressions. The initial full runs exposed phone-menu test readiness/hidden-drawer assertions; those were corrected before the passing full rerun. The controls baseline only shrank. Ruff was unavailable and was not run. Release procedure: commit only this diff, push main/harness-next without force, install from harness-next, then run the same task 321 stories against the installed runtime and confirm install.json matches the committed build. The session closeout reports that post-commit smoke result.

Limitations: the remote browser story is fully intercepted synthetic routing, not a live Tailscale/device test. Native screen-reader output, Japanese native-speaker review and real multi-account authentication remain manual checks. No claim of a complete repository security audit is made.
