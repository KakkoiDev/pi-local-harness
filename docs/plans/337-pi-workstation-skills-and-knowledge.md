# Pi WorkStation: skills, knowledge and an AI app starter

Owner request, 2026-10-20: rename the product Pi WorkStation; use ICM skills to manage skills; explore a second brain from RinDig's work; add an AI-powered app starter (clarified by the owner).

## Rename

The product's exact spelling is **Pi WorkStation**. Update current product copy, browser and terminal surfaces, guides and EN/JA translations. Keep runtime paths, commands, registry IDs, saved author identities and URLs compatible. Changing a label must not reset chats or make old request commits impossible to undo. This is not authorization to rename GitHub repositories or move personal folders. Historical task/design text remains historical; the design system's separate name is still Pi Workbench 1-bit pending a distinct request. Only the person edits CONSTITUTION.md.

## What was reviewed

[KakkoiDev/icm-runtime](https://github.com/KakkoiDev/icm-runtime), README reviewed 2026-10-20: staged skills, frozen contracts, per-run artifacts, gate checks, audit, token telemetry and seals. It documents Pi hooks and an offline demo. A seal detects changes; it does not prove an output is correct. The initial web reader could not retrieve deeper pages; a later authorized GitHub connector review covered runtime, architecture, host hooks, installer and test sources. Three isolated verifier/encoding probes were run. Full runtime compatibility has not been established. No clone, installer or hook was run. Implementation findings remain in the private audit copy because the connected API currently marks this repository private.

[RinDig/icm-architect](https://github.com/RinDig/icm-architect) and its [forms](https://github.com/RinDig/icm-architect/blob/main/references/forms.md) and [core](https://github.com/RinDig/icm-architect/blob/main/references/core.md): small routing files, stage-specific context, editable intermediate artifacts, and a knowledge-bundle form with layered notes, source evidence and access tiers. Its walk test asks whether an agent without prior memory can orient and act from the files. This is a structural approach, not evidence that a ready-made second-brain service should be installed.

## Proposed ICM adapter

Use ICM for reusable skill workflows, beneath existing System 1 authority. One project phase remains authoritative; an ICM stage may narrow permissions but cannot expand them. No second process advances phase or accepts a task. The model produces skill content and outputs; code validates them.

Separate skill definitions from executions. Store immutable source/version/hash metadata and declared capabilities for a skill; snapshot the approved definition at run start. Keep per-project run evidence isolated. Discover, inspect, enable/disable, update, roll back and move to Trash through one adapter. Do not auto-install upstream hooks globally, execute checks while merely inspecting a skill, or let a skill approve itself. Downloads and new dependencies still need the owner's explicit approval.

First integration experiment: a dependency-free local fixture with two stages and a deterministic precondition. Prove refusal before evidence, allowance after evidence, refusal after contract tampering, cross-project isolation, restart/resume and recovery after malformed evidence. Verify evidence quality independently of stage-done and seals. Record actual token usage only when available; unavailable is not zero.

Designer brief needed before new skill management controls: source/version/capabilities, scope, enable/disable, update diff, active run progress, blocked reason, evidence, cancellation and rollback, including phone and EN/JA.

## Proposed second-brain experiment

Begin with a project-owned knowledge bundle: requirements, decisions, verified lessons and source links in plain Markdown. Keep generated interpretation distinguishable from source facts. Each note needs provenance, last verification, scope and sensitivity. Retrieval returns a small index, then selected notes, then evidence on demand; set a hard context budget. A deterministic index and ordinary keyword lookup are the first baseline; embeddings are optional future work with their own download approval and measured benefit.

Default to project scope. A separately approved shared library may hold reusable engineering lessons; never copy chats, credentials or personal project material into it automatically. Notes are untrusted context, never instructions granting tool permissions. A note cannot change phase, declare a task verified, override Gate or change the Constitution. Corrections, conflicting/stale notes, unlinking a source and moving to Trash must be supported.

Evaluate on scratch projects: retrieve an earlier decision after restart, avoid another project's private note, cite the correct source, respect context budget, and reject an injected instruction. Compare recall and incorrect retrieval against the current context selection before adopting this as a default. Personal knowledge management across the person's whole filesystem remains out of scope until they choose it.

## AI-powered app starter

This is an app with AI features, not another development workflow template. Keep the owner's Python + HTMX stack and add a replaceable model adapter. Propose local Ollama as the first adapter, a deterministic offline fake for tests, and an optional explicitly configured online provider. Store credentials outside the repository and never expose them in browser code. Missing local models produce useful setup guidance without automatic downloads.

The smallest demo: submit text, stream or display a response, cancel work, retry a failed request, and inspect the request's status. Treat model text as untrusted and render it safely. Put timeouts, bounded output/context, transport failures, unavailable-model handling and cancellation in shared code; provide unit, integration and browser stories. Tests need no live model or paid account. No arbitrary generated tool execution in the starter.

Keep app code separate from packaging adapters. Full-stack packaging is the first proposed target. A browser-only Python/WASM app cannot safely bundle a provider secret; remote AI needs a separately configured authenticated gateway or supported local inference. Mobile and front-only targets need explicit capability checks; do not promise every model adapter works in every export. This extends the existing one-stack/packaging plans instead of creating a competing stack.

Designer brief: AI starter selection, local/online data explanation, missing model state, response/cancel/retry/failure states, phone, keyboard and Japanese. Provider choice and the exact demo UI remain proposals until planning/design are settled.

## Delivery order and acceptance

Finish the recorder checkpoint without claiming the Preview adapter is shipped. Implement the product rename with a Red branding journey and compatibility checks. Inspect the exact ICM revision before adopting its runtime. Design skill controls and AI starter screens, then add each vertical slice with failing unit/integration/E2E tests. Run the second-brain experiment separately; exploration is not an implicit promise to import personal data. Existing critical chat and Round 15 work remains open and must stay in the handback.

## Further owner request: ICM audit and Jikko

2026-10-20: audit icm-runtime and think deeply about skills, knowledge and AI-app integration; inspect https://github.com/KakkoiDev/jikko. The current connected API reports ICM private, so implementation-level audit findings remain in a private local review artifact rather than this public repository. Jikko's local source was inspected read-only at c280ec1ea4da4315489f7e65088f55d3787baf1f. No upstream suite, installer or model was run.

Proposed boundary: WorkStation owns decisions/evidence; ICM owns workflow mechanics; a Markdown/Jikko adapter owns durable semantic records; the brain is a bounded cited knowledge view; the AI starter consumes a provider-neutral interface. Start with read-only interoperability rather than immediate task migration. Avoid duplicate task/approval/commit writers. Jikko's Go runtime is an explicit choice to evaluate against the Python preference, not a new assumed dependency.


## Scratch proof before adoption

Use one two-stage skill: collect a cited requirement, then generate and test one pure function. Define the immutable skill revision, request/task/run/stage/attempt IDs and input digest before execution. WorkStation owns the validator receipt and stage transition; an ICM completion marker alone never verifies a task. A skill that manages another skill needs the same review, approved scope and execution limits as any other mutation; it cannot approve its own update or trust a downloaded checker automatically.

Compare three Jikko options explicitly: read-only compatible views (recommended first, no second writer), optional semantic CLI backend (one mutation writer and a saved-versus-committed receipt), and workspace ownership (requires migration and a deliberate Go dependency choice). Prove stale-write refusal and stable task identity before choosing the latter options.

Knowledge experiment: record a requirement and decision, restart the agent, and ask a related implementation question. Compare existing context selection with a deterministic cited index. Include conflicting/stale evidence, a malicious instruction embedded in a note, and a different project's private note. Require correct citations, no scope leakage and a bounded context budget before considering semantic retrieval. No personal corpus is needed for this proof.

The independent AI starter consumes the model port, not the whole WorkStation runtime. Offline fake-provider journeys cover response, cancellation, retry, unavailable model, unsafe generated markup and bounded output. Full-stack, browser-WASM and mobile packaging declare their provider/storage capabilities separately. Shared app source does not imply identical runtime capabilities.


## Skills are not app blocks or knowledge

Keep three contracts distinct. A skill is a reusable development procedure; an app block is tested runtime code delivered in a generated app; knowledge explains a requirement or choice. An authentication block supplies account/session behavior, a skill adapts it within approved scope, and a note records why this project chose it. Skill-management skills can draft updates but cannot approve themselves or install unchecked executable validators.

Blocks should declare version, dependencies, schema/migrations, configuration, packaging capabilities, limitations, license and their own test protocol. Project Start composes compatible blocks; deterministic checks catch conflicts before delivery. Pin delivered versions and preserve user edits during later updates. Prove one AI vertical slice with an existing block before expanding the catalogue. This prioritizes making local agents build useful apps reliably before throughput or app scale.


## Owner decisions: WorkStation is the product that brings these together

Confirmed 2026-10-20: WorkStation evolves by integrating the best of these projects. **Jikko is the basis for the harness editor**, **ICM is the format and workflow for all skills**, both WorkStation's and generated projects', and **the second brain is a permanent WorkStation workspace** for the person's AI configuration and knowledge. These are product decisions, replacing the earlier exploration of whether to adopt them. Incremental adapters are an implementation sequence, not a substitute for the chosen direction.

### Jikko-based editor

Adopt Jikko's document identity, revision-aware edits, links/embeds, comments and attributed semantic operations as the editor foundation. Keep one canonical file and one mutation writer. Existing ROADMAP/task verification remains WorkStation System 1's responsibility; editor semantics do not authorize completion. First prove round-trip compatibility, stale-write conflict handling, rename/link preservation, undo/Trash, and saved-but-uncommitted recovery on scratch copies. Then replace editor operations in slices without migrating or modifying the person's projects during development. Decide the Go-engine boundary versus a Python-compatible interface explicitly; the owner chose the editor foundation, not an unreviewed new mandatory runtime.

### ICM skills everywhere

Use versioned ICM contracts for WorkStation procedures and the skills shipped with user projects. Keep built-in, user-library and project-local skills distinct in ownership and scope while sharing one contract format. A skill may produce another skill, but validation, trust, approval and rollout remain outside that skill. Freeze approved versions for active runs; upgrades cannot rewrite in-flight contracts. Generated projects should retain editable skill definitions and offline tests without requiring the whole WorkStation runtime to run their app. Validate composition between development skills and runtime app blocks separately.

### Permanent second-brain workspace

The brain is part of WorkStation, not an optional external memory service. It provides a durable, locally private workspace for AI configuration, reusable skills, verified lessons, decisions and source evidence. Project-local knowledge still keeps its scope; a central index may refer to it without copying private contents into every request. Configuration inheritance is explicit: person defaults, then project overrides. Store provider/keychain references rather than credentials in Markdown or Git. The brain itself is never automatically published or pushed with a generated app.

Self-improvement has a traceable loop: experiments create recorded results; System 1 collects safe structured evidence; the model may draft a lesson or skill improvement; ordinary scope/approval and deterministic checks govern promotion; the prior revision remains recoverable. Unverified model summaries cannot become rules. Automatically learned facts must be limited to an approved structured schema; free-form chats, customer details and secrets are not silently harvested. Fixing or deleting a source invalidates derived entries. A broken knowledge index must not block chat or ordinary project development.

The designer needs to cover the brain workspace's navigation, AI configuration inheritance, source/scope inspection, proposed changes, history/restore and unavailable/index-rebuilding states. New UI still waits for design. The first proof should show an experiment in project A producing a verified reusable lesson, a fresh session in project B retrieving only the authorized general lesson with citation, and correcting/reverting it without losing either project's work.


### Brain authority and project phases

Keep approved AI configuration separate from retrieved knowledge even when both live in the brain workspace. System 1 recognizes explicit configuration records and versions; prose in a note cannot become a system instruction, provider setting or permission grant. Configuration changes freeze for an in-flight request and take effect at a defined request boundary.

The brain is a project, so its durable text/skill edits obey its own phase and approved scope. Experiments elsewhere may append safe structured operational evidence or queue a proposed lesson; they do not authorize an agent in project A to edit the brain's files while its phase is Discussion. Promotion runs as an ordinary approved brain task, with evidence and history. A failed or waiting promotion never blocks the original project's chat. This preserves the Constitution while supporting continued learning.

## Owner proposal: System 1 curates learning from project logs

20 October 2026: the owner asks for System 1 to decide what is worth saving and how to categorize it. Build a bounded automatic curator rather than asking System 2 to judge its own experiences.

1. Code reads an allowlisted event schema, not entire raw conversations: request/task IDs, tool/error codes, test outcomes, verified change receipts, explicit person choices and source revisions. Filter secrets and scope before classification; unrestricted text/arguments are not normal learning input.
2. Deterministic rules select candidates: repeated failure signatures, a failed-then-passing regression tied to a fix, a verified reusable procedure, explicit preference changes and dependencies invalidating an existing lesson. A single failure is an observation, not a proven cause or fix. Deduplicate by evidence identity/signature and retain recurrence without repeated notes.
3. Laya classifies unresolved typed questions using a versioned taxonomy: environment/toolchain, workflow recovery, testing, app-block usage, skill improvement, explicit preference or project knowledge. Code settles any category it already knows. Calibrated confidence thresholds decide automatic labels; abstentions remain candidates without silently guessing a category. Do not hard-code arbitrary confidence numbers before evaluating labeled examples.
4. Save safe structured observations automatically in the private operational knowledge store with source, project/scope, evidence IDs, status, classifier/rule version, confidence and an expiry/revalidation condition. Keep observed, verified, stale, contradicted and rejected distinct. Retrieval explains why an entry was selected and can point to its evidence.
5. System 2 may draft a readable note or skill improvement from selected evidence. It cannot choose what is true, promote its own claim, infer a person's preference from casual chat, change AI configuration or grant permission. Durable brain-document/skill changes follow the brain project's ordinary phase and scope; the automatic evidence store is operational data, not a bypass for project-file writes.
6. Sharing across projects follows a fixed scope/sensitivity policy. Project-specific knowledge stays private by default; approved generic structured recipes may be shared. Never infer permission to share customer details from a classifier score. Corrections, source deletion and new conflicting evidence invalidate derived retrieval entries; keep recoverable history/Trash.

Measure this curator before enabling it as a default: precision of saved lessons, category accuracy, duplicate rate, missed useful fixes, incorrect generalization, private-data leakage, stale-note retrieval, context cost and abstention rate. Use curated scratch logs plus adversarial secret/instruction payloads. Test that a failed test alone never becomes a saved fix, repeated identical events deduplicate, a verified regression links the correct revision, source invalidation makes a lesson stale, and a classifier outage leaves ordinary chat/development usable. Compare code-only selection against code-plus-Laya; add complexity only when measured usefulness improves.
