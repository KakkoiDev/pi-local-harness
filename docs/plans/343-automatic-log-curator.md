# Automatic log curation: implementation and review notes

## Automatic System 1 evidence curator (task 343)

The Gate runtime automatically selects safe metadata from **new** refused calls, test results and verified code commits. It does not scan old conversations or import personal logs. The private store is `<data>/brain/evidence.sqlite3` (directory 0700, database 0600), independent of project Git. No dependency or model download is needed.

Selection is deterministic: two distinct failures of the same signature produce one recurring observation; replaying the same event does not increase the count. A failing test, a later passing run of the same invocation in the same request, and Gate's verified commit receipt produce a verified regression record. This records the measured sequence, not an inferred root cause or prose recipe. The receipt applies only to the runner Gate verified. A later failure contradicts the record. Entries expire from normal retrieval after 30 days; source invalidation makes dependent entries stale. History is retained, including rejection and category corrections. Recurrence counts retain at most 16 example references per entry; invalidating older contributing sources still makes the entry stale. Fresh, disjoint Red/Green evidence and a different verified commit may revalidate a stale record; replaying old evidence cannot. Project scopes are isolated and there is no automatic cross-project sharing or insertion into AI instructions.

Only identifiers/digests, categories, timestamps, recurrence, statuses and safe evidence references enter this new database. Commands, arguments, outputs, prompts and Markdown bodies are not copied. Existing test/audit logs retain their existing behavior; this feature does not retroactively sanitize those logs. References can stop resolving when original logs rotate; retained evidence metadata is not a promise of permanent raw-log availability. No secrets are inferred or saved as preferences. Hashing is identification, not encryption.

Code categorizes test regressions as testing and refusals as workflow recovery. Allowlisted structural traits (runtime, network, filesystem, test runner, skill run, app block, project document) settle unambiguous signals in code. An optional injected Laya classifier handles unresolved combinations only when supplied an explicit, externally calibrated version/threshold policy; missing, invalid, low-confidence or unavailable classifications remain unclassified. No production calibration exists yet, so automatic runtime producers use code only. System 2 never selects, verifies, categorizes or promotes these records. The curator does not edit skills, configuration, permissions or the brain's Markdown files.

The global 10,000-event budget stops new ingestion without deleting history. SQLite transactions serialize concurrent writers; unavailable/locked/corrupt storage skips collection and cannot fail the original Gate operation. There is no unbounded retry or background model call on the hot path. Pausing is persistent; paused events are not queued for later replay. A source correction/removal must explicitly invalidate its source reference through the maintenance operation; no filesystem watcher is claimed. Path-based project scope is canonicalized, but moving a project currently needs an explicit migration; stable project-ID mapping remains integration work.

Local inspection/maintenance (use your data directory explicitly; examples below use scratch):

```sh
python3 -m harness.learning --data /tmp/scratch-data list --project /tmp/scratch-project
python3 -m harness.learning --data /tmp/scratch-data evidence --project /tmp/scratch-project --id ENTRY_ID
python3 -m harness.learning --data /tmp/scratch-data history --project /tmp/scratch-project --id ENTRY_ID
python3 -m harness.learning --data /tmp/scratch-data status
python3 -m harness.learning --data /tmp/scratch-data pause
python3 -m harness.learning --data /tmp/scratch-data resume
python3 -m harness.learning --data /tmp/scratch-data categorize --project /tmp/scratch-project --id ENTRY_ID --category testing
python3 -m harness.learning --data /tmp/scratch-data reject --project /tmp/scratch-project --id ENTRY_ID
python3 -m harness.learning --data /tmp/scratch-data restore --project /tmp/scratch-project --id ENTRY_ID
python3 -m harness.learning --data /tmp/scratch-data invalidate --project /tmp/scratch-project --source SOURCE_ID
```

`list --all` includes inactive records; `--limit` bounds retrieval (default 20, maximum 1000). `SOURCE_ID` is the original test-run ID, Gate event number or commit revision; the evidence operation gives the typed reference. Restore only reverses an explicit rejection of still-current evidence, never expiry, invalidation or contradiction. All commands operate on operational evidence only. New brain UI, durable lesson/skill promotion and configuration inheritance remain design/integration work under tasks 338–342.

Verification: `python3 -m unittest tests.test_learning tests.test_protocol tests.test_paperwork`. The curator tests use scratch data, a fake classifier and a real scratch Git verification/commit; no personal projects, network or model downloads.


## Claude review checklist

- Review `observe` as a trusted internal producer API, not an agent-callable proof endpoint. Direct model claims must never issue a verified commit receipt.
- Check the exact-runner/request pairing, event order, later failure handling, stale revalidation and rejection restore rules; run the adversarial regression cases.
- Inspect privacy at the new database boundary and scope canonicalization. Hashes are not anonymization guarantees; no raw logs should be attached to a public review.
- Inspect SQLite transaction contention, capacity behavior and failure isolation. The current budget stops ingestion safely rather than automatically archiving; `status` exposes saturation.
- The 36 tests are a curated scratch regression set, not a measured real-world semantic-classification benchmark. Production Laya calibration is explicitly still pending in task 339.
- Review the separate cache fix: only newly initialized repositories get local excludes, tracked caches remain work, and `.py` source under `__pycache__` remains visible.
- Brain UI, cross-project knowledge promotion, project-ID migration, source-change watching and ICM skill integration remain open. Do not present operational observations as approved instructions or a complete second brain.
