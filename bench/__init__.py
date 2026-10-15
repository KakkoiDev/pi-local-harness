"""The bench (plan 189): fixed scenarios run with the real model through the real harness, to measure the product.

A scenario (bench/scenarios/<id>/) is a starting project, the prompt Pi gets, a hidden check Pi never sees, and a
reference solution (the check must fail on the project and pass on the solution, so the scenario is fair). A run starts a
scratch workbench from this checkout (temporary data folder; the real Pi and the real Ollama model), sends the prompt,
waits for the request to end, runs the hidden check and records one result line with the model, the harness build and
what happened: solved, verified and committed by the harness, wake-ups, recoveries, rules that sent something back, Gate
failures, tool calls, duration.

    python3 -m bench list
    python3 -m bench check                      # every scenario is fair (no model)
    python3 -m bench run [ids…] [--model M] [--effort E] [--repeat N]
    python3 -m bench report

Results: <data>/bench/results.jsonl and one folder per run (the project as Pi left it, the answer, the request record,
reports and Gate's history). In terminal Pi: /bench.
"""
