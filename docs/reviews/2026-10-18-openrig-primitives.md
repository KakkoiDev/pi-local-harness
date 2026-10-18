# OpenRig primitives worth adapting for Pi Workbench

Reviewed 18 October 2026 for the owner and Claude. This is a source review and a proposed design direction, not an implementation or an installed evaluation. Public pages were read in the browser; no repository clone, packages, models or dependencies were downloaded or executed. Links below point to mutable `main`. The web cache returned different crawl dates, so this is not a verified, coherent release snapshot; Claude should pin a commit before implementation. OpenRig's architecture document itself describes an older checked revision and warns that code wins.

## Recommendation

Borrow small reliability primitives first: atomic answer/work transitions, stable session generations, structured waiting reasons, runtime readiness contracts, and fault-injected installed-build tests. Reimplement the contracts in Python around our existing Gate and queue. Keep the existing Python/HTMX application direction and the Workbench design. These are recommendations inferred from source, not measured improvements.

OpenRig primarily coordinates coding-agent teams. Its README describes durable teams, messaging, snapshots and provider integration; it is not the reusable application-component library the owner wants Project Start to become. It complements that goal by keeping the agent's work reliable. [Repository overview](https://github.com/mvschwarz/openrig)

## Candidate primitives, in priority order

### 1. Atomic state transition plus durable delivery intent — immediate priority

OpenRig's queue stages a successor wake intent on the same database connection and inside the transaction closing its predecessor. Delivery happens after commit. It checks for a missing intent store, uses deterministic intent IDs, freezes the delivery envelope, and distinguishes uncertain delivery from failure. Recovery does not blindly resend an abandoned in-flight delivery. These mechanisms appear in `attachOutbox`, `stageWakeIntent`, `deliverWakeIntent` and `reconcileAbandonedWakeIntents`. [Queue implementation](https://github.com/mvschwarz/openrig/blob/main/packages/daemon/src/domain/queue-repository.ts)

**Our adaptation:** one authoritative transaction should accept a choice, record its answer, create the continuation job and record the resulting event. Persist before showing success. Use a uniqueness constraint on question identity plus a revision check; transport retries return the accepted result. A timeout must not create another build. The present repair closes the visible-before-saved race, but JSON conversation persistence and queue creation still deserve a separate crash-atomicity review. SQLite is a candidate, not a decision to migrate all data now.

**Acceptance:** crash before commit, after commit but before response, during continuation dispatch, and after dispatch but before acknowledgement. Reload and retry must yield one recorded answer and one continuation. An uncertain external effect must be visible and reconciled without automatic duplicate execution.

### 2. Stable identity with generation-bound operations

