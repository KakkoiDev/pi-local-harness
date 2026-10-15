# 189: The bench: fixed scenarios, the real model, one result line per run

Kind: code

Request 2026-10-15: "Let's do 1 and 2 now. Build a benching module. Give prompts that will be passed. Let's start
benching, with model and pi local harness version to collect data to improve the product." Plan: `docs/plans/189-bench.md`.

- [x] Five scenarios (bug, feature by task, UI bug needing the browser tool, docs, refactor), each with a starting
  project, the prompt, a hidden check and a reference solution.
- [x] Red (python, `tests/test_bench.py`): every scenario is fair (its check fails at the start and passes with the
  solution); a run goes through a scratch workbench (here with the fake Pi) and records one line with the model, the
  harness build, Pi and Ollama versions and what happened, plus a folder; the summary per model and build; `/bench`.
- [x] `bench/` (`python3 -m bench list | check | run | report`), `/bench` in the console (terminal command, console
  guide, FAQ).
- [x] First real run started with the chosen model.
