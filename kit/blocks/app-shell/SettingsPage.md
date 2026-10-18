# SettingsPage

App Block card (App shell). The app's settings in one page, language first: each change applies and saves at once, grouped under plain headings, with the account and the app's information at the end.

- Basecoat: `card`, `fieldset`, `label`, `input` (radio, `role="switch"`), `select`, `item`, `btn`
- Route: `/settings`
- Needs: Web: `POST /settings` (one field at a time). No server: `store.saveSettings()` in `localStorage`
- Links to: AccountSettings, Profile, LogOut, About, Help, InstallApp, UpdateAvailable, SavedState

## Markup
Copy, never retype: `{harness}/kit/blocks/app-shell/SettingsPage.html` (58 lines of HTML).

## States
- Loaded: The saved values are checked.
- Changing a setting: Applies at once (language re-renders the page, theme toggles `html.dark`); `#settings-saved` shows SavedState's `saved.saving` then `saved.at`.
- Save failed: The control goes back to its old value; `#settings-saved` shows `saved.failed` + Try Again.
- Offline: Settings that only affect this device (language, appearance) still save locally; server settings (notifications) are `disabled`, and their help line reads `offline.needs_connection`.
- No account (no-server app): The Account card shows only About and Install; no Log Out.
- Notifications blocked by the browser: Under the switch: `settings.notify.blocked` with how to allow them.

## Texts
(Key | English | 日本語)
- `settings.title`: Settings | 設定
- `settings.language`: Language | 言語
- `settings.language.auto`: Same as this device | このデバイスと同じ
- `settings.appearance`: Appearance | 表示
- `settings.theme.system`: Match System | システムに合わせる
- `settings.theme.light`: Light | ライト
- `settings.theme.dark`: Dark | ダーク
- `settings.notifications`: Notifications | 通知
- `settings.notify.comments`: Comments on my notes | 自分のノートへのコメント
- `settings.notify.comments_help`: An email when someone comments. | コメントがあるとメールでお知らせします。
- `settings.notify.blocked`: Your browser blocks notifications for this site. Allow them in the browser’s site settings. | ブラウザがこのサイトの通知をブロックしています。ブラウザのサイト設定で許可してください。
- `settings.digest`: Summary email | まとめメール
- `settings.digest.off`: Never | 送らない
- `settings.digest.daily`: Every day | 毎日
- `settings.digest.weekly`: Every Monday | 毎週月曜日
- `settings.account`: Account | アカウント
- `settings.profile_help`: Picture, name and bio | 画像・名前・自己紹介
- `settings.account_help`: Email, password, devices | メールアドレス・パスワード・デバイス
- `account.profile`: Profile | プロフィール
- `account.title`: Account | アカウント
- `about.title`: About {app} | {app} について
- `logout.action`: Log Out | ログアウト
- `offline.needs_connection`: Needs a connection | 接続が必要です

## Keyboard and focus
1. Language radios (↑ ↓) → 2. Appearance radios → 3. Comments switch (Space) → 4. Summary email → 5. Profile → 6. Account → 7. About → 8. Log Out.
- Changing the language keeps focus on the same radio after the page re-renders.

## Phone
- One column of cards; radio rows and the switch row are 44 px; the links are 56 px rows with ›.
- Log Out is full width at the end.

## Data
```json
{"language": "ja", "theme": "system", "notify_comments": true, "digest": "weekly"}
```

- Web: each control has `hx-post="/settings" hx-trigger="change" hx-vals` with its one field; 204 + `HX-Refresh: true` for language.
- No server: `store.saveSettings({language})`; the theme script runs in `<head>` before the body so there's no flash: `document.documentElement.classList.toggle('dark', theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches))`.

## Don't
- Don't put a Save button at the bottom; every change saves.
- Don't hide the language under a menu; it is the first setting.
- Don't label languages in the current language only: each is written in its own script.

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> SettingsPage` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
