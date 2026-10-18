# ListSearch

A list of the person's things with a search field and a few filters above it; results update as they type.

| | |
| --- | --- |
| Group | Data |
| Basecoat | `input-group`, `select` (native), `input` checkbox, `item`, `badge`, `empty` |
| Route | `/notes?q=&subject=&sort=&mine=` (the filters live in the address) |
| Needs | Web: `GET /notes` returns the page, or only `#notes-results` for htmx requests. No server: `store.list("notes", {{q, subject, sort, mine}})` |
| Used in | AppNotes, AppForum, AppCourse, AppCrm; DataTable when the things have many columns |
| Links to | DetailView (each item), EmptyState, LoadingState, ErrorRetry, InfiniteScroll (long lists) |

## Markup

```html
<section class="grid gap-4" aria-labelledby="notes-title">
  <h1 id="notes-title" class="text-2xl font-semibold" data-t="list.title">Notes</h1>
  <form id="notes-filter" role="search" class="flex flex-wrap items-end gap-3" action="/notes" hx-get="/notes" hx-trigger="input changed delay:250ms from:#notes-q, change" hx-target="#notes-results" hx-push-url="true">
    <label class="input-group w-full @3xl:w-72">
      <span data-align="start"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg></span>
      <input id="notes-q" type="search" name="q" value="" placeholder="Search titles and text…" data-t-placeholder="list.search_hint" aria-label="Search notes" data-t-label="list.search" class="@max-3xl:min-h-11">
    </label>
    <div class="grid gap-1.5">
      <label class="label" for="notes-subject" data-t="list.subject">Subject</label>
      <select id="notes-subject" name="subject" class="select">
        <option value="" selected data-t="list.subject_all">All subjects</option>
        <option value="vocabulary" data-t="subject.Vocabulary">Vocabulary</option>
        <option value="grammar" data-t="subject.Grammar">Grammar</option>
        <option value="kanji" data-t="subject.Kanji">Kanji</option>
      </select>
    </div>
    <div class="grid gap-1.5">
      <label class="label" for="notes-sort" data-t="list.sort">Sort</label>
      <select id="notes-sort" name="sort" class="select">
        <option value="recent" data-t="list.sort_recent">Recently edited</option>
        <option value="title" data-t="list.sort_title">Title A–Z</option>
      </select>
    </div>
    <label class="label h-9 gap-2 font-normal @max-3xl:h-11"><input class="input" type="checkbox" name="mine" value="1"><span data-t="list.only_mine">Only mine</span></label>
  </form>
  <div id="notes-results" class="grid gap-3" aria-live="polite">
    <p class="text-sm text-muted-foreground" data-t="list.count">2 notes</p>
    <ul class="grid gap-2">
    <li>
      <a href="/notes/40" class="item" data-variant="outline">
        <section>
          <h3>Week 3 · Vocabulary</h3>
          <p class="line-clamp-1">駅 (eki) station, 電車 (densha) train, 切符 (kippu) ticket</p>
        </section>
        <aside class="flex flex-col items-end gap-1 text-xs text-muted-foreground">
          <span class="badge" data-variant="secondary">Vocabulary</span>
          <span>Edited 2 hours ago</span>
        </aside>
      </a>
    </li>
    <li>
      <a href="/notes/41" class="item" data-variant="outline">
        <section>
          <h3>Te-form practice</h3>
          <p class="line-clamp-1">Verbs: 食べる → 食べて, 行く → 行って, する → して</p>
        </section>
        <aside class="flex flex-col items-end gap-1 text-xs text-muted-foreground">
          <span class="badge" data-variant="secondary">Grammar</span>
          <span>Edited Yesterday</span>
        </aside>
      </a>
    </li>
    </ul>
  </div>
</section>
```

- Each item is a link to its DetailView (`item` with `data-variant="outline"`): title, one line of text, and an aside with its subject badge and when it changed.
- The filters are a `GET` form: without JavaScript it still works, and the address can be shared or bookmarked.
- Up to 4 filters in the row. More than that: put them in a "Filters" popover and show the active ones as removable badges.

## States

| State | What changes |
| --- | --- |
| Default | Newest first, all subjects; `list.count` above the list. |
| Typing | After 250 ms the results are replaced (`hx-trigger`); the address updates (`hx-push-url`). The field keeps focus. |
| Loading | `#notes-results` gets `aria-busy="true"` and the list fades to 60 % (`aria-busy:opacity-60`); after 1 s show LoadingState's list skeleton. |
| No match | EmptyState with `list.no_match` (the query in it) and Clear Filters. |
| No notes at all | EmptyState's first-run version (“No notes yet”), no filters shown. |
| Error | ErrorRetry's section version in place of the list; the filters stay usable. |
| Many results | 20 per page, then InfiniteScroll (or DataTable's pagination for tables). |
| Long titles | One line, truncated (`truncate` on `h3`); the text clamps to one line. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `list.title` | Notes | ノート |
| `list.search` | Search notes | ノートを検索 |
| `list.search_hint` | Search titles and text… | タイトルと本文を検索… |
| `list.subject` | Subject | 科目 |
| `list.subject_all` | All subjects | すべての科目 |
| `list.sort` | Sort | 並べ替え |
| `list.sort_recent` | Recently edited | 最近の編集順 |
| `list.sort_title` | Title A–Z | タイトル順 |
| `list.filters` | Filters | 絞り込み |
| `list.only_mine` | Only mine | 自分のノートのみ |
| `list.count` | {count} notes | {count} 件のノート |
| `list.clear` | Clear Filters | 絞り込みを解除 |
| `list.no_match` | No notes match “{q}”. | 「{q}」に一致するノートはありません。 |
| `list.no_match_hint` | Check the spelling or clear the filters. | つづりを確認するか、絞り込みを解除してください。 |
| `list.updated` | Edited {when} | {when}に編集 |
| `subject.Vocabulary` | Vocabulary | 語彙 |
| `subject.Grammar` | Grammar | 文法 |
| `subject.Kanji` | Kanji | 漢字 |

Subjects are app data with keys (`subject.<id>`); note titles and text are the person's own.

## Keyboard and focus

1. Search → 2. Subject → 3. Sort → 4. Only mine → 5. each result in order.
- `/` focuses the search field from anywhere on the page (not while typing in another field). Esc in the field clears it.
- Results updating never moves focus; screen readers hear the new count (`aria-live="polite"` on the results).

## Phone

- The search field takes the full width; Subject and Sort sit side by side under it, then Only mine. All 44 px tall.
- Items keep their aside under 48 rem but the edit time is hidden if the title would wrap (`@max-3xl:hidden` on it in long lists).

## Data

```json
{"q": "vocab", "subject": "vocabulary", "sort": "recent", "mine": false, "total": 2,
 "items": [{"id": 42, "title": "Week 3 · Vocabulary", "excerpt": "駅 (eki) station…", "subject": "vocabulary", "updated_at": "2026-10-18T09:12:00+09:00"}]}
```

- Web: `GET /notes` (200). With `HX-Request`, return only the `#notes-results` fragment. Search title and text with SQLite FTS5 (`notes_fts MATCH ?`); show relative times with the person's language.
- No server: filter in memory for up to ~2,000 items; above that use IndexedDB with an index on `subject` and `updated_at`.

## Don't

- Don't search on every keystroke without the 250 ms delay.
- Don't clear the filters when the person opens an item and comes back; they live in the address.
- Don't add a Search button; the field searches as you type (Return also submits).
