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
