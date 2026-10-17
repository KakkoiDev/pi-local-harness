# 248: The design system is "Pi Workbench 1-bit" (the project stays "Pi Workbench")

Kind: docs

The person, 2026-10-17: "design system: Pi Workbench 1-bit. We keep the project name as is." and "No, the project is
'Pi Workbench'". The design system's old name "Pi Workbench System 1" clashed with the constitution's System 1.

**Only the design system's name changes.** The project, the app, the README title, the window titles and every other
"Pi Workbench" stay exactly as they are. The repository folder and package names (pi-local-harness, plh) stay too.

- [x] Replace exactly these strings, and only where they name the design system:
  - "Pi Workbench System 1" → "Pi Workbench 1-bit"
  - "System 1 design" / "the System 1 design system" / "1-bit System 1" → "the Pi Workbench 1-bit design" (adapt the
    sentence so it reads naturally)
  Find them with `git grep -n "System 1"` and read each hit: if it means the constitution's System 1 (code and Laya
  deciding), leave it.
- [x] Places to expect them: DESIGN.md, design/README.md (its own text, not the designer's copies), docs/,
  docs/reference.md, harness/, tests, README.md.
- [x] Do not edit the designer's copies (design/canvas/*, design/system/*, design/IMPLEMENTATION.md): the designer
  renames the design-system document itself; after the person tells them, re-sync.
- [x] Green: `python3 tests/verify_workflow.py`.

## Result

Renamed the repository-owned design references and historical design-task headings. The app title, package names,
constitution and runtime System 1 terminology remain unchanged. Designer copies await the designer’s re-sync.
The branding regression failed before the rename and passes afterward; the full workflow gate checks this commit.
