# IssueList

App Block card (Collaboration). The list of issues (or tasks, tickets, requests): open and closed tabs, search and filters by label, assignee and author, sorting, and one row per issue with its labels and counts.

- Basecoat: `tabs`, `input-group`, `dropdown-menu`, `btn`, `badge`, `avatar-group`, `item-group`
- Route: `/r/{repo}/issues?state=open&q=&label=&assignee=&sort=` (filters live in the address)
- Needs: Web: `GET /r/{repo}/issues` (rows fragment, `hx-get` on change, `hx-push-url`). No server: `store.issues.list(filter)`. Blocks: ListSearch, LabelsAssignees, IssueDetail, EmptyState, InfiniteScroll
- Used in: AppCode, AppBoard, AppCrm

## Markup
Copy, never retype: `{harness}/kit/blocks/collaboration/IssueList.html` (36 lines of HTML).

The filter buttons open `dropdown-menu`s of `menuitemcheckbox` items with a search field on top (labels, people); choosing one rewrites the search (`label:bug`, `assignee:ren`) so the text field always shows the whole filter.

## States
- Loading: 6 rows of `skeleton` (dot, title line, meta line).
- Filtered: Above the list `issues.filtered` (“3 results for label:bug”) with a Clear Filters link.
- No results: EmptyState: `issues.none_match` + Clear Filters.
- No issues at all: EmptyState: `issues.empty` + New Issue.
- Closed issue: The dot is `✓` (`text-purple-700 dark:text-purple-400`, label “Closed”), title `text-muted-foreground`.
- Selected (bulk): A checkbox column appears when one row is checked; a bar above: `issues.selected` with Close, Label, Assign.
- Many: 25 per page with InfiniteScroll (or Previous/Next on web).
- Error: ErrorRetry in place of the rows.

## Texts
(Key | English | 日本語)
- `issues.title`: Issues | 課題
- `issues.new`: New Issue | 新しい課題
- `issues.search`: Search issues | 課題を検索
- `issues.label`: Label | ラベル
- `issues.assignee`: Assignee | 担当者
- `issues.author`: Author | 作成者
- `issues.sort`: Sort: {order} | 並び順：{order}
- `issues.sort.newest`: Newest | 新しい順
- `issues.sort.oldest`: Oldest | 古い順
- `issues.sort.updated`: Recently updated | 更新順
- `issues.sort.comments`: Most comments | コメントが多い順
- `issues.open`: Open | 未完了
- `issues.closed`: Closed | 完了
- `issues.opened_by`: opened {when} by {name} | {when}に {name} さんが作成
- `issues.closed_by`: closed {when} by {name} | {when}に {name} さんが完了
- `issues.comments`: {count} comments | コメント {count} 件
- `issues.filtered`: {count} results for {query} | 「{query}」の結果 {count} 件
- `issues.clear`: Clear Filters | 絞り込みを解除
- `issues.none_match`: No issues match these filters. | 条件に合う課題はありません。
- `issues.empty`: No issues yet. Write one when something needs doing. | まだ課題はありません。やることができたら作成しましょう。
- `issues.selected`: {count} selected | {count} 件選択中

## Keyboard and focus
1. New Issue → 2. Search → 3. Label → 4. Assignee → 5. Sort → 6. Open / Closed → 7. each issue link in order.
- `/` focuses search; `j` / `k` move between rows, `o` or Return opens, `x` selects (ShortcutHelp).
- After a filter changes, focus stays where it was; the result count is announced (`role="status"` on the filtered line).

## Phone
- Search field on its own line; the three filter buttons become one Filters button opening a sheet with the three groups.
- Rows: title and labels wrap; the avatar and comment count move under the title. Each row is one link (44 px+).
- New Issue becomes a `+` icon button in the top bar.

## Data
```json
{"total": {"open": 12, "closed": 48}, "query": "is:open label:bug",
 "issues": [{"number": 42, "title": "Timetable page shows Saturday twice", "state": "open",
   "labels": [{"name": "bug", "color": "destructive"}, {"name": "timetable", "color": "outline"}],
   "author": "Kana Abe", "assignees": ["Ren Sato"], "comments": 3, "created_at": "2026-10-16T14:20:00+09:00"}]}
```

- Web: `GET /r/class-site/issues?state=open&q=label:bug` → rows fragment; the page reads the same query on full load.
- No server: `store.issues.list({state, labels, assignee, text, sort})`.

## Don't
- Don't keep filters only in memory: they belong in the address so a filtered list can be shared.
- Don't colour labels with invented hex values; labels use `badge` variants or a `chart-1…5` colour (LabelsAssignees).
- Don't show relative times without the full date in `title`.

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> IssueList` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
