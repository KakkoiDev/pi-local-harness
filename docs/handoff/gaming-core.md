# gaming-core: inventory and Pi implementation report

Prepared 2026-10-18. [Core handoff and pins](core-libraries.md) is the entry point.
[Repository](https://github.com/KakkoiDev/gaming-core), reviewed commit
`b46db6d0132d184a387f6cc951dce7fb9c497a30`.

## Design and local inventory

The library follows [ai-handbook](https://github.com/KakkoiSchool/ai-handbook)'s
short task-router approach (reviewed at
`19f13d8907a2b12c2452cefa9c3e2d5ff633efaa`). That repository has no license
file in the reviewed snapshot, so handbook prose was linked rather than copied.
The new routing prose and twelve recipes are original. Engine details link to
unchanged pinned upstream sources instead of inventing a competing engine guide.

- LittleJS-AI 1.3.1, commit `5b712052848b58e4fce127cec2531c024cb3d9b5`:
  full local toolkit, examples, reusable templates/helpers and five agent skills.
- LittleJS 1.27.2, commit `cdcbef463d889d24dee37f481c2ea5f49bf7fcf5`:
  full source, docs, plugins, examples and upstream tests retained as references.
- CATALOG.json and docs/examples.md index 128 example entry scripts, 17 template
  or helper files, and five skills. Counted entry scripts are not 128 independently
  verified complete games. Vendor SHA-256 checks cover both complete snapshots.
- The default LittleJS-AI bundle contains engine **1.27.0**. Use its matching
  docs/helpers for scaffolds. The 1.27.2 checkout is a separate reference; do not
  combine APIs or overwrite engines without an explicit tested migration.
- Both primary projects are MIT; licenses are copied into scaffolds. Optional
  Box2D has retained zlib notices and WASM requirements. It is outside the default.

Twelve recipe routes organize starting, movement/input, collision/levels, game
loop/state, menus/save, art/atlases, sound/feedback, boards/cards, effects/tuning,
3D, multiplayer and verification/shipping. Optional 3D/networking/plugin examples
are references, not ready-made Pi integrations. Route networking questions to
p2p-core when applicable; do not duplicate its architecture or promise offline
multiplayer infrastructure.

## Implemented executable surface

```sh
python3 -B tools/game.py catalog
python3 -B tools/game.py init emptyGame --out /approved/fresh/game
python3 -B tools/game.py init pong --out /approved/fresh/pong
python3 -B tools/check.py
```

The scaffold copies tested upstream starter source and the exact local 1.27.0
engine, rewrites the engine path, and retains provenance/license files. It
refuses an existing output or symlink path. Its staging folder is cleaned on
failure. No npm dependency, CDN, paid model, MCP server or runtime build is
needed to play these starters. Python is tooling; the game is plain JavaScript
with classic script globals. Retained build.json is upstream metadata, not an
implemented release-build command.

## Pi work for Claude Code

1. Add game intent/context routing to the existing guide selection mechanism.
   Read AGENTS.md, choose one recipe and only its matching local engine docs.
2. Add a bounded scaffold action selecting emptyGame or pong with a fresh approved
   project-relative destination. Reuse canonical project-path/Gate handling; the
   core tool is not a substitute for Pi's project boundary checks.
3. Return index.html/game.js/provenance paths to the existing project/browser
   workflow. Serve the game in a scoped preview; avoid injecting its script into
   the chat DOM or harness origin. Keep editable source visible in the project.
4. For revisions, inspect and edit the current game.js; do not scaffold again.
   Keep classic script order and engine version. Pure data/state logic can use
   coding-core recipes; LittleJS EngineObject APIs remain mutable engine adapters.
5. Import visual-core atlases with manifest rectangles and nearest sampling.
   Copy approved music WAV files into the game with user-gesture audio startup,
   sensible volume, loop handling and retained licenses. This cross-core import
   is specified here but not implemented by gaming-core yet.
6. Add a real browser acceptance test and weak-model trials before calling the
   Pi integration complete. Register a consumer only after these pass.

## Tests and limits

Executed: vendor hashes, all catalog targets/doc links, both scaffold contracts,
source syntax; offline Chromium startup for both generated games; Pong mouse
paddle response, click-to-serve, score/reset after a boundary event, and a 390 px
viewport check. Browser page errors and external requests are rejected. Screenshots
were inspected. These tests use the generated scaffold, not a separate mock game.

Still required in Pi: agent-to-scaffold-to-chat preview, conversational game edits,
Gate refusal cases, reloading source/artifacts, user-gesture sound, touch controls,
local-model evaluation and visual/music imports. Linux CI passed the core
contracts and browser smoke checks. Optional
plugins, all 128 reference entry scripts, save/network features and production
shipping remain unverified. Do not mark a reference as an implemented feature.
