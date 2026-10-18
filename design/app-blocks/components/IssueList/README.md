# IssueList

The list of issues (or tasks, tickets, requests): open and closed tabs, search and filters by label, assignee and author, sorting, and one row per issue with its labels and counts.

| | |
| --- | --- |
| Group | Collaboration |
| Basecoat | `tabs`, `input-group`, `dropdown-menu`, `btn`, `badge`, `avatar-group`, `item-group` |
| Route | `/r/{repo}/issues?state=open&q=&label=&assignee=&sort=` (filters live in the address) |
| Needs | Web: `GET /r/{repo}/issues` (rows fragment, `hx-get` on change, `hx-push-url`). No server: `store.issues.list(filter)`. Blocks: ListSearch, LabelsAssignees, IssueDetail, EmptyState, InfiniteScroll |
| Used in | AppCode, AppBoard, AppCrm |

## Markup

```html
<section class="grid gap-3" aria-labelledby="issues-title">
  <div class="flex flex-wrap items-center gap-2">
    <h1 id="issues-title" class="mr-auto text-xl font-semibold" data-t="issues.title">Issues</h1>
    <a class="btn" href="/r/class-site/issues/new" data-t="issues.new">New Issue</a>
  </div>
  <form class="flex flex-wrap items-center gap-2" role="search" hx-get="/r/class-site/issues" hx-target="#issue-rows" hx-trigger="input changed delay:300ms, change" hx-push-url="true">
    <div class="input-group min-w-0 flex-1">
      <span data-align="inline-start" aria-hidden="true">⌕</span>
      <input type="search" name="q" value="is:open" aria-label="Search issues" data-t-label="issues.search">
    </div>
    <button class="btn" data-variant="outline" type="button" aria-haspopup="menu" data-t="issues.label">Label ▾</button>
    <button class="btn" data-variant="outline" type="button" aria-haspopup="menu" data-t="issues.assignee">Assignee ▾</button>
    <button class="btn" data-variant="outline" type="button" aria-haspopup="menu" data-t="issues.sort">Sort: Newest ▾</button>
  </form>
  <div class="overflow-hidden rounded-lg border">
    <nav class="flex gap-4 border-b bg-muted/40 px-4 py-2 text-sm" aria-label="Issue state">
      <a href="?state=open" aria-current="page" class="font-semibold"><span data-t="issues.open">Open</span> <span class="tabular-nums">12</span></a>
      <a href="?state=closed" class="text-muted-foreground"><span data-t="issues.closed">Closed</span> <span class="tabular-nums">48</span></a>
    </nav>
    <ul id="issue-rows" class="divide-y" aria-label="Open issues">
      <li class="grid grid-cols-[auto_1fr_auto] items-start gap-3 px-4 py-3 hover:bg-muted/40">
        <span class="mt-0.5 text-success" aria-label="Open" data-t-label="issues.open">◉</span>
        <div class="min-w-0">
          <a href="/r/class-site/issues/42" class="font-medium hover:underline">Timetable page shows Saturday twice</a>
          <span class="badge ml-1" data-variant="destructive">bug</span>
          <span class="badge" data-variant="outline">timetable</span>
          <p class="text-muted-foreground text-xs">#42 · <span data-t="issues.opened_by">opened 2 days ago by Kana Abe</span></p>
        </div>
        <div class="flex items-center gap-3 text-muted-foreground text-xs">
          <span class="avatar-group"><span class="avatar" data-size="sm"><span class="bg-muted">RS</span></span></span>
          <span aria-label="3 comments" data-t-label="issues.comments">💬 3</span>
        </div>
      </li>
    </ul>
  </div>
</section>
```

The filter buttons open `dropdown-menu`s of `menuitemcheckbox` items with a search field on top (labels, people); choosing one rewrites the search (`label:bug`, `assignee:ren`) so the text field always shows the whole filter.

## States

| State | What changes |
| --- | --- |
| Loading | 6 rows of `skeleton` (dot, title line, meta line). |
| Filtered | Above the list `issues.filtered` (“3 results for label:bug”) with a Clear Filters link. |
| No results | EmptyState: `issues.none_match` + Clear Filters. |
| No issues at all | EmptyState: `issues.empty` + New Issue. |
| Closed issue | The dot is `✓` (`text-muted-foreground`, label “Closed”), title `text-muted-foreground`. |
| Selected (bulk) | A checkbox column appears when one row is checked; a bar above: `issues.selected` with Close, Label, Assign. |
| Many | 25 per page with InfiniteScroll (or Previous/Next on web). |
| Error | ErrorRetry in place of the rows. |
| Closed issues | In the Closed tab each row’s meta line ends with `issues.closed_by` (“closed 2 days ago by Ren Sato”) in a `<span data-t="issues.closed_by">` instead of the opened line. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `issues.title` | Issues | 課題 |
| `issues.new` | New Issue | 新しい課題 |
| `issues.search` | Search issues | 課題を検索 |
| `issues.label` | Label | ラベル |
| `issues.assignee` | Assignee | 担当者 |
| `issues.author` | Author | 作成者 |
| `issues.sort` | Sort: {order} | 並び順：{order} |
| `issues.sort.newest` | Newest | 新しい順 |
| `issues.sort.oldest` | Oldest | 古い順 |
| `issues.sort.updated` | Recently updated | 更新順 |
| `issues.sort.comments` | Most comments | コメントが多い順 |
| `issues.open` | Open | 未完了 |
| `issues.closed` | Closed | 完了 |
| `issues.opened_by` | opened {when} by {name} | {when}に {name} さんが作成 |
| `issues.closed_by` | closed {when} by {name} | {when}に {name} さんが完了 |
| `issues.comments` | {count} comments | コメント {count} 件 |
| `issues.filtered` | {count} results for {query} | 「{query}」の結果 {count} 件 |
| `issues.clear` | Clear Filters | 絞り込みを解除 |
| `issues.none_match` | No issues match these filters. | 条件に合う課題はありません。 |
| `issues.empty` | No issues yet. Write one when something needs doing. | まだ課題はありません。やることができたら作成しましょう。 |
| `issues.selected` | {count} selected | {count} 件選択中 |

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
