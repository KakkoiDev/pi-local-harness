# Brief: round 13 (draft)

Date: 2026-10-18. Draft, not sent yet. What turning App Blocks into cards Pi loads (plan 266 item 7, task 317) found
for the designer. App Blocks (design/app-blocks, round 12 part A) is now built into `kit/blocks/` by
`kit/blocks/build.py`; every change to the catalogue reaches Pi after a re-sync and a rebuild, so these are fixed in the
App Blocks artifact, not here.

## A. Blocks the archetypes ask for that do not exist yet

Each archetype's **Adding to it** names them; until they exist the cards say what to use instead. Fourteen:

| Block | Asked for by | Until then |
| --- | --- | --- |
| Reviews | AppShop | Comments without stars |
| ShippingRates | AppShop | one flat price in SettingsPage |
| ExportCsv | AppAdmin | a plain Download CSV link |
| ArticleBody | AppPortfolio | DocEditor's read-only view |
| DatabaseView | AppNotes | Kanban and DataTable over pages |
| MessageComposer | AppChat | Threads' reply box |
| RunStatus | AppCode | nothing (CI not covered) |
| CodeView | AppCode | CodeDiff's view mode |
| WeekCalendar | AppBooking | Agenda's Day and List views |
| ReportContent | AppForum | ConfirmDialog with a reason field |
| QuizQuestion | AppCourse | EditForm and InlineAlert |
| Flashcards | AppCourse | nothing yet |
| CsvImport | AppCrm | AppCrm's own Import step |
| WipLimit | AppBoard | the count in StatusBadges |

