# 377: Adopt GG's useful ideas and compare against stock Pi

Status: implementation plan, not built or benchmarked. 2026-11-05.
Baseline inspected: WorkStation `31866da` (`origin/main`).
Owner request: make a plan based on GG Framework, then commit and push it to main.

## Outcome

Make a small local model complete more verified work with less unnecessary context. Keep Pi as the engine, Gate as
policy, Markdown as the project record, and the existing Discussion → Planning → Implementation controls. Measure
against upstream Pi itself, rather than inferring its performance from Oh My Pi or another derivative.

Adopt three ideas through our own implementation: a smaller effective prompt/tool set, a local library of tested
examples, and evidence that explains whether work is ready. Build measurement and a genuine stock-Pi baseline first.
This document authorizes no model downloads, GG installation, paid runs, new UI, or changes to the Constitution.
Implementation tasks remain open. The plan is the deliverable of task 377.

## Evidence and limits

Sources inspected on 2026-11-05:

- [GG root README](https://github.com/KenKaiii/gg-framework/blob/main/README.md): the author reports a November 4 race
  using seven tasks, five repetitions and a common hosted model. Its table lists Oh My Pi, not stock Pi. The figures
  are upstream claims, not results we reproduced. This plan does not assume GG is faster than stock Pi or WorkStation.
- [GG Coder README](https://github.com/KenKaiii/gg-framework/blob/main/packages/ggcoder/README.md): describes a small
  default tool set, deferred tool loading and a local code-example lookup tool named `steroids`.
- [GG license file](https://github.com/KenKaiii/gg-framework/blob/main/LICENSE): root documentation and package badges
  fetched during review disagree about AGPL versus MIT, and cached pages differ. Resolve the exact pinned revision
  and its notices before any code reuse. We will implement the ideas independently; no GG source is copied here.

Source-file fetching was incomplete; the upstream behavior above is documented behavior, not a source-level audit.
Before running GG, record a real release/commit, package integrity, license and supported CLI invocation. Do not
invent source pins or treat a cached `main` URL as an immutable benchmark version.

Current local evidence:

| Area | What exists | Extension point / overlap |
|---|---|---|
| Tool selection | `harness/tool-choice.mjs`, extension `setActiveTools` | Measure the resulting provider payload before changing selection. |
| Context | `harness/context.py` has a 16,000-character file budget; `harness/blocks.mjs` has a separate 14,000-character card budget | Separate budgets can overfill an 8K window once instructions, history and schemas are included. Character counts are not exact token counts. |
| Recovery | tasks 367–370, `harness/recovery-context.mjs` | Keep bounded retries, mutation guards and saved-history preservation. Prevent pressure before relying on recovery. |
| Execution facts | `harness/execution_context.py`, task 368 | Current phase, approved task and allowed files stay authoritative and outside lossy file trimming. |
| References | `kit/blocks`, `kit/vendor`, context selection | Start with already-present, tested stack examples rather than downloading a general code corpus. |
| Verification | Gate paperwork/test evidence, `kit/publish_audit.py`, `harness/quality.py` | Reuse execution evidence and existing check-in/publish paths. Do not introduce a model judge or a second verification store. |
| Bench | `bench/runner.py`, task 191 | `--bare` still starts the workbench and sets `PI_HARNESS_BARE`; it is not an upstream-Pi process without extensions. |

Coordinate with task 293 (durable task/decision context), task 357 (headless contracts and search), task 359's retrieval
research, rounds 18–19 context receipts, and plan 361's EGM review. This plan does not approve the parts of plan 361
marked RETHINK or add another goldfish reviewer. It also does not replace the existing ICM/Brain direction.

## Sequence and implementation contracts

### 1. Task 378 — observe the complete model input

Add a UI-independent context ledger at the last supported payload boundary. First prove with a captured synthetic
provider request that the hook sees the actual instructions and schemas sent by the installed Pi version. If it
cannot, label the receipt partial and instrument the provider adapter; do not call partial accounting a full budget.

Record category counts for engine instructions, authoritative execution facts, guides, App Blocks, tool schemas,
history, current request, selected files/references and attachments. Record configured serving window, output reserve,
measurement method, model/config fingerprint, selected tool IDs and recovery round. Reconcile against provider usage
when available; cached input is still context even when charged differently.

Use an already-available compatible tokenizer if there is one. Otherwise report an explicit estimate and uncertainty,
including non-text allowances; do not download a tokenizer or claim an exact token total. Component token estimates
need not add exactly to a tokenized whole. Keep both the whole measurement and attribution method clear.

The default ledger stores structural metrics, opaque IDs and counts, not prompts, file bodies, secrets or tool
arguments. Keep operational receipts local with an explicit retention policy aligned to their request. Public bench
exports use synthetic projects and privacy-checked metadata. Failure to write telemetry must not block an answer or
change phase/approval state. Follow the headless-library direction without requiring extraction of all of task 357.

Acceptance: controlled payload fixtures reconcile all categories; tool schemas count toward the input; cache/image
unknowns are visible; repeated recovery does not multiply AGENTS.md; telemetry failures do not fail chat; secrets
and request text are absent from ledger serialization. No new UI in this task.

### 2. Task 379 — add an actual upstream Pi benchmark adapter

Keep the current harness/Gate-only baseline, but label it accurately. Add a separate adapter launching the pinned
upstream Pi binary directly with fresh agent settings/home, no extensions, skills, MCPs or WorkStation instructions,
and no inherited discovery paths. A self-check records its executable/version, loaded extensions and configuration.
A canary fixture must fail the self-check if a WorkStation extension or prompt is accidentally loaded.

The common runner owns scratch files, provider endpoint, deadlines and hidden scoring outside every agent. Raw Pi
gets an independent outer execution boundary without Gate injected into its tool calls. GG gets the same outer
boundary. Exercise that boundary against file escape, inherited credentials and unwanted network access before any
real run. If equal isolation cannot be provided, stop and report the limitation rather than silently weakening it.
Stop only exact owned PIDs and descendants; leave the person's running harness/model service alone.

Neutral projects must not contain this repo's harness-specific AGENTS.md, skills or grading answers. Record starting
file hashes, common requirement packets and any necessary adapter-specific metadata as treatment differences.
Use installed Pi first; add a GG adapter only after named download/dependency approval and a supported invocation
have been verified. Never substitute Oh My Pi for stock Pi. Synthetic adapter tests must work without GG installed.

Acceptance: all adapters use the same outcome schema and independent hidden/regression checks; the stock adapter
proves it loaded no harness code; persistent malformed JSON, timeout and uncertain writes cannot score as success;
missing GG is reported as not run, never as a zero-cost win or a silently substituted agent.

### 3. Task 380 — enforce one budget and a smaller phase-aware tool set

Use task 378's ledger to allocate one effective input budget. Derive the serving limit from verified/configured runtime
facts, not merely the model's advertised maximum. Reserve output and protocol headroom, accounting for provider
reasoning/output behavior. Record uncertainty and use a conservative margin when exact tokenization is unavailable.
Do not silently resize or restart a model server; resource/concurrency changes remain a separate decision.

Protect the current request and authoritative phase/task/approval facts. Select optional file excerpts, examples,
guides and cards from the remaining allowance using stable rules. When required input cannot fit, return a bounded,
readable explanation or supported explicit narrowing action; do not repeatedly send an oversized prompt, silently
truncate the current request, or invent a summary/approval. Preserve live tool call/result pairs.

Generate terse instructions from the same rule sources the backend enforces. Remove duplicated explanations, not
backend checks. Code decides phase legality; the model must still be told what it can do and what the active task is.
Keep choices and plan submission directly available in their legal phases. Expose only appropriate optional tools;
any deferred lookup is an allowlisted registry operation, not a way to activate forbidden tools. Discovery must not
become a prerequisite for answering the person or submitting the plan. Measure discoverability with small models
before adding a generic `tool_search` interface. Gate continues to check all tools, including retained core shell tools.

Acceptance: 8K fixture includes instructions, schemas, cards and history within the measured allowance or explicitly
reports inability to fit; no permitted plan/answer path disappears; changing phase refreshes tools/facts; unsupported
activation is rejected; Japanese requests do not rely on English keyword matching alone; recovery and mutation guards
still pass. No automatic broadening of a tool's project scope.

### 4. Task 381 — retrieve tested local reference blocks

Build a small versioned catalogue from existing Python/HTMX blocks and vendored dependency examples. Each entry has
a stable ID, applicability/version constraints, source path/revision/fingerprint, test evidence and excerpt boundaries.
Use deterministic lexical metadata/file matches first, existing classifier interfaces only where appropriate, and
abstain when compatibility is unknown. Apply task 380's remaining budget; no unconditional catalogue dump.

Treat examples as untrusted reference data, never instructions or authorization. Their tests ran against a recorded
version, not necessarily the person's app; the current project must still pass its own tests. On missing, changed or
incompatible sources, omit the excerpt and explain the omission in a receipt. Existing registered-project permissions,
secret exclusions, ignored/private paths and project-vs-dashboard scope always apply. This catalogue does not grant
access to all projects. Reuse scoped-retrieval contracts from tasks 357/359 and the round19 decisions.

No new dependency, vector service, external corpus, automatic repository clone or web search. Any future external
source acquisition needs explicit approval, provenance, version and license checks. Brain stores outcomes using its
existing evidence rules; an example never becomes a verified fact because the model liked it.

Acceptance: compatible query returns bounded tested excerpts with fingerprints; incompatible/stale entries do not
enter context; secret/symlink/cross-project fixtures stay excluded; hostile example text cannot change phase or invoke
a tool; missing index falls back to normal work. Include a held-out task not represented by an exact catalogue answer.

### 5. Task 382 — make readiness evidence explicit

Extend the existing verification/check-in/publish pipeline, not a second autopilot. Normalize each configured check
as passed, failed, not run, stale, or not applicable with a code-determined reason, command/check identity, result and
source-tree fingerprint. Missing required checks/dependencies are blocked or not run, not not-applicable. New writes
invalidate affected evidence; an unchanged commit string alone is insufficient when the worktree is dirty.

Support existing tests, lint and publish checks first. Security/accessibility/offline/export checks appear only when
an actual supported checker exists and applies to the app. Do not present a generic health percentage or promise
production readiness from incomplete evidence. The model may produce a repair; System 1 decides whether checks pass
and whether the task is verified. Repairs obey phase, scope, normal approval and retry budgets.

Backend snapshots should reuse existing evidence storage and request IDs. Terminal/web adapters consume the same
facts. The designer must settle any additional receipt, Actions/Overview/check-in detail, missing/stale state or
repair control before new UI ships. Existing components may be reused only where their documented behavior fits.
Visible copy requires Japanese and focus/keyboard behavior. Backend and evidence tests can proceed before drawings.

Acceptance: failures cannot be averaged away; required checks missing or stale never yield verified; a seeded bug
fails independently of model claims; modification after a passing check makes it stale; CLI and web snapshots agree;
old check-in/publish and Run on its own journeys remain valid. No automatic stage/commit/phase advancement from prose.

### 6. Task 383 — run a fair pilot and decide defaults

Run only after adapters and deterministic fault tests pass. The planning request does not itself approve downloads,
API spend or a long model batch; confirm the named setup and run budget before execution. The person configures keys
outside the repo. Publish the preregistered matrix and failed/not-run records, not just a winning aggregate.

Primary matrix: six scenarios × five repetitions × three agents = **90 runs per model/context configuration**, if GG
is available and approved. A stock-Pi/WorkStation-only batch is 60, with GG marked pending. The legacy Gate-only mode
is an optional fourth arm (30 additional runs), never relabeled as raw Pi. Later ablations are separate run groups.

| Scenario | Independent success check |
|---|---|
| Small feature from a neutral approved brief | Hidden behavior tests plus original regressions |
| Repair a seeded bug | The seed is detected before work and the hidden fix/regression tests pass afterward |
| Repository question | Fixed rubric/reference answer; no model judging another model |
| Multi-file feature | Hidden integration contract and unchanged unrelated behavior |
| Long-history work at 8K | Correct final behavior, retained requirement, no fabricated approval or repeated write |
| Provider/parser interruption | Same injected logical fault; recovery or clear terminal failure, no duplicated mutation |

Report clean-task and pressure/fault buckets separately. Unsupported fault injection is a declared missing comparison,
not a pass. Use fresh task copies, fixed model/quantization/backend/window/effort/output limits, one active agent per
run, and a seeded balanced ordering of agents. Pin agent versions, prompts, schemas, fixtures, reference catalogue and
scorers. Warm-up and cold-start costs are separate; record cache/model load state. Do not compare runs that silently
use different serving windows or reasoning budgets. Unmatchable settings are disclosed as separate configurations.

Implementation-only track: same approved requirements and independent result checks, with deterministic approval
handling where the agent requires it; count that overhead explicitly. A separate end-to-end track measures discussion,
planning, approvals and implementation using a fixed scripted person. Do not mix those latencies or penalize stock Pi
for not producing WorkStation's paperwork. Built-in WorkStation verification is reported separately from common hidden
success. Hidden tests stay outside the workspace and feedback; agents cannot edit the scorer or solution.

Record resolved/first-attempt rate, original regressions, unsafe attempts and observed escapes, requests to the person,
retries/recoveries, tool calls, prompt/output/cache tokens, peak input, compactions, wall time, time to first token and
known resource measurements. Missing usage stays unknown. Local tokens/time are primary; dollars only when actually
known. Count SDK retries and all failed attempts. Report total time/tokens over the full batch per verified success;
show failures/timeouts alongside success-conditioned latency. Never rerun a failure away: a corrected rerun has a new ID.

Five repeats are a diagnostic pilot, not a statistically established ranking. Show per-scenario counts and dispersion;
avoid an unqualified speedup from a few successes. Freeze a held-out set before tuning prompts/examples. Enable an
optimization by default only after it improves input/time without reducing observed held-out verified completion,
and after all safety/approval checks pass. If no benefit appears, retain the simpler current implementation and record
that result. No predicted percentage gain is a result.

## Designer handoff before UI work

Missing designs to review against existing rounds 18–19:

1. Actual sent-context receipt: category totals, estimate/unknown labels, output reserve, omitted sources and recovery
   rounds; distinguish measured input from a preview of intended selection.
2. Reference evidence: compatible version, source fingerprint, tested-example provenance, stale/unavailable source.
3. Readiness details: required/not-run/stale/failed checks, evidence age/tree identity and safe access to existing repair
   actions; no aggregate health score that hides a failed required check.

Request desktop/1024/phone, dark/light, keyboard, screen-reader, Japanese, empty/loading/error, reconnect and cross-window
states for anything new. Record final board/component references in tasks 380–382 before frontend implementation.
No extra dashboard or recorder control is implied by this plan.

## Delivery and verification

Order: **378 → 379 → 380 → 381 → 382 → 383**. Task 382's evidence schema can be developed after 378 in parallel in a
future authorized work allocation; it still uses the same contracts. Do not spawn agents simply because this is a plan.
Each code task starts with failing unit/integration tests and allocates its `US-new` stories before changing behavior.
Keep browser acceptance for visible changes and real-Pi journey coverage; scripted-provider success is not a live-model
benchmark. Preserve the required workflow-before-commit chain and only stage the task's own files.

Roll out new prompt/tool/retrieval policy behind an explicit experiment selection until the pilot passes. Version that
selection in receipts/results so old defaults and new behavior remain comparable. Failed experiments can be disabled
without changing the person's project, installed model configuration, approvals or durable chat history.

No implementation, benchmark results, new download permission or UI approval is claimed by committing this plan.
