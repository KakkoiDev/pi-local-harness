# 357: Reusable harness library and backend conformance

Owner direction, 20 October 2026: decouple the harness from its UI, make its backend primitives reusable by any frontend, document its philosophy/storage, and run the relevant Pi Durable crash/spec tests directly in our ordinary suite. Reuse ideas; no Pi Durable adoption is authorized.

Architecture: `docs/architecture/harness.md`. Upstream mapping: `docs/reports/pi-durable-conformance-2026-10-20.md`. Search study: `docs/reports/local-search-study-2026-10-20.md`.

Deliver in small verified slices:

1. Finish case-level triage of the source-versioned upstream inventory; mark each in-scope requirement with its local test and real result, or an open gap. Keep deferred/foreign implementation cases explicit.
2. Port recovery specifications into Python backend tests against real WorkStation stores. Use deterministic fault points plus fresh-process exits, including answer/queue crash consistency. Add tests before repairing each exposed fault; no live data or runtime dependency downloads.
3. Extract ConversationStore and application operations from HTTP/WebChat coupling. Define versioned command/result/event contracts and explicit dependencies/lifecycle. Preserve public behavior; one scheduler and policy owner.
4. Route existing web/terminal adapters through the same core. Demonstrate a minimal non-HTTP client with identical scope, idempotency, approval and recovery behavior. Package/import the library without frontend runtime or service startup.
5. Provide mandatory offline conformance discovery, storage adapter checks, migration/restore tests and browser golden-journey coverage for existing adapters. Missing required support fails rather than silently skipping.
6. Evaluate a rebuildable, scoped lexical search adapter with current SQLite FTS5 before approving optional engines. Benchmark synthetic data and prove index loss does not lose Markdown or block chat.

No new UI is needed for extraction or backend tests. Dashboard and Actions integration still follow designer boards. Multi-agent scheduling, background reminders, conversation forking, arbitrary JS code mode and Cloudflare execution are separate capabilities, not prerequisites for a reusable library.
