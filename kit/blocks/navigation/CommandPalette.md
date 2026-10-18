# CommandPalette

App Block card (Navigation). One search box for everything: go to a place, find a note, or run an action, opened with ⌘K (Mac) or Ctrl K anywhere.

- Basecoat: `command-dialog` and `command` (with `js/basecoat.min.js`)
- Needs: Web: `GET /search/command?q=` returning the Notes group; no server: `store.search(q)`
- Used in: AppNotes, AppCode, AppAdmin, AppCrm, AppChat; opened by TopBar's search on the phone
- Links to: GlobalSearch (the full results page), ShortcutHelp (lists ⌘K)

## Markup
Copy, never retype: `{harness}/kit/blocks/navigation/CommandPalette.html` (40 lines of HTML).

- Put it once, at the end of `<body>`, outside `.app`. TopBar's search icon calls `document.getElementById('command').showModal()`.
- Basecoat filters the fixed items as you type (their text and `data-keywords`, which should include the other language's words). Search results come from the server into `#command-results` and carry `data-force` so the filter keeps them.
- An item is a link (`<a role="menuitem" href>`) when it goes somewhere, a `div role="menuitem"` with `onclick` when it acts. Return or a click runs it.

## States
- Opened, empty query: Recent notes (last 5 opened), Go To and Actions. The first item is highlighted (`.active`).
- Typing: Fixed items filter at once; after 200 ms the Notes group is replaced by the server's results.
- Searching: While the request runs and nothing else matches, set the menu's `data-empty` to `command.searching`; put `command.empty` back when the answer arrives.
- No match: Every item hidden: the menu shows `data-empty` (`command.empty`).
- Error: The Notes group shows “Couldn’t search right now.” (InlineAlert keys) with the fixed items still usable.
- Offline (web app): Only Go To and Actions; the search request isn't sent.
- Closed: Esc, a click outside, or running an item. Focus returns to what had it before.

## Texts
(Key | English | 日本語)
- `command.label`: Search and commands | 検索とコマンド
- `command.input_label`: Search notes or run a command | ノートを検索、またはコマンドを実行
- `command.placeholder`: Search notes or type a command… | ノートを検索、またはコマンドを入力…
- `command.empty`: Nothing found for that. Try fewer words. | 見つかりませんでした。言葉を減らしてお試しください。
- `command.goto`: Go To | 移動
- `command.actions`: Actions | 操作
- `command.notes`: Notes | ノート
- `command.home`: Home | ホーム
- `command.inbox`: Inbox | 受信箱
- `command.settings`: Settings | 設定
- `command.new_note`: New Note | 新しいノート
- `command.theme`: Switch Light or Dark | ライト／ダークを切り替え
- `command.hint`: ↑↓ Move · ↵ Open · Esc Close | ↑↓ 移動 · ↵ 開く · Esc 閉じる
- `command.searching`: Searching… | 検索中…

## Keyboard and focus
1. Focus starts in the input when it opens.
- ↑ ↓ move the highlight (Home, End jump), Return runs the highlighted item, Esc closes.
- ⌘K / Ctrl K toggles it from anywhere, also while typing in a field.
- Tab does not leave the dialog (it is modal).

## Phone
- It opens near the top of the screen, as wide as the screen allows, so the keyboard doesn't cover it. Items get `@max-3xl:min-h-11` (Basecoat's are 32 px; App foundations doesn't cover command items).
- The footer hint is hidden (`@max-3xl:hidden`): there is no keyboard to hint at.
- Opened by TopBar's search icon; there is no shortcut.

## Data
```json
{"q": "vocab", "results": [{"type": "note", "id": 42, "title": "Week 3 · Vocabulary", "href": "/notes/42"}]}
```

- Web: `GET /search/command?q=vocab` → a fragment of `<div role="group">` with up to 8 `<a role="menuitem" data-force>` (200); empty query → recent notes.
- No server: `store.search(q, {limit: 8})` then render the same items into `#command-results`.

## Don't
- Don't use it as the only way to reach a place; everything in it also exists in the visible navigation.
- Don't bind ⌘N, ⌘T or ⌘W: the browser keeps them.
- Don't run destructive actions from it without ConfirmDialog.

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> CommandPalette` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
