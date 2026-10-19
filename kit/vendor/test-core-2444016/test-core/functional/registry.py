"""The step registry: a fixed vocabulary of step phrases, each bound to one function per test level.

    from functional import Registry

    steps = Registry()

    @steps.step("When I add the task {title}", level="e2e")
    def add_task_in_the_browser(world, title):
        ...

    @steps.step("When I add the task {title}", level="unit")
    def add_task_to_the_list(world, title):
        ...

One phrase, one meaning; it may have one function per level (unit, integration, e2e). Registries compose:
`Registry(app_steps, log_in.steps, data_table.steps)` is every step of the three. An unknown step fails with the
nearest known steps; a known step with no function at the level asked for says which levels it has.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Callable

from .gherkin import LEVELS, compile_pattern, match_pattern, unknown_step_message


class UnknownStep(LookupError):
    """The step is not in the vocabulary. The message lists the nearest known steps."""


class AmbiguousStep(LookupError):
    """Two step phrases match the same words: the vocabulary must give each step one meaning."""


class StepNotAtLevel(LookupError):
    """The step is known, but has no function at this level."""


def _levels(level) -> tuple[str, ...]:
    levels = (level,) if isinstance(level, str) else tuple(level)
    unknown = [lv for lv in levels if lv not in LEVELS]
    if unknown or not levels:
        raise ValueError(f"level must be among {', '.join(LEVELS)}: got {level!r}")
    return levels


@dataclass
class Definition:
    pattern: str
    fn: Callable
    levels: tuple[str, ...]
    block: str | None = None
    help: str | None = None
    compiled: tuple = field(default=None, repr=False)

    def __post_init__(self):
        if self.compiled is None:
            self.compiled = compile_pattern(self.pattern)

    @property
    def params(self) -> list[str]:
        return self.compiled[1]


class Registry:
    def __init__(self, *include: "Registry", block: str | None = None):
        self.block = block
        self.definitions: list[Definition] = []
        for other in include:
            self.include(other)

    # ------------------------------------------------------------ building

    def step(self, pattern: str, *, level=LEVELS, help: str | None = None) -> Callable:
        """Decorator: bind a step phrase to a function `fn(world, **values)` at one or more levels."""
        def register(fn: Callable) -> Callable:
            self.add(pattern, fn, level=level, help=help)
            return fn
        return register

    def add(self, pattern: str, fn: Callable, *, level=LEVELS, block: str | None = None, help: str | None = None) -> Definition:
        definition = Definition(pattern.strip(), fn, _levels(level), block or self.block, help)
        for other in self.definitions:
            if other.pattern == definition.pattern and set(other.levels) & set(definition.levels):
                both = sorted(set(other.levels) & set(definition.levels))
                raise ValueError(f"step {definition.pattern!r} is already registered at {', '.join(both)}")
        self.definitions.append(definition)
        return definition

    def include(self, other: "Registry") -> "Registry":
        """Add every step of another registry (a block's, a project's). Returns self."""
        for definition in other.definitions:
            self.add(definition.pattern, definition.fn, level=definition.levels, block=definition.block,
                     help=definition.help)
        return self

    # ------------------------------------------------------------ reading

    def patterns(self, level: str | None = None) -> list[str]:
        """Every known step phrase, in the order registered (once each)."""
        return list(dict.fromkeys(d.pattern for d in self.definitions if level is None or level in d.levels))

    def levels_of(self, pattern: str) -> list[str]:
        return [lv for lv in LEVELS if any(d.pattern == pattern and lv in d.levels for d in self.definitions)]

    def find(self, step: str, level: str) -> tuple[Definition, dict]:
        """The definition and the values for a step at a level. Raises UnknownStep, AmbiguousStep, StepNotAtLevel."""
        _levels(level)
        matched: dict[str, tuple[list[Definition], dict]] = {}
        for definition in self.definitions:
            values = match_pattern(definition.compiled, step)
            if values is not None:
                matched.setdefault(definition.pattern, ([], values))[0].append(definition)
        if not matched:
            raise UnknownStep(unknown_step_message(step, self.patterns()))
        if len(matched) > 1:
            listed = "\n".join(f"  - {p}" for p in matched)
            raise AmbiguousStep(f"step {step!r} matches more than one known step:\n{listed}")
        pattern, (definitions, values) = next(iter(matched.items()))
        for definition in definitions:
            if level in definition.levels:
                return definition, values
        raise StepNotAtLevel(f"step {pattern!r} has no {level} implementation (it has: {', '.join(self.levels_of(pattern))})")

    def vocabulary(self, name: str = "") -> dict:
        """The registry as a step-vocabulary file (functional/README.md, "Vocabulary files")."""
        steps = []
        for pattern in self.patterns():
            first = next(d for d in self.definitions if d.pattern == pattern)
            entry = {"step": pattern, "levels": self.levels_of(pattern)}
            if first.block:
                entry["block"] = first.block
            if first.help:
                entry["help"] = first.help
            steps.append(entry)
        return {"name": name, "steps": steps}

    def check_vocabulary(self, vocabulary: dict) -> list[str]:
        """Differences between a vocabulary file and this registry: missing steps, missing levels, extra steps."""
        problems = []
        default_levels = vocabulary.get("levels", list(LEVELS))
        known = set(self.patterns())
        listed = set()
        for entry in vocabulary.get("steps", []):
            pattern = entry["step"]
            listed.add(pattern)
            if pattern not in known:
                problems.append(f"no function for the step {pattern!r}")
                continue
            missing = [lv for lv in entry.get("levels", default_levels) if lv not in self.levels_of(pattern)]
            if missing:
                problems.append(f"the step {pattern!r} has no function at {', '.join(missing)}")
        for pattern in self.patterns():
            if pattern not in listed:
                problems.append(f"the step {pattern!r} is not in the vocabulary file")
        return problems
