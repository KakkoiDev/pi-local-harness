# AccountSettings

App Block card (Accounts). The account's own settings: change the email, change the password, see and end sessions on other devices, and the way to delete the account.

- Basecoat: `card`, `field`, `label`, `input`, `btn`, `item`, `item-group`, `badge`, `alert`
- Route: `/settings/account` (a section of SettingsPage)
- Needs: Web: `POST /account/email`, `POST /account/password`, `GET /account/sessions`, `POST /logout?session=…`, `POST /logout?all=1`. Needs a server
- Links to: SettingsPage, EmailConfirm (new email), LogOut, DeleteAccount, Profile

## Markup
Copy, never retype: `{harness}/kit/blocks/accounts/AccountSettings.html` (73 lines of HTML).

## States
- Loaded (default): As above, one card per task, each with its own button.
- Email sent: The email card's footer shows an `alert` (default, `role="status"`) titled `account.email.sent_title` with `account.email.sent`; the current email is unchanged until the link is opened (EmailConfirm).
- Email taken: `aria-invalid="true"` + `account.email.taken` under the field.
- Wrong current password: `aria-invalid="true"` on Current password + `account.password.wrong`.
- Password changed: The fields empty; `alert` `account.password.done`. Other sessions end; this one stays.
- Session ended: The row disappears; a toast `account.sessions.ended` (Toasts).
- Sessions loading: Two `skeleton h-12` rows in place of the items.
- Offline: Each button `disabled`; an InlineAlert at the top: `account.offline`.

## Texts
(Key | English | 日本語)
- `account.title`: Account | アカウント
- `account.email.title`: Email | メールアドレス
- `account.email.lede`: We’ll send a link to the new address. The change happens when you open it. | 新しいアドレスにリンクを送信します。リンクを開くと変更されます。
- `account.email.new`: New email | 新しいメールアドレス
- `account.email.submit`: Send Confirmation Link | 確認リンクを送信
- `account.email.sent`: Link sent to {email}. Your email changes when you open it. | {email} にリンクを送信しました。開くとメールアドレスが変わります。
- `account.email.sent_title`: Check your new email | 新しいメールをご確認ください
- `account.email.taken`: That email already has an account. | このメールアドレスはすでに使われています。
- `account.password.title`: Password | パスワード
- `account.password.current`: Current password | 現在のパスワード
- `account.password.new`: New password | 新しいパスワード
- `account.password.submit`: Change Password | パスワードを変更
- `account.password.wrong`: That isn’t your current password. | 現在のパスワードが正しくありません。
- `account.password.done`: Password changed. Your other devices were logged out. | パスワードを変更しました。他のデバイスはログアウトされました。
- `account.sessions.title`: Where you’re logged in | ログイン中のデバイス
- `account.sessions.this`: This device | このデバイス
- `account.sessions.active`: Active now | 使用中
- `account.sessions.end`: Log Out | ログアウト
- `account.sessions.end_all`: Log Out Everywhere Else | 他のすべてのデバイスからログアウト
- `account.sessions.ended`: Logged out on {device}. | {device} からログアウトしました。
- `account.delete.title`: Delete account | アカウントの削除
- `account.delete.lede`: Deletes your account and everything in it after 30 days. You can cancel until then. | 30日後にアカウントとすべてのデータを削除します。それまではキャンセルできます。
- `account.delete.open`: Delete Account… | アカウントを削除…
- `account.offline`: You’re offline. Account changes need a connection. | オフラインです。アカウントの変更には接続が必要です。

## Keyboard and focus
1. New email → 2. Send Confirmation Link → 3. Current password → 4. New password → 5. Change Password → 6. each session's Log Out → 7. Log Out Everywhere Else → 8. Delete Account….
- Return in a field submits only that card's form.
- After a result, focus moves to that card's message (`tabindex="-1"`).

## Phone
- One column of cards with 16 px sides. Session rows wrap: the Log Out button goes under the device name when it doesn't fit.
- Buttons are 44 px. The delete card stays last, after a gap.

## Data
```json
{"email": "aiko@example.com", "pending_email": null,
 "sessions": [{"id": "s_71a", "device": "Safari on iPhone", "place": "Osaka", "last_seen": "2026-10-18T14:30:00+09:00", "current": true},
              {"id": "s_92f", "device": "Chrome on Mac", "place": "Kyoto", "last_seen": "2026-10-17T21:04:00+09:00", "current": false}]}
```

- Web: each form posts to its endpoint and gets its card fragment back (`hx-post`, `hx-target="this"`, `hx-swap="outerHTML"`); 422 with field errors, 403 for a wrong current password.
- Places come from the IP's city, best effort; show nothing when unknown.

## Don't
- Don't put the profile picture or display name here (Profile).
- Don't change the email immediately without the link.
- Don't make Delete Account… a button that deletes: it opens DeleteAccount.

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> AccountSettings` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
