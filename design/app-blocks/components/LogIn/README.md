# LogIn

Log in with an email and a password, with the ways to sign up and to reset a forgotten password.

| | |
| --- | --- |
| Group | Accounts |
| Basecoat | `card`, `field`, `label`, `input`, `btn`, `alert` |
| Route | `/login`; after logging in, the page the person came from (`?next=`), else `/` |
| Needs | Web: `POST /login`. No server: not available (needs a server; the capability turns on the Web app package) |
| Links to | SignUp, ForgotPassword |

## Markup

```html
<main class="app grid min-h-dvh place-items-center bg-muted/40 p-4">
  <form id="login-form" class="card w-full max-w-sm" method="post" action="/login" novalidate>
    <header>
      <h1 class="text-xl font-semibold" data-t="login.title">Log In</h1>
      <p class="text-muted-foreground text-sm" data-t="login.lede">Welcome back. Log in to see your notes.</p>
    </header>
    <section class="grid gap-4">
      <div id="login-error" class="alert" data-variant="destructive" role="alert" hidden>
        <h2 data-t="login.error.title">Couldn’t log you in</h2>
        <section data-t="login.error.wrong">The email or password is wrong. Check both and try again.</section>
      </div>
      <div class="field">
        <label class="label" for="login-email" data-t="login.email">Email</label>
        <input class="input" id="login-email" name="email" type="email" autocomplete="email" required>
      </div>
      <div class="field">
        <div class="flex items-center justify-between gap-2">
          <label class="label" for="login-password" data-t="login.password">Password</label>
          <a class="text-sm underline-offset-4 hover:underline" href="/forgot-password" data-t="login.forgot">Forgot your password?</a>
        </div>
        <input class="input" id="login-password" name="password" type="password" autocomplete="current-password" required>
      </div>
      <label class="label gap-2 font-normal">
        <input class="input" type="checkbox" name="remember" value="1" checked>
        <span data-t="login.remember">Keep me logged in on this device</span>
      </label>
    </section>
    <footer class="grid gap-3">
      <button class="btn w-full" type="submit" data-t="login.submit">Log In</button>
      <p class="text-muted-foreground text-center text-sm">
        <span data-t="login.no_account">No account yet?</span>
        <a class="text-foreground underline underline-offset-4" href="/signup" data-t="login.signup">Sign Up</a>
      </p>
    </footer>
  </form>
</main>
```

## States

| State | What changes |
| --- | --- |
| Empty (default) | As above. Focus starts in Email. |
| Field error | The field gets `aria-invalid="true"` and, under its input, `<p class="text-destructive text-sm" id="login-email-error">` with the message; the input gets `aria-describedby="login-email-error"`. Shown on submit, cleared when the field changes. |
| Sending | The submit button gets `disabled` and `aria-busy="true"`; its text becomes `login.sending`. The fields stay editable. |
| Wrong email or password | `#login-error` loses `hidden`; focus moves to it. The password field is emptied; the email is kept. Never say which of the two was wrong. |
| Too many tries | `#login-error` shows `login.error.locked` with the minutes left; the submit button is disabled until then. |
| Offline | `#login-error` shows `login.error.offline`; nothing is sent. |
| Success | Go to `next` (only a path on this site; anything else becomes `/`). |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `login.title` | Log In | ログイン |
| `login.lede` | Welcome back. Log in to see your notes. | おかえりなさい。ログインしてノートを表示します。 |
| `login.email` | Email | メールアドレス |
| `login.password` | Password | パスワード |
| `login.forgot` | Forgot your password? | パスワードをお忘れですか？ |
| `login.remember` | Keep me logged in on this device | このデバイスでログインしたままにする |
| `login.submit` | Log In | ログイン |
| `login.sending` | Logging In… | ログイン中… |
| `login.no_account` | No account yet? | アカウントをお持ちでない場合 |
| `login.signup` | Sign Up | 新規登録 |
| `login.error.title` | Couldn’t log you in | ログインできませんでした |
| `login.error.wrong` | The email or password is wrong. Check both and try again. | メールアドレスまたはパスワードが正しくありません。両方を確認して、もう一度お試しください。 |
| `login.error.locked` | Too many tries. Try again in {minutes} minutes. | 試行回数が多すぎます。{minutes} 分後にもう一度お試しください。 |
| `login.error.offline` | You’re offline. Connect to the internet to log in. | オフラインです。ログインするにはインターネットに接続してください。 |
| `login.error.email_empty` | Enter your email. | メールアドレスを入力してください。 |
| `login.error.email_invalid` | Enter an email like name@example.com. | name@example.com の形式で入力してください。 |
| `login.error.password_empty` | Enter your password. | パスワードを入力してください。 |

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
