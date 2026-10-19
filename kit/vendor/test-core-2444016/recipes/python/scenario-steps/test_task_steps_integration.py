"""Recipe scenario-steps, integration level: the same scenarios against the routes and a real database file.

The world's parameters are pytest fixtures: tmp_path holds the test's own database."""
from pathlib import Path

from functional import scenario_tests
from task_steps import steps

TASK = Path(__file__).resolve().parents[2] / "shared" / "task-example.md"


def world(tmp_path):
    return {"tmp_path": tmp_path}


globals().update(scenario_tests(TASK, level="integration", registry=steps, world=world))
