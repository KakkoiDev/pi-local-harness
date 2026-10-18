# SavedState

A quiet line that says whether the person's work is saved: "Saving…", "Saved at 14:32", "Not saved" with Try Again, next to the thing being edited.

| | |
| --- | --- |
| Group | Feedback |
| Basecoat | `btn` (text from tokens) |
| Needs | The editor's save calls (autosave after a pause, or a Save button) |
| Used in | DocEditor, BlockEditor, Profile, EditForm, SettingsPage (each switch saves at once) |

## Markup

```html
<p id="note-saved" class="flex items-center gap-1.5 text-muted-foreground text-sm" role="status" aria-live="polite" data-state="saved">
  <svg class="size-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
  <span data-t="saved.at">Saved at <time datetime="2026-10-18T14:32">14:32</time></span>
</p>
```

```js
// autosave: 800 ms after the last keystroke, and on blur and page hide
let timer;
editor.addEventListener('input', () => { setSaved('unsaved'); clearTimeout(timer); timer = setTimeout(save, 800); });
addEventListener('pagehide', save);
async function save() {
  setSaved('saving');
  try { await store.saveNote(note); setSaved('saved', new Date()); }
  catch { setSaved(navigator.onLine ? 'failed' : 'local'); }
}
```

## States

| `data-state` | Icon | Text | Extra |
| --- | --- | --- | --- |
| `saved` (default) | check | `saved.at` with the time (today: 14:32; earlier: 17 Oct, 14:32) | — |
| `unsaved` | dot | `saved.unsaved` | — |
| `saving` | spinner (`animate-spin motion-reduce:animate-none`) | `saved.saving` | — |
| `local` | cloud-off | `saved.local` | Syncs when online (OfflineBanner) |
| `failed` | alert-circle, the line gets `text-destructive` | `saved.failed` | `<button class="btn" data-variant="link" data-size="xs">` Try Again |
| `conflict` | alert-triangle | `saved.conflict` | `btn` link `saved.conflict_view` opens the other version |

- Change the text only when the state changes; "Saving…" shows for at least 300 ms so it doesn't flicker.
- When leaving the page with `unsaved` or `failed`, the browser's `beforeunload` prompt is used; LogOut uses its own dialog.

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `saved.at` | Saved at {time} | {time} に保存しました |
| `saved.unsaved` | Not saved yet | まだ保存されていません |
| `saved.saving` | Saving… | 保存中… |
| `saved.local` | Saved on this device | このデバイスに保存しました |
| `saved.failed` | Not saved. | 保存できませんでした。 |
| `saved.conflict` | Someone else changed this note. | 他の人がこのノートを変更しました。 |
| `saved.conflict_view` | Compare Versions | 変更を比較 |
| `common.try_again` | Try Again | もう一度試す |

## Keyboard and focus

- The line never takes focus. ⌘S / Ctrl+S saves at once and the line updates; don't show the browser's Save Page dialog (`preventDefault`).
- Try Again is in the Tab order right after the editor.

## Phone

- On the phone it sits in the TopBar next to the title (right side), icon and text; below 360 px only the icon shows, with the text as `aria-label` on the line.

## Data

```json
{"state": "saved", "saved_at": "2026-10-18T14:32:05+09:00", "version": 12}
```

- Web: `hx-put="/notes/n_42" hx-trigger="input changed delay:800ms, blur"`, the response swaps `#note-saved`; 409 with the newer version for a conflict.
- No server: the store's promise resolves or rejects; `local` is the same as saved for the person, until a sync exists.

## Don't

- Don't use a toast for every autosave.
- Don't show a Save button and autosave together for the same field.
- Don't say "All changes saved" when an earlier save failed.
