# AccountSettings

The account's own settings: change the email, change the password, see and end sessions on other devices, and the way to delete the account.

| | |
| --- | --- |
| Group | Accounts |
| Basecoat | `card`, `field`, `label`, `input`, `btn`, `item`, `item-group`, `badge`, `alert` |
| Route | `/settings/account` (a section of SettingsPage) |
| Needs | Web: `POST /account/email`, `POST /account/password`, `GET /account/sessions`, `POST /logout?session=…`, `POST /logout?all=1`. Needs a server |
| Links to | SettingsPage, EmailConfirm (new email), LogOut, DeleteAccount, Profile |

## Markup

```html
<main class="app mx-auto grid w-full max-w-2xl gap-6 p-4 @3xl:p-8">
  <h1 class="text-2xl font-semibold" data-t="account.title">Account</h1>

  <form id="account-email" class="card" method="post" action="/account/email" novalidate>
    <header>
      <h2 class="font-semibold" data-t="account.email.title">Email</h2>
      <p class="text-muted-foreground text-sm" data-t="account.email.lede">We’ll send a link to the new address. The change happens when you open it.</p>
    </header>
    <section class="grid gap-4">
      <div class="field">
        <label class="label" for="account-email-new" data-t="account.email.new">New email</label>
        <input class="input" id="account-email-new" name="email" type="email" autocomplete="email" placeholder="aiko@example.com">
      </div>
    </section>
    <footer class="flex justify-end"><button class="btn" type="submit" data-t="account.email.submit">Send Confirmation Link</button></footer>
  </form>

  <form id="account-password" class="card" method="post" action="/account/password" novalidate>
    <header><h2 class="font-semibold" data-t="account.password.title">Password</h2></header>
    <section class="grid gap-4">
      <div class="field">
        <label class="label" for="account-password-current" data-t="account.password.current">Current password</label>
        <input class="input" id="account-password-current" name="current" type="password" autocomplete="current-password">
      </div>
      <div class="field">
        <label class="label" for="account-password-new" data-t="account.password.new">New password</label>
        <input class="input" id="account-password-new" name="password" type="password" autocomplete="new-password" minlength="10" aria-describedby="account-password-help">
        <p class="text-muted-foreground text-sm" id="account-password-help" data-t="signup.password_help">At least 10 characters. A short sentence is easy to remember.</p>
      </div>
    </section>
    <footer class="flex justify-end"><button class="btn" type="submit" data-t="account.password.submit">Change Password</button></footer>
  </form>

  <section class="card" aria-labelledby="account-sessions-title">
    <header>
      <h2 class="font-semibold" id="account-sessions-title" data-t="account.sessions.title">Where you’re logged in</h2>
    </header>
    <section class="item-group gap-2" role="list">
      <div class="item" role="listitem" data-variant="outline">
        <section>
          <h3 class="text-sm font-medium">Safari on iPhone <span class="badge ml-2" data-variant="secondary" data-t="account.sessions.this">This device</span></h3>
          <p>Osaka · <span data-t="account.sessions.active">Active now</span></p>
        </section>
      </div>
      <div class="item" role="listitem" data-variant="outline">
        <section>
          <h3 class="text-sm font-medium">Chrome on Mac</h3>
          <p>Kyoto · <time datetime="2026-10-17T21:04">Yesterday, 21:04</time></p>
        </section>
        <aside>
          <form method="post" action="/logout?session=s_92f" class="contents">
            <button class="btn" data-variant="outline" data-size="sm" type="submit" data-t="account.sessions.end">Log Out</button>
          </form>
        </aside>
      </div>
    </section>
    <footer class="flex justify-end">
      <form method="post" action="/logout?all=1" class="contents">
        <button class="btn" data-variant="outline" type="submit" data-t="account.sessions.end_all">Log Out Everywhere Else</button>
      </form>
    </footer>
  </section>

  <section class="card border-destructive/40" aria-labelledby="account-delete-title">
    <header>
      <h2 class="font-semibold" id="account-delete-title" data-t="account.delete.title">Delete account</h2>
      <p class="text-muted-foreground text-sm" data-t="account.delete.lede">Deletes your account and everything in it after 30 days. You can cancel until then.</p>
    </header>
    <footer class="flex justify-end">
      <a class="btn" data-variant="destructive" href="/settings/account/delete" data-t="account.delete.open">Delete Account…</a>
    </footer>
  </section>
</main>
```

## States

| State | What changes |
| --- | --- |
| Loaded (default) | As above, one card per task, each with its own button. |
| Email sent | The email card's footer shows an `alert` (default, `role="status"`) titled `account.email.sent_title` with `account.email.sent`; the current email is unchanged until the link is opened (EmailConfirm). |
| Email taken | `aria-invalid="true"` + `account.email.taken` under the field. |
| Wrong current password | `aria-invalid="true"` on Current password + `account.password.wrong`. |
| Password changed | The fields empty; `alert` `account.password.done`. Other sessions end; this one stays. |
| Session ended | The row disappears; a toast `account.sessions.ended` (Toasts). |
| Sessions loading | Two `skeleton h-12` rows in place of the items. |
| Offline | Each button `disabled`; an InlineAlert at the top: `account.offline`. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `account.title` | Account | アカウント |
| `account.email.title` | Email | メールアドレス |
| `account.email.lede` | We’ll send a link to the new address. The change happens when you open it. | 新しいアドレスにリンクを送信します。リンクを開くと変更されます。 |
| `account.email.new` | New email | 新しいメールアドレス |
| `account.email.submit` | Send Confirmation Link | 確認リンクを送信 |
| `account.email.sent` | Link sent to {email}. Your email changes when you open it. | {email} にリンクを送信しました。開くとメールアドレスが変わります。 |
| `account.email.sent_title` | Check your new email | 新しいメールをご確認ください |
| `account.email.taken` | That email already has an account. | このメールアドレスはすでに使われています。 |
| `account.password.title` | Password | パスワード |
| `account.password.current` | Current password | 現在のパスワード |
| `account.password.new` | New password | 新しいパスワード |
| `account.password.submit` | Change Password | パスワードを変更 |
| `account.password.wrong` | That isn’t your current password. | 現在のパスワードが正しくありません。 |
| `account.password.done` | Password changed. Your other devices were logged out. | パスワードを変更しました。他のデバイスはログアウトされました。 |
| `account.sessions.title` | Where you’re logged in | ログイン中のデバイス |
| `account.sessions.this` | This device | このデバイス |
| `account.sessions.active` | Active now | 使用中 |
| `account.sessions.end` | Log Out | ログアウト |
| `account.sessions.end_all` | Log Out Everywhere Else | 他のすべてのデバイスからログアウト |
| `account.sessions.ended` | Logged out on {device}. | {device} からログアウトしました。 |
| `account.delete.title` | Delete account | アカウントの削除 |
| `account.delete.lede` | Deletes your account and everything in it after 30 days. You can cancel until then. | 30日後にアカウントとすべてのデータを削除します。それまではキャンセルできます。 |
| `account.delete.open` | Delete Account… | アカウントを削除… |
| `account.offline` | You’re offline. Account changes need a connection. | オフラインです。アカウントの変更には接続が必要です。 |

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
