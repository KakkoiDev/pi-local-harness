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

## Test Sandbox… (task 311), not drawn yet

Project › Test Sandbox… is built from the existing alert (note icon) with a radio group (`.settings-group`,
`.pw-radio`), because no board shows it. It says what a test run may do (write only in the project and a temporary
folder, read neither the workbench's data nor the person's keys, no network) and offers three choices, kept per
project: **No network (recommended)** · **This computer only (localhost)** · **The internet**. Buttons: Change ·
Cancel (default). When a failing test run met the sandbox, a Harness notice under the answer says so and names this
command. Please draw: the dialog (desk and phone sheet), and whether the notice should carry a "Test Sandbox…" link
that opens it directly (today it names the menu command in words).

The Preview frame is now sandboxed (task 304: `allow-scripts allow-same-origin allow-forms allow-modals allow-popups
allow-downloads`, no top navigation). Nothing changes on screen; an app that tries to navigate the workbench page
itself now stays inside the frame.

## Waiting messages (task 325), not drawn yet

The owner asked to "read and update/remove queued messages to the agent". Built without a board from existing parts;
please draw it (desk and phone) so we can replace the stand-in. Code: js/queue-list.mjs (markup), chat.css (the
`.pw-queue*` block at the end, the only styling to replace), hooks `#queue`, `data-job`, `data-version`, `data-action`
(`toggle`, `edit`, `remove`, `save`, `cancel`, `drop-file`), `data-file`.

- **Where:** a section under the transcript, below the running request's live answer (it is outside `#messages`, so the
  editor survives the transcript being rebuilt while Pi streams). Shown only while something waits, or for a status line.
- **Head:** the existing `pw-queue-note` line, now a button: "▾ Next: 1 request waiting in <project>"; ▸ when folded
  (`aria-expanded`; folding is remembered per browser).
- **Each message:** a `pw-card` with a **dashed** border and no shadow (to read as "not sent yet", unlike a settled
  card). Head: position number (bold), "Queued 14:02", and "Edited" (italic) after an edit. Body: the full text in the
  text face, line breaks kept; attachments as `pw-chip`s. Foot: **Edit** · **Remove…** (`pw-btn`). Only a plain chat
  message has Edit; an answer to a question, Start Building or Continue shows Remove… only.
- **Editing:** the card gets the solid border and the 2px shadow; the text becomes a `pw-field` textarea (focused,
  ⌘Return saves, Esc cancels); each chip gets a close button "Remove <name>". Foot: **Save** (default ring) · Cancel.
  While one message is edited, the other cards' Edit is disabled.
- **Remove…:** the standard alert: "Remove this waiting message?" / "Pi will never receive it. Its attachments are
  released." Buttons: Remove Message · **Keep Waiting** (default).
- **Status line** under the list (`.pw-queue__notice`, `role=status`): "Saved. Pi gets the edited message in the same
  place." and "Removed. Pi will never receive that message." fade after 8 s. A refusal stays: "Pi already started this
  message; your edit was not sent. Your text is back in the composer." or "This message changed in another window;
  your edit was not saved. Your text is back in the composer." (the draft is appended to the composer).
- **Phone (≤760px):** 16px inset, Edit and Remove… grow to 44px and share the row, chip close buttons 44px.

Questions for the board: should a waiting message look like a dimmed user bubble (`pw-msg--user`) instead of a card,
so the transcript reads as "what I said, what waits"? Should the menu bar's "1 waiting" status jump to this list? Is
the italic "Edited" acceptable in the 1-bit system, or should it be a glyph? Reorder (drag or Move Up/Down) was left out;
draw it only if you think it is worth it.

## Tool calls fixed, and "tools" in the model menu (task 326), not drawn yet

The owner asked that small models (gemma4:e4b-mlx) really use their tools; the workbench now turns tool calls a model
wrote as text into real calls. Built from existing parts; please draw if you want something else.

- **Model menu:** each item's key now starts with "tools" for a model that can call tools ("tools · thinks · sees",
  "tools · no thinking"); a model without tools still says "no tools" and is disabled. Same in the phone sheet.
- **Activity › a request's facts:** a "Tool calls fixed" row: "1 written as text by gemma4:e4b-mlx, run as real calls
  (read)". Shown only when it happened.
- **Activity › above the list:** a `pw-help` note (`#activity-repairs`, role note) when a model needed fixes in 3
  requests within 14 days: "gemma4:e4b-mlx often writes tool calls as text: the workbench fixed them in 4 recent
  requests. Another model may work faster." Never a card, never blocking.

