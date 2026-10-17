# Brief: round 12 (draft, being completed)

Date: 2026-10-18. Round 12. Three parts: (A) app building blocks a small model can grab, (B) Project Start with
capabilities, (C) the screens the 2026-10-18 review's fixes need (added when the fix tracks report).

## A. App building blocks, ready for a small model to grab

The person: "I want to have many app features: login, side panels, etc... to be ready for dumb agent to grab. let's ask
the designer to help with all that too."

These are for the **apps people build with Pi Workbench**, not for the workbench itself. Generated apps use Basecoat
(the visual-core library: 41 component guides, Jinja/Nunjucks macros, local assets, no CDN), not the workbench's 1-bit
design. Each block must be copyable by a small model without inventing anything: exact markup, its states, its texts, its
keyboard and phone behaviour, and the data it needs. One page per block, in the same form for every block.

The first catalogue (please add or regroup as you see fit):

- **Accounts:** sign up, log in, log out, forgot password and reset, email confirmation, profile and avatar, account
  settings, delete my account (with confirmation and what happens to the data).
- **Navigation:** side panel (collapsible, with sections and badges), top bar, tabs, breadcrumbs, bottom bar on the phone,
  a command palette.
- **Data:** list with search and filters, table with sorting and pagination, detail view, create and edit form with
  validation, empty state, loading, error and retry, delete with undo.
- **Feedback:** toasts, inline alerts, confirmation dialog, progress, offline banner, "saved" state.
- **Content:** dashboard with stat tiles and a chart area, calendar or agenda, kanban board, notes or a document editor,
  file upload with preview, image gallery, comments thread, notifications list.
- **App shell:** first-run onboarding, settings page (language first: English and Japanese), about, install as an app
  (phone), update available, help.
- **Sharing and people:** invite, roles (owner, member, viewer), activity feed, real-time presence (for multiplayer).
- **Games** (with gaming-core): title screen, pause menu, HUD (score, lives, timer), game over and high scores, settings
  with **controls remapping that shows keyboard, mouse and gamepad prompts for the device in use** (gaming-core is gaining
  a keyboard, mouse and gamepad input layer), touch controls on the phone.

- **Charts and data display:** line, area, bar (grouped, stacked), pie or donut, scatter, sparkline, gauge or progress
  ring, heatmap or calendar grid, funnel, a KPI tile with trend; each with its axes, legend, tooltip, empty and loading
  states, a readable table alternative, and colour-blind-safe series. (Charts need a local chart library: visual-core
  only has a chart reference page today, so the library is a decision for the person, pinned and vendored, no CDN.)
- **Commerce:** product grid and card, product page with gallery and variants, cart, checkout steps, order confirmation,
  order history, coupons, stock and price states.
- **Collaboration and content tools:** rich text and block editor (Notion-like pages), page tree, mentions, reactions,
  threads, channels and direct messages (Slack-like), presence and typing, file and code viewer with diff
  (GitHub-like), issue list and detail, pull-request style review, labels, assignees, search across everything.
- **Other elements:** date and time pickers, rich select and combobox, tag input, file tree, stepper, timeline, map
  placeholder, avatar and avatar group, badges, skeletons, infinite scroll, drag-and-drop lists, keyboard shortcut help.

For every block: desktop and phone, light and dark, English and Japanese, the empty / loading / error / success states,
labels and keyboard order, 44 px targets on the phone.

### Whole apps (archetypes), composed from the blocks

The person: "I want to be able to generate an online shop, an admin dashboard, a portfolio, a notion clone, etc... a slack
clone, a github clone, anything." For each archetype, please draw its main screens as a composition of the blocks above,
so a small model assembles known parts instead of designing an app: the screen list and navigation, which block each
screen uses, the main journeys (e.g. browse, add to cart, pay; write a page, share it; post in a channel, reply in a
thread), and the phone version. First set:

