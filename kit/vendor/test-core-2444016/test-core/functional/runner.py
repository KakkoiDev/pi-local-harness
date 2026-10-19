"""The scenario runner: Given/When/Then text in, registered steps run, at the level asked for.

    from functional import load_scenarios, run_scenario, scenario_tests

    # one scenario, by hand
    for scenario in load_scenarios("tasks/12-add-tasks.md"):
        run_scenario(scenario, level="unit", world={"tasks": []}, registry=steps)

    # pytest: one test per scenario, named after its heading (test_us_12_add_a_task, or test_add_a_task without an
    # id), marked @pytest.mark.scenario(<heading>)
    def e2e_world(page, app_url):                # its parameters are pytest fixtures
        return {"page": page, "base_url": app_url}

    globals().update(scenario_tests("tasks/12-add-tasks.md", level="e2e", world=e2e_world, registry=steps))

Every step of a scenario is looked up before the first one runs: an unknown step fails at once with the nearest known
steps, and nothing is half done.
"""
from __future__ import annotations

import inspect
import re
from pathlib import Path
from types import SimpleNamespace
from typing import Callable

from .gherkin import Scenario, Step, parse_scenarios
from .registry import Definition, Registry


class World(SimpleNamespace):
    """What the steps of one scenario share: the level, the page or client, and whatever the steps put there."""


class StepFailed(AssertionError):
    """A step's function failed; the message says which scenario and which step."""


def load_scenarios(path) -> list[Scenario]:
    path = Path(path)
    scenarios = parse_scenarios(path.read_text(encoding="utf-8"), source=str(path))
    if not scenarios:
        raise ValueError(f"{path}: no scenarios (a `## Scenarios` section with `### <title>` and Given/When/Then lines)")
    return scenarios


def _where(scenario: Scenario, step: Step) -> str:
    return f"{scenario.source}:{step.line}: " if scenario.source else ""


def resolve(scenario: Scenario, registry: Registry, level: str) -> list[tuple[Step, Definition, dict]]:
    """Every step of a scenario with its definition and values. Fails on the first step it cannot run."""
    plan = []
    for step in scenario.steps:
        try:
            definition, values = registry.find(step.full, level)
        except LookupError as error:
            raise type(error)(f'{_where(scenario, step)}scenario "{scenario.name}": {error}') from None
        plan.append((step, definition, values))
    return plan


def run_scenario(scenario: Scenario, *, level: str, registry: Registry, world=None) -> World:
    """Run each step of a scenario at a level ('unit', 'integration' or 'e2e'). Returns the world."""
    if not scenario.steps:
        raise ValueError(f'scenario "{scenario.name}" has no steps')
    plan = resolve(scenario, registry, level)
    if world is None:
        world = World()
    elif isinstance(world, dict):
        world = World(**world)
    world.level = level
    world.scenario = scenario.name
    for step, definition, values in plan:
        try:
            definition.fn(world, **values)
        except Exception as error:
            message = f'{_where(scenario, step)}scenario "{scenario.name}", step "{step.keyword} {step.text}" failed: {error}'
            raise StepFailed(message) from error
    return world


def python_name(title: str) -> str:
    """'Add a task' -> 'test_add_a_task' (the same rule as tools/scenarios.py)."""
    words = re.sub(r"[^\w]+", "_", title.lower(), flags=re.UNICODE).strip("_")
    return f"test_{words}"


def scenario_tests(path, *, level: str, registry: Registry, world: Callable[..., dict] | None = None) -> dict:
    """pytest tests for every scenario of a task file: {'test_add_a_task': <test>, ...} for a module's globals().

    `world`'s parameters are pytest fixtures; it returns the world (a dict) the steps start from."""
    import pytest

    world = world or (lambda: {})
    parameters = [inspect.Parameter(name, inspect.Parameter.POSITIONAL_OR_KEYWORD)
                  for name in inspect.signature(world).parameters]
    tests = {}
    for scenario in load_scenarios(path):
        resolve(scenario, registry, level)  # an unknown step fails at collection, before any test runs
        name = python_name(scenario.name)
        if name in tests:
            raise ValueError(f"{path}: two scenarios make the same test name {name}")

        def test(_scenario=scenario, **fixtures):
            run_scenario(_scenario, level=level, registry=registry, world=world(**fixtures))

        test.__signature__ = inspect.Signature(parameters)
        test.__name__ = test.__qualname__ = name
        test.__doc__ = f"Scenario: {scenario.name} ({level}, {path})"
        tests[name] = pytest.mark.scenario(scenario.name)(test)
    return tests
