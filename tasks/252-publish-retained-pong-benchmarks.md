# 252: Publish yesterday's retained Pong benchmark records

Kind: docs

Request 2026-10-17: “and commit + push your benches too, the run you did yesterday”

- [x] Red (manual artifact acceptance): the published Pong runs directory and explanatory README were absent before this change.
- [x] Publish both retained runs, preserving metric fields and failures, without project copies, service logs or machine-specific private paths.
- [x] Explain dirty-build provenance, no implementation, missing test-run evidence and separation from the already-pushed 22-run batch; link from the Claude return handoff.
- [x] Green (artifact checks): both run records retain their source metrics, all links resolve, and publication contains no home paths or secret patterns.
- [x] Green: full Python/Node workflow passed with PYTHONDONTWRITEBYTECODE=1 before the chained commit.

No new model run, download or runtime change. Both runs remain unsolved and unverified. The prior summary in results.jsonl is unchanged. Push is explicitly authorized.
