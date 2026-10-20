# Pi Durable specifications mapped to WorkStation

20 October 2026. Owner request: take upstream test cases as specifications and make the relevant ones executable in our backend suite. Preserve our Constitution and Markdown architecture; API/implementation parity with TypeScript/Chord is not the goal.

## Inventory and evidence boundary

[Inventory JSON](pi-durable-test-inventory-2026-10-20.json) records 70 top-level `*.test.ts` files, their Git blob IDs, URLs, sizes and initial file-level scope. Thirteen priority source files were inspected for this first map. Other files are inventory-only; their classification needs case-level review. Helpers, examples, benchmarks and `test-workers` are not covered by that count. Do not call this a complete upstream audit or full test port.

Source directory: [Pi Durable tests](https://github.com/earendil-works/pi/tree/main/packages/durable/test). Directory `main` can move; blob IDs preserve the inventory identity. Before a port, verify the file matches its recorded blob or refresh the map explicitly. We read source through GitHub; no package or upstream test runner was installed or executed. No upstream source code is vendored by these independently written Python cases.

## Concrete source specifications

The following are our paraphrases of inspected test behavior, not exact test names. “Open” means no equivalent executable pass is claimed. Existing related tests are evidence to inspect, not proof of semantic parity.

| ID | Upstream source / behavior | WorkStation requirement / current evidence |
|---|---|---|
| C01 | [tool recovery](https://github.com/earendil-works/pi/blob/main/packages/durable/test/harness-tools-recovery.test.ts): an unsafe interrupted effect is not rerun | In scope. Initial weaker/request-level equivalent passes: `ProcessCrashRecoveryTest.test_effect_without_result_is_never_automatically_replayed`. Durable tool partial output and automatic run continuation remain open. |
| C02 | Same: replay allowed only when stored and current policies both allow it | In scope for any future safe replay; open. Current queue conservatively interrupts every previously running request. |
| C03 | Same: changed cwd/tool selection affects recovery | Adapt. Revalidate stable project identity and authorized move/phase/capabilities; never silently retarget a call to another project. Open. |
| C04 | Same: rerun preflight without duplicating the effect; retain the recorded decision | In scope, with revision-bound approvals rather than an unqualified permanent yes. Open. |
| C05 | Same: faulted/aborted tool has an honest unavailable/partial result; stale attempt progress clears | In scope; open for full durable tool-level evidence. Model continuation cannot mark a task verified. |
| C06 | [submission tests](https://github.com/earendil-works/pi/blob/main/packages/durable/test/harness-submissions.test.ts): duplicate keys resolve to one submission per conversation, including reopen | In scope; generic admission/reopen guarantee open. Existing choice-click dedupe alone is insufficient. |
| C07 | Same: cancelling a wait differs from cancelling work; close settles waits; handles can be reacquired | In scope for library clients; open. |
| C08 | [generation recovery](https://github.com/earendil-works/pi/blob/main/packages/durable/test/harness-generation-recovery.test.ts): interrupted model output is retained as incomplete, then retry resumes consistently | Adapt. Preserve truthful partial outcome and no duplicated tool effect; automatic retry needs current policy/phase. Open. |
| C09 | Same: backoff persists and unavailable pinned model fails clearly | In scope for supported provider recovery; open. Provider-specific deferred/poll APIs apply only if implemented. |
| C10 | [task recovery](https://github.com/earendil-works/pi/blob/main/packages/durable/test/harness-tasks-recovery.test.ts): recover at intent/effect/outcome and abort boundaries | In scope principle; initial queued/claimed/completed process tests pass in task358. Full multi-stage task/abort semantics open. |
| C11 | Same: missing/incompatible definitions stay blocked; migration failure cannot mutate the old record | In scope for frozen ICM contracts and future library schema migration; open for production dispatch. No need to reproduce upstream hot-swapping. |
| C12 | [storage failure](https://github.com/earendil-works/pi/blob/main/packages/durable/test/harness-storage-failure.test.ts): uncertain store failure prevents false successful publication | In scope. Fail the affected consistency domain and reconcile; do not blindly keep accepting writes or unconditionally take unrelated stores down. Open. |
| C13 | Same: bad observer/report callbacks do not strand other observers or produce unhandled failure | In scope for event adapters; open. |
| C14 | [cancellation barrier](https://github.com/earendil-works/pi/blob/main/packages/durable/test/harness-cancellation-barrier.test.ts): no next phase before cancellation is committed | In scope safety rule; open. |
| C15 | [ownership](https://github.com/earendil-works/pi/blob/main/packages/durable/test/harness-ownership.test.ts): parent/child busy and abort follow ownership, including after reopen | Current exact-process ownership is in scope; full agent/task-tree contract is future scope. No claim of multi-agent support. |
| C16 | Same: background work can survive an ordinary parent abort | Future capability, not today's default. Needs explicit product/design decision before adopting that behavior. |
| C17 | [nested restart](https://github.com/earendil-works/pi/blob/main/packages/durable/test/harness-nested-tools-restart.test.ts): recovered nested calls reattach by key; unsafe callers abandon children | In scope safety if nesting is exposed; complete nesting feature is future. Gate must cover nested calls. Open. |
| C18 | [live deltas](https://github.com/earendil-works/pi/blob/main/packages/durable/test/harness-live-deltas.test.ts): publish coherent task/output transitions with bounded progress | Adapt to plain versioned events/snapshots, not Chord operation encoding. Open. |
| C19 | [watches](https://github.com/earendil-works/pi/blob/main/packages/durable/test/session-watches.test.ts): subscribe/reconnect preserves revision, bounds backlog and isolates a failed subscriber | In scope for library events. Exact Chord frames are outside our contract. Open. |
| C20 | Same: observing absent state must not create it | In scope, including dashboards/search; open as a shared library contract. |
| C21 | [JSONL storage](https://github.com/earendil-works/pi/blob/main/packages/durable/test/jsonl-storage.test.ts): incomplete writes, flush uncertainty and recovery cannot invent confirmed records | Adapt to Markdown atomic replacement/journal, not the upstream sidecar layout. Task358's before/after replace tests pass; torn journal/fsync/UTF-8 recovery still open. |
| C22 | [failed-run inbox](https://github.com/earendil-works/pi/blob/main/packages/durable/test/harness-failed-run-inbox.test.ts): failed-run policy preserves or withdraws pending inputs deliberately | In scope. Preserve existing queue policy and explicit approvals; no automatic switch to upstream policy. Open for full failure/restart matrix. |
| C23 | [task graph](https://github.com/earendil-works/pi/blob/main/packages/durable/test/harness-task-graph.test.ts): committed task statuses/ownership, no duplicate/no-op notifications | Adapt for dashboard354 and Actions350; full multi-agent graph deferred. Open. |

Initial six executable tests are additive, independently written and discovered by the normal suite. They test real subprocess exit, not just a Python exception. No C-row is “fully conformant” based on a weaker request-level substitute.

## Out of current scope, with reasons

- **Chord deltas, document mount/cache/sidecar layouts and TypeScript compile-time types:** foreign implementation contracts. Keep their observable invariants (consistent revisions, bounded memory, migrations), not their internal data structures.
- **Cloudflare SQLite/Durable Objects and browser WASM image loading:** our harness runs as a local host backend; generated-app Capacitor/WASM export plans are separate from running this harness in those environments.
- **QuickJS code-mode script journaling, model/image generation inside scripts and JavaScript namespace discovery:** not a current execution interface. Retain the rule that every nested effect must still pass Gate if such a feature is introduced.
- **Upstream hot replacement choosing new code by name on restart:** intentionally adapt more strictly; our approved ICM skill/validator versions stay frozen. Refusal/migration is preferable to silently accepting changed code.
- **Conversation forks, persistent background subagents and durable reminders:** future features, not permanently rejected. Shared-project permissions and human approval must be designed before enabling them.
- **Exact upstream token/cost accounting and provider-specific polling:** apply only to providers/features we actually support; do not require identical prices or wire formats. Missing/partial usage must stay honest.
- **Backend-specific storage benchmarks:** evidence for later engine choice, not behavioral acceptance or a precondition for building reliably.

These exclusions do not waive queue durability, no duplicate unsafe effects, project isolation, explicit approval, truthful errors or cancellation of owned work. Revisit exclusions when capabilities change. Unknown/unreviewed cases remain unreviewed, not silently outside scope.

## Required suite structure and next work

Task357 must finish case-level mapping for every inventoried source and separately inventory worker/multi-process suites. Track each requirement as mapped, ported, passing, failing, deferred or excluded with reason. Do not count upstream passing tests as ours passing. If code is copied later, pin provenance and retain its MIT notice/licence; semantic adaptation is preferred.

Run portable headless cases through standard unittest discovery and `tests/verify_workflow.py`. Keep deterministic fixtures for storage/execution failures, plus real subprocess exits at durable boundaries. Required tests cannot rely on optional model packages or skip for missing browser. UI-specific reconnection/approval stories remain additional browser tests. Fix failing in-scope cases before claiming conformance; the full matrix is still open.
