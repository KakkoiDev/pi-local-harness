# Notifications

App Block card (Content). The list of things that happened for this person (replies, mentions, invitations, reminders), newest first, with unread ones marked and a way to mark them read.

- Basecoat: `item`, `avatar`, `badge`, `btn`, `tabs`, `popover`, `empty`, `skeleton`
- Route: `/notifications` (full page); also a bell in TopBar that opens the same list in a popover
- Needs: Web: `GET /notifications?filter=unread&before=`, `POST /notifications/read` (`ids` or `all=1`), the unread count in every page's TopBar. No server: `store.notifications()`, `store.markRead(ids)`; local reminders only.
- Links to: TopBar (the bell and its count), Comments, Mentions, Invite, ActivityFeed (everyone's events, not mine), SettingsPage (which notifications to get), InfiniteScroll

## Markup
Copy, never retype: `{harness}/kit/blocks/content/Notifications.html` (33 lines of HTML).

The title's parts sit in one `span.block` because Basecoat's item headings are flex rows. Unread rows have `data-unread="true"`, the dot, and `font-semibold` on their `h3`; read rows have neither. Opening a row marks it read. The dot's label `notif.unread_dot` is its `aria-label` text.

## States
- List (default): Newest first, grouped by day with a small heading (`<li class="text-muted-foreground px-3 pt-3 text-xs" role="presentation">Today</li>`).
- Unread filter: `?filter=unread`; the tab gets `aria-selected="true"`.
- All read: Mark All as Read is `disabled`; the Unread tab's badge is gone.
- Empty (all): EmptyState: `notif.empty.title`, `notif.empty.body`.
- Empty (unread): `notif.empty_unread` (“You’re all caught up.”) as plain muted text.
- Loading: Five `skeleton h-14` rows; older pages load with InfiniteScroll (`before=` the last id).
- Error: ErrorRetry: `notif.error`, **Try Again**.
- New while open: A button at the top: `notif.new` (“2 new notifications”) that loads them; the list doesn't jump.
- In the TopBar popover: The bell button (`aria-label="Notifications, 3 unread" data-t-label="notif.bell"`, the count filled from data) opens a `popover` with the first 8 rows and a **See All** link to `/notifications`; the count badge is on the bell.
- Turned off: When the person turned a kind off in SettingsPage it never appears here.

## Texts
(Key | English | 日本語)
- `notif.title`: Notifications | お知らせ
- `notif.mark_all`: Mark All as Read | すべて既読にする
- `notif.all`: All | すべて
- `notif.unread`: Unread | 未読
- `notif.unread_dot`: Unread | 未読
- `notif.bell`: Notifications, {count} unread | お知らせ（未読 {count} 件）
- `notif.see_all`: See All | すべて表示
- `notif.today`: Today | 今日
- `notif.yesterday`: Yesterday | 昨日
- `notif.kind.reply`: replied to your note | さんがあなたのノートに返信しました
- `notif.kind.mention`: mentioned you in | さんが次の場所であなたをメンションしました：
- `notif.kind.invite`: invited you to | さんから招待が届きました：
- `notif.kind.reminder`: Reminder: {title} | リマインダー：{title}
- `notif.new`: {count} new notifications | 新しいお知らせ {count} 件
- `notif.empty.title`: No notifications | お知らせはありません
- `notif.empty.body`: Replies, mentions and reminders will show up here. | 返信、メンション、リマインダーがここに表示されます。
- `notif.empty_unread`: You’re all caught up. | 未読のお知らせはありません。
- `notif.error`: Notifications couldn’t load. Try again. | お知らせを読み込めませんでした。もう一度お試しください。

Japanese puts the name first and the verb phrase after it (“佐藤 蓮さんがあなたのノートに返信しました”); keep the name and the phrase in separate elements so both orders work.

## Keyboard and focus
1. Mark All as Read → 2. the tabs (one tab stop; ← → switch) → 3. each row (links, in order).
- Return opens a row. In the TopBar popover: the bell toggles it, ↓ moves into the list, Esc closes and returns focus to the bell.
- After Mark All as Read the button becomes disabled, so focus moves to the first row.

## Phone
- The bell in TopBar goes to `/notifications` (a page, not a popover).
- Rows are at least 56 px tall; the time goes under the text.
- Swipe left on a row is optional; the visible way to mark one read is opening it, or Mark All as Read.

## Data
```json
{"unread": 2,
 "items": [{"id": 901, "kind": "reply", "actor": {"name": "Ren Sato", "initials": "RS"}, "target": {"title": "Week 3 · Vocabulary", "href": "/posts/7#comment-81"},
            "created_at": "2026-10-18T09:12:00+09:00", "read": false},
           {"id": 899, "kind": "reminder", "title": "Kanji quiz on Tuesday", "href": "/calendar?day=2026-10-20", "created_at": "2026-10-17T18:00:00+09:00", "read": true}],
 "before": 899}
```

- Web: `GET /notifications?filter=unread` returns `#notif-list`'s fragment; `POST /notifications/read` with `ids=901` or `all=1` → 204 and an `HX-Trigger: notifications-read` event that updates the bell count.
- No server: only reminders the app schedules itself; the list lives in IndexedDB.

## Don't
- Don't show a toast for every notification as well; one place is enough.
- Don't mark everything read just because the page was opened.
- Don't build the sentence by gluing translated fragments in English order.

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> Notifications` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
