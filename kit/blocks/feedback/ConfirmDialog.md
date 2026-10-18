# ConfirmDialog

App Block card (Feedback). Ask before an action that can't be undone or that affects other people: a title that is the question, what will happen, and two buttons named by their actions.

- Basecoat: `alert-dialog` (`<dialog>`), `btn`
- Needs: Nothing; the confirm button runs the action (form post or JS)
- Used in: LogOut (unsaved changes), Profile (remove picture), Roles (remove member), DeleteUndo (when undo is impossible), Kanban, Invite

## Markup
Copy, never retype: `{harness}/kit/blocks/feedback/ConfirmDialog.html` (16 lines of HTML).

With a picture (only when it helps recognise the thing):

Copy, never retype: `{harness}/kit/blocks/feedback/ConfirmDialog.2.html` (5 lines of HTML).

Small (one short sentence, phone-first): `<dialog class="alert-dialog" data-size="sm" …>`; its two buttons sit side by side.

## States
- Closed: Not rendered on screen; the trigger's label ends with `…`.
- Open: `showModal()`: a dimmed backdrop, focus on Cancel (`autofocus`). The page behind can't be used.
- Working: Confirm button `disabled` + `aria-busy="true"`, text `confirm.working`; Cancel stays enabled until the request is sent.
- Failed: Inside the dialog, under the header: `<p class="text-destructive text-sm" role="alert">` with what failed; the confirm button becomes enabled again.
- Done: The dialog closes; the result shows where it happened (the item disappears, a toast). Focus goes to the next sensible element (the next list item, or the trigger if it still exists).
- Destructive vs not: The confirm button is `data-variant="destructive"` only when something is deleted or lost; otherwise the default `btn`.

## Texts
(Key | English | 日本語)
- `class.leave`: Leave Class… | クラスを退出…
- `confirm.leave.title`: Leave “{name}”? | 「{name}」を退出しますか？
- `confirm.leave.body`: You’ll lose access to its {count} shared notes. A teacher can invite you again. | 共有されている {count} 件のノートが見られなくなります。先生が再度招待できます。
- `confirm.leave.confirm`: Leave Class | 退出する
- `confirm.delete.title`: Delete “{name}”? | 「{name}」を削除しますか？
- `confirm.delete.body`: It’s deleted for everyone in the class. This can’t be undone. | クラスの全員から削除されます。元に戻せません。
- `confirm.delete.confirm`: Delete Note | ノートを削除
- `confirm.working`: Working… | 処理中…
- `confirm.failed`: Couldn’t finish. Nothing was changed. Try again. | 完了できませんでした。何も変更されていません。もう一度お試しください。
- `common.cancel`: Cancel | キャンセル

## Keyboard and focus
1. Cancel (focused when the dialog opens) → 2. the confirm button. Tab stays inside the dialog.
- Esc and Cancel close without doing anything; Return activates the focused button (so Return alone never confirms).
- On close, focus returns to the trigger (or the next item if the trigger is gone).

## Phone
- The dialog is centred with 16 px margins; buttons stack full width below `sm`, the confirm button on top of Cancel (Basecoat's `flex-col-reverse`), each 44 px.
- `data-size="sm"` keeps two buttons side by side for short questions.

## Data
```json
{"action": "POST /classes/c_3b/leave", "name": "Class 3B", "count": 42}
```

- Web: the confirm button is a form post (or `hx-post` with `hx-target` on the list item and `hx-swap="delete"`); answer 204 or the updated fragment; on 4xx/5xx swap the error line into the dialog.
- No server: the confirm button's handler awaits the store, then closes the dialog.

## Don't
- Don't title it "Are you sure?" or label the buttons Yes/No/OK.
- Don't ask before actions that DeleteUndo can undo; use the toast with Undo instead.
- Don't put a checkbox "Don't ask again" on destructive confirmations.

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> ConfirmDialog` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
