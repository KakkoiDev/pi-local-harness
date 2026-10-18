# TopBar

The bar across the top of every page: the side panel toggle, search, the main "New" action, notifications and the account menu.

| | |
| --- | --- |
| Group | Navigation |
| Basecoat | `btn`, `input-group`, `kbd`, `avatar`, `dropdown-menu` (with `js/basecoat.min.js`) |
| Needs | The person (name, email, initials or photo), the unread notification count; `POST /logout` |
| Used in | Every app with accounts; the first child of `<main>` in SidePanel layouts |
| Links to | SidePanel (toggle), CommandPalette (search on the phone and ⌘K), Notifications, Profile, SettingsPage, LogOut |

## Markup

```html
<header class="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-2 @3xl:px-4">
  <button type="button" class="btn" data-variant="ghost" data-size="icon" aria-controls="sidebar" aria-expanded="false" aria-label="Show or hide the side panel" data-t-label="nav.toggle" onclick="document.getElementById('sidebar').toggle()"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button>
  <a href="/" class="font-semibold @3xl:hidden" data-t="app.name">Class Notes</a>
  <form role="search" action="/search" class="@max-3xl:hidden w-full max-w-sm">
    <label class="input-group">
      <span data-align="start"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg></span>
      <input type="search" name="q" placeholder="Search notes…" data-t-placeholder="top.search_hint" aria-label="Search notes" data-t-label="top.search">
      <span data-align="end"><kbd class="kbd">⌘K</kbd></span>
    </label>
  </form>
  <span class="flex-1"></span>
  <button type="button" class="btn @3xl:hidden" data-variant="ghost" data-size="icon" aria-label="Search notes" data-t-label="top.search" onclick="document.getElementById('command').showModal()"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg></button>
  <a href="/notes/new" class="btn" data-size="sm"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M12 5v14"/></svg><span class="@max-3xl:sr-only" data-t="top.new">New Note</span></a>
  <a href="/notifications" class="btn relative" data-variant="ghost" data-size="icon" aria-label="Notifications, 2 new" data-t-label="top.notifications_new"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg><span class="absolute top-1.5 right-1.5 size-2 rounded-full bg-destructive" aria-hidden="true"></span></a>
  <div id="account" class="dropdown-menu">
    <button type="button" id="account-trigger" class="avatar" aria-haspopup="menu" aria-controls="account-menu" aria-expanded="false" aria-label="Account menu" data-t-label="top.account"><span>AY</span></button>
    <div id="account-popover" data-popover aria-hidden="true" data-align="end">
      <div role="menu" id="account-menu" aria-labelledby="account-trigger">
        <div role="heading" class="flex-col items-start"><span class="font-medium">Aiko Yamada</span><span class="text-muted-foreground text-xs">aiko@example.com</span></div>
        <hr role="separator">
        <a role="menuitem" href="/profile"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg><span data-t="top.profile">Profile</span></a>
        <a role="menuitem" href="/settings"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/></svg><span data-t="top.settings">Settings</span></a>
        <a role="menuitem" href="?lang=ja" lang="ja"><span data-t="top.language">日本語</span></a>
        <hr role="separator">
        <form method="post" action="/logout"><button role="menuitem" type="submit" class="w-full"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg><span data-t="top.logout">Log Out</span></button></form>
      </div>
    </div>
  </div>
</header>
```

- Put it as the first child of `<main>` (SidePanel layout) or of `.app` (no side panel; then drop the toggle).
- The one primary button is the app's main "New …" action. Other actions go in the page.
- On the phone the search field becomes an icon that opens CommandPalette, the app name appears, and the New button shows only its icon (its text stays for screen readers through `sr-only`).

## States

| State | What changes |
| --- | --- |
| Default | As above. |
| Unread notifications | The red dot is shown and the bell's `aria-label` uses `top.notifications_new`; none: no dot, label `top.notifications`. |
| Account menu open | `aria-expanded="true"` on the avatar; the popover's `aria-hidden="false"`. Arrow keys move through items. |
| Logged out | Replace the bell, New and avatar with `<a class="btn" data-variant="outline" href="/login">Log In</a>` and `<a class="btn" href="/signup">Sign Up</a>` (keys from LogIn and SignUp). |
| Offline | New stays enabled in no-server apps; in web apps disable it (`aria-disabled="true"`) and show OfflineBanner. |
| Photo avatar | `<span class="avatar"><img src="/media/avatars/12.jpg" alt=""></span>` instead of initials. |
| Scrolling | The bar does not scroll: it sits above the scrolling area, so it needs no `sticky`. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `app.name` | Class Notes | クラスノート |
| `nav.toggle` | Show or hide the side panel | サイドパネルの表示を切り替え |
| `top.search` | Search notes | ノートを検索 |
| `top.search_hint` | Search notes… | ノートを検索… |
| `top.new` | New Note | 新しいノート |
| `top.notifications` | Notifications | お知らせ |
| `top.notifications_new` | Notifications, {count} new | お知らせ（新着 {count} 件） |
| `top.account` | Account menu | アカウントメニュー |
| `top.profile` | Profile | プロフィール |
| `top.settings` | Settings | 設定 |
| `top.language` | 日本語 | English |
| `top.logout` | Log Out | ログアウト |

`top.language` is the name of the **other** language, written in that language, and its link has `lang` set to it.

## Keyboard and focus

1. Toggle → 2. Search field (desktop) or search icon (phone) → 3. New Note → 4. Notifications → 5. Account menu.
- `⌘K` (Mac) or `Ctrl K` focuses search; on the phone the icon opens CommandPalette.
- In the account menu: ↑ ↓ move, Return chooses, Esc closes and returns focus to the avatar.

## Phone

- Height stays 56 px; side padding 8 px; every button is 44 × 44 (App foundations).
- Search, New's text and the shortcut hint are hidden below 48 rem (`@max-3xl:`); the app name shows instead.
- Apps that use BottomBar hide the toggle on the phone (`@max-3xl:hidden`).

## Data

```json
{"me": {"name": "Aiko Yamada", "email": "aiko@example.com", "initials": "AY", "avatar_url": null},
 "unread_notifications": 2, "lang": "en"}
```

- Web: `base.html` renders it from `request.state.me`; `hx-get="/notifications/count" hx-trigger="every 60s"` refreshes the dot. Log Out is a real form post (`POST /logout`), never a link.
- No server apps have no accounts: drop the avatar and bell; keep search and New.

## Don't

- Don't put more than one primary button in the bar.
- Don't make the avatar a link to the profile; it opens the menu.
- Don't hide Log Out deeper than the account menu.
