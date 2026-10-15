# 197: The bench compares no harness with the harness, side by side

Kind: code

Request 2026-10-15: "I like the 'no harness vs harness' comparison, let's definitely do that on our own benches!"

- [x] Red (python, test_bench): one row per scenario and one column per condition (bare first, then each harness
  build), each cell the outcome of its runs (✓ resolved, ~ solved but its regression tests broke, ✗) with minutes and
  first tries, and a resolved total per column.
- [x] `python3 -m bench compare [--model M] [--prompt level]`.
- [x] Runs: the baseline (harness, build f5fa6b5), the new build and bare mode on the same eight scenarios, everyday
  prompts; the comparison reported. qwen3.8:27b-mlx (low), finished 2026-10-15:

  | | bare 467b226 | harness 467b226 | harness f5fa6b5 |
  |---|---|---|---|
  | resolved | 5/8 | 6/8 | 5/8 |
  | verified and committed | 0 (bare does not verify) | 3 | — |

  The harness alone solved ui-page-lifts (36 min, 3 wake-ups, verified); bare stopped at 40 min. Both failed
  history-page-lifts and history-thinking-off; history-hide-record hit the 60-minute limit either way. The harness was
  slower on the three easy ones (3 min vs 1 min). Next: the same with gemma4:e4b-mlx, task 225.
