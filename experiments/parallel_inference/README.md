# Parallel inference on one Ollama model

Status 2026-10-13: set up, not run. Waiting for the MLX runner fix (see "Check next time").

## Question

Can one loaded model answer two requests at the same time, so one chat runs while
an agent implements a task, or two projects run side by side?

## What is known (and how sure)

- Ollama loads the weights once and serves `OLLAMA_NUM_PARALLEL` requests from them.
  Memory for context (KV cache) is reserved per slot: about `OLLAMA_NUM_PARALLEL x context`.
  Source: Ollama FAQ, https://docs.ollama.com/faq (concurrent requests section).
- So 4 slots at 1/4 of the context cost about the same KV memory as 1 slot at full
  context. Weights do not grow. This part is arithmetic, not measured here.
- The MLX runner (our model is `gemma4:26b-mlx`) reportedly processes requests one
  at a time even when `OLLAMA_NUM_PARALLEL` > 1. A fix was reported as open PR
  #17317 on github.com/ollama/ollama as of 2026-08-14. Source is secondary
  (popularai.org/p/ollama-num-parallel-mac-mlx); the PR itself was not read.
  Treat as unverified until checked.

## Limits of the 1/4-context plan

- Pi is told the context size in `harness/provider.mjs` (`contextWindow: 32768`).
  If Ollama gives each slot less, lower that number too, or Pi will overflow the
  slot and Ollama will silently truncate the prompt.
- 1/4 of 32k is 8k. The agent prompt (AGENTS.md, roadmap and task snapshots, tool
  results) likely does not fit in 8k. 2 slots at 16k is the realistic target. Unmeasured.
- Parallel slots share the GPU: each request gets slower. The total may be higher
  than one request alone, or not. The experiment measures exactly this.
- The harness allows one active agent at a time (shared agent lock, tasks/37-home-single-agent.md).
  Chatting during a task, or two projects at once, needs that rule lifted.

## Run it (about 5 minutes)

Ollama here runs as the menu bar app (`/Applications/Ollama.app`), which reads
launchd environment variables.

1. Quit Pi/plh so nothing else uses the model.
2. Set the slots and restart Ollama:
   ```bash
   launchctl setenv OLLAMA_NUM_PARALLEL 2
   ```
   Then quit Ollama from the menu bar and open it again.
3. From the repo root:
   ```bash
   python3 experiments/parallel_inference/run.py --ctx 16384
   ```
   It warms the model, runs one prompt alone (baseline), then two prompts at once.
4. Read the last lines:
   - `overlap: 0% -> SERIALIZED`: the second request waited for the first. The MLX
     fix is not in this Ollama version.
   - `PARALLEL` (overlap at least 50%): both generated together. Compare `combined`
     tok/s with `alone`: above 1.0x means parallel is worth it.
   - `PARTIAL`: some overlap; rerun once before concluding.
5. Paste the output under Results with the date and `ollama --version`.
6. Undo: `launchctl unsetenv OLLAMA_NUM_PARALLEL`, restart Ollama.

Also worth one run: `--ctx 8192` (the 1/4 case) and watch memory in Activity
Monitor during step 3.

## Check next time

1. Open https://github.com/ollama/ollama/pull/17317. Merged? In which release?
2. `ollama --version` here (0.40.3 on 2026-10-13). If older than that release, update.
3. Run the experiment above. Record the result below.
4. If PARALLEL and combined > 1.0x: open a roadmap task to lift the one-agent rule
   and lower `contextWindow` per slot. Otherwise stop here.

## Results

None yet.

## Files

- `run.py`: the experiment, stdlib only. `overlap()` and `verdict()` are tested in
  `tests/test_parallel_experiment.py`.
