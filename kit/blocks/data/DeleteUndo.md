# DeleteUndo

App Block card (Data). Deleting without asking first: the thing disappears at once and a toast offers Undo for 8 seconds; it really goes to a Trash kept 30 days.

- Basecoat: `toaster`, `toast` (with `js/basecoat.min.js`), `btn`, `item`
- Needs: Web: `DELETE /notes/{{id}}` (soft delete), `POST /notes/{{id}}/restore`. No server: `store.trash(id)`, `store.restore(id)`
- Used in: ListSearch, DataTable (Delete Selected), Kanban cards, Comments, Notifications, Cart (remove item)
- Links to: Toasts (the toast itself), ConfirmDialog (use it instead when the delete can't be undone)

## Markup
The delete button on a row:

Copy, never retype: `{harness}/kit/blocks/data/DeleteUndo.html` (6 lines of HTML).

The toast, added to the toaster (one per page, at the end of `<body>`, outside `.app`):

Copy, never retype: `{harness}/kit/blocks/data/DeleteUndo.2.html` (14 lines of HTML).

- Use this for things that can come back (notes, items, cards, comments). For things that can't (an account, a payment, a whole workspace), use ConfirmDialog instead and no Undo.
- The server **soft-deletes** (`deleted_at` set) and removes for good after 30 days; Undo clears `deleted_at`.
- From JS, show the toast with `document.getElementById("toaster").toast({category: "success", title, description, duration: 8000, action: {label: t("delete.undo"), onclick: "restoreNote(42)"}})` (Basecoat; `onclick` is a string of JS). From the server, return the toast markup out of band (htmx `hx-swap-oob="beforeend:#toaster"`).

## States
- Deleted: The row is removed at once (`hx-swap="delete"`); the toast `delete.done` with the name and Undo appears for 8 s.
- Several deleted: One toast: `delete.done_many` with the count; Undo restores all of them.
- Undo pressed: The row comes back in its place (the list re-renders), focus moves to it; a short toast `delete.restored` (3 s, no action).
- Toast hovered or focused: The 8 s pause (Basecoat).
- Delete failed: The row comes back; an error toast `delete.failed` (`data-category="error"`).
- Offline (no-server app): Works: it's local. Web app: the button is disabled while offline.
- Deleted from its DetailView: Go to the list, then show the toast there.

## Texts
(Key | English | 日本語)
- `delete.button`: Delete | 削除
- `delete.row_label`: Delete “{title}” | 「{title}」を削除
- `delete.done`: Note deleted | ノートを削除しました
- `delete.done_many`: {count} notes deleted | {count} 件のノートを削除しました
- `delete.done_text`: “{title}” is in Trash for 30 days. | 「{title}」はゴミ箱に30日間保管されます。
- `delete.undo`: Undo | 元に戻す
- `delete.restored`: Note restored | ノートを元に戻しました
- `delete.failed`: Couldn’t delete the note. It’s back in the list. | ノートを削除できませんでした。一覧に戻しました。

## Keyboard and focus
- The delete button is in each row after its other controls. After deleting, focus moves to the next row's delete button (or the previous one if it was last; or the list's heading if the list is now empty).
- Undo is reachable by Tab (the toaster is the last thing in the page) and by ⌘Z / Ctrl Z while the toast is shown, when focus is not in a text field.

## Phone
- The toast sits at the bottom, full width, above the BottomBar and the home indicator. Undo is 44 px (App foundations).
- A swipe to delete on a row is allowed only if the delete button also exists.

## Data
```json
{"deleted": [{"id": 42, "title": "Week 3 · Vocabulary"}], "undo_until": "2026-10-18T14:02:08+09:00", "trash_days": 30}
```

- Web: `DELETE /notes/42` → 200 with an out-of-band toast; `POST /notes/42/restore` → 200 with the refreshed list. A nightly job removes rows with `deleted_at` older than 30 days.
- No server: `store.trash(id)` moves the record to a `trash` store with `deleted_at`; `store.restore(id)` moves it back.

## Don't
- Don't ask “Are you sure?” before a delete that has Undo.
- Don't make the toast disappear in under 6 seconds.
- Don't offer Undo for something that is really gone.

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> DeleteUndo` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
