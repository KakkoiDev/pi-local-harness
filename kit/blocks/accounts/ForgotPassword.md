# ForgotPassword

App Block card (Accounts). Reset a forgotten password in two steps: ask for the email, then set a new password from the link in that email.

- Basecoat: `card`, `field`, `label`, `input`, `btn`, `alert`
- Route: Step 1 `/forgot-password`; step 2 `/reset-password?token=…` (from the email); then LogIn with `?reset=1`
- Needs: Web: `POST /forgot-password`, `POST /reset-password`, an email sender. Needs a server
- Links to: LogIn

## Markup
Step 1, ask for the email:

Copy, never retype: `{harness}/kit/blocks/accounts/ForgotPassword.html` (18 lines of HTML).

Step 1, sent (replaces the form; same text whether or not the email has an account):

Copy, never retype: `{harness}/kit/blocks/accounts/ForgotPassword.2.html` (10 lines of HTML).

Step 2, the reset form opened from the email:

Copy, never retype: `{harness}/kit/blocks/accounts/ForgotPassword.3.html` (17 lines of HTML).

## States
- Step 1 empty: Focus in Email.
- Email invalid: `aria-invalid="true"` + `login.error.email_invalid` under the input.
- Sending: Submit `disabled` + `aria-busy="true"`, text `forgot.sending`.
- Sent: `#forgot-sent` replaces the form; focus on its heading. Send Again is disabled for 60 s, its text `forgot.sent.wait` counts down.
- Step 2 link expired or used: The card shows an `alert` `data-variant="destructive"` titled `reset.error.title` with `reset.expired` and one button Send a New Link → `/forgot-password`.
- Step 2 password too short: `signup.error.password_short` under the field.
- Saved: Redirect to `/login?reset=1`; LogIn shows an `alert` (default variant, `role="status"`) titled `reset.done_title` with `reset.done` above the fields.
- Offline: An `alert` `data-variant="destructive"` with `forgot.offline`; nothing is sent.

## Texts
(Key | English | 日本語)
- `forgot.title`: Reset Your Password | パスワードの再設定
- `forgot.lede`: Enter the email you signed up with. We’ll send you a link to set a new password. | 登録したメールアドレスを入力してください。新しいパスワードを設定するリンクをお送りします。
- `forgot.email`: Email | メールアドレス
- `forgot.submit`: Send Reset Link | 再設定リンクを送信
- `forgot.sending`: Sending… | 送信中…
- `forgot.back`: Back to Log In | ログインに戻る
- `forgot.sent.title`: Check your email | メールをご確認ください
- `forgot.sent.body`: If {email} has an account, a reset link is on its way. It works for 1 hour. | {email} のアカウントがあれば、再設定リンクをお送りしました。有効期限は1時間です。
- `forgot.sent.resend`: Send Again | もう一度送信
- `forgot.sent.wait`: Send Again in {seconds} s | {seconds} 秒後に再送信できます
- `forgot.offline`: You’re offline. Connect to the internet to get a reset link. | オフラインです。再設定リンクを受け取るにはインターネットに接続してください。
- `reset.title`: Choose a New Password | 新しいパスワードを設定
- `reset.lede`: For {email}. You’ll be logged out on your other devices. | {email} のパスワードです。他のデバイスではログアウトされます。
- `reset.password`: New password | 新しいパスワード
- `reset.submit`: Save New Password | 新しいパスワードを保存
- `reset.expired`: This link has expired or was already used. Ask for a new one. | このリンクは期限切れか、すでに使用されています。新しいリンクをリクエストしてください。
- `reset.new_link`: Send a New Link | 新しいリンクを送信
- `reset.error.title`: Couldn’t reset your password | パスワードを再設定できませんでした
- `reset.done_title`: Password changed | パスワードを変更しました
- `reset.done`: Your password is changed. Log in with the new one. | パスワードを変更しました。新しいパスワードでログインしてください。

## Keyboard and focus
1. Email → 2. Send Reset Link → 3. Back to Log In. Return submits.
- After sending, focus moves to “Check your email” (`tabindex="-1"` on the heading).
- Step 2: focus starts in New password; Return saves.

## Phone
- Same single card; 44 px fields and buttons. The emailed link opens step 2 in the phone's browser or the installed app.
- Don't ask to type the password twice; the phone's password manager offers a strong one with `autocomplete="new-password"`.

## Data
```json
{"step1": {"request": {"email": "aiko@example.com"}, "ok": {"sent": true}},
 "step2": {"request": {"token": "f3c9…", "password": "••••••••••"}, "ok": {"redirect": "/login?reset=1"},
           "error": {"code": "expired | used | invalid"}}}
```

- Web: `POST /forgot-password` always answers 200 with the sent state (never reveals if the email exists); store a hashed single-use token, 1 hour; rate limit 3 per email per hour. `POST /reset-password` checks the token, saves the hash, deletes every session of the account, 303 to `/login?reset=1`.

## Don't
- Don't say "No account with that email".
- Don't log the person in automatically after the reset.
- Don't put the token anywhere but the hidden field (not in a cookie or the page title).

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> ForgotPassword` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
