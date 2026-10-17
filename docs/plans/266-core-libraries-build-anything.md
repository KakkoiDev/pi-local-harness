# Plan 266: Core libraries that let a small model build anything

Date: 2026-10-18. Status: planned; the input layer is in progress (gaming-core PR). The person's goal: "make the AI able
to build anything", with small local models. The rule for every core: **the model picks and parameterises; deterministic
code generates and checks** (CONSTITUTION.md: System 1 decides, System 2 produces). A small model never invents pixel
grids, SVG path data, engine APIs or chart code from scratch: it fills a schema that a tool validates and renders.

## What the person asked for (2026-10-18)

- gaming-core: "input from controller and keyboard and mouse".
- Apps: "many app features: login, side panels, etc… ready for dumb agent to grab", "charts and other elements", "an online
  shop, an admin dashboard, a portfolio, a notion clone… a slack clone, a github clone, anything".
- Games: "any 2d games, RPG, space shooter, cozy game, rogue like, trading card game, etc…".
- visual-core: "should be able to do pixel art and svg. and the small model should have deterministic tools and a library
  to generate more content."

## The work, by repository

### gaming-core (github.com/KakkoiDev/gaming-core)

1. **Input layer** (in progress, a pull request): named actions bound to keyboard, mouse and gamepad, dead zones,
   hot-plug, device-matched prompts, saved rebinding; wired into emptyGame and pong; recipe; browser tests with a mocked
   gamepad.
2. **Genre starters:** one tested, playable starter per genre (RPG, space shooter, cozy farming, roguelike, trading card
   game, platformer, puzzle, tower defence, top-down racing, arcade classics, visual novel, idle, grid tactics), each
   scaffolded by `tools/game.py init <genre>`, using the input layer, with a recipe and a browser test that plays it
   (moves, scores, wins or loses). Shared game blocks (HUD, dialogue, inventory, save slots, card hand…) as reusable
   modules the starters share. UI from the designer's round 12 genre boards. Fix first: in Pong at 1000×700 both paddles sit outside the visible
   area (on main before the input PR; listed in KakkoiDev/gaming-core#1).

### visual-core (github.com/KakkoiDev/visual-core)

3. **Pixel art, deterministic:** a library and CLI that render sprites, tiles, icons, characters and animations from small
   declarative recipes: palettes (fixed, named), shape and pattern primitives (rect, circle, line, dither, outline,
   shading by light direction), parts that combine (a character = body + head + hair + clothes, each a named part with
   variants), animation frames (walk, idle, attack) by transforming parts, and seeded variation. Output PNG and sprite
   sheets with a manifest (rectangles, names, frame timings) the games read. Same revision rules as terrain (numbered,
   immutable, read before revise, no-op changes publish nothing).
4. **SVG, deterministic:** the same for vector art: icons, illustrations, logos, diagrams and UI decorations from recipes
   (shapes, strokes, a palette, a grid, layout helpers, text with a bundled font), validated and written as clean SVG
   (no scripts, no external references), plus PNG renders for previews.
5. **A content library:** curated, licence-checked starting packs the tools can recombine: palettes, part sets
   (characters, monsters, items, buildings), icon sets, tile sets, UI frames. Each item has a recipe, so the model can
   ask for "the same sword, blue, bigger" and get a deterministic revision.
6. **Charts for apps:** a pinned, vendored chart library (recommended: Chart.js 4, MIT; alternative uPlot) behind a recipe
   that takes data and a chart kind and writes the chart markup and script, with the accessible table alternative.
   Needs the person's choice and a download approval.
7. **App blocks and archetypes:** Basecoat blocks (accounts, navigation, data, feedback, content, commerce,
   collaboration, charts…) and whole-app archetypes (online shop, admin dashboard, portfolio and blog, Notion-like, Slack-
   like, GitHub-like, booking, forum, course, CRM, kanban) as copyable, tested templates, from the designer's round 12
   boards.

### Pi Workbench (this repository)

8. **Adapters**, after the review's repairs (tasks 260-265): narrow actions for each core (catalog, template, check,
   create, read, revise), mirroring the music tool; writes only under `assets/<kind>/<name>/` as new numbered revisions
   (the person's "option A", allowed outside an approved task); Gate checks every action; the chat shows previews and the
   editable recipe; routing loads one recipe, never a whole library. See docs/handoff/core-libraries.md for the adapter
   contract and acceptance evidence.
9. **Project Start** (plan 253, round 12 part B): pick capabilities (blocks) and packaging; the harness assembles the
   tested base.

## Order

Repairs first (tasks 260-265: verification, person-only controls, rename, isolation, conversation, generated media). Then
gaming-core input (done as a PR), visual-core pixel art and SVG (3-5), the adapters (8) for music, visual and games, the
genre starters (2) and app blocks (7) as the designer's boards arrive, charts (6) after the person's choice, Project
Start (9) last. Each step: tests that run the generated thing (play the game, open the page, render the image), and the
weak-model trials in docs/handoff/core-libraries.md before calling an integration done.

## Rules for every core change

Pinned versions; vendored with licences; no CDN; no downloads without the person's yes; deterministic output for the
same recipe and seed; schema validation with clear errors a small model can act on; revisions never overwrite; each
change to a core repository goes as a pull request the person merges.
