# AppCrm

App Block card (Apps). A CRM: contacts and companies, deals moving through a pipeline, the history of every call and email, and the follow-up tasks that keep deals moving.

- Example product: Ledgerline (a small-team CRM)
- Blocks: ActivityFeed, AvatarGroup, BarChart, Comments, CsvImport, DataTable, DatePicker, DetailView, DragList, EditForm, EmptyState, ExportCsv, FunnelChart, Invite, Kanban, KpiTile, LabelsAssignees, ListSearch, ProgressStatus, Roles, SettingsPage, SidePanel, StatusBadges, Timeline
- Packages: Web app (full stack). Shared by a sales team with roles.
- Related: AppAdmin (shell), AppBoard (the same board pattern)

## Screens
(Screen | Route | Blocks)
- Pipeline: `/deals` | SidePanel, Kanban, KpiTile, DragList
- Deal: `/deals/{id}` | DetailView, Timeline, Comments, LabelsAssignees
- Contacts: `/contacts` | DataTable, ListSearch, AvatarGroup, ExportCsv
- Contact: `/contacts/{id}` | DetailView, ActivityFeed, EditForm
- Companies: `/companies` | DataTable, ListSearch
- Tasks: `/tasks` | ListSearch, DatePicker, StatusBadges, EmptyState
- Reports: `/reports` | FunnelChart, BarChart, KpiTile, DatePicker
- Import: `/import` | CsvImport, ProgressStatus
- Settings: `/settings` | SettingsPage, Invite, Roles

## Navigation
- SidePanel: Pipeline · Contacts · Companies · Tasks (count due today) · Reports · Settings; CommandPalette (⌘K / Ctrl+K) finds any contact, company or deal.
- Phone: BottomBar Pipeline · Contacts · Tasks · More. The pipeline shows two stages at a time and scrolls sideways by stage (with ‹ › buttons).

## Journeys
The first word of each step is the screen; the blocks named are the cards to copy.

**Move a deal**

1. Pipeline: Kanban, drag "Lantern Salon" to Proposal sent (or its ⋯ → Move to…)
2. Deal: Timeline gets "Moved to Proposal sent · Kenji"; add a follow-up task with DatePicker

**Log a call**

1. Contact: ActivityFeed, Log a Call (EditForm: date, notes, next step)
2. Tasks: the next step appears as a task due on its date

**Import contacts**

1. Import: CsvImport file → match columns (氏名, Mail…) → check rows (same email updates the contact) → import
2. Import: the report; Download Skipped Rows

## Phone
- Deal and contact pages stack facts, then the timeline; Call and Email buttons use `tel:` and `mailto:` links shown as text too.
- Drag on the board has Move to… in each card's menu as the alternative.

## Data model
(Table | Fields)
- `companies`: id, name, website, industry, owner_id
- `contacts`: id, company_id, name, email, phone, title, owner_id, tags
- `deals`: id, company_id, contact_id, title, value_yen, stage (new · talking · proposal · won · lost), position, owner_id, expected_close, lost_reason
- `activities`: id, deal_id or contact_id, kind (call · email · meeting · note · stage_change), body, at, by
- `tasks`: id, title, due_on, done_at, assignee_id, deal_id, contact_id

## Capabilities and packages
Capabilities: **Log in and accounts**, **Sharing and roles**, **Database**, **Dashboard and charts**, **File uploads** (CSV import). Package: **Web app (full stack)**.

## Texts
App-level keys only; each block brings its own.

(Key | English | 日本語)
- `app.name`: Ledgerline | レジャーライン
- `nav.pipeline`: Pipeline | パイプライン
- `nav.contacts`: Contacts | 連絡先
- `nav.companies`: Companies | 会社
- `nav.tasks`: Tasks | タスク
- `nav.reports`: Reports | レポート
- `deal.stage.new`: New | 新規
- `deal.stage.talking`: Talking | 商談中
- `deal.stage.proposal`: Proposal sent | 提案済み
- `deal.stage.won`: Won | 受注
- `deal.stage.lost`: Lost | 失注

## Adding to it
- Email sync and calendar sync need a provider and are not covered; log emails by hand (Log an Email) first.
- Contacts come in with **CsvImport** and go out with **ExportCsv** (the same columns), as in AppShop and AppAdmin.

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Load a block’s card with the app_block tool and its exact name, one at a time: ActivityFeed, AvatarGroup, BarChart, Comments, CsvImport, DataTable, DatePicker, DetailView, DragList, EditForm, EmptyState, ExportCsv, FunnelChart, Invite, Kanban, KpiTile, LabelsAssignees, ListSearch, ProgressStatus, Roles, SettingsPage, SidePanel, StatusBadges, Timeline.
- Set up: `python3 {harness}/kit/blocks/add.py <project> AppCrm` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
