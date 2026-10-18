# EmailConfirm

App Block card (Accounts). Confirm a new account's email: the page that waits for the link, and the page the link opens.

- Basecoat: `card`, `btn`, `alert`, `empty`
- Route: Waiting `/confirm-email?email=…`; the link `/confirm-email/{token}`
- Needs: Web: `POST /confirm-email/resend`, `GET /confirm-email/{token}`, an email sender. Needs a server
- Links to: SignUp (comes from), LogIn, AccountSettings (changing the email uses the same link)

## Markup
Waiting for the person to open the email:

Copy, never retype: `{harness}/kit/blocks/accounts/EmailConfirm.html` (20 lines of HTML).

The page the link opens, confirmed:

Copy, never retype: `{harness}/kit/blocks/accounts/EmailConfirm.2.html` (7 lines of HTML).

## States
- Waiting (default): As above. The page checks every 10 s (`hx-get="/confirm-email/status" hx-trigger="every 10s"`) and moves on by itself when the link was opened on another device.
- Resent: `#confirm-status` reads `confirm.resent`; the resend button is `disabled` for 60 s with `confirm.resend_wait`.
- Confirmed: The second card; the person is logged in. Focus on its heading.
- Link expired or used: A card with `alert` `data-variant="destructive"`: `confirm.expired.title` / `confirm.expired.body` and Send a New Link (`confirm.resend`).
- Already confirmed: The confirmed card with `confirm.already` instead of `confirm.done.body`.
- Offline: `#confirm-status` reads `confirm.offline`; the resend button is disabled.

## Texts
(Key | English | 日本語)
- `confirm.title`: Confirm your email | メールアドレスの確認
- `confirm.body_before`: We sent a link to | 確認リンクを送信しました：
- `confirm.body_after`: Open it on any device to finish. | どのデバイスで開いても完了できます。
- `confirm.resend`: Send the Email Again | メールを再送信
- `confirm.resend_wait`: Send Again in {seconds} s | {seconds} 秒後に再送信できます
- `confirm.resent`: Sent. Check your spam folder too. | 送信しました。迷惑メールフォルダもご確認ください。
- `confirm.wrong_email`: Wrong Email? Start Over | メールアドレスを間違えた場合はやり直す
- `confirm.done.title`: Email confirmed | 確認が完了しました
- `confirm.done.body`: Your account is ready. | アカウントの準備ができました。
- `confirm.done.continue`: Continue | 続ける
- `confirm.already`: This email was already confirmed. | このメールアドレスはすでに確認済みです。
- `confirm.expired.title`: This link no longer works | このリンクは使用できません
- `confirm.expired.body`: It expired after 24 hours or was already used. Send a new one. | 24時間で期限切れになったか、すでに使用されています。新しいリンクを送信してください。
- `confirm.offline`: You’re offline. The email can be sent again when you’re back online. | オフラインです。オンラインに戻ると再送信できます。

## Keyboard and focus
1. Send the Email Again → 2. Wrong Email? Start Over.
- Focus starts on the heading (`tabindex="-1"`) so screen readers read the email address.
- After resending, focus stays on the button; `#confirm-status` announces the result.

## Phone
- The card fills the width; the two buttons are 44 px and stacked.
- Mail apps open the link in the default browser: the confirmed page must work without an existing session cookie (the token logs the person in).

## Data
```json
{"waiting": {"email": "aiko@example.com", "confirmed": false},
 "link": {"token": "8a1e…", "ok": {"confirmed": true, "redirect": "/"}, "error": {"code": "expired | used"}}}
```

- Web: `GET /confirm-email/{token}` marks the email confirmed, starts a session, renders the confirmed card. `POST /confirm-email/resend` 202, rate limit 3 per hour. `GET /confirm-email/status` returns 286 (htmx stop polling) with `HX-Redirect: /` once confirmed.
- Tokens: single use, hashed, 24 hours.

## Don't
- Don't ask for a 6-digit code as well as the link; pick the link.
- Don't block the person from logging in forever: after 24 h an unconfirmed account can log in and sees this page again.
- Don't show the email of someone else's account on the expired page.

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> EmailConfirm` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
