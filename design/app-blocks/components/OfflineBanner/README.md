# OfflineBanner

A thin band at the top of the app while the device is offline: what still works, how many changes wait to sync, and a short "Back online" when the connection returns.

| | |
| --- | --- |
| Group | Feedback |
| Basecoat | `btn` (layout and colour from tokens) |
| Needs | `navigator.onLine` and the `online`/`offline` events; for "changes waiting", the store's pending count (Works offline capability) |
| Used in | The app shell, first child of `.app`, above TopBar |

## Markup

```html
<div class="app flex min-h-dvh flex-col">
  <div id="offline-banner" class="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 bg-muted px-4 py-2 text-sm" role="status" aria-live="polite" hidden>
    <svg class="size-4 shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h.01"/><path d="M8.5 16.43a5 5 0 0 1 7 0"/><path d="M5 12.86a10 10 0 0 1 5.17-2.69"/><path d="M19 12.86a10 10 0 0 0-2.007-1.523"/><path d="M2 8.82a15 15 0 0 1 4.177-2.643"/><path d="M22 8.82a15 15 0 0 0-11.288-3.764"/><path d="m2 2 20 20"/></svg>
    <span id="offline-banner-text" data-t="offline.banner">You’re offline. Changes are saved on this device and sync when you’re back.</span>
    <span id="offline-banner-count" class="text-muted-foreground" data-t="offline.pending">3 changes waiting</span>
  </div>
  <!-- TopBar, main, BottomBar -->
</div>
```

```js
const banner = document.getElementById('offline-banner');
function show() { banner.hidden = navigator.onLine; }
addEventListener('offline', show);
addEventListener('online', async () => {
  banner.querySelector('#offline-banner-text').textContent = t('offline.back');
  banner.querySelector('#offline-banner-count').hidden = true;
  await syncPending();                       // the store sends waiting changes
  setTimeout(() => { banner.hidden = true; }, 3000);
});
show();
```

## States

| State | What changes |
| --- | --- |
| Online (default) | `hidden`. Nothing shows. |
| Offline, app works offline | `offline.banner`; the count shows when there are waiting changes (`offline.pending`, or `offline.pending_one`). |
| Offline, app needs the server | `offline.banner_readonly`; buttons that need the server get `disabled` and their own short reason as `title` (`offline.needs_connection`). |
| Back online | Text becomes `offline.back`, the icon a check; it hides after 3 s. |
| Sync failed | Stays visible: `offline.sync_failed` with a `btn` `data-variant="outline"` `data-size="xs"` Try Again. |
| Flaky connection | Show the banner only after 2 s offline, to avoid flicker. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `offline.banner` | You’re offline. Changes are saved on this device and sync when you’re back. | オフラインです。変更はこのデバイスに保存され、接続が戻ると同期されます。 |
| `offline.banner_readonly` | You’re offline. You can read, but changes need a connection. | オフラインです。閲覧はできますが、変更には接続が必要です。 |
| `offline.pending` | {count} changes waiting | {count} 件の変更が同期待ち |
| `offline.pending_one` | 1 change waiting | 1 件の変更が同期待ち |
| `offline.back` | Back online. Everything is synced. | オンラインに戻りました。すべて同期されました。 |
| `offline.sync_failed` | Back online, but {count} changes couldn’t sync. | オンラインに戻りましたが、{count} 件の変更を同期できませんでした。 |
| `offline.needs_connection` | Needs a connection | 接続が必要です |
| `common.try_again` | Try Again | もう一度試す |

## Keyboard and focus

- The banner never takes focus; `role="status"` announces it once per change.
- Try Again (sync failed) is the first focusable element of the page while shown.

## Phone

- Full width at the very top of `.app`, under the phone's status bar (`padding-top: env(safe-area-inset-top)` belongs to the shell, not the banner). Text wraps to two lines; the count goes under it.
- Don't push the BottomBar: the banner is in the column's flow at the top.

## Data

```json
{"online": false, "pending": 3, "last_sync": "2026-10-18T14:21:00+09:00"}
```

- No server (Works offline): the store keeps an outbox in IndexedDB; `syncPending()` sends it in order and empties it.
- Web: a service worker serves the cached shell; htmx requests that fail with no network add `hx-disabled-elt` to their buttons.

## Don't

- Don't show a modal or block the app when offline.
- Don't trust `navigator.onLine` alone for "Back online": confirm with one request before saying everything is synced.
- Don't use the destructive colour; being offline isn't an error.
