# ShortcutHelp

A dialog listing the app's keyboard shortcuts by group, opened with ? or from Help, so shortcuts can be learned instead of guessed.

| | |
| --- | --- |
| Group | Other elements |
| Basecoat | `dialog` (`<dialog class="dialog">`), `kbd`, `btn`, `input` (filter) |
| Needs | The app's shortcut table (one list in code, also used to bind the keys); `js/shortcuts.mjs` below |
| Used in | Help, CommandPalette (shows the same keys), AppCode, AppChat, AppNotes, AppBoard, TopBar (Help menu) |

## Markup

```html
<dialog id="shortcuts" class="dialog" aria-labelledby="shortcuts-title" onclick="if (event.target === this) this.close()">
  <div class="sm:max-w-2xl">
    <header>
      <h2 id="shortcuts-title" data-t="keys.title">Keyboard shortcuts</h2>
      <p data-t="keys.lede">Press ? anywhere to see this list.</p>
    </header>
    <section class="grid gap-6 overflow-y-auto sm:grid-cols-2">
      <input class="input sm:col-span-2" type="search" id="shortcuts-filter" placeholder="Filter shortcuts" data-t-placeholder="keys.filter" aria-controls="shortcuts-list">
      <div id="shortcuts-list" class="contents">
        <section aria-labelledby="keys-g1">
          <h3 id="keys-g1" class="mb-2 text-sm font-medium text-muted-foreground" data-t="keys.group.general">General</h3>
          <dl class="grid gap-2 text-sm">
            <div class="flex items-center justify-between gap-4">
              <dt data-t="keys.search">Search</dt>
              <dd class="flex items-center gap-1"><kbd class="kbd">⌘</kbd><kbd class="kbd">K</kbd></dd>
            </div>
            <div class="flex items-center justify-between gap-4">
              <dt data-t="keys.help">Show shortcuts</dt>
              <dd><kbd class="kbd">?</kbd></dd>
            </div>
          </dl>
        </section>
        <section aria-labelledby="keys-g2">
          <h3 id="keys-g2" class="mb-2 text-sm font-medium text-muted-foreground" data-t="keys.group.notes">Notes</h3>
          <dl class="grid gap-2 text-sm">
            <div class="flex items-center justify-between gap-4"><dt data-t="keys.new_note">New note</dt><dd><kbd class="kbd">N</kbd></dd></div>
            <div class="flex items-center justify-between gap-4"><dt data-t="keys.next">Next / previous</dt><dd class="flex items-center gap-1"><kbd class="kbd">J</kbd><span class="text-muted-foreground">/</span><kbd class="kbd">K</kbd></dd></div>
          </dl>
        </section>
      </div>
      <p id="shortcuts-none" class="text-sm text-muted-foreground" hidden data-t="keys.none">No shortcut matches.</p>
    </section>
    <footer><button class="btn" type="button" onclick="this.closest('dialog').close()" data-t="keys.close">Close</button></footer>
    <button type="button" class="btn" data-variant="ghost" data-size="icon-sm" aria-label="Close" data-t-label="keys.close" onclick="this.closest('dialog').close()">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
    </button>
  </div>
</dialog>
```

**Width**: Basecoat sizes the dialog's inner `div` (`sm:max-w-md` by default); widen it there with `sm:max-w-2xl`. A dialog sits in the top layer, outside `.app`, so inside it use the viewport variant `sm:`, not container variants.

**Modifier keys by platform**: show ⌘ on Apple devices and `Ctrl` elsewhere (`/Mac|iPhone|iPad/.test(navigator.platform)`); ⌥ / `Alt`, ⇧ / `Shift`. Each key is its own `kbd`. Write letters as capitals (K), arrows as ← ↑ → ↓, Return as `Return` on Apple and `Enter` elsewhere.

```js
// js/shortcuts.mjs: one table binds the keys and fills the dialog
export const SHORTCUTS = [
  {group: 'general', key: 'k', mod: true, label: 'keys.search', run: () => openPalette()},
  {group: 'general', key: '?', label: 'keys.help', run: () => document.getElementById('shortcuts').showModal()},
  {group: 'notes', key: 'n', label: 'keys.new_note', run: () => newNote()},
];
const typing = e => e.target.closest('input, textarea, select, [contenteditable="true"]');
document.addEventListener('keydown', e => {
  if (e.isComposing || (typing(e) && !(e.metaKey || e.ctrlKey))) return;   // single keys never fire while typing or composing Japanese
  const s = SHORTCUTS.find(s => s.key === e.key.toLowerCase() && !!s.mod === (e.metaKey || e.ctrlKey));
  if (s) { e.preventDefault(); s.run(); }
});
```

## States

| State | What changes |
| --- | --- |
| Open | `showModal()`; focus on the filter field; page behind is inert (native). |
| Filtering | Rows whose label doesn't contain the text get `hidden`; groups with no visible rows get `hidden`; if nothing is left, `#shortcuts-none` shows. |
| No shortcuts in a group on this device | Don't render the group (e.g. touch-only devices: the Help page says shortcuts need a keyboard). |
| Phone without a keyboard | Don't offer the dialog in menus; Help shows `keys.need_keyboard`. With a hardware keyboard, ? still opens it. |
| Shortcut turned off | Settings → `keys.single_keys` switch (“Use single-key shortcuts”) off: single-letter rows show `keys.off` and don't fire (needed for speech input users). |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `keys.title` | Keyboard shortcuts | キーボードショートカット |
| `keys.lede` | Press ? anywhere to see this list. | どこでも ? を押すとこの一覧を表示します。 |
| `keys.filter` | Filter shortcuts | ショートカットを絞り込む |
| `keys.none` | No shortcut matches. | 該当するショートカットはありません。 |
| `keys.close` | Close | 閉じる |
| `keys.group.general` | General | 全般 |
| `keys.group.notes` | Notes | ノート |
| `keys.search` | Search | 検索 |
| `keys.help` | Show shortcuts | ショートカットを表示 |
| `keys.new_note` | New note | 新しいノート |
| `keys.next` | Next / previous | 次へ / 前へ |
| `keys.need_keyboard` | Shortcuts work with a keyboard. | ショートカットはキーボードで使えます。 |
| `keys.single_keys` | Use single-key shortcuts | 1キーのショートカットを使う |
| `keys.off` | Off | オフ |

## Keyboard and focus

1. Filter → 2. Close (footer) → 3. the × button. The lists are read, not focusable.
- ? opens (Shift+/ on most layouts; check `e.key === '?'`, not the key code), Esc closes, focus returns to what was focused before.
- Single-letter shortcuts never fire inside text fields, contenteditable, or during IME composition.

## Phone

- Below 640 px (`sm`) the dialog is the screen width minus 2rem with one column of groups; the list scrolls inside, the filter stays at the top; rows are text, not targets.

## Data

```json
{"shortcuts": [{"group": "general", "keys": ["mod", "k"], "label": "keys.search"}, {"group": "notes", "keys": ["n"], "label": "keys.new_note"}]}
```

- The same table drives the key bindings and the dialog, so they can't disagree. Web apps render the dialog from the Python copy of the table in `base.html`; no-server apps from `SHORTCUTS`.

## Don't

- Don't take the browser's own keys (⌘T, ⌘W, ⌘N, ⌘1–9, ⌘L, ⌘R) or the system's (⇧⌘3–5).
- Don't bind single letters that also type text in focused fields.
- Don't list a shortcut that isn't bound.
