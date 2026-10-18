# TopBar

App Block card (Navigation). The bar across the top of every page: the side panel toggle, search, the main "New" action, notifications and the account menu.

- Basecoat: `btn`, `input-group`, `kbd`, `avatar`, `dropdown-menu` (with `js/basecoat.min.js`)
- Needs: The person (name, email, initials or photo), the unread notification count; `POST /logout`
- Used in: Every app with accounts; the first child of `<main>` in SidePanel layouts
- Links to: SidePanel (toggle), CommandPalette (search on the phone and ⌘K), Notifications, Profile, SettingsPage, LogOut

## Markup
Copy, never retype: `{harness}/kit/blocks/navigation/TopBar.html` (29 lines of HTML).

- Put it as the first child of `<main>` (SidePanel layout) or of `.app` (no side panel; then drop the toggle).
- The one primary button is the app's main "New …" action. Other actions go in the page.
- On the phone the search field becomes an icon that opens CommandPalette, the app name appears, and the New button shows only its icon (its text stays for screen readers through `sr-only`).

## States
- Default: As above.
- Unread notifications: The red dot is shown and the bell's `aria-label` uses `top.notifications_new`; none: no dot, label `top.notifications`.
- Account menu open: `aria-expanded="true"` on the avatar; the popover's `aria-hidden="false"`. Arrow keys move through items.
- Logged out: Replace the bell, New and avatar with `<a class="btn" data-variant="outline" href="/login">Log In</a>` and `<a class="btn" href="/signup">Sign Up</a>` (keys from LogIn and SignUp).
- Offline: New stays enabled in no-server apps; in web apps disable it (`aria-disabled="true"`) and show OfflineBanner.
- Photo avatar: `<span class="avatar"><img src="/media/avatars/12.jpg" alt=""></span>` instead of initials.
- Scrolling: The bar does not scroll: it sits above the scrolling area, so it needs no `sticky`.

## Texts
(Key | English | 日本語)
- `app.name`: Class Notes | クラスノート
- `nav.toggle`: Show or hide the side panel | サイドパネルの表示を切り替え
- `top.search`: Search notes | ノートを検索
- `top.search_hint`: Search notes… | ノートを検索…
- `top.new`: New Note | 新しいノート
- `top.notifications`: Notifications | お知らせ
- `top.notifications_new`: Notifications, {count} new | お知らせ（新着 {count} 件）
- `top.account`: Account menu | アカウントメニュー
- `top.profile`: Profile | プロフィール
- `top.settings`: Settings | 設定
- `top.language`: 日本語 | English
- `top.logout`: Log Out | ログアウト

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

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> TopBar` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
