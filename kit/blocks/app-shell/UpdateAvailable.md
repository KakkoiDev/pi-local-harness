# UpdateAvailable

App Block card (App shell). Tell the person a new version of the app is ready, and let them reload when it suits them: a toast that stays until they choose, never a forced reload.

- Basecoat: `toaster`, `toast`, `btn`, `dialog` (what's new)
- Needs: A service worker (`sw.js`) that installs the new version and waits; `CHANGELOG` lines for What's New
- Links to: Toasts, About (Check for Updates), SavedState (reload waits for saving)

## Markup
The service worker side (`sw.js`) waits instead of taking over:

Copy, never retype: `{harness}/kit/blocks/app-shell/UpdateAvailable.js` (2 lines of JS).

The page side, in `app.mjs`:

Copy, never retype: `{harness}/kit/blocks/app-shell/UpdateAvailable.2.js` (21 lines of JS).

What the toast renders (Basecoat builds it from the call above):

Copy, never retype: `{harness}/kit/blocks/app-shell/UpdateAvailable.html` (13 lines of HTML).

## States
- No update: Nothing.
- Update ready: The toast stays (`duration: -1`) until Reload or Later.
- Later: The toast closes; it's offered again on the next app start (the waiting worker is still there), or from About › Check for Updates.
- Reloading: Reload's text becomes `update.reloading`; pending saves finish first, then the page reloads once.
- Unsaved and offline: Reload is `disabled` with `update.save_first` as the description until the save succeeds or the person discards.
- Breaking change (data migrates): Use a `dialog` instead of the toast: `update.migrate.title` / `update.migrate.body` with Update Now (default) · Later.

## Texts
(Key | English | 日本語)
- `update.title`: A new version is ready | 新しいバージョンがあります
- `update.body`: Reload to use it. Your work is kept. | 再読み込みすると使えます。作業内容は保持されます。
- `update.reload`: Reload | 再読み込み
- `update.later`: Later | あとで
- `update.reloading`: Reloading… | 再読み込み中…
- `update.save_first`: Waiting for your changes to save before reloading. | 変更を保存してから再読み込みします。
- `update.migrate.title`: Update {app} to {version}? | {app} を {version} に更新しますか？
- `update.migrate.body`: Your notes are converted to the new format. It takes a few seconds and can’t be undone. | ノートは新しい形式に変換されます。数秒かかり、元に戻せません。
- `update.migrate.now`: Update Now | 今すぐ更新

## Keyboard and focus
- The toast doesn't take focus; `role="status"` announces it. Reload and Later are in the Tab order at the end of the page.
- ⌘R / F5 also applies it: `controllerchange` reloads with the new version.

## Phone
- The toast spans the width above the BottomBar (`toaster pb-20` when the app has one); Reload and Later stack in the toast's footer.
- In the installed app (no browser bar) this is the only way to update, so it must stay until the person chooses.

## Data
```json
{"current": "1.4.0", "waiting": "1.5.0", "breaking": false}
```

- Web: same service worker; the server sends `Cache-Control: no-cache` for `/sw.js` so the browser checks for updates on each start.
- No server: the same; GitHub Pages serves `sw.js` with a short cache.

## Don't
- Don't call `skipWaiting()` on install (it swaps code under the person's feet).
- Don't reload by yourself, ever.
- Don't show it on the first visit (there is no old version to replace).

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> UpdateAvailable` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