Question for the board: should the note offer a control (Choose Another Model…) or stay text?

## The chat critical path (task 324), built from existing parts

- **A request the phase button started.** Choosing Planning after a discussion queues "Write the plan from our
  discussion." (Implementation with an approved task: "Build the approved task."). The chat shows it with the
  existing HarnessNotice (`Harness · Planning started from your discussion`), not as a "You" message. Please draw it
  in R12_Conversation (desk and phone) if it should look different, e.g. with the phase glyph.
- **A refused model switch.** While Pi works, picking another model no longer shows "Loading …"; the refusal ("Pi is
  working. Switch models when the queue is empty.") is the existing toast at the top. A "Switch after this request"
  offer would need a drawing.
- **Progress words.** "Starting Pi…" then "Waiting for the model (it may be loading)…" replace "Preparing
  attachments…" when nothing is attached. The CutLine reason for a stalled model is the board's own copy.


## Task scenarios and the E2E rule (task 329), built from existing parts

- **Plan card › Tasks:** under each task's "Done when", one `small.pw-plan__scenario` line per scenario:
  "Scenario: **Add a note** · Given the list is empty · When I write “milk” and choose Add Note · Then “milk” is in the
  list". Each scenario becomes one e2e test named after its title. Please draw it in R12_Plan (desk and phone): one
  line, a collapsed list, or a small table of Given / When / Then?
- **Check-in › facts:** a "Removed" row (`span.pw-checkin__removed`, one per line): "Removed: the “Reset” button and its
  test “Reset the notes”" when a request removed a control together with its e2e test. Shown on verified and not
  verified check-ins. Should it carry the caution glyph, and make Review First the default like a weakened test?
- **Not verified, naming the scenario:** the existing "Not verified" row carries Gate's sentence ("scenario “Add a
  note” has no e2e test named after it"; "test “Reset the notes” uses a control that no longer exists: the “Reset”
  button"; "the “Help” link has no e2e step"). Several reasons are joined with “;”: a list may read better.

## A project's packages (task 331), built from existing parts

- **Project Start › Summary:** a "Download" row in the facts list: "Install the app's packages: 40 packages, about
  108 MB (download from PyPI, once; later projects reuse the shared uv cache). Pressing Create approves this download."
  While Create runs, the status line reads "Installing the app’s packages… <uv's last line>", then "Running the base’s
  tests…". Please draw the row and the progress in R12_NP4 (desk and phone): a progress bar, or the line as it is?
- **Project › Install Packages…** (after Test Sandbox…): a desk dialog `#packages-dialog` with the same size line, the
  command it runs ("Runs uv sync --frozen in Habit Tracker once…"), a live status line and, on failure, the installer's
  output (the Project Start output box); Cancel · Install (default), then Try Again. Disabled when nothing is missing.
- **HarnessNotice with a button:** "This project’s packages aren’t installed (no .venv), so pytest can’t run. Install
  them once with Project › Install Packages…" + an Install Packages… button, shown once per project under the answer
  whose test run Gate refused.
- **Preview › packages missing:** the empty state says "<name>'s packages aren't installed yet, so the app can't start.
  Install them once with Project › Install Packages…." Should it carry the button too?


## The golden journey's fixes (task 327), built from existing parts

- **A refusal next to the control that was used.** A refused model switch ("Pi is working. Switch models when the
  queue is empty.") is now a small note right under the model name in the menu bar (`#near-note`, the Toast's 1-bit
  box `.pw-toast` without Undo, `role="status"`, gone after 6 s, on the next click or Escape), not the toast at the
  bottom of the window, 822 px away. Please draw it in the MenuBar card (desk; the phone sheet keeps the toast): a
  popover with a pointer, or a line under the menu bar?
- **Project Start's folder.** The project's folder is a slug (“Habit Tracker” → `habit-tracker`; never an existing
  folder: `habit-tracker-2`), and the name stays as typed. Step 1 shows it under “Create in …” as one `.pw-help` line
  (`#start-folder`, “Folder: ~/Code/habit-tracker”), and the Summary's facts have a “Folder” row after “Name”. Please
  draw both in R12_NP1 and R12_NP4 (desk and phone).
- **Run on its own going on to the next task.** The harness no longer sends a bare “yes” as if from the person: the
  answer carries the HarnessNotice “Run on its own: task 2 accepted; the next approved task starts.” Should it look
  different from the other notices (the auto glyph)?
