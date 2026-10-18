# ActivityFeed

What everyone did in a project, newest first and grouped by day: who did what to which thing, with a filter by person or kind.

| | |
| --- | --- |
| Group | Sharing and people |
| Basecoat | `avatar`, `badge`, `select` (native), `btn`, `empty`, `skeleton` |
| Route | `/projects/{id}/activity` (or a side column on a dashboard) |
| Needs | Web: `GET /projects/{id}/activity?who=&kind=&before=`. No server: `store.activity()` (only this device's own actions). Every change in the app writes one activity record. |
| Links to | Notifications (only what concerns me), Presence (live), InfiniteScroll, Timeline (a single record's history), DetailView, AppAdmin, AppCode, AppBoard |

## Markup

```html
<section class="app grid gap-4 p-4 @3xl:p-8" aria-labelledby="activity-title">
  <header class="flex flex-wrap items-end justify-between gap-3">
    <h1 id="activity-title" class="text-xl font-semibold @3xl:text-2xl" data-t="activity.title">Activity</h1>
    <form class="flex flex-wrap gap-2" hx-get="/projects/12/activity" hx-trigger="change" hx-target="#activity-list" hx-push-url="true">
      <label class="sr-only" for="activity-who" data-t="activity.filter_who">Person</label>
      <select class="select w-40" id="activity-who" name="who">
        <option value="" data-t="activity.everyone">Everyone</option>
        <option value="3">Aiko Kato</option>
      </select>
      <label class="sr-only" for="activity-kind" data-t="activity.filter_kind">Kind</label>
      <select class="select w-40" id="activity-kind" name="kind">
        <option value="" data-t="activity.all_kinds">All changes</option>
        <option value="created" data-t="activity.kind.created">Created</option>
        <option value="edited" data-t="activity.kind.edited">Edited</option>
        <option value="commented" data-t="activity.kind.commented">Commented</option>
        <option value="moved" data-t="activity.kind.moved">Moved</option>
        <option value="deleted" data-t="activity.kind.deleted">Deleted</option>
        <option value="members" data-t="activity.kind.members">Members</option>
      </select>
    </form>
  </header>

  <div id="activity-list" class="grid gap-6">
    <section aria-labelledby="day-2026-10-18">
      <h2 id="day-2026-10-18" class="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide" data-t="activity.today">Today</h2>
      <ol class="relative grid gap-4 border-l pl-6">
        <li class="relative">
          <span class="avatar absolute -left-[2.45rem] top-0 ring-4 ring-background" data-size="sm"><span>RS</span></span>
          <p class="text-sm" data-t-line="activity.line.moved"><span class="font-medium">Ren Sato</span> <span>moved</span> <a class="font-medium underline-offset-4 hover:underline" href="/cards/17">Poster layout</a> <span>to</span> <span class="badge" data-variant="secondary">Done</span></p>
          <p class="text-muted-foreground text-xs"><time datetime="2026-10-18T10:02+09:00">10:02</time></p>
        </li>
        <li class="relative">
          <span class="avatar absolute -left-[2.45rem] top-0 ring-4 ring-background" data-size="sm"><span>AK</span></span>
          <p class="text-sm" data-t-line="activity.line.edited"><span class="font-medium">Aiko Kato</span> <span>edited</span> <a class="font-medium underline-offset-4 hover:underline" href="/notes/42">Week 3 · Vocabulary</a></p>
          <p class="text-muted-foreground text-xs"><time datetime="2026-10-18T09:41+09:00">09:41</time> · <span data-t="activity.changes">3 changes</span></p>
        </li>
      </ol>
    </section>
  </div>
  <button class="btn justify-self-center" data-variant="outline" type="button" hx-get="/projects/12/activity?before=8812" hx-target="#activity-list" hx-swap="beforeend" data-t="activity.older">Show Older</button>
</section>
```

Consecutive edits by the same person to the same thing within 10 minutes are one line (“3 changes”). Deleted things keep their name without a link (`line-through` is not used; add `activity.deleted_thing` “(deleted)”).

## States

| State | What changes |
| --- | --- |
| Feed (default) | Grouped by day (Today, Yesterday, then dates); times in the person's time zone. |
| Filtered | The selects show the filter; the URL has `?who=&kind=`; an empty result shows `activity.empty_filtered` with **Clear Filters**. |
| Empty project | EmptyState: `activity.empty.title`, `activity.empty.body`. |
| Loading | Four rows of `skeleton` (an `size-6 rounded-full` and a `h-4 w-2/3`). |
| Loading older | Show Older `disabled aria-busy="true"`, text `activity.loading`; when there is nothing older it's replaced by `activity.start` (“This is where the project started.”). |
| Error | ErrorRetry inside the list: `activity.error`, **Try Again**. |
| Live (with Presence) | New entries are added at the top of Today with a short highlight; a polite live region announces one summary per minute at most. |
| Viewer role | Same feed; links to things they can see. Activity on things they can't see is left out. |
| Thing renamed | The line shows the name at the time and links to the current one. |
| Other kinds of event | `activity.line.created`, `activity.line.commented`, `activity.line.deleted`, `activity.line.joined` fill the same `<p data-t-line>` as the two in Markup, chosen by the event’s kind. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `activity.title` | Activity | アクティビティ |
| `activity.filter_who` | Person | メンバー |
| `activity.filter_kind` | Kind | 種類 |
| `activity.everyone` | Everyone | 全員 |
| `activity.all_kinds` | All changes | すべての変更 |
| `activity.kind.created` | Created | 作成 |
| `activity.kind.edited` | Edited | 編集 |
| `activity.kind.commented` | Commented | コメント |
| `activity.kind.moved` | Moved | 移動 |
| `activity.kind.deleted` | Deleted | 削除 |
| `activity.kind.members` | Members | メンバー |
| `activity.line.created` | {name} created {thing} | {name} さんが {thing} を作成しました |
| `activity.line.edited` | {name} edited {thing} | {name} さんが {thing} を編集しました |
| `activity.line.commented` | {name} commented on {thing} | {name} さんが {thing} にコメントしました |
| `activity.line.moved` | {name} moved {thing} to {place} | {name} さんが {thing} を {place} に移動しました |
| `activity.line.deleted` | {name} deleted {thing} | {name} さんが {thing} を削除しました |
| `activity.line.joined` | {name} joined as {role} | {name} さんが{role}として参加しました |
| `activity.changes` | {count} changes | {count} 件の変更 |
| `activity.deleted_thing` | (deleted) | （削除済み） |
| `activity.today` | Today | 今日 |
| `activity.yesterday` | Yesterday | 昨日 |
| `activity.older` | Show Older | 以前のアクティビティを表示 |
| `activity.loading` | Loading… | 読み込み中… |
| `activity.start` | This is where the project started. | ここからプロジェクトが始まりました。 |
| `activity.empty.title` | Nothing has happened yet | まだアクティビティはありません |
| `activity.empty.body` | Changes by everyone in the project show up here. | プロジェクトのメンバー全員の変更がここに表示されます。 |
| `activity.empty_filtered` | No activity matches these filters. | 条件に合うアクティビティはありません。 |
| `activity.clear` | Clear Filters | 条件をクリア |
| `activity.error` | Activity couldn’t load. Try again. | アクティビティを読み込めませんでした。もう一度お試しください。 |

The whole line is one message (`activity.line.*`) with `{name}`, `{thing}`, `{place}` filled in as elements, so Japanese word order works. The `<p data-t-line=…>` in the Markup is that message rendered in English: the template fills the message, wrapping `{name}` in `span.font-medium`, `{thing}` in the link and `{place}` in the badge (web: a `line()` helper in Jinja; no server: the same in `i18n.mjs`). `data-line` only records which message it is.

## Keyboard and focus

1. Person → 2. Kind → 3. each link in the feed, in order → 4. Show Older.
- After Show Older, focus moves to the first newly loaded line's link.
- Changing a filter keeps focus on that select.

## Phone

- Filters stack under the title, each full width (`w-full` under `@max-3xl:`).
- The left line and avatars stay; text wraps under the name.
- Show Older is full width; no infinite scroll by default (InfiniteScroll may replace the button).

## Data

```json
{"items": [{"id": 8813, "at": "2026-10-18T10:02:00+09:00", "actor": {"id": 5, "name": "Ren Sato", "initials": "RS"},
            "kind": "moved", "thing": {"type": "card", "id": 17, "name": "Poster layout", "href": "/cards/17", "deleted": false},
            "place": {"name": "Done"}, "count": 1}],
 "before": 8812, "has_more": true}
```

- Web: the server writes one row in `activity` (id, project_id, actor_id, kind, thing_type, thing_id, thing_name, data JSON, at) inside the same transaction as the change; `GET …/activity` returns `#activity-list`'s fragment.
- No server: the store appends to an `activity` collection on every write.

## Don't

- Don't show field-by-field diffs here (that's Timeline / CodeDiff).
- Don't mix in my notifications (read state belongs to Notifications).
- Don't log reads or page views.
