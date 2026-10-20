# Scoped context retrieval with DuckDB: research and proposed design

20 October 2026. Research report for the owner and Claude. No retrieval feature, engine adoption, performance result or download is claimed. Extends the [local-search study](local-search-study-2026-10-20.md) and [backend library direction](../architecture/harness.md).

## Owner's intended behavior

A question in the master dashboard searches all authorized registered projects. A question in a project chat searches only that project. Retrieval should also help System 1 select documents for the dynamic context on every request, making the agent more useful without loading entire projects into a small model's context.

Cross-project discovery is a read capability, not approval to edit several projects. Implementation still belongs to a specific project, phase and approved task. Discovering useful knowledge does not publish it into the permanent Second Brain.

## What exists today

`harness/context.py` shares selection between web and terminal. `select_files` preserves rules, plan, task, current/named/task-linked files and the latest harness commit's files, then uses keyword overlap in names and contents. It excludes ignored, private, generated, binary, oversized and escaping/symlink files. `build_context` fits this selection into a character budget and records inclusion reasons.

This is useful deterministic groundwork, not indexed multi-project retrieval. It reads eligible bodies during selection and does not provide a shared cross-project search service. No claim is made that an index will improve latency or answer quality until measured. Existing exclusions must survive the new path; supporting larger files by safe section indexing would be a deliberate policy change.

## DuckDB findings from primary sources

