# SignUp

Create an account with a name, an email and a password, then confirm the email.

| | |
| --- | --- |
| Group | Accounts |
| Basecoat | `card`, `field`, `label`, `input`, `btn`, `alert` |
| Route | `/signup`; after creating the account, EmailConfirm (`/confirm-email`) |
| Needs | Web: `POST /signup`. Needs a server (the Log in and accounts capability turns on the Web app package) |
| Links to | LogIn, EmailConfirm |

## Markup

```html
<main class="app grid min-h-dvh place-items-center bg-muted/40 p-4">
  <form id="signup-form" class="card w-full max-w-sm" method="post" action="/signup" novalidate>
    <header>
      <h1 class="text-xl font-semibold" data-t="signup.title">Create an Account</h1>
      <p class="text-muted-foreground text-sm" data-t="signup.lede">It takes a minute. We’ll send you an email to confirm it’s you.</p>
    </header>
    <section class="grid gap-4">
      <div id="signup-error" class="alert" data-variant="destructive" role="alert" tabindex="-1" hidden>
        <h2 data-t="signup.error.title">Couldn’t create your account</h2>
        <section id="signup-error-text" data-t="signup.error.taken">That email already has an account. Log in instead, or reset your password.</section>
      </div>
      <div class="field">
        <label class="label" for="signup-name" data-t="signup.name">Your name</label>
        <input class="input" id="signup-name" name="name" type="text" autocomplete="name" required maxlength="80">
      </div>
      <div class="field">
        <label class="label" for="signup-email" data-t="signup.email">Email</label>
        <input class="input" id="signup-email" name="email" type="email" autocomplete="email" required>
      </div>
      <div class="field">
        <label class="label" for="signup-password" data-t="signup.password">Password</label>
        <input class="input" id="signup-password" name="password" type="password" autocomplete="new-password" minlength="10" required aria-describedby="signup-password-help">
        <p class="text-muted-foreground text-sm" id="signup-password-help" data-t="signup.password_help">At least 10 characters. A short sentence is easy to remember.</p>
      </div>
      <label class="label gap-2 font-normal items-start">
        <input class="input mt-0.5" type="checkbox" name="terms" value="1" required>
        <span><span data-t="signup.terms_before">I agree to the</span> <a class="underline underline-offset-4" href="/terms" data-t="signup.terms_link">terms of use</a></span>
      </label>
    </section>
    <footer class="grid gap-3">
      <button class="btn w-full" type="submit" data-t="signup.submit">Create Account</button>
      <p class="text-muted-foreground text-center text-sm">
        <span data-t="signup.have_account">Already have an account?</span>
        <a class="text-foreground underline underline-offset-4" href="/login" data-t="signup.login">Log In</a>
      </p>
    </footer>
  </form>
</main>
```

## States

| State | What changes |
| --- | --- |
| Empty (default) | As above. Focus starts in Your name (`autofocus`). |
| Field error | The field's input gets `aria-invalid="true"` and `aria-describedby` pointing at a new `<p class="text-destructive text-sm" id="signup-<field>-error">`; for the password, the error replaces the help line. Shown on submit, cleared when the field changes. |
| Terms not checked | The checkbox gets `aria-invalid="true"`; under it `signup.error.terms`. |
| Sending | Submit `disabled` + `aria-busy="true"`, text `signup.sending`. |
| Email taken | `#signup-error` shows `signup.error.taken`; focus moves to it. Fields keep their values except the password. |
| Offline | `#signup-error` shows `signup.error.offline`. Nothing is sent. |
| Success | Go to `/confirm-email?email=<email>` (EmailConfirm, waiting state). The account exists but stays unconfirmed. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `signup.title` | Create an Account | アカウントを作成 |
| `signup.lede` | It takes a minute. We’ll send you an email to confirm it’s you. | 1分ほどで終わります。ご本人確認のためメールをお送りします。 |
| `signup.name` | Your name | お名前 |
| `signup.email` | Email | メールアドレス |
| `signup.password` | Password | パスワード |
| `signup.password_help` | At least 10 characters. A short sentence is easy to remember. | 10文字以上。短い文にすると覚えやすくなります。 |
| `signup.terms_before` | I agree to the | 同意します： |
| `signup.terms_link` | terms of use | 利用規約 |
| `signup.submit` | Create Account | アカウントを作成 |
| `signup.sending` | Creating Account… | 作成中… |
| `signup.have_account` | Already have an account? | すでにアカウントをお持ちの場合 |
| `signup.login` | Log In | ログイン |
| `signup.error.title` | Couldn’t create your account | アカウントを作成できませんでした |
| `signup.error.taken` | That email already has an account. Log in instead, or reset your password. | このメールアドレスはすでに登録されています。ログインするか、パスワードを再設定してください。 |
| `signup.error.offline` | You’re offline. Connect to the internet to create an account. | オフラインです。アカウントを作成するにはインターネットに接続してください。 |
| `signup.error.name_empty` | Enter your name. | お名前を入力してください。 |
| `signup.error.email_invalid` | Enter an email like name@example.com. | name@example.com の形式で入力してください。 |
| `signup.error.password_short` | Use at least 10 characters. | 10文字以上にしてください。 |
| `signup.error.terms` | Check this box to continue. | 続けるにはチェックを入れてください。 |

## Keyboard and focus

1. Your name → 2. Email → 3. Password → 4. Terms checkbox → 5. terms of use link → 6. Create Account → 7. Log In.
- Return in any field submits. Space toggles the checkbox.
- After a server error focus goes to `#signup-error`; after field errors, to the first invalid field.

## Phone

- The card fills the width with 16 px sides; inputs and the button are 44 px tall and the checkbox 22 px (App foundations).
- `autocomplete="new-password"` lets the phone suggest a strong password; don't block paste.
- Nothing is fixed; the page scrolls above the keyboard.

## Data

```json
{"request": {"name": "Aiko Tanaka", "email": "aiko@example.com", "password": "••••••••••", "terms": true},
 "ok": {"redirect": "/confirm-email?email=aiko%40example.com"},
 "error": {"code": "taken | invalid", "fields": {"password": "signup.error.password_short"}}}
```

- Web: `POST /signup`; 201 + `HX-Redirect`; 422 re-renders the form fragment with field errors; 409 for a taken email. Store a password hash (argon2 or bcrypt), never the password. Send the confirmation email (EmailConfirm) before redirecting.
- Rate limit: 5 sign-ups per IP per hour; the 6th returns 429 with `login.error.locked`'s wording.

## Don't

- Don't add a second "repeat password" field; the help line and the phone's password manager do that job.
- Don't log the person in before the email is confirmed unless the app says so in its capability.
- Don't show password strength meters or rules beyond the 10-character minimum.
