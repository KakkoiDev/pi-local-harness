# GlobalSearch

One search across everything in the app (pages, messages, issues, files, people), results grouped by kind with the matched words marked, and filters to narrow to one kind.

| | |
| --- | --- |
| Group | Collaboration |
| Basecoat | `input-group`, `tabs`, `item-group`/`item`, `badge`, `kbd`, `empty` |
| Route | `/search?q=&kind=all\|pages\|messages\|issues\|files\|people` |
| Needs | Web: `GET /search?q=&kind=` (results fragment; SQLite FTS5 with the `trigram` tokenizer so Japanese matches without spaces). No server: `store.search(q, kind)` over a local index (MiniSearch-style, built from the stores). Blocks: CommandPalette (quick jump), ListSearch, EmptyState, LoadingState |
| Used in | AppNotes, AppChat, AppCode, AppForum, AppCrm |

## Markup

```html
<section class="mx-auto grid w-full max-w-3xl gap-4" aria-labelledby="search-title">
  <h1 id="search-title" class="sr-only" data-t="search.title">Search</h1>
  <form role="search" hx-get="/search" hx-target="#search-results" hx-trigger="input changed delay:250ms from:#search-q, change" hx-push-url="true">
    <div class="input-group h-11 rounded-lg border">
      <span data-align="inline-start" aria-hidden="true">⌕</span>
      <input id="search-q" type="search" name="q" value="museum" aria-label="Search everything" data-t-label="search.label" autocomplete="off">
      <kbd class="kbd" data-align="inline-end">/</kbd>
    </div>
    <nav class="mt-3 flex flex-wrap gap-1" aria-label="Kind of result">
      <a class="btn" data-variant="secondary" data-size="sm" href="?q=museum&kind=all" aria-current="page"><span data-t="search.all">All</span> <span class="tabular-nums">14</span></a>
      <a class="btn" data-variant="ghost" data-size="sm" href="?q=museum&kind=pages"><span data-t="search.pages">Pages</span> <span class="tabular-nums">3</span></a>
      <a class="btn" data-variant="ghost" data-size="sm" href="?q=museum&kind=messages"><span data-t="search.messages">Messages</span> <span class="tabular-nums">8</span></a>
      <a class="btn" data-variant="ghost" data-size="sm" href="?q=museum&kind=issues"><span data-t="search.issues">Issues</span> <span class="tabular-nums">2</span></a>
      <a class="btn" data-variant="ghost" data-size="sm" href="?q=museum&kind=people"><span data-t="search.people">People</span> <span class="tabular-nums">1</span></a>
    </nav>
  </form>
  <p id="search-status" role="status" class="text-muted-foreground text-sm" data-t="search.count">14 results for “museum”</p>
  <div id="search-results" class="grid gap-6">
    <section aria-labelledby="res-pages" class="grid gap-2">
      <h2 id="res-pages" class="text-muted-foreground text-xs font-medium uppercase tracking-wide" data-t="search.pages">Pages</h2>
      <div class="item-group gap-1">
        <a class="item gap-3 rounded-md border-transparent px-3 py-2" href="/pages/pg_7f2">
          <figure class="text-muted-foreground" aria-hidden="true">▤</figure>
          <section><h3 class="text-sm font-medium">Field trip plan</h3>
            <p class="text-sm">…take the 8:52 train to the <mark class="rounded-sm bg-highlight text-highlight-foreground px-0.5">museum</mark> and meet at the north gate…</p></section>
          <aside class="text-muted-foreground text-xs">Class 3-B · 9:12</aside>
        </a>
      </div>
      <a href="?q=museum&kind=pages" class="text-sm underline-offset-4 hover:underline" data-t="search.more">See all 3 pages</a>
    </section>
  </div>
</section>
```

Each kind has the same row: an icon in `figure`, a title, one snippet with `<mark>` around matches (server-side, escaped), and where/when in `aside`. Messages show the author and channel; issues show `#number` and the state; people show avatar and role.

## States

| State | What changes |
| --- | --- |
| Empty field | No results; `search.recent` lists the last 5 searches (links) and a Clear link. |
| Typing | Results update 250 ms after typing stops; the old results stay (`opacity-60`) while loading. |
| Loading first time | 3 sections of `skeleton` rows. |
| No results | `empty`: `search.none` + `search.none_hint` (check spelling, try fewer words, search all kinds). |
| One kind chosen | Only that section, with paging (25) or InfiniteScroll. |
| Too short | Fewer than 2 characters: `search.too_short` (Japanese: 1 character is enough). |
| Operators | `from:kana`, `in:#field-trip`, `is:open`, `"exact words"`; the tips are in `search.tips` under the field when it has focus and is empty. |
| Error | ErrorRetry in the results area; the field stays usable. |
| Where a result is | `search.in` → a visually hidden span before the result’s place in its `aside` (“in Class 3-B”). |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `search.title` | Search | 検索 |
| `search.label` | Search everything | すべてを検索 |
| `search.all` | All | すべて |
| `search.pages` | Pages | ページ |
| `search.messages` | Messages | メッセージ |
| `search.issues` | Issues | 課題 |
| `search.files` | Files | ファイル |
| `search.people` | People | メンバー |
| `search.count` | {count} results for “{query}” | 「{query}」の検索結果 {count} 件 |
| `search.more` | See all {count} {kind} | {kind}をすべて表示（{count} 件） |
| `search.recent` | Recent searches | 最近の検索 |
| `search.clear` | Clear | 消去 |
| `search.none` | Nothing found for “{query}” | 「{query}」は見つかりませんでした |
| `search.none_hint` | Check the spelling, try fewer words, or search all kinds. | つづりを確認するか、言葉を減らすか、すべての種類から検索してください。 |
| `search.too_short` | Type at least 2 letters. | 2 文字以上入力してください。 |
| `search.tips` | Try from:name, in:#channel, is:open or "exact words". | from:名前、in:#チャンネル、is:open、"完全一致" が使えます。 |
| `search.in` | in {place} | {place} 内 |

## Keyboard and focus

1. Search field → 2. kind filters → 3. each result link, section by section → 4. See all links.
- `/` or `Ctrl K` then “Search…” focuses the field from anywhere. ↓ from the field moves to the first result; Esc in the field clears it, a second Esc leaves.
- Changing the kind keeps focus on that filter and announces the new count (`#search-status`).

## Phone

- The field sits at the top with a Cancel button; the kind filters scroll sideways in one row (`overflow-x-auto`, no wrap).
- Rows are full-width links (44 px+); the `aside` moves under the snippet.
- The search opens as its own screen from a search icon in the top bar.

## Data

```json
{"query": "museum", "kind": "all", "counts": {"pages": 3, "messages": 8, "issues": 2, "files": 0, "people": 1},
 "results": [{"kind": "page", "id": "pg_7f2", "title": "Field trip plan", "url": "/pages/pg_7f2", "place": "Class 3-B",
   "at": "2026-10-18T09:12:00+09:00", "snippet": [{"text": "…take the 8:52 train to the "}, {"text": "museum", "match": true}, {"text": " and meet…"}]}]}
```

- Web: `GET /search?q=museum&kind=all` → sections fragment (3 rows per kind); results only include what the person may see.
- No server: `store.search("museum", "all")` returns the same shape; the index updates when a store changes.

## Don't

- Don't build snippets with `innerHTML` from stored text; build them from the `snippet` parts.
- Don't search on every keystroke without the delay.
- Don't show results the person isn't allowed to open.
