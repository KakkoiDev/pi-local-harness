# 67: Parallel inference experiment

Kind: code

Request 2026-10-13: "I will wait for the MLX fix. and docuemnt this to remember to check next time. set the 2 prompt test experiment. will run later. document well."

- [x] Red: `tests/test_parallel_experiment.py` (overlap and verdict of two generation intervals).
- [x] `experiments/parallel_inference/run.py`: warm-up, one prompt alone, two prompts at once; prints tok/s, overlap, verdict.
- [x] `experiments/parallel_inference/README.md`: known facts with sources, 1/4-context limits, run steps, "Check next time" list.
- [ ] User runs it after the MLX fix (ollama/ollama PR #17317) ships; result recorded under Results.
