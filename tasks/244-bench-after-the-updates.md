# 244: Bench the updated harness on four models, keep the records, publish the table in the README

Kind: chore

The person, 2026-10-16: "I also want GPT sol to run new benchmarks with our updated harness and keep all the artifacts
in the project like we did and publish the performance on the readme page as a table with: our 4b and 27b models,
luna benching too" and "I also want to do the benching with deepseek flash, I will provide a key".

Run it after tasks 227 (the early commit), 228 (test-run log), 235 (the pong scenario), 236-238 (plan mode,
auto-accept) and 241 (small-model wake-ups) are done: the point is to measure the updated harness.

## The models

| Name in the table | Model | Where it runs |
|---|---|---|
| Gemma 4 e4b (4B) | `gemma4:e4b-mlx` | Ollama, this Mac (installed) |
| Qwen 3.8 27B | `qwen3.8:27b-mlx` | Ollama, this Mac (installed) |
| Luna | **to confirm with the person**: the exact model name and where it runs. Do not guess. | ? |
| DeepSeek Flash | **to confirm**: the exact model id and Pi's provider name for DeepSeek | DeepSeek's API (a key from the person) |

## The DeepSeek key (never in the repo, never in a chat or a log)

- The person sets it themselves, in their own shell or Pi's own settings, e.g. `export DEEPSEEK_API_KEY=…` in their
  shell profile (find the exact variable Pi reads for DeepSeek in Pi's documentation: `pi --help`, or Pi's docs). Ask
  the person to set it; do not ask them to paste it to you.
- Check it works with one tiny request through Pi, without printing the key.
- grep the repo and the bench records for the key before every commit (`git diff --cached | grep -c <first 6 chars>`
  must be 0; better, grep for `sk-`).
- An API run costs money: tell the person the number of runs (scenarios × modes × repeats) before starting.

## Steps

- [ ] Confirm Luna and the DeepSeek model id with the person; the key is set by the person.
- [ ] For each model, with the same harness build (record its commit): every scenario (`python3 -m bench list`, the
  pong one included), everyday prompts, with the harness and bare:
  `python3 -m bench run --prompt everyday --model <model>` then the same with `--bare`. Auto-accept on (the bench does
  it, task 238). Run from the person's checkout only if they ask; otherwise from the worktree, with the results in the
  default data folder (~/pi-local-harness-data/bench), as before.
- [ ] Keep the records in the repo, as the person asked: `docs/bench/<date>/` with, per run, `result.json`,
  `answer.md`, `request-*.md`, `git-log.txt` and the test-run log (task 228); plus `results.jsonl` (the lines of these
  runs) and `compare-<model>.txt` (`python3 -m bench compare --model <model>`). **Not** the project copies (`project/`)
  or `services.log` (size, and they may hold paths). Check nothing personal is in them (the person's name, home paths
  outside scratch folders, keys) before committing.
- [ ] A results table in README.md, between `<!-- bench:start -->` and `<!-- bench:end -->` under a "How well it works"
  heading: one row per model, columns: model, where it runs, solved with the harness (n/N), solved bare (n/N),
  verified and committed by the harness, median minutes, harness build, date. Under the table, one paragraph in plain
  words on what the harness adds at each size, and a link to `docs/bench/<date>/`. Generate it with a new
  `python3 -m bench readme` (bench/__main__.py) so it can be redone, with a test in tests/test_bench*.py.
- [ ] Update task 225 and plan 189 (docs/plans/189-bench.md) with the new numbers and what changed since 2026-10-15.
