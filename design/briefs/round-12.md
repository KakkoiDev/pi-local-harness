# Brief: round 12

Date: 2026-10-18. Round 12. Four parts: (A) app building blocks a small model can grab, (B) Project Start with
capabilities, (C) the screens the 2026-10-18 review's fixes need, (D) a theme panel to tinker with an app's look.

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

The 2026-10-18 review's repairs (tasks 260-263, 290, 291) are built; these are the screens they had to improvise or
could not draw. Please draw each, desk and phone, English and Japanese.

**Verification and check-ins (task 260)**
- **Reopen task**: a person control on a task (in Work and in Activity) that reopens a falsely completed task (its boxes
  and roadmap line), with a confirmation.
- **The unverified check-in**: its default action is now **Retry Task** (the same task again), not Accept and Continue;
  how it reads, and how "accept anyway" stays possible.
- **A waiting check-in after a reload**: the chat message may be gone; the check-in comes back from the project's state.
- **Changes outside the task's Files**: how the not-verified message names them.

**Only you can decide (task 261)**
- **A refused person control** ("Reload the page": the page's secret is stale after a restart): its own message and a
  Reload button instead of the generic error line.
- **The plan approval card shows Kind and Files** (what you grant), with their source (plan 267).

**Renamed projects (task 262)**
- **The Preview restarted in the renamed folder**: a line saying so.
- **Rename refused while terminal Pi works**: a dedicated card instead of the generic alert.

**Refusals and small fixes (task 263)**
- **The new refusal wording** on R11_Refusals: "Not run" (a command), "Not proposed" (a plan in Discussion), "Not
  written" (a write), and "not a project" (register the folder or add ROADMAP.md).
- **The Implementation shortcut**: ⇧⌘3 is macOS's screenshot shortcut, so it never reaches the page; please choose
  another, and alternatives for shortcuts the browser keeps in a tab (⌘N, ⌘T, ⌘W, ⌘1-9).

**Conversation (task 290)**
- **An inline harness notice under an answer** (used for the phase-button notice when Laya is not installed).
- **A question settled without an answer** ("not answered: settled by Start Building").
- **A failed or stopped line under a cut-short answer** ("Stopped by you before Pi finished." / "Failed before Pi
  finished: <reason>"), with Retry and Undo This Request.
- **Activity's "waiting" status** for a question or plan pause; "stopped by a question" versus "stopped by you".

**Gate makes every judgement (plan 267)**
- **The decision row** with each author (code, Laya, you, auto, model) and Change…, collapsed under answers
  ("4 decisions · 1 automatic").
- **The scope-widening card** (a file outside the task's Files).
- **The check-in with its evidence**: the test run, a test-integrity warning, the "Tried it" line.
- **Questions in a batch** ("2 of 3") with "Take all recommendations"; a "Pi asked a question" card; the re-plan card;
  the Change… flow; Run on its own's report listing its decisions; Settings → beginner or expert detail; the terminal's
  `/decisions` view.

**Found by walking the workbench (bug hunt)**
- The default "Paper" appearance ignores the Mac's dark mode; Markdown links in Work (ROADMAP task lines show raw
  `[…](tasks/…)` and cannot be followed); the choice card repeats its question above it; the composer's "<project> · send
  to agent queue" text; the phone menu's button row overflows in Japanese; the status needs "Working on <project>".

## D. Theme panel: tinker with the app's look, live (task 312)

The person: "I want to adjust the sites colors" → "Here are the color values" → a panel listing primary, secondary… with
a colour picker that changes the Preview in real time; "I want to change the radius" → "Here are the radii", and so on.
The workbench answers this itself (no model): the panel opens in the chat as Pi Workbench's reply.

The app's theme is Basecoat's CSS variables (Tailwind v4, no config file): colours as pairs (primary and its
foreground, secondary, accent, muted, destructive, background, card, border, input, ring, sidebar, five chart colours),
each in light and dark; one radius; Tailwind's spacing unit; fonts later.

Please draw, in the workbench's 1-bit design (the panel is workbench UI; the colours it edits are the app's):
- **The panel in the chat**, one group per panel (colours, radius, spacing, chart colours): token name in plain words
  ("Primary: buttons and links"), a swatch, the value, a picker; light and dark columns; the contrast check against its
  foreground (pass/fail, never blocking); Reset per token.
- **The live link to the Preview**: how the person sees the Preview change while dragging (Preview beside the chat on the
  desk; on the phone, where the Preview is a tab).
- **Save, Discard, Undo**: the saved line in the chat ("Theme saved: primary, radius" with Undo), what happens on closing
  unsaved.
- **The radius and spacing panels**: one slider each, with the derived sizes shown on sample buttons, cards and inputs.
- **No theme file**: the message for a project that has none.
- Entry points: the request in the chat, Project › Theme…, and a hint when Pi is asked something the panel could do.

**Built before your drawing; please revisit**
- The panel is built (2026-10-18) from existing parts (pw-card, pw-btn, pw-seg, pw-field) with `.pw-theme__*` classes and `data-group` / `data-mode` / `data-token` hooks, so your drawing can restyle it without code changes.
- At 480 px the colour rows squeeze the value fields (swatch, value and Reset side by side; light and dark columns on desk). On the phone: one column at a time with a Light/Dark switch.
- Contrast reads "✓ AA 19.0:1" or "✗ AA … · text may be hard to read"; charts are checked at 3:1.
- Closing collapses the panel to a "closed · Open Again" line.
- The saved line is "Theme saved: primary." with the standard Done row, whose "Undo This Request…" reads oddly for a theme: please name it.
- The Preview reloads after Save ("You changed 1 file. Reloaded.").
- Token labels ("Primary: buttons and links"), font weights (400 and 700 only) and the fonts panel's search and sample: please review.
- A font not yet saved shows in the panel's sample only; the live Preview uses a system font until Save downloads it into the project.

**Rebuilt to your drawing (2026-10-18); for the next brief**
- **Fonts** is a fifth tab after Chart, kept from the built panel and set in your parts (`.pw-slider` rows: label, the family in use, a Google Fonts search, Reset, the sample). Please draw it.
- **A colour's text**: the drawing shows "Aa" in the text colour but no way to change it. The picker has a small segment **Colour · Text on it** (on Border · Input · Ring: **Colour · Focus ring**). Please confirm or redraw.
- **Rows that hold several tokens**: Card also sets the popover (and its text); Border · Input · Ring sets border and input, the ring from the picker. Border · Input · Ring shows no contrast (Basecoat's light borders would always read "below AA"); please say what it should show.
- **Sidebar tokens** are not in the panel (your eight rows); a block saved with them still reads.
- **Chart**: one value per series for light and dark, as drawn. Basecoat's five default blues are close, so the warning shows by default ("Hard to tell apart: Chart 2 and Chart 3 · …"); the note no longer claims the defaults stay apart.
- **After Save Theme** the panel becomes "Theme · Colours saved · Open Again" above the new saved line, so it can be reopened.
- **The file** stays `styles/input.css` (the marked block), not `app/static/theme.css`: the starters' Tailwind build already reads it.
- **Phone, in the chat**: the card shows **Open Theme** and the unsaved line; the full screen opens on a new request. The live app on top needs the app running here (it says so while it starts); opened from a phone over the tailnet there is no live link.
