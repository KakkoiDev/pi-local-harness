# AppCode

Code collaboration: repositories with their files and history, issues to track work, and reviews of proposed changes with comments on lines.

| | |
| --- | --- |
| Group | Apps |
| Example product | Kiln (code collaboration) |
| Blocks | ArticleBody, AvatarGroup, Breadcrumbs, CodeDiff, CodeView, CommandPalette, Comments, ConfirmDialog, DataTable, DeleteAccount, EmptyState, FileTree, GlobalSearch, Invite, IssueDetail, IssueList, LabelsAssignees, ListSearch, Mentions, PullReview, Reactions, Roles, RunStatus, SettingsPage, StatusBadges, Tabs, Threads, Timeline |
| Packages | Web app (full stack). It stores repositories (git on the server) and is shared by a team. |
| Related | AppBoard (issues on a board), AppChat (notifications to a channel) |

## Screens

| Screen | Route | Blocks |
| --- | --- | --- |
| Repositories | `/` | ListSearch, DataTable, EmptyState |
| Code | `/{owner}/{repo}` | Tabs, FileTree, Breadcrumbs, CodeView, ArticleBody |
| File | `/{owner}/{repo}/blob/{ref}/{path}` | FileTree, Breadcrumbs, CodeView |
| History | `/{owner}/{repo}/commits` | Timeline, AvatarGroup, CodeDiff |
| Issues | `/{owner}/{repo}/issues` | Tabs, IssueList, ListSearch, LabelsAssignees |
| Issue | `/{owner}/{repo}/issues/{n}` | IssueDetail, Comments, Reactions, Mentions, LabelsAssignees |
| Reviews | `/{owner}/{repo}/reviews` | IssueList, StatusBadges |
| Review | `/{owner}/{repo}/reviews/{n}` | PullReview, CodeDiff, RunStatus, Threads, ConfirmDialog |
| Checks | `/{owner}/{repo}/checks` | RunStatus, StatusBadges, EmptyState |
| Search | `/search` | GlobalSearch, CommandPalette |
| Settings | `/{owner}/{repo}/settings` | SettingsPage, Invite, Roles, DeleteAccount |

## Navigation

- TopBar: the product name, GlobalSearch (`/` focuses it), Notifications, New (repository, issue), the person's menu.
- In a repository: Breadcrumbs owner / repo, then Tabs Code · Issues · Reviews · Settings with counts.
- Phone: the Tabs scroll horizontally; FileTree is a screen of its own (folder → folder → file); BottomBar Home · Search · Inbox · You.

## Journeys

The first word of each step is the screen; the blocks named are the cards to copy.

**Report a bug**

1. Issues: New Issue
2. Issue: IssueDetail title and description with a screenshot; LabelsAssignees bug, assign Mei
3. Issue: Comments; Mei replies with Mentions

**Review a change**

1. Reviews: IssueList of open reviews, open #12
2. Review: PullReview with CodeDiff by file; comment on a line (Threads)
3. Review: RunStatus shows the checks passed; Approve or Ask for Changes (ConfirmDialog for Merge, disabled while a check fails)

**Read the code**

1. Code: FileTree, open app/timetable.js
2. File: CodeView with line numbers; Shift-click 42 and 48 to copy a link to that range

## Phone

- Diffs switch to unified view (one column) and wrap long lines; line comments open as a sheet.
- IssueList rows show title, labels and number; comment counts are hidden.

## Data model

| Table | Fields |
| --- | --- |
| `repositories` | id, owner_id, name, description, private, default_branch, created_at |
| `issues` | id, repo_id, number, kind (issue · review), title, body, state (open · closed · merged), author_id, created_at, closed_at |
| `issue_labels` | issue_id, label_id · `labels`: id, repo_id, name, color |
| `assignees` | issue_id, user_id |
| `comments` | id, issue_id, author_id, body, path, line (null for general comments), created_at |
| `reviews` | id, issue_id, reviewer_id, verdict (approved · changes_asked · commented), at |

Files and history come from git on the server (`git ls-tree`, `git log`, `git diff`), not from the database.

## Capabilities and packages

Capabilities: **Log in and accounts**, **Sharing and roles**, **Database**, **File uploads** (screenshots in issues). Package: **Web app (full stack)**. Real-time updates are optional (**Multiplayer, real time** for live comments).

## Texts

App-level keys only; each block brings its own.

| Key | English | 日本語 |
| --- | --- | --- |
| `app.name` | Kiln | Kiln |
| `repo.code` | Code | コード |
| `repo.issues` | Issues | 課題 |
| `repo.reviews` | Reviews | レビュー |
| `repo.settings` | Settings | 設定 |
| `nav.new` | New | 新規作成 |
| `nav.inbox` | Inbox | 受信箱 |

## Adding to it

- Releases and a wiki are not covered: a wiki can reuse AppNotes. CI results are **RunStatus** (checks with passed/failed and their logs), on a review and on Checks.
- Files are read with **CodeView** (line numbers, wrap, line links); changes with CodeDiff; a README is ArticleBody.
