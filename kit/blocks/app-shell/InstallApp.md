# InstallApp

App Block card (App shell). Offer to install the app on the phone's home screen: one button where the browser can install it, two short steps where it can't (Safari on iPhone), and silence once it's installed or declined.

- Basecoat: `card`, `btn`
- Route: Shown on `/` after the second visit; also a row in SettingsPage
- Needs: `manifest.webmanifest` with name, icons (192, 512, maskable) and `display: "standalone"`; a service worker; the Installs on a phone capability
- Links to: SettingsPage, OfflineBanner (installed apps work offline)

## Markup
Copy, never retype: `{harness}/kit/blocks/app-shell/InstallApp.html` (21 lines of HTML).

Copy, never retype: `{harness}/kit/blocks/app-shell/InstallApp.js` (9 lines of JS).

## States
- Can install (Chrome, Edge, Samsung): The card with Not Now · Install. Install opens the browser's own install dialog.
- iPhone / iPad Safari: The card with the two steps and a small Not Now link-button under them.
- Installed / opened from the home screen: The card never shows; SettingsPage's row (`install.settings_row`) reads `install.installed`.
- Declined: Hidden for 30 days (stored in `localStorage`, in try/catch).
- Desktop: No card; a TopBar menu item `install.desktop` appears only after `beforeinstallprompt`.
- Browser can't install (Firefox desktop): Nothing shows.

## Texts
(Key | English | 日本語)
- `install.title`: Put {app} on your home screen | {app} をホーム画面に追加
- `install.body`: It opens full screen and works offline, like an app. | アプリのように全画面で開き、オフラインでも使えます。
- `install.action`: Install | インストール
- `install.later`: Not Now | 今はしない
- `install.ios.step1`: Tap Share | 共有ボタン
- `install.ios.step1_where`: in the browser bar | をタップ（ブラウザのバー）
- `install.ios.step2`: Choose Add to Home Screen | 「ホーム画面に追加」を選択
- `install.settings_row`: Install the app | アプリをインストール
- `install.installed`: Installed on this device | このデバイスにインストール済み
- `install.desktop`: Install App… | アプリをインストール…

## Keyboard and focus
1. Not Now → 2. Install. The card doesn't take focus when it appears; it's in the page flow after the main heading's content.
- After Install or Not Now, focus moves to the main heading.

## Phone
- The card sits at the top of the home screen's content, below TopBar, full width; buttons 44 px.
- Never a full-screen overlay, never on the first visit, never during a task.

## Data
```json
{"canInstall": true, "platform": "ios | prompt | none", "installed": false, "declinedAt": null}
```

- `manifest.webmanifest`: `"name"`, `"short_name"` (12 characters max, both languages via the app's build), `"start_url": "/"`, `"display": "standalone"`, `"theme_color"`, `"background_color"`, icons 192 and 512 plus a `"purpose": "maskable"` icon.

## Don't
- Don't draw a fake system dialog or an arrow pointing at the browser's button.
- Don't show the card in the installed app.
- Don't offer installation before the second visit.

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> InstallApp` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
