"""Make a new project on the stack (plan 198): the starter, with the kit's pinned htmx and Basecoat copied in.

    python3 kit/new_project.py <folder>             # a server app (FastAPI, SQLite); its README has the commands
    python3 kit/new_project.py --static <folder>    # an app with no server (browser only, GitHub Pages)
"""
import json
import shutil
import sys
from pathlib import Path

KIT = Path(__file__).resolve().parent


def library(name: str) -> Path:
    found = next(item for item in json.loads((KIT / "libraries.json").read_text())["libraries"] if item["name"] == name)
    return KIT / found["folder"]


def new_project(folder: Path, static: bool = False) -> Path:
    if folder.exists() and any(folder.iterdir()):
        raise SystemExit(f"{folder} is not empty; choose a new folder.")
    shutil.copytree(KIT / ("starter-static" if static else "starter"), folder, dirs_exist_ok=True, ignore=shutil.ignore_patterns(".venv", "__pycache__", "node_modules", "data.sqlite3", "app.css"))
    htmx, basecoat = library("htmx"), library("basecoat")
    if static:  # no server: no htmx (nothing to ask); Basecoat's styles only
        shutil.copytree(basecoat / "css", folder / "vendor" / "basecoat" / "css")
        shutil.copy(basecoat / "LICENSE.md", folder / "vendor" / "basecoat" / "LICENSE.md")
        return folder
    shutil.copy(htmx / "htmx.min.js", folder / "static" / "htmx.min.js")
    shutil.copy(basecoat / "js" / "basecoat.min.js", folder / "static" / "basecoat.min.js")
    shutil.copytree(basecoat / "css", folder / "vendor" / "basecoat" / "css")
    shutil.copy(basecoat / "LICENSE.md", folder / "vendor" / "basecoat" / "LICENSE.md")
    shutil.copy(htmx / "LICENSE", folder / "static" / "htmx.LICENSE")
    return folder


if __name__ == "__main__":
    arguments = [argument for argument in sys.argv[1:] if argument != "--static"]
    if len(arguments) != 1: raise SystemExit(__doc__)
    print(new_project(Path(arguments[0]).resolve(), static="--static" in sys.argv))
