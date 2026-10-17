# Saved benchmark · 2026-10-17

These are the 22 saved runs the person approved for publication, not a new benchmark. Build **3847bc1**, high effort,
everyday prompts, nine scenarios (including Pong). They predate the music merge, explicit phases, Laya and decision
provenance. They do not measure the current installed build.

| Model | Mode | Resolved | Verified and committed | Runs saved / planned |
|---|---|---|---|---|
| Gemma 4 e4b | Harness | 2/9 | 3/9 | 9/9 |
| Gemma 4 e4b | Bare | 2/9 | 0/9 | 9/9 |
| Qwen 3.8 27B | Harness | 3/4 | 2/4 | 4/9 |
| Qwen 3.8 27B | Bare | Pending | Pending | 0/9 |
| ChatGPT Luna | Both | Pending | Pending | 0/18 |

“Resolved” means the independent scenario check and available regression tests passed on the final files. “Verified
and committed” records the harness's own test/commit outcome; it is a different measure and can exceed resolved.
A timed-out run may still resolve the independent final check. See each result's `status` and `timed_out`; no failures
or timeouts were filtered out. The tiny single-run sample per scenario does not establish repeatability.

Gemma resolves two scenarios in each mode: this batch shows no solve-rate gain from the harness. Qwen's four harness
runs are an incomplete sample without a bare control; they do not establish a harness improvement or a model ranking.
Fourteen local runs remain missing by the person's decision. Luna awaits the person's API setup; no authentication
check or paid runs were made. No historical decision provenance exists, so model decision share is **Not recorded**.

[All result lines](results.jsonl), [Gemma comparison](compare-gemma4_e4b-mlx.txt),
[Qwen comparison](compare-qwen3.8_27b-mlx.txt). Each `runs/` directory keeps `result.json`, `answer.md`, `request-*.md`,
`git-log.txt`, independent check/regression output, available reports and available test-run evidence. Seventeen runs
have no saved `test-runs.jsonl`; that absence is preserved. The twelve recorded test-output files are retained.
No project copies or service logs are published. Personal home paths become `<home>`, the source checkout becomes
`<harness>`, and scratch paths use `/tmp/`. Metrics, run IDs, timestamps, build IDs and recorded outcomes are preserved.

Regenerate the top-level README table, without running models:

```sh
python3 -m bench readme --out docs/bench/2026-10-17
```

Historical filenames and transcript whitespace are kept as evidence; they are not current runtime naming.
