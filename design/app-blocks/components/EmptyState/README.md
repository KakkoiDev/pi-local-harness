# EmptyState

What a list, page or panel shows when it has nothing in it: why it's empty and the one thing to do next.

| | |
| --- | --- |
| Group | Data |
| Basecoat | `empty` (header with figure, h2, p; footer), `btn` |
| Needs | Nothing; the list decides which of the three kinds applies |
| Used in | ListSearch, DataTable, Kanban columns, Notifications, Cart, IssueList, Gallery, Agenda; every list |
| Links to | EditForm (the first item), FileUpload (Import), ListSearch (Clear Filters) |

## Markup

```html
<div class="empty border @max-3xl:p-8">
  <header>
    <figure><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8"/></svg></figure>
    <h2 data-t="empty.first_title">No notes yet</h2>
    <p data-t="empty.first_text">Write your first note: a word list, a grammar rule, anything from class.</p>
  </header>
  <footer class="flex-row flex-wrap justify-center gap-2 @max-3xl:flex-col @max-3xl:items-stretch">
    <a href="/notes/new" class="btn"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M12 5v14"/></svg><span data-t="empty.first_action">New Note</span></a>
    <button type="button" class="btn" data-variant="outline" onclick="document.getElementById('import-file').click()" data-t="empty.first_secondary">Import from a File…</button>
  </footer>
</div>
```

- Three kinds, each with its own keys: **first run** (nothing was ever made: say what it's for, offer New), **no match** (filters or search hide everything: say so, offer Clear Filters), **all done** (an inbox or review list that was emptied: say it's done, no button).
- One primary action at most; a second outline action only for first run (import, a template).
- The icon is the list's own icon (the same as its SidePanel or BottomBar item), never an illustration of people.

## States

| State | What changes |
| --- | --- |
| First run | `empty.first_*`, New and Import. Shown in place of the list; the list's filters are hidden. |
| No match | `empty.search_*` with the query in the title; the filters stay visible above it. |
| All done | `empty.done_*`, no buttons. |
| No permission to create | First run without the buttons; the text says who can add things (`… Your teacher adds notes here.`). |
| Inside a small panel (a Kanban column, a card) | Drop the border (`border-0`) and the padding to `p-6`; keep the icon, title and one line. |
| Loading | Never show an empty state while loading: LoadingState first, EmptyState only when the answer says 0. |
| Search with no match | `empty.search_title` → the empty state’s `h3` (“No notes match “kanji””). |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `empty.first_title` | No notes yet | ノートはまだありません |
| `empty.first_text` | Write your first note: a word list, a grammar rule, anything from class. | 最初のノートを書きましょう。単語リスト、文法のルールなど、授業の内容なら何でも。 |
| `empty.first_action` | New Note | 新しいノート |
| `empty.first_secondary` | Import from a File… | ファイルから読み込む… |
| `empty.search_title` | No notes match “{q}” | 「{q}」に一致するノートはありません |
| `empty.search_text` | Check the spelling or clear the filters. | つづりを確認するか、絞り込みを解除してください。 |
| `empty.search_action` | Clear Filters | 絞り込みを解除 |
| `empty.done_title` | Nothing to review today | 今日復習するノートはありません |
| `empty.done_text` | Notes you mark for review show up here on their day. | 復習日を設定したノートは、その日にここに表示されます。 |

## Keyboard and focus

1. The buttons in order: New Note → Import from a File….
- The heading is not focusable. When a filter change empties the list, focus stays in the filter; the live region announces the title.

## Phone

- Add `@max-3xl:p-8` to `.empty` (Basecoat's 48 px padding is too much at phone width); the buttons stack full width (`@max-3xl:flex-col`).
- Text stays centred and at most 24 rem wide.

## Data

```json
{"kind": "first | search | done", "q": "hiragana", "can_create": true}
```

- Web: the list template chooses the kind from `total == 0`, the presence of filters, and the list's type.
- No server: the same three checks after `store.list()`.

## Don't

- Don't use jokes or exclamation marks (“Wow, so empty!”).
- Don't show a "0 results" table with headers and no rows.
- Don't show an empty state for an error; that is ErrorRetry.
