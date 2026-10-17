# 244: Bench the updated harness on three models, keep the records, publish the table in the README

Kind: chore

The person, 2026-10-16: "I also want GPT sol to run new benchmarks with our updated harness and keep all the artifacts
in the project like we did and publish the performance on the readme page as a table with: our 4b and 27b models,
luna benching too"; "luna is chat gpt luna, the haiku equivalent in ChatGPT"; DeepSeek Flash later (task 245).

Run it after tasks 227 (the early commit), 228 (test-run log), 235 (the pong scenario), 236-238 (plan mode,
auto-accept) and 241 (small-model wake-ups) are done: the point is to measure the updated harness.

## The models

| Name in the table | Model | Where it runs |
|---|---|---|
| Gemma 4 e4b (4B) | `gemma4:e4b-mlx` | Ollama, this Mac (installed) |
| Qwen 3.8 27B | `qwen3.8:27b-mlx` | Ollama, this Mac (installed) |
| ChatGPT Luna | OpenAI's small, fast model ("the Haiku equivalent in ChatGPT", the person, 2026-10-16). Its exact API id: list the models the key can use (`GET https://api.openai.com/v1/models`, or Pi's own model list for its OpenAI provider) and pick the one named Luna; if none or several match, ask the person. | OpenAI's API (a key the person sets) |

DeepSeek Flash comes later, in its own task (245), once the person has set it up.

## The OpenAI key (never in the repo, never in a chat or a log)

- The person sets it themselves, in their own shell or Pi's own settings, e.g. `export OPENAI_API_KEY=…` in their
  shell profile (check the exact variable Pi reads for OpenAI in Pi's documentation: `pi --help`, or Pi's docs). Ask
  the person to set it; do not ask them to paste it to you.
- Check it works with one tiny request through Pi, without printing the key.
- grep the repo and the bench records for the key before every commit (`git diff --cached | grep -c <first 6 chars>`
  must be 0; better, grep for `sk-`).
- An API run costs money: tell the person the number of runs (scenarios × modes × repeats) before starting.

## Steps

- [ ] The person has set the OpenAI key; Luna's exact API id found (see the table) and checked with one tiny request.
- [ ] For each model, with the same harness build (record its commit): every scenario (`python3 -m bench list`, the
  pong one included), everyday prompts, with the harness and bare:
  `python3 -m bench run --prompt everyday --model <model>` then the same with `--bare`. Auto-accept on (the bench does
  it, task 238). Run from the person's checkout only if they ask; otherwise from the worktree, with the results in the
  default data folder (~/pi-local-harness-data/bench), as before.
- [x] Keep the records in the repo, as the person asked: `docs/bench/<date>/` with, per run, `result.json`,
  `answer.md`, `request-*.md`, `git-log.txt` and the test-run log (task 228); plus `results.jsonl` (the lines of these
  runs) and `compare-<model>.txt` (`python3 -m bench compare --model <model>`). **Not** the project copies (`project/`)
  or `services.log` (size, and they may hold paths). Check nothing personal is in them (the person's name, home paths
  outside scratch folders, keys) before committing.
- [x] A results table in README.md, between `<!-- bench:start -->` and `<!-- bench:end -->` under a "How well it works"
  heading: one row per model, columns: model, where it runs, solved with the harness (n/N), solved bare (n/N),
  verified and committed by the harness, median minutes, harness build, date. Under the table, one paragraph in plain
  words on what the harness adds at each size, and a link to `docs/bench/<date>/`. Generate it with a new
  `python3 -m bench readme` (bench/__main__.py) so it can be redone, with a test in tests/test_bench*.py.
- [x] Update task 225 and plan 189 (docs/plans/189-bench.md) with the new numbers and what changed since 2026-10-15.


## Person’s decision · 2026-10-16

Run the two local models and leave Luna pending. Neither OPENAI_API_KEY nor Pi’s OpenAI auth is configured in this environment. Nine scenarios mean 18 runs per local model (harness and bare), 36 local runs total. Luna and its tiny authentication check have not run.

## Runner preparation

- [x] Red: README generation is absent, and a fake-Pi run records the build after launch.
- [x] Generate the README table from everyday results, count resolved runs, use median harness minutes, keep absent models pending and preserve surrounding prose. Record the build before launch and retain full checker logs.
- [x] Green: the seven scratch benchmark tests pass, including idempotent generation and metadata order.

The local batch uses ignored `.bench-local/` in this worktree so its scratch artifacts survive pauses without writing to the person's data folder. Sanitized copies will be published under `docs/bench/`.


## Person’s decision · 2026-10-17

Use the 22 completed records in `.bench-local/244-scored-2026-10-17/` for now. Do not start the remaining 14 runs. The saved batch records build `3847bc1`, high effort, everyday prompts: Gemma has all nine harness and nine bare runs; Qwen has four harness runs and no bare runs. This is a partial historical batch, before the music merge and tasks 247/250/249/248, not a measurement of those later changes. Luna remains pending. Preserve and sanitize these records when publishing task 244 after the roadmap work; label the missing runs explicitly and do not imply a paired Qwen comparison.

## Publication result

The approved 22 historical runs are published under docs/bench/2026-10-17, with sanitized paths, answers, request
records, git logs, checks, reports and available test evidence. Seventeen runs have no saved test-run log; none was
fabricated. Project copies and services.log are excluded. Privacy checks found no personal names/home paths,
credential patterns, email or tailnet addresses. The reproducibility regression failed before publication and passes
afterward, checking counts, per-run records, privacy and the generated README table.

The first two scope boxes stay open: Luna has no configured API key, and the person asked to use only the 22 saved
runs rather than finish the 36 local runs. This historical build is not a measurement of the finished harness.

The naming guard exempts dated benchmark snapshots like closed task records: original tool/file names in evidence
are preserved rather than rewritten. Current runtime files remain covered.
