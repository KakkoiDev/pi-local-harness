# Core libraries: Claude Code integration handoff

Prepared 2026-10-18. This is an implementation brief, not a claim that new Pi
adapters have shipped. The person wants plain-language creation and conversational
revisions, using free local tools and small models. No MCP server, paid service,
ApfelStrudel UI or new asset editor is required.

## Read first and pin these revisions

Use the existing project architecture, Gate phase/approved-file policy, task
workflow and chat artifact handling. Read [contributing](../contributing-for-agents.md)
and [current music behavior](../music.md) before changing runtime code.

| Library | Exact reviewed commit | Status |
|---|---|---|
| [visual-core](https://github.com/KakkoiDev/visual-core) | `e26efbdb21fd4e2bbfac42b916eaa9ae8ad4c325` | Local UI/assets and bounded terrain generator implemented; Pi adapter pending |
| [coding-core](https://github.com/KakkoiDev/coding-core) | `45a342843d8b0ce064b666bc0a9ee864882dbb1b` | JS/Python functional recipes and copyable pipeline implemented; context integration pending |
| [gaming-core](https://github.com/KakkoiDev/gaming-core) | `b46db6d0132d184a387f6cc951dce7fb9c497a30` | Local LittleJS recipes, examples and two tested scaffolds; Pi integration pending |
| [music-core](https://github.com/KakkoiDev/music-core) | **No commit: repository empty when checked** | Use the working music code already in Pi; extraction is separate work |

Pi inspected baseline: `8184f73f09f3b959d84c096ea5d01654f70d5e2a`.
Do not update core references to floating main branches during an agent session.
Install complete snapshots with vendor notices and LOCK.json intact. Core normal
use is offline after explicit setup; contributor browser/lint setup downloads its
locked developer tools. No claim of an offline initial clone is made.

## What each repository provides

**visual-core:** short AGENTS.md router, RECIPES.md, capability catalog and local
CLI. Basecoat 1.0.2 has 41 organized component guides, copyable HTML previews,
original local docs and available Jinja/Nunjucks macros. Its chart page is a
reference: Chart.js is not bundled. Use Basecoat for generated user projects;
Pi's own existing design system remains authoritative for the harness UI.
Deterministic sprite/icon/static tile tools remain available. Procedural terrain
adds meadow, coast and dungeon presets, Blob 47 atlases, 16/32/64 px tiles and
1–4 variants. Its output is six colors plus transparency, with seam checks,
editable recipes, stable IDs and numbered revisions. It does not generate
arbitrary world maps, cliffs, animation or every terrain junction.

Terrain rendering reuses pinned Tesserae 0.3.1 shapes/topology, simplex-noise
4.0.3 and Alea 1.0.1. The compiled JS is bundled; users need Python 3.11+ and
Node, not a TypeScript build. Other gathered dependencies are locally available
references/probes, not a claim that all are runtime integrations. Read the
repository's terrain recipe and dependency report for exact scope.

**coding-core:** Lodash 4.18.1 (`lodash/fp`) and Toolz 1.2.0 with complete local
packages, licenses and file hashes. Fourteen recipe routes cover transformations,
grouping, validation, config, pagination, cents, transitions, retries, atomic
JSON, injected time, concurrency, boundaries, HTTP/errors and testing. Runnable
JS/Python code is distinguished from guidance. JS bounded concurrency is
implemented; Python async concurrency and HTTP service code remain guidance.
Copyable ESLint/Prettier/Ruff configs, exact dev locks, CI and deterministic source
kit are included. Preserve the host's pipeline when adapting a recipe.

**gaming-core:** see the [separate implementation report](gaming-core.md).

## Implementation order

1. Add an explicit optional core setup operation, with a manifest of repository,
   commit, local install path and verification status. Reuse existing toolchain
   setup conventions. Verify file hashes with each core's check command. No
   background upgrades, model-chosen package URLs or general shell tool transport.
2. Add narrow visual actions and a one-recipe context router. Mirror music's
   structured action pattern; expose catalog/template/check/create/read/revise
   with validated bounded data. Map all writes into approved project paths such
   as `assets/visual/<safe-name>/`. The standalone CLI accepts output paths;
   **Pi must enforce the project boundary itself** using its existing helpers.
3. Connect visual artifacts to existing chat replies. Reuse the music artifact
   pattern, project path validation and immutable revision URLs. Display the PNG
   preview and offer editable recipe/manifest/source files. Do not serve arbitrary
   generated HTML/scripts with harness privileges. A game preview should use the
   existing isolated browser workflow and a scoped local server.
4. Add coding/game intent routing, loading only the relevant core recipe and
   exact engine reference. Scaffold into fresh approved paths only; later edits
   operate on existing source. Preserve project framework, scripts and licenses.
5. Run the end-to-end acceptance prompts below. Only then record Pi as a verified
   consumer in the appropriate IMPLEMENTATIONS.toml. This docs handoff does not
   register a verified integration.

## Adapter contract and revision behavior

The agent selects a template/preset, reads the actual schema/catalog and supplies
bounded parameters. Deterministic code validates and renders. It must not ask a
small model to invent complete pixel grids, engine APIs or unchecked executables.
Return structured artifact kind, project-relative path, name, revision, preview,
source and validation result. Use existing request/cancellation/error handling.
Apply Gate checks to every writing action, including actions that render files;
Discussion/Planning must not bypass approved Files scope through a new tool.

For terrain, first try these commands from a checked-out visual-core snapshot:

```sh
python3 tools/visual.py terrain catalog
python3 tools/visual.py terrain template meadow > recipe.json
python3 tools/visual.py terrain check recipe.json
python3 tools/visual.py terrain create recipe.json --out /approved/project/assets/visual/meadow
python3 tools/visual.py terrain read /approved/project/assets/visual/meadow
python3 tools/visual.py terrain revise /approved/project/assets/visual/meadow --base 1 --patch patch.json
```

The patch for reduced texture is `{"set":{"detail":"low"}}`. Read before
revising; pass the current base. Preserve earlier numbered folders, seed, IDs,
selected bank/palette and unchanged parameters. A stale base, failed validation,
render failure or cancellation must leave current.json unchanged. No-op changes
do not publish a revision. Terrain toolchain changes deliberately refuse revision;
keep the pinned runtime or create a separately named migrated set. Do not edit
old recipe files in place. Use exported manifest rectangles, not assumed tile order.

## Music: preserve the existing implementation

Working code is already in [music.mjs](../../harness/music.mjs), the
[LLM guide](../../harness/music/AGENT_GUIDE.md),
[music routing guide](../../harness/guides/music.md),
[artifact handling](../../harness/music_artifacts.py) and
[project usage guide](../music-projects.md). It uses curated Blips samples,
validated scores, Strudel core/mini 1.2.6 event timing and a local PCM mixer;
it exports audio, editable score and Strudel source. It is not the full browser
WebAudio effect engine. Existing templates include an uplifting arrangement.

Keep `plh setup music`, current chat attachments and revision tests working.
Do not install from the empty music-core repo. If extracting later, move the
schema/catalog/composition/render core behind a small stable library API while
retaining Pi's Gate, setup, cancellation, asset storage and attachment adapter.
Preserve upstream Strudel/Blips license notices and documented redistribution
requirements; extraction is not a license change. Add parity fixtures before
switching imports. Test the optional real renderer after explicit runtime setup.

## Acceptance evidence required from Claude

- Create a meadow kit from plain language, show its atlas/map preview and editable
  recipe, then “less busy, same terrain.” Confirm one new revision, stable IDs,
  unchanged seed, previous files unchanged and a visible changed preview.
- Reject traversal, absolute paths outside the project, symlink escapes, stale
  revision bases, unsupported fields and toolchain drift. Simulate render failure
  and cancellation; verify no partial publication or current pointer change.
- Generate a Basecoat settings page using only local assets. Exercise form labels,
  keyboard/focus, dialogs, mobile layout and actual actions. No remote fonts/CDN.
- Use one coding recipe for a project operation; demonstrate host lint/tests pass
  and avoid loading the entire utility source tree into the model context.
- Scaffold and modify a playable game following the gaming report. Show actual
  gameplay and keep local engine/assets editable across a chat revision.
- Re-run music creation and revision; the same Blips bank and named layers survive.
  Check that attached audio loads after chat reload, not just that a WAV exists.
- Run at least ten representative weak/local-model prompts and retain tool traces,
  valid-schema rate, task success and revision preservation separately from human
  art/music quality judgments. No weak-model benchmark has been completed yet.

Core checks already passed on macOS with Node 24/Python 3.14: visual discovery,
20 Python contracts and offline Chromium component/terrain checks; coding 5 JS
and 4 Python cases plus lint/format and reproducible build; gaming 2 scaffold
contracts and Chromium startup/input/serve/score checks. GitHub CI also passed on Linux with Node 22 and
Python 3.11 for all three core repositories. Browser
checks block external requests. Screenshots were inspected. Broader examples,
every component state, optional plugins and subjective generation quality remain
outside that smoke-test claim.

For this documentation delivery, Pi’s full `tests/verify_workflow.py` passed
with `PYTHONDONTWRITEBYTECODE=1` (Python and Node). The initial run with bytecode
caching enabled failed four temporary source-rewrite checks; no runtime code
was changed to obtain the passing run. New Pi adapters remain unimplemented.
