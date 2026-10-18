# InlineAlert

App Block card (Feedback). A message that stays in the page next to what it is about: information, a warning, or an error that blocks the task, with at most one action.

- Basecoat: `alert` (default and `data-variant="destructive"`), `btn`
- Needs: Nothing
- Used in: LogIn, SignUp, ForgotPassword, AccountSettings, DeleteAccount, ErrorRetry, EditForm, Checkout

## Markup
Copy, never retype: `{harness}/kit/blocks/feedback/InlineAlert.html` (16 lines of HTML).

Kinds by what the person must do:

(Kind | Markup | Role)
- Information: `alert` + info icon | `role="status"`
- Warning (they may go on): `alert` + triangle icon, title says the risk | `role="status"`
- Error (they can't go on): `alert data-variant="destructive"` + alert-circle icon | `role="alert"`
- Success after a page load: `alert` + check icon | `role="status"`

## States
- Shown: The alert is in the page where the problem is: above the form for a form-wide error, at the top of a list for a list-wide one.
- With a list: `section` holds a `p` and a `ul` of what's wrong (max 5 items, then `alert.more`).
- With an action: One `btn` `data-size="sm"` in `<div class="mt-2">` at the end of `section`: Try Again, Choose Another File, Go to Settings.
- Dismissible: Only for information: the alert gets `relative pe-10` and, last inside it, `<button class="btn absolute top-2 end-2" data-variant="ghost" data-size="icon-sm" type="button" aria-label="Dismiss">` with an × icon (label `common.dismiss`); the choice is remembered. Errors are never dismissible; they go away when fixed.
- Fixed: Remove the alert (or set `hidden`) once the cause is gone.
- Long text: Wraps; keep the title one line, the body two or three.

## Texts
(Key | English | 日本語)
- `alert.shared.title`: This page is shared with your class | このページはクラスで共有されています
- `alert.shared.body`: Everyone in {group} can see and comment on it. | {group} の全員が閲覧・コメントできます。
- `alert.import.title`: Couldn’t import “{file}” | 「{file}」を読み込めませんでした
- `alert.import.body`: {count} rows have no title. Fix them and import again: | {count} 行にタイトルがありません。修正してから再度読み込んでください：
- `alert.import.retry`: Choose Another File | 別のファイルを選ぶ
- `alert.storage.title`: Storage almost full | 保存容量がまもなくいっぱいです
- `alert.storage.body`: You’ve used 4.6 of 5 GB. Delete old files or upgrade to keep uploading. | 5 GB 中 4.6 GB を使用しています。アップロードを続けるには古いファイルを削除するか、アップグレードしてください。
- `alert.storage.action`: Manage Files | ファイルを管理
- `alert.more`: and {count} more | ほか {count} 件
- `common.dismiss`: Dismiss | 閉じる

## Keyboard and focus
- An alert shown because of the person's action (submit, import) receives focus: give it `tabindex="-1"` and call `.focus()`; `role="alert"` also announces it.
- Alerts present on page load are not focused; they are read in page order.
- The action button follows the alert's text in the Tab order.

## Phone
- Full width of its container; the icon stays at the start of the title line.
- The action button is 44 px tall (App foundations) and wraps under the text.

## Data
```json
{"kind": "error", "title": "Couldn’t import “notes.csv”", "body": "3 rows have no title.", "items": ["Row 4", "Row 9", "Row 12"], "action": {"label": "Choose Another File", "href": "#import"}}
```

- Web: render the alert in the fragment that answers the action (status 422 for validation, 409 for a conflict).
- No server: insert it from the module that ran the action.

## Don't
- Don't put the action in the alert's `<footer>`: Basecoat pins the footer to the top right with room for one short word, so longer labels and Japanese overlap the text.
- Don't use red for warnings or information: only for errors that stop the task.
- Don't stack several alerts; merge them into one with a list.
- Don't write "Error:" or "Oops"; the title says what failed.

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> InlineAlert` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
