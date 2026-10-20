# Local file search: DuckDB, QMD and SQLite FTS5

20 October 2026. Source study, not a performance benchmark or dependency approval. We cannot identify the remembered tool with certainty. DuckDB is real and relevant; QMD is another plausible match for fast local Markdown search.

## Findings from primary sources

DuckDB `read_text` reads files/globs into rows with contents and metadata; it is not a filesystem watcher or a ready-made always-current search index. UTF-8 validation can fail. [Direct file reading](https://duckdb.org/docs/current/guides/file_formats/read_file)

DuckDB's FTS extension supplies BM25 indexing, but indexes do not automatically refresh after table changes. The extension may be fetched on first use. Defaults include English stopwords and an ASCII-oriented ignore expression, so Japanese/source-code retrieval needs explicit testing/configuration. [FTS documentation](https://duckdb.org/docs/current/core_extensions/full_text_search)

SQLite FTS5 provides ranked full-text queries, phrases/prefixes and tokenization options including trigram. It must be present in the selected SQLite build. An external filesystem still needs an ingestion/update/deletion pipeline; database indexing does not automatically track arbitrary Markdown edits. [FTS5 documentation](https://sqlite.org/fts5.html)

QMD targets local documents, with lexical SQLite FTS5 retrieval, optional vector retrieval and model-based expansion/reranking, plus an SDK. Its documented model paths can download on first use; update commands can run configured shell commands. It is not an approved dependency here. A direct lexical method avoids model-based ranking, but its package/init behavior still requires inspection before use. [QMD](https://github.com/tobi/qmd)

## Fit for WorkStation (our assessment)

| Need | First candidate | Why / limit |
|---|---|---|
| Exact symbols, paths, code fragments | Existing ripgrep/plain bounded scans | Low integration cost; no index freshness issue. Repeated large scans may become expensive. |
| Ranked project/Brain Markdown retrieval | SQLite FTS5 prototype | Python integration and no additional package if bundled FTS5 is available; benchmark language/tokenization and update behavior. |
| Aggregate approved run evidence, counts, analytic queries | Optional DuckDB evaluation later | Potential analytical fit; do not add a second engine merely to count a small metadata set. |
| Semantic “find related notes” | Learn from QMD; defer dependency/model adoption | Quality must justify extra runtime/models. No model-based judgement or reranker may acquire policy authority; Constitution remains controlling. |

Recommendation: define a search port in the backend library. Prototype scoped lexical search with the existing SQLite capability before adopting DuckDB/QMD. Keep the engine replaceable. This is an engineering hypothesis, not a measured claim that SQLite is faster. An in-memory synthetic probe on this machine's Python SQLite 3.53.3 confirmed FTS5 availability and a keyword hit; shipped runtimes/other OS builds were not checked. No DuckDB, QMD, extension or model was downloaded or run.

## Markdown remains authoritative

Index only explicitly authorized collections. Use stable project/document IDs, current path, content hash/revision, section/line citation, language and indexed-at metadata. Hash for freshness; do not mistake a hash or relevance score for verification. Show index freshness; revalidate source content before a result is used for a decision or edit. Source text is untrusted content, never executable instructions.

Index outside publishable project content by default; copied snippets and vectors can contain sensitive material too. Project filtering must occur before returning snippets or model context. Do not copy private project knowledge into the permanent Brain without the existing explicit publication protocol. Exclude secrets, Trash, attachments and external symlink targets by policy; never infer that an ignored file is safe merely because it is local. Removed/moved/revoked sources must stop appearing without waiting for manual cleanup. Restored sources need fresh authorization.

The index is disposable: loss/corruption/rebuild cannot erase Markdown or block chat. Rebuild into a separate generation, then publish it; interrupted rebuilds keep the prior complete index or a clear unavailable state. Queries are bounded, parameterized and cancellable; no arbitrary SQL, paths, automatic extension downloads or collection update shell commands from a frontend/model. Permission loss invalidates cached results.

## Evaluation before selection

Use generated corpora at several sizes, not owner projects. Include English, Japanese, mixed code identifiers, exact filenames, renamed/deleted notes and repeated headings. Compare scan, FTS5 and only approved optional candidates on the same queries and machine. Measure indexing/rebuild/update time, cold/warm p50/p95, memory/index size, recall@k, citation correctness, stale-hit rate and isolation failures. No fixed speedup claim until measured.

Test index corruption, process death during rebuild/update, concurrent edits, permissions revoked, binary/invalid UTF-8 input, symlink escape, punctuation-heavy queries, oversized results, missing FTS support and missing optional engines. Retrieval must remain read-only and never change phase, task boxes or skill policy. Any new visible search controls require design; the library API can be evaluated headlessly first.
