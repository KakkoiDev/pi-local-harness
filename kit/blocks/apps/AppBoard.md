# AppBoard

App Block card (Apps). A kanban project board: boards with columns, cards that move across them, card details with checklists, labels, due dates and comments, shared with a team.

- Example product: Pinwheel (a kanban project board)
- Blocks: AvatarGroup, ComboboxField, Comments, DataTable, DatePicker, DeleteUndo, DetailView, DocEditor, DragList, EmptyState, InstallApp, Invite, Kanban, LabelsAssignees, ListSearch, Presence, ProductGrid, Roles, SettingsPage, TopBar
- Packages: App with no server (frontend only) with Works offline for one person; Web app (full stack) with Multiplayer, real time for a team.
- Related: AppCrm (the same board for deals), AppCode (issues on a board)

## Screens
(Screen | Route | Blocks)
- Boards: `/` | ProductGrid, ListSearch, EmptyState
- Board: `/b/{id}` | TopBar, Kanban, DragList, Presence, LabelsAssignees
- Card: `(dialog on a board)` | DetailView, DocEditor, DatePicker, Comments, LabelsAssignees
- Filter: `(popover on a board)` | ListSearch, LabelsAssignees, ComboboxField
- Members: `/b/{id}/members` | Invite, Roles, AvatarGroup
- Archive: `/b/{id}/archive` | DataTable, DeleteUndo, EmptyState
- Settings: `/settings` | SettingsPage, InstallApp

## Navigation
- TopBar on a board: board name (rename in place), Filter, Presence, Share, ⋯ (Archive, Settings). No SidePanel: boards are chosen on the Boards screen or with CommandPalette (⌘K / Ctrl+K).
- Phone: one column at a time, chosen with Tabs (To do · Doing · Done) above the cards; BottomBar Boards · Search · Me.

## Journeys
The first word of each step is the screen; the blocks named are the cards to copy.

**Plan the week**

1. Boards: New Board from a template (To do · Doing · Done)
2. Board: Add Card in To do; drag to order (DragList)
3. Card: DatePicker due date, LabelsAssignees, a checklist in DocEditor

**Move work**

1. Board: drag a card to Doing, or its ⋯ → Move to Doing
2. Board: Presence shows Kenji watching; his moves appear live

**Clean up**

1. Board: Archive Done cards
2. Archive: DataTable; Restore or Delete (DeleteUndo)

## Phone
- Tabs pick the column; each card is a 44 px+ row; Move to… in the card's menu replaces drag; the card opens full screen.

## Data model
(Table / collection | Fields)
- `boards`: id, name, owner_id, created_at
- `columns`: id, board_id, name, position, wip_limit
- `cards`: id, column_id, title, body (Markdown with `- [ ]` checklist), due_on, position, archived_at
- `card_labels` · `card_members`: card_id, label_id · card_id, user_id
- `comments`: id, card_id, author_id, body, created_at

Positions are fractional (a card dropped between 1 and 2 gets 1.5) so a move writes one row. No-server: the same shapes in IndexedDB.

## Capabilities and packages
Capabilities: **Works offline**, **Installs on a phone** (one person); **Log in and accounts**, **Sharing and roles**, **Database**, **Multiplayer, real time** (a team). Packages: **App with no server**; **Web app (full stack)**.

## Texts
App-level keys only; each block brings its own.

(Key | English | 日本語)
- `app.name`: Pinwheel | ピンホイール
- `nav.boards`: Boards | ボード
- `nav.search`: Search | 検索
- `nav.me`: Me | 自分
- `board.new`: New Board | 新しいボード
- `board.add_card`: Add Card | カードを追加
- `board.add_column`: Add Column | 列を追加
- `board.filter`: Filter | 絞り込み

## Adding to it
- Timelines and calendars of cards reuse Timeline and Agenda over `cards.due_on`.
- **Proposed block: WipLimit** (a column header warning when a column holds more than its limit) if teams ask for it; until then show the count in StatusBadges.

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Load a block’s card with the app_block tool and its exact name, one at a time: AvatarGroup, ComboboxField, Comments, DataTable, DatePicker, DeleteUndo, DetailView, DocEditor, DragList, EmptyState, InstallApp, Invite, Kanban, LabelsAssignees, ListSearch, Presence, ProductGrid, Roles, SettingsPage, TopBar.
- Set up: `python3 {harness}/kit/blocks/add.py <project> AppBoard` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