`SeatDeliveryGuard` captures a node/session/occupant/pane binding before waiting, serializes operations, checks the binding again, and invalidates its lease when the operation ends. A delayed operation cannot silently target a replacement occupant. Protection activation shares the serialization boundary with input. [Delivery guard](https://github.com/mvschwarz/openrig/blob/main/packages/daemon/src/domain/seat-delivery-guard.ts)

**Our adaptation:** bind commands to project ID, request ID, runtime generation, question ID and phase revision. A renamed folder is an address change, not a new project. A restarted worker or replaced plan invalidates old controls with a precise explanation and a current replacement. Preserve drafts separately. Do not adopt terminal keystroke injection as the main transport; Pi already offers structured RPC.

**Acceptance:** an answer racing restart, rename, project switching or plan replacement is either accepted against the intended record or rejected without affecting the new record. Test competing operations, not only sequential clicks.

### 3. A single structured explanation of waiting

OpenRig's `WaitingView` contains the obligation, owner, blocker, meaningful transition, observed activity, deadline and next recovery mechanism. It explicitly represents missing recovery evidence rather than inventing a healthy state. Its progress calculation excludes some machine-generated delivery bookkeeping. [Waiting projection](https://github.com/mvschwarz/openrig/blob/main/packages/daemon/src/domain/queue-waiting.ts)

**Our adaptation:** derive Chat and Activity from one Python status projection: waiting for a named question, approval, test, model response, dependency or reconnection. Include the action available to the person and its owner. Stream updates may render the projection but cannot become a second authority. This would make “conversation blocked” diagnosable without reading raw JSON or logs.

**Acceptance:** each displayed wait has an authoritative reason and an available next action, or a clear reason no action is possible. Answering clears that exact wait across tabs, Activity and reload.

### 4. Separate liveness from useful progress

OpenRig derives pickup states such as unclaimed, working, parked, stalled after claim and terminal. It uses evidence and a threshold, while explicitly warning that observed working activity does not prove task progress and age does not prove a dead process. [Pickup derivation](https://github.com/mvschwarz/openrig/blob/main/packages/daemon/src/domain/queue-pickup.ts)

**Our adaptation:** keep token streaming, worker heartbeat, file changes, successful tests and task completion as different facts. A model producing tokens must not keep an otherwise stuck workflow falsely healthy. A quiet person-answer wait must not trigger an automatic restart or change phase. Use timers for diagnosis and bounded recovery only; code, Laya and the person's authoritative controls remain the decision ladder.

### 5. Explicit runtime adapter and readiness result

OpenRig defines an adapter boundary for resource projection, startup delivery, launch and readiness, with typed attention-required reasons. Its launch result distinguishes recoverable fresh-start cases from human intervention and carries evidence. [Runtime contract](https://github.com/mvschwarz/openrig/blob/main/packages/daemon/src/domain/runtime-adapter.ts)

**Our adaptation:** provider-specific discovery, tools, stream decoding, cancellation, resume and readiness should sit behind a tested contract. Keep native CLI/harness adapters distinct from language-model API adapters: Colibri is a model-serving integration, not automatically a Claude/Codex-style session runtime. Share capabilities and error semantics where appropriate without forcing unlike lifecycles together. Missing auth, unsupported tools or an incompatible protocol must never silently select another provider or bypass Gate.

### 6. Fault-injected scenarios against the installed product

OpenRig's test-system documentation requires a healthy run paired with a specifically injected defect and assertions through shipped observable surfaces. It also lists authored scenarios that are not executable or not admitted CI passes. [Scenario contract and limitations](https://github.com/mvschwarz/openrig/blob/main/packages/test-system/README.md)

**Our adaptation:** extend our existing fake-Pi/browser machinery, rather than add another agent framework. Run installed-build stories for immediate question answers, two tabs, reconnect, stopped workers, renamed projects and crash boundaries. Seed the old visible-before-saved behavior and require the immediate-answer story to fail. Keep mocked, installed-stub and real-model results separate. A passing fake agent cannot prove a local model can build the requested application.

### 7. Versioned, bounded context resources

The architecture describes context packs with manifests, resource projection and checks for generated copies, plus packaged-source tests. [Architecture map](https://github.com/mvschwarz/openrig/blob/main/ARCHITECTURE.md)

**Our adaptation:** give App Blocks a manifest containing version, required foundation, dependencies, supported packaging targets, permissions, examples and actual verification evidence. Resolve those fields in Python before giving the selected blocks to Pi. Preserve the exact block/version in the request record and installed build. Keep deterministic dependency selection authoritative; classifier suggestions are advisory. This can support the advanced Project Start without asking a small model to rediscover solved architecture on every request.

## What to defer or reject

Do not introduce persistent agent teams, tmux topology management or a second daemon merely to acquire these patterns. The current single-agent product benefits from the invariants already. Multi-agent coordination is a later scope decision with local hardware and UX costs.

Do not adopt OpenRig's permission bypasses, automatic trust/bootstrap writes, provider configuration changes or optional external services. The README documents significant host integration effects. Those conflict with blindly installing it into this project; the owner's constitutional boundaries remain authoritative. No UI from upstream is approved by this report. [Documented machine changes](https://github.com/mvschwarz/openrig#what-openrig-changes-on-your-machine)

Upstream is Apache-2.0. Before copying actual source, pin the revision, review the relevant file and dependencies, retain required licence/attribution notices and mark modifications. No upstream source was copied into this change. [Licence](https://github.com/mvschwarz/openrig/blob/main/LICENSE)

## Claude handoff

Independently inspect the linked implementations at one pinned revision. Compare them with `harness/web_chat.py`, `harness/work_queue.py`, Gate's planning/paperwork, provider selection and installed-build tests. Start with atomic choice acceptance and continuation, generation fencing, and one waiting projection. Propose small tasks with failure scenarios, compatibility/migration requirements and observable acceptance criteria. Reuse existing roadmap tasks where they already own the problem; do not mark a proposal implemented.

Then review the current question-flow repair and other fixes in [the repair handback](2026-10-18-codex-repairs.md). The owner explicitly requested this OpenRig investigation before resuming those repairs. Keep reliable capability and the Python/HTMX foundation ahead of generated-app performance work.