- Online shop (storefront and its admin)
- Admin dashboard (users, orders, metrics, settings)
- Portfolio and personal site, and a blog
- Notion-like notes and wiki (pages, blocks, page tree, sharing)
- Slack-like chat (workspaces, channels, DMs, threads, presence)
- GitHub-like code collaboration (repositories, files, issues, reviews)
- Booking and calendar app, a forum or community, a course or learning app, a CRM, a kanban project board

Keep it a catalogue that grows: name each archetype's blocks so a new one (a recipe app, a game launcher) can be added the
same way.

### Whole games (genres), composed from game blocks

The person: "I want to be able to generate any 2d games, RPG, space shooter, cozy game, rogue like, trading card game,
etc..." Games are built with gaming-core (LittleJS, plain JavaScript; it is gaining a keyboard, mouse and gamepad input
layer). For each genre, please draw its screens and in-game UI as a composition of game blocks, so a small model assembles
known parts: the screen flow (title, play, pause, results), the HUD, the menus specific to the genre, the controls for
keyboard, mouse, gamepad and touch, and the phone layout. Game blocks to define first: title screen, pause, settings
(audio, controls remapping with device prompts, language), HUD pieces (health, energy, score, timer, minimap,
objective, combo), dialogue box with portrait and choices, inventory grid, equipment, shop, quest log, map screen, save
and load slots, level select, results and high scores, game over, tutorial prompts, card hand and deck views.

First set of genres:

- RPG (top-down exploration, dialogue, inventory, equipment, quests, turn-based or action combat)
- Space shooter (shoot 'em up: waves, power-ups, bosses, lives, score)
- Cozy game (farming or life sim: day cycle, crops, crafting, shop, relationships)
- Roguelike or roguelite (procedural rooms, permadeath, run summary, unlocks)
- Trading card game (deck building, hand, board, turn phases, card detail, collection)
- Platformer, puzzle (match-3, sliding, Sokoban), tower defence, racing (top-down), arcade classics (pong, breakout,
  snake), visual novel, idle or clicker, strategy (grid tactics)

Same rule as the apps: a catalogue that grows, each genre naming its blocks so a new genre is added the same way. The art
comes from visual-core (pixel sprites, tiles, terrain) and the sound from the music feature.

### Art the tools generate (visual-core)

visual-core is gaining deterministic pixel-art and SVG generation from recipes (plan 266): characters from named parts
with variants, animation frames, palettes, icons, tiles, illustrations. Please define the **art direction rules** the
tools can follow: a few named palettes, sprite sizes (16, 32, 64 px), outline and shading conventions, how UI frames and
icons look in pixel and in vector styles, and a small reference set (a hero, a monster, an item, a tile, an icon, a
button) drawn in each style so the generators have a target.

## B. Project Start: choose the capabilities, get a tested base

GPT-Sol recorded the person's direction (plan 253, the handoff's "Project Start and capability first"): an expanded New
Project that selects reusable capabilities (login, multiplayer, collision, dashboards, offline, GitHub Pages, phone app…)
and assembles a tested base, so the model only builds what is new. Packaging (full stack, frontend only, mobile) is
separate from capabilities: one app, several packages (plan 253).

Please design, in the workbench's 1-bit design: the New Project flow with the capability picker (groups, short
descriptions, what each adds, what it needs, incompatibilities shown before choosing), the packaging choice, a summary
before Create, and how a project later adds a capability ("Add a capability…") without breaking what exists.

## C. Screens the review's fixes need

(Added when the four fix tracks report: tasks 260-263, the conversation fixes and generated media. Expected: reopening a
falsely certified task, a Retry on an unverified check-in, a stuck check-in recovered after a reload, a failed reply shown
with its partial text, "stopped by a question" versus "stopped by you", the approval card showing Files and Kind, the "not
a project" refusal, the page secret's failure state, a different Implementation shortcut than ⇧⌘3.)
