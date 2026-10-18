# DeleteAccount

App Block card (Accounts). Delete the account for good: say plainly what happens to the data, offer a copy first, confirm with the password, and allow cancelling for 30 days.

- Basecoat: `card`, `alert`, `field`, `label`, `input`, `btn`
- Route: `/settings/account/delete`; after deleting, `/goodbye`
- Needs: Web: `GET /account/export`, `POST /account/delete`, `POST /account/delete/cancel`. Needs a server
- Links to: AccountSettings (comes from), LogIn

## Markup
Copy, never retype: `{harness}/kit/blocks/accounts/DeleteAccount.html` (32 lines of HTML).

Logging in during the 30 days shows, instead of the app:

Copy, never retype: `{harness}/kit/blocks/accounts/DeleteAccount.2.html` (10 lines of HTML).

## States
- Default: As above; Delete My Account is enabled; the password field is empty.
- Password empty or wrong: `aria-invalid="true"` + `delete.error.password` under the field; nothing happens.
- Deleting: Submit `disabled` + `aria-busy="true"`, `delete.deleting`.
- Done: Logged out, redirect to `/goodbye`: a card with `delete.done.title` / `delete.done.body` (with the date) and Log In to Cancel.
- Pending (logged in again): The pending card replaces the app until cancelled or logged out.
- Cancelled: Back to the app; a toast `delete.cancelled`.
- Owner of a shared space: Before the form, `alert` `data-variant="destructive"` titled `delete.owner_title` with `delete.owner` and a link to Roles; the submit is `disabled` until ownership is passed on.
- Export preparing: The download button `aria-busy="true"`, `delete.export.preparing`; the file downloads when ready (up to a minute).

## Texts
(Key | English | 日本語)
- `delete.back`: Back to Account | アカウントに戻る
- `delete.title`: Delete your account? | アカウントを削除しますか？
- `delete.lede`: Here is what happens. Read it before you decide. | 削除すると次のようになります。決める前にお読みください。
- `delete.what.now`: You’re logged out everywhere now, and nobody can see your profile. | すぐにすべてのデバイスからログアウトされ、プロフィールは誰からも見えなくなります。
- `delete.what.wait`: For 30 days, until {date}, you can log in and cancel. Nothing is lost yet. | {date} までの30日間はログインしてキャンセルできます。この間はデータは失われません。
- `delete.what.after`: After that, your notes, pictures and comments are deleted for good. They can’t be brought back. | その後、ノート・画像・コメントは完全に削除され、元に戻せません。
- `delete.what.shared`: Pages you shared with others are deleted too. Copies they made stay theirs. | 共有したページも削除されます。相手が作成したコピーは残ります。
- `delete.what.kept`: We keep invoices for 7 years because the law requires it. Nothing else. | 法律により請求書のみ7年間保管します。それ以外は保管しません。
- `delete.export.title`: Want a copy first? | 先にコピーを保存しますか？
- `delete.export.body`: Download everything as a ZIP of JSON and your original files. | すべてのデータを JSON と元のファイルの ZIP でダウンロードできます。
- `delete.export.action`: Download My Data | データをダウンロード
- `delete.export.preparing`: Preparing… | 準備中…
- `delete.password`: Enter your password to confirm | 確認のためパスワードを入力してください
- `delete.submit`: Delete My Account | アカウントを削除
- `delete.deleting`: Deleting… | 削除中…
- `delete.error.password`: Enter your current password. | 現在のパスワードを入力してください。
- `delete.done.title`: Your account is scheduled for deletion | アカウントの削除を予約しました
- `delete.done.body`: It will be deleted on {date}. Log in before then to cancel. | {date} に削除されます。それまでにログインするとキャンセルできます。
- `delete.done.login`: Log In to Cancel | ログインしてキャンセル
- `delete.pending.title`: Your account will be deleted on {date} | アカウントは {date} に削除されます
- `delete.pending.body`: Cancel now to keep everything as it was. | 今キャンセルすると、すべてそのまま残ります。
- `delete.pending.cancel`: Keep My Account | アカウントを残す
- `delete.cancelled`: Your account is kept. Welcome back. | アカウントを残しました。おかえりなさい。
- `delete.owner_title`: Pass on ownership first | 先にオーナーを引き継いでください
- `delete.owner`: You own “{space}”. Make someone else its owner before deleting your account. | 「{space}」のオーナーです。アカウントを削除する前に、別のメンバーをオーナーにしてください。
- `common.cancel`: Cancel | キャンセル
- `logout.action`: Log Out | ログアウト

## Keyboard and focus
1. Back to Account → 2. Download My Data → 3. Password → 4. Cancel → 5. Delete My Account.
- Focus starts on the heading so the list is read first. Return in the password field submits.
- Cancel is before Delete in the Tab order; neither is the default on Return outside the field.

## Phone
- One column; the two footer buttons wrap to full width (Delete under Cancel). 44 px targets.
- Download My Data saves a file through the browser's download; on iPhone it opens the Files sheet.

## Data
```json
{"request": {"password": "••••••••••"},
 "ok": {"delete_on": "2026-11-17", "redirect": "/goodbye"},
 "error": {"code": "wrong_password | owner_of_space", "spaces": ["Class 3B"]}}
```

- Web: `POST /account/delete` checks the password, marks the account `delete_on = today + 30 days`, ends all sessions, emails a confirmation with a cancel link; a daily job deletes accounts past their date (files, rows, search index, backups rotate out within 35 days). `GET /account/export` streams a ZIP.

## Don't
- Don't make the person type "DELETE"; the password is the confirmation.
- Don't hide the 30-day window or the kept invoices.
- Don't delete on a single click from AccountSettings.

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> DeleteAccount` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
