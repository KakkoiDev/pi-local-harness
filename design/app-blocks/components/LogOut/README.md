# LogOut

Log out from the account menu, then land on a page that says so and offers to log in again.

| | |
| --- | --- |
| Group | Accounts |
| Basecoat | `dropdown-menu`, `avatar`, `btn`, `card`, `alert-dialog` |
| Route | `POST /logout`, then `/logged-out` |
| Needs | Web: `POST /logout`. Needs a server |
| Used in | TopBar (account menu), SidePanel (footer), AccountSettings (Log out of all devices) |

## Markup

The account menu item (inside TopBar's account `dropdown-menu`) is a form, so it works without JavaScript and can't be triggered by a link:

```html
<div class="dropdown-menu" id="account-menu">
  <button type="button" id="account-menu-trigger" aria-haspopup="menu" aria-controls="account-menu-menu" aria-expanded="false" class="btn" data-variant="ghost" data-size="icon" aria-label="Account" data-t-label="account.menu">
    <span class="avatar" data-size="sm"><span>AT</span></span>
  </button>
  <div id="account-menu-popover" data-popover aria-hidden="true" data-align="end">
    <div role="menu" id="account-menu-menu" aria-labelledby="account-menu-trigger">
      <div role="heading" class="px-2 py-1.5">
        <div class="grid">
          <span class="text-sm font-medium">Aiko Tanaka</span>
          <span class="text-muted-foreground text-xs">aiko@example.com</span>
        </div>
      </div>
      <hr role="separator">
      <a role="menuitem" href="/profile" data-t="account.profile">Profile</a>
      <a role="menuitem" href="/settings" data-t="account.settings">Settings</a>
      <hr role="separator">
      <form method="post" action="/logout" class="contents">
        <button type="submit" role="menuitem" data-t="logout.action">Log Out</button>
      </form>
    </div>
  </div>
</div>
```

The page after logging out:

```html
<main class="app grid min-h-dvh place-items-center bg-muted/40 p-4">
  <section class="card w-full max-w-sm text-center" aria-labelledby="logged-out-title">
    <header class="items-center">
      <h1 id="logged-out-title" class="text-xl font-semibold" data-t="logout.title">You’re logged out</h1>
      <p class="text-muted-foreground text-sm" data-t="logout.lede">Your notes are safe. Log in again to see them.</p>
    </header>
    <footer class="grid gap-2">
      <a class="btn w-full" href="/login" data-t="logout.login_again">Log In Again</a>
      <a class="btn w-full" data-variant="ghost" href="/" data-t="logout.home">Go to the Home Page</a>
    </footer>
  </section>
</main>
```

## States

| State | What changes |
| --- | --- |
| Menu closed (default) | Only the avatar button shows. |
| Menu open | `aria-expanded="true"`, the popover `aria-hidden="false"`; focus on the first item. |
| Unsaved changes | Before posting, an `alert-dialog` asks `logout.unsaved.title` with `logout.unsaved.body`; buttons Cancel (default focus) · Log Out Anyway (`data-variant="destructive"`). |
| Logging out | The menu closes; the page shows nothing new until the redirect (under 1 s). |
| Logged out | The page above. Every tab of the app shows LogIn on its next request. |
| Offline | The local session is still cleared; the server session expires on its own. The logged-out page adds `logout.offline` in muted text. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `account.menu` | Account | アカウント |
| `account.profile` | Profile | プロフィール |
| `account.settings` | Settings | 設定 |
| `logout.action` | Log Out | ログアウト |
| `logout.title` | You’re logged out | ログアウトしました |
| `logout.lede` | Your notes are safe. Log in again to see them. | ノートは保存されています。もう一度ログインすると表示されます。 |
| `logout.login_again` | Log In Again | もう一度ログイン |
| `logout.home` | Go to the Home Page | ホームへ |
| `logout.unsaved.title` | Log out with unsaved changes? | 保存していない変更があります。ログアウトしますか？ |
| `logout.unsaved.body` | Your edits to “{name}” haven’t been saved and will be lost. | 「{name}」への変更は保存されておらず、失われます。 |
| `logout.unsaved.confirm` | Log Out Anyway | このままログアウト |
| `common.cancel` | Cancel | キャンセル |
| `logout.offline` | You were offline, so other devices stay logged in until their session ends. | オフラインだったため、他のデバイスはセッションが切れるまでログインしたままです。 |

## Keyboard and focus

- The account button's `aria-label` is `account.menu` (static starter: set it in code, `data-t` only fills text; web: `{{ t("account.menu") }}`).
1. Account button → Return, Space or ↓ opens the menu with focus on Profile.
2. ↑ ↓ move between Profile, Settings, Log Out; Return chooses; Esc closes and returns focus to the button.
- On the logged-out page focus starts on Log In Again.
- In the unsaved dialog focus starts on Cancel; Esc cancels.

## Phone

- The account button is 44 × 44 px; the menu opens as a full-width list under the top bar (menu items 44 px).
- In apps with a BottomBar, Log Out also sits at the end of the Settings page (SettingsPage › Account), because the top bar may only show the title.

## Data

```json
{"request": {}, "ok": {"redirect": "/logged-out"}}
```

- Web: `POST /logout` clears the session cookie (`Set-Cookie` with `Max-Age=0`) and deletes the server session; returns 303 to `/logged-out` (or `HX-Redirect`). Protect it with the same CSRF token as other forms.
- Log out of all devices (AccountSettings): `POST /logout?all=1` deletes every session of the account.

## Don't

- Don't log out with a GET link (prefetching or a crawler would log people out).
- Don't ask "Are you sure?" when nothing is unsaved.
- Don't clear the app's language or theme choice on log out.
