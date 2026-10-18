# AppNotes

A notes and wiki app: pages made of blocks, nested in a page tree, shared with people who can view or edit, searchable from anywhere.

| | |
| --- | --- |
| Group | Apps |
| Example product | Kumo Pages (notes and a team wiki) |
| Blocks | AccountSettings, ActivityFeed, BlockEditor, Breadcrumbs, CodeDiff, CommandPalette, Comments, ConfirmDialog, DataTable, DatabaseView, DeleteUndo, EmptyState, GlobalSearch, Invite, ListSearch, LogIn, Mentions, Onboarding, PageTree, Presence, Reactions, Roles, SavedState, SettingsPage, SidePanel, SignUp, Timeline |
| Packages | Web app (full stack) for teams; App with no server (frontend only) for one person on one device, with Works offline. |
| Related | AppChat (mentions and links between them), AppCourse (lessons are pages) |

## Screens

| Screen | Route | Blocks |
| --- | --- | --- |
| Page | `/p/{id}` | SidePanel, PageTree, BlockEditor, Breadcrumbs, Presence, SavedState |
| Home | `/` | PageTree, ListSearch, ActivityFeed, EmptyState |
| Search | `/search` | GlobalSearch, CommandPalette |
| Share | `(dialog on a page)` | Invite, Roles, ConfirmDialog |
| Comments | `(side panel on a page)` | Comments, Mentions, Reactions |
| History | `/p/{id}/history` | Timeline, CodeDiff, ConfirmDialog |
| Database | `/p/{id}?view=table` | SidePanel, DatabaseView, Breadcrumbs, SavedState |
| Trash | `/trash` | DataTable, DeleteUndo, EmptyState |
| Settings | `/settings` | SettingsPage, AccountSettings, Roles |
| Sign in | `/login` | LogIn, SignUp, Onboarding |

## Navigation

- SidePanel with the workspace name, Search (opens CommandPalette, ⌘K / Ctrl+K), Home, the PageTree (Favourites, then all pages), Trash and Settings. New Page at the bottom of the panel.
- On a page: Breadcrumbs of its parents, Presence avatars, Share, Comments, and a ⋯ menu (History, Move, Copy Link, Delete).
- Phone: the SidePanel becomes a full-screen page tree reached from the TopBar's back/menu button; the page itself is the main screen. BottomBar: Home · Search · New · Inbox.

## Journeys

The first word of each step is the screen; the blocks named are the cards to copy.

**Write a page**

1. Page: New Page in the PageTree, type a title
2. Page: BlockEditor, "/" opens the block menu (heading, list, to-do, quote, image, code)
3. Page: SavedState "Saved" after each pause; Presence shows who else is here

**Share it**

1. Share: Invite by email, Roles Can view / Can edit
2. Share: Copy Link; Toasts "Link copied"

**Discuss a line**

1. Comments: select text, Comment, Mentions @Mei
2. Comments: Mei gets a Notifications entry and replies

**Track projects**

1. Page: New Page → Database; the properties are Status, Owner, Due
2. Database: DatabaseView as a table, switch to the board view by Status, open a row as its page

**Find something**

1. Search: CommandPalette ⌘K, type "holiday"
2. Page: open the result, Breadcrumbs show where it lives

## Phone

- The page is full width with 16 px sides; the block menu opens as a bottom sheet; drag to reorder blocks has Move Up / Move Down in each block's ⋯ menu.
- The PageTree is its own screen; Presence shows 2 avatars + "+3".

## Data model

| Table | Fields |
| --- | --- |
| `pages` | id, workspace_id, parent_id, title, icon, position, created_by, updated_at, deleted_at |
| `blocks` | id, page_id, parent_block_id, type (paragraph · heading · todo · bullet · number · quote · code · image · divider · page_link), content (JSON), position |
| `page_access` | page_id, user_id or email, role (viewer · editor · owner), inherited (bool) |
| `revisions` | id, page_id, author_id, snapshot (JSON), at |
| `comments` | id, page_id, block_id, author_id, body, resolved, created_at |

Edits are saved per block (debounced 800 ms); a revision is kept every 10 minutes of editing.

## Capabilities and packages

Capabilities: **Log in and accounts**, **Sharing and roles**, **Database**, **Multiplayer, real time** (presence and live edits), **File uploads** (images). One-person version: **Works offline**, **Installs on a phone**, no accounts. Packages: **Web app (full stack)**; **App with no server** for the one-person version.

## Texts

App-level keys only; each block brings its own.

| Key | English | 日本語 |
| --- | --- | --- |
| `app.name` | Kumo Pages | くもページ |
| `nav.home` | Home | ホーム |
| `nav.search` | Search | 検索 |
| `nav.new_page` | New Page | 新しいページ |
| `nav.trash` | Trash | ゴミ箱 |
| `nav.settings` | Settings | 設定 |
| `page.share` | Share | 共有 |
| `page.history` | History | 履歴 |

## Adding to it

- A new block type is a BlockEditor entry: its "/" menu item, its JSON `content` shape, its render and its Markdown export.
- Pages with properties are shown with **DatabaseView** (table, board and list views over the same pages); a new view kind is one more view in its switcher.
