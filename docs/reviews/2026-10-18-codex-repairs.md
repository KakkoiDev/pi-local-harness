# Repair handback to Claude · 18 October 2026

Scope: independent review of Claude's implementation through `087d114`, followed by the owner's request to fix the reproduced findings. This report supplements `docs/handoff/claude-return-2026-10-17.md`; it does not claim the remaining roadmap has been implemented.

## Critical conversation failure

The owner reported a visible phase question returning “no longer waiting” and blocking conversation. Read-only inspection of the referenced request found a live Activity request but no corresponding persisted assistant choice. Gate had subsequently retired the phase question through Start Building. No personal transcript or project contents are included here.

Two concrete defects were repaired:

- WebChat emitted a choice immediately but only saved it after the worker settled. The answer endpoint searches saved cards, so clicking a visible live card could return stale. Controls are now saved before emission. Finalization updates the same assistant record and preserves a person's answer or a settled card; it cannot recreate an unanswered copy. The page uses the saved card while the live worker continues, and raw control JSON is no longer displayed as a notification.
- An installed Laya abstention still created a blocking phase question, contrary to the authoritative explicit phase controls. Every phase-intent result now supplies an advisory notice. It does not change phase or block the person's original request.

Regression coverage includes answering while the first worker is deliberately still running, finalization/reload without reopening or duplication, continuing the conversation, drafts and attachments, double clicks, simultaneous conflicting answers in two tabs, plan replacement, stopped and failed replies. These exercise scratch HTTP services and a real browser with fake Pi; they do not establish real-model semantic correctness.

## Other reproduced repairs

- Add Capability's full-suite runner now receives the Workbench data root and the project's approved network policy. Previously its extra test run omitted both sandbox inputs.
- Theme, font and capability destinations are checked before writes, including symlinked parent directories. Paths outside the registered project are refused; the font check happens before fetching. Existing lexical paths are preserved across macOS `/var` aliases.
- A failing or unavailable pre-add full-suite baseline refuses a capability addition before changing files. A known-red app no longer bypasses the promised all-tests check.
- Capability selection keeps keyboard focus, scroll and the active search filter when its list updates.
- Project Start saves the person's app description into the initial roadmap Goal.
- Browser setup waits for the New Project handler and checks the phone sidebar's actual accessibility state. The offline test-runner fixture emits explicit test counts rather than an empty successful process.

Unit and integration regressions were run red before repair. The immediate-answer browser case also exposed overly broad historic-card selectors in the test, which now target the latest matching card. US-142 covers filtered keyboard selection. Conversation coverage now includes an actual concurrent submission, rather than two sequential tab clicks.

## Remaining work and review boundaries

Keep existing tasks open rather than marking this repair as completion of their broader plans:

- 275–281: shared Python/HTMX application core and server, Python/WASM front-only, and mobile packaging with complete target journeys.
- 268–274: remaining System 1 judgement migration; decision UI alone does not complete the migration.
- 292: component/build provenance; 293: context improvements; 294: Colibri integration; 295–300: repair tools, extended user journeys, project evolution and multi-turn reliability; 301: Laya follow-up.
- 302, 303, 306, 308, 309: maintenance plans; 307 remains partial. Task 243's deferred settings and 244/245's owner-dependent benchmarks retain their prior scope and blockers. Do not download or run models implicitly.
- Plan 266's remaining genre, art/SVG, content and adapter work is not completed by the capability path repair.

The owner's priority remains breadth and reliable app delivery before generated-app performance/scalability. Their requested advanced Project Start builds reusable Python/HTMX blocks (auth, multiplayer, collision detection, dashboard, offline use, publishing and phone packaging), keeping one stable application foundation across export targets. A catalogue is not proof those combinations work. Add full journeys for representative combinations, migrations, export/install, offline reopening and recovery before claiming production readiness.

For Claude's next independent review: scrutinize live-vs-saved control ownership, accepted answers during worker shutdown, browser refresh across phase changes, inaccessible or moved project folders, destination symlink races, and real packaging journeys. No claim is made of filesystem race-proof isolation against a hostile process replacing symlinks between checking and writing.

Historical owner clarification remains authoritative: the originally analyzed benchmark/project runs were v2/pre-Laya with deterministic gates and System 2 workflow decisions. Later logs may represent other builds; establish component provenance before attributing behavior to Laya. This repair used no model runs and changed no original logs.

## Manual acceptance

Open an existing project and send a message that leads to a question. Answer as soon as the card appears; it should settle once, survive reload and allow the next message. Try another answer in a second tab, and keep an unrelated draft/attachment while clicking a card. Change phase through the explicit phase control and check that historical cards cannot reopen it. In Project Start, search for QR, select with Space, and verify the filter and focus remain.

The complete Python/Node workflow passed. All 63 browser stories and the dedicated conversation suite passed; the complete combined browser run is also required before commit. The commit is chained to the workflow check and final browser result. Installation and restart results are recorded in the session handback. No raw logs, secrets, downloaded models or personal-project data are committed.
