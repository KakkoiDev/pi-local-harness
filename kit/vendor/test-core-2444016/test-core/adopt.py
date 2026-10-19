#!/usr/bin/env python3
"""Adopt test-core in another repository with one command: the tools, the functional library, the generated test
blocks, a CI workflow, a scenarios template and the docs, pinned to this commit.

  python3 adopt/adopt.py TARGET_REPO [--update] [--no-workflow] [--dry-run]
  python3 TARGET_REPO/test-core/adopt.py --verify TARGET_REPO/test-core     # in the adopting repo's CI

Writes into TARGET_REPO:

  test-core/tools/          scenarios.py, e2e_coverage.py, flaky_lint.py, vocab.py, blocks_from_app_blocks.py
  test-core/functional/     primitives -> blocks -> scenarios (Python package `functional`, JavaScript in js/),
                            the generated test blocks (blocks/python, blocks/js, blocks/vocabulary.json), spec.json
  test-core/package.json    {"type": "module"}: the JavaScript files are ES modules whatever the project uses
  test-core/MANIFEST.json   the commit and every copied file's sha256 (what --verify checks)
  test-core/adopt.py        this script, for --verify
  test-core/README.md       how to use it in this repository             (written once, then the project's)
  test-core/vocabulary.json the project's own step vocabulary, empty     (written once, then the project's)
  test-core/scenarios-template.md  a task's `## Scenarios` section       (written once, then the project's)
  .github/workflows/test-core.yml  flaky lint, vocabulary, scenarios, e2e coverage (written once; --no-workflow skips)

Library files (tools, functional, package.json, adopt.py) are test-core's: a second run refuses to change them unless
--update, and --verify fails when someone edited them in place (change test-core instead, then --update). The
project's files are never overwritten. Standard library only.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HERE = Path(__file__).resolve().parent
REPOSITORY = "https://github.com/KakkoiDev/test-core"
TOOLS = ["scenarios.py", "e2e_coverage.py", "flaky_lint.py", "vocab.py", "blocks_from_app_blocks.py"]
FOLDER = "test-core"


def library_files() -> dict[str, Path]:
    """Published path (inside test-core/) -> source file, for every file test-core owns."""
    files = {f"tools/{name}": ROOT / "tools" / name for name in TOOLS}
    for path in sorted((ROOT / "functional").rglob("*")):
        if path.is_file() and "__pycache__" not in path.parts and path.suffix in (".py", ".js", ".json", ".md"):
            files[f"functional/{path.relative_to(ROOT / 'functional').as_posix()}"] = path
    files["adopt.py"] = HERE / "adopt.py"
    return files


def project_files(workflow: bool) -> dict[str, Path]:
    """Path relative to the target repository -> template, for the files the project owns after the first run."""
    files = {f"{FOLDER}/README.md": HERE / "templates/README.md",
             f"{FOLDER}/vocabulary.json": HERE / "templates/vocabulary.json",
             f"{FOLDER}/scenarios-template.md": HERE / "templates/scenarios-template.md"}
    if workflow:
        files[".github/workflows/test-core.yml"] = HERE / "templates/test-core.yml"
    return files


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def commit() -> str:
    try:
        sha = subprocess.run(["git", "-C", str(ROOT), "rev-parse", "HEAD"], capture_output=True, text=True, check=True).stdout.strip()
        dirty = subprocess.run(["git", "-C", str(ROOT), "status", "--porcelain", "--", "tools", "functional", "adopt"],
                               capture_output=True, text=True, check=True).stdout.strip()
    except (OSError, subprocess.CalledProcessError):
        return "unknown"
    return f"{sha}+local-changes" if dirty else sha


def adopt(target: Path, *, update: bool = False, workflow: bool = True, dry_run: bool = False) -> list[str]:
    """Copy test-core into target. Returns what it did, one line each. Raises SystemExit on a refused change."""
    if not target.is_dir():
        raise SystemExit(f"{target} is not a folder")
    base = target / FOLDER
    library = {path: src.read_bytes() for path, src in library_files().items()}
    library["package.json"] = b'{\n  "type": "module",\n  "private": true\n}\n'
    manifest = {"test-core": REPOSITORY, "commit": commit(),
                "files": {path: sha256(data) for path, data in sorted(library.items())}}
    library["MANIFEST.json"] = (json.dumps(manifest, indent=2) + "\n").encode()
    old_manifest = base / "MANIFEST.json"
    previous = json.loads(old_manifest.read_text(encoding="utf-8"))["files"] if old_manifest.is_file() else {}
    changes = [path for path, data in library.items() if (base / path).is_file() and (base / path).read_bytes() != data]
    if changes and not update:
        listed = "\n  ".join(changes)
        raise SystemExit(f"test-core is already in {target} and these files differ:\n  {listed}\n"
                         "Run again with --update to replace test-core's own files (the project's files stay).")
    done = []
    for path, data in sorted(library.items()):
        target_path = base / path
        if target_path.is_file() and target_path.read_bytes() == data:
            continue
        done.append(f"{'update' if target_path.exists() else 'add'} {FOLDER}/{path}")
        if not dry_run:
            target_path.parent.mkdir(parents=True, exist_ok=True)
            target_path.write_bytes(data)
    for path in sorted(set(previous) - set(library)):  # files this version of test-core no longer has
        if (base / path).is_file():
            done.append(f"remove {FOLDER}/{path}")
            if not dry_run:
                (base / path).unlink()
    for rel, template in project_files(workflow).items():
        target_path = target / rel
        if target_path.exists():
            done.append(f"keep {rel} (the project's)")
            continue
        done.append(f"add {rel}")
        if not dry_run:
            target_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(template, target_path)
    return done


def verify(base: Path) -> list[str]:
    """Problems with an adopted copy: files edited in place or missing (MANIFEST.json says what was copied)."""
    manifest_path = base / "MANIFEST.json"
    if not manifest_path.is_file():
        return [f"{manifest_path} is missing: adopt test-core with adopt/adopt.py"]
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    problems = []
    for path, digest in manifest["files"].items():
        file = base / path
        if not file.is_file():
            problems.append(f"missing: {FOLDER}/{path}")
        elif sha256(file.read_bytes()) != digest:
            problems.append(f"edited in place: {FOLDER}/{path} (change test-core, then adopt.py --update)")
    return problems


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("target", type=Path, nargs="?", help="the repository to adopt test-core in")
    parser.add_argument("--update", action="store_true", help="replace test-core's own files with this version")
    parser.add_argument("--no-workflow", action="store_true", help="do not add .github/workflows/test-core.yml")
    parser.add_argument("--dry-run", action="store_true", help="print what would change, change nothing")
    parser.add_argument("--verify", type=Path, metavar="TEST_CORE_FOLDER", help="check an adopted copy against its manifest")
    args = parser.parse_args(argv)
    if args.verify:
        problems = verify(args.verify)
        manifest = args.verify / "MANIFEST.json"
        pinned = json.loads(manifest.read_text())["commit"] if manifest.is_file() else "?"
        for problem in problems:
            print(problem)
        print(f"test-core {pinned}: " + ("every file as copied." if not problems else f"{len(problems)} problem(s)."))
        return 1 if problems else 0
    if args.target is None:
        parser.error("give the repository to adopt test-core in, or --verify FOLDER")
    for line in adopt(args.target, update=args.update, workflow=not args.no_workflow, dry_run=args.dry_run):
        print(line)
    print(f"test-core {commit()} {'would be' if args.dry_run else 'is'} in {args.target / FOLDER}. "
          f"Next: read {FOLDER}/README.md.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
