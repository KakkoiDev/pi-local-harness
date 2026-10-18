# ActivityFeed

App Block card (Sharing and people). What everyone did in a project, newest first and grouped by day: who did what to which thing, with a filter by person or kind.

- Basecoat: `avatar`, `badge`, `select` (native), `btn`, `empty`, `skeleton`
- Route: `/projects/{id}/activity` (or a side column on a dashboard)
- Needs: Web: `GET /projects/{id}/activity?who=&kind=&before=`. No server: `store.activity()` (only this device's own actions). Every change in the app writes one activity record.
- Links to: Notifications (only what concerns me), Presence (live), InfiniteScroll, Timeline (a single record's history), DetailView, AppAdmin, AppCode, AppBoard

## Markup
Copy, never retype: `{harness}/kit/blocks/people/ActivityFeed.html` (41 lines of HTML).

Consecutive edits by the same person to the same thing within 10 minutes are one line (“3 changes”). Deleted things keep their name without a link (`line-through` is not used; add `activity.deleted_thing` “(deleted)”).

## States
- Feed (default): Grouped by day (Today, Yesterday, then dates); times in the person's time zone.
- Filtered: The selects show the filter; the URL has `?who=&kind=`; an empty result shows `activity.empty_filtered` with **Clear Filters**.
- Empty project: EmptyState: `activity.empty.title`, `activity.empty.body`.
- Loading: Four rows of `skeleton` (an `size-6 rounded-full` and a `h-4 w-2/3`).
- Loading older: Show Older `disabled aria-busy="true"`, text `activity.loading`; when there is nothing older it's replaced by `activity.start` (“This is where the project started.”).
- Error: ErrorRetry inside the list: `activity.error`, **Try Again**.
- Live (with Presence): New entries are added at the top of Today with a short highlight; a polite live region announces one summary per minute at most.
- Viewer role: Same feed; links to things they can see. Activity on things they can't see is left out.
- Thing renamed: The line shows the name at the time and links to the current one.

## Texts
(Key | English | 日本語)
- `activity.title`: Activity | アクティビティ
- `activity.filter_who`: Person | メンバー
- `activity.filter_kind`: Kind | 種類
- `activity.everyone`: Everyone | 全員
- `activity.all_kinds`: All changes | すべての変更
- `activity.kind.created`: Created | 作成
- `activity.kind.edited`: Edited | 編集
- `activity.kind.commented`: Commented | コメント
- `activity.kind.moved`: Moved | 移動
- `activity.kind.deleted`: Deleted | 削除
- `activity.kind.members`: Members | メンバー
- `activity.line.created`: {name} created {thing} | {name} さんが {thing} を作成しました
- `activity.line.edited`: {name} edited {thing} | {name} さんが {thing} を編集しました
- `activity.line.commented`: {name} commented on {thing} | {name} さんが {thing} にコメントしました
- `activity.line.moved`: {name} moved {thing} to {place} | {name} さんが {thing} を {place} に移動しました
- `activity.line.deleted`: {name} deleted {thing} | {name} さんが {thing} を削除しました
- `activity.line.joined`: {name} joined as {role} | {name} さんが{role}として参加しました
- `activity.changes`: {count} changes | {count} 件の変更
- `activity.deleted_thing`: (deleted) | （削除済み）
- `activity.today`: Today | 今日
- `activity.yesterday`: Yesterday | 昨日
- `activity.older`: Show Older | 以前のアクティビティを表示
- `activity.loading`: Loading… | 読み込み中…
- `activity.start`: This is where the project started. | ここからプロジェクトが始まりました。
- `activity.empty.title`: Nothing has happened yet | まだアクティビティはありません
- `activity.empty.body`: Changes by everyone in the project show up here. | プロジェクトのメンバー全員の変更がここに表示されます。
- `activity.empty_filtered`: No activity matches these filters. | 条件に合うアクティビティはありません。
- `activity.clear`: Clear Filters | 条件をクリア
- `activity.error`: Activity couldn’t load. Try again. | アクティビティを読み込めませんでした。もう一度お試しください。

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

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> ActivityFeed` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
