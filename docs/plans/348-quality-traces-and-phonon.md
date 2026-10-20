# Plan348: Code quality, Agentplay run analysis and a Phonon-2 trial

Owner request, 2026-10-20: plan linting and duplication checks, inspect runs with **Agentplay** (name confirmed by the person), and try Phonon-2 instead of Whisper. Planning only: no dependency/model download, installation, personal-log import or speech-backend switch is performed by this change.

## 1. Quality checks for WorkStation and generated projects (task349)

Current evidence: Gate's `gate/ledger.py syntax_problem` checks Python/JS/JSON parsing after edits. `harness/audit.py` supplies publication checks; `kit/toolchain.json` pins Vulture for unused Python code and Pyright for typing, with TypeScript/JSDoc checks for the static starter. The workflow also checks scenarios, control coverage and flaky tests. This is useful coverage, but not a general code-quality/duplication pipeline. Vulture is not a duplicate-code detector.

Recommended implementation:

- **Ruff** for Python correctness and selected bug-prone patterns. Start with a small reviewed rule set; no wholesale reformat or automatic fixes during checks.
- **ESLint** for first-party JS/MJS/CJS, using explicit browser/Node environments and a focused correctness rule set. Keep existing type checks and meaningful tests.
- **jscpd** for cross-file copy/paste candidates across Python, JS and templates. Compare with Pylint's Python-only duplicate-code rule if it materially reduces toolchain cost; avoid two overlapping clone detectors by default. Duplication is a refactoring signal, not proof that two behaviors should be coupled.

Inventory before rollout: first-party host source, generated-project starter code and maintained adapters. Exclude vendor, generated bundles, caches, lockfiles, designer canvas exports and intentional fixture copies with explicit reviewed reasons. Shipped copies of a maintained upstream block should be checked at their canonical source rather than reported as accidental project clones. Do not hide first-party issues behind broad exclusions.

Run a read-only baseline and record existing findings. Gate new correctness regressions; introduce stricter rules incrementally. Report clone candidates initially, then set measured thresholds and narrow, justified exceptions. Distinguish scanner failure/missing tools from a clean result. Pin approved versions and dependencies, install only in the harness toolchain, run offline thereafter. A failed check explains rule/file/line and remediation; Pi may fix within the project's approved phase/scope, then rerun checks. It cannot disable a rule or widen a baseline to certify its own work.

Add the checks to WorkStation's workflow, starter test protocol and publication audit through one reusable runner/configuration. Generated apps receive editable configs and reproducible commands; existing projects are not silently rewritten. New result/editor controls require designer boards; existing diagnostics can be reused where specified.

Tests: seeded syntax-valid bugs, unused code and real duplicate blocks are found; clean and deliberately independent code passes; JS environment mistakes are caught; excluded vendor code stays excluded; a first-party clone remains visible; missing tool/offline dependency, scanner crash, exit status and path-with-spaces handling are honest; no scanner executes project code or modifies sources. Verify controlled fixes clear findings without silently changing the baseline. End-to-end: a new app inherits the checks, a bad change is refused/reported, and its scoped fix passes.

