# Implementing Pi Workbench System 1

This file tells an implementing agent exactly how to move the pi-local-harness web workbench (`index.html`, `chat.css`, `js/*.mjs`) to the 1-bit Desktop Interface design. Read it top to bottom once, then work through **§ 12 Build order** one task at a time, red → green, like every other task in `tasks/`.

## 0. Sources of truth

| What | Where |
| --- | --- |
| Visual design, every screen and state | Design canvas “Pi Workbench — Desktop Interface” (claude.ai artifact, pages **Screens**, **Every menu & state**, **Phone pages**, **Edit & comment**, **Components**) |
| Tokens, components, icons, brand book | Design system “Pi Workbench System 1” (claude.ai artifact) |
| Tokens as CSS | `design/tokens.css` (this handoff) |
| Components as CSS | `design/components.css` (identical to the design system's `components/bundle.css`, minus the Google Fonts import) |
| Page layout | `design/layout.css` → becomes the content of `/chat.css` |
| Markup | `design/index.reference.html` → becomes `index.html` |
| Icons and status vocabulary | `design/icons.mjs` |
| Principles and copy rules | `DESIGN.md` |

When the canvas and this file disagree, this file wins for behaviour and ids; the canvas wins for visuals. Artboard names are cited as **[Board name]** so you can find them.

## 1. Ground rules

1. **No framework, no build step, no CDN.** Plain ES modules and CSS, as today. `tests/test_frontend.py` fails if `cdn.tailwindcss` appears; do not add any other remote URL either. Fonts are local files.
2. **Keep every existing id.** `js/chat.mjs`, `js/workspace.mjs` and `tests/browser/chat.cjs` address elements by id. `design/index.reference.html` keeps all of them; new ids are marked `NEW`.
3. **Keep the legacy class names the tests use** and add the new ones beside them: `.conversation`, `.file-item`, `.attachment-chip`, `.activity-task`, `.task-state`, `.composer-wrap`, `.md`. Example: `node('div','conversation pw-row')`.
4. **Keep these visible strings exactly:** `Saved`, `No matching projects`, `start plh again` (inside `#startup-error`), `Recursive deletion targets` (Gate's reason text, rendered verbatim). See § 11 for the one string that changes (`BLOCK`).
5. **State is never colour.** Use `stateGlyph()` from `icons.mjs` (glyph + word) for every job and Gate outcome.
6. **One default button per window, dialog or sheet**, always the safe or expected action (§ 7).
7. **Never `window.confirm()` or `window.prompt()`.** Use `#alert-dialog` and `#name-dialog` (§ 7).
8. Commit per task with the repo's convention and a `tasks/NN-*.md` file per step.

## 2. Files to add and wire up

```
design/tokens.css        new  (from this handoff)
design/components.css    new
design/icons.mjs         new  → served as /design/icons.mjs; js/ui.mjs re-exports it from '../design/icons.mjs'
fonts/PixelifySans-Variable.woff2   (2026-10-13: dropped in task 93; chrome uses system-ui)
fonts/SourceSerif4-Variable.woff2
fonts/SourceSerif4-Italic-Variable.woff2
fonts/IBMPlexMono-Regular.woff2
fonts/IBMPlexMono-Medium.woff2
fonts/OFL.txt            licences for all three families
index.html               replace with design/index.reference.html
chat.css                 replace contents with design/layout.css
DESIGN.md                replace with this handoff's DESIGN.md
```

**Fonts.** All three are SIL Open Font License 1.1. Get the woff2 files from the families' own repositories (Pixelify Sans: github.com/eifetx/Pixelify-Sans; Source Serif 4: github.com/adobe-fonts/source-serif; IBM Plex Mono: github.com/IBM/plex) or from Google Fonts, rename them to the names above, and commit them with `OFL.txt`. If a variable file is not available, use static 400 and 600 files and adjust the `@font-face` rules in `tokens.css`.

**Server allowlist** (`harness/web_chat.py`, the `allowed` dict in `do_GET`): add

```python
'/design/tokens.css':'design/tokens.css','/design/components.css':'design/components.css',
'/design/icons.mjs':'design/icons.mjs',
'/fonts/PixelifySans-Variable.woff2':'fonts/PixelifySans-Variable.woff2',
'/fonts/SourceSerif4-Variable.woff2':'fonts/SourceSerif4-Variable.woff2',
'/fonts/SourceSerif4-Italic-Variable.woff2':'fonts/SourceSerif4-Italic-Variable.woff2',
'/fonts/IBMPlexMono-Regular.woff2':'fonts/IBMPlexMono-Regular.woff2',
'/fonts/IBMPlexMono-Medium.woff2':'fonts/IBMPlexMono-Medium.woff2',
```

and call `mimetypes.add_type('font/woff2','.woff2')` once at import, because `mimetypes.guess_type` may return `None` for woff2 and the handler would send `text/plain`. Add a test in `tests/test_web_robustness.py` that each new path returns 200 with the right `Content-Type`.

**Installer** (`harness/install.py`): add `'design','fonts'` to the `copytree` list. Add a test in `tests/test_plh.py` (or wherever install is tested) that both folders are copied.

**Icons** (`js/ui.mjs`): delete the `paths` map, `icon()` and `hydrateIcons()`, and re-export them from `icons.mjs`:

```js
export { icon, hydrateIcons, stateGlyph } from '../design/icons.mjs';
```

`data-icon` names change: `plus`, `search`, `close`, `mic` keep their names; `folder` → `folder`; `file` → `file`; `send`, `menu`, `stop`, `chat`, `chevron`, `refresh`, `check` are no longer drawn (the buttons carry words). New names: `disclosure-open`, `disclosure-closed`, `popup-arrow`, `back`, `up`, `down`, `handle`, `list-bullet`, `list-check`, `running`, `waiting`, `done`, `failed`, `stopped`, `interrupted`, `caution`, `note`, and `alert-stop`, `alert-caution`, `alert-note` (36px).

## 3. Page structure

```
nav#menubar (desktop)      nav#phonebar (≤760px)
div#desk.pw-desk           ← windows tile left to right, 24px gaps
  aside#sidebar            Projects window      (Chat, Activity, Gate views; phone: π sheet)
  aside.window-files       Files window         (Work view only)
  main#main-window         the one main window; its body switches with the view
  aside#comments-panel     Review window        (Work view only)
  aside#event-info         Event Info window    (Gate view, when an event is selected)
dialogs, #toast
```

`showView(next)` in `js/chat.mjs` must also set `document.body.dataset.view = next`, set `#window-title` (project name in Chat, file name in Work, `Activity`, `Gate`), update the View menu's `aria-checked`, and update `#phone-view-label`. Side windows show and hide purely from `body[data-view]` in CSS (`[data-view-only]`).

Window activation: the window containing focus is active (striped title bar). Implement with one `focusin` listener on `#desk` that toggles `.pw-window--inactive` on the other windows.

Desktop pattern: `#desk[data-pattern="dots|gray|plain"]`, from Settings (§ 8).

## 4. Element map (JS-built elements)

| Built in | Today | New classes (keep the old one too) |
| --- | --- | --- |
| `renderProjects` | `div.conversation > button.conversation-select` | `div.conversation` > `button.pw-row.conversation-select` with `folder` icon, `.pw-row__label`, `aria-current="page"` on the current project, a `running` glyph when that project has the running job, `.pw-row__meta` “waiting” when it has a queued job |
| `renderFiles` | `button.file-item` | `button.file-item.pw-row` with `file` icon; folders get `disclosure-*` + `folder` icons and `aria-expanded`; nested files `.pw-row--nested`. Group by directory (today the list is flat): collapse folders by default except the one holding the open file |
| `messageView` | `article.message.(user|assistant)` | add `pw-msg`, plus `pw-msg--user` for the user. Label → `.pw-msg__label` with `<b>You</b>`/`<b>Pi</b>` and `<time>`; body → `.pw-msg__body`; reasoning `<details>` stays; images/audio unchanged; `a.file-link` → add `pw-file` |
| live status (`div.status`) | text | A `.pw-tool.pw-tool--live` card when the status is `Using <tool>…` (command in `.pw-tool__cmd` when known), else a `.pw-help` line. Completed tool calls with Gate results render as `.pw-tool` with two `stateGlyph`s (gate, audit) — needs the job’s Gate events (§ 9) |
| `renderAttachments` | `div.attachment-chip` | add `pw-chip`; remove button keeps `aria-label="Remove <name>"`, icon `close` |
| `renderActivity` | `article.activity-task` | `a.activity-task.pw-table__row` (columns: State, Request, Project, Source, Started, Time); `span.task-state` becomes `stateGlyph(job.status)` with class `task-state` kept. Selecting a row fills a detail pane (§ 6.3) |
| `renderGate` | `article.gate-event` | `button.gate-event.pw-table__row` (Time, Check, Decision, Tool, Arguments, Project, From). Decision = `stateGlyph(event.outcome)`. Selecting a row fills `#event-info` |
| `renderBlocks` | `.editor-block` with a `<select>` and ↑ ↓ × buttons per block | `.editor-block.pw-block`; per-block tools are replaced by one `.pw-block__handle` (icon `handle`) that opens the block menu (§ 6.2). The focused block gets `.pw-block--focused`; `#block-style` in the ruler mirrors and sets the focused block’s type |
| `renderComments` | `article.document-comment` cards in a side panel | Review items `.pw-review-item` in `#document-comments`, filtered by `#comment-filter`; inline threads `.pw-thread` under their block (§ 6.2) |
| `highlightComments` | `mark.text-anchor` | `span.pw-anchor` (`--sent` when sent to Pi, `--resolved` when shown resolved) followed by `button.pw-mark` with the comment’s number in document order |
| `renderQueue` | `#work-status`, `#work-queue` | Unchanged ids; texts become `Working on <project>` + Stop, or `Agent is idle` / `Agent is working in the terminal`. The agent state also shows in the menu bar `#agent-state` with a glyph |
| empty lists | `p.list-empty` | add `pw-empty` |

## 5. Menus

Implement the WAI-ARIA menubar pattern on `#menubar`:

- Click or Return/Down on a title opens its menu (`hidden=false`, `aria-expanded="true"`), focuses the first enabled item.
- While a menu is open, pointer-over another title switches menus. Left/Right move between titles, Up/Down between items, Home/End, Esc closes and returns focus to the title, Tab closes.
- Choosing an item runs `commands[data-command]()`, closes the menu, and briefly inverts the item (one 80 ms flash, skipped under `prefers-reduced-motion`).
- Before opening, call `updateMenus()` to set `aria-disabled` from the current state (below). Disabled items are skipped by arrow keys.
- Shortcuts are handled by one `keydown` listener that maps to the same `commands` table (⌘ on macOS, Ctrl elsewhere). Do not fire shortcuts while an IME composition is active.

| data-command | Label | Keys | Enabled when | Does |
| --- | --- | --- | --- | --- |
| about | About Pi Workbench | | always | open `#about-dialog` [Dialogs2] |
| settings | Settings… | ⌘, | always | open `#settings-dialog` |
| desktop-pattern | Desktop Pattern… | | always | open `#settings-dialog` scrolled to the pattern group |
| open-on-phone | Open on Phone… | | `config.phoneUrl` set | open `#phone-dialog` with the `Phone:` URL plh prints (expose it in `/api/config`) |
| new-project | New Project… | ⌘N | always | `#new-project` click |
| add-folder | Add Existing Folder… | ⌘O | always | `#add-folder` click |
| new-page | New Page… | ⇧⌘N | a project is selected | `#name-dialog` → existing `newPage(false)` |
| new-task | New Task… | ⌘T | a project is selected | `#name-dialog` → `newPage(true)` |
| save | Save | ⌘S | a document is open | existing `save()` |
| reload-document | Reload from Disk… | | a document is open | alert [W_Reload] when dirty, else reload |
| download-draft | Download Draft… | | a document is dirty | `#download-draft` click |
| trash-page | Move to Trash… | ⌘⌫ | a Markdown page is open and focus is not in a text field | alert [W_Trash] → existing delete |
| close-window | Close Window | ⌘W | Review or Event Info is open | close the frontmost side window |
| undo | Undo | ⌘Z | always | native undo in text; after a comment delete, restores it (§ 6.2) |
| cut / copy / paste / select-all | | ⌘X ⌘C ⌘V ⌘A | always | `document.execCommand` fallback; let native shortcuts through |
| comment-selection | Comment on Selection | ⇧⌘M | a passage is selected in the document | open the comment composer for it |
| ask-selection | Ask Pi About Selection… | | a passage is selected | comment composer with “Ask Pi” as the default |
| find-file | Find in Files… | ⌘F | Work view | focus `#file-search` |
| find-project | Find Project… | ⌘K | always | focus `#project-search` (phone: opens π sheet) — existing handler |
| view-chat … view-gate | Chat / Work / Activity / Gate | ⌘1–⌘4 | always | `showView()` |
| mode-blocks / mode-source | As Document / As Markdown Source | ⌥⌘U toggles | a Markdown page is open | set `#editor-mode` and dispatch `change` |
| toggle-review | Show Review | ⌥⌘R | Work view | toggle `#comments-panel` |
| toggle-resolved | Show Resolved Comments | | Work view | toggles resolved anchors in the text |
| next-comment / previous-comment | | ⌥⌘] / ⌥⌘[ | there are comments | move the current Review item and open its thread |
| project-chat | Open Project Chat | | a project is selected | `#project-chat` click |
| ask-document | Ask Pi About This Document… | | a Markdown page is open | focus `#document-prompt` (opens Review if closed) |
| copy-folder-path | Copy Folder Path | | a project is selected | clipboard ← project path; toast “Path copied” |
| send | Queue Message | ⌘↩ | a project is selected and the prompt or attachments are not empty | `#composer.requestSubmit()` |
| attach | Attach Files… | ⇧⌘A | a project is selected | `#attach` click |
| record | Record Audio | ⇧⌘R | a project is selected | `#record` click |
| stop | Stop | ⌘. | a job is running for the current project | existing stop API |
| cancel-waiting | Cancel Waiting Request… | | the current project has a queued job | alert, then `/api/jobs/cancel` |
| task-record | Show Task Record | | Activity has a selected job | load the record into the detail pane |
| reconnect | Reconnect | | the last poll failed | `#connection-retry` click |
| toggle-projects / toggle-files / toggle-event-info | Projects / Files / Event Info | | their view | show or hide that window |

The Project menu lists projects as `menuitemradio`s (`#menu-project-list`), checked = current; choosing one calls `selectProject()`.

The menu bar status (`.pw-menubar__status`) shows `#model · .effort` and `#agent-state` with a glyph: `Ready`, `Working · N waiting` (running glyph), `N waiting` (waiting glyph), `Connection interrupted` (caution glyph) plus `#connection-retry`.

## 6. Views

### 6.1 Chat — [Main], [S_Welcome], [S_Empty], [S_Idle], [S_Attachments], [S_Dragging], [S_Recording], [S_Error], [S_Offline]

| State | What changes |
| --- | --- |
| No projects | Projects list shows “Your projects will appear here.”; welcome shows the π mark, “What are we working on?”, **Use an Existing Folder…** and **Create Your First Project…** (default). Composer disabled. |
| Project, no messages | Welcome shows the project name as heading, the existing copy, and the three suggestion buttons. |
| Idle | Default button reads **Send**. No Stop. |
| Working | Default button reads **Queue** (it still enqueues). **Stop ⌘.** shows. The live message ends with a `.pw-tool--live` card. Under the transcript a `.pw-queue-note`: “Next: N requests waiting in <project>” when other jobs are queued. |
| Attachments | `.pw-chips` above the label; hint “N files · X MiB of 20 MiB”. |
| Dragging | `.pw-composer--dragging` and the hint “Drop to attach N files”. |
| Recording | Record button becomes **Stop Recording** with `aria-pressed="true"` and a filled dot (`.pw-recording`); hint “Recording · m:ss”; then “Transcribing…”. Text lands at the cursor (existing behaviour). |
| Error | `#error` as `.pw-alert-line` with the caution icon above the form. Copy: say what is wrong and the limit, e.g. ““site-video.mov” is 48 MiB. Limit: 12 MiB per file and 20 MiB in total.” |
| Offline | A banner under the toolbar: caution icon, “Connection interrupted. Your drafts are kept. If you just updated, quit plh, start it again, then reconnect.”, **Reconnect** (default). The menu bar shows the same state. |

Return sends on desktop (existing rule, now a Setting); Shift-Return adds a line; on phone the Return key always adds a line.

### 6.2 Work — [Work], [Final], [W_Source], [W_Code], [W_Empty], [W_Search], [W_Requests], [W_Conflict], [W_Trash], [W_Reload], [EditB], [PhoneEdit1–7]

Layout: Files window | main window (ruler + document) | Review window. The chosen editing model is **B + C**: comments open inline under their paragraph; the Review window lists them all.

**Ruler** (`#document-toolbar`): `#block-style` popup (Text, Heading, Task Checkbox, Bullet, Number, Quote, Code, Raw Markdown) for the focused block; inline format tools are optional in v1 (Markdown inline syntax is kept as text today — leave B/I/Code out until the block parser supports inline marks); `#editor-mode`; **Hide/Show Review**; **Reload**; **Move to Trash…**; `#save-status` (`Saved`, `Saving…`, `Unsaved`, `Not saved — changed on disk`).

**Block handle**: hover or focus shows `.pw-block__handle` in the left gutter (always visible for the focused block on phone). It opens a menu [P_Popups › Block handle]: Turn Into ▸ (the eight types), Move Up ⌥⌘↑, Move Down ⌥⌘↓, Comment on Paragraph, Ask Pi About Paragraph…, Delete Paragraph. This replaces the per-block select and ↑ ↓ × buttons. The block’s `aria-label` stays (`Heading`, `Block text`) — the tests use it.

**Adding blocks** (decided 2026-10-13, task 105; the boards never drew it): Notion-style. The handle menu has **Add Block Below** after Turn Into; Return at the end of a block starts a new one (lists continue; Return in an empty list item turns it into a paragraph; code and raw blocks keep Return as a newline); Backspace in an empty block removes it and returns the caret to the block above; a click on the empty page below the last block adds a paragraph there (or reuses an empty last paragraph). The ruler has no Add Block button. The hover zone of each block covers the 48px gutter so the pointer can travel to the handle, and an open handle stays shown. Menu items name the block's type (Comment on Task, Delete Heading; "Paragraph" is the plain-text type). Delete shows a toast with Undo.

**Selecting text** in the document shows a floating bar (`.pw-floatbar`) under the selection with **Comment ⇧⌘M** and **Ask Pi…**; on phone, a bar at the bottom of the screen instead (never inside the system’s own selection menu) [PhoneEdit2]. Choosing Comment opens the composer: desktop — in the Review window (`#selected-passage`, `#comment-form`, existing ids); phone — a sheet [PhoneEdit3] with **Add Comment** (default) and **Add & Ask Pi**.

**Markers and inline threads**: every comment’s passage gets a `.pw-anchor` and a numbered `.pw-mark`. Clicking a marker opens its `.pw-thread` under the block; one thread open at a time. Thread actions: Reply (existing reply API), **Ask Pi** (only if not yet sent — existing “Ask agent about this passage”), **Resolve** / **Reopen** (existing resolve API), **Delete** (only your own comments not yet sent to Pi). When Pi’s reply is a suggested change, show `.pw-suggest` with **Keep Mine** and **Apply Change** (default) — see § 9 for the data this needs.

**Review window** (`#comments-panel`): `#comment-filter` Open · Resolved · Deleted with counts; items in document order (`.pw-review-item`; head button opens the thread in the text; actions by state: Open → Resolve (+ Delete if unsent), Resolved → Reopen, Deleted → Restore). Footer: **Show resolved in the text** checkbox; document request form (`#document-prompt-form`, existing) and `#document-request-history` (existing) [W_Requests].

**Delete and undo**: Delete hides the comment and its marker, shows the toast “Comment deleted. It’s kept under Deleted in Review.” with **Undo ⌘Z**, and moves it to the Deleted filter. Deleted comments are kept for good (no expiry); **Restore** brings them back. Needs § 9.

**Text and code files** [W_Code]: Markdown source textarea only, no ruler controls, no Review window, status “Text and code files have no comments”.

**No document** [W_Empty]: “Choose a roadmap, task, or file.” and “Or start one: New Page… ⇧⌘N, New Task… ⌘T.”

**Find a file** [W_Search]: `#file-search` filters (existing); show “N of M files match “q”. Esc clears.” under the list; empty → “No matching files”.

**Save conflict** [W_Conflict]: replace the inline `#save-recovery` row’s styling with the alert content (keep the ids): caution icon, ““<file>” changed on disk while you were editing.” / “Your draft is safe in this window. Nothing has been overwritten.”; buttons **Reload from Disk** (left, `#discard-draft`), **Retry Save** (`#retry-save`), **Download Draft…** (default, `#download-draft`).

### 6.3 Activity — [Activity], [A_Attention], [A_Empty]

Table of jobs (`#activity-list`), sorted as today. Selecting a row (click, or Up/Down with the list focused) fills a detail pane under the table: heading “<State> in <project>”, the request, Phase, Last command, Gate counts, an error line for failed jobs, actions (**Open Chat**, **Open Document** when there is one, **Stop ⌘.** when running, **Cancel…** when queued), and the Markdown task record (`#activity-record`, `#activity-record-text`). Empty: “All caught up” + the existing copy + **Open Project Chat** (default). `#activity-summary`: “1 running · 1 waiting · 3 need attention” / “Nothing running or waiting”. `#activity-count` badge in the Activity tab counts running + waiting only.

### 6.4 Gate — [Gate], [G_All], [G_Empty]

Table of events (`#gate-events`), newest first, filtered by `#gate-filter` (All Checks, Before Execution, After Execution, Blocks & Failures — the existing values `all`, `gate`, `audit`, `failures`). Selecting a row opens `#event-info`: alert icon by outcome (stop for BLOCK/DRIFT_DETECTED, caution for REVISE/EXECUTION_FAILED/POSTCONDITION_FAILED, note for ESCALATE, none for ALLOW/SUCCESS), the reason (verbatim), the arguments in mono, Decision with the raw outcome code (`BLOCK`), Tool, Project, From, Proposal id, **Open Request**, **Copy Command**. When nothing is selected, select the newest non-ALLOW event so its reason is visible. Empty: “No checks yet” + explanation; `#gate-live` “Connecting to Gate :8000…”.

## 7. Dialogs, alerts, sheets, toasts

| Today | New |
| --- | --- |
| `window.prompt(task?'Task name':'Page name')` in `newPage` | `#name-dialog` [Dialogs2 › New Page]: title New Page / New Task, label Page name / Task name, help line, **Cancel**, **Create** (default) |
| `window.confirm('Reload from disk and discard the unsaved draft?')` | `#alert-dialog` caution [W_Reload]: “Reload “<file>” from disk?” / “Your unsaved changes in this window will be replaced by the file on disk.” — **Reload** (left), **Keep Editing** (default) |
| `window.confirm('Move this page to the workspace trash?')` | `#alert-dialog` stop [W_Trash]: “Move “<file>” to the Trash?” / “Its comments go with it. You can restore it from the data folder’s .trash.” — **Move to Trash** (left), **Cancel** (default) |
| cancel a queued job (no confirm today) | `#alert-dialog` caution: “Cancel the waiting request?” / “It has not started. You can send it again from the chat.” — **Cancel Request** (left), **Keep Waiting** (default) |
| `#folder-dialog` | Same ids, new look [Dialogs], [Dialogs2 › Make This Folder a Project]. Title “New Project” / “Make This Folder a Project”; `#folder-use` reads **Create** / **Use This Folder** |
| `#startup-error` paragraph | Stop alert in `.pw-dialog` (markup in the reference `<head>` script), text must contain “start plh again” |

Write one helper: `ask({icon, message, detail, danger, safe}) → Promise<'danger'|'default'>` using `#alert-dialog.showModal()`. Esc resolves `'default'`.

Phone: dialogs become sheets (`.pw-sheet`) — same content, buttons 44px, full width.

## 8. Settings and persistence

`#settings-dialog` [Dialogs2 › Settings]: Appearance (Paper / Inverse / Match System → `html[data-theme]` and `html[data-appearance]`), Desktop pattern (dots / gray / plain → `#desk[data-pattern]`), Return sends a message (checkbox). Store with the existing `writeState('appearance'|'desktopPattern'|'returnSends', …)` (localStorage, wrapped in try/catch already) and apply before first paint by an inline script in `<head>` reading `localStorage['plh.appearance']`.

## 9. Data the new UI needs

| Need | Status | Change |
| --- | --- | --- |
| Comment resolve / reopen | exists (`/api/documents/resolve`) | none |
| Comment delete (soft, kept for good) + restore | **missing** | add `deleted` (ISO time or null) to the comment record and `/api/documents/delete-comment {path,id,deleted:bool}`; list deleted comments in `/api/document` with the flag; never hard-delete. Test in `tests/test_documents.py` |
| “Sent to Pi” state | partly (`chat_id` on the comment after Ask) | treat `comment.chat_id` (or a job with `comment_id`) as sent; expose `sent_at` |
| Pi’s suggested change (Keep Mine / Apply Change) | **missing** | phase 2: let the agent return `{suggestion:{anchor,replacement}}` on a comment job; **Apply Change** = save the document with `anchor` replaced (with the usual revision check), then resolve. Until then, show Pi’s `agent_reply` as a normal reply. 2026-10-13: done in task 82 (`apply-suggestion`, `keep-suggestion`) |
| Gate results per tool call in chat | **missing** | phase 2: include in each job’s events the Gate decision and audit status per tool call (the ledger already records both); render as `.pw-tool__checks`. 2026-10-13: done in task 81 (`tool_call` on ledger events, `tools[]` on jobs) |
| Phone URL for Open on Phone… | printed by plh only | add `phoneUrl` to `/api/config`. 2026-10-13: done in task 80 |

Everything else in the design uses data the API already returns.

## 10. Phone (≤760px) — [Phone pages], [Phone], [PhoneEdit1–7]

- `#menubar` hides; `#phonebar` shows: **π** (`#open-menu`, opens the π sheet = `#sidebar` with `body.menu-open`, existing `menu()` logic), the view popup `#phone-view` (Chat, Work, Activity with its count, Gate) [Ph_Views], and the status.
- The π sheet [Ph_Pi] holds: agent status with **Stop**, project search and list, **New Project…**, **Add Folder…**, then Settings… and About Pi Workbench.
- Work on phone: the Files window is a full screen [Ph_Files] (`body[data-pane="files"]`); tapping a file opens the document full screen [PhoneEdit1] with **‹ Files** in the phone bar and **Comments N**, which opens the Review window as a sheet [PhoneEdit6] (`.is-sheet`).
- Activity and Gate: list screens with a segmented filter [Ph_Activity], [Ph_Gate]; tapping a row opens a detail screen with ‹ back [Ph_ActivityDetail], [Ph_GateDetail].
- Selection: the phone’s own long press selects text; the app shows its own bottom bar (**Ask Pi…**, **Comment**) while a selection exists, listening to `selectionchange`. Do not cancel `contextmenu` or `touchstart`. Every other action is a tap.
- Offline [Ph_Offline]: banner with **Reconnect**; the draft stays in the composer; Send disabled.
- All controls ≥44px (components.css does this at ≤760px). No fake status bar; respect safe-area insets (layout.css).

## 11. Test updates (`tests/browser/chat.cjs`)

| Line | Today | Change |
| --- | --- | --- |
| 48–49, 100–102 | buttons `Open document`, `Markdown record`, `Cancel`, `Stop` found inside `.activity-task` | Either keep a compact action row inside each `.activity-task` row (visible on hover/selection), or select the row first and find the buttons in the detail pane. Pick one and update the selectors |
| 72 | per-block `Heading` textbox | unchanged (keep `aria-label`) |
| 85 | `getByText('BLOCK',{exact:true})` | The table shows the word **Blocked**; the raw code `BLOCK` appears in `#event-info` › Decision. Keep the test by auto-selecting the newest blocked event, or change it to `Blocked` |
| 86 | reason text visible | `#event-info` shows the reason verbatim |
| all `Saved`, `No matching projects`, `#startup-error` checks | | unchanged |

Add browser checks for: menu bar keyboard navigation (open File with keyboard, arrow to New Project…, Return opens `#folder-dialog`); ⌘1–⌘4; the Trash alert defaulting to Cancel; comment delete → toast → Undo; phone width (390×844) shows `#phonebar`, hides `#menubar`, every button ≥44px tall.

## 12. Build order

Each step is one task file and one commit; run the repo gate after each: `PATH=$HOME/.nvm/versions/node/v24.16.0/bin:$PATH python3 tests/verify_workflow.py` (unittest suite and Node tests), then the browser test, which the gate does not run: `NODE_PATH=<node_modules with playwright> node tests/browser/chat.cjs` (it starts the fake Pi itself). Note 2026-10-13: the handoff said `python3 -m pytest`; pytest is not installed here, the suite is unittest.

1. **Foundations.** Add `design/`, `fonts/`, server allowlist + woff2 MIME, installer copy. Tests for the new static paths. No visual change yet.
2. **Tokens and components.** Link `tokens.css` and `components.css` from the current `index.html`; switch `ui.mjs` to `icons.mjs`. Existing layout still works.
3. **Markup and layout.** Replace `index.html` with `index.reference.html` and `chat.css` with `layout.css`. Wire `body[data-view]`, `#window-title`, window activation. All existing tests green (apply § 11 where needed).
4. **Menu bar.** `commands` table, menubar keyboard pattern, shortcuts, `updateMenus()`, Project menu list, status area.
5. **Dialogs.** `#alert-dialog`, `#name-dialog`, folder dialog restyle, startup alert. Remove every `confirm`/`prompt`.
6. **Chat states.** Send/Queue, Stop, queue note, attachments hint, dragging, recording label, error line, offline banner.
7. **Work: ruler and block handle.** `#block-style`, handle menu, focused block, keyboard moves.
8. **Work: comments.** Markers, inline threads, Review window with filters, selection float bar, phone selection bar. Soft delete + undo toast (needs the § 9 API).
9. **Activity.** Table rows, detail pane, empty state, badge count.
10. **Gate.** Table rows, `#event-info`, empty state.
11. **Settings.** Appearance, desktop pattern, Return sends; apply before first paint.
12. **Phone.** Phone bar, π sheet, view popup, Files screen, Review sheet, Activity/Gate detail screens, safe areas.
13. **Phase 2 data.** Suggested changes (Apply Change), Gate results per tool call, phone URL in config.

## 13. Acceptance checklist

- [ ] Every artboard on **Every menu & state** and **Phone pages** can be reproduced in the running app with real data.
- [ ] No `window.confirm`, `window.prompt` or `alert(` left in `js/`.
- [ ] Every state shows a glyph and a word; nothing depends on colour.
- [ ] One default button per window/dialog/sheet; Return activates it; Esc cancels.
- [ ] Menu bar fully operable by keyboard; every command reachable from a menu.
- [ ] 390px wide: no horizontal scroll, every control ≥44px, phone bar instead of menu bar.
- [ ] Inverse theme: no element keeps a light-only colour (check `#fff`/`#000` literals; use tokens).
- [ ] Works offline: no request leaves localhost except the tailnet proxy plh starts.
- [ ] `tests/verify_workflow.py` passes (unit, Node and browser tests).


## 2026-10-13 additions (tasks 97, 106, 107)

- **Projects home, then inside a project** (task 107, user decision). The left window follows `body[data-level]`, in every view: `projects` shows the Projects window (rows carry the running glyph or "waiting"), `project` shows the project window (title = project name, close box and "‹ Projects" go back, info bar "N open tasks · N folders · N files", Find a file, Plan above Files). Choosing a project keeps the current view. File › New Project… and ⌘K (Find Project) work from inside a project; ⌘K returns to the Projects home. Phone keeps the π sheet and the Work › Files screen.
- **Plan above Files** (task 97): `js/files-window.mjs`, per ListGroup and ListRow. `/api/project-files` adds `done`, `total`, `blocked` to ROADMAP.md and `tasks/*.md`; `/api/documents/create-roadmap` backs Create Roadmap. Opening or creating a file from the project window switches to Work.
- **Where you are is in the path** (task 106): `js/router.mjs`. `/projects`; `/p/<project>/chat|work|activity|gate`; `/p/<project>/work/<file in the project>`. `history.pushState` on every view, project, level or file change; Back/Forward replay it; `/` and the old `/?chat=` / `/?document=` links redirect. The server answers these paths with `index.html` (`harness/web_chat.py`). htmx stays out (§ no framework).


## 2026-10-13 · Task 119: agent scope, what Pi sees, catching the canvas up

Boards are on the canvas; the new CSS is at the end of `components.css` (also in `system/components/bundle.css`), token names only. Classes that moved from `chat.css` into `components.css`: `.pw-infobar__back`, the block types (renamed `.pw-block.quote` → `.pw-block--quote`, `.block-content` → `.pw-block__content`), the Markdown message body (`.pw-msg__body--md`, `.pw-msg__task`), and `.pw-thread__line` → `.pw-thread__state`. Delete them from `chat.css` when you take this file.

### A. Activity and Gate are app-level windows — [Projects], [Activity], [A_Attention], [A_Empty], [Gate], [G_All], [G_Empty], [G_Tablet], [MB_Status], [Ph_Views], [Ph_Pi], [Ph_Activity], [Ph_ActivityDetail], [Ph_Gate], [Ph_GateDetail]

- **Levels.** `body[data-level]` gains two values: `activity` and `gate` (routes `/activity`, `/gate`). Both show the **Projects window** on the left (as `projects`) and replace the main window's content with the Activity or Gate panel. `data-view` keeps `chat|work` for the project window; it is not changed by opening Activity or Gate, so Back and ⌘1/⌘2 return to the same project and view.
- **Project window tabs.** `#workspace-bar .view-tabs` keeps only `#chat-tab` and `#work-tab`. Remove `#activity-tab`, `#gate-tab` and `#activity-count` (the count moves to the status button and the Agent section). `tests/browser/chat.cjs` that click `#activity-tab`/`#gate-tab` switch to `#agent-activity`/`#agent-gate` or ⌘3/⌘4.
- **Main window title.** `#window-title` reads “Activity · All Projects” / “Gate · All Projects”. The title-bar close box (`data-command="close-window"`, ⌘W) and Back both return to the previous location (`history.back()`; if there is none, `/projects`). No extra “‹ Projects” link: the Projects window is already on the left with the Agent row selected.
- **Toolbar.** Activity: Show + Project popups, summary on the right. Gate: Show + Project popups (add `#gate-project`, same options as `#activity-project`), Refresh ⌘R, live status. The infobar copy stays.
- **Project column.** Rows stop being links themselves: `<div class="pw-table__row" role="row" tabindex="0" aria-current>`; the Project cell is `<a class="pw-link" href="/p/<project>/chat">`. Return on a row opens its detail; the link takes Tab. Gate merges Tool + Arguments into one **Command** cell (mono, ellipsis); the tool name moves to Event Info. Columns: Activity `130px 1fr 170px 130px 90px 56px`; Gate `70px 58px 104px 1fr 150px 70px`.
- **Agent section** (Projects window, under the project list). Markup:
  ```html
  <section class="pw-group" aria-labelledby="agent-title">
    <div class="pw-group__head"><h3 class="pw-group__title" id="agent-title"><button class="pw-group__toggle" aria-expanded="true" aria-controls="agent-rows"><span data-icon="disclosure-open"></span>Agent<span class="pw-group__count">All projects</span></button></h3></div>
    <div class="pw-group__body" id="agent-rows" role="list">
      <a id="agent-activity" class="pw-row" role="listitem" href="/activity" aria-keyshortcuts="Meta+3" aria-current="false"><span data-icon="list-bullet"></span><span class="pw-row__label">Activity</span><span id="agent-activity-meta" class="pw-row__meta"></span></a>
      <a id="agent-gate" class="pw-row" role="listitem" href="/gate" aria-keyshortcuts="Meta+4" aria-current="false"><span data-icon="gate"></span><span class="pw-row__label">Gate</span><span id="agent-gate-meta" class="pw-row__meta"></span></a>
    </div>
  </section>
  ```
  The project list becomes the first ListGroup (“Projects”, count = number of projects). Meta strings: Activity `N running · N waiting` (running glyph) | `Nothing running` | `N needs attention` (caution glyph; failed, stopped or interrupted since the person last opened Activity); Gate `N checks · N blocked` (stop glyph) | `N checks today`. `aria-current="page"` on the open one. Add a `gate` icon to `icons.mjs` (two posts, two rails: `M2.5 1v14M13.5 1v14M2.5 4.5h11M2.5 9.5h11M5 4.5v5M8 4.5v5M11 4.5v5`).
- **Status button** — StatusButton card. Replace `#agent-state`'s parent: `<button id="agent-status" class="pw-statusbtn" aria-keyshortcuts="Meta+3"><span data-icon="running"></span><span id="agent-state" role="status">Working · 1 waiting</span><span class="pw-statusbtn__more"><span data-icon="disclosure-closed"></span></span></button>`. Click opens `/activity`. `aria-label` is set with the state (“Agent status: Working, 1 waiting. Open Activity”). Add `.pw-statusbtn--attention` and the caution glyph while the attention count is > 0 (round 3: words and priority below). `#connection-retry` stays after it.
- **Menus.** View: remove Activity ⌘3 and Gate ⌘4; Chat/Work stay enabled while Activity or Gate is open and return to the last project in that view (changed in round 3). Window: after Event Info, a separator, then `data-command="view-activity"` “Activity · All Projects ⌘3” and `view-gate` “Gate · All Projects ⌘4” (`menuitemradio`, checked when open). ⌘3/⌘4 keep working.
- **Context links.** “Show in Gate” on a ToolCall → `/gate?event=<id>` (selects the row, opens Event Info). Event Info's “Open Request” becomes “Show in Activity” → `/activity?job=<id>`.
- **Tablet (761–1100px).** Confirmed: Event Info floats over the main window, right-aligned, `position:absolute; top:45%` as built, with its close box. The Projects window narrows to 220px; Gate hides the Check and From columns there (both are in Event Info).
- **Phone.** `#phone-view-menu`: Chat, Work, `<div class="pw-menu__sep" role="separator">`, “Activity · all” (key = live count), “Gate · all” (key = blocked count). `#phone-view-label` shows “Activity · all” / “Gate · all”. The π sheet gets the same Agent ListGroup under the project list (44px rows) and loses the separate Working/Stop strip (Stop is in the Activity detail). `#phone-status` becomes a `.pw-statusbtn` that opens Activity. Detail screens' back buttons read “‹ Activity · all”, “‹ Gate · all”; Activity detail “Open Chat” becomes “Open in Project”.

### B. What Pi sees, and how full the chat is — [C_ChatDesk], [Main], [S_Near], [S_Compacted], [S_Summary], [S_NewConversation], [S_Fresh], [Final], [W_Comment], [PhoneEdit3]

- **API.** `GET /api/context-preview?project=&document=&text=` returns `{items:[{label, path?, kind:'plan'|'this file'|'tasks'|'mentioned'|'related'}], tokens}` from the same selector the harness uses for the turn. Job records add `also_read: [path]` (files Pi opened with its tools that were not in the context) and `context: {used, limit, compacted_at?, summary_id?}` on chat jobs.
- **ContextLine** (`.pw-context`). Ids: `#chat-context` under `.pw-composer__row`; `#comment-context` under `#comment-form`; `#document-context` in `#document-discussion`; inside an unsent thread `.pw-thread__actions > .pw-context`. Update on input (debounce 300 ms) and on document change. Items: file names are `<a href="/p/<project>/work/<path>" title="<path>">`; “N open tasks” is text. Overflow: render all items, then hide from the end while `list.scrollWidth > list.clientWidth`; the hidden count goes in `.pw-context__more` (`aria-expanded=false`, `aria-label="Show N more"`). Click toggles `data-expanded` on the line (wraps, shows all, button reads “Less”). Empty: “Pi sees: nothing from this project”.
- **Also read** (`.pw-context.pw-context--after`, label “Also read:”) is appended to a Pi message, a Pi thread answer and a whole-file answer when `also_read` is non-empty. Same links, no overflow counter (wraps).
- **ContextMeter** (`#context-meter.pw-meter`, `role="meter"`) replaces “Session: … only” at the right of the Chat footer status bar. `aria-valuenow` = used in k, `aria-valuemax` = limit in k, `--pw-meter` = percent. States: `< 50%` plain; `≥ 50%` `.pw-meter--near` + “· earlier turns are summarised after this answer”; after compaction “· summarised HH:MM” until the next send. Phone: text only in the footer line.
- **CompactionMarker.** When a chat job reports `compacted_at`, insert `<details class="pw-compacted">` after the last summarised message (summary text from `/api/chat/summary?id=`, rendered with `message-markdown.mjs`). The earlier messages stay visible. Toggle label Show Summary / Hide Summary.
- **Agent menu.** After Show Task Record: separator, `data-command="compact-now"` “Compact Now” (no alert; adds the marker; toast “Conversation summarised.” without Undo), `new-conversation` “New Conversation…”, `earlier-conversations` “Earlier Conversations ▸” (submenu, newest first, “13 Oct · 84 messages”). All three only in Chat.
- **New Conversation alert** (`#alert-dialog`, note icon): message “Start a new conversation in <project>?”, detail “Pi starts fresh with only the project context. This conversation is kept, read only: open it from the top of the new one or from Agent › Earlier Conversations.”, buttons Cancel / **New Conversation** (default). The new transcript starts with `.pw-convline` “‹ Earlier conversation · 13 Oct · 84 messages · kept, read only”; opening it shows the old transcript with the composer hidden and an info bar “Earlier conversation · read only” + Back to Current. Routes: `/p/<project>/chat` (current), `/p/<project>/chat/<conversation id>` (earlier).
- **Sent comments.** Thread `.pw-thread__state` lines: “Saved with the file · not sent to Pi” → “Sent to Pi · waiting in queue · can no longer be deleted” (waiting glyph) → “Pi is working on it” (running) → “Pi answered · HH:MM · can no longer be deleted” (done). Sent and unanswered: a `.pw-link` “Show in Activity” at the end of the actions, also on the Review item (replaces the removed Open Chat). Answers stay in the thread; nothing is posted to Chat.

### C. What shipped, now drawn

1. **Projects home / project window** — [Projects], [Main], [C_ChatDesk], [C_WorkDesk], [Work], [W_NoPlan], [C_ProjectsWin], [C_ProjectWin]. As built (task 107). The canvas now shares one ProjectWin component across Chat and Work.
2. **Work toolbar and ruler** — [Final], [C_WorkDesk], [Work], [W_Blocks]. As built. The status bar left shows the focused block's type (or Not saved / No document open), the right the full path.
3. **Adding blocks** — [W_Blocks], [P_Popups], [PhoneEdit5]. As built. Additions: the empty-block placeholder “Write, or choose a style in the ruler” (“List item” in lists) via `data-placeholder` + `.pw-block--empty`; the delete toast reads “<Type> deleted.” with Undo ⌘Z; the Turn Into submenu labels the plain type **Paragraph** (the repo still says Text in `#turn-into-menu`).
4. **Block types** — DocumentBlock card. As built, with the class rename above.
5. **Inline thread** — [Final], [C_WorkDesk]. Full column width; order: state line, Reply field + Reply, Ask Pi (unsent), Resolve, gap, Delete (unsent, yours).
6. **Review window** — [Final], [W_Comment], [W_Requests]. As built, plus: unsent items get Ask Pi; sent items get Show in Activity; ContextLine in the comment composer and in the whole-file box; the whole-file help reads “The answer appears here, not in Chat.”
7. **New File / New Task** — [Dialogs2]. As built; help for New File adds “Any name works; .md is added when there is no extension, and “specs/phone.md” creates the folder too.” The empty Work state says “Or start one: New File… ⇧⌘N, New Task… ⌘T.”
8. **Chat Markdown** — [C_ChatDesk] (idle and summary states). As built.
9. **Phone access off** — [Dialogs2]. `#phone-dialog` gets an off state when `/api/phone` reports `serve: false`: Caution alert “Phone access is off.” / “Serve is not enabled on your tailnet. Enable it once at <link>, then quit plh and start it again.”, buttons Copy Link / **Done**; the address field and Copy are hidden.
10. **Gate naming** — every board, menu, tab and copy now says Gate; the old checker boards are removed from the canvas.

## 2026-10-13 · Round 3: tables, open questions, workflows

Boards: [W_Table], [Ph_Table], [Ph_TableEdit], [P_Popups], [PhoneEdit1], [PhoneEdit5], [S_Earlier], [M_AgentEarlier], [A_Retry], [S_FirstChat], [MB_Status], the **Workflows** page (F1–F10). New CSS at the end of `components.css` (also in `system/components/bundle.css`): MarkdownTable, Table block, `.pw-readonly`, `.pw-qr`; `.pw-step` is canvas-only. Move `.pw-msg__table` rules out of `chat.css` (the shared rule set now covers it).

### A. Table block — DocumentBlock card § Table, MarkdownTable card

- **Type id** `table`, label **Table**, between Quote and Code everywhere: `#block-style`, `#turn-into-menu`, the new `#add-below-menu`, the phone block sheet (3×3: Paragraph, Heading, Task / Bullet, Number, Quote / Table, Code, Raw Markdown). Parse: a block of lines where line 2 matches `^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?$`; anything else stays Raw Markdown.
- **Rest**: `<div class="pw-block pw-block--table" data-type="table"><div class="pw-block__content"><div class="pw-mdtable" tabindex="0" role="region" aria-label="Table: Control, Height, Where"><table>…</table></div></div></div>`, built as DOM nodes with `message-markdown.mjs`'s inline tokens; `data-align` from the rule row.
- **Editing**: click inside, Return on the focused block, or the menu's Edit as Markdown → add `.pw-block--editing`; content becomes `<pre class="pw-block__source" contenteditable="plaintext-only" spellcheck="false">` + `<p class="pw-block__hint">Table as Markdown · Esc or click outside shows the table</p>`. Blur or Esc re-renders. If it no longer parses: keep editing state, hint `.pw-block__hint` with the caution icon and “Not a table yet: add a rule row like | --- | --- | under the header. Saved as written.” Save always writes the text as typed.
- **Create**: Turn Into › Table / Add Block Below › Table insert `| Column | Column |\n| ------ | ------ |\n|  |  |` in editing state, selecting the first “Column”.
- **Menu** for a table block: after Add Block Below ▸, a separator, `data-action="add-row"` Add Row, `add-column` Add Column, `edit-markdown` Edit as Markdown (key ↩). Row/column edits rewrite the Markdown (pad cells to the widest, keep alignment colons) and go through the same Undo stack as typing.
- **Add Block Below ▸** becomes a submenu (`#add-below-menu.pw-menu--sub`) with the nine types, Paragraph first; Return on the parent item still adds a Paragraph.
- **Comments in cells**: anchors are text offsets inside the rendered cell text, mapped to the source like any other block; while editing, marks are hidden.
- **Phone**: the table reads in place and scrolls inside its frame. Tap → editing in place; the bottom bar swaps to Block style · Add Row · Add Column · Done (default). PhoneEdit1's bar drops B and I (no inline marks yet) and gets the bullet tool.
- **Not now**: cell-by-cell editing (Tab between cells, inline row/column handles). Revisit when inline marks land.

### B. Answers to the open questions

1. IMPLEMENTATION.md: this file now carries the task 119 section above and this one. It is published in the design-system artifact as `IMPLEMENTATION.md`; copy it to `design/IMPLEMENTATION.md` when re-syncing.
2. SegmentedControl: two view tabs. Popup: Paragraph … Table, Code, Raw Markdown. Cards fixed.
3. StatusButton: a `<button>` (boards fixed). Waiting only: clock glyph + “1 waiting”. Attention: the real word — “Failed · 1 needs attention”, “Stopped · …”, “Interrupted · …”; mixed: “2 need attention”. Opening Activity by any route clears it (A_Attention now shows the cleared button). Attention wins over Working until then. [MB_Status]
4. InlineThread: keep Ask Pi on answered threads. **Change**: a follow-up answer is appended, not a replacement; earlier answers stay so the thread reads as a conversation. State line during it: “Sent to Pi · waiting in queue · follow-up”. [F3·6]
5. ContextLine: file first for comments and whole-file requests, plan first in Chat. Card fixed.
6. ContextMeter: show Pi's reported usage (history + that turn's context). Label built as one string, no space before k.
7. New Conversation alert: confirmed as drawn. It is not destructive (the old conversation is kept), so the expected action is the default.
8. Earlier conversations: address `/p/<project>/chat/earlier/<id>`. Read-only view: `.pw-readonly` bar under the toolbar (“Earlier conversation · 13 Oct, 09:12 – 14:30 · 84 messages · read only” + Back to Current, default), composer and meter hidden. Agent › Earlier Conversations ▸ lists them newest first with the message count as the key text. [S_Earlier], [M_AgentEarlier]
9. Gate icon: added to the Icons group as `gate.svg`.
10. Returning: the close box (⌘W) goes back to the last page (fallback `/projects`). **Change**: View ⌘1/⌘2 stay enabled in Activity and Gate and open the last project in that view. A project row or Project-column link opens that project's Chat.
11. Activity empty copy reworded: “Requests from every project, its comments and whole-file questions wait here in one queue. Terminal Pi runs directly and shows in Gate.”
12. G_Tablet: confirmed.

### C. Workflows (page “Workflows”, boards `F<n>_<Name>_<step>`, phone `…_P<step>`)

Each step board is the real screen plus a caption: the person's action → what they see, and, where a step could lose them, what fixed it.

| Flow | Where people could get lost | Fixed in |
| --- | --- | --- |
| F1 First run | After Create, an empty Chat gave no hint that a plan exists; after Create Roadmap, nothing said what was created | firstchat copy points at Plan (desktop) and an **Open the Plan** button (phone); status bar names the new files |
| F2 Chat and Activity | Returning from Activity; ⌘1 disabled there | close box goes back; ⌘1/⌘2 enabled |
| F3 Comment and ask | Desktop had no Add & Ask Pi (only phone); after an answer, whether to ask again | Add & Ask Pi in the Review composer; Ask Pi stays on answered threads; follow-ups append |
| F4 Whole file | Where the answer goes | “The answer appears here, not in Chat.” and a waiting card with Show in Activity |
| F5 Plan | A finished task vanishing under the pointer | it stays at 3/3 with a done mark until the next refresh; the status bar says it moves to Done |
| F6 Edit | Tables only as pipe text | Table type; Add Block Below ▸ |
| F7 Long chat | Finding an earlier conversation; knowing it is read only | link at the top, Agent › Earlier Conversations ▸, the read-only bar with Back to Current |
| F8 Something wrong | Retry without context | Ask Pi to Retry… dialog with an optional note; failed record kept |
| F9 Phone access | Address shown when Serve is off | off state replaces the address; QR (same as the terminal's) when on |
| F10 Switch projects | Losing the view when switching | choosing a project keeps the view; ⌘K filters in place |

New states used by the flows (all on the shared components): ChatDesk `typing`, `newproject`, `firstchat`, `blocked`, `phoneon`, `phoneoff`, `earlier`; WorkDesk `newplan`, `jsa`, `sent`, `piworking`, `answered`, `followup`, `resolved`, `applied`, `askfile`, `sentfile`, `newtask`, `task0`, `task2`, `task3`, `taskdone`, `projects`, `findproject`; ActivityDesk `retry`; ProjectWin `new`, `jsa`, `newplan`, `task*`; ProjectsWin `query`.

- **Open on Phone**: `#phone-dialog` shows `<div class="pw-qr">` with the same QR the terminal prints (render the SVG server-side from the phone address, `/api/phone` → `{url, serve, qr_svg}`), then the address and Copy. Off: the caution alert from round 2; Copy Link copies the enable link.
- **Ask Pi to Retry…**: `#alert-dialog` is not enough (it has a field): a `<dialog id="retry-dialog">` with the quoted request, “Add a note for Pi (optional)”, help “Queues the request again in <project>. The failed run stays in its record.”, Cancel / **Queue Again**. POST `/api/jobs/<id>/retry {note}`.
- **New Project** dialog help: “Creates the folder “~/code/<name>” with ROADMAP.md and tasks/001-first-task.md, then opens its Chat.”
- **First Chat** empty state copy: “Your project is ready: a roadmap and a first task are in Plan on the left. Ask Pi to fill them in, or open them in Work.”

### D. Corrections

- The Chat composer no longer binds a draft object (boards showed “[object Object]”); the meter label is one string (“Context 20k of 32k”).
- Phone: Ph_Pi has the Agent section instead of the status card; Ph_Views reads Chat, Work, separator, “Activity · all”, “Gate · all”; Phone (chat) has the status button, Pi sees, and the meter as text.

## 2026-10-14 · Round 4: drawing what shipped between rounds

Boards: [MB_Model], [Ph_Model], [Ph_ModelList], [W_FolderSel], [W_Rename], [W_TrashFolder], [Ph_FileMore], [Ph_FolderMore], [Ph_Recording], [M_View], [M_Window], [Dialogs2], [Final], [C_WorkDesk], [Ph_ThreadAnswered]. New CSS at the end of `components.css`: `.pw-menubar__pick`, `.pw-menubar__picks`, `.pw-menu--end`, `.pw-menu__note`, `.pw-btn--rec`, `.pw-thread__help`. Move `.pw-menubar__pick` and `.model-controls` out of `chat.css` (`.model-controls` becomes `.pw-menubar__picks`).

1. **Model and thinking menus (task 147)** — as built, with three changes. (a) Show the Ollama tag (`gemma4:12b`) in the title, the menu and the toast; not “Gemma 4” in one place and a tag in another. (b) The footnotes become `<p class="pw-menu__note" role="note">` after the separator instead of disabled menu items (a disabled item is announced as an unavailable command). (c) The ready toast has no button; it is information. Model notes: “thinks · sees”, “thinks”, “no thinking”, “no tools” (dimmed, `aria-disabled`). No-thinking title “No thinking”, dimmed, menu still opens with dimmed items and the note “<model> does not think. Choose a model that thinks to set a level.” Phone: the π sheet gets a **Model** group under Agent: two 44px rows (Model › gemma4:12b, Thinking › High) that open a sheet with the same list and note; while loading, the Model row reads “Loading qwen3:8b…”.
2. **Rename, move, trash (task 146)** — as built. The dialog's default button reads **Rename** when only the name changes and **Move** when the folder changes; the help names both ends and adds “Its comments move with it.” Folder trash alert: “Move the folder “drafts” and its 3 files to the Trash?” / “Their comments go with them. You can restore them from the data folder’s .trash.”, Cancel default. **Phone answer**: a ⋯ (More) button at the right of whatever is open — the document bar for a file, and a folder opens as its own level from Files (‹ Files · drafts · ⋯). More opens a sheet titled with the path: file — Rename or Move…, Copy Path, Ask Pi About This File…, Download Draft…, ═, Move to Trash…; folder — New File in drafts…, Rename or Move…, Copy Path, ═, Move to Trash…. The same dialogs follow as sheets. Ids: `#doc-more`, `#folder-more`, `#more-sheet`.
3. **Chat and Work from Activity and Gate (task 130)** — confirmed, and taken further: **Window** is now the only home for places (Chat ⌘1, Work ⌘2, Projects/Files/Review/Event Info, Activity ⌘3, Gate ⌘4); **View** keeps only how you see the current document (As Document / Markdown Source, Review, resolved comments, next/previous comment). The app windows' info bar starts with `<a class="pw-infobar__back" href="/p/<project>/<view>">‹ pi-local-harness</a>` — confirmed; it names the project you will return to, which beats a generic Back.
4. **Open on Phone** — as built: QR 184px in a 1px ink frame, centred above the explanation and the address field. Dialog width 460px. [Dialogs2], [F9_Phone_2]
5. **Phone recording** — one change: no red. The button keeps its 44px shape and becomes `.pw-btn--rec[aria-pressed="true"]`: inverted, a paper dot, “0:12” in tabular figures, `aria-label="Stop Recording"`. Inversion is how System 1 says “on”; a colour would be the only colour in the product.
6. **Comment threads (task 135)** — the reply row becomes: field · **Add Note** · **Ask Pi** (default once the field has text) · Resolve · gap · Delete (unsent only), with `.pw-thread__help` under it: “Add Note keeps your reply with the file. Ask Pi sends the thread with what you typed.” Same on the phone thread sheet. “Reply” is retired because it read as if it reached Pi. Ask Pi on an empty field sends the thread as it stands.

## 2026-10-14 · Task 154: rename, move, remove and trash a project

Boards: [P_Menu], [P_MenuMissing], [P_Rename], [P_Renamed], [P_Move], [P_Refused], [P_Remove], [P_Trash], [P_Locate], [Ph_ProjectMore]. No new CSS.

**Where.** The **Project** menu only, acting on the open project (the window title; the selected row in the Projects window). Not the File menu: File acts on files and folders inside a project, Project on the project. One rule per menu keeps “which thing will this act on?” answerable. Items: `data-command="rename-project"`, `move-project` (label “Locate Folder…” and `locate-project` when the folder is missing), `remove-project`, `trash-project`. Dimmed, never hidden.

**Rename Project…** — one field, one name: the app shows the folder's name, so they stay one thing. Dialog `#project-name-dialog`: title “Rename Project”, label “Name”, prefilled and selected. Help: “Renames the folder “Japanese study app” to “Japanese flashcards” in ~/code. Its address becomes /p/japanese-flashcards. Chat, comments and Activity stay with the project.” Default **Rename**. Errors in the help line (“A folder named … already exists in ~/code.”). Old `/p/<old>` addresses redirect to the new one for the session.

**Move Project…** — the folder browser from New Project / Add Existing Folder (`#folder-dialog` reused: location popup, Parent, real folder rows, Path field). Title “Move “<name>””. Help: “Moves “<name>” into <folder>. Chat, comments and Activity stay with the project.” Default **Move Here**. Refused folders: the project's own folder and anything inside it (rows dimmed).

**While Pi works in that project**, Move and Move to Trash stay enabled but answer with a Note alert instead of acting: “Pi is answering about this project.” / “Try again when that request ends. Moving or trashing the folder now would pull it out from under Pi.” Buttons: Show in Activity / **OK**. (A dimmed item could not say why.) Rename is refused the same way.

**Remove from List…** — Note alert: “Remove “<name>” from the list?” / “The folder stays on your Mac with its files. Add it again with Add Existing Folder…; its chat and comments come back with it.” Buttons Cancel / **Remove** (default: nothing is lost).

**Move Project to Trash…** — Caution alert: “Move “<name>” to the Trash?” / “Its 3 files and 1 folder go to the Trash on your Mac. Its chat and comments are kept until you empty the Trash; Put Back in the Finder and Add Existing Folder… bring everything back.” Buttons **Move to Trash** (`.pw-dialog__danger`, left) / **Cancel** (default). Yes: Cancel is the default, as for every destructive action. Afterwards the app shows the Projects home.

**Missing folder.** The row keeps its caution glyph and “folder missing”. Opening it shows the chat (it hangs off the id) with an alert line: “The folder ~/code/home-server is missing. The chat is kept; Pi cannot work here until you locate it.” + **Locate Folder…** (default) + Remove from List…. **Locate Folder…** reuses the folder browser: title “Locate “home-server””, detail “The folder is no longer at ~/code/home-server. Choose where it is now.”, help “Points the project at <path>. Chat, comments and Activity stay with it; nothing on disk changes.”, buttons Remove from List… (left) · Cancel · **Use This Folder**. This replaces Remove-then-Add, which would lose the chat.

**Undo.** Rename, Move and Remove from List show a toast with Undo ⌘Z (“Renamed to “Japanese flashcards”.”, “Moved to ~/code/learning.”, “Removed “…” from the list.”); each is cheap to reverse. Move to Trash has no Undo in the app; the toast says ““<name>” is in the Trash.” (the alert already said how to bring it back). File renames should get the same Undo toast for consistency.

**Phone.** A ⋯ on each project row of the π sheet (44px, its own tap target) opens a sheet titled with the project and its path: Open, Rename Project…, Move Project…, Copy Folder Path, ═, Remove from List…, Move Project to Trash…. Same dialogs as sheets. This matches round 4's answer for files: the ⋯ sits on the thing it acts on.

## 2026-10-14 · Round 5: from working to its request and back; the worker

Boards: [A_FromChat], [A_FromComment], [A_FromFile], [A_FromWorker], [Ph_ActivityFromComment], [S_WorkerPropose], [S_WorkerWaiting], [S_WorkerRunning], [S_WorkerPaused], [S_WorkerDone], [B_Worker], [Ph_Worker], [C_Dictate], [MB_Model]. New CSS at the end of `components.css`: `.pw-worker*`, `.pw-countdown`, `.pw-btn--dictate`, `.pw-block--raw` (delete it from chat.css). Icons: `more`.

### A. Every “working” links to its request; every request links back (task 157)

- **Links to the request** (`/activity?job=<id>` selects the row and scrolls the detail): the status button and the Agent section's Activity row (the running request, else the window); a thread's state line and a Review item while sent or answering — `.pw-link` “Show in Activity” right after the state words (“Pi is working on it · Show in Activity”), never the whole line as a button: it is status first; the whole-file request card (as drawn); the live Pi message: “· working · Show in Activity” in its label row; the WorkerCard's head.
- **Back from the request**: the detail gets a “From” line and one button named after the origin. `job.origin = {kind: 'chat'|'comment'|'document'|'worker', ...}`: chat → **Open in Chat** (`/p/<id>/chat#msg-<id>`, scrolled and flashed with a 1px outline for 2 s); comment → **Show Comment** (`/p/<id>/work/<file>#comment-<id>`, thread open and focused, Review on it); document → **Show in Review** (the whole-file box open on that request); worker → **Open in Chat** (its card) and **Show Task** (the task file). “Open in Project” is retired. Phone: the same buttons, 44px, the first one default.

### B. The chat runs a worker (task 156) — WorkerCard card

- Card states, in place: proposed (countdown, Not Now) → running (Show in Activity, Stop) ⇄ paused while Pi answers you → summary (Completed/Failed/Stopped); or Gate asks you (Why?, Start Anyway, **Not Now** default) → declined (one dotted line).
- **Answers**: Gate's reason is one line plus a **Why?** disclosure; the 10-second wait is a Setting (“Wait 10 seconds before Gate starts the worker”, on), not a card control.
- **Model menu**: capability after the existing notes — “parallel”, “one at a time”, “checking…”; the menu note explains them.
- **Status and Agent**: worker running, chat idle → status “Working · worker in pi-local-harness”, Agent row “1 running · worker”, project row “worker”; paused → “Working · worker paused”. Later, more agents → “2 of 3 agents busy”.
- **Phone**: the card in the phone chat, 44px Stop / Not Now / Start Anyway.

### C. Since round 4

- **Dictate**: as built; icon button after its field, recording = `.pw-btn--rec` inverted with the time, then disabled “Transcribing…” with the hourglass.
- **Model no longer installed**: yes, list it dimmed, “not installed”; toast “deepseek-r1:14b is not installed. Using gemma4:12b.”
- **Raw block**: in the bundle now.
- **Hand cursor**: keep it on the block handle only; everything else keeps the arrow (links get the hand from the browser).
- **“+N” on the phone**: confirmed, 28px drawn, 44px touch.

### D. Project commands

1. Agreed: no address line; P_Rename updated.
2. Change: keep the dialog open with the error in the help line and the field selected.
3. `more.svg` added to the Icons group; add `more` to icons.mjs.
4. and 5. Confirmed.

## 2026-10-14 · Round 6: terminal Pi (plan 158, tasks 159–170)

Boards: Terminal page — [T_Principles], [T_Startup], [T_Footer], [T_Outputs], [T_Changes], [T_Gate], [T_Noise], [T_Wayfinding], [T_Workbench]. Card: TerminalOutput. All strings on the boards are the proposed copy.

1. **One renderer for console outputs** (`renderConsole(result)` in the extension): title rule (`── Title ` + `─` to the width, summary right-aligned dim), body indented 2, a dim hint line. Parts: `kv`, `table` (header, `═`, ellipsis per column, glyph + word in the state column, IDs cut to 8 dim), `checklist` (`✓ ok` / `✗ fix` / `! note` + `→ fix command`), `list` (KEY VALUE FROM), `prose` (wrap 72). Width = terminal columns − 2, minimum 60; tables drop columns right to left under 80 (PROJECT, then ID).
2. **Glyphs**: one table in the extension (`GLYPH.completed = '✓'` …) with an ASCII fallback when the locale is not UTF-8. State words are the app's.
3. **Header** (`setHeader`): 5 lines; first start (no `config.json` yet) adds one. Move “Loop check” to /status. Phone off: one reason or `/guide phone`. QR beside the lines at ≥100 columns, else below.
4. **Footer** (`setFooter` / status items): `model · thinking │ state │ Gate today N · N blocked │ Phone on|off`; state with the app's words; attention segment inverse + “· /queue” until /queue or the web Activity is opened. 60 columns: model │ state │ phone.
5. **Changes**: confirmation title is a question, detail lines “Model gemma4 → qwen3”, “Saved in …”, “Also …”, buttons named by the action, Cancel default for destructive ones. Result: `✓ <what is now true>. /undo goes back to <old>.` or `○ Not changed.`
6. **Pi proposes**: the `harness` tool may return `{propose: "/models use qwen3:8b"}`; the extension prefills the input line and shows the dim hint “Pi proposed this · Return runs it · Esc clears · nothing changes until you confirm”. Pi never runs a change.
7. **Tool-call renderer**: line 1 glyph + tool + argument; line 2 `Gate allowed|blocked|asked to revise` and, separately, `exit N` with the command's own message. Replace “Gate audit failed: EXECUTION_FAILED” with “✓ Gate allowed · ✗ exit 1: …”; Gate wording appears only when Gate decided.
8. **Recovery and refusal**: bold sentence first (“Harness stopped a loop.”, “Another request is running.”), then facts, then a dim next command.
9. **Noise**: drop the “[time] Assistant message started/completed” and “Tool result failed” lines from display; message header “Pi 15:12” (dim time); `/verbose on|off` adds the span and per-tool times. Strip `[CANARY]` before rendering (the harness still checks it).
10. **/harness**: a select dialog, “Ask in words” first; Return prefills the input line; `/harness list` prints it. Argument completion for `/models use`, `/config`, `/guide`, `/job` with a short description per item.
11. **Workbench events**: footer only for routine changes; one warning notification when something needs the person (failed, stopped, interrupted, Gate asking). No widget.
12. **Answers**: one look for every output with inner parts; the slash is the line between “run now” and “ask Pi” (Pi recognises “status?” and answers, then prefills `/status`); no colour carries meaning.

## 2026-10-15 · Round 6 notes: repo names and answers (task 171, 172)

The terminal boards are redrawn with the repo's names; nothing in this list asks the repo to rename a command. Boards: [T_Startup], [T_Footer], [T_Outputs], [T_Changes], [T_Gate], [T_Wayfinding], [T_Workbench], [A_Record], [Ph_ActivityRecord], [MB_Model].

1. **Models**: `/models use|pull|remove <name>`; the remove confirmation has Moves · Frees · Undo rows and Cancel first. `/ollama` only for `set` and `restart`. As built.
2. **Config**: `/config` lists the 15 settings, `/config <key>` explains one, `/config set <key> <value>` asks first. The model choice is saved in `model.json`. As built.
3. **/doctor** (question): yes, offer fixes, but as existing commands only: a `✗ fix` row ends with `→ /ollama restart` or `→ /config set …`, which asks first like any change. No fix-only commands. A stale agent lock stays a `! note` (“clears itself when the next agent starts”).
4. **/queue and /job**: no `all`, 8-character ids, no stop; the refusal points to the web Activity. As built.
5. **Busy terminal** (question): keep the refusal. A terminal question is a conversation; queueing it would answer it later in a place you may have left. The words say it was not sent.
6. **Recovery**: one retry by itself, then “✗ Harness stopped retrying.” with the session log and “Ask again with a hint, or in other words”. Accepted.
7. **Confirmation**: Pi's own select list, “→” on the chosen row, Pi's hint line. Accepted; inversion stays for the footer attention segment and completion only.
8. **Footer**: one line at every width, under Pi's own footer; only /queue clears attention (the web Activity may later clear it too; not needed now). “○ Loading <model>…” and “▶ Working · web: <project>” stay on the boards marked “not built yet”, as targets.
9. **Tool rows**: read/edit `✓ Gate allowed · ✓ done · 0:01`; failure `✗ failed` + “It failed on its own; Gate did not block it.” Accepted.
10. **Startup**: Pi's banner and any tmux warning drawn above the harness header.
11. **Task record** (task 172, question): no × buttons in this system; the button that opened the section closes it (“Show Task Record” / “Hide Task Record”, `aria-expanded`), and the Agent menu item follows its label. Keep it inline under the double rule, not a window: it belongs to the selected request and changes with the selection; Event Info is a window because it follows whatever is selected anywhere. Phone: a Sheet titled “Task record” with Close.
12. **Thinking levels** (question): show only the 4 that differ: Off, Low, Medium, High, in the web menu and in `/models use <name> <effort>` completion. Seven labels for four behaviours would make three of them lie. A saved minimal/xhigh/max keeps loading and shows as Low/High.

## 2026-10-15 · Round 7: the app, running beside the chat (plan 198)

Boards: canvas page **App preview** — [P_Answers], [P_Beside], [P_Changed], [P_Starting], [P_NotStarted], [P_NotWeb], [P_Error], [P_Fixing], [P_Tablet], [P_Full], [P_OnPhone], [P_Undo], [P_UndoConflict], [P_Undone], [P_Narrow], [P_Japanese], [P_DoneParts], [Ph_PreviewMenu], [Ph_Preview], [Ph_Done]. Cards: PreviewWindow, DoneRow. CSS: the round 7 block at the end of `components/bundle.css` (the canvas boards carry it inline until the next canvas stylesheet).

1. **Preview window** beside the chat (`#preview`, 480px), a third view (Chat · Work · Preview ⌥⌘P) when the chat would drop under 480px; Window → Preview ⌥⌘P and the chat info bar's Preview toggle are one command. Phone: a view in the view menu, not a sheet.
2. **Dev server lifetime** (`harness/preview.py`, new): start the project's run command when the Preview is first shown (starter: `uv run uvicorn app.main:app --reload` on a free port), stop it when the project closes or plh quits. The first time a project's run command answers, open the Preview once by itself; then remember open/closed per project. One Stop / Start button. Expose the state (`none`, `notweb`, `starting`, `running`, `error` + last stderr line) over the existing SSE stream.
3. **Reload note**: after a request (or an undo) changes files and the server reloads, the note line “Pi changed N files. Reloaded.”; the iframe reloads only if the server's reloader did not already.
4. **Sizes**: Phone 390, Tablet 768 × 1024 scaled with `transform: scale()` to fit (caption says the %), Full = the stage's width. The language segment sets the app's language (the starter reads `?lang=` / a cookie), separate from the workbench's.
5. **Open on Phone…**: the Phone dialog's QR, for the app's own tailnet address (`tailscale serve` a second port while it runs). If phone access is off, the existing phone-off alert.
6. **Error**: the last stderr line in mono; **Ask Pi to Fix** sends, as the person, “The app stopped with this error: <line> Please fix it so the app starts again.” (label “· from Preview”); **Start Again** restarts.
7. **DoneRow** under every answer whose request made a commit: head (✓ Done or ! Not verified, files, time), 2–3 plain-words lines, **Show in Preview**, **Undo This Request…**. Pi writes the lines into the task file's “For the person” section; the harness renders them. Move the G-012 sentence out of the answer text into this row.
8. **Undo** = `git revert` of the request's commit as a new harness commit with its own row (↶ Undone, Redo Request…). If the revert does not apply cleanly, abort it (nothing changes) and show the Note alert naming the later request; **Ask Pi Instead** sends the request in words.
9. **LessonLine**: at most one per answer, when the harness first sees an idea in this project (first commit, first test, first dependency…), mapped to a KakkoiSchool lesson in the person's language; **Hide** dismisses that one; Settings → “Show lessons” (on).
10. **Japanese**: every new bar uses flex-wrap and buttons size to their labels; the strings on P_Japanese are the proposed Japanese copy.

Answers to the brief's questions are on [P_Answers]: beside (a view when narrow; a view on the phone), the workbench starts the app when the Preview is shown and not before, “Undo This Request…”, a separate quiet row (with G-012 moved into it), and wrap-everything for Japanese.

### Round 7 update: what is built (tasks 200–205)

New boards: [P_UndoUnsaved], [P_NewProject], [P_NewProjectStatic]; redrawn: [P_Starting], [P_Error], [P_Fixing], [P_Undo], [P_UndoConflict], [P_Undone], [P_Answers].

11. **States** map one to one to task 202's: none (○ No app; a non-app project says what it is, dimmed), starting, running, stopped. Stopped shows the app's last 8 lines in mono, the last one bold; Ask Pi to Fix sends the last line in the message and the 8 lines in a disclosure. Starting copy: “about 15 seconds” the first time.
12. **Undo** (task 203): the confirmation lists the files from the before-undo check in an open disclosure. The three built refusals become alerts; each title says what did not happen, the detail says why and “Nothing was changed.”, and the advice becomes a button:
    - changed again after → **Ask Pi Instead** (default). Repo: name the later request (“in “Show the newest note first” (14:51)”), from `git log` of that file.
    - unsaved changes → **Save Them, Then Undo** (new: commit them as “Your edits · HH:MM”, then revert) · Cancel (default). Repo change.
    - already undone → never shown in the web (Undo disabled on an undone row); keep it for the terminal.
    - Undone result as the undo's row text: “Undid “<request>”. 2 files changed back as a new change: nothing is lost, and Redo brings it back.” In the web, drop “(task 001)” from the request name (Activity shows the task).
13. **New Project…** (tasks 200, 205): kind radios Web app (default) · App with no server · Empty folder, the deciding question as help, and a line that says what gets made. Add `.pw-radio` / `.pw-choice` (bundle.css) and use them in Settings → Appearance too.

## 2026-10-15 · Round 8: the phone does everything the desktop does

Boards: canvas page **Phone parity** — [Ph8_Answers], [Ph8_Map] (every desktop command, where it lives on the phone, taps), [Ph8_Pi], [Ph8_Thinking], [Ph8_ModelGone], [Ph8_ChatMenu], [Ph8_PreviewMenu], [Ph8_Preview], [Ph8_Doc], [Ph8_DocMore], [Ph8_Source], [Ph8_CommentsNone], [Ph8_Ask], [Ph8_AskFile], [Ph8_Folder], [Ph8_NewProject], [Ph8_ChooseFolder], [Ph8_Toast], [Ph8_Settings], [Ph8_Details]. Card: PhoneBar (rewritten).

1. **Three places for commands**: π = app-wide; the view menu = switch view + that view's commands; ⋯ = the thing on screen. Replaces “the π sheet holds every menu command”.
2. **Model**: build Ph_Model / Ph_ModelList; Thinking lists the four levels. If the chosen model is not installed, Chat shows one alert line “<model> is not installed any more.” with **Choose Model…**, and the unsent message is kept.
3. **Files**: build Ph_FileMore / Ph_FolderMore; on the phone a folder opens as a level (‹ Files · name · ⋯), never inline. The ⋯ sheet's title is the path. Add **View as Markdown** and **Reload from Disk** to the file ⋯.
4. **View as Markdown**: a full-screen source editor of the whole file (mono, autosave), Done returns.
5. **Review**: Comments is always in the document bar. With none open, the sheet says “No open comments in <file>.”, keeps Resolved / Deleted segments, and holds **Ask Pi About This File…**; Show resolved is a 44px row.
6. **Ask Pi… bug**: from the selection bar and the block sheet, open the Ask sheet (quote, “Your question”, Pi sees, Cancel / Ask), not the Comment composer. The same sheet serves the whole file. The answer goes to Review beside the passage and to Activity; no comment is created.
7. **Preview foot**: state, **Stop / Start**, Open App; the app language moves to Preview's view menu.
8. **Landing**: Show in Activity / Show in Gate / the status button (when one item needs attention) open the detail; ‹ goes to the list.
9. **Document screens**: keep the phone bar while reading (hide on scroll down, show on scroll up); document bar only while editing.
10. **New Project / Add Existing Folder**: kinds as 44px radio rows; “Create in ~/code ›” is one row that opens the folder browser as its own full-height step (breadcrumb, 44px folder rows, New Folder…, Choose “<folder>”). Add Existing Folder uses the same step.
11. **Details**: 44px for Show resolved, radios (22px in 44px rows), thread ‹ ›, Dictate, the whole-file row; strip ⌘ hints under 760px; toasts above the edit bar and keyboard (`bottom: edit bar height + safe area`); hide Desktop pattern and Return sends on the phone with a one-line note.
12. **Files bar**: Ph_Files (no “‹ Projects”); Ph_FilesNew corrected.

## 2026-10-16 · Round 9: updates, other devices, Terminal app, Language

Boards: canvas page **Updates & devices** — [R9_Answers], [R9_UpdateMenu], [R9_Update], [R9_UpdateStates], [R9_Devices], [R9_PreviewTerminal], [R9_Settings], [Ph9_Pi], [Ph9_Update], [Ph9_Install], [Ph9_PreviewTerminal]; redrawn [P_NewProject], [Ph8_NewProject], [Ph8_Settings], [Ph8_ModelGone], [Ph8_ChatMenu].

1. **Check for Updates…** in π (desk) and the π sheet (phone). The mark: a 6px dot on the π title / π button, and “● New version” on the item. The alert lists up to 20 plain lines; the blocked states keep the built sentences, add “Nothing was changed.” and offer **Ask Pi to Update** / **Ask Pi to Save Them**. Add **Restart Now** once plh can restart itself; until then the built steps.
2. **Another device**: the install sheet once, only away from the main computer, with the brief's copy and iPhone / Android steps; later π › Add to Home Screen…. The **π tile** is the app icon (180, 192, 512 maskable, inverse, favicons). The main computer: the same tile in the Dock; a menu-bar / tray item: state, Gate count, Open Pi Workbench (default), Open on Phone…, Copy Address, Start at Login, Check for Updates…, Quit (asks first while Pi works).
3. **Terminal app**: third of four kinds, help “Runs in a terminal window, keys and text only: a quiz, a calculator, a script. The Preview shows it here.” Its Preview: the run command in place of the address, **Restart** in place of Reload, sizes 80 × 24 · 120 × 40 · Fit; the phone adds a key row (Esc, Tab, ↑ ↓, Ctrl, Return).
4. **Settings**: Language first (desk and phone); add Show lessons, Wait 10 seconds before Gate starts the worker, Check for updates once a day to the web Settings; remove “Phone access” (Open on Phone… shows it).
5. **Model gone**: keep the fallback and the built sentence.
6. **Chat commands**: come off. Agent menu loses Compact Now, New Conversation…, Earlier Conversations; the boards move to Archive (S_NewConversation, S_Fresh, S_Earlier, M_AgentEarlier).
7. **No room**: keep the built behaviour (the Preview steps aside as a tab).

## 2026-10-16 · Round 10: Pi discusses before it builds (plan 236)

Boards: canvas page **Plan mode** — [R10_Answers], [R10_Choice], [R10_ChoiceStates], [R10_Plan], [R10_PlanStates], [R10_CheckIn], [R10_CheckInStates], [R10_AutoOn], [R10_AgentMenu], [R10_Away], [R10_Work], [T_PlanMode], [Ph10_Choice], [Ph10_Plan], [Ph10_CheckIn], [Ph10_Away]. Cards: ChoiceCard, PlanCard, CheckInCard, AwayCard. CSS: the rounds 9–10 block at the end of bundle.css (`.pw-card`, `.pw-tag`, `.pw-option`, `.pw-plan__*`, `.pw-facts`, `.pw-auto`).

1. **ChoiceCard**: one question per card, “Question 1 of 3”; 2–4 options, recommended first, selected and tagged; Something else… last, opening a field; **Answer** default. Typing in the composer answers as Something else (label “Your answer to …”, Send reads Answer). Settled: one line with Change…; auto: dotted with an auto tag.
2. **PlanCard**: Goal, Tasks with “Done when”, Decisions with chosen / given / auto tags; Approve Plan (default) · Change… · Open the Plan. Change… = the composer with “What should change in the plan?”; v1 collapses when v2 arrives. Over 7 tasks: first 5 and “and N more”.
3. **CheckInCard = the task's DoneRow while it waits**: plain words, Verified, Next, Show in Preview · Undo This Task…; Continue (default) · Review First · Stop Here. Not verified: Review First is the default and Run on its own stops.
4. **Run on its own** (the name in the UI; `/auto` in the terminal): one setting for all projects (Settings › Pi), remembered; the checkbox beside Send and Agent › Run on Its Own ⌥⌘A toggle that same setting; the risk notice every time it is turned on; status “Working · on its own”; nothing is held back (no “Needs you”); the report at the end of each run. Details: version 2 below.
5. **Work**: plain Markdown; `Plan approved:` renders as a ✓ line under the title, decision states as tags.
6. **Terminal**: select lists for questions, plan and check-ins; `/auto on` (or `/config set auto on`) shows the risks every time; footer “Auto”; `/status` gains “Run on its own”; a one-line report at the end of a run, `/report` for the full one.

### Round 10, version 2 (the person's decisions)

Redrawn: [R10_AutoOn], [R10_Away], [R10_AgentMenu], [Ph10_Away], [R9_Settings], [Ph8_Settings], [T_PlanMode], [R10_Answers]. Card: AwayCard (now the run's report).

7. **One question per card**, no multi-question cards.
8. **Run on its own is one setting for all projects** (Settings › Pi), remembered, no limit. The checkbox beside Send and Agent › Run on Its Own ⌥⌘A toggle the same setting; not in π. `/auto` and `/config set auto` in the terminal.
9. **Nothing is held back**: publishing, git push, downloads, sending, Move to Trash all run on their own. “Needs you” is removed (no Activity item, no status count, no footer segment).
10. **The risk notice every time** it is turned on (from the checkbox, the menu, Settings or `/auto on`): Caution alert listing what will happen without asking, the irreversible ones in bold; **Turn On** / **Cancel** (Cancel is the default).
11. **The report** at the end of every run, shown again when the person comes back if unseen: Done (verified or not), Decided on its own (Change… each), Left this Mac or used the Trash, Problems; Got It · Show in Activity. The harness keeps the record per run (Activity can list past reports).

## 2026-10-17 · Round 11: three phases for every request (task 247) and context reasons (task 234)

Boards: canvas page **Phases** — [R11_Answers], [R11_Parts], [R11_Discussion], [R11_PhaseMenu], [R11_Planning], [R11_Waiting], [R11_BuildReview], [R11_Implementation], [R11_CheckIn], [R11_Auto], [R11_SaveFailed], [R11_Refusals], [R11_Context], [R11_ContextParts], [T_Phases], [Ph11_Discussion], [Ph11_PhaseSheet], [Ph11_Planning], [Ph11_Waiting], [Ph11_BuildReview], [Ph11_Implementation], [Ph11_CheckIn], [Ph11_Auto], [Ph11_Refusal], [Ph11_SaveFailed], [Ph11_Context]. Cards: **PhaseControl** (new), PlanCard, CheckInCard, ContextLine, AwayCard, TerminalOutput (each with a round 11 section). CSS: the round 11 block at the end of bundle.css (`.pw-phase`, `.pw-phase-menu`, `.pw-phase-line`, `.pw-waiting`, `.pw-why`, `.pw-context__why`, `.pw-reasons`).

1. **The phase** belongs to the project (saved with it, shared by web and terminal, restored on restart). Discussion is the start. The harness enforces it on every file write; the person (and Run on its own's two moves) changes it; Pi's tool calls cannot. Small fixes use the same three phases.
2. **PhaseControl** (see its card): first in the composer row; a popup button with a three-item radio menu, shortcuts ⇧⌘1–3, Implementation disabled with “No planned task yet. Plan one first.” when nothing is planned. Phone: its own 44 px row above the field and a 64 px-row sheet. Every change writes a phase line in the chat. The placeholder follows the phase.
3. **Planning ready**: the PlanCard's foot is Start Building (default) · Plan Another Task · Change… · Open the Plan. Start Building approves and enters Implementation; Plan Another Task keeps the plan waiting and returns to Discussion.
4. **Tasks waiting in Discussion**: the waiting strip and **Build the Planned Tasks…** → the review (checkboxes per task, Done when, Open the Plan) → Start Building. Unchecked tasks stay waiting.
5. **Check-in**: Accept and Continue (default) · Review First · Stop Here, inside Implementation. Last task: Accept Task, then “All N planned tasks are built · Back to Discussion”.
6. **Run on its own**: may move Planning → Implementation (it presses Start Building) and continue between tasks; risk notice every time it is turned on, status “on its own”, auto labels and the report are unchanged from round 10 v2. The phase button shows a dotted auto tag; each automatic move a phase line with the tag.
7. **Refusals**: Gate's blocked row, named by the phase, Change Phase… + Why?; the three sentences are in the PhaseControl card. Pi explains, never picks the phase.
8. **Save failure**: the button shows “<phase>…” dotted while saving; on failure it reverts, with the alert line and Try Again. No partial state: the old phase stays enforced.
9. **Terminal**: `/discuss`, `/plan`, `/build`; the phase as the footer's second segment; `/status` Phase and Planned tasks; the same offers as Pi's select lists; refusals “■ Not in this phase · <phase>” (T_Phases).
10. **Context reasons (234)**: one reason word per file in the Pi sees line (rules · plan · task · named · changed · related), +N unchanged, **Why?** opens the per-file reason and full path (popover on the desk, sheet on the phone). The words and sentences come from the selector's recorded reasons.

### Changed round 10 text (one specification)

- **PlanCard**: “Approve Plan (default)” → **Start Building** (default) and **Plan Another Task**; there is no Approve Plan any more. “Plan approved · by you” → “Plan approved: building · Start Building · you”.
- **CheckInCard**: “Continue (the default)” → **Accept and Continue**; last task **Accept Task**. Stop Here no longer accepts.
- **Run on its own**: “approves its own plans” now means it presses Start Building, moving Planning → Implementation; it never moves to Discussion or Planning.
- **Round 10 point 5 (Work)** is unchanged; the task files now come from the harness's layout in Planning.
- ChoiceCard and the report (AwayCard) are unchanged.

## 2026-10-18 · Round 12: Project Start (plan 253), the review's screens (tasks 260–263, 290, 291, plan 267) and the theme panel (task 312)

Boards: canvas page **Project Start & fixes** — [R12_NP1]–[R12_NP4], [R12_AddCap], [Ph12_NP2]–[Ph12_NP4], [R12_Verify], [R12_Reopen], [R12_Grant], [R12_Renamed], [R12_Refusals], [R12_Conversation], [R12_Gate], [T_Decisions], [R12_Fixes], [R12_Strings], [Ph12_Verify], [Ph12_Gate], [Ph12_Cut], [R12_ThemeColours], [R12_ThemeRadius], [R12_ThemeParts], [Ph12_Theme], [Ph12_ThemePick]. Cards: **ProjectStart**, **ThemePanel**, **HarnessNotice** (new; also CutLine and DecisionRow), CheckInCard, PlanCard, PhaseControl, Dialog (each with a round 12 section). CSS: the round 12 block at the end of bundle.css (`.pw-notice`, `.pw-cut`, `.pw-decisions`, `.pw-steps`, `.pw-cap*`, `.pw-keys`, `.pw-theme*`, `.pw-swatch`, `.pw-contrast`, `.pw-picker`, `.pw-slider`, `.pw-samples`).

1. **Project Start (253)**: Name → Capabilities → Packages → Summary; capabilities and packages are separate; suggestions from the sentence are marked, never pre-checked; disabled rows keep their reason; Create runs the base's tests and creates nothing if one fails. **Add a Capability…** keeps a change only if every existing test still passes, as one undoable request.
2. **Unverified check-in (260)**: Retry Task is the default; Accept Anyway… confirms and labels the task; Reopen Task… from Work and Activity; files outside the task are named.
3. **What you grant (261)**: Kind and Files with their sources on the plan; a file outside them is a Gate question (Add to Task / Keep Out); a stale page after a restart says so and offers Reload Page.
4. **Rename (262)**: refused while terminal Pi works there; otherwise the Preview restarts in the new folder with one note line.
5. **Refusal words (263)**: one per kind — Not run (commands), Not proposed, Not written (files), Not a project. Shortcut table in R12_Refusals.
6. **Conversation (290, 291)**: HarnessNotice (the harness's voice, dotted); a question settled without an answer reads “not answered”; CutLine for stopped or failed answers (Undo only when files changed); Activity shows waiting, stopped by a question, stopped by you.
7. **Gate's judgements (267)**: the decision row under answers (source tags you · auto · Laya · code · model), Change… names what it redoes; batch questions with Take All Recommendations; “Pi asked a question” mid-task; the re-plan card; evidence on check-ins; `/decisions` in the terminal (T_Decisions).
8. **Bug-hunt fixes**: Markdown links in Work, the ChoiceCard doesn't repeat its question, the composer while Pi works (Stop · Queue), the status names the project, Japanese buttons stack on the phone sheet. Strings in English and Japanese: R12_Strings.
9. **Theme panel (312)**: the workbench answers by itself (“Pi Workbench · no model”) with one group per panel: Colours (plain names, light and dark, swatch, hex, contrast never blocking, Reset per token, picker), Radius and Spacing (one slider each, derived sizes on samples), Chart. The Preview follows live; Save Theme writes one request with a “Theme saved: …” line and Undo; leaving unsaved asks Don't Save · Cancel · Save; no theme file offers Add a Theme File. Entry points: the request in the chat, Project › Theme… ⌃⌥K, and a harness hint under Pi's answer. Phone: full screen with the live app on top.

### Changed earlier text (one specification)

- **Shortcuts**: Chat · Work ⌘1 · ⌘2 → ⌃⌥1 · ⌃⌥2; Activity · Gate ⌘3 · ⌘4 → ⌃⌥3 · ⌃⌥4; phases ⇧⌘1–3 → **⌃⌥D · ⌃⌥P · ⌃⌥I**. Menus show ⌃⌥; installed as an app, ⌘ works too.
- **New Project kinds** (web app, no server, …) are now **packages**, chosen in step 3, separate from capabilities.
- **Appearance**: the default Paper → **Match System**.
- **Unverified check-in**: the default Accept and Continue → **Retry Task**; accepting is Accept Anyway….
- **Refusal words**: “Not in this phase” blocks now start with Not run / Not proposed / Not written / Not a project, by kind.

## 2026-10-18 · Round 13: the round 12 builds, revisited

Boards: canvas page **Round 13 revisits** — [R13_ThemeFonts], [R13_ThemeParts], [Ph13_ThemeCard], [Ph13_ThemeStarting], [Ph13_ThemeNoLive], [R13_CheckWeakened], [Ph13_CheckWeakened], [R13_NPName], [R13_NPCaps], [Ph13_NPName], [Ph13_NPPick], [Ph13_NPPackages], [R13_NPParts], [R13_Keys]. Cards: ThemePanel, ProjectStart, CheckInCard, Dialog (each with a round 13 section). CSS: the round 13 block at the end of bundle.css (`.pw-fontrow`, `.pw-fontsample`, `.pw-fontget`, `.pw-theme--folded`, `.pw-output`).

1. **Theme panel**: a fifth tab, **Fonts** (Headings and Body rows, Google Fonts search, Download and Use with the licence into static/fonts/<family>/, a no-Japanese warning). The picker's **Colour · Text on it** segment is kept as built (Border · Input · Ring: **Colour · Focus ring**). Multi-token rows say what else they set. Border · Input · Ring shows **the ring's 3:1 check** against the card, not a text ratio. Chart warns about Basecoat's default blues at once and offers **Use Colour-Blind-Safe Colours**. After Save Theme the panel folds to “Theme · Colours saved · Open Again”. On the phone the chat shows a card with **Open Theme**; the full screen says when the app is starting or when there is no live link over the tailnet.
2. **Check-in evidence**: a weakened test reads “⚠ fewer checks `<test>`: 5 checks → 2 · Show” under the removed one, with one help line; Review First becomes the default and comes first.
3. **Project Start as built**: Create in is a row that opens the folder browser in pick mode; the sentence help names the workbench; Suggested in bold in the meta line; only the available capabilities can be checked (Share by QR code added); one base package plus Phone app on a page package; a failed Create shows the failing test, its capability and the output, and stays open; Add a Capability… uses radios and fills What changes on choice.
4. **Keys**: New Project… ⌃⌥⇧N; Add Existing Folder… ⌃⌥O.

### Changed earlier text (one specification)

- **Theme file**: `app/static/theme.css` → the marked theme block of **`styles/input.css`** (the panel head reads “styles/input.css · theme block”).
- **Theme tabs**: four → five (Fonts).
- **Border · Input · Ring contrast**: a text ratio → the ring's 3:1 check; borders and input edges are not checked.
- **Chart note**: “the default five stay apart for colour blindness” is no longer true of Basecoat's blues: it now warns by default.
- **After Save Theme**: the panel no longer disappears; it folds to one line with Open Again.
- **Project Start packages**: several base packages at once → one base package (others disabled with the plan 253 / task 277 reason) plus Phone app on a page package.
- **Add a Capability…**: checkboxes → radios, one per request.
- **New Project's key**: ⌘N (the browser keeps it) → **⌃⌥⇧N**; new: Add Existing Folder… ⌃⌥O.
- **Check-in default**: with a removed or weakened test the button order becomes Review First · Accept and Continue · Stop Here.

## 2026-10-19 · Round 15: recording, Preview windows, plan repair and visual results (tasks 333, 321, 322; plan 266)

Boards: canvas page **Round 15**. Four parts, each with its own notes below; new cards **RecordingStatus**, **FlowAttachment**, **ProblemReport**, **PlanDiagnostics**, **VisualResult**; Round 15 sections in ContextLine, HarnessNotice, PreviewWindow, Menu, PlanCard, AttachmentChip and Message. CSS: the four round 15 blocks at the end of bundle.css.

**Changed earlier copy (all parts):** the Preview foot's **Open in Browser** is now **Open in New Window** (B), on every board drawn from this round on.

### A · Action recording and Report a Problem (task 333)

Boards: R15_Recording, R15_FlowContext, R15_ReportReview, R15_ReportFailure, R15_Reproduce, R15_ReproStart, R15_RecordingStates (incl. 320 px), R15_Recording1024, R15_RecordingCopy (EN/JA + walkthrough), Ph15_Recording, Ph15_FlowContext, Ph15_ReportReview, Ph15_Reproduce. Generator `gen/r15a.py`; DS previews `gen/ds15a.py`. Cards: **RecordingStatus**, **FlowAttachment**, **ProblemReport** (new); ContextLine and HarnessNotice (round 15 sections). CSS: `scripts/round15_a.css` (`.pw-recstat`, `.pw-recpop`, `.pw-flow`, `.pw-flow--narrow`, `.pw-redacted`, `.pw-evidence`, `.pw-evrow`, `.pw-never`, `.pw-dest`, `.pw-repro`).

1. **Default: on, per project, always visible.** First Preview of a project shows a HarnessNotice (What's Kept · Stop Recording · OK). The state lives in the Preview foot: `button.pw-recstat#recording-status[data-state=on|off|paused|repro]`, `aria-haspopup="dialog" aria-controls="recording-popover"`, name “Recording on: {n} steps from this project. Recording options”. Disable: the same switch in Project › Settings… (“Record what I do in the Preview”).
2. **Kept vs not kept** (test-core recorder): structural selectors, page loads, input lengths. Not kept: typed text, labels/ids, error text, addresses/queries; password/key fields: nothing. Shown everywhere as “(text not recorded)”, “(address not recorded)”. Retention proposal: this Mac, this project, 7 days, ≤20 flows; Clear History… → the project's Trash (recoverable).
3. **Chat**: when System 1 classifies a message as reporting an app problem and this project has a flow from the last 30 minutes, it attaches `details.pw-flow` under the message (`aria-label="Preview actions attached to your message"`) and ContextLine lists `Preview actions (flow)`. Foot: Report a Problem… · Save as Test Draft… · Remove from Message. No flow / delivery failure: the message is sent anyway with a HarnessNotice and one action (Record It Again… / Attach Again). Online model: one line says the steps go to it with the message.
4. **Report a Problem…** (Help menu, the recording popover, the attachment foot; phone: Preview view menu and recording sheet): dialog `aria-labelledby="report-title"`, fields `#report-what` (required), `#report-expected`, `fieldset.pw-evidence` rows (Preview actions, size and language, app version: checked; app output 40 lines: unchecked), `.pw-never`. Actions: Save Draft (Pi Workbench data, not project files) · Ask Pi About It (default; into the chat) · Submit to GitHub… (only with a repo and `gh` signed in; confirmation names `owner/repo` and what GitHub shows; Cancel default). Unavailable stays visible, disabled, with its reason (`aria-describedby="submit-why"`).
5. **Record It Again…**: start dialog (Cancel · Start Recording) → `.pw-repro` banner in the Preview (`role="status" aria-live="polite"`, Cancel · Done). The chat's draft, its attachments and any waiting question are kept; Done attaches the new flow to the draft (not sent). “Also keep what I type during this recording” is drawn **unchecked and marked proposed** (needs privacy review).
6. **Save as Test Draft…**: Planning/Implementation only (Discussion: disabled with “Writing a test needs Planning or Implementation (⌃⌥P).”). Writes `tests/replay/<date>-<name>.test.mjs`, failing until an expected outcome is written; redacted values are synthetic.
7. **Failures never block**: storage → “Recording paused” + notice (Try Again); unsupported page → “Can't record this page”; app stopped/terminal app → “Not recording · …”; an answer to a waiting question always sends.

Data: `{"project", "from", "to", "steps": [{"t", "kind": "click|input|load", "target": "<structural selector>", "length"?}], "viewport", "lang", "commit"}`; report draft `{"id", "project", "what", "expected", "include": {"flow": true, "viewport": true, "commit": true, "output": false}, "saved_at", "submitted": null | {"repo", "issue", "at"}}`.

E2E steps (accessible names): “Recording options”, “Stop Recording”, “Record This Preview”, “Clear History…”, “Move to Trash”, “Report a Problem…”, “Preview actions attached to your message”, “Remove from Message”, “Save as Test Draft…”, “What went wrong”, “Save Draft”, “Ask Pi About It”, “Submit to GitHub…”, “Open Issue”, “Try Again”, “Record It Again…”, “Start Recording”, “Done”, “Attach Again”. Stories in R15_RecordingCopy and the three cards (incl. reload and a second Workbench tab).

Changed earlier copy: the Preview foot gains the RecordingStatus button between Stop/Start and Open in Browser (PreviewWindow, worker B mentions it); Help menu gains “Report a Problem…”; Project › Settings… gains “Record what I do in the Preview”; ContextLine gains the `flow` reason.

Open product choices: recording on by default (drawn) vs off; retention numbers (7 days / 20 flows); the 30-minute “recent” window; keeping typed text in a new reproduction (proposed only); report destinations beyond GitHub; whether drafts expire.

### B · Preview address, ports and new windows (task 321)

Boards (page r15): R15_PreviewAddress, R15_PreviewUsers, R15_PreviewBlocked, R15_PreviewAddress1024, R15_PreviewStates, R15_PreviewNarrow, R15_PreviewStrings, Ph15_PreviewAddress, Ph15_PreviewAddressSheet, Ph15_PreviewStopped. Generator: gen/r15b.py. CSS: scripts/round15_b.css. Cards: PreviewWindow (Round 15 section), Menu (one line).

#### Markup, classes, IDs

- Toolbar 1: `<span class="pw-address__host pw-address__host--addr">127.0.0.1:7801</span>` then the path input and Reload, then `<button class="pw-addrbtn" id="preview-addr-about" aria-haspopup="dialog" aria-expanded="false" aria-controls="preview-addr" aria-label="About this address">ⓘ Address</button>`.
- Popover `<div class="pw-addr" role="dialog" id="preview-addr" aria-labelledby="preview-addr-t">`: `h3#preview-addr-t`, three `section`s; each address in `.pw-addr__url#preview-addr-url` (user-select: all), Copy in `.pw-btn`. Phone: the same content in a `.pw-sheet` (psheet).
- Foot: `button#preview-newwin.pw-btn` “Open in New Window”, `aria-label="Open Class Notes in a new browser window"`; when disabled `disabled aria-describedby="preview-why"` and `p.pw-reason#preview-why`. Count: `<span class="pw-help">{n} open</span>`.
- Blocked: `p.pw-preview__note.pw-preview__note--alert[role=alert]` with `<a target="_blank" rel="noopener" href="http://127.0.0.1:7801/notes">` and Copy Address.
- First-use notice: `p.pw-notice[role=note]`, who “Workbench”, Copy Address.

#### Data

```json
{"preview": {"address": "http://127.0.0.1:7801", "app_port": 8000, "preview_port": 7801, "same_port": false,
             "tailnet": {"available": true, "address": "https://your-mac.your-tailnet.ts.net:8443"},
             "viewer": "mac|tailnet", "state": "running|starting|error|stopped|none|terminal", "path": "/notes", "lang": "ja"}}
```
The workbench decides `viewer` from the request's host: a tailnet request never receives 127.0.0.1 in any field it shows.

#### Changed earlier copy

- Open in Browser → Open in New Window (ブラウザで開く → 新しいウインドウで開く), desk and terminal app.
- Toolbar 1 host: app name → address host (mono).

#### E2E steps (accessible names)

1. Press “Open Class Notes in a new browser window” twice → two pages at /notes?lang=ja; status “Running” unchanged; “2 open”.
2. Press “About this address” → dialog “Where Class Notes runs”; press “Copy Address” → clipboard equals the shown address; Esc → focus on “About this address”.
3. Block pop-ups → press the button → alert; click “Open /notes in a new window ↗” → page opens.
4. Stop the app → button disabled with description; press “Start” → enabled; opening a window doesn't change the start time.
5. Phone over Tailscale → “About this address” sheet text has no “127.0.0.1”; “Open Class Notes in Safari” opens the tailnet address.
6. Two Workbench tabs, reload one → same address in both; windows open from either.

#### Open product choices

See PreviewWindow README “Open product choices”: the usable address (proxy vs app port), `?lang=` in the web starter, terminal app windows, the open count, ⌃⌥B.

### C · Plan diagnostics and bounded repair (task 322)

Boards (page "Round 15"): R15_PlanDiagnostics (1440×900), R15_PlanChat (1440×900), R15_DuplicateTask (1440×1240), R15_PlanRepair (1440×900), R15_PlanStates (1440×1980), R15_Plan1024 (1024×900), R15_PlanStrings (1440×2000, incl. keyboard and 320 px), R15_PlanWalkthrough (1440×1000), Ph15_PlanDiagnostics, Ph15_PlanSource, Ph15_PlanRepair, Ph15_DuplicateTask (390×844). Card: **PlanDiagnostics** (new); PlanCard (round 15 section). CSS: scripts/round15_c.css (`.pw-diag`, `.pw-diag__summary`, `.pw-diag__group`, `.pw-diag__where`, `.pw-diag__kind`, `.pw-diag__h`, `.pw-mark--error|--unsupported|--note`, `.pw-src` + `__l/__no/__m/__t`, `.pw-diff` (`li[data-op=add|del|hunk]`), `.pw-filelist`, `.pw-verdict[data-state=fail]`).

1. **Check**: System 1 reads the saved ROADMAP.md and tasks/*.md on save, when Pi reads the plan, and on Check Again; findings `{kind: error|unsupported|note, code, file, line, end_line}`. Codes so far: duplicate-number, steps-in-roadmap, table-format, duplicate-link, red-not-recorded. Legacy `- [ ] 004 Title` lines are valid.
2. **Surfaces**: Work's info bar (counts + Show Plan Check) and Source gutter marks; the Plan Check panel (desk window) and card (chat); a harness notice under Pi's answer when Pi read a malformed plan. IDs: `#plan-check` (panel), `#plan-check-summary` (role=status), finding rows `li[data-finding-id]`, `#plan-repair` (Ask Pi to Repair…), `#plan-repair-why` (disabled reason), `#plan-review` (dialog/sheet), `#plan-review-apply`, `#plan-dup-004` (radiogroup).
3. **Phase**: diagnosis in every phase; repair only in Planning (ROADMAP.md and tasks/); elsewhere the button is disabled with its reason + Change Phase….
4. **Identity**: System 1 asks "Which task keeps number 004?" (keep A · keep B · same task (merge) · leave both); the choice is a decision row (author: you); never automatic.
5. **Repair**: Pi's write is a proposal held aside (not the working files); System 1 validates (no unchosen error left, task count equal, no app file, Done when/goals/links/history kept, base hashes unchanged); review dialog/sheet; Apply writes, originals to the project Trash; done row with Restore Original…. Failure or a stale base writes nothing. Repeating finds nothing to do.

#### Changed earlier copy
- None replaced. PlanCard gains the round 15 notice and the "004 (2 tasks: choose in Plan Check)" line.

#### E2E steps (stable accessible names)
"Show Plan Check" · "Plan Check" (region) · finding links "ROADMAP.md:10–11" · "Ask Pi to Repair…" (disabled + description) · "Change Phase…" · radiogroup "Which task keeps number 004?" · "Use This" · "Review Changes…" · dialog "Review the plan repair" · "Apply Repair" · "Discard" · "Open Original" · "Check Again" · "Show My Edit" · "Ask Pi to Try Again" · "Restore Original…" · alert "Restore the plan files from before the repair?" · "Restore Original" · "Plan a Test Task…". Stories in the card's Walkthrough (incl. reload and a second tab).

#### Open product choices
Next free number vs suffix for renumbering; the merge rule for "same task"; Trash vs git for the original; whether Run on its own may apply a validated repair (proposed no); the ⌃⌥. / ⌃⌥, finding keys.

### D · Visual results in the chat (plan 266)

Boards: R15_VisualResult, R15_VisualInspect, R15_VisualVariants, R15_VisualUse, R15_VisualStates, R15_Visual1024, R15_VisualWalk, Ph15_VisualResult, Ph15_VisualInspect, Ph15_VisualVariants (generator `gen/r15d.py`). Card: **VisualResult** (new). Notes appended to AttachmentChip and Message. CSS: `scripts/round15_d.css`.

1. **Markup:**
   - The card is `section.pw-visual[aria-label]` with `.pw-visual__head` (`h3.pw-visual__title` and a status `.pw-tag`), `.pw-visual__body` (`button.pw-thumb.pw-backdrop[data-bg]`, `dl.pw-facts` and `p.pw-visual__alt`) and `.pw-visual__foot` (a `.pw-help` line and the actions).
   - Candidates are `fieldset.pw-cands[role=radiogroup]` with a `label.pw-cand` per candidate.
   - The inspector is a `role=dialog` holding `.pw-inspect` (`.pw-inspect__stage` with `.pw-inspect__view` and `.pw-inspect__bar`; `.pw-inspect__side` with `ol.pw-revs`).
   - Unsafe or unsupported content shows `.pw-inert`.
   - Stable names: “Inspect {name} icon, revision {n}”, “Use This Icon…”, “Use Icon”, “Copy to Project”, “Ask for Another”, “Show Revision {n}”, “Open as Text”, and the radio groups “Backdrop” and “Zoom”.
2. **Rendering:** every asset goes through `<img>`; an SVG is served as image/svg+xml and never inlined or framed. Files whose `safe` flag is false (script, event attributes, foreignObject, external refs, HTML) get `.pw-inert` and **Open as Text**.
3. **Status** is derived: proposal (outside the project), generated (in `assets/<kind>/<name>/<n>/`, unreferenced), in use (referenced). Only **Use This Icon…** writes an app file: one request with the confirmation naming the file, under phase rules and Gate's scope card. Generating and copying assets is the media exception in every phase.
4. **Data shape:** see the card's Data section.
5. **Changed earlier copy:** none. The AttachmentChip and Message notes are additions.
6. **E2E steps:** the card's six-story Walkthrough (Inspect, Use and Undo, Discussion refusal, missing file after reload, second tab, unsafe SVG).
7. **Open product choices:** an editable description; whether Copy to Project is undoable; frame playback for sprite sheets; revision retention.

## 2026-10-20 · Round 17: Overview and scoped context (plan 354, report scoped-context-retrieval)

Boards: canvas page **Round 17: Overview and scoped context** (35 boards: 25 desk `R17_`, 10 phone `Ph17_`). Three parts, each with its own notes below: A, the Overview window (attention, projects, review and recovery, entry points); B, the dashboard conversation **Ask across projects** (scope, sources, coverage); C, the project conversation's search boundary and the revised context receipt. New cards **WorkOverview**, **AttentionItem**, **SearchScope**, **SourceList**, **ContextReceipt**; Round 17 sections in StatusButton, Menu, MenuBar, PhoneBar, ContextLine and Message. CSS: `round17_a.css`, `round17_b.css`, `round17_c.css`, appended to `bundle.css` and `design/components.css`. Inputs: `design/briefs/project-work-dashboard.md`, `docs/plans/354-project-work-dashboard.md`, `docs/reports/scoped-context-retrieval-2026-10-20.md`, `docs/architecture/harness.md`.

**Everything in this round is Proposed** except boards titled “Round 17 · Existing · …” (R17_ContextExisting redraws the shipped “Pi sees:” line and Why? sheet for comparison). The board titled “Round 17 · Proposed later · Several agents (not shipped)” (R17_SeveralAgents) is a direction only: today's UI shows one agent and never implies more.

#### Existing vs Proposed (whole round)

| Area | Existing (shipped, unchanged here) | Proposed in round 17 |
| --- | --- | --- |
| App-level windows | Activity · All Projects ⌃⌥3, Gate · All Projects ⌃⌥4 | Overview · All Projects ⌃⌥0 at `/overview`, first in the Window menu's app-level items |
| Status button | Opens Activity (⌘3); attention clears when Activity opens | Opens Overview; text “5 need you · Working on Class Notes”; attention follows the Needs you count |
| Answering, approving, retrying | QuestionCard, PlanCard, CheckInCard and request retry in the project chat | Unchanged. Overview only opens them (Open Question / Open Plan / Open Check-in / Open Request / Open Details); opening never resolves |
| Phase and approvals | PhaseControl ⌃⌥D/P/I, explicit approvals | Unchanged; Overview shows phase read-only |
| Project chat context | “Pi sees:” line + Why? sheet with reason words incl. “related” | “What Pi uses for this message”: **Always with this request** vs **Found for this question**, Left out, truncated, stale + Ask Again, missing, catching up, unavailable; “Searched: Class Notes only” |
| Cross-project search | None | Ask across projects pane, scope popup “Searching all projects (5)”, Sources with project › file › section · lines · changed |
| Search failure | n/a | Never blocks chat; Pi answers from what it has and says so |
| Second Brain | Written only by its own flows | Unchanged: search never publishes to it |
| Several agents | One agent (Pi) | Proposed later only (R17_SeveralAgents) |

#### Rules every part follows

- No database words in ordinary UI (no index, BM25, SQL, DuckDB, query, embedding, partition). The words are “search”, “Searching N projects”, “catching up after changes”.
- Discovery is not permission: “Pi reads these projects to answer. To change one, open it and ask there.”
- No invented progress (no %, no ETA), no inferred idle/completed while disconnected, one polite announcement per change, no duplicate notifications (Overview does not add toasts; the status button and the item are the same count).
- AI messages stay short; detail is behind Why?, Show N more and Open.

### A · Overview · All Projects: attention, projects, review and recovery

Generator `gen/r17a.py` (execs r13.py), CSS `scripts/round17_a.css`, cards `WorkOverview`, `AttentionItem` (new); Round 17 sections appended to `StatusButton`, `Menu`, `MenuBar`, `PhoneBar`. Brief: `design/briefs/project-work-dashboard.md`; plan `docs/plans/354-project-work-dashboard.md`.

#### Boards

| Board | Size | Shows |
| --- | --- | --- |
| R17_Overview | 1440×1130 | Projects home (Agent › Overview current) + Overview: Needs you (5 kinds), Projects (5), Recorded problems (collapsed), Ask across projects pane idle |
| R17_Overview1024 | 1024×1130 | No Projects window; "Ask Across Projects" toggle replaces the lists |
| R17_OverviewEntry | 1440×1020 | Agent section row, StatusButton words, Window menu ⌃⌥0, superseded entry text |
| R17_OverviewFollow | 1440×2700 | Item → project chat at the card with "‹ Overview"; replaced question (notice + newer card; Overview reads "Replaced"); plan lands on PlanCard |
| R17_OverviewWindows | 1440×1760 | Answer in window 1 → item leaves window 2, focus to next, announcement; reload |
| R17_OverviewHistory | 1440×1040 | Failure → retry → "Recovered at 14:52"; recovered Gate refusal not shown |
| R17_OverviewStates | 1440×3120 | Idle, no projects, loading, not connected, reconnected, unknown agent/terminal gap, moved/Trash, long names, service problem, 320 px |
| R17_SeveralAgents | 1440×640 | "Round 17 · Proposed later · Several agents (not shipped)", synthetic records |
| Ph17_Overview · Ph17_OverviewItem · Ph17_OverviewStates · Ph17_Entry · Ph17_EntryPi | 390×844 | Phone list, following an item, not connected, View popup, π sheet Agent |
| R17_OverviewStrings · R17_OverviewWalk | 1440×2050 · 1440×1180 | EN/JA; Given/When/Then |

#### Markup, classes, ids

- Window: `section.pw-window[aria-label="Overview · All Projects"]` › titlebar (h1) › `.pw-toolbar` (`span.pw-fresh[role=status][data-state=live|stale|reconnected|loading]` with `.pw-fresh__dot`; Reconnect when stale; "Show" `.pw-seg[role=radiogroup]` All · Needs You · Working; at ≤1180 `button[aria-pressed][aria-controls=ov-ask]` "Ask Across Projects") › `.pw-infobar` (back link, rule sentence) › `.pw-overview[data-ask=open?]` › `.pw-overview__main#ov-main` + `aside.pw-overview__ask#ov-ask` (400 px; `.pw-overview__askhead`, `.pw-overview__askbody`, `form.pw-composer`).
- Sections `.pw-ovsec` with `.pw-ovsec__head`, `h2.pw-ovsec__title` (`#ov-needs-h`, `#ov-proj-h` tabindex −1; `#ov-hist-h` holds `button.pw-ovsec__toggle[aria-expanded][aria-controls=ov-hist]`), `.pw-ovsec__count`, `.pw-ovsec__note`, `.pw-ovsec__empty`.
- Needs you: `ul.pw-attnlist[aria-labelledby=ov-needs-h][aria-describedby=ov-keys]` › `li` › `a.pw-attn#attn-<attention id>` (see AttentionItem; `[data-stale] [data-replaced] [data-leaving] [aria-current]`).
- Projects: `div.pw-plist[role=grid]` › `div.pw-prow[role=row]#prow-<project id>[data-stale][data-missing]` › `span.pw-prow__cellwrap[role=gridcell]` › `a.pw-prow__main` (`.pw-prow__name[title]`, `.pw-prow__cell` phase, `.pw-prow__badge` › `.pw-needs`, now, `.pw-prow__agent`, `.pw-prow__latest`, `.pw-prow__unknown` italic) + `span.pw-prow__cellside[role=gridcell]` › `button.pw-prow__act` "Open in Activity".
- History: `ul.pw-hist#ov-hist` › `li` (`.pw-hist__state`, what, time).
- Live: `#ov-live[aria-live=polite]` visually hidden (boards draw `.pw-ovlive`).
- Entry: Projects home Agent group first row `a.pw-row#agent-overview[aria-keyshortcuts="Control+Alt+0"][aria-current]` "Overview" + meta; StatusButton `#agent-status` gets `aria-keyshortcuts="Control+Alt+0"` and "… Open Overview"; project chat infobar gets `a.pw-return#overview-return[aria-label="Back to Overview"]` "‹ Overview" when opened from Overview (also `?from=overview`).
- Synthetic (later): `.pw-synthetic`, `.pw-agentrun`.
- Drawn-size modifiers for boards: `.pw-ov--narrow`, `.pw-ov--phone` (the app uses the media queries at 560 and 760; ≤1180 hides the Ask pane unless `.pw-overview[data-ask=open]`, which then hides the lists).

#### Data each element needs (✓ exists · ✗ not yet)

- Stable registered project id and name ✓; folder state ok/missing/trashed ✓ (Project menu task 154).
- Saved phase ✓. Queue: running request, task n/title ✓, queued count ✓.
- Agent name + model ✓ (the model of the run); role ✗ (null today → not shown).
- Latest recorded activity (last tool call kind + path/command + result + time) ✗ as a per-project field; derivable from Activity's task record.
- Attention: pending choice ✓, plan waiting ✓, check-in waiting ✓, failed request ✓, interrupted by restart ✓ (round 5 restart marking), service down ✗ as a record; `replaced_by` on choices ✗; `recovered_at` on failures ✗; stable attention ids ✗.
- Snapshot `as_of` and change count since a time ✗.
- Terminal runs: no request identity → disclosed as not listed.

#### Copy (exact)

See R17_OverviewStrings (EN/JA, 60 strings) and the two cards. Key lines: "Overview · All Projects"; "Overview · 5 need you · 1 working" / "Nothing needs you"; "5 need you · Working on Class Notes"; "Live · updated 14:32"; "Not connected · showing 14:20"; "Reconnected · 2 changes since 14:20"; "Loading…"; kinds and Open labels per spec; "Request 14:20 · task 2 Subjects"; "Working: task 2 · Subjects" / "Queued: 2 requests" / "Idle"; "Pi · gemma4:12b" / "Agent not recorded"; "No activity recorded"; "Needs you · 1"; "Open in Activity"; "Recovered at 14:52"; "This question was replaced at 14:40 by a newer one, below." (HarnessNotice, who "Pi WorkStation"); Overview item "Replaced" + "Open the Newer Question".

#### States and interactions

- An item opens its target (chat at the card, or Activity detail); opening never resolves. It leaves only on authoritative resolution, in any window; it fades 2 s if focused, then focus moves to the next item / previous / heading, with one polite announcement.
- A replaced question: Overview item becomes "Replaced"; following it lands on the newer card; the old card's Answer is disabled with "Replaced at 14:40: answer the newer question."; no control answers the old one (server must reject stale card ids).
- Failure retried successfully: item leaves; Recorded problems row "Recovered at 14:52" (7 days). Recovered Gate refusals: only in Gate.
- Not connected: last snapshot dotted, every status "at 14:20", Reconnect; chat unaffected. Reconnected: one line, one announcement.
- Show filter affects Projects only. Ask pane: idle state drawn here; conversation is worker B.

#### Accessibility

Window h1; sections h2; lists single Tab stop with roving tabindex (↑↓ Home End, Return; → / ← to Open in Activity in the grid); focus kept by id across updates; item accessible name "Project: Kind. Request…. Open X", sentence via aria-describedby; badges are text; glyphs `aria-hidden`; frame (needs you) and glyph (agent state) never the only carrier — words always present. ⌃⌥0 global.

#### Responsive

≥1100: Projects home + Overview + 400 px Ask pane. 1024: Overview alone, Ask toggle replaces the lists (Back / toggle returns). ≤560 content (320): items and rows stack, Open in Activity on its own line. Phone ≤760: own screen from View popup or π sheet, 44 px rows, Ask its own screen, "‹ Overview" back from an item.

#### Superseded earlier text (old → new)

- StatusButton: "The agent status … as a button that opens **Activity · All Projects** (⌘3)" → opens **Overview · All Projects** (⌃⌥0).
- StatusButton aria-label "Agent status: Working, 1 waiting. Open Activity" → "Agent status: 5 need you, working on Class Notes. Open Overview"; `aria-keyshortcuts` "Meta+3"/"Control+Alt+3" → "Control+Alt+0".
- StatusButton: "Attention clears when Activity is opened." / "attention wins … until Activity is opened" → the frame follows the Needs you count, which falls only on authoritative resolution.
- Round 5: "the button opens Activity **on the running request**" → opens Overview; the Agent row Activity still does that.
- PhoneBar `aria-label="Agent status: … Open Activity"` → "… Open Overview".
- Window menu: app-level section "Activity · All Projects ⌃⌥3, Gate · All Projects ⌃⌥4" → "Overview · All Projects ⌃⌥0, Activity · All Projects ⌃⌥3, Gate · All Projects ⌃⌥4".
- Agent section (round 4) "Activity · 1 running, 1 waiting", "Gate · 12 checks, 1 blocked" → first row "Overview · 2 need you · 1 working" added above them.
- Phone View popup: "Activity · all, Gate · all" after the separator → "Overview · all, Activity · all, Gate · all".

#### Plan 354 journeys → boards

1. Two projects running/queued, row lands on the exact request → R17_Overview, R17_OverviewWalk #1.
2. Choice waiting while another runs; answering clears only that item across two windows and reload → R17_Overview, R17_OverviewWindows.
3. Question replaced before opened → R17_OverviewFollow cells 3–4.
4. Plan approval and task validation link to explicit controls; viewing changes nothing → R17_OverviewFollow cell 5, Walk #5.
5. Failed/interrupted: reason and recovery location; retry resolves; history kept; recovered Gate refusal absent → R17_OverviewHistory.
6. Connection drops/reconnects → R17_OverviewStates (not connected, reconnected), Ph17_OverviewStates.
7. Phone and keyboard; focus survives updates → Ph17_*, R17_OverviewWindows, KEYS line.
8. Synthetic concurrent agents; unknown identity → R17_SeveralAgents, R17_OverviewStates (unknown).

#### E2E steps

1. Seed: 5 projects; Class Notes running req-1420 (task 2) + 2 queued + failed req-1350; Pong choice q1; Japanese study app plan waiting; home-server check-in; pi-local-harness interrupted.
2. Press ⌃⌥0 → `/overview`; expect h1 "Overview · All Projects", 5 `.pw-attn` in kind order, StatusButton "5 need you · Working on Class Notes".
3. Tab into Needs you; ↓ twice; Return → Japanese study app chat; PlanCard focused; phase still Planning; "Back to Overview" → focus on the same item.
4. Open a second page on `/overview`; in page 1 answer Pong q1 → page 2: `#attn-…pong…` removed within 2 s, focus on next item, live region text "Pong: answered. 4 need you."; reload page 2 → still 4.
5. Replace Pong question server-side before following → item text "Replaced"; follow → newer card focused, notice present, old Answer disabled; POST to old card id rejected.
6. Retry req-1350 to success → item gone; Recorded problems contains "Recovered at"; inject a recovered Gate refusal → absent from both lists.
7. Stop the service → "Not connected · showing hh:mm", `[data-stale]` rows, no "Idle" without " at "; chat send still queues; restart → "Reconnected · n changes since hh:mm" once.
8. 390×844: View › "Overview · all"; tap item; "‹ Overview" returns; rows ≥44 px. 320 px content: no horizontal scroll.
9. No text matching /index|BM25|SQL|DuckDB|query|embedding/i in `/overview`.

#### Open product choices

1. Order within a kind: oldest first (drawn) or newest.
2. Show filter: per window (drawn) or app-wide.
3. Recorded problems retention: 7 days (drawn) or last 20.
4. Service problem in the StatusButton words? (drawn: counted in "need you" only).
5. 1024: keep the Projects window beside Overview? (drawn: hidden).
6. ⌘/Ctrl+Return opens an item in a new browser window: keep?
7. Should cancelling an interrupted request leave a "Cancelled by you" history row? (drawn in card text: yes).

#### Existing vs Proposed

| Part | Status |
| --- | --- |
| Activity · All Projects, Gate · All Projects, ⌃⌥3/⌃⌥4 | Existing, unchanged |
| ChoiceCard, PlanCard, CheckInCard, Activity failure detail, Ask Pi to Retry… | Existing; Overview only links to them |
| Replaced ChoiceCard: HarnessNotice + disabled Answer with reason | Proposed |
| Overview · All Projects window, ⌃⌥0, `/overview` | Proposed |
| AttentionItem, project row, Recorded problems | Proposed |
| Agent section Overview row; Window menu item; phone View popup and π sheet rows | Proposed |
| StatusButton opens Overview; new words; attention follows Needs you | Proposed (supersedes round 4/5) |
| "‹ Overview" return in project chat | Proposed |
| Ask across projects pane | Proposed (idle drawn by A; conversation by B) |
| Several agents | Proposed later, not shipped |

### B · Ask across projects: scope, sources and coverage

Generator `gen/r17b.py` (execs r13.py) builds the boards. CSS is `scripts/round17_b.css`; the Work source view's `pw-src` classes come from round15_c. Layout: `r17layout_b.json`. Cards: **SearchScope** and **SourceList** (new). HarnessNotice is not used; coverage problems use the coverage line, not a notice.

#### Boards (reading order)

| Board | Size | Shows |
| --- | --- | --- |
| R17_Ask | 1440×900 | Projects home (Agent › Overview selected), Overview with simple lists, and the Ask pane: an answer citing Class Notes and Kanji Cards, Sources, the coverage line, the read-only line and the follow-up composer |
| R17_AskScope | 1440×900 | The scope popup open, narrowed to 2 projects; the next answer's coverage line names them |
| R17_AskStates | 1440×2400 | First open (with the Second Brain sentence), searching, no matches, partial, unavailable, project removed, source changed, asked to change, more than 5 sources |
| R17_Ask1024 | 1024×900 | The Ask Across Projects toggle replaces the lists; ‹ Back to Lists |
| R17_AskSource | 1440×900 | Open → Class Notes, docs/offline.md in Work, Source view, line 12 current, lines 12–40 marked, ‹ Overview |
| R17_AskNarrow | 1440×900 | The pane at 320, the scope popup closed and open, keyboard and announcements |
| Ph17_Ask | 390×844 | Phone: Ask as its own screen (‹ Overview) |
| Ph17_AskScope | 390×844 | Phone: the Search in sheet, with 44 px rows |
| Ph17_AskSources | 390×844 | Phone: 5 sources, then Show 4 more |
| R17_AskStrings | 1440×1540 | EN/JA strings |
| R17_AskWalk | 1440×1120 | Given/When/Then walkthrough |

#### Markup, classes, ids

- **Pane:** `section.pw-ask#ov-ask[aria-labelledby="ov-ask-h"]`; `.pw-ask--full` at 1024 and on the phone. It holds:
  - the head `.pw-ask__head`: optional `‹ Back to Lists`, `h3.pw-ask__title#ov-ask-h`, **New**, and `.pw-scope`;
  - the body `.pw-ask__body[aria-label="Conversation"][tabindex=0]`, containing `.pw-transcript` with the usual `article.pw-msg`, or `.pw-ask__empty`;
  - the foot `form.pw-ask__foot[aria-label="Ask across projects"]`, containing `p.pw-askro#ask-readonly`, then `.pw-ask__row`, which holds `textarea.pw-field[aria-label="Question"][aria-describedby="ask-readonly"]` and the Send/Stop button.
- **Scope:** `button.pw-scope__btn#ask-scope[aria-haspopup="dialog"][aria-expanded][aria-controls="ask-scope-pop"]` and `div.pw-scope__pop[role="dialog"]#ask-scope-pop` (see SearchScope).
- **Coverage:** `p.pw-coverage[role="note"]`, with `--partial` and `--off` variants. While searching it uses `role="status"`.
- **Sources:** `section.pw-sources` › `h4#ask-src-h` + `ol#ask-src-list` › `li.pw-sources__item#src-N[data-changed|data-gone|aria-current]`, plus `button.pw-sources__more`; and `a.pw-cite[href="#src-N"]` (see SourceList).
- **Hand-off:** `.pw-handoff` › the default button **Open {project} Chat** + `.pw-help`.
- **Work, cited lines:** `.pw-src__l[data-cited]` (a 3 px rule on the left); the first cited line has `aria-current="true"`. The infobar gets `a.pw-infobar__back[aria-label="Back to Overview, Ask across projects"]` “‹ Overview” and “Source 1 of 3 · lines 12–40”.
- **1024 toggle:** `button[aria-pressed][aria-controls="ov-ask"]` “Ask Across Projects” in the Overview toolbar. When it is pressed, `#ov-lists` is hidden and the pane is `--full`.

#### Data each element needs (✱ = doesn't exist yet)

- ✱ **Overview conversation.** `{id, scope:{all, project_ids[]}, messages[]}`, stored server-side so reload and a second window show the same conversation. One active conversation; New starts another, and old ones are not listed in this round.
- **Authorized projects.** The registered projects the person can open, by stable id, name and order. This already exists as the Projects home list; ✱ the filter is applied before search.
- ✱ **Answer.** `{text, sources[], coverage:{searched_ids[], catching_up_ids[], unavailable:bool, at}}`.
- ✱ **Source.** `{n, project_id, path, heading, lines:[from,to], source_hash, changed_at, available}`. ✱ `changed_since_answer` is computed by comparing `source_hash` with the current revision.
- ✱ **Open.** A route into the project's Work at `path#L12-L40` in Source view, returning to `/overview` with the conversation id and the source number, so focus can return.
- ✱ **Hand-off.** Open the project chat with `draft=<question>`, a draft that is never auto-sent.

#### Exact copy

Everything is in R17_AskStrings. The key lines:

- “Searching all projects (5)”, “Searching 2 projects”, “Searching Class Notes only”.
- “Searched 4 of 5 projects · Pong is catching up after changes”.
- “Search isn't available right now. Pi answers from the project list and plans only.”
- “No matches in 5 projects.”
- “Pi reads these projects to answer. To change one, open it and ask there.”
- “Sources · 3 in 2 projects”.
- “Class Notes › docs/offline.md › Sync queue”, with “lines 12–40 · changed 2 days ago”.
- “Show 4 more”.
- “I can only read here. Open Class Notes to change it.” with **Open Class Notes Chat**.
- The Second Brain sentence appears once, in the first-open help: “Pi reads the projects' files and plans to answer and changes nothing. What you ask here is not added to the Second Brain.”

The answers are short (2–3 sentences). A reuse answer names where something was solved, but never says that it is compatible or verified for another app (the report's offline-support example). The drawn answer ends with “I haven't checked whether its code fits another app.”

#### States

The states are: first open, searching (Stop), answered, no matches, partial, partial now ready (Ask Again), unavailable (answer from list and plans), project removed after the answer (item greyed, Open disabled with reason), source changed since (marked, Ask Again), asked to change (hand-off), more than 5 sources, and the 1024 toggle.

A dashboard failure never blocks Ask, and Ask never blocks project chats.

#### Interactions

- Send asks within the conversation's scope. The scope popup changes the scope for the next questions; earlier answers keep their own coverage lines.
- Open opens the project (left window) and the file in Work at the first cited line. ‹ Overview or ⌃⌥0 returns with the conversation, scope, scroll position and focus kept.
- Ask Again re-asks the same question once, as a new message, and never automatically.
- Open {project} Chat opens that project's chat with the question as an unsent draft. It changes no phase and writes nothing.
- New starts an empty conversation scoped to all projects.

#### Accessibility

- **Tab order:** ‹ Back to Lists (1024) → New → scope → conversation (one stop, ↑↓ between messages) → each Sources list (one stop, ↑↓, Return opens, Show N more last) → Question → Send.
- **Scope popup:** focus goes to the first checked box; Escape returns focus to the button.
- **Polite announcements:** “Searching 5 projects…”, “Answered · 3 sources in 2 projects”, “No matches in 5 projects.”, the partial line, and the new scope label.
- **Accessible names:** each Open button is named “Open {file} in {project} at line {n}”, and each cite mark “Source {n}”.

#### Responsive

- **≥1100:** the 400 px pane sits beside the lists.
- **1024:** a toolbar toggle replaces the lists, and ‹ Back to Lists returns.
- **Phone:** Ask is its own screen. The back button reads ‹ Overview, the scope button is 44 px across the row with New beside it, the scope opens as a Search in sheet, and Open buttons are 44 px.
- **320:** source paths break anywhere, and Open stays on the right of each item.

#### Superseded earlier text (old → new)

- None. Ask across projects is new, and the dashboard brief (design/briefs/project-work-dashboard.md) has no text about a dashboard conversation. The status button opening Overview instead of Activity is worker A's change.
- Plan wording kept out of the UI: the report's “index”, “BM25”, “query” and “partition” never appear in UI copy. Their UI words are “search”, “Searching N projects” and “catching up after changes”.

#### Plan 354 journeys → boards

| Journey (plan 354 / retrieval report) | Boards |
| --- | --- |
| Dashboard can cite both authorized projects | R17_Ask, Ph17_Ask, R17_AskWalk 1 |
| Explicit project filter narrows it | R17_AskScope, Ph17_AskScope, R17_AskWalk 2 |
| Revoked/removed project disappears | R17_AskStates (removed), R17_AskWalk 3 |
| Label partial search coverage honestly; missing index still permits conversation | R17_AskStates (partial, unavailable), R17_AskWalk 5–6 |
| Stale source hash | R17_AskStates (changed since) |
| Discovery is read-only, not approval to edit | R17_AskStates (asked to change), R17_AskWalk 7 |
| Reload/reconnect preserves; two windows | R17_AskWalk 8–9 |
| Phone and keyboard use | Ph17_*, R17_AskNarrow |
| Search never publishes into the Second Brain | R17_AskStates (first open) |

#### E2E steps

1. Register Class Notes and Kanji Cards with fixtures that contain the unique markers `OFFLINE-CN` and `OFFLINE-KC`. Open `/overview` and ask the offline question. Expect two items whose project names are the two projects, and the line “Searched 5 projects”.
2. Narrow the scope to Class Notes and ask again. Expect no `OFFLINE-KC` anywhere in the answer, sources or counts.
3. Remove Kanji Cards. Expect its item to be greyed, its Open disabled, and the project absent from the scope popup.
4. Edit docs/offline.md. Expect “changed since this answer” and Ask Again.
5. Stop the search service and ask. Expect an answer with the unavailable line, and Send stays enabled.
6. Send a change request. Expect the hand-off button. Click it and expect the project chat with the draft filled, no messages sent, and an unchanged `git status`.
7. Open a source. Expect Work at line 12. Use ‹ Overview and expect focus on the same Open button.
8. Reload, and open a second window. Expect the same conversation and scope in both.
9. Run at 1024 and at the 390 phone width, and repeat steps 1, 2 and 7 with the keyboard only.

#### Open product choices

- Should a new conversation start from the last scope used, instead of all projects?
- Should conversations be kept and listed (a history), or should there be only one current conversation plus New (as drawn)?
- Should Open land in Page view (the rendered heading) instead of Source view for Markdown?
- Should a removed project's source stay numbered and greyed (as drawn), or disappear with a count?
- Should Ask Again re-ask only the missing project and merge, or everything (as drawn)?
- Should there be a per-row “Ask about this project” in Overview's lists?
- The JA name for Overview: drawn as 概要; worker A owns the name.

#### Existing vs Proposed

| Element | Existing | Proposed (round 17) |
| --- | --- | --- |
| Ask across projects pane | — | New: Overview's right pane; a toggle at 1024; its own screen on the phone |
| SearchScope (button, popup, coverage line) | — | New card |
| SourceList (+ cite marks, read-only line, hand-off) | — | New card |
| Work: cited lines + ‹ Overview | Work Source view (round 15 `pw-src`) | Adds the `data-cited` marking and the ‹ Overview return |
| Message, transcript, composer field, buttons | Existing | Reused; the Ask composer has no phase button, Attach or Run on its own |
| Overview lists, toolbar, entry points | — | Worker A (drawn simply here as context) |

### C · Project conversation scope and what Pi uses

Boards (`gen/r17c.py`; layout `r17layout_c.json`):

- R17_ProjectScope (1440×900)
- R17_ContextReceipt (1440×900)
- R17_ContextExisting (1440×900; Existing)
- R17_ContextStates (1440×2480; stale, missing, catching up, unavailable, long, Japanese, 320 px)
- R17_Context1024 (1024×900)
- Ph17_ProjectScope and Ph17_ContextSheet (390×844)
- R17_ContextStrings (1440×1300)
- R17_ContextWalk (1440×520)

Cards: **ContextReceipt** (new; README + preview, generated by `gen/ds17c.py`). ContextLine and Message each get a Round 17 section. CSS: `scripts/round17_c.css`, which adds `.pw-context__sep`, `.pw-context__found`, `.pw-receipt` and its parts. Append it to bundle.css so the preview renders.

#### Existing vs Proposed

| | Existing (round 11) | Proposed (round 17) |
| --- | --- | --- |
| Line | `Pi sees: … (rules) · … (plan) · … (task) +N Why?`; +N includes related files | the same deterministic items, a dotted separator, then “2 found”, then Why?; +N counts deterministic files only |
| Why? | “Why Pi sees these N files”: one mixed list, with name, reason sentence and path | “What Pi uses for this message”: Searched: Class Notes only · Always with this request (solid box) · Found for this question (dotted box: file › heading · lines · read time · matched words) · Left out · Also read |
| Retrieval failure | — | the line reads “search catching up” / “no search”; one dotted note in the receipt; Send stays enabled |
| Changed sources | — | stale: “changed after Pi read it” + Ask Again; missing: “moved to Trash after Pi read it” |
| Other projects | silent | one HarnessNotice under the answer, only when the message is about another project, with Ask in Overview |

#### Markup and ids

The line is `p.pw-context#chat-context`:

- the existing items;
- the existing `.pw-context__more`;
- `span.pw-context__sep[aria-hidden]`;
- `span.pw-context__found#context-found[data-state=found|stale|catching|unavailable|none][aria-label]`;
- `button.pw-context__why[aria-haspopup=dialog][aria-expanded][aria-controls=context-receipt]`.

The receipt is `section.pw-receipt#context-receipt[role=dialog][aria-labelledby=context-receipt-title]`, containing:

- `h3#context-receipt-title`;
- `p.pw-receipt__scope`;
- optional `p.pw-receipt__state[role=status]` (with `--stale` for stale or missing, which contains `#context-ask-again`);
- `section.pw-receipt__group--always > h4 + ol > li`;
- `section.pw-receipt__group--found > h4 + ol#rc-found-list > li[data-state=current|stale|missing]` (`.pw-receipt__where`, `.pw-context__kind`, `.pw-receipt__when`, `.pw-receipt__why`, optional `.pw-receipt__flag`), then `p.pw-receipt__left` rows;
- `p.pw-receipt__after`;
- `p.pw-receipt__foot`.

The boundary notice is `p.pw-notice[role=note]` holding `button#ask-in-overview[aria-describedby=ask-in-overview-why]`.

On the phone, `.pw-receipt` goes inside `psheet('What Pi uses')`, with no h3 and rows of at least 44 px.

#### Data (marked: none of this exists yet)

- The job records `context_receipt`: `{scope, always[{path, reason, word?}], found[{path, section, lines|truncated_lines, read_at, revision, words[]}], left_out[{path, section}], search: ready|catching_up|unavailable, also_read[]}`. It comes from the selection receipt in docs/reports/scoped-context-retrieval-2026-10-20.md §6.
- Stale or missing is computed when the receipt opens (revision ≠ the current file, or the file is in Trash) and is pushed live while the receipt is open.
- The boundary notice needs a harness classification: the message names another registered project, or retrieval returned nothing while a project name matched. It is recorded on the job as `scope_notice: true`, so reload shows it once.
- No score, rank, query text or engine field reaches the UI.

#### Copy

The exact copy is in the ContextReceipt README's Texts table and on R17_ContextStrings.

#### Interactions

- Why? toggles the receipt. Esc closes it, and focus returns to Why?
- Show N More expands the found list in place.
- Show (left out) lists names, which are not links Pi read.
- Ask Again resends the same message text in the same phase, with a fresh selection. The earlier answer stays.
- Ask in Overview opens /overview (⌃⌥0), focuses Ask across projects and fills it with the question, without sending.

#### Accessibility

- “N found” is text with a descriptive name. The dialog is labelled.
- The stale banner uses role=status. A polite announcement is made only when a source goes stale while the receipt is open.
- The Ask Again disabled reason is given through aria-describedby.

#### Responsive

- **≥1100**: the popover is 480 wide, anchored above Why?
- **1024**: the same popover, anchored above Why? inside the chat. The line hides file names from the end, and “N found” and Why? never hide.
- **320**: the line wraps (data-expanded), “2 found” stays whole, and the notice wraps with its button on its own row.
- **Phone**: a sheet.

#### Superseded earlier text (old → new)

- Why? title: “Why Pi sees these N files” → “What Pi uses for this message”. The phone sheet becomes “What Pi uses”.
- The reason word “related” (“Related: its name matches “subject””) → retired. These files now appear under “Found for this question” as “Matches “subject””, with the kind word “found”.
- `+N` (“Show N more”) no longer counts related files.
- Footer: “Chosen again for every message. Never vendor/, licences, build output or files over 40 KB.” → “Chosen again for every message. Never vendor/, licences, build output, files over 40 KB, or other projects.”
- The round 11 notes line “one reason word per file … rules · plan · task · named · changed · related” → “rules · plan · task · named · changed · flow; found files are listed only in the receipt”.

#### Plan 354 journeys → boards

| Journey | Boards |
| --- | --- |
| Project chat cannot surface another project | R17_ProjectScope, Ph17_ProjectScope, R17_ContextWalk 2 |
| Edits refresh context and stale sources are visible | R17_ContextStates (stale), Walk 3 |
| Revoked or trashed content disappears | R17_ContextStates (missing) |
| Reload or reconnect keeps the receipt | Walk 5 |
| A missing index still permits conversation | R17_ContextStates (catching up, unavailable), Walk 4 |
| Receipt transparency | R17_ContextReceipt, R17_Context1024, Ph17_ContextSheet |

#### E2E steps

1. Send “Where do we filter notes by subject?” → expect `#context-found` to read “2 found” → press Why? → expect the dialog “What Pi uses for this message”, the text “Searched: Class Notes only”, the headings “Always with this request · 3” and “Found for this question · 2” → press Esc → focus is on Why?
2. Seed a unique marker in Pong. Ask about it in Class Notes → the answer does not contain the marker; one note “Pi searched Class Notes only…” appears → press Ask in Overview → the URL is /overview and the Ask field holds the question; no job is created.
3. Edit app/subjects.js after the answer → open the receipt → the row is flagged “changed after Pi read it” → press Ask Again → a new job runs with the same text.
4. Stop or break search → send → the answer arrives; `#context-found` reads “no search”; Send was enabled throughout.
5. Reload → the receipt for that message has the same rows and read times.
6. Use two windows → send in A → B updates its line; opening the receipt in A does not open it in B.

#### Open product choices

- Per-message receipt history (as drawn) vs the latest message only.
- Ask Again: resend at once (as drawn) or put the text back in the composer.
- Ask in Overview: prefill (as drawn) or send at once.
- Show left-out names, or only their count.
- The cap of 3 visible found rows.
- Whether the boundary notice also appears when the person names something absent (not a project), or only for project names.

#### Acceptance journeys (all parts, Given/When/Then; boards named)

1. **Help needed across projects.** Given Class Notes has a question waiting and Pong a plan waiting, when I press ⌃⌥0, then Overview lists both under Needs you in kind order with Open Question and Open Plan; opening one lands on the authoritative card and the item stays until I answer it there (R17_Overview, R17_OverviewFollow, R17_OverviewWalk).
2. **Resolved elsewhere.** Given Overview is open in two windows, when I answer the question in the project chat, then the item leaves both windows with “Class Notes: answered” announced once, and focus moves to the next item (R17_OverviewWindows).
3. **Disconnected and recovered.** Given the connection drops, then the toolbar says “Not connected · showing 14:20”, rows are dotted and suffixed “at 14:20”; on reconnect one line “Reconnected · 2 changes since 14:20” (R17_OverviewStates, Ph17_OverviewStates).
4. **Recorded failures vs requests waiting.** Given a request stopped by an error and was later retried successfully, then it is under Recorded problems only, not Needs you (R17_OverviewHistory).
5. **Ask across projects.** Given 5 projects, when I ask “where do we handle offline sync?”, then the answer cites “Sources · 3 in 2 projects” with project › file › section · lines; Open shows the file read-only in that project's Work (R17_Ask, R17_AskSource).
6. **Narrow the scope.** When I choose only Class Notes and Pong in “Searching all projects (5)”, then the button reads “Searching 2 projects” (one project: “Searching Class Notes only”) and the next answer cites only them (R17_AskScope, R17_AskNarrow).
7. **Partial, none, unavailable.** “Searched 4 of 5 projects · Pong is catching up after changes”; “No matches in 5 projects.”; “Search isn't available right now. Pi answers from the project list and plans only.” Chat is never blocked (R17_AskStates, Ph17_AskScope).
8. **Project boundary.** Given I ask in Class Notes about Pong, then the HarnessNotice says “Pi searched Class Notes only. To search every project, ask in Overview.” with Ask in Overview (R17_ProjectScope, Ph17_ProjectScope).
9. **What Pi used.** When I press Why?, then “What Pi uses for this message” separates Always with this request from Found for this question, with read times, left-out and truncated items; a stale file offers Ask Again (R17_ContextReceipt, R17_ContextStates, Ph17_ContextSheet).
10. **Reload, phone, keyboard.** After reload the same items and focus target return; on the phone Overview and Ask are separate screens with 44 px rows; ↑↓ moves within each list, Return opens (Ph17_Overview, Ph17_Ask, R17_OverviewWalk, R17_AskWalk, R17_ContextWalk).

## 2026-10-20 · Round 18: Overview and scoped context, finalized (decisions of plan 360)

Boards: canvas page **Round 18: Overview decisions** (41 boards: 31 desk `R18_`, 10 phone `Ph18_`). This round applies the 20 owner-delegated decisions in `docs/plans/360-round-17-product-decisions.md` to round 17; it does not reopen them. Three parts below: A, Overview (status priority with a stopped service, order and focus, per-window filters, history, ⌘/Ctrl+Return, 1024, Ask About); B, Ask across projects (conversation history and per-conversation scope and draft, prefill and draft conflict, selective retry, citations in Page view and redacted unavailable sources); C, the project conversation (a receipt for every submitted message, compact counts, left-out names and reasons, three found rows, the narrowed boundary notice). New card **ConversationList**; Round 18 sections in WorkOverview, AttentionItem, StatusButton, PhoneBar, MenuBar, SearchScope, SourceList, ContextReceipt, ContextLine, Message, plus the design-system repairs in ContextMeter, VisualResult and Dialog. CSS: `round18_fix.css`, `round18_a.css`, `round18_b.css`, `round18_c.css`, appended to `bundle.css` and `components.css`. Handoff: `docs/handoff/round-18-design-2026-10-20.md`.

**Everything here is Proposed.** Nothing in this round ships because it is drawn; the data each part still needs is listed under “Data contracts still missing (✱)”. Approval cards, PhaseControl and the read-only Overview are unchanged. Several agents stays “Proposed later” (R17_SeveralAgents); no round 18 board implies more than one agent.

#### Decisions → boards and cards (all 20)

| # | Decision (plan 360) | Boards | Cards |
| --- | --- | --- | --- |
| 1 | Oldest first within a kind; history newest first; a focused row never moves | R18_OverviewFocus, R18_OverviewHistory | AttentionItem, WorkOverview |
| 2 | Show filters per window | R18_OverviewWindows | WorkOverview |
| 3 | 7 days of resolved history; unresolved never expire | R18_OverviewHistory, R18_OverviewFocus | WorkOverview, AttentionItem |
| 4 | Work-blocking service status, priority, no false Working/Idle | R18_OverviewService, R18_OverviewStatus, R18_OverviewStates, Ph18_OverviewService | StatusButton, PhoneBar, WorkOverview, AttentionItem |
| 5 | Projects window hidden at 1024 unless opened explicitly | R18_Overview1024, R18_OverviewWindows | MenuBar |
| 6 | ⌘Return / Ctrl+Return on a focused row, Open in New Window, popup blocked | R18_OverviewRowActions, R18_Overview, R18_OverviewWalk | AttentionItem, WorkOverview |
| 7 | Cancelled interrupted request leaves an honest history row | R18_OverviewHistory, Ph18_OverviewHistory | AttentionItem, WorkOverview |
| 8 | New dashboard conversation = all authorized projects, stated | R18_AskConversations, R18_AskHistory | ConversationList, SearchScope |
| 9 | Keep and list conversations, New Conversation | R18_AskHistory, R18_AskConversations, Ph18_AskHistory | ConversationList |
| 10 | Cited Markdown opens in Page view at the section; Source view reachable | R18_AskCitePage, R18_AskCiteStates, Ph18_AskCite | SourceList |
| 11 | Removed/revoked citation → numbered, disabled, redacted placeholder | R18_AskCiteStates, R18_AskConversations, R18_AskRetryStates | SourceList, SearchScope |
| 12 | Retry only missing projects; new attempt; original kept; full refresh separate | R18_AskRetry, R18_AskRetryStates | SearchScope |
| 13 | Ask About {project} on each project row | R18_Overview, R18_OverviewAskAbout, R18_OverviewRowActions, Ph18_OverviewRowMenu, R18_AskAbout, R18_AskPrefill | WorkOverview, ConversationList |
| 14 | A receipt for every submitted message, recorded at send | R18_ProjectScope, R18_ContextReceipt, R18_ContextStates, R18_ProjectScopeStates, R18_Context1024, Ph18_ContextSheet | ContextReceipt, Message, ContextLine |
| 15 | Retry sends at once, deduplicated, rechecked, draft kept; “Nothing to retry.” | R18_AskRetryStates, Ph18_AskRetry, R18_AskNarrow | SearchScope |
| 16 | Ask in Overview prefills and waits; draft conflict | R18_ProjectScope, R18_ProjectScopeStates, Ph18_ProjectScope, R18_AskPrefill, Ph18_AskDraft | Message, ConversationList |
| 17 | Compact counts; expanded left-out names and reasons (authorized only) | R18_ContextReceipt, R18_ContextStates | ContextReceipt |
| 18 | Three found rows, then Show All | R18_ContextReceipt, R18_ContextStates, Ph18_ContextSheet | ContextReceipt |
| 19 | Boundary notice only for an explicitly named project; scope indicator always | R18_ProjectScope, R18_ProjectScopeStates, Ph18_ProjectScope | Message, ContextLine |
| 20 | 概要 | R18_OverviewStrings, R18_AskStrings, R18_ContextStrings | WorkOverview, MenuBar, Message |

#### Fixed wording shared by all parts

- Status priority, highest first: “Connection interrupted” → “Can't run work · Ollama stopped[ · 2 need you]” (作業を実行できません · Ollama 停止中[ · 対応待ち 2 件]) → “2 need you · Working on Class Notes” → Working / Waiting → Ready. While a work-blocking service is down, project rows read “State unknown while Ollama is stopped” (Ollama 停止中のため状態不明) and keep “Queued: 2 requests · waiting for Ollama”.
- History: “Resolved in the last 7 days” (過去 7 日間に解決), newest first; “Cancelled by you · 14:40” + “Changes made before the restart are still in the project.”
- Open in New Window; blocked: “Your browser blocked the new window.” + Open Here + Copy Link (ブラウザーが新しいウインドウをブロックしました。/ ここで開く / リンクをコピー).
- Ask About Class Notes (Class Notes について質問); New Conversation (新しい会話); “This conversation already has an unsent draft.” + Keep My Draft + Replace with New Question.
- Retry Pong / Retry 2 Projects (Pong で再試行 / 2 件のプロジェクトで再試行) → “Retrying Pong…” → reply “Retry · Pong”; “Nothing to retry.”; full refresh: ⋯ › Ask All Projects Again.
- Source unavailable (ソースは利用できません); “Sources · 3 · 1 unavailable”; “Changed after this answer (2 days ago). You're reading the current file.” + Show Source.
- “What Pi used for this message”; summary “Pi used 3 always · 4 found · 2 left out” (常に 3 · 検索 4 · 除外 2); Show All 4; Ask Again with Current Files (現在のファイルでもう一度質問).

#### Privacy and redaction (all parts)

Every name, path, section, line range, excerpt and count is resolved against the person's current authorization each time it is drawn: in Sources, coverage lines, Retry targets, scope labels, the scope popup, conversation items, receipts and counts. A project the person can no longer open leaves labels and counts with no placeholder or “1 hidden”; the only trace kept is a cited source's number, shown as “Source unavailable” so cite marks stay aligned. The boundary notice never names another project and never appears for an unknown or unauthorized name. Conversation history and old receipts grant nothing. Retrieval scope never authorizes a project write. No database words (index, BM25, SQL, DuckDB, query, embedding, rank) in the ordinary UI. Nothing is published to the Second Brain.

#### Design-system repairs (confirmed round 15/16 gaps)

- ContextMeter: `.pw-meter--near` is now defined (2 px bar frame, the meter may wrap). No markup change.
- VisualResult: the generating bar's undefined `pw-bar` is replaced by the ContextMeter bar primitive (`.pw-meter__bar` › `.pw-meter__fill`, no tick; it counts finished candidates, not time); the inspect dialog header uses `.pw-dialog__head`, now defined and documented in the Dialog card. R15_VisualStates and R15_VisualInspect are updated. The rules live in `round18_fix.css` and are scoped to those classes; nothing global changes.

### A · Overview finalized

Generator `gen/r18a.py` (execs `gen/r17a.py`, which execs r13.py; injects `round17_b.css`, `round17_c.css`, `round18_fix.css`, `round18_a.css` on top of round17_a). Card previews `gen/ds18a.py`. CSS `scripts/round18_a.css`. Layout `r18layout_a.json`. Check `r18check_a.py` (0 HTML problems, 0 undefined `pw-` classes across the 16 boards and the WorkOverview, AttentionItem, StatusButton, PhoneBar, MenuBar previews). Every board was rendered with shot.py (`shots18a/`) and fixed for overflow, clipping and overlap.

Design only: nothing here claims that a backend feature ships. Round 17's layouts, the read-only Overview, PhaseControl and the approval cards are unchanged.

#### Boards (reading order)

| Board | Size | Shows |
| --- | --- | --- |
| R18_Overview | 1440×1360 | The desk Overview: rows gain Ask About {project}, Open in Activity and ⋯. Items have ⋯. "Resolved in the last 7 days". The Ask pane header has a conversation popup and scope. |
| R18_OverviewService | 1440×1300 | Ollama stopped, 2 queued, 2 need you. The status reads "Can’t run work · Ollama stopped · 2 need you" and the service item is first. Every row is "State unknown…", Class Notes adds "Queued: 2 requests · waiting for Ollama", and the Agent rows never say running. |
| R18_Overview1024 | 1024×1400 | Projects window opened explicitly and kept at 1024, plus the Ask Across Projects toggle. |
| R18_OverviewAskAbout | 1440×1000 | After Ask About Class Notes: a new conversation reading "Searching Class Notes only", the composer focused, nothing sent. |
| R18_OverviewStatus | 1440×1480 | The 5-step priority ladder, rules for mixed states, the Agent rows while stopped, Activity's service detail (Open Details) and EN/JA. |
| R18_OverviewRowActions | 1440×1500 | Row ⋯ menu, item ⋯ menu, ⌘/Ctrl+Return rules, the popup-blocked notice with its rules, and ⌘Return in the Ask composer still sending. |
| R18_OverviewFocus | 1440×2000 | Oldest first within a kind. A new item is inserted above the focus while the focused row keeps its place ("1 new item in Needs you"). When the focused item resolves, focus moves on ("Class Notes: answered"). An 11 Oct question is still listed. |
| R18_OverviewWindows | 1440×1560 | Two windows with Show: Needs You and Show: Working, reload rules, Window › Projects checked, and resize rules. |
| R18_OverviewHistory | 1440×1260 | Interrupted item → Activity detail with Cancel Request… plus the alert → item leaves ("pi-local-harness: cancelled") → history row "Cancelled by you · 14:40". |
| R18_OverviewStates | 1440×2580 | Ollama stopped alone; Show: Working while stopped; non-blocking Preview stopped; not connected beats service; 320 px. |
| Ph18_Overview · Ph18_OverviewService · Ph18_OverviewRowMenu · Ph18_OverviewHistory | 390×844 | Phone list with 44 px row actions; two-line blocked status; the row ⋯ sheet; history with the cancelled row. |
| R18_OverviewStrings | 1440×1640 | EN/JA (47 strings). |
| R18_OverviewWalk | 1440×1480 | Given/When/Then for every decision, including reload and two windows. |

#### Decision → boards and cards

1. **Order: oldest first within a kind; history newest first.** R18_OverviewFocus (cells 1, 4, 5) and R18_OverviewHistory. Cards: AttentionItem § Round 18, WorkOverview § Round 18.
2. **Per-window filters.** R18_OverviewWindows. Card: WorkOverview.
3. **7 days of resolved history; unresolved items never expire.** R18_OverviewHistory and R18_OverviewFocus (11 Oct question). Cards: WorkOverview, AttentionItem.
4. **Work-blocking service status and priority.** R18_OverviewService, R18_OverviewStatus, R18_OverviewStates and Ph18_OverviewService. Cards: StatusButton § Round 18, PhoneBar, WorkOverview, AttentionItem.
5. **1024: Projects window hidden by default and kept when opened explicitly.** R18_Overview1024 and R18_OverviewWindows. Card: MenuBar § Round 18.
6. **⌘/Ctrl+Return, its visible equivalent and the popup-blocked notice.** R18_OverviewRowActions, R18_Overview (⋯ everywhere) and R18_OverviewWalk. Cards: AttentionItem, WorkOverview.
7. **Cancelled history row.** R18_OverviewHistory and Ph18_OverviewHistory. Cards: AttentionItem, WorkOverview.
13. **Ask about this project (row action).** R18_Overview, R18_OverviewAskAbout, R18_OverviewRowActions and Ph18_OverviewRowMenu. Card: WorkOverview. Worker B owns the conversation, the prefill and the draft-conflict UI.
20. **概要.** R18_OverviewStrings and R18_OverviewWalk (Japanese journey). Cards: WorkOverview, MenuBar.

#### Markup, classes, ids (new in round 18)

- **Project row.** `div.pw-prow[role=row]#prow-<id>[data-unknown]` contains:
  - `span.pw-prow__cellwrap[role=gridcell]`, holding `a.pw-prow__main[aria-keyshortcuts="Meta+Enter Control+Enter"]`.
  - `span.pw-prow__side`, which holds three `span[role=gridcell]`: `button.pw-prow__ask` "Ask About {name}" (`title` = full label), `button.pw-prow__act` "Open in Activity", and `button.pw-rowmore[aria-haspopup=menu][aria-expanded][aria-label="More for {name}"]`.
  - `.pw-prow__now` (the now cell, which wraps) and `.pw-prow__queue` (the queued line under the now/agent cells).
- **Attention item.** `li.pw-attnrow` holds `a.pw-attn[aria-keyshortcuts][data-blocking][data-new]` and `button.pw-rowmore` "More for {project}: {kind}".
- **Row and item menu.** `.pw-menu.pw-rowmenu[role=menu]` contains `.pw-menu__item` entries:
  - Row: Open Chat (Return) · Open in New Window (⌘Return) · separator · Ask About {name} · Open in Activity.
  - Item: Open {X} · Open in New Window.
- **Popup-blocked notice.** `div.pw-ovnotice[role=status]` sits between the toolbar and the infobar. It holds `.pw-ovnotice__text` and two `.pw-btn` buttons (Open Here, Copy Link).
- **Status button.** `button#agent-status.pw-statusbtn.pw-statusbtn--attention.pw-statusbtn--blocked[data-state=blocked]`. On the phone it adds `.pw-statusbtn--wrap`.
- **History.** `ul.pw-hist` with `li` containing `.pw-hist__state`, `.pw-hist__what` (wrapping text plus `.pw-hist__note`) and `time`. The toggle reads "Resolved in the last 7 days".
- **Ask pane head.** It matches the ConversationList card and gen/r18b.py's `pane18` head. Inside `aside.pw-overview__ask`, `div.pw-ask__head` holds three rows:
  - Row 1: `h2.pw-ask__title#ov-ask-h` "Ask across projects", plus the small **New** button (accessible name "New Conversation", `aria-keyshortcuts="Control+Alt+N"`).
  - Row 2, full width: `div.pw-convo` › `button.pw-convo__btn#ask-convo[aria-haspopup=menu][aria-controls=ask-convo-menu][aria-label="Conversation: {title}"]` (speech glyph, title, ▾).
  - Row 3, full width: `span.pw-scope` › `button.pw-scope__btn#ask-scope`.
  - Classes come from round17_b.css and round18_b.css. `.pw-overview__askbar` and `.pw-overview__conv` are removed.
- **Live region.** `#ov-live` is unchanged. Boards draw it as `.pw-ovlive`.

#### Exact copy (EN → JA)

The full table is on R18_OverviewStrings. Key strings:

| English | Japanese |
| --- | --- |
| Overview · All Projects (window title) | 概要 · すべてのプロジェクト |
| Overview (menu, Agent row, names) | 概要 |
| Can’t run work · Ollama stopped | 作業を実行できません · Ollama 停止中 |
| Can’t run work · Ollama stopped · 2 need you | … · 対応待ち 2 件 |
| aria-label: Agent status: can’t run work, Ollama stopped, 2 need you. Open Overview | エージェントの状態：作業を実行できません、Ollama 停止中、対応待ち 2 件。概要を開く |
| State unknown while Ollama is stopped | Ollama 停止中のため状態不明 |
| Queued: 2 requests · waiting for Ollama | 待機中：リクエスト 2 件 · Ollama を待っています |
| Service problem · Ollama stopped | サービスの問題 · Ollama 停止中 |
| Agent row: Can’t run work · 2 need you | 作業を実行できません · 対応待ち 2 件 |
| Activity row: 2 queued · Ollama stopped | 待機中 2 件 · Ollama 停止中 |
| Projects list: state unknown | 状態不明 |
| Ollama: running again | Ollama：再び動作しています |
| Resolved in the last 7 days | 過去 7 日間に解決 |
| Newest first · history only: nothing to do here | 新しい順 · 履歴のみ（ここで行う操作はありません） |
| Cancelled by you · 14:40 | あなたがキャンセル · 14:40 |
| Changes made before the restart are still in the project. | 再起動前に行われた変更は、プロジェクトに残っています。 |
| Cancel Request… | リクエストをキャンセル… |
| Cancel this interrupted request? | 中断したこのリクエストをキャンセルしますか？ |
| Keep Request | リクエストを残す |
| {project}: cancelled | {project}：キャンセルしました |
| 1 new item in Needs you | 対応待ちに新しい項目が 1 件 |
| {project}: answered | {project}：回答済み |
| Open in New Window | 新しいウインドウで開く |
| Open Chat | チャットを開く |
| More for {name} | {name} のその他の操作 |
| Your browser blocked the new window. | ブラウザーが新しいウインドウをブロックしました。 |
| Open Here | ここで開く |
| Copy Link | リンクをコピー |
| Link Copied | リンクをコピーしました |
| Ask About {project} | {project} について質問 |
| Ask about {project}… (placeholder) | {project} について質問… |

#### States

- **Status priority.**
  1. Connection interrupted, with Reconnect.
  2. A blocking service failure. Shown alone as "Can’t run work · Ollama stopped" (framed, because the service item itself needs you), or with attention appended as "… · 2 need you".
  3. Attention: "2 need you · Working on Class Notes".
  4. Working or Waiting.
  5. Ready.

  The "need you" count in state 2 excludes the blocking service item, because the words already name it. Non-blocking problems (for example "Service problem · Preview stopped") only add to the count and keep the service kind's last place.
- **While state 2 holds, no surface says Working, Idle or Ready.** This covers the status button, the Agent rows, the Projects list, each Overview row and the Show: Working empty state. Queued counts stay.
- **Not connected while a service is stopped.** Connection interrupted wins, and Overview shows the dotted 14:20 snapshot.
- **Focused item resolves.** It fades for 2 s, then focus moves to the next item (else the previous one, else the heading) and the region announces "{project}: answered".
- **New items arrive.** They are inserted around the focused item and the list scrolls to keep the focused item in place. A `[data-new]` "New" tag shows until the item is focused or 60 s pass.
- **Popup blocked.** An inline notice appears. Open Here behaves as Return. Copy Link changes to "Link Copied" for 2 s. The notice closes after either action or on the next successful open.
- **History.** Resolved problems only, newest first, collapsed by default, kept 7 days for display.

#### Keyboard and focus

- **Lists.** Needs you and the Projects grid are one Tab stop each, with ↑ ↓ Home End to move. Return opens the item. ⌘Return (macOS) or Ctrl+Return (elsewhere) opens it in a new browser window, and focus stays on the item.
  - → moves from the item link to ⋯.
  - In Projects, → goes link → Ask About → Open in Activity → ⋯, and ← goes back.
  - Esc closes the ⋯ menu and returns focus to ⋯.
- **Composers.** The new-window shortcuts are never bound inside a composer. In the Ask pane and in project chats, Return and ⌘Return keep their send meaning.
- **Ask About.** Focus moves to the Ask composer. In the new conversation, Shift+Tab reaches the conversation popup.
- **Second window.** It keeps its own focus and its own Show value.
- **Live updates.** A live update never moves the focused row.

#### Responsive

- **≥1100.** Projects home, Overview and the 400 px Ask pane. Row actions sit on their own right-aligned line under the row text.
- **1024.** The Projects window is hidden by default. If it was opened explicitly, it is kept with its state, and Overview shows the Ask Across Projects toggle.
- **≤560 (320).** Section heads wrap (the note goes on its own line), row actions wrap, and items stack.
- **Phone ≤760.**
  - Row actions are 44 px (Ask About fills the line), and item ⋯ is a full-height 44 px column.
  - A row's ⋯ opens a sheet (Open Chat · Ask About · Open in Activity) with no new-window item.
  - The blocked status uses two lines inside the 44 px button.

#### Superseded round 17 text (exact old → new)

- **StatusButton.**
  - Old: "Should a service problem (Ollama stopped) also appear in the StatusButton words…? Drawn: it counts in 'need you' only."
  - New: a work-blocking service shows "Can’t run work · Ollama stopped[ · 2 need you]" at priority 2.
  - Round 17's "otherwise as before (Ready, Working · 1 waiting, 1 waiting, Connection interrupted + Reconnect)" is replaced by the five-step priority.
- **Project rows during a blocking failure.** "Working: task 2 · Subjects · 2 queued" / "Idle" → "State unknown while Ollama is stopped" plus "Queued: 2 requests · waiting for Ollama".
- **Agent row and Projects list during a blocking failure.**
  - Agent row "Overview · 5 need you · 1 working" → "Can’t run work · 2 need you".
  - Activity row "1 running · 2 waiting" → "2 queued · Ollama stopped".
  - Projects list "running" → "state unknown".
- **Service item placement.** It was the last kind ("Service problem"); a blocking one is now first, as "Service problem · Ollama stopped".
- **History section.**
  - "Recorded problems" → "Resolved in the last 7 days".
  - "History only: nothing to do here" → "Newest first · history only: nothing to do here".
  - The history row "Interrupted · pi-local-harness · Request 13:35 · task 3: still waiting for you (in Needs you)" is removed.
  - The count "3 in the last 7 days" → "3".
- **Announcements.**
  - "{project}: answered. {n} need you." → "{project}: answered".
  - "Pong: waiting for your answer." (new item) → "1 new item in Needs you".
- **Project row structure.** "`div.pw-prow[role=row]` with two gridcells: row link, Open in Activity" → four gridcells: row link, Ask About {project}, Open in Activity, ⋯.
- **Keyboard hint.** "Each list is one Tab stop: ↑ ↓ move, Return opens, → reaches Open in Activity." → "…, Return opens, ⌘Return opens in a new window, → reaches the row’s buttons and ⋯."
- **AttentionItem keyboard.** "⌘Return (Ctrl+Return) opens in a new browser window" now has a visible equivalent: ⋯ › Open in New Window.
- **Ask pane header.** "Ask across projects" + scope button → row 1: title + **New**; row 2: the conversation popup (ConversationList); row 3: the scope button.
- **Open product choices.** WorkOverview 1–5 and AttentionItem 1–2 are resolved and closed.

#### Data contracts still missing (✱)

- ✱ **Service health record.** `{service:"ollama", state:"stopped"|"running", since, blocking:true|false}` in the Overview projection, with blocking vs non-blocking decided by the host, never by text.
- ✱ **Per-project `now.state`.** It must be able to say `"unknown"` (with the reason `service_stopped`) instead of idle.
- ✱ **Queued count per project.** It must stay valid while the model server is down.
- ✱ **Attention `created_at`.** Needed for oldest-first ordering, plus a stable `id` per item.
- ✱ **Resolution records.** `resolved_at` and `resolution` (`answered` | `approved` | `continued` | `recovered` | `cancelled`) for the history and the announcements. A `cancelled_by` field and a `cancelled` state for interrupted requests.
- ✱ **Cancel endpoint for interrupted requests.** Only queued-job cancel exists today (`/api/jobs/cancel`).
- ✱ **Per-window Show state.** Kept in the window address or session; no server field.
- ✱ **Deep links for every item and row target**, used by Open in New Window and Copy Link.
- ✱ **Ask About `scope.project_ids`.** Created on a new or empty dashboard conversation; worker B's contract.

#### Privacy and redaction

- The service item names the service and "All projects", never project content.
- Overview rows and items appear only for registered projects the person can open.
- Copy Link copies an Overview, chat or Activity address, which grants no access by itself.
- Ask About narrows search scope only. It never grants writes and never adds projects.
- History rows show recorded facts only. "Changes made before the restart are still in the project." states what is true and lists no file contents.

#### Acceptance journeys (extended; R18_OverviewWalk has the stable names)

1. **Service failure with queue and attention.** Boards: R18_OverviewService, R18_OverviewStatus, Ph18_OverviewService.
   - Given Ollama stopped at 14:24, 2 queued, Pong and home-server waiting.
   - Then the button is named "Agent status: can’t run work, Ollama stopped, 2 need you. Open Overview".
   - Then the first item reads "All projects: Service problem · Ollama stopped. Model server · Ollama. Open Details".
   - Then no row text matches /\b(Working|Idle|Ready)\b/ and Class Notes reads "Queued: 2 requests · waiting for Ollama".
   - When Ollama returns, Then "Ollama: running again" is announced and the button reads "2 need you".
2. **Connection beats service.** Board: R18_OverviewStates.
3. **Order and focus.** Board: R18_OverviewFocus.
   - Given focus on the home-server check-in, When a Class Notes question arrives, Then it lists after Pong's question, focus keeps its place, and one announcement is made: "1 new item in Needs you".
   - When the focused Class Notes question is answered in another window, Then focus is on the next item and "Class Notes: answered" is announced.
4. **Unresolved never expires; history newest first.** Boards: R18_OverviewFocus, R18_OverviewHistory.
5. **Two windows, two filters, reload.** Board: R18_OverviewWindows.
6. **Open in new window, popup blocked, composer unaffected.** Board: R18_OverviewRowActions.
7. **1024 with an explicit Projects window.** Boards: R18_Overview1024, R18_OverviewWindows.
8. **Cancel an interrupted request.** Boards: R18_OverviewHistory, Ph18_OverviewHistory.
   - Expect "pi-local-harness: cancelled".
   - Expect the row "Cancelled by you · 14:40" with "Changes made before the restart are still in the project.".
   - Expect no "rolled back" text.
9. **Ask about this project.** Boards: R18_OverviewAskAbout, Ph18_OverviewRowMenu.
   - Expect "Searching Class Notes only" and composer focus.
   - Expect no request sent.
   - Expect the earlier conversation's scope and draft to be unchanged.
10. **Japanese.** Board: R18_OverviewStrings. Expect 概要 everywhere.

#### Existing vs Proposed

| Part | Status |
| --- | --- |
| Activity, Gate, ChoiceCard, PlanCard, CheckInCard, Ask Pi to Retry…, Connection interrupted + Reconnect | Existing, unchanged |
| Overview window, AttentionItem, project row (round 17) | Proposed (round 17), revised here |
| Status priority with "Can’t run work · Ollama stopped" | Proposed |
| "State unknown while Ollama is stopped", queued-while-stopped line | Proposed |
| Ask About {project}, row and item ⋯ menus, Open in New Window, popup-blocked notice | Proposed |
| Activity › Cancel Request… for interrupted requests, plus the alert | Proposed (no endpoint yet ✱) |
| Activity service detail with Check Again | Proposed wording on the round 17 detail |
| Resolved in the last 7 days, Cancelled by you row | Proposed |
| Per-window Show, Projects window kept at 1024 | Proposed |
| Several agents | Still Proposed later (R17_SeveralAgents, unchanged) |

#### New open issues (genuinely new only)

1. **Several blocking services at once.** For example, Ollama stopped while another blocking service is also down. The decided words name one service. I did not draw a case for two and propose the lead fix the wording; a candidate is "Can’t run work · 2 services stopped · 2 need you".
2. **Item ⋯ grid semantics.** The item ⋯ makes Needs you a list of link + button pairs reached with →. If implementers prefer ARIA semantics, Needs you could become `role=grid` like Projects. Behaviour is the same either way.

### B · Ask across projects finalized

Design only: nothing here ships a conversation store, retry, or Page-view routing. Generator `gen/r18b.py` (execs `gen/r17b.py` minus its preview section, which execs r13.py); run with `PW_OUT=SP/out18b/`; only `R18_Ask*`/`Ph18_Ask*` are copied to `cv/project/`. CSS: `scripts/round18_b.css`, injected together with `round17_a/b/c.css` and `round18_fix.css`. Layout: `r18layout_b.json`. Validation: `r18check_b.py` → 0 HTML problems, 0 undefined `pw-` classes (16 boards + SearchScope, SourceList, ConversationList previews). Every board render-checked with `shot.py` (PNGs in `shots18b/`).

All boards are titled “Round 18 · Proposed · …”. Round 17's pane layout, read-only line, hand-off, Overview lists (worker A) and approval cards are unchanged.

#### Boards (reading order)

| Board | Size | Shows |
| --- | --- | --- |
| R18_AskHistory | 1440×900 | Conversation popup open: New Conversation ⌃⌥N, then conversations newest first “title · scope · date”, Draft marker; project rows with “Ask About {project}” |
| R18_AskConversations | 1440×2300 | A (narrowed, draft) → switch to B → New (all projects) → back to A; project added later (“Searching 5 of 6 projects”); project no longer available; no project left |
| R18_AskAbout | 1440×900 | Ask About Class Notes: new conversation, “Searching Class Notes only”, focus in Question, nothing sent |
| R18_AskPrefill | 1440×1520 | Reuse of an empty conversation; draft-conflict notice; Keep My Draft; Replace with New Question; Ask in Overview prefill; Ask in Overview with conflict |
| R18_AskRetry | 1440×900 | Original answer unchanged (“Retried at 14:41 · below”) + new reply “Retry · Pong”; draft “And conflicts?” untouched |
| R18_AskRetryStates | 1440×2230 | One, several, in flight, done, still missing, target no longer available, Nothing to retry, ⋯ › Ask All Projects Again |
| R18_AskCitePage | 1440×900 | Open → docs/offline.md in Page view at “Sync queue”, section marked, Page/Source toggle, ‹ Overview |
| R18_AskCiteStates | 1440×1760 | Source view; changed banner + Show Source; moved; Sources with moved/changed/deleted; unavailable (redacted); section gone |
| R18_Ask1024 | 1024×900 | Projects window hidden (default); Ask About presses “Ask Across Projects”; ‹ Back to Lists |
| R18_AskNarrow | 1440×940 | 320 px pane (retry in flight + draft notice), static popup, keyboard, announcements |
| Ph18_AskHistory | 390×844 | Conversations sheet |
| Ph18_AskDraft | 390×844 | Draft notice, stacked 44 px buttons |
| Ph18_AskRetry | 390×844 | Retrying Pong…, draft kept |
| Ph18_AskCite | 390×844 | Page view, changed banner, Page/Source toggle |
| R18_AskStrings | 1440×1800 | EN/JA (round 18 additions) |
| R18_AskWalk | 1440×1900 | 16 Given/When/Then journeys incl. reload and two windows |

#### Decisions → boards and cards

| # | Decision | Boards | Cards |
| --- | --- | --- | --- |
| 8 | New conversation = all authorized projects, stated | R18_AskConversations (New), R18_AskHistory, R18_AskWalk 2 | ConversationList, SearchScope R18 |
| 9 | Keep and list conversations + New | R18_AskHistory, R18_AskConversations, Ph18_AskHistory | ConversationList |
| 10 | Cited Markdown opens in Page view at the section; Source reachable; changed status | R18_AskCitePage, R18_AskCiteStates, Ph18_AskCite | SourceList R18 |
| 11 | Removed/revoked citation → disabled numbered placeholder, redacted | R18_AskCiteStates (unavailable), R18_AskConversations (no longer available), R18_AskRetryStates (target removed) | SourceList R18, SearchScope R18 |
| 12 | Retry only missing projects; new attempt; original kept; full refresh separate | R18_AskRetry, R18_AskRetryStates | SearchScope R18 |
| 13 (Ask side) | Ask About opens a scoped conversation, focuses composer, sends nothing | R18_AskAbout, R18_Ask1024, R18_AskPrefill | ConversationList |
| 15 | Retry sends at once, dedupes, rechecks scope, keeps draft; “Nothing to retry.” | R18_AskRetryStates, Ph18_AskRetry, R18_AskNarrow | SearchScope R18 |
| 16 (Overview side) | Ask in Overview prefills and waits; draft conflict | R18_AskPrefill, Ph18_AskDraft | ConversationList |
| 20 | 概要 | R18_AskStrings (“‹ 概要”, “概要 · すべてのプロジェクト”) | — |

#### Markup and ids (new)

- Head: `.pw-ask__head` › `h3#ov-ask-h` “Ask across projects” + **New** (`aria-label="New Conversation"`, `aria-keyshortcuts="Control+Alt+N"`) › `.pw-convo` › `button.pw-convo__btn#ask-convo[aria-haspopup=menu][aria-controls=ask-convo-menu][aria-label="Conversation: {title}"]` › `.pw-scope` (round 17).
- Menu: `div.pw-convo__pop[role=menu]#ask-convo-menu` › `button.pw-convo__new[role=menuitem]` + `div[role=group][aria-label="Conversations, newest first"]` › `button.pw-convo__item[role=menuitemradio][aria-checked]` › `.pw-convo__t`, `.pw-convo__m` (+ `.pw-convo__draft`).
- Notice: first child of `form.pw-ask__foot`: `div.pw-asknotice[role=group][aria-labelledby=ask-conflict-t]` › `p#ask-conflict-t` + `.pw-asknotice__actions` (Keep My Draft `.pw-btn--default`, Replace with New Question).
- Disabled Send: `button[disabled][aria-describedby=ask-send-off]` + `p.pw-help#ask-send-off`.
- Answer ⋯: `.pw-msg__label` › `span.pw-msg__more` › `button[aria-haspopup=menu][aria-label="More for this answer"]` + `.pw-menu[role=menu]` › `.pw-menu__item` “Ask All Projects Again”.
- Retry: in `p.pw-coverage--partial`, `button.pw-btn` “Retry Pong” → `[aria-disabled=true]` “Retrying Pong…” → `a.pw-link.pw-coverage__after[href="#retry-1"]` “Retried at 14:41 · below”; “Nothing to retry.” is `span.pw-coverage__after[role=status]`. Result: `article.pw-msg.pw-msg--retry#retry-1[aria-label="Retry · Pong, 14:41"]` with `.pw-msg__tag` “Retry · Pong”.
- Citations: `li.pw-sources__item[data-changed|data-deleted|data-unavailable]`; `span.pw-cite.pw-cite--off[role=img][aria-label="Source 3, unavailable"]`.
- Page view: `.pw-infobar` (‹ Overview · “Source 1 of 3 · Sync queue” · Page/Source `role=tablist`) › `p.pw-pagebanner[role=note]` › `article.pw-doc` › `section.pw-cited[aria-labelledby=pg-sync]` › `h2#pg-sync[tabindex=-1]` + `p#pg-cited` “Cited as source 1 · lines 12–40”.

#### Exact copy

All EN/JA in R18_AskStrings (and the cards' tables). Key lines: “New Conversation” 新しい会話 · “Conversation: {title}” · “Conversations · newest first” · “All projects (5)” · “Class Notes, Pong” · “Draft” 下書き · “Ask About Class Notes” Class Notes について質問 · placeholder “Ask about Class Notes” · “This conversation already has an unsent draft.” この会話には未送信の下書きがあります。 · “Keep My Draft” 下書きを残す · “Replace with New Question” 新しい質問に置き換える · “Searched 4 of 5 projects · Pong was catching up” · “Retry Pong” Pong で再試行 · “Retry 2 Projects” 2 件のプロジェクトで再試行 · “Retrying Pong…” · “Retry · Pong” · “Retried at 14:41 · below” · “Nothing to retry.” 再試行するものはありません。 · “Ask All Projects Again” · “Changed after this answer (2 days ago). You're reading the current file.” · “Show Source” · “Moved to docs/sync.md after this answer” · “No longer in Class Notes” · “Source unavailable” ソースは利用できません · “Sources · 3 · 1 unavailable”.

Proposed by B (not fixed by the lead, flagged for review): “Searching {n} of {m} projects”, “Added after this conversation started. Check it to search it here too.”, “Choose projects to search”, “None of this conversation's projects can be searched now. Choose projects, or start a New Conversation.”, “Retried at {time} · below”, “Searched 0 of 1 project · Pong is still catching up”, “Ask Again in 2 Projects / in Class Notes”, “asked again”, “Cited as source 1 · lines 12–40”, “The cited section isn't in the current file; showing the file from the top.”

#### States

Conversations: current / switched / new (all, stated) / reused empty / draft conflict / kept / replaced / project added later / project no longer available / none left. Retry: one / several / in flight / done / still missing / target revoked / nothing to retry / full refresh. Citations: Page view / Source view / changed / section gone / moved / deleted / unavailable. Round 17 states (searching, no matches, unavailable search, hand-off, >5 sources) unchanged.

#### Keyboard and focus

- Tab order: ‹ Back to Lists (1024) → New → conversation popup → scope → conversation (one stop) → per answer: ⋯, Sources (one stop), Retry → notice → Question → Send.
- ⌃⌥N anywhere in the Ask pane = New Conversation (inserts nothing in Question). Elsewhere ⌃⌥N is still New File (round 13); Overview has no project, so no clash. Return / ⌘Return in Question keep their send meaning; ⌘/Ctrl+Return (worker A's Open in New Window) is bound only to a focused Overview row, never the Ask pane.
- After New, switch, Ask About, Ask in Overview, Keep or Replace: focus in Question, caret at the end.
- Notice: focus on Keep My Draft; Escape = Keep.
- Retry: `aria-disabled` keeps focus on the button while in flight; on “Nothing to retry.” focus moves to the line.
- Page view: focus on the cited heading; ‹ Overview / ⌃⌥0 returns to the same conversation, scroll and Open button.
- Announcements (polite): see R18_AskNarrow. A live update in another window never moves focus or scroll.

#### Responsive

≥1100: 400 px pane, popup as wide as the head. 1024: Projects window hidden by default (worker A); Ask About presses “Ask Across Projects” and shows the pane full width. Phone: conversation button (44 px) + New on row 1, scope on row 2; Conversations sheet; notice buttons stacked 44 px; Retry button 44 px; Page view with Page/Source 44 px tabs and the banner under them. 320: titles truncate (full title in the accessible name); buttons wrap.

#### Superseded round 17 text (exact old → new)

- R17 notes Data: “One active conversation; New starts another, and old ones are not listed in this round.” → conversations are kept and listed newest first (ConversationList); each keeps its scope and draft.
- Pane head: “New” (button, unnamed) → “New” with accessible name “New Conversation”, ⌃⌥N; plus the conversation popup button.
- Interactions: “New starts an empty conversation scoped to all projects.” → kept, and stated on the button: “Searching all projects (5)”; Ask About/Ask in Overview reuse only an empty conversation.
- “Searched 4 of 5 projects · Pong is ready now” + **Ask Again** → “Searched 4 of 5 projects · Pong was catching up” + **Retry Pong** (sends at once; reply “Retry · Pong”).
- R17_AskStates note “When Pong catches up, the line becomes “Searched 4 of 5 projects · Pong is ready now” with Ask Again. Nothing re-asks by itself.” → Retry is offered immediately; nothing re-asks by itself still holds.
- “Searched 5 projects · 14:32 · 1 source changed since” + **Ask Again** → “Searched 5 projects · 14:32”; the source item says “changed after this answer”; full refresh = ⋯ › **Ask All Projects Again**.
- “changed since this answer” → “changed after this answer”.
- Open: “opens the file at that line in that project's Work … in Source view, the cited lines marked” → Markdown opens in **Page view** at the section; Source view via the bar's toggle; code unchanged.
- “Open {file} in {project} at line {n}” → “Open {file} in {project} at {section}” (Markdown).
- “The cited lines changed; showing the file from the top.” → banner “Changed after this answer ({ago}). You're reading the current file.” + Show Source; “The cited section isn't in the current file; showing the file from the top.” only when the section is gone.
- “{project} was removed from Pi WorkStation” (named, greyed) → “Source unavailable” (no name); head “Sources · 3 in 2 projects” → “Sources · 3 · 1 unavailable”.
- “Searched 5 projects · 14:32 · Kanji Cards was removed after this answer” → “Searched 4 projects · 14:32”.
- R17 walkthrough 5 “when Pong is ready the line offers “Ask Again”, which asks the same question once” → “Retry Pong” sends once, result “Retry · Pong”.
- R17 walkthrough 9 “the other shows the question and answer … with the same scope” → each window keeps its own current conversation; a conversation's messages, scope and draft are the same wherever it is shown.
- Round 17 open choices 1–6 (B) are decided by decisions 8–13, 15, 16.

#### Data contracts still missing (✱)

- ✱ Conversation list per person `{id, title, scope:{project_ids[], all_at_start}, updated_at, message_count, draft}`, newest first; reload-safe; current conversation per window.
- ✱ Draft store per conversation (text, updated_at) — see open issue 2.
- ✱ Conversation title generation.
- ✱ Answer coverage `{searched_ids[], missing:[{project_id, reason:"catching_up"|"failed"}], at}`; retry attempt `{id, parent_answer_id, target_ids[], state:"in_flight"|"done"|"none_authorized", coverage}`, idempotent per parent answer (one in flight; server-side dedupe across windows).
- ✱ Source `{n, project_id, path, heading, anchor, lines, source_hash, read_at}` plus a current-state resolver: `changed_at`, `moved_to`, `deleted`, `authorized` — evaluated at display time.
- ✱ Work route: `/{project}/work/{path}?view=page#{anchor}` with `return=/overview?conversation={id}&source={n}`.
- ✱ Prefill route into Overview: `{source:"ask_about"|"ask_in_overview", project_id?, text?}` — never auto-sent.

#### Privacy and redaction

- Names, paths, sections, lines, excerpts and counts are resolved against the person's current authorization every time they are drawn: in Sources, coverage lines, Retry targets, scope labels, the popup, conversation items and counts.
- Unauthorized projects leave labels and counts with no placeholder or “1 hidden”, except the Sources item, which keeps its number with “Source unavailable” so cite marks stay aligned (decision 11).
- Retry rechecks authorization at the click; with no target it sends nothing.
- Conversation history grants nothing: a listed conversation never re-exposes a revoked project's sources.
- No database words in UI (index, BM25, SQL, DuckDB, query, embedding).

#### Acceptance journeys (extended; Given/When/Then on R18_AskWalk)

1 Switch conversations · 2 New is always all projects · 3 Ask About with messages · 4 Ask About reuse · 5 Draft conflict keep · 6 Draft conflict replace · 7 Ask in Overview · 8 Retry one project (dedupe, draft preserved, original unchanged) · 9 Retry with a removed target · 10 Nothing to retry · 11 Full refresh · 12 Open in Page view and Source view · 13 Changed / moved / deleted · 14 Unavailable source (revocation) · 15 Reload (conversations, scopes, drafts, retry in flight) · 16 Two windows (own current conversation; one retry). Service failure and old receipts are worker A's and C's.

#### Existing vs Proposed

| Element | Existing | Proposed |
| --- | --- | --- |
| Ask pane, scope, Sources, coverage | Proposed in round 17 (not shipped) | Revised (round 18) |
| ConversationList (popup, draft notice) | — | New card |
| Retry and ⋯ › Ask All Projects Again | — | New |
| Work Page view (`pw-doc`), Source view (`pw-src`) | Existing views | Adds cited-section marking, banners, ‹ Overview |
| Overview rows' “Ask About {project}” | — | Worker A owns the row; drawn here as context |

#### Genuinely new open issues

1. **“All projects” and projects registered later.** Drawn: an existing conversation keeps the set it started with (“Searching 5 of 6 projects”), so scope never widens silently. Alternative: “all” stays live. Needs a product call.
2. **Where drafts live.** Per conversation, but device-local or synced? Two windows editing the same conversation's draft need a rule (drawn: last edit wins when the other window is not focused).
3. **Prose that names a now-unauthorized project.** Decision 11 keeps prose unchanged; when access is *revoked* (not removed by the person), the host may need to hide the whole answer instead. Drawn: prose kept, sources redacted.
4. **Full refresh in a narrowed conversation.** The fixed name “Ask All Projects Again” is wrong when the conversation searches 2 projects; drawn “Ask Again in 2 Projects / in Class Notes”.
5. **⌃⌥N overlap with New File.** Resolved by scope (Ask pane only); worker A's Menu should show New Conversation ⌃⌥N in Overview's File menu if wanted.

### C · Project conversation and per-message receipts

Generator `gen/r18c.py` (execs the pieces of `gen/r17c.py`, which execs `gen/r13.py`; injects `scripts/round17_*.css`, `round18_fix.css`, `round18_c.css`). Card previews: `gen/ds18c.py`. Layout `r18layout_c.json`. Check `r18check_c.py` (0 HTML problems, 0 undefined `pw-` classes in the 9 boards and the 3 card previews). Every board render-checked with `shot.py` (PNGs in `shots/`).

Boards (reading order):

| Board | Size |
| --- | --- |
| R18_ProjectScope | 1440×900 |
| R18_ContextReceipt | 1440×900 |
| R18_ContextStates | 1440×3720 |
| R18_ProjectScopeStates | 1440×1600 (includes the 320 px cell) |
| R18_Context1024 | 1024×900 |
| Ph18_ProjectScope | 390×844 |
| Ph18_ContextSheet | 390×844 |
| R18_ContextStrings | 1440×1340 |
| R18_ContextWalk | 1440×840 |

Cards: **ContextReceipt** (Round 18 section; preview rewritten), **ContextLine** (Round 18 section; Round 18 block appended to preview, height 1190), **Message** (Round 18 section; block appended, height 720). CSS `scripts/round18_c.css`: `.pw-context__scope`, `.pw-rcpt-sum` (+ `__scope`, `__part`, `__flag`), `.pw-receipt--inline`, `.pw-receipt__recorded`, `.pw-receipt__never`, `.pw-receipt__group--out`, `.pw-receipt__more`, `.pw-receipt__state--partial`. The lead should append round17_c and round18_c to bundle.css so previews render.

#### Decisions → boards and cards

| # | What C draws | Boards | Cards |
| --- | --- | --- | --- |
| 14 | A receipt for every submitted message, recorded at send; historical states (interrupted, unavailable, no longer available, changed); none for drafts | R18_ProjectScope, R18_ContextReceipt, R18_ContextStates, R18_ProjectScopeStates (draft), R18_Context1024, Ph18_ContextSheet, Walk 1, 4–7, 10, 11 | ContextReceipt, Message, ContextLine |
| 16 (project side) | Ask in Overview prefills, waits for Send; reuse/draft-conflict rule handed to B | R18_ProjectScope, R18_ProjectScopeStates, Ph18_ProjectScope, Walk 9 | Message |
| 17 | Compact counts in the summary; expanded Left out with authorized names and reasons | R18_ContextReceipt, R18_ContextStates, Walk 3 | ContextReceipt |
| 18 | 3 found rows + Show All {n} / Show Fewer, keyboard and phone | R18_ContextReceipt, R18_ContextStates (Show All pressed), Ph18_ContextSheet, Walk 2 | ContextReceipt |
| 19 | Notice only for an explicitly named, registered, authorized project; “Searched: Class Notes only” always in the summary and composer line | R18_ProjectScope, R18_ProjectScopeStates (Pong / no match / Tetris), Ph18_ProjectScope, Walk 8 | Message, ContextLine |
| 20 | 概要 in every JA string here | R18_ContextStrings, R18_ContextStates (JA) | Message |

#### Existing vs Proposed

| | Existing | Proposed round 17 | Proposed round 18 |
| --- | --- | --- | --- |
| Composer line | `Pi sees: … +N Why?` | `… ┊ 2 found Why?` | `… ┊ Searched: Class Notes only Why?` (+ “· search catching up” / “· no search”) |
| Composer Why? | “Why Pi sees these N files” | latest message's receipt | “What Pi will use when you send” (always files only; nothing recorded) |
| Receipt | — | one, from the composer | one per submitted message, from a summary under its answer, opened in place |
| Found | related mixed in | 3 + Show 2 More | 3 + Show All 4 / Show Fewer |
| Left out | — | “n more matches left out…” + Show | “Left out · n” with names and reasons |
| Changed | — | Ask Again | Ask Again with Current Files |
| Boundary notice | — | about another project | only when another project you can open is explicitly named |

#### Markup and ids

- Summary: `button.pw-rcpt-sum#receipt-<msg>-sum[aria-expanded][aria-controls=receipt-<msg>]` > `span.pw-rcpt-sum__scope` (“<b>Searched:</b> Class Notes only”), `span.pw-rcpt-sum__part` × n (“ · Pi used 3 always”, “ · 4 found”, “ · 2 left out”), `span.pw-rcpt-sum__flag` (“ · Interrupted”, “ · 1 changed”, “ · 1 file no longer available”). Last child of Pi's `article.pw-msg`, after `.pw-context--after`.
- Receipt: `section.pw-receipt.pw-receipt--inline#receipt-<msg>[role=region][aria-labelledby=receipt-<msg>-title]` > `h3#…-title[tabindex=-1]`, `p.pw-receipt__recorded`, `p.pw-receipt__scope`, `p.pw-help.pw-receipt__never`, optional `div.pw-receipt__state[role=status]` (`--stale` holds `button#…-again[aria-describedby=…-again-why]`, disabled with `…-busy`; `--partial` for interrupted), `section.pw-receipt__group--always`, `section.pw-receipt__group--found > ol#…-found > li[data-state=current|stale|gone]` + `p.pw-receipt__more > button#…-all[aria-expanded][aria-controls=…-found]`, `section.pw-receipt__group--out > ol > li` (`.pw-receipt__where`, `.pw-receipt__why`), `p.pw-receipt__after`, `p.pw-receipt__foot`. Phone: inside `psheet('What Pi used')`, no h3, `aria-label`.
- Composer line: `p.pw-context#chat-context` … `span.pw-context__sep`, `span.pw-context__scope#context-scope[data-search=ready|catching|unavailable]`, `button.pw-context__why[aria-haspopup=dialog][aria-controls=context-before-send]`. Popover `section.pw-receipt#context-before-send[role=dialog][aria-labelledby=cbs-title]`.
- Notice: `p.pw-notice[role=note]` > `button#ask-in-overview[aria-describedby=ask-in-overview-why]` + visible `span.pw-help#ask-in-overview-why`.

#### Copy (exact; full table on R18_ContextStrings)

| English | 日本語 |
| --- | --- |
| Searched: Class Notes only | 検索範囲: Class Notes のみ |
| Pi used {a} always · {f} found · {l} left out | 常に {a} · 検索 {f} · 除外 {l} |
| none found / Interrupted / search unavailable / 1 changed | 見つかりません / 中断 / 検索なし / 1 件変更 |
| What Pi used for this message / What Pi used (sheet) | このメッセージで Pi が使ったもの / Pi が使ったもの |
| Recorded when you sent this at {time}. Later changes are flagged, never rewritten. | {time} の送信時に記録しました。あとの変更は印で示し、書き換えません。 |
| Always with this request · {n} / Found for this question · {n} / Left out · {n} | このリクエストで常に · {n} / この質問で見つかったもの · {n} / 除外 · {n} |
| Left out to keep it short / Not searched: search was catching up | 短くするため除外 / 未検索: 検索を準備中でした |
| Show All {n} / Show Fewer | {n} 件すべて表示 / 表示を減らす |
| Interrupted: Pi stopped before reading the rest / The list shows what Pi had read when it stopped. | 中断: Pi は残りを読む前に停止しました / Pi が停止するまでに読んだものを表示しています。 |
| Search unavailable for this message / Pi used the files it always gets and the ones you named. | このメッセージでは検索を利用できませんでした / Pi は常に使うファイルと、あなたが名前を挙げたファイルを使いました。 |
| 1 file no longer available / It was deleted, or you can no longer open it, so its name is hidden. / File no longer available | 1 件のファイルは利用できなくなりました / 削除されたか、開けなくなったため、名前を表示しません。 / 利用できなくなったファイル |
| changed after Pi read it / {file} changed after Pi read it at {time}. The answer may be out of date. | Pi が読んだあとに変更されました / {file} は Pi が {time} に読んだあとに変更されました。回答が古いかもしれません。 |
| Ask Again with Current Files / Sends this message again with the files as they are now. This answer stays. / Pi is answering. Ask again when it’s done. | 現在のファイルでもう一度質問 / このメッセージを現在のファイルでもう一度送信します。この回答は残ります。 / Pi が回答中です。終わってからもう一度質問してください。 |
| What Pi will use when you send | 送信時に Pi が使うもの |
| Pi searched Class Notes only. To search every project, ask in Overview. | Pi が検索したのは Class Notes だけです。すべてのプロジェクトを検索するには、概要で質問してください。 |
| Ask in Overview / Opens Overview with your question in a conversation searching all projects. Nothing is sent until you press Send. | 概要で質問 / 概要を開き、すべてのプロジェクトを検索する会話に質問を入れます。送信を押すまで送られません。 |

#### States

Summary and receipt per state are tabulated in the ContextReceipt card (Found, Changed, Changed while Pi answers, Interrupted, Search unavailable, No longer available, Catching up at send, Draft). The changed and no-longer-available states are computed when the receipt opens. Everything else is the record made at send and is never recomputed. The boundary notice is recorded with the job, so it shows once and again after a reload, never added later.

#### Keyboard, focus, live

- The summary is a disclosure: Space/Return toggles, focus stays, several may be open. Show All keeps focus and flips to Show Fewer. The rows are inserted above it.
- Ask Again with Current Files: one request at a time. It is disabled with its reason while Pi works in this project. Pressing it sends at once, in the same conversation. The new answer comes at the end with its own summary; focus stays on the button. The old receipt is unchanged.
- Live updates (new messages from another window, a file going stale) never move focus or close an open receipt. The one polite announcement is “{file} changed after Pi read it.” while that receipt is open.
- Composer: Why? popover; Esc returns focus to Why?. Return/⌘Return keep their send meaning (A's ⌘/Ctrl+Return isn't bound here).
- Ask in Overview: moves to Overview with focus in its composer; nothing is sent.

#### Responsive

- ≥1100: the receipt is in place, up to 560 wide.
- 1024: the same (R18_Context1024). The composer line hides file names from the end; the scope and Why? never hide.
- 320: the summary wraps at each “·” and the scope stays whole. Rows stack; the notice button wraps to its own row.
- Phone: summary 44 px → sheet “What Pi used” (top 110); Show All and Ask in Overview are 44 px. Close returns focus to the summary.

#### Superseded round 17 text (old → new)

- “What Pi uses for this message” → “What Pi used for this message”. “What Pi uses” (sheet) → “What Pi used”.
- Composer line “2 found” / “none found” (`.pw-context__found#context-found`) → “Searched: Class Notes only” (`.pw-context__scope#context-scope`). The live “search catching up” / “no search” follow it after “·”.
- Why? `aria-controls="context-receipt"` opening the latest receipt → `aria-controls="context-before-send"` opening “What Pi will use when you send”.
- Receipt `role=dialog#context-receipt` popover → `role=region#receipt-<message>` in place under each answer.
- “2 more found” + “Show 2 More” → “Show All 4” / “Show Fewer”.
- “{n} more matches left out to keep it short” + “Show” (JA “短くするため、ほかに {n} 件を省きました。” + “表示”) → “Left out · {n}” with “Left out to keep it short” / “Not searched: search was catching up” (JA “除外 · {n}”, “短くするため除外”, “未検索: 検索を準備中でした”).
- “Ask Again” / aria-label “Ask Again with the changed files” (JA “もう一度質問”) → “Ask Again with Current Files” (JA “現在のファイルでもう一度質問”).
- “moved to Trash after Pi read it” + struck name + “…was moved to Trash after Pi read it. The answer may name a test that isn’t there now.” → row “File no longer available” + note “1 file no longer available” / “It was deleted, or you can no longer open it, so its name is hidden.”
- Receipt banners “Search is catching up after changes; Pi used the files it chose without search.” / “Search isn’t available right now; Pi used the files it chose without search. You can still send.” → Left out reason “Not searched: search was catching up” / “Search unavailable for this message” + “Pi used the files it always gets and the ones you named.”
- Boundary trigger “the message names another registered project or asks about something outside this one” → “the message explicitly names another registered project the person can open”.
- JA “Overview で質問” → “概要で質問”. “…Overview で質問してください。” → “…概要で質問してください。”
- “Opens Overview with your question in Ask across projects. Nothing is sent until you press Send.” → “Opens Overview with your question in a conversation searching all projects. Nothing is sent until you press Send.” (JA “Overview を開き、「プロジェクト横断で質問」に質問を入れます。…” → “概要を開き、すべてのプロジェクトを検索する会話に質問を入れます。送信を押すまで送られません。”).
- R17 Walk 1 “pressing “Why?” opens the dialog “What Pi uses for this message”” → pressing the answer's summary opens the region “What Pi used for this message”.

#### Data contracts still missing (✱)

- ✱ `context_receipt` per submitted job, write-once: `{recorded_at, scope{project_id}, search: ready|catching_up|unavailable, interrupted_at?, always[{path, reason, word?}], found[{doc_id, path, section, lines|truncated, read_at, revision, words[]}], left_out[{doc_id, path, section?, reason: budget|not_searched}], also_read[]}`. Partial lists are kept on interruption, and nothing is filled in afterwards.
- ✱ Read-time projection: per item, `availability: current|changed|gone`. For `gone`, the host strips path, section, lines, read_at and words before the response. Counts come from the record.
- ✱ `scope_notice: {project_id}` on the job, set only when the message explicitly names a registered project the sender can open at send time. The UI text never shows the name.
- ✱ Resend: `POST job {resend_of: job_id}`, deduplicated while one is in flight. It returns a new job with its own receipt.
- ✱ Ask in Overview handoff: a server-side prefill `{text, scope: all_authorized}` addressed to the Overview conversation, following B's reuse and draft-conflict rule. The question text never goes in a URL or log.
- No score, rank, query, index or engine field reaches the UI.

#### Privacy and redaction

- Project chat receipts list only files in this project. Left-out names are those the person can open now; a file removed or no longer authorized loses its name everywhere in old receipts (count kept, “File no longer available”).
- The boundary notice never names the other project and never appears for an unknown or unauthorized name, so a notice can't confirm that a project exists. The person's own message is not rewritten.
- No receipt or record exists for a draft. Receipts are never saved into the Second Brain.

#### Acceptance journeys (extending round 17 journeys 8 and 9)

Given/When/Then for each story with accessible names is on **R18_ContextWalk**:

1. Every message keeps its receipt (R18_ContextReceipt).
2. Three found rows, then Show All (R18_ContextStates, Ph18_ContextSheet).
3. Left out with names and reasons.
4. Changed after Pi read it → Ask Again with Current Files (incl. disabled while answering).
5. Interrupted.
6. Search unavailable then.
7. No longer available (source revocation).
8. Boundary only for a named project: Pong vs no match vs Tetris (R18_ProjectScopeStates; scope isolation).
9. Ask in Overview (draft preservation; B's boards).
10. No receipt for a draft (reload).
11. Two windows, reload, phone.

#### Genuinely new open issues

1. **Project names that are ordinary words.** A project called “Notes” or “Search” would make “explicitly names” fire on everyday questions. A rule is needed: for example, the match must be case-sensitive or quoted, or “the Notes project”. Product or harness choice.
2. **Phase for Ask Again with Current Files.** If the project's phase changed since the original message, the resend must use the current phase, because it never changes phase. Should the description then say so (“…in Discussion”)? Drawn: same phase only.
3. **Receipt lifetime.** Receipts live as long as their message. What happens to them when a conversation is cleared or compacted is not decided (decision 9 sets no retention policy).

#### Acceptance journeys added in round 18 (extend round 17's ten)

11. **Conversation history.** Given two dashboard conversations, one narrowed to Class Notes and Pong with an unsent draft, When I switch between them with the conversation popup and reload, Then each comes back with its own messages, scope and draft, and New Conversation starts with “Searching all projects (5)” (R18_AskHistory, R18_AskConversations, Ph18_AskHistory, R18_AskWalk 1–2, 15).
12. **Selective retry.** Given “Searched 4 of 5 projects · Pong was catching up”, When I press Retry Pong twice, Then one attempt is sent, the button reads “Retrying Pong…”, a reply “Retry · Pong” appears below with its own Sources and coverage, and the original answer and receipt are unchanged (R18_AskRetry, R18_AskRetryStates, R18_AskWalk 8).
13. **Draft preservation.** Given an empty conversation holding a draft, When I press Ask About Pong or Ask in Overview, Then “This conversation already has an unsent draft.” appears with Keep My Draft focused; Keep opens another new conversation with the prefill; nothing is sent; a retry never touches the composer (R18_AskPrefill, Ph18_AskDraft, R18_AskWalk 5–7).
14. **Scope isolation.** Given the Class Notes chat, When I ask about Pong by name, Then the notice “Pi searched Class Notes only. To search every project, ask in Overview.” appears; When I ask about a word with no match, or name a project I can't open, Then no notice appears; “Searched: Class Notes only” is always shown (R18_ProjectScopeStates, R18_ContextWalk 8).
15. **Source revocation.** Given an answer citing a Kanji Cards source, When Kanji Cards is removed or my access ends, Then that citation reads “Source unavailable” with its number, the heading “Sources · 3 · 1 unavailable”, its name leaves every scope and count, Retry no longer offers it, and “Nothing to retry.” is shown without sending when no target remains (R18_AskCiteStates, R18_AskRetryStates, R18_AskWalk 9–10, 14).
16. **Service failure.** Given Ollama stopped with 2 queued requests and 2 items needing me, Then the status button reads “Can't run work · Ollama stopped · 2 need you”, no row says Working, Idle or Ready, and the service item is first; When Ollama returns, Then “Ollama: running again” is announced once (R18_OverviewService, R18_OverviewStatus, Ph18_OverviewService, R18_OverviewWalk 1–2).
17. **Old receipts.** Given an earlier message whose search was interrupted and one of whose files was later moved to Trash, When I open its receipt, Then it shows what was recorded at send time (“Interrupted: Pi stopped before reading the rest”, “File no longer available” with no name) and nothing is recomputed; a draft has no receipt (R18_ContextStates, R18_ProjectScopeStates, R18_ContextWalk 1, 5–7, 10).
18. **Focus, windows, keyboard.** Given focus on a Needs you row, When a new item arrives or the focused one is answered elsewhere, Then focus stays or moves to the next item with one announcement; two windows keep their own Show filter; ⌘Return opens the focused row in a new window but never acts inside a composer; a blocked popup offers Open Here and Copy Link (R18_OverviewFocus, R18_OverviewWindows, R18_OverviewRowActions).

#### Validation (what ran)

HTML nesting and `pw-` class definitions checked on all 41 boards and every card preview (0 problems, 0 undefined classes, including the ContextMeter and VisualResult repairs); every board named in this section exists on the canvas; boards and previews were rendered and inspected; `tests.test_design_brand`, `tests.test_frontend` and `tests.test_web_robustness` pass. Not verifiable here: screen-reader output, real browser popup blocking and keyboard behavior, which need the built frontend.
