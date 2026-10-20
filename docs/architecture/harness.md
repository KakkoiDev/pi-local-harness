# WorkStation harness: philosophy and backend architecture

20 October 2026. Constitution is authoritative; this document describes current code and the requested library direction. It does not amend the Constitution or claim that extraction is already complete.

## Why the harness exists

Make local AI development reliable enough to create useful, shareable applications. Experienced people should spend time on novel business needs; beginners should learn sound planning, verification and project practice. Reliable capability comes before throughput and scalability. A stronger model may improve generation, but correctness must not depend on its willingness to follow protocol.

**System 1 decides; System 2 produces.** System 1 comprises deterministic code and the typed Laya classifier, with explicit abstention thresholds. The decision ladder is code, then Laya, then the person. System 2 generates explanations, code and plan content; it is never an approval, a test receipt, a phase controller or evidence that its own task is finished. The current implementation still has incomplete areas; Constitution “not yet” notes are historical starting points, not an up-to-date coverage ledger.

Discussion, Planning and Implementation apply to every request. Only the person's explicit controls or the already authorized unattended protocol change phase and approve work. Gate checks actions before execution and records outcomes afterward. A refusal should explain recovery and block the relevant action, not trap the entire conversation. The person decides intent, not how to weaken our guardrails.

## Markdown as the database

Readable, portable files are a product property. Roadmaps, tasks, progress, decisions and Activity records must remain inspectable and editable without a special UI. Stable identity is separate from a folder name. Edits need revision checks, scoped paths, schema validation, recoverable history and Trash semantics.

Current storage is mixed; do not describe everything as Markdown:

| Data | Current implementation / authority |
|---|---|
| Project roadmap and task content | `ROADMAP.md`, `tasks/*.md`, checked by Gate/protocol code. |
| Activity/queue records | `harness/markdown_records.py` plus `harness/work_queue.py`; JSON-compatible frontmatter is authoritative, body is a readable summary. This is a constrained format, not arbitrary executable YAML. |
| Conversations | `ConversationStore` in `harness/web_chat.py`, saved JSON, and Pi session JSONL. |
| Project documents | `harness/documents.py`; bounded paths and revision-aware saves. |
| Private learning/skill-run proof state | SQLite via `harness/learning.py` and `harness/skill_runs.py`; this is not a replacement for editable project plans. |
| Search (proposed) | Rebuildable, revisioned projection; never the authority for permissions, phase or completion. |

A temporary file plus replace protects one record from a partial replacement. It does not make a queue/card/project update one atomic multi-file transaction, nor guarantee power-loss survival. Journals/outboxes may be needed for recoverable cross-record transitions. Do not silently migrate editable artifacts into a hidden database. Document every store's owner, recovery/flush policy, migrations and backup/restore behavior.

## Current request flow

A frontend submits a scoped request -> WorkQueue records/adopts it -> WebChat launches a Pi RPC session -> Pi produces calls -> Gate authorizes them -> the execution adapter runs approved work -> independent results feed paperwork/verification -> saved state is presented to the frontend. Explicit choices and check-ins return through host validation. No model text can substitute for an execution result.

Today `harness/web_chat.py` combines ConversationStore, orchestration in WebChat and HTTP handling in WebHandler. WorkQueue is already callable without a browser, but its Activity body contains web links. Gate's ledger also imports harness modules. These are concrete extraction seams; a directory named “harness” is not proof of a reusable library.

## Target: a UI-independent Python library

**Required direction, not a shipped API.** The library must be usable in-process without starting HTTP, opening a browser or importing a frontend framework. A web server, terminal, native app or another frontend is an adapter. Each receives the same policy and state semantics. Remote frontends require authenticated transport; “any frontend” does not grant arbitrary access to local files or keys.

Dependency direction: frontend/transport -> application service -> domain/policy + storage/execution ports. Adapters implement ports; domain code does not import HTTP handlers, JS, HTML renderers or platform UI. One host owns scheduling and storage mutations. Multiple connected clients do not create multiple schedulers.

Proposed primitive contracts (names illustrative until implemented/versioned):

| Primitive | Required behavior |
|---|---|
| Open/close/recover | Explicit data root, project registry, execution/provider ports and policy; no hidden home discovery or import-time service startup. One owner, clean teardown. |
| Submit | Stable project/chat/request identity and idempotency key; distinguish admission from execution and completion. |
| Snapshot/events | Versioned plain data with stable IDs, sequence/cursor, freshness, bounded retention and reset/reload behavior. Slow/broken clients cannot block execution. |
| Answer/approve/accept | Specific card/plan/task revision, actor and idempotency key; reject stale scope, preserve explicit authority, recover cross-record transitions. |
| Inspect work/attention | Read-only projections shared by dashboard, Actions, terminal and other clients. Unknown is distinct from idle or success. |
| Execute/cancel | Host-owned capability checks, before/after receipts, bounded output and exact process ownership. Cancellation of observing/waiting is distinct from cancellation of work. |
| Documents/plans | Stable identity, safe paths, revisions, atomic individual writes, schema validation, reconciliation and Trash/restore. |
| Search | Explicit authorized roots/scope and bounded query/results, source revisions/citations, index freshness and rebuild. |

Inject clock, IDs, filesystem/storage, model/provider, execution, classifier and event sink as needed for deterministic tests. Keep secrets in host-managed references; never return credentials in snapshots. Structured errors need stable codes and recovery details; localization/rendering belongs in adapters. No arbitrary frontend callback may declare a task verified.

## Crash conformance is part of the library

The library's ordinary test suite must run without browser, model weights, keys, network or live services. Real subprocess-death tests supplement deterministic fault injection. Kill only owned test processes; use scratch stores and explicit handshakes/barriers rather than timing sleeps. Test before persistence, after persistence/before effect, after effect/before receipt, and after completion. Reopen with a fresh process/object and verify persisted outcomes and duplicate counts.

Initial executable coverage: `tests/test_process_crash_recovery.py` has six process-exit cases for queued/claimed/effected/completed work and before/after Markdown replacement. Run with `python3 -m unittest tests.test_process_crash_recovery`; ordinary unittest discovery and the workflow suite include it automatically. These tests confirm conservative interruption with no automatic replay; they do not implement safe-tool resumption or atomic choice settlement.

The broader upstream-derived requirements are in [the conformance map](../reports/pi-durable-conformance-2026-10-20.md). Every in-scope case must eventually have an executable backend test; no blanket skips, xfails or “not applicable” to hide an unmet core contract. Browser tests then verify adapter journeys such as answering a card after reconnect. Headless passes never substitute for UI E2E, and UI passes never substitute for crash recovery.

The entire library and full crash matrix remain task 357. Initial tests are task 358. Extraction must proceed incrementally under the existing browser golden journey; an independent minimal Python client plus the current frontend must exercise the same application service before claiming decoupling complete.

## Scoped retrieval research

See [scoped context retrieval](../reports/scoped-context-retrieval-2026-10-20.md) for dashboard-wide and project-only scope, dynamic context receipts, DuckDB constraints and proposed tests. This is research, not a shipped retrieval API.
