"""Make a new project on the stack (plan 198): the starter, with the kit's pinned htmx and Basecoat copied in.

    python3 kit/new_project.py <folder>             # a server app (FastAPI, SQLite); its README has the commands
    python3 kit/new_project.py --static <folder>    # an app with no server (browser only, GitHub Pages)
    python3 kit/new_project.py --tui <folder>       # a terminal app (Textual; in a browser through textual-serve)
"""
import json
import shutil
import subprocess
import sys
from pathlib import Path

try:
    from .publish_audit import ensure_task
except ImportError:  # the standalone kit/new_project.py command
    from publish_audit import ensure_task

KIT = Path(__file__).resolve().parent


def library(name: str) -> Path:
    found = next(item for item in json.loads((KIT / "libraries.json").read_text())["libraries"] if item["name"] == name)
    return KIT / found["folder"]


def add_test_core(folder: Path) -> list[str]:
    """Task 332: test-core in every project, as test-core's adopt kit lays it out (`test-core/`: the tools, the
    `functional` library with the test blocks generated from App Blocks, MANIFEST.json for `adopt.py --verify`, its
    licence and the shared accessibility check). The project's own checks (tests/test_protocol.py or
    tests/protocol.test.mjs) run its tools offline. Files already there are kept. Returns what it added."""
    source, added = library("test-core") / "test-core", []
    for path in sorted(item for item in source.rglob("*") if item.is_file() and "__pycache__" not in item.parts):
        target = folder / "test-core" / path.relative_to(source)
        if not target.exists():
            target.parent.mkdir(parents=True, exist_ok=True); shutil.copy(path, target); added.append(target.relative_to(folder).as_posix())
    return added


def initial_plan(name: str) -> dict[str, str]:
    """The same first planning task in the web workbench and runtime benchmarks."""
    return {'ROADMAP.md':f'# {name} roadmap\n\n## Goal\n\nDescribe what we are building.\n\n## Tasks\n\n- [ ] [001-Plan this app](tasks/001-first-task.md)\n',
                  'tasks/001-first-task.md':'# 001: Plan this app\n\nKind: planning\n\n- [ ] Discuss who uses it, screens, rules, data and language\n- [ ] Write the Goal and real tasks, each with Done when\n- [ ] Ask for plan approval before code\n\nDone when: The person has approved the app plan.\n'}


def start_history(folder: Path, message: str = "Start from the Pi Workbench starter") -> None:
    """A repository with a first commit: the harness commits each verified request, which needs one."""
    ensure_task(folder)
    git = ["git", "-C", str(folder), "-c", "user.name=Pi Workbench", "-c", "user.email=pi-workbench@localhost"]
    subprocess.run([*git, "init", "-q", "-b", "main"], check=True)
    subprocess.run([*git, "add", "-A"], check=True)
    subprocess.run([*git, "commit", "-q", "-m", message], check=True)


def new_project(folder: Path, static: bool = False, files: dict[str, str] | None = None, tui: bool = False, history: bool = True) -> Path:
    """`files`: more files to write before the first commit (the workbench's roadmap and first task). history=False leaves
    the first commit to the caller (Project Start commits only after the base's tests pass: kit/capabilities.py)."""
    if folder.exists() and any(folder.iterdir()):
        raise SystemExit(f"{folder} is not empty; choose a new folder.")
    shutil.copytree(KIT / ("starter-tui" if tui else "starter-static" if static else "starter"), folder, dirs_exist_ok=True, ignore=shutil.ignore_patterns(".venv", "__pycache__", "node_modules", "data.sqlite3", "app.css"))
    for name, text in (files or {}).items():
        (folder / name).parent.mkdir(parents=True, exist_ok=True); (folder / name).write_text(text, encoding="utf-8")
    add_test_core(folder)
    if tui:  # a terminal app: no web libraries
        if history: start_history(folder)
        return folder
    htmx, basecoat = library("htmx"), library("basecoat")
    if static:  # no server: no htmx (nothing to ask); Basecoat's styles only
        shutil.copytree(basecoat / "css", folder / "vendor" / "basecoat" / "css")
        shutil.copy(basecoat / "LICENSE.md", folder / "vendor" / "basecoat" / "LICENSE.md")
        if history: start_history(folder)
        return folder
    shutil.copy(htmx / "htmx.min.js", folder / "static" / "htmx.min.js")
    shutil.copy(basecoat / "js" / "basecoat.min.js", folder / "static" / "basecoat.min.js")
    shutil.copytree(basecoat / "css", folder / "vendor" / "basecoat" / "css")
    shutil.copy(basecoat / "LICENSE.md", folder / "vendor" / "basecoat" / "LICENSE.md")
    shutil.copy(htmx / "LICENSE", folder / "static" / "htmx.LICENSE")
    if history: start_history(folder)
    return folder


if __name__ == "__main__":
    arguments = [argument for argument in sys.argv[1:] if argument not in ("--static", "--tui")]
    if len(arguments) != 1: raise SystemExit(__doc__)
    print(new_project(Path(arguments[0]).resolve(), static="--static" in sys.argv, tui="--tui" in sys.argv))
