# Plan 189: The bench: measure the model and the harness on fixed scenarios

Request 2026-10-15: "Build a benching module. Give prompts that will be passed. Let's start benching, with model and pi
local harness version to collect data to improve the product." Follows the idea of a deterministic world around a
non-deterministic agent: the scenarios, the checks and the scoring are fixed; only the model and the harness change.

Built (task 189): `bench/` (see `bench/__init__.py`).

## Scenarios (`bench/scenarios/<id>/`)

| Scenario | Kind | Prompt (what Pi gets) | Hidden check | What it exercises |
| --- | --- | --- | --- | --- |
| bug-pagination | bug | "Page 2 of `page()` in pager.py repeats the last item of page 1 … Fix it." | pages 1–5 and another size | reproduce, a failing test first, the fix; paperwork makes a task and commits |
| feature-slugify | feature | "Do task 2." | seven slugify cases | a task the request names (reused, not made); its boxes |
| ui-page-lifts | bug | "At a window 1024 px wide … clicking Add lifts the whole page … Find the cause and fix it." | the browser tool at 1024×560: nothing outside the list scrolls | the browser tool (task 173's pattern); no test suite, so verification is hard |
| docs-readme | docs | "Write README.md: what pager.py does, an example call with its result, how to run the tests." | README names page(), shows a result, says how to test | documentation only: Kind docs, committed without tests |
| refactor-rename | refactor | "Rename area_rect to rectangle_area everywhere … Behaviour must not change." | no area_rect left; the old behaviour under the new name | edits across files; existing tests |

Each also has a reference solution; `python3 -m bench check` proves the check fails at the start and passes with it.

## Prompts: how the request is worded (2026-10-15)

"These are very specific prompts. How about more general prompts? Like what I'm doing with you in this chat?" Each
scenario now has up to three wordings: **precise** (names the file and the expected result), **everyday** (how a person
says it; the default) and **vague** (the symptom). A level is left out where its check would not be fair (a vague "Document
this" cannot be held to the README check). `--prompt` chooses; each result records its level, so the data shows how
much the wording matters.

## History scenarios: the person's own requests

The repository at the commit before a request was done, the person's words verbatim, and a hidden check of the
behaviour they asked for (not the fix's own tests, which name details of one implementation). The real fix, as
`solution.patch`, proves the check fair.

| Scenario | The person's words | Hidden check |
| --- | --- | --- |
| history-page-lifts (task 173) | "The app has a bug. When i'm in the chat view. and i click on show activity next to the chat agent's answer being created. then click on see chat button to go back to the chat then the view is lifted up. there is white at the bottom of the screen." | that commit's workbench at 1024×560 with a long chat: nothing around the thread scrolls |
| history-thinking-off (task 175) | "also, I have a doubt that changing the thinking level in the UI actually changes the model's thinking level." | real Pi with that commit's provider, Off, against a capture endpoint: the request says no thinking |
| history-hide-record (task 172) | "show task record should say: hide task record when the task record is opened. And I find the ui to close the record hard to figure out. are X to close OK in this design system?" | that commit's Activity: after Show Task Record a button says Hide Task Record and hides it |

## First run (2026-10-15): the bench found a harness bug

qwen3.8:27b-mlx (low), precise prompts: 0 of 5, every tool call "Gate is unavailable". The scratch data folder had no
AGENTS.md; the extension read it at session start before setting Gate's port, so the read failed and the port was never
set. Fixed (task 190): the port is set first, a missing memory falls back to the template and is reported, and the
bench seeds AGENTS.md as the installer does. Those five results are in `results.invalid.jsonl` with the reason.

## What others do, taken (task 191)

From SWE-bench, Terminal-Bench, τ-bench and Aider Polyglot:
- **Regression tests** (SWE-bench's PASS_TO_PASS): each scenario names its own existing tests; a run is *resolved* only
  if the hidden check passes and those still pass.
- **Reliability** (τ-bench's pass^k): with `--repeat k`, the share of scenarios resolved in every one of their runs.
- **First try** (Aider's two attempts): resolved with no wake-up, recovery or user reply.
- **The baseline** (Terminal-Bench's neutral agent): `--bare` runs plain Pi with Gate's core safety rules (G-001 to
  G-007) and none of the harness, to show what the harness adds.
- **A scripted user** (τ-bench's simulated user, kept deterministic): when Pi ends by asking the person something, the
  scenario's next reply is sent, up to its replies.

## A run

A scratch workbench from this checkout (temporary data folder, the real `pi`, the real Ollama model from
`<data>/model.json` or `--model`), the prompt as a chat request, a wait for it to end (or the scenario's time limit),
the hidden check. One line in `<data>/bench/results.jsonl`: model, effort, digest, harness build (commit, `-dirty`), Pi
and Ollama versions, status, solved, verified and committed by the harness, the "Not verified" mark, tasks, seconds,
tool calls, failed tools, reports by kind (wake-up, recovery, gate-failed…), rules that sent something back, Gate
checks. One folder per run with the project as Pi left it, the answer, the request record, reports, Gate's history and
the services log, for the analysis.

## Next

- Run every scenario with each installed model; repeat to see the variance (`--repeat 3`).
- Read the runs and turn what goes wrong into lessons and rules; re-run to see the change.
- More scenarios as weaknesses show up (one per lesson).

## Saved follow-up batch · 2026-10-17 (task 244)

[Published records](../bench/2026-10-17/README.md) use build `3847bc1`, high effort and everyday prompts, nine scenarios including Pong.
Gemma e4b resolves 2/9 with the harness and 2/9 bare (3/9 versus 0/9 harness-verified commits). The earlier batch
had eight scenarios: 2/8 with the harness, 3/8 bare; these different suites are not a controlled improvement estimate.
Qwen 27B resolves 3/4 saved harness runs (2/4 verified commits), without a saved bare baseline. Fourteen local runs
were deferred by the person; Luna is pending private API setup. These records predate the music merge and tasks
247/250/249/248. They cannot validate those later changes or show a Qwen improvement. The harness now wakes small
models that stop early and gives edit-match feedback, but this batch does not demonstrate a solve-rate gain.
Missing historical decision provenance stays unrecorded. No additional real model runs were started.
