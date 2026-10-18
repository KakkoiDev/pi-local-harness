# EmptyState

App Block card (Data). What a list, page or panel shows when it has nothing in it: why it's empty and the one thing to do next.

- Basecoat: `empty` (header with figure, h2, p; footer), `btn`
- Needs: Nothing; the list decides which of the three kinds applies
- Used in: ListSearch, DataTable, Kanban columns, Notifications, Cart, IssueList, Gallery, Agenda; every list
- Links to: EditForm (the first item), FileUpload (Import), ListSearch (Clear Filters)

## Markup
Copy, never retype: `{harness}/kit/blocks/data/EmptyState.html` (11 lines of HTML).

- Three kinds, each with its own keys: **first run** (nothing was ever made: say what it's for, offer New), **no match** (filters or search hide everything: say so, offer Clear Filters), **all done** (an inbox or review list that was emptied: say it's done, no button).
- One primary action at most; a second outline action only for first run (import, a template).
- The icon is the list's own icon (the same as its SidePanel or BottomBar item), never an illustration of people.

## States
- First run: `empty.first_*`, New and Import. Shown in place of the list; the list's filters are hidden.
- No match: `empty.search_*` with the query in the title; the filters stay visible above it.
- All done: `empty.done_*`, no buttons.
- No permission to create: First run without the buttons; the text says who can add things (`… Your teacher adds notes here.`).
- Inside a small panel (a Kanban column, a card): Drop the border (`border-0`) and the padding to `p-6`; keep the icon, title and one line.
- Loading: Never show an empty state while loading: LoadingState first, EmptyState only when the answer says 0.

## Texts
(Key | English | 日本語)
- `empty.first_title`: No notes yet | ノートはまだありません
- `empty.first_text`: Write your first note: a word list, a grammar rule, anything from class. | 最初のノートを書きましょう。単語リスト、文法のルールなど、授業の内容なら何でも。
- `empty.first_action`: New Note | 新しいノート
- `empty.first_secondary`: Import from a File… | ファイルから読み込む…
- `empty.search_title`: No notes match “{q}” | 「{q}」に一致するノートはありません
- `empty.search_text`: Check the spelling or clear the filters. | つづりを確認するか、絞り込みを解除してください。
- `empty.search_action`: Clear Filters | 絞り込みを解除
- `empty.done_title`: Nothing to review today | 今日復習するノートはありません
- `empty.done_text`: Notes you mark for review show up here on their day. | 復習日を設定したノートは、その日にここに表示されます。

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

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> EmptyState` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
