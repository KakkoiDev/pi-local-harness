# Pong starter comparison · 16 October 2026

These are the **two retained runs from yesterday**, published at the owner's request on 17 October. The summary was already committed in 5b79f1e. This update adds retained per-run evidence; **no new benchmark was run**.

Everyday prompt, Gemma 4 26B (`gemma4:26b-mlx`), high thinking, Pi 1.1.0, Ollama 0.40.5, model digest f0fc7e0ae494. Recorded harness build: **bcbce0a-dirty**. These are development runs before the completed phase implementation and Laya. The dirty tree is not an exact reproducible committed source snapshot. Do not compare these as if they measured the current release.

| Mode | Solved | Verified / committed | Seconds | Tools | Wake-ups |
|---|---|---|---:|---:|---:|
| Harness | No | No | 554 | 0 | 1 |
| Bare Pi | No | No | 404 | 1 | 0 |

Both stopped at prose plans asking for approval, without implementing the Pong game or making a request commit. The harness issued one no-action wake. This pair does not demonstrate a solve-rate improvement or a statistically reliable speed comparison. Completed job status is not feature success.

The harness diagnostic includes missing generated CSS references. The bare checker’s retained short diagnostic ends in a browser-server broken-pipe message; that alone cannot establish a specific game defect. Lack of implementation and request verification is separately recorded. Do not reconstruct absent full checker output as if it had been retained.

[Machine summary](results.jsonl).

- [Harness run](runs/20261016-184735-feature-pong-starter-gemma4_26b-mlx/result.json), [answer](runs/20261016-184735-feature-pong-starter-gemma4_26b-mlx/answer.md).
- [Bare run](runs/20261016-185651-feature-pong-starter-gemma4_26b-mlx/result.json), [answer](runs/20261016-185651-feature-pong-starter-gemma4_26b-mlx/answer.md).

Each run folder contains result.json, answer.md, request-*.md and git-log.txt, plus the reports.jsonl or gate-events.jsonl available for that run. Neither saved run folder contains a test-runs.jsonl file; both result records have empty test_runs arrays. This absence is preserved. No additional test-run evidence is invented. The git log includes the starter commit and must not be mistaken for a feature implementation commit.

Project copies and services.log remain excluded. Machine-specific source/home paths become <harness>/<home>, and macOS temporary paths become /tmp/. Run IDs, timestamps, metrics, outcomes and model answers are retained. These are synthetic benchmark requests, not the owner's test-project chat logs. The separate [22-run batch](../2026-10-17/README.md) uses other models/build context and is not combined with this pair.
