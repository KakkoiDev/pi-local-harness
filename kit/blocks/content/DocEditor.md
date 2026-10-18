# DocEditor

App Block card (Content). A note or document editor: a title, a small formatting toolbar, the body, and a line that says whether the changes are saved.

- Basecoat: `btn`, `button-group`, `textarea`, `input`, `dropdown-menu`, `kbd`, `badge`
- Route: `/notes/{id}` (and `/notes/new`)
- Needs: Web: `GET /notes/{id}`, `PUT /notes/{id}` (autosave). No server: `store.note(id)`, `store.saveNote(note)`. Markdown is the stored format.
- Links to: SavedState, OfflineBanner, ConfirmDialog (Delete Note), DeleteUndo, BlockEditor (the Notion-like version), Mentions, Presence, AppNotes

## Markup
Copy, never retype: `{harness}/kit/blocks/content/DocEditor.html` (32 lines of HTML).

Icons are Lucide-style inline SVGs (24 px viewBox, `stroke="currentColor"`, `aria-hidden="true"`); the button carries the label. `data-t-placeholder` means the placeholder text comes from that key.

## States
- Saved (default): `#doc-status`: `doc.saved`.
- Typing: After the first change: `doc.unsaved` (“Unsaved changes”); 800 ms after the last key it saves.
- Saving: `doc.saving` with `aria-busy="true"` on the status.
- Saved just now: `doc.saved_at` (“Saved at 09:42”) for 1 minute, then `doc.saved`.
- Save failed: The status becomes `text-destructive` `doc.save_failed` + a **Try Again** link (`btn` `data-variant="link"` `data-size="sm"`). The text stays in the editor; nothing is lost.
- Offline: OfflineBanner above; status `doc.offline_saved` (“Saved on this device”); syncs when back online.
- Conflict: Someone else saved a newer version: an `alert` above the editor with `doc.conflict` and **Keep Mine** / **Use Theirs** / **Compare** (opens CodeDiff in a dialog).
- Preview: The Preview button `aria-pressed="true"`; the textarea is `hidden`; a `<article class="prose">` shows the rendered Markdown (sanitised).
- New note: Title empty with the `doc.untitled` placeholder; focus in the title. Nothing is saved until something is typed.
- Read-only: Toolbar hidden, `readonly` on both fields, a `badge` `doc.read_only` next to the status.
- Leaving with unsaved changes: Only if a save is still pending or failed: `beforeunload` prompt (browser text).
- Character count: `doc.characters` → the status line beside SavedState (`#doc-count`), updated as you type.

## Texts
(Key | English | 日本語)
- `doc.back`: ‹ All Notes | ‹ ノート一覧
- `doc.title_label`: Title | タイトル
- `doc.untitled`: Untitled | 無題
- `doc.body_label`: Note | 本文
- `doc.placeholder`: Start writing… | 書き始めましょう…
- `doc.bold`: Bold | 太字
- `doc.italic`: Italic | 斜体
- `doc.heading`: Heading | 見出し
- `doc.bullets`: Bulleted list | 箇条書き
- `doc.checklist`: Checklist | チェックリスト
- `doc.link`: Link | リンク
- `doc.toolbar`: Formatting | 書式
- `doc.preview`: Preview | プレビュー
- `doc.saved`: Saved | 保存済み
- `doc.unsaved`: Unsaved changes | 未保存の変更があります
- `doc.saving`: Saving… | 保存中…
- `doc.saved_at`: Saved at {time} | {time} に保存しました
- `doc.save_failed`: Couldn’t save. Your text is still here. | 保存できませんでした。入力した内容は残っています。
- `doc.try_again`: Try Again | もう一度試す
- `doc.offline_saved`: Saved on this device | このデバイスに保存しました
- `doc.conflict`: This note was changed somewhere else while you were editing. | 編集中に、このノートが別の場所で変更されました。
- `doc.keep_mine`: Keep Mine | 自分の変更を残す
- `doc.use_theirs`: Use Theirs | 相手の変更を使う
- `doc.compare`: Compare | 比較する
- `doc.read_only`: Read only | 閲覧のみ
- `doc.words`: {count} words | {count} 語
- `doc.characters`: {count} characters | {count} 文字
- `doc.edited`: Edited {date} | {date} に編集

Japanese counts characters, not words: when `lang` is `ja` the footer uses `doc.characters`.

## Keyboard and focus
1. All Notes → 2. Title → 3. toolbar (one tab stop; ← → move between its buttons) → 4. Preview → 5. Body.
- ⌘B / Ctrl+B bold, ⌘I / Ctrl+I italic, ⌘K / Ctrl+K link, ⌘S / Ctrl+S saves now (prevent the browser's Save dialog). Return in the title moves to the body.
- Toolbar buttons wrap the selection (or insert at the line start for heading and lists) and put focus back in the body with the selection kept.

## Phone
- Full width, `p-4`; the toolbar wraps to a second line when it doesn’t fit (`flex-wrap`), 44 px buttons.
- The toolbar sits above the keyboard: on focus of the body it becomes `sticky bottom-0 bg-background` inside `.app` (not fixed).
- Preview is a toggle, never side by side.

## Data
```json
{"id": 42, "title": "Week 3 · Vocabulary", "body": "## Words\n- 駅 (eki) station", "updated_at": "2026-10-18T09:41:00+09:00", "version": 7, "read_only": false}
```

- Web: `PUT /notes/42` with `title`, `body`, `version` → 200 with the status fragment (`doc.saved_at`), 409 with the conflict alert fragment when `version` is stale, 422 if the title is over 200 characters.
- No server: `store.saveNote({id, title, body})` writes to IndexedDB and returns the new `updated_at`; offline is normal.
- Render Markdown for Preview with a sanitiser; never insert the stored HTML unescaped.

## Don't
- Don't add a Save button as the main way to save; autosave is the rule, ⌘S only forces it.
- Don't use `contenteditable` for this block (that's BlockEditor).
- Don't show “Saved” before the server or store has confirmed it.

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> DocEditor` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
