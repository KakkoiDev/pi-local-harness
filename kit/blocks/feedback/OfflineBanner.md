# OfflineBanner

App Block card (Feedback). A thin band at the top of the app while the device is offline: what still works, how many changes wait to sync, and a short "Back online" when the connection returns.

- Basecoat: `btn` (layout and colour from tokens)
- Needs: `navigator.onLine` and the `online`/`offline` events; for "changes waiting", the store's pending count (Works offline capability)
- Used in: The app shell, first child of `.app`, above TopBar

## Markup
Copy, never retype: `{harness}/kit/blocks/feedback/OfflineBanner.html` (8 lines of HTML).

Copy, never retype: `{harness}/kit/blocks/feedback/OfflineBanner.js` (10 lines of JS).

## States
- Online (default): `hidden`. Nothing shows.
- Offline, app works offline: `offline.banner`; the count shows when there are waiting changes (`offline.pending`, or `offline.pending_one`).
- Offline, app needs the server: `offline.banner_readonly`; buttons that need the server get `disabled` and their own short reason as `title` (`offline.needs_connection`).
- Back online: Text becomes `offline.back`, the icon a check; it hides after 3 s.
- Sync failed: Stays visible: `offline.sync_failed` with a `btn` `data-variant="outline"` `data-size="xs"` Try Again.
- Flaky connection: Show the banner only after 2 s offline, to avoid flicker.

## Texts
(Key | English | 日本語)
- `offline.banner`: You’re offline. Changes are saved on this device and sync when you’re back. | オフラインです。変更はこのデバイスに保存され、接続が戻ると同期されます。
- `offline.banner_readonly`: You’re offline. You can read, but changes need a connection. | オフラインです。閲覧はできますが、変更には接続が必要です。
- `offline.pending`: {count} changes waiting | {count} 件の変更が同期待ち
- `offline.pending_one`: 1 change waiting | 1 件の変更が同期待ち
- `offline.back`: Back online. Everything is synced. | オンラインに戻りました。すべて同期されました。
- `offline.sync_failed`: Back online, but {count} changes couldn’t sync. | オンラインに戻りましたが、{count} 件の変更を同期できませんでした。
- `offline.needs_connection`: Needs a connection | 接続が必要です
- `common.try_again`: Try Again | もう一度試す

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

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> OfflineBanner` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
