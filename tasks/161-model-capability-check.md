# 161: Measure whether a model answers two requests at once

Kind: code

Request 2026-10-14: "Or we could do it the first time ever the model is loaded (missing data) and have a plh cli way of updating it later in the terminal." Plan 156 § 7 (phase 1), console command from plan 158.

- [x] Red (python, `tests/test_capability.py`, a fake Ollama that answers one request at a time or several): `harness/capability.py` measures the overlap of two short prompts sent together (warm-up, one alone, two at once) and says "parallel", "partly parallel" or "one at a time"; the result is stored in `<data>/model-capabilities.json` with the model digest, Ollama version and `OLLAMA_NUM_PARALLEL`, and becomes "unknown" when one of them changes.
- [x] Console: `/models` has an "at once" column; `/models check [name] [--all] [--force]` measures (the chosen model by default; a matching result is kept unless --force; refused while Pi works; notes when OLLAMA_NUM_PARALLEL allows only one).
- [x] The workbench measures the chosen model by itself when it starts and after a model switch, the first time (no matching result), only while nothing runs; the queue waits meanwhile. `/api/models` lists `at_once` per model, for the model menu once drawn.
- [x] `experiments/parallel_inference/run.py` uses the same measurement code (`harness/capability.py`); its own test still passes.
- [x] Not run against the real Ollama here (it loads a 26B model for about a minute): `/models check` in terminal Pi does it.
- [x] Green: verify_workflow.
