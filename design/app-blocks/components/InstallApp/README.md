# InstallApp

Offer to install the app on the phone's home screen: one button where the browser can install it, two short steps where it can't (Safari on iPhone), and silence once it's installed or declined.

| | |
| --- | --- |
| Group | App shell |
| Basecoat | `card`, `btn` |
| Route | Shown on `/` after the second visit; also a row in SettingsPage |
| Needs | `manifest.webmanifest` with name, icons (192, 512, maskable) and `display: "standalone"`; a service worker; the Installs on a phone capability |
| Links to | SettingsPage, OfflineBanner (installed apps work offline) |

## Markup

```html
<section id="install-card" class="card gap-4 py-4" aria-labelledby="install-title" hidden>
  <div class="flex items-start gap-3 px-4">
    <img src="/static/icon-192.png" alt="" width="48" height="48" class="rounded-xl">
    <div class="grid flex-1 gap-1">
      <h2 id="install-title" class="font-semibold" data-t="install.title">Put Class Notes on your home screen</h2>
      <p class="text-muted-foreground text-sm" data-t="install.body">It opens full screen and works offline, like an app.</p>
    </div>
  </div>
  <!-- browsers that can install (Chrome, Edge, Samsung Internet) -->
  <footer class="flex justify-end gap-2 px-4" id="install-prompt">
    <button class="btn" data-variant="ghost" type="button" id="install-later" data-t="install.later">Not Now</button>
    <button class="btn" type="button" id="install-now" data-t="install.action">Install</button>
  </footer>
  <!-- Safari on iPhone and iPad: steps instead of a button -->
  <ol class="grid gap-2 px-4 text-sm" id="install-steps" hidden>
    <li class="flex items-center gap-2"><span class="bg-muted grid size-6 place-items-center rounded-full text-xs">1</span><span data-t="install.ios.step1">Tap Share</span>
      <svg class="size-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v13"/><path d="m16 6-4-4-4 4"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/></svg>
      <span data-t="install.ios.step1_where">in the browser bar</span></li>
    <li class="flex items-center gap-2"><span class="bg-muted grid size-6 place-items-center rounded-full text-xs">2</span><span data-t="install.ios.step2">Choose Add to Home Screen</span></li>
  </ol>
</section>
```

```js
let deferred;
const card = document.getElementById('install-card');
const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
const declined = Number(localStorage.getItem('installDeclinedAt') || 0) > Date.now() - 30 * 864e5;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; if (!standalone && !declined) card.hidden = false; });
document.getElementById('install-now').onclick = async () => { deferred.prompt(); const { outcome } = await deferred.userChoice; card.hidden = true; if (outcome === 'dismissed') localStorage.setItem('installDeclinedAt', Date.now()); };
document.getElementById('install-later').onclick = () => { card.hidden = true; localStorage.setItem('installDeclinedAt', Date.now()); };
// iPhone Safari: no beforeinstallprompt; show the steps instead
if (/iPhone|iPad/.test(navigator.userAgent) && !standalone && !declined) { card.hidden = false; document.getElementById('install-prompt').hidden = true; document.getElementById('install-steps').hidden = false; }
```

## States

| State | What changes |
| --- | --- |
| Can install (Chrome, Edge, Samsung) | The card with Not Now · Install. Install opens the browser's own install dialog. |
| iPhone / iPad Safari | The card with the two steps and a small Not Now link-button under them. |
| Installed / opened from the home screen | The card never shows; SettingsPage's row (`install.settings_row`) reads `install.installed`. |
| Declined | Hidden for 30 days (stored in `localStorage`, in try/catch). |
| Desktop | No card; a TopBar menu item `install.desktop` appears only after `beforeinstallprompt`. |
| Browser can't install (Firefox desktop) | Nothing shows. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `install.title` | Put {app} on your home screen | {app} をホーム画面に追加 |
| `install.body` | It opens full screen and works offline, like an app. | アプリのように全画面で開き、オフラインでも使えます。 |
| `install.action` | Install | インストール |
| `install.later` | Not Now | 今はしない |
| `install.ios.step1` | Tap Share | 共有ボタン |
| `install.ios.step1_where` | in the browser bar | をタップ（ブラウザのバー） |
| `install.ios.step2` | Choose Add to Home Screen | 「ホーム画面に追加」を選択 |
| `install.settings_row` | Install the app | アプリをインストール |
| `install.installed` | Installed on this device | このデバイスにインストール済み |
| `install.desktop` | Install App… | アプリをインストール… |

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
