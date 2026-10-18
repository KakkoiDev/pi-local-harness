# Notifications

The list of things that happened for this person (replies, mentions, invitations, reminders), newest first, with unread ones marked and a way to mark them read.

| | |
| --- | --- |
| Group | Content |
| Basecoat | `item`, `avatar`, `badge`, `btn`, `tabs`, `popover`, `empty`, `skeleton` |
| Route | `/notifications` (full page); also a bell in TopBar that opens the same list in a popover |
| Needs | Web: `GET /notifications?filter=unread&before=`, `POST /notifications/read` (`ids` or `all=1`), the unread count in every page's TopBar. No server: `store.notifications()`, `store.markRead(ids)`; local reminders only. |
| Links to | TopBar (the bell and its count), Comments, Mentions, Invite, ActivityFeed (everyone's events, not mine), SettingsPage (which notifications to get), InfiniteScroll |

## Markup

```html
<section class="app grid gap-4 p-4 @3xl:p-8" aria-labelledby="notif-title">
  <header class="flex flex-wrap items-center justify-between gap-2">
    <h1 id="notif-title" class="text-xl font-semibold @3xl:text-2xl" data-t="notif.title">Notifications</h1>
    <button class="btn" data-variant="outline" data-size="sm" type="button" hx-post="/notifications/read" hx-vals='{"all": 1}' hx-target="#notif-list" data-t="notif.mark_all">Mark All as Read</button>
  </header>
  <div class="tabs" id="notif-tabs">
    <nav role="tablist" aria-orientation="horizontal">
      <button type="button" role="tab" id="notif-tab-all" aria-controls="notif-list" aria-selected="true" tabindex="0" data-t="notif.all">All</button>
      <button type="button" role="tab" id="notif-tab-unread" aria-controls="notif-list" aria-selected="false" tabindex="-1"><span data-t="notif.unread">Unread</span> <span class="badge" data-variant="secondary">2</span></button>
    </nav>
  </div>
  <ol id="notif-list" class="grid gap-1" role="tabpanel" aria-labelledby="notif-tab-all">
    <li>
      <a class="item" href="/posts/7#comment-81" data-unread="true">
        <figure><span class="avatar"><span>RS</span></span></figure>
        <section>
          <h3 class="font-semibold"><span class="block"><span>Ren Sato</span> <span data-t="notif.kind.reply">replied to your note</span> “Week 3 · Vocabulary”</span></h3>
          <p><time datetime="2026-10-18T09:12+09:00">2 h ago</time></p>
        </section>
        <aside><span class="size-2 rounded-full bg-primary" role="img" aria-label="Unread" data-t-label="notif.unread"></span></aside>
      </a>
    </li>
    <li>
      <a class="item" href="/calendar?day=2026-10-20">
        <figure><span class="grid size-8 place-items-center rounded-full bg-muted" aria-hidden="true"><svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.27 21a2 2 0 0 0 3.46 0"/><path d="M3.26 15.33A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.67C19.41 13.96 18 12.5 18 8A6 6 0 0 0 6 8c0 4.5-1.41 5.96-2.74 7.33"/></svg></span></figure>
        <section>
          <h3 data-t="notif.kind.reminder">Reminder: Kanji quiz on Tuesday</h3>
          <p><time datetime="2026-10-17T18:00+09:00">Yesterday</time></p>
        </section>
      </a>
    </li>
  </ol>
</section>
```

The title's parts sit in one `span.block` because Basecoat's item headings are flex rows. Unread rows have `data-unread="true"`, the dot, and `font-semibold` on their `h3`; read rows have neither. Opening a row marks it read. The dot's label `notif.unread_dot` is its `aria-label` text.

## States

| State | What changes |
| --- | --- |
| List (default) | Newest first, grouped by day with a small heading (`<li class="text-muted-foreground px-3 pt-3 text-xs" role="presentation">Today</li>`). |
| Unread filter | `?filter=unread`; the tab gets `aria-selected="true"`. |
| All read | Mark All as Read is `disabled`; the Unread tab's badge is gone. |
| Empty (all) | EmptyState: `notif.empty.title`, `notif.empty.body`. |
| Empty (unread) | `notif.empty_unread` (“You’re all caught up.”) as plain muted text. |
| Loading | Five `skeleton h-14` rows; older pages load with InfiniteScroll (`before=` the last id). |
| Error | ErrorRetry: `notif.error`, **Try Again**. |
| New while open | A button at the top: `notif.new` (“2 new notifications”) that loads them; the list doesn't jump. |
| In the TopBar popover | The bell button (`aria-label="Notifications, 3 unread" data-t-label="notif.bell"`, the count filled from data) opens a `popover` with the first 8 rows and a **See All** link to `/notifications`; the count badge is on the bell. |
| Turned off | When the person turned a kind off in SettingsPage it never appears here. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `notif.title` | Notifications | お知らせ |
| `notif.mark_all` | Mark All as Read | すべて既読にする |
| `notif.all` | All | すべて |
| `notif.unread` | Unread | 未読 |
| `notif.unread_dot` | Unread | 未読 |
| `notif.bell` | Notifications, {count} unread | お知らせ（未読 {count} 件） |
| `notif.see_all` | See All | すべて表示 |
| `notif.today` | Today | 今日 |
| `notif.yesterday` | Yesterday | 昨日 |
| `notif.kind.reply` | replied to your note | さんがあなたのノートに返信しました |
| `notif.kind.mention` | mentioned you in | さんが次の場所であなたをメンションしました： |
| `notif.kind.invite` | invited you to | さんから招待が届きました： |
| `notif.kind.reminder` | Reminder: {title} | リマインダー：{title} |
| `notif.new` | {count} new notifications | 新しいお知らせ {count} 件 |
| `notif.empty.title` | No notifications | お知らせはありません |
| `notif.empty.body` | Replies, mentions and reminders will show up here. | 返信、メンション、リマインダーがここに表示されます。 |
| `notif.empty_unread` | You’re all caught up. | 未読のお知らせはありません。 |
| `notif.error` | Notifications couldn’t load. Try again. | お知らせを読み込めませんでした。もう一度お試しください。 |

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
