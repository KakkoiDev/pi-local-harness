# Pi Durable: case study for Pi WorkStation

20 October 2026. Research and architecture review, not an installed or benchmarked integration. Local baseline: `c8c905a`, plus the dashboard planning documents. Upstream links below target moving `main` unless marked otherwise; a trial must freeze a release, commit and dependency lock.

## Recommendation

**Keep our runtime and extract the useful ideas.** The owner clarified that a small gain does not justify adopting another runtime. No material incremental benefit has been demonstrated by this desk study; that is uncertainty, not a measured claim that Pi Durable has little value. Retain Python/HTMX, Gate, Laya, explicit phase controls, Markdown tasks and the existing user interface. Prioritize targeted fixes using the implementation already in WorkStation.

The immediate question is reliability: can a person answer a card, close a window, restart the service and continue without losing work or causing duplicate effects? This matters before speed or scaling. A wholesale rewrite would put our recently repaired conversation paths at risk before proving any improvement.

## What the upstream project offers

Earendil's 1 October article introduces an experimental application framework separate from the terminal coding agent. It describes checkpointed execution, conversation concurrency, explicit tool replay policy, ownership-based cancellation, compaction, typed application documents and clients that reconnect to saved state. Its submission `requestId` deduplicates retried inputs; that is not a promise of exactly-once external effects. The article's model-based triage example is a demonstration, not a policy suitable for our Constitution. [Article](https://earendil.com/posts/pi-durable/)

The current README still warns of API changes. It describes committed snapshots/updates, a live task graph and SQLite/JSONL backends. SQLite defaults to WAL with `synchronous=NORMAL`: process-crash durability is not a guarantee against losing the newest commits on power loss. JSONL retains history in memory; do not infer that all backends have bounded memory. Cancellation of a wait differs from aborting work. [Runtime README](https://github.com/earendil-works/pi/blob/main/packages/durable/README.md)

The specification makes transcript entries, task records and document changes atomic, with external effects outside the transaction. Ownership is attribution/cancellation, not authorization. These are useful invariants to test rather than marketing assurances to inherit. [Normative specification](https://github.com/earendil-works/pi/blob/main/packages/durable/docs/spec.md)

The inspected package manifest reports version 1.3.0, MIT, Node >=22.19.0 and dependencies on Chord, pi-ai, pi-codemode, pi-telemetry, Photon, diff and TypeBox. This is repository metadata, not verification of a published installation or compatible local Node. Obtain the exact dependency inventory, licences, sizes and download approval before a trial. [Package manifest](https://github.com/earendil-works/pi/blob/main/packages/durable/package.json)

## Our current baseline and the gap

These are local code observations, not a complete audit or an assertion that a failure was reproduced:

| WorkStation today | Limitation or question | Potential value to test |
|---|---|---|
| `harness/work_queue.py` persists Activity records; startup marks previously running requests interrupted. Its worker ownership and reaper prevent a dead thread from occupying a lane. | Recovery is at the request boundary; this code is not a durable checkpoint of every tool effect. | Resume safe unfinished work without losing queued inputs or repeating completed effects. |
| `harness/web_chat.py` saves conversations via a temporary file/replace and uses Pi RPC with a saved session. | Conversation, queue, Gate paperwork and files span distinct persistence boundaries. Atomic replacement of one file is not one transaction across those stores. | Commit card resolution, associated submission and visible state consistently. |
| `WebChat.answer_choice` validates question ID, settles old cards, locks in-process and returns a previous answer on repeated clicks. | A queue record is created before the updated conversation is saved. A crash between those writes deserves fault injection; a Python lock does not make cross-file writes crash-atomic. | Prevent an answer from being queued while its card still appears unanswered after restart. |
| `harness/skill_runs.py` freezes contracts and checks host authorization/independent validators in a scoped proof. | It is not wired as the complete production dispatcher. | Give skill stages durable execution and ownership without delegating verification to a skill or model. |
| `harness/run_evidence.py` distinguishes refusal, started execution, actual results and conflicting evidence. | Normalized metadata intentionally lacks timing/full arguments and does not implement replay. | Emit trusted receipts from one runtime and project them into Actions/dashboard views. |

Keep the existing strengths: explicit controls, request identity, stale-card rejection, phase enforcement, recorded tests, recoverable project data and realistic browser journeys. Pi Durable would not replace those product policies.

## Lessons we should apply

1. **Persist intent before effect, and persist the receipt.** A write may have completed even if its result was not saved. Treat that interval as uncertain. Do not infer failure and retry blindly. Submission deduplication and external-effect idempotency are separate requirements.
2. **One authoritative transition for an answer.** Bind the question revision, selected answer, resulting submission and settlement record. Use an atomic store or a recoverable journal/outbox, with repeated delivery safe. This directly targets the blocked-conversation incidents the owner experienced.
3. **Build overview screens from saved lifecycle state.** Dashboard354 should project project/request/task/run relationships and unresolved attention. Actions350 provides evidence detail. Neither screen should reconstruct truth from model text or clear an incident just because it was viewed.
4. **Separate ownership from permission.** A child agent needs its own authorized capabilities, phase check, project/worktree and validator receipts. Owning a child must not grant permission to write in its project.
5. **Make cancellation deliberate.** Define what Stop cancels, how owned processes end, and which deliberately backgrounded work survives. The UI must not show idle while undisclosed work continues. Starting with foreground-only work would reduce ambiguity.
6. **Pin behavior during a verified run.** Our approved skill/version/validator binding must survive restart. A changed implementation needs explicit migration or refusal; it cannot silently resume under a new contract.
7. **Keep summaries outside authority.** Compaction and generated Brain notes may help generation. Approval, task completion, capabilities and test receipts must remain independently readable System 1 records.

These are WorkStation design proposals inferred from the comparison. They are not features claimed to ship today.

## Boundaries to preserve in any implementation

- **Gate cannot be optional.** Every effect, including tools called by other tools, child agents, hooks and application tasks, must pass host authorization. Extension selection/replacement must not remove that boundary. An adapter alone is not a sandbox.
- **Recheck on execution and recovery.** Bind authorization to project ID, request, phase, approved plan revision, tool arguments and code/skill fingerprint. A previously granted answer must not authorize a different call or survive a relevant scope change automatically.
- **Do not copy upstream planning policy.** The upstream plan example stores model-produced steps and switches available tools; our harness owns task layout, tests, completion and phase authority. [Plan-mode example](https://github.com/earendil-works/pi/blob/main/packages/durable/test/examples/27-plan-mode.ts)
- **Hot reload needs a stricter local contract.** The upstream restart/reload example is relevant to inspect, but our frozen skills and approvals require revision checks and explicit migration before using changed code. [Reload example](https://github.com/earendil-works/pi/blob/main/packages/durable/test/examples/31-reload-and-restart.ts)
- **No conflicting stores of truth.** Decide which runtime owns submission/card/run state. Markdown roadmaps and task files remain editable project artifacts; reconcile changes by revision instead of allowing SQLite and Markdown to silently disagree. Do not replace the Jikko editor foundation with Chord merely because the runtime uses it internally.
- **Protect the Brain.** A conversation fork is not permission to inherit another project's private history. Publish reusable knowledge only through the approved Brain boundaries; retention and secret filtering apply to all durable stores and telemetry.
- **One service owner.** Verify process/storage locks, clean close, restart and second-launch behavior. The existing port-in-use error must remain understandable; adding a Node worker must not introduce a second scheduler or orphan processes.
- **UI stays stable.** Keep Python HTTP and HTMX/plain JS interfaces; an optional local Node worker could expose a versioned protocol. Generated apps retain Python/HTMX and Capacitor export plans. An internal TypeScript runtime does not require changing their stack.

## Options and decision

| Option | Benefit | Cost/risk | Recommendation |
|---|---|---|---|
| Keep runtime; adopt selected durability invariants | Smallest migration; directly improves answer/recovery paths | We maintain journal, reconciliation and recovery machinery | Start with these requirements and targeted fault tests. |
| Optional Pi Durable worker behind an adapter | Tests whether upstream can own execution/recovery and future agent task trees | New runtime/dependencies, policy bridge and migration work | Defer; reconsider only after a concrete gap and material benefit are demonstrated. |
| Replace WorkStation orchestration now | Could consolidate runtime responsibilities eventually | Highest regression exposure; uncertain policy parity and API stability | Defer until trial evidence demonstrates superiority. |

## Reuse-first implementation and acceptance gate

Owner direction: extract the good ideas; do not start a dependency or migration trial now. First add fault-injection tests against our existing runtime, then implement the smallest required repair. Use synthetic projects, fake model responses and isolated stores. Do not import the owner's chats. No new UI is required for these backend improvements.

Define a small host contract using the existing runtime: submit with a stable idempotency key, inspect a saved snapshot, follow revisions, answer a particular question revision, cancel an owned run and recover after restart. The WorkStation host retains policy and produces test/commit receipts. Use the scenarios below to establish the baseline and prove each local improvement. A future alternative runtime would have to pass the same contract before any comparison.

| Fault or story | Required evidence |
|---|---|
| Duplicate submit after timeout/restart | One accepted submission and one intended task; original response identity returned. |
| Crash around choice resolution | Exactly one follow-up, consistent card settlement; answering a replaced question is refused; another project continues. |
| Crash before effect / after effect before receipt / after receipt | Read-only work may safely rerun; ambiguous write, commit or deployment is reconciled or marked interrupted, never repeated without proof. |
| Phase or skill changes while paused | Recovered write is refused under invalid scope; old approval cannot be reused for new code/arguments. |
| Nested tool/child attempts a forbidden write | Host Gate blocks it and records refusal independently of model output. |
| Two clients disconnect/reconnect | Same committed snapshot and monotonic revisions; no duplicated messages or approval; secret payloads absent from exported metadata. |
| Stop with owned child/process | Exact owned work settles; unrelated project remains active; background behavior is explicit. |
| Missing definition, storage failure or incompatible revision | Clear recoverable state; no false completion; process error cannot leave all chats locked. |
| Second service opens same store | One owner or clear refusal; no competing scheduler. |
| Existing browser golden journey | Plans, choices, Stop/Retry, tests, commit and preview keep their current contract. |

Measure lost/duplicate submissions and effects, attention-state consistency, time to usable recovery, orphan processes, tool/Gate receipt correlation and diagnostic effort. Record startup/memory/latency only as secondary observations. Do not claim durability against power failure from process-kill tests. Record configuration, filesystem and flush policy with results.

Ship local improvements only when policy/recovery cases and existing browser journeys pass, with backup/restore and reconciliation covered. Reopen upstream adoption only if a named remaining problem cannot be solved reasonably in the existing runtime and measured evidence justifies the dependency/bridge cost. No performance or migration estimate is established by this desk study.

## Prioritized local work

1. **Answer recovery first:** reproduce crashes around queue admission and card settlement, then implement a recoverable shared transition or journal/outbox. Preserve stable question revision and submission identity. Do not start a storage rewrite unless the test exposes the need.
2. **Execution receipts next:** record intent, effect identity and result; distinguish safe reads from uncertain writes. Reconcile completed effects rather than replaying them blindly.
3. **Saved overview:** make dashboard354 and Actions350 read the same request/task/run IDs and unresolved attention state. Start with existing events; add only missing fields.
4. **Ownership before concurrency:** record parent/child and process ownership so Stop and restart have explicit behavior. Build actual multi-agent execution separately when authorized.
5. **Freeze recovery contracts:** bind restored work to approved phase, plan and skill revisions. Keep summaries and Brain proposals outside decision authority.

These are proposed implementation slices, not completed fixes. Their acceptance tests are the fault/story matrix above; no new dependency is needed to begin them.

## Claude review questions

1. Is an optional worker adapter simpler than fixing the concrete cross-store answer boundary? Prototype estimates should come from inspected interfaces, not guessed effort.
2. Can authorization be enforced below every executable entry point, including extension overrides and nested calls? Which public API guarantees this on a pinned release?
3. What happens to pending approvals when a task definition or Gate rules change after restart?
4. Which store owns durable product state, and how do Markdown edits, backup and rollback reconcile without dual authorities?
5. Can the dashboard/task tree reuse authoritative events with project privacy intact? Which terminal and worker events still need bridging?

Research limits: article, README, package manifest, normative-spec sections and selected examples inspected; no package installed, upstream tests run, crash experiment performed, full source security audit or production migration completed. Main-branch documentation is moving; pin and reverify before coding. Some GitHub example directory links failed; source file pages were available. This report recommends reuse without adoption, with an explicit local verification gate.
