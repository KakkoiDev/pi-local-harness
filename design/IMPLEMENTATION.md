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
