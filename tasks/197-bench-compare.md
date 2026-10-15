# 197: The bench compares no harness with the harness, side by side

Kind: code

Request 2026-10-15: "I like the 'no harness vs harness' comparison, let's definitely do that on our own benches!"

- [x] Red (python, test_bench): one row per scenario and one column per condition (bare first, then each harness
  build), each cell the outcome of its runs (✓ resolved, ~ solved but its regression tests broke, ✗) with minutes and
  first tries, and a resolved total per column.
- [x] `python3 -m bench compare [--model M] [--prompt level]`.
- [ ] Runs: the baseline (harness, build f5fa6b5), the new build and bare mode on the same eight scenarios, everyday
  prompts; the comparison reported.
