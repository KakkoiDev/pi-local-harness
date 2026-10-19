"""Recipe scenario-steps, unit level: the scenarios of the example task against the pure task list.

One test per scenario, named after its title (test_add_a_task); no browser, no server."""
from pathlib import Path

from functional import scenario_tests
from task_steps import steps

TASK = Path(__file__).resolve().parents[2] / "shared" / "task-example.md"

globals().update(scenario_tests(TASK, level="unit", registry=steps))
