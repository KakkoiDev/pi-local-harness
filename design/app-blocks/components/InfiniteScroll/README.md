# InfiniteScroll

Load the next page of a long list when the person reaches the end, with a Load More button that always works as the fallback.

| | |
| --- | --- |
| Group | Other elements |
| Basecoat | `btn` (Load More), `skeleton` (rows while loading), `alert` (error) |
| Needs | A list endpoint with a cursor (`GET /notes?after=<cursor>`) or the store's `page(after, limit)` |
| Used in | ActivityFeed, Gallery, Notifications, Channels (older messages), ListSearch (long results), AppForum, AppShop (catalogue) |

**Load More is the default.** Add the automatic loading (the sentinel) only for feeds people browse without a goal (a gallery, a social feed). Lists people search, sort, or come back to by position (orders, tables, settings) use DataTable's pagination instead, so a footer and a page number stay reachable.

## Markup

```html
<section aria-labelledby="feed-title">
  <h2 id="feed-title" class="sr-only" data-t="feed.title">Recent notes</h2>
  <ul id="feed" class="grid gap-3" role="feed" aria-busy="false">
    <li><article class="card" aria-posinset="1" aria-setsize="134" tabindex="0">…</article></li>
    <!-- … 20 items per page … -->
    <li id="feed-more" class="grid justify-items-center gap-2 py-4" role="none">
      <button class="btn" data-variant="outline" type="button"
              hx-get="/notes?after=n_0420" hx-target="closest li" hx-swap="outerHTML"
              data-t="feed.more">Load More</button>
      <p class="text-sm text-muted-foreground" data-t="feed.shown">Showing 20 of 134</p>
    </li>
  </ul>
  <!-- automatic loading, only for browse feeds: when this enters the screen, press Load More -->
  <div id="feed-sentinel" aria-hidden="true" class="h-px"></div>
</section>
```

The Load More block is the list's last `li`. The next page's response is the new item `li`s followed by a new `#feed-more` `li` (with the next cursor), or by the end line when the list is finished; it replaces the old block in place, so no out-of-band swap is needed.

```js
// js/infinite.mjs: automatic loading = clicking Load More when the sentinel shows (only for browse feeds)
export function autoLoad(sentinel) {
  let busy = false, loads = 0;
  new IntersectionObserver(async ([e]) => {
    const button = document.querySelector('#feed-more button');      // the block is replaced after each page
    if (!e.isIntersecting || busy || !button || loads >= 5) return;  // after 5 automatic pages, wait for a click
    busy = true; loads++; button.click(); setTimeout(() => (busy = false), 500);
  }, {rootMargin: '400px'}).observe(sentinel);
}
```

## States

| State | What changes |
| --- | --- |
| More to load | Load More + “Showing {shown} of {total}” (or without the total when unknown). |
| Loading | The button `disabled aria-busy="true"` with `feed.loading`; three skeleton items appended; `aria-busy="true"` on the `ul`. |
| Loaded | New items take the old block's place. If Load More had focus, focus moves to the first new article (`htmx:after-swap` → `.focus()`); a `sr-only aria-live="polite"` line says `feed.loaded`. |
| End | Replace the block with `feed.end` (“That’s everything.”) in muted text. |
| Error | Keep the loaded items; replace the button block with `alert data-variant="destructive"` (title `feed.error_title`, text `feed.error`) and Try Again (`feed.retry`) (same request). Never retry silently forever. |
| Empty list | EmptyState instead of the feed. |
| Automatic, 5 pages loaded | Stop auto-loading; Load More stays so the footer can be reached. |
| Coming back (Back button) | Restore the loaded pages and scroll position: keep the cursor list in `history.state` or the URL (`?until=n_0380`). |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `feed.title` | Recent notes | 最近のノート |
| `feed.more` | Load More | さらに読み込む |
| `feed.loading` | Loading… | 読み込み中… |
| `feed.shown` | Showing {shown} of {total} | {total}件中{shown}件を表示 |
| `feed.loaded` | {count} more loaded | さらに{count}件を読み込みました |
| `feed.end` | That’s everything. | すべて表示しました。 |
| `feed.error_title` | Couldn’t load more. | これ以上読み込めませんでした。 |
| `feed.error` | Check the connection and try again. | 接続を確認して、もう一度お試しください。 |
| `feed.retry` | Try Again | 再試行 |

## Keyboard and focus

1. Items (each `article` with `tabindex="0"`) → … → 2. Load More → 3. whatever follows the list.
- `role="feed"`: Page Down / Page Up move between articles for screen-reader users. Each article has `aria-posinset` and `aria-setsize` (`-1` when the total is unknown).
- Keyboard users press Load More and land on the first new item; automatic loading never moves focus.

## Phone

- Load More is full width, 44 px. Automatic loading starts 400 px before the end so scrolling rarely waits.
- On cellular data or `navigator.connection.saveData`, don't auto-load: show the button only.

## Data

```json
{"items": [{"id": "n_0421", "title": "Kanji: week 3"}],
 "next": "n_0400", "shown": 20, "total": 134}
```

- Web: `GET /notes?after=n_0420&limit=20` (cursor = the last item's id or sort key; never an offset, items shift while reading). Respond with the item `li`s and the next `#feed-more` `li` (or the end `li`).
- No server: `store.page({after, limit})` returns `{items, next}`.

## Don't

- Don't remove the Load More button when auto-loading.
- Don't use page offsets (`?page=7`) for a feed that changes while it is read.
- Don't put a site footer that people need under an endless feed.
