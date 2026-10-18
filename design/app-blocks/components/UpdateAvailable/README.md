# UpdateAvailable

Tell the person a new version of the app is ready, and let them reload when it suits them: a toast that stays until they choose, never a forced reload.

| | |
| --- | --- |
| Group | App shell |
| Basecoat | `toaster`, `toast`, `btn`, `dialog` (what's new) |
| Needs | A service worker (`sw.js`) that installs the new version and waits; `CHANGELOG` lines for What's New |
| Links to | Toasts, About (Check for Updates), SavedState (reload waits for saving) |

## Markup

The service worker side (`sw.js`) waits instead of taking over:

```js
self.addEventListener('install', e => e.waitUntil(cacheShell()));   // no skipWaiting() here
self.addEventListener('message', e => { if (e.data === 'activate-update') self.skipWaiting(); });
```

The page side, in `app.mjs`:

```js
const reg = await navigator.serviceWorker.register('/sw.js');
function offer(worker) {
  document.getElementById('toaster').toast({
    category: 'info',
    title: t('update.title'),
    description: t('update.body'),
    action: { label: t('update.reload'), onclick: 'applyUpdate()' },
    cancel: { label: t('update.later') },
    duration: -1
  });
  window.applyUpdate = async () => {
    await flushSaves();                        // SavedState: finish any pending save first
    worker.postMessage('activate-update');
  };
}
if (reg.waiting) offer(reg.waiting);
reg.addEventListener('updatefound', () => {
  const w = reg.installing;
  w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) offer(w); });
});
navigator.serviceWorker.addEventListener('controllerchange', () => location.reload());
```

What the toast renders (Basecoat builds it from the call above):

```html
<div class="toast" role="status" aria-atomic="true" data-category="info" data-duration="-1">
  <div class="toast-content">
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
    <section>
      <h2 data-t="update.title">A new version is ready</h2>
      <p class="break-normal" data-t="update.body">Reload to use it. Your work is kept.</p>
    </section>
    <footer>
      <button type="button" class="btn" data-toast-action data-t="update.reload">Reload</button>
      <button type="button" class="btn h-6 text-xs px-2.5 rounded-sm" data-variant="outline" data-toast-cancel data-t="update.later">Later</button>
    </footer>
  </div>
</div>
```

## States

| State | What changes |
| --- | --- |
| No update | Nothing. |
| Update ready | The toast stays (`duration: -1`) until Reload or Later. |
| Later | The toast closes; it's offered again on the next app start (the waiting worker is still there), or from About › Check for Updates. |
| Reloading | Reload's text becomes `update.reloading`; pending saves finish first, then the page reloads once. |
| Unsaved and offline | Reload is `disabled` with `update.save_first` as the description until the save succeeds or the person discards. |
| Breaking change (data migrates) | Use a `dialog` instead of the toast: `update.migrate.title` / `update.migrate.body` with Update Now (default) · Later. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `update.title` | A new version is ready | 新しいバージョンがあります |
| `update.body` | Reload to use it. Your work is kept. | 再読み込みすると使えます。作業内容は保持されます。 |
| `update.reload` | Reload | 再読み込み |
| `update.later` | Later | あとで |
| `update.reloading` | Reloading… | 再読み込み中… |
| `update.save_first` | Waiting for your changes to save before reloading. | 変更を保存してから再読み込みします。 |
| `update.migrate.title` | Update {app} to {version}? | {app} を {version} に更新しますか？ |
| `update.migrate.body` | Your notes are converted to the new format. It takes a few seconds and can’t be undone. | ノートは新しい形式に変換されます。数秒かかり、元に戻せません。 |
| `update.migrate.now` | Update Now | 今すぐ更新 |

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
