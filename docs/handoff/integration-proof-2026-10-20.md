# Claude review: skill, Brain and Jikko integration proof

Owner request: build the integration foundations with tests, and give the designer a concrete prompt before frontend work. This is a host API proof, not completion of tasks 338–342.

## Implemented

`harness/skill_runs.py` reads a bounded local ICM-format tree (SKILL.md and numbered stages), hashes the complete inventory, and refuses links and changed contracts. Inspection never executes directives/checkers. A host-provided policy must authorize capabilities, phase and approved scope at start and each advancement, including after validation. A registered independent host validator must return literal True. There is no public agent-facing proof/approval endpoint and no default permissive policy.

Private SQLite run state survives restart. Its identity binds project, request and frozen contract. Explicit expected-stage checks serialize concurrent submissions without skipping a stage. Cancellation is terminal. The API neither edits project files nor commits, advances phases, invokes tools/models or installs anything. Capabilities are host-supplied contract metadata; enforcement is the host callback's responsibility. No production Gate/tool dispatch integration has been connected yet.

Completion emits only an observed skills record through the existing curator, with a safe `skill-runs/<id>` citation. It is not a verified fix or commit. New `Curator.context` returns bounded allowlisted metadata with an untrusted-data label. It has no raw prose, configuration, commands, tokens or output. Retrieval is explicit and project-local; no automatic request injection or cross-project publication is enabled.

`tests/proofs/jikko_roundtrip.py` runs a prebuilt local Jikko executable against scratch data only. Source pin tested: c280ec1ea4da4315489f7e65088f55d3787baf1f. No engine source is vendored. Go build used GOTOOLCHAIN=local, GOPROXY=off and GOSUMDB=off: no dependency downloads. Tokens are captured privately and passed only through the environment. No --commit flag is used. Proofs cover exact Markdown/source preservation (including comments/links), uncommitted recovery, conflicting stale-save refusal and invalid-identity refusal.

## Tests and Red evidence

18 unit/integration tests in tests/test_skill_runs.py; 36 existing curator tests; three explicit Jikko subprocess proofs. Initial missing-module Red was followed by a separate behavior Red for missing skill-run provenance. Python/Node suites and all browser suites passed: design, chat, 100 main stories, conversation, golden journey (15 live-Pi steps plus 99 companion stories). The initial final gate caught a missing internal-only scenario exemption in task345; corrected dogfood passed, and a fresh successful workflow gate is required by the commit chain.

To repeat the optional engine proof, build an already-local Jikko checkout with downloads disabled, then set JIKKO_PROOF_BINARY to the executable and run `python3 tests/proofs/jikko_roundtrip.py`. It deliberately fails if no executable is configured; it is not silently skipped and is separate from the portable standard suite. Ordinary unit tests require no Jikko/ICM installation.

## Review carefully / still open

- This uses public ICM-style structure, not upstream runtime internals. The upstream repair PR requires owner merge/review and an approved pinned runtime before production adoption. No private upstream audit/source has been copied here.
- Wire the host adapter beneath real Gate dispatch with independent, revision-bound validator receipts, declared capability enforcement and process ownership. A callback returning True is only as trustworthy as its host implementation. This proof does not claim production execution evidence.
- Decide multi-session run ownership/leases and bounded run retention, structured failure history, cancellation during long validation and crash recovery between completion and evidence collection. Validation currently runs inside the SQLite write transaction; use short, side-effect-free validators in this proof. Do not use long-running external checkers there.
- Build the permanent Brain project, stable project-ID migration, authorized cross-project publication, durable promotion/versioning, configuration inheritance/freeze and keychain references. Existing curator scope is still canonical-path based. Production Laya calibration remains pending, not guessed.
- Jikko is the chosen editor foundation, but not yet a mandatory installed engine. Prove stable identity, rename/link preservation, attributed comments, host Trash/restore, migrations and all phase/verification boundaries before replacing the current editor. The engine's merge behavior is richer than a blanket stale-write rejection; current proof covers conflicting edits only.
- AI starter provider adapters, request cancellation/retry, safe response rendering and packaging are not implemented in this slice. Task340 remains open. Do not call a fake-provider scaffold a finished starter.
- Production frontend waits for Round16 design. Use design/briefs/round-16-designer-prompt.md, then implement against named boards with end-to-end user stories. This is a designer handoff, not an invented production screen.

The owner wants all these projects to strengthen WorkStation: Jikko as editor foundation, ICM for host/generated-project skills, and a permanent Brain holding AI configuration and reusable knowledge. Preserve those decisions; the above boundaries are the implementation sequence, not a proposal to abandon integration.

## Subsequent owner decision: unified native exports

Use Capacitor for Android/iOS and its Capawesome Electron integration for Windows/macOS/Linux. Plan253 records the canonical shared Python/HTMX source, Pyodide artifact, native desktop storage through an isolated bridge, signing/build-host constraints and tests. Task347 is the open implementation task; task281 now includes desktop conformance. The designer prompt includes export/storage states. No desktop adapter or dependency installation is claimed complete.

## Subsequent owner request: quality, Agentplay and Phonon-2

Plan348 and tasks349–351 record lint/clone checks, Agentplay (confirmed by the person) and a measured local Phonon-2 trial. Existing Activity/Gate traces are useful but bounded/truncated; Pi compatibility with Agentplay needs a parser/map proof. Preserve Whisper for Japanese and other languages: Phonon-2 is English-only. No new tools/models are installed and no personal logs imported by this planning change. The designer prompt includes any new diagnostics/replay/speech controls.

## Selected run evidence core (task 352, 2026-10-20)

`harness.run_evidence.normalize` is a pure, bounded internal API for explicitly scoped Gate/Pi RPC envelopes. It distinguishes preflight refusal, unknown execution, interrupted start, result without start, success/failure, and conflicting evidence. Exact duplicate records are counted once, calls correlate by opaque ID, and citations retain 1-based input positions. More than 200 calls are supported independently of Activity's display retention. Free-text arguments, paths, output, reasons and unknown tool labels are omitted entirely; source records stay private. This is metadata inspection, not a command replay or Brain rule source.

Limits for Claude to review: callers must supply trusted project/request scope, records and their private citation lookup. No file discovery, log reader, viewer, Agentplay schema adapter or user control is shipped. Timing and full arguments cannot be reconstructed. Gate audit success is retained as evidence but deliberately does not substitute for Pi execution receipts. Task 350 remains open; its complete user stories cannot be claimed from this core alone. Agentplay 0.2.1 download approval was requested separately; no automatic home-directory scan or download is part of this module. Tasks 349 and 351 still need approved tool/model inventories before real-tool validation.
