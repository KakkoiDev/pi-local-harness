"""Recipe scenario-steps, e2e level: the same scenarios in a real browser against the app on a free port.

page comes from pytest-playwright, app_url from conftest.py (recipe fixtures)."""
from pathlib import Path

from functional import scenario_tests
from task_steps import steps

TASK = Path(__file__).resolve().parents[2] / "shared" / "task-example.md"


def world(page, app_url):
    return {"page": page, "base_url": app_url}


globals().update(scenario_tests(TASK, level="e2e", registry=steps, world=world))