Please draw them in the same form (summary, facts, Markup, States, Texts, Keyboard and focus, Phone, Data, Don't), with
EN/JA texts. New cards need no code change here: `kit/blocks/keywords.json` gets their words (we add them).

## B. Texts built from data, not yet marked for translation

Your known limit ("Sort by {column}", "Quantity of {name}") measured: **178 keys with a placeholder** are listed in a
card's Texts table but appear nowhere in its markup or script (81 cards). Some are attribute labels that need
`data-t-label` in the markup (`table.sort_by`, `table.select_row`, `table.row_menu`, `cart.quantity_of`,
`coupon.remove_label`, `board.card_menu`, `upload.remove`, `tree.open`, `tree.close`, `presence.button`,
`notif.bell`, `gallery.open`, `combo.remove`); others are live-region or toast texts set from code, which is fine but
should say so in States (`board.live.moved_by`, `upload.live.done`, `presence.joined`). Please mark the first kind in the
markup and name the element each of the second kind fills. The full list is in task 317 (tasks/317-app-block-cards.md).

## C. Japanese dates

A native `<input type="date">` shows the browser's format (10/14/2026 on an English browser). Every card that asks for
a date (Agenda, AppBooking, Checkout's delivery date, DeleteAccount's grace period, EditForm's date fields) should use
**DatePicker**'s calendar popover in Japanese pages so dates read 2026年10月14日, and its card should say when the
native field is still fine (an English-only internal admin page). Times: the same for TimePicker.

## D. Game fonts, stored locally

The game previews load **Silkscreen** and **DotGothic16** from Google Fonts (catalogue only). A game must ship them
(both OFL). The workbench's theme panel already downloads any Google font with its licence into a project
(`harness/theme_fonts.py`: `static/fonts/<family>/`, woff2 for 400 and 700, the licence beside it); GameKit's card
says `fonts/`. Please settle one path for games (we suggest `static/fonts/<family>/` like apps, so the theme panel can
store them), and give GameKit's stylesheet the matching `@font-face` lines; we will make Project Start fetch the two
fonts when a game is chosen (with the person's yes, like the theme panel).

## E. Gamepad naming: GameKit and ControlsRemap vs gaming-core's input layer

Checked against KakkoiDev/gaming-core pull request #1 (input layer, open, read only).

| | App Blocks (GameKit, ControlsRemap) | gaming-core PR #1 (`starters/input.js`) | Match |
| --- | --- | --- | --- |
| Button indices | W3C standard mapping: 0 south, 1 east, 2 west, 3 north, 4/5 shoulders, 6/7 triggers, 9 start, 12–15 d-pad | the same standard mapping (`pad:0` … `pad:16`) | yes |
| What the player sees | positions only: `.game-padpos[data-pos=south]`, "South button" / 「下ボタン」; never a brand's letters or shapes | `gcInput.prompt()` returns brand names: Xbox by default (`A`, `B`, `X`, `Y`, `LB`, `RT`, `View`, `Menu`), PlayStation with `padStyle: 'playstation'` (`Cross`, `Circle`…) | **no** |
| Bindings format | per action `{"keyboard": "Space", "mouse": null, "gamepad": 0}`, move as `{"keyboard": [W, A, S, D], "gamepad": "leftStick"}` | per action a list of strings `['key:Space', 'pad:0', 'mouse:0']`, axes `moveX`/`moveY` with `negative`/`positive` lists and `stick: 'left.x'` | **no** |
| Where bindings are saved | `localStorage["<game-id>.settings"].bindings` | `writeSaveData` under the game's `storageKey` (e.g. `mygame.input`) | **no** |
| Devices | `data-device` = keyboard, mouse, gamepad, **touch** | `device` = keyboard, mouse, gamepad (touch reaches mouse bindings; the engine's touch gamepad is not wired) | partly |
| Fixed actions | Pause (Esc / start) and menu back cannot be rebound (`aria-disabled`) | `gcInput.bind()` accepts any action, pause included | **no** |
| Default actions | RPG: move, confirm, back, attack, menu, map, pause; ControlsRemap example: jump, attack, interact, pause | jump, fire, confirm, back, pause (`fire` = west and right trigger) | names differ (`attack` / `fire`) |
| Back / select button | "Back (left centre)" opens the map in GameRpg | index 8 named `View` / `Share` | position vs brand |

Proposed resolution (for the person to decide; gaming-core changes go as a pull request they merge): gaming-core adds
`padStyle: 'position'` (south, east, west, north, left shoulder, right trigger, start, back) as the default, so
`prompt()` returns the words ControlsRemap shows and GameKit's `.game-padpos` can be driven by the same index; GameKit
reads and writes bindings through `gcInput` (one format, gaming-core's strings) and ControlsRemap's Data section is
redrawn in that format; `gcInput.init({fixed: ['pause', 'back']})` refuses to rebind them. Until then a game built from
the cards must translate between the two, which a small model will get wrong.

## F. What the checker found in the catalogue's own markup

`kit/blocks/check.py` (the checker Pi runs on generated pages) flags these in App Blocks as delivered. Each is an
AppFoundations rule; please fix them in the artifact (tests/test_app_blocks.py lists them and fails when one is fixed
or a new one appears, so the list stays true):

- **Hard-coded colours** (AppFoundations rule 5, "never write a colour"): CodeDiff and PullReview (`bg-green-500/10`,
  `text-green-700`, `bg-red-500/10`, `text-red-700`, `dark:text-green-400`), IssueList and IssueDetail (`text-green-700`,
  `bg-green-700 text-white`), StatusBadges (`bg-green-600`, `bg-amber-500`), AvatarGroup and Channels (`bg-green-600`
  presence dot), GlobalSearch (`bg-yellow-200` highlight), Gallery (`bg-black` viewer), GameKit (`body
  style="background:#000"`), GameOver (`style="background: rgb(10 10 20 / 0.7)"`). Suggestion: success, warning and
  highlight tokens in AppFoundations' CSS (`--success`, `--warning`, `--highlight`, light and dark), and the game kit's
  `--g-*` roles for the two game pages.
- **A class Basecoat and the starters do not have:** DetailView uses `prose-sm` (the Tailwind typography plugin, which
  the starters do not load). Either style the body with plain utilities or ask us to add the plugin to the starters.
- **Fields labelled only by a placeholder:** CommandPalette (`#command-input`) and ShortcutHelp (`#shortcuts-filter`).
  Add `aria-label` with a `data-t-label` key.
- **Charts without a table alternative** (the catalogue's own rule, "every chart has a table alternative"): Dashboard's
  trend chart, KpiTile's sparkline (Sparkline's own card has one) and GaugeRing. If a single-value chart's visible
  number is its alternative, say so in AppFoundations and we will teach the checker that exception.