Sources reviewed: [Ruff](https://docs.astral.sh/ruff/), [ESLint](https://eslint.org/docs/latest/use/), [jscpd](https://github.com/kucherenko/jscpd), [Pylint duplicate-code](https://pylint.readthedocs.io/en/latest/user_guide/messages/refactor/duplicate-code.html). Exact versions/rules/thresholds remain implementation choices to validate, not unmeasured promises.

## 2. Agentplay and an accurate tool-run audit (task350)

**uvx is a tool runner**, equivalent to `uv tool run`, not the analyzer itself. The person identified **Agentplay**, whose documented viewer replays supported agent histories as timelines/maps with failures and tool activity. Its supported-agent list currently does not list Pi; investigate a Pi parser or its session-map interchange rather than assuming `uvx agentplay` directly understands WorkStation. Pin and review source/dependencies/licence before any approved installation. Use `AGENTPLAY_NO_NETWORK=1` and explicitly selected scratch inputs, not its default home-folder discovery.

### What is already built in

- `harness/work_queue.py`: records tool start/end state for Activity, with call ID and name. Summary detail is capped at 300 characters; only the latest 200 tool rows remain in a job.
- `gate/ledger.py`: persists `gate-events.jsonl`, correlating proposals, tool-call IDs, request/project scope, preflight outcomes and post-execution audits. The live event deque is bounded to 200; the append-only file is separate. Stored arguments are allowlisted and truncated to 500 characters.
- `harness/web_chat.py with_checks`: joins Activity tools with Gate events and request test runs. Pi session JSONL is another possible source, to inspect through fixture schemas rather than personal logs.
- `gate/test_runs.py`: retains runner exit/status information and bounded output. The decision log and Brain evidence have different purposes; neither replaces the execution trace.

These records support existing inspection, but do not establish that every historical argument, output, start/end timestamp or subprocess is present. Never reconstruct missing details from a model's story or claim a blocked proposal executed.

### Planned vertical slice

1. Inventory the actual Pi transcript/event formats with synthetic runs. Define a versioned, read-only normalized trace: request/project/session IDs, parent/call IDs, source references, tool name, safe arguments, proposed/blocked/started/completed/failed/interrupted/unknown states, measured timing when available, and test/Gate links. Missing fields remain explicitly unknown. Capture structured source evidence prospectively where necessary; do not infer unobserved child processes inside a shell command.
2. Produce a local JSON and human-readable report answering what was requested, allowed, actually started, completed or failed; what files/resources were touched when recorded; repeated calls/retries; recorded arguments/results; and missing/truncated data. Preserve stable provenance and clock limitations. Existing long historical commands remain marked truncated.
3. Feed a selected redacted fixture trace into a pinned Agentplay Pi parser/session-map adapter. Reuse the viewer where compatible. Validate its schema and compare counts/order/status against a known expected trace. Record any fields lost in translation. Do not install a second tool hook or change Gate authority just to visualize logs.
4. Keep original logs unchanged. Export only explicitly selected project/request data, redact credentials and sensitive arguments/results, limit volume and reject malicious/oversized payloads. A redacted map is not automatically safe to publish. No remote resources, uploads or automatic scans of ~/.codex, ~/.claude or other projects. Replay never executes a recorded command. Brain ingestion keeps its existing scoped evidence/approval boundary.
5. Designer first for embedded timelines, filters, evidence details, privacy/export and incomplete-trace states. A read-only command/report proof can precede that frontend work. An unavailable viewer/parser never blocks chat or ordinary project work.

Tests: exact known tool counts/IDs and ordering; blocked calls never counted as executed; duplicate events, retried calls, overlapping tools, missing results, crash/restart and clock skew; more than 200 calls and long arguments; malformed/partial JSONL; all tool classes, web and terminal sessions; cross-project isolation and redaction; trace inspection without subprocess execution/network. UI stories follow approved designs. “Exactly what ran” is limited to recorded evidence, with coverage gaps displayed.

Sources reviewed: [uv tools](https://docs.astral.sh/uv/guides/tools/), [Agentplay supported agents, privacy and session-map format](https://github.com/Entelligence-AI/agentplay). Upstream documents local replay and a no-network switch; verify those claims for the pinned revision before using private data.

## 3. Trial Phonon-2 for local speech recognition (task351)

Current implementation: `harness/transcribe.py` lazily invokes mlx-whisper with `mlx-community/whisper-base-mlx`, via a Python3.12 script environment. Web dictation/audio attachments (`harness/web_chat.py`) and terminal attachments (`harness/extension.mjs`) consume the same JSON text contract, with a 180-second caller timeout. The existing clean-output regression must survive a backend change.

Phonon-2 is an **English-only** model. The publisher describes local MLX, CPU and Core ML routes; its reported accuracy/speed and roughly164MB model download are vendor measurements, not results on this Mac. Core ML has a distinct model/runtime path and requirements; do not combine its advertised performance with an MLX installation. The publisher lists CC-BY-4.0 weights, requiring attribution. Verify the selected runtime's separate licence, dependencies and actual artifact sizes/checksums.

Plan a local Apple-silicon trial, first evaluating the existing Python3.12/MLX toolchain fit, then Core ML only if it has a measured benefit. No automatic PyPI/Hugging Face download: present a concrete pinned runtime/model/dependency inventory for approval. Keep user audio local. Test with synthetic or explicitly supplied evaluation clips, never silently harvest microphone/project recordings.

Add a provider-neutral transcription boundary while preserving `{'text': ...}` behavior, lazy loading, bounded input/process lifetime and useful errors. Run Whisper and Phonon on the same approved English corpus: quiet/noisy speech, engineering vocabulary, accents, short dictation, long pauses, silence and several input formats. Record WER/CER with known references, first/cached load, end-to-end latency, memory and failure rate. Do not apply another machine's realtime figures to this host.

Try Phonon as the English candidate; do not globally replace multilingual Whisper with an English-only model. Keep Whisper available for Japanese/other unsupported languages and rollback. Define explicit language/backend selection before default rollout; do not use an English-only model's guess to decide whether Japanese audio is English. Switching/fallback may use only already-approved, installed backends, must not silently download or resend audio online, and must not submit a transcript twice. A trial report precedes changing the production default.

Tests: fake-provider unit/contract coverage for both entry points; provider unavailable, invalid file, unsupported language/format, silence/no speech, timeout/cancel, bounded output and malformed/chattering stdout; EN/JA text preserved; missing model never triggers a download. E2E: browser recording/attachment yields editable text once, cancel/retry leaves the next request usable, terminal attachment uses the selected backend, and fallback keeps the error understandable without duplication. Real offline smoke tests on approved clips remain a separate required result before shipping. Any new provider/language/install controls need design first.

Sources reviewed: [Phonon-2 model](https://www.fermionresearch.com/models/phonon-2/), [release/runtime options](https://www.fermionresearch.com/research/phonon-2/), [speech API/CLI](https://www.fermionresearch.com/docs/speech/). No download, benchmark or replacement has occurred.

## Sequence and completion

Task349: baseline/tool selection and first quality-check slice. Task350: existing-trace inventory and scratch Agentplay proof. Task351: pinned dependency inventory, approved downloads and measured English trial, preserving multilingual support. Each implementation task starts with failing tests and ends with scoped verification; changing documentation or selecting a tool does not complete those tasks. Plan UI additions through the designer, then integrate only the returned boards.
