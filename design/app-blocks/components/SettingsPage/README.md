# SettingsPage

The app's settings in one page, language first: each change applies and saves at once, grouped under plain headings, with the account and the app's information at the end.

| | |
| --- | --- |
| Group | App shell |
| Basecoat | `card`, `fieldset`, `label`, `input` (radio, `role="switch"`), `select`, `item`, `btn` |
| Route | `/settings` |
| Needs | Web: `POST /settings` (one field at a time). No server: `store.saveSettings()` in `localStorage` |
| Links to | AccountSettings, Profile, LogOut, About, Help, InstallApp, UpdateAvailable, SavedState |

## Markup

```html
<main class="app mx-auto grid w-full max-w-2xl gap-6 p-4 @3xl:p-8">
  <div class="flex items-center justify-between gap-4">
    <h1 class="text-2xl font-semibold" data-t="settings.title">Settings</h1>
    <p id="settings-saved" class="text-muted-foreground text-sm" role="status" aria-live="polite"></p>
  </div>

  <section class="card" aria-labelledby="settings-language">
    <header><h2 id="settings-language" class="font-semibold" data-t="settings.language">Language</h2></header>
    <section>
      <fieldset class="grid gap-3" role="radiogroup" aria-labelledby="settings-language">
        <label class="label gap-3 font-normal"><input class="input" type="radio" name="language" value="en" checked><span lang="en">English</span></label>
        <label class="label gap-3 font-normal"><input class="input" type="radio" name="language" value="ja"><span lang="ja">日本語</span></label>
        <label class="label gap-3 font-normal"><input class="input" type="radio" name="language" value="auto"><span data-t="settings.language.auto">Same as this device</span></label>
      </fieldset>
    </section>
  </section>

  <section class="card" aria-labelledby="settings-appearance">
    <header><h2 id="settings-appearance" class="font-semibold" data-t="settings.appearance">Appearance</h2></header>
    <section>
      <fieldset class="grid gap-3" role="radiogroup" aria-labelledby="settings-appearance">
        <label class="label gap-3 font-normal"><input class="input" type="radio" name="theme" value="system" checked><span data-t="settings.theme.system">Match System</span></label>
        <label class="label gap-3 font-normal"><input class="input" type="radio" name="theme" value="light"><span data-t="settings.theme.light">Light</span></label>
        <label class="label gap-3 font-normal"><input class="input" type="radio" name="theme" value="dark"><span data-t="settings.theme.dark">Dark</span></label>
      </fieldset>
    </section>
  </section>

  <section class="card" aria-labelledby="settings-notifications">
    <header><h2 id="settings-notifications" class="font-semibold" data-t="settings.notifications">Notifications</h2></header>
    <section class="grid gap-4">
      <label class="label justify-between gap-4 font-normal">
        <span class="grid gap-0.5"><span data-t="settings.notify.comments">Comments on my notes</span><span class="text-muted-foreground text-sm" data-t="settings.notify.comments_help">An email when someone comments.</span></span>
        <input class="input" type="checkbox" role="switch" name="notify_comments" checked>
      </label>
      <div class="field">
        <label class="label" for="settings-digest" data-t="settings.digest">Summary email</label>
        <select class="select" id="settings-digest" name="digest">
          <option value="off" data-t="settings.digest.off">Never</option>
          <option value="daily" data-t="settings.digest.daily">Every day</option>
          <option value="weekly" selected data-t="settings.digest.weekly">Every Monday</option>
        </select>
      </div>
    </section>
  </section>

  <section class="card" aria-labelledby="settings-account">
    <header><h2 id="settings-account" class="font-semibold" data-t="settings.account">Account</h2></header>
    <section class="item-group">
      <a class="item" href="/profile"><section><h3 data-t="account.profile">Profile</h3><p data-t="settings.profile_help">Picture, name and bio</p></section><aside aria-hidden="true">›</aside></a>
      <a class="item" href="/settings/account"><section><h3 data-t="account.title">Account</h3><p data-t="settings.account_help">Email, password, devices</p></section><aside aria-hidden="true">›</aside></a>
      <a class="item" href="/about"><section><h3 data-t="about.title">About Class Notes</h3><p>1.4.0</p></section><aside aria-hidden="true">›</aside></a>
    </section>
    <footer>
      <form method="post" action="/logout" class="contents"><button class="btn w-full @3xl:w-auto" data-variant="outline" type="submit" data-t="logout.action">Log Out</button></form>
    </footer>
  </section>
</main>
```

## States

| State | What changes |
| --- | --- |
| Loaded | The saved values are checked. |
| Changing a setting | Applies at once (language re-renders the page, theme toggles `html.dark`); `#settings-saved` shows SavedState's `saved.saving` then `saved.at`. |
| Save failed | The control goes back to its old value; `#settings-saved` shows `saved.failed` + Try Again. |
| Offline | Settings that only affect this device (language, appearance) still save locally; server settings (notifications) are `disabled`, and their help line reads `offline.needs_connection`. |
| No account (no-server app) | The Account card shows only About and Install; no Log Out. |
| Notifications blocked by the browser | Under the switch: `settings.notify.blocked` with how to allow them. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `settings.title` | Settings | 設定 |
| `settings.language` | Language | 言語 |
| `settings.language.auto` | Same as this device | このデバイスと同じ |
| `settings.appearance` | Appearance | 表示 |
| `settings.theme.system` | Match System | システムに合わせる |
| `settings.theme.light` | Light | ライト |
| `settings.theme.dark` | Dark | ダーク |
| `settings.notifications` | Notifications | 通知 |
| `settings.notify.comments` | Comments on my notes | 自分のノートへのコメント |
| `settings.notify.comments_help` | An email when someone comments. | コメントがあるとメールでお知らせします。 |
| `settings.notify.blocked` | Your browser blocks notifications for this site. Allow them in the browser’s site settings. | ブラウザがこのサイトの通知をブロックしています。ブラウザのサイト設定で許可してください。 |
| `settings.digest` | Summary email | まとめメール |
| `settings.digest.off` | Never | 送らない |
| `settings.digest.daily` | Every day | 毎日 |
| `settings.digest.weekly` | Every Monday | 毎週月曜日 |
| `settings.account` | Account | アカウント |
| `settings.profile_help` | Picture, name and bio | 画像・名前・自己紹介 |
| `settings.account_help` | Email, password, devices | メールアドレス・パスワード・デバイス |
| `account.profile` | Profile | プロフィール |
| `account.title` | Account | アカウント |
| `about.title` | About {app} | {app} について |
| `logout.action` | Log Out | ログアウト |
| `offline.needs_connection` | Needs a connection | 接続が必要です |

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
