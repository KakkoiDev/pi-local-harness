# AppAdmin

An admin dashboard for running an app: an overview of the numbers, then users, orders, reports and settings, each a list that opens a detail.

| | |
| --- | --- |
| Group | Apps |
| Example product | Back Office (the admin of any app: users, orders, metrics, settings) |
| Blocks | ActivityFeed, AvatarGroup, BarChart, ConfirmDialog, CsvImport, Dashboard, DataTable, DatePicker, DetailView, DonutChart, EditForm, ExportCsv, ForgotPassword, FunnelChart, Invite, KpiTile, LineChart, ListSearch, LogIn, Roles, SavedState, SettingsPage, SidePanel, StatusBadges, Tabs, Timeline, Toasts, TopBar |
| Packages | Web app (full stack). Admin data is private and shared by several staff, so it needs a server. |
| Related | AppShop (its admin uses this shell), AppCrm |

## Screens

| Screen | Route | Blocks |
| --- | --- | --- |
| Overview | `/admin` | SidePanel, TopBar, Dashboard, KpiTile, BarChart, DataTable |
| Users | `/admin/users` | DataTable, ListSearch, AvatarGroup, StatusBadges, ExportCsv, CsvImport |
| User | `/admin/users/{id}` | DetailView, Roles, ActivityFeed, ConfirmDialog |
| Orders | `/admin/orders` | DataTable, ListSearch, StatusBadges, ExportCsv |
| Order | `/admin/orders/{id}` | DetailView, Timeline, ConfirmDialog, Toasts |
| Reports | `/admin/reports` | LineChart, DonutChart, FunnelChart, DatePicker, ExportCsv |
| Staff | `/admin/staff` | Invite, Roles, DataTable |
| Settings | `/admin/settings` | SettingsPage, Tabs, EditForm, SavedState |
| Log in | `/admin/login` | LogIn, ForgotPassword |

## Navigation

- SidePanel on the desktop: Overview · Users · Orders · Reports · Staff · Settings, with a badge on Orders for the count that needs attention. The TopBar has the CommandPalette (⌘K / Ctrl+K: go to a user or an order by name or number), Notifications and the staff member's menu (Profile, Log Out).
- Phone: the TopBar's menu button opens the SidePanel as a sheet; the BottomBar keeps Overview · Users · Orders · More.
- Every list → detail keeps the list's filters in the address (`?status=paid&q=tanaka`), so Back returns to the same list.

## Journeys

The first word of each step is the screen; the blocks named are the cards to copy.

**Morning check**

1. Overview: Dashboard with KpiTile (sales, orders, users, needs attention)
2. Overview: the Needs attention tile opens Orders filtered to refunds
3. Order: DetailView, Approve Refund (ConfirmDialog), Toasts "Refund sent"

**Help a user**

1. Users: ListSearch for the email
2. User: DetailView, ActivityFeed shows the last log-ins
3. User: Roles to change Member → Viewer, or Suspend (ConfirmDialog)

**Add a staff member**

1. Staff: Invite by email with a role
2. Staff: the invite shows as Pending in the DataTable until accepted

**Bring users in**

1. Users: CsvImport from the old system (file → columns → check → import)
2. Users: the report lists added, updated and skipped rows; Download Skipped Rows to fix them

**Monthly report**

1. Reports: DatePicker range "Last month"
2. Reports: LineChart and FunnelChart; ExportCsv with the same range and the columns to keep

## Phone

- KpiTile in 2 columns; the chart cards are hidden below the tiles behind a "Charts" Tabs entry; DataTable drops secondary columns (customer, date) and keeps id, status, total.
- Detail pages stack: facts first, then actions in a row at the end of the page.

## Data model

| Table | Fields |
| --- | --- |
| `users` | id, email, name, role (owner · admin · member · viewer), status (active · invited · suspended), created_at, last_seen_at |
| `orders` | id, number, user_id, status, total_yen, placed_at (shared with the product's own tables) |
| `audit_log` | id, actor_id, action (e.g. "user.suspend"), target_type, target_id, details (JSON), at |
| `settings` | key, value (JSON), updated_by, updated_at |
| `metrics_daily` | day, sales_yen, orders, new_users (filled by a nightly job or computed on read) |

Every change made from the admin writes an `audit_log` row; ActivityFeed reads it.

## Capabilities and packages

Capabilities: **Log in and accounts**, **Sharing and roles**, **Database**, **Admin pages**, **Dashboard and charts**. Package: **Web app (full stack)**.

## Texts

App-level keys only; each block brings its own.

| Key | English | 日本語 |
| --- | --- | --- |
| `admin.title` | Back Office | バックオフィス |
| `nav.overview` | Overview | 概要 |
| `nav.users` | Users | ユーザー |
| `nav.orders` | Orders | 注文 |
| `nav.reports` | Reports | レポート |
| `nav.staff` | Staff | スタッフ |
| `nav.settings` | Settings | 設定 |
| `nav.more` | More | その他 |

## Adding to it

- A new admin section is one SidePanel entry, a DataTable page and a DetailView page; give it a `audit_log` action prefix.
- Every list that can leave the app uses **ExportCsv** (date range with DatePicker, the columns, UTF-8 with a BOM so Excel opens Japanese); every list that can come in uses **CsvImport**.
