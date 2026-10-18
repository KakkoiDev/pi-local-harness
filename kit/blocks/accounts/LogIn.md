# LogIn

App Block card (Accounts). Log in with an email and a password, with the ways to sign up and to reset a forgotten password.

- Basecoat: `card`, `field`, `label`, `input`, `btn`, `alert`
- Route: `/login`; after logging in, the page the person came from (`?next=`), else `/`
- Needs: Web: `POST /login`. No server: not available (needs a server; the capability turns on the Web app package)
- Links to: SignUp, ForgotPassword

## Markup
Copy, never retype: `{harness}/kit/blocks/accounts/LogIn.html` (36 lines of HTML).

## States
- Empty (default): As above. Focus starts in Email.
- Field error: The field gets `aria-invalid="true"` and, under its input, `<p class="text-destructive text-sm" id="login-email-error">` with the message; the input gets `aria-describedby="login-email-error"`. Shown on submit, cleared when the field changes.
- Sending: The submit button gets `disabled` and `aria-busy="true"`; its text becomes `login.sending`. The fields stay editable.
- Wrong email or password: `#login-error` loses `hidden`; focus moves to it. The password field is emptied; the email is kept. Never say which of the two was wrong.
- Too many tries: `#login-error` shows `login.error.locked` with the minutes left; the submit button is disabled until then.
- Offline: `#login-error` shows `login.error.offline`; nothing is sent.
- Success: Go to `next` (only a path on this site; anything else becomes `/`).

## Texts
(Key | English | 日本語)
- `login.title`: Log In | ログイン
- `login.lede`: Welcome back. Log in to see your notes. | おかえりなさい。ログインしてノートを表示します。
- `login.email`: Email | メールアドレス
- `login.password`: Password | パスワード
- `login.forgot`: Forgot your password? | パスワードをお忘れですか？
- `login.remember`: Keep me logged in on this device | このデバイスでログインしたままにする
- `login.submit`: Log In | ログイン
- `login.sending`: Logging In… | ログイン中…
- `login.no_account`: No account yet? | アカウントをお持ちでない場合
- `login.signup`: Sign Up | 新規登録
- `login.error.title`: Couldn’t log you in | ログインできませんでした
- `login.error.wrong`: The email or password is wrong. Check both and try again. | メールアドレスまたはパスワードが正しくありません。両方を確認して、もう一度お試しください。
- `login.error.locked`: Too many tries. Try again in {minutes} minutes. | 試行回数が多すぎます。{minutes} 分後にもう一度お試しください。
- `login.error.offline`: You’re offline. Connect to the internet to log in. | オフラインです。ログインするにはインターネットに接続してください。
- `login.error.email_empty`: Enter your email. | メールアドレスを入力してください。
- `login.error.email_invalid`: Enter an email like name@example.com. | name@example.com の形式で入力してください。
- `login.error.password_empty`: Enter your password. | パスワードを入力してください。

## Keyboard and focus
1. Email → 2. Password → 3. Forgot your password? → 4. Keep me logged in → 5. Log In → 6. Sign Up.
- Return in either field submits. Focus starts in Email (`autofocus` on `#login-email`).
- After an error, focus goes to `#login-error` (give it `tabindex="-1"`), or to the first invalid field for field errors.

## Phone
- Below 48rem the card fills the width (`max-w-sm` still caps it) and the page keeps 16 px sides (`p-4`).
- Every input and the button are 44 px tall (App foundations). The email field uses `type="email"` so the keyboard shows @.
- The page scrolls when the keyboard covers the button; nothing is fixed to the bottom.

## Data
```json
{"request": {"email": "aiko@example.com", "password": "••••••••", "remember": true, "next": "/notes"},
 "ok": {"redirect": "/notes"},
 "error": {"code": "wrong_credentials | locked | invalid", "minutes": 12, "fields": {"email": "login.error.email_invalid"}}}
```

- Web (FastAPI + htmx): `POST /login` with the form fields; on success `HX-Redirect: <next>`; on failure re-render the form fragment with the state above and status 422 (field errors) or 401 (wrong credentials) or 429 (locked).
- Sessions: an HTTP-only, `SameSite=Lax` cookie; “Keep me logged in” sets 30 days, otherwise the browser session.

## Don't
- Don't say whether the email exists.
- Don't put a show-password button unless it is a `button type="button"` with `aria-pressed` and the label `login.show_password` (“Show password” / “パスワードを表示”).
- Don't add social logins, captchas or a remember-me checkbox in another place: they are separate blocks when needed.

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> LogIn` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
