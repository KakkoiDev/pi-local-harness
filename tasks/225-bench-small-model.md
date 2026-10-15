# 225: The bench with a 4-billion model: how far the harness carries a small model

Kind: chore

The person, 2026-10-15: "for our benchmark I would like to see how far we could push the 'harness matters more than the
model' philosophy and try our benchmark with a gemma4 4 billion params."

Gemma 4 has no plain 4b in Ollama; the 4-billion one is e4b. Chosen: `gemma4:e4b-mlx` (9.5 GB, the same MLX build as
the 26b and 27b runs, so only the size changes). Run after the qwen3.8:27b bench (task 197) finishes: Ollama keeps one
model in memory.

- [ ] Download `gemma4:e4b-mlx` (approved: "gemma4:e4b-mlx (Recommended)") and check that Ollama reports tools.
- [ ] Every scenario, everyday prompts, with the harness: `python3 -m bench run --prompt everyday --model gemma4:e4b-mlx`.
- [ ] The same, bare: `--bare`.
- [ ] Compare with qwen3.8:27b-mlx and gemma4:26b-mlx: solved, first try, verified, wake-ups, refusals; what the harness
  added at each size; where the small model fails in ways the harness could catch (lessons for docs/lessons).