- `read_text` can turn approved files into rows with contents and metadata. It does not watch files or enforce our project permissions. Invalid UTF-8 can fail a read. [Direct file reading](https://duckdb.org/docs/current/guides/file_formats/read_file)
- The FTS extension provides BM25 lexical ranking. Its index does not automatically refresh when the input table changes. Default English stemming/stopwords and the ASCII-oriented ignore expression need replacement or testing for Japanese and code identifiers. The extension can autoload from the repository on first use. [FTS](https://duckdb.org/docs/current/core_extensions/full_text_search)
- Embedded read/write access is owned by one process, with concurrent threads supported inside it. Multiple read-only processes cannot coexist with a writer under that basic mode. Newer remote options are a separate deployment choice, unnecessary for this proposal. [Concurrency](https://duckdb.org/docs/current/connect/concurrency)
- SQL and some non-SQL interfaces can access files/network or load extensions with the host's privileges. A read-only connection is not a project sandbox. [Security](https://duckdb.org/docs/current/operations_manual/securing_duckdb/overview)

Our assessment: DuckDB is a credible candidate for combining document matches with structured project/task/run evidence. That is more interesting than replacing a small keyword search merely for presumed speed. SQLite FTS5 remains the lower-dependency baseline; neither is selected by this report. Lexical BM25 is not semantic understanding and may miss paraphrases. Embeddings and model reranking are separate future evaluations, not automatic additions.

## Shared backend retrieval contract

The frontend sends question text and its conversation identity. The host derives the permitted scope from trusted session/project state; a model-supplied list cannot widen it.

| Entry point | Host-established scope |
|---|---|
| Dashboard question | All currently authorized, registered projects; explicit project filter may narrow it |
| Project chat | Exactly the current stable project ID |
| Terminal chat | The same project identity and policy as web |
| Future agent client | Explicit host-issued scope; no direct database/file access |

Search scope must be enforced before candidates, snippets, counts or model context are returned. Do not retrieve globally and ask a model to filter afterward. Keep per-project partitions/index statistics where needed so excluded projects cannot affect visible ranking or counts. Dashboard aggregation merges only permitted partitions, with project diversity limits; raw BM25 scores from independent indexes are not necessarily comparable. Test a deterministic merge such as reciprocal-rank fusion rather than silently assuming score comparability.

Illustrative result fields: project ID, document ID, relative path, heading, line range, source revision/hash, bounded excerpt, match reason, index generation and freshness. API names are not a shipped contract. Search accepts bounded text/filters, never arbitrary SQL, filesystem globs or expressions from agents/frontends.

## Dynamic context on every question

1. Establish current project scope, phase, request identity and budget. Keep mandatory rules, active task and authoritative plan state separately from relevance ranking.
2. Build a bounded lexical query from the current question and explicit references. Resolve follow-ups with a bounded recent thread window; do not let the entire old conversation dominate ranking or widen scope.
3. Retrieve document sections, exact symbol/path hits and relevant structured evidence. Use fixed, testable ordering for explicit references, active-task links, textual relevance and bounded recency. Stable tie-breaking makes selection reproducible for a given corpus revision.
4. Expand only bounded, authorized links: task to referenced implementation, tests and recorded run results. Avoid unrestricted graph traversal and duplicate near-identical excerpts.
5. Re-read selected sources and verify identity, permission and revision. Refresh or discard stale candidates. Construct the context pack within the remaining budget; relevance cannot displace required policy context.
6. Record a selection receipt: query/scope identity, corpus generation, included sources/revisions/reasons, omitted sources and truncation. Store locally with appropriate retention; do not add sensitive excerpts or raw questions to a public log.

System 1 performs scope checks, selection and budgeting using code. Laya is only an optional typed classifier with abstention if rules prove insufficient; it is not needed for ordinary lexical retrieval. System 2 generates the answer from the resulting pack. Retrieved text is untrusted evidence and cannot change Gate, phases, approval or completion. A match does not prove a claim, and an empty result does not prove a feature is absent.

For dashboard questions, collect project-level summaries first and drill into matching sections within a bounded global budget. Do not inject every project's README and roadmap. Distinguish raw model statements, recorded tool outcomes and independently verified evidence. Label partial search coverage honestly.

## Useful questions this enables

- Project chat: “Why does answering questions fail?” retrieves that project's answer handler, relevant task, regression tests and recorded failure evidence.
- Dashboard: “Which projects still have authentication failures?” joins authorized project/task/run metadata with matching documents and cites each project's evidence.
- Dashboard: “Where did we already solve offline support?” finds candidate implementations; it does not assert they are compatible, licensed for reuse or verified in the target app.
- Project chat: “Continue that fix” uses the active task and recent thread references without bringing another project's similarly named task into context.

## Storage, updates and failure behavior

Markdown/project files remain authoritative. Index rows are disposable projections with stable project/document IDs, section IDs, path, content hash, language and source kind. Keep structured test/run receipts distinct from generated prose. Only index authorized collections; exclude secrets, Trash, ignored/private material and external symlink targets under existing policy. Brain sources use their own authorization and publication rules, not an implicit exception to project-only scope.

Use an initial scan plus explicit host change events and periodic reconciliation for external edits. DuckDB FTS needs explicit rebuilds; evaluate per-project immutable generations, with authorized changed-file scanning as a bounded freshness overlay if needed. Publish only complete generations. Removed/revoked sources are suppressed immediately by current authorization/source validation, even if physical index cleanup follows later. Crash during rebuild must leave a prior complete generation or clear unavailable state.

One backend service owns DuckDB connections and mutation; clients use the retrieval port. Bound query time, input size, results, excerpt size, memory and traversal depth. Disable unapproved extension installation/autoload and external access in query execution where possible; approved ingestion uses host-validated paths separately. No database handle is exposed to an agent. An unavailable/corrupt index falls back to existing scoped selection when feasible, with truthful coverage, and cannot erase source files or block chat.

## Evaluation and required tests

Use synthetic English/Japanese/code projects, including similarly named files and tasks. Compare the current selector, SQLite FTS5 and an explicitly approved DuckDB/FTS trial on the same machine and corpus revisions. No engine/model download is authorized by this report.

Measure relevant-section recall@k, citation correctness, useful evidence within a fixed context budget, stale-result rate, indexing/update/rebuild cost, cold/warm latency and memory/disk size. Measure context selection separately from model answer quality. Cross-project aggregations must use comparable query semantics. Reliability and capability precede optimization.

Required unit/integration checks: project-only isolation including caches/counts/ranking; dashboard authorized union; revocation during query; rename/move by stable ID; delete/Trash; stale source hash; malformed/invalid UTF-8/large files; hostile document instructions; SQL/path-like query text; mandatory-context reservation; deterministic ties; Japanese and punctuation-heavy symbols; duplicate headings; empty/partial results; bounded cancellation and missing optional engine.

Required crash checks: process death during ingestion/rebuild/publish, recovery from incomplete generations, source edits during selection, lost/corrupt index and no false claim of complete search. Required later E2E stories: project chat cannot surface another project's unique marker; dashboard can cite both authorized projects; edits refresh context; revoked content disappears; reload/reconnect preserves the receipt; missing index still permits conversation. New scope/source/freshness UI requires designer boards first.

## Recommendation and Claude review

Implement the backend search/context port first, preserving existing selection as a fallback and making engine choice replaceable. Benchmark DuckDB specifically for joined document/evidence questions alongside SQLite FTS5 and scans. Choose only after quality/freshness/isolation results justify the operational cost. This report does not supersede the prior SQLite-first prototype recommendation.

Claude should review scope derivation, per-project ranking isolation, budget priorities, FTS refresh cost, authoritative evidence joins, context receipts and integration with task357's library extraction and crash suite. Open decisions after evidence: corpus types/retention, acceptable freshness, ranking weights and multilingual tokenization. Dashboard chat and new retrieval controls remain design work, not implemented UI.
