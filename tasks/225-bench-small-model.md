# 225: The bench with a 4-billion model: how far the harness carries a small model

Kind: chore

The person, 2026-10-15: "for our benchmark I would like to see how far we could push the 'harness matters more than the
model' philosophy and try our benchmark with a gemma4 4 billion params."

Gemma 4 has no plain 4b in Ollama; the 4-billion one is e4b. Chosen: `gemma4:e4b-mlx` (9.5 GB, the same MLX build as
the 26b and 27b runs, so only the size changes). Run after the qwen3.8:27b bench (task 197) finishes: Ollama keeps one
model in memory.

- [x] Download `gemma4:e4b-mlx` (approved: "gemma4:e4b-mlx (Recommended)") and check that Ollama reports tools: it does
  (completion, vision, audio, tools, thinking). Its thinking is only on or off (levels: false, true), so any effort turns it on.
- [x] Every scenario, everyday prompts, with the harness: `python3 -m bench run --prompt everyday --model gemma4:e4b-mlx`.
- [x] The same, bare: `--bare`.
- [x] Compare with qwen3.8:27b-mlx and gemma4:26b-mlx: solved, first try, verified, wake-ups, refusals; what the harness
  added at each size; where the small model fails in ways the harness could catch (lessons for docs/lessons).

## Results (build 467b226, 2026-10-15, 21:15-21:35)

| | gemma4:e4b bare | gemma4:e4b harness | qwen3.8:27b bare | qwen3.8:27b harness |
|---|---|---|---|---|
| resolved | 3/8 (+1 solved but broke tests) | 2/8 | 5/8 | 6/8 |
| verified and committed | 0 | 2 | 0 | 3 |
| typical time | 0-1 min | 0-1 min (one 6 min) | 1-60 min | 2-60 min |

The small model gives up, and the harness lets it: every e4b run "completed" in about a minute, with 0 wake-ups.

- **It stops after saying what it will do.** "I will start Task 2 by reading `text.py`…" then the turn ends (feature-slugify,
  harness). Bare: "First, I'm targeting `showView(next)`…<channel|>" and nothing more.
- **It writes a tool call as text.** bug-pagination: `` `bash{command: "ls -F"}` `` in the reply, 0 tool calls. Ollama
  itself returns real tool calls for this model on a short request; inside Pi's long prompt it drifts.
- **Exact edits defeat it.** history-page-lifts: 7 Gate refusals, G-004 (an edit's old text must match the file exactly
  once); it gave up calling Gate the blocker.
- **Why no wake-up:** the harness wakes Pi only when code changed and is not verified (G-012, plan 184). A model that
  stops before changing anything is never woken.

Where the harness could carry a small model (proposed, not built):

1. Stopped without acting: the reply announces the next step ("I will…", "First,…", "Let me…") or holds a tool call
   written as text, and nothing changed: wake Pi with what happened ("Nothing ran: your tool call was written as
   text." / "You said you would read text.py; do it now.").
2. G-004 after a repeat on the same file: the refusal shows the file's current lines closest to the attempted old text,
   so the model can copy them exactly.
3. Leaked template tokens (`<channel|>`) stripped from the answer and counted as a sign of a broken turn.

Then the same bench again on the new build, e4b and 27b, to see that it helps the small model without hurting the big one.
