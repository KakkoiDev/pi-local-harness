# ShortcutHelp

App Block card (Other elements). A dialog listing the app's keyboard shortcuts by group, opened with ? or from Help, so shortcuts can be learned instead of guessed.

- Basecoat: `dialog` (`<dialog class="dialog">`), `kbd`, `btn`, `input` (filter)
- Needs: The app's shortcut table (one list in code, also used to bind the keys); `js/shortcuts.mjs` below
- Used in: Help, CommandPalette (shows the same keys), AppCode, AppChat, AppNotes, AppBoard, TopBar (Help menu)

## Markup
Copy, never retype: `{harness}/kit/blocks/elements/ShortcutHelp.html` (38 lines of HTML).

**Width**: Basecoat sizes the dialog's inner `div` (`sm:max-w-md` by default); widen it there with `sm:max-w-2xl`. A dialog sits in the top layer, outside `.app`, so inside it use the viewport variant `sm:`, not container variants.

**Modifier keys by platform**: show ⌘ on Apple devices and `Ctrl` elsewhere (`/Mac|iPhone|iPad/.test(navigator.platform)`); ⌥ / `Alt`, ⇧ / `Shift`. Each key is its own `kbd`. Write letters as capitals (K), arrows as ← ↑ → ↓, Return as `Return` on Apple and `Enter` elsewhere.

Copy, never retype: `{harness}/kit/blocks/elements/ShortcutHelp.js` (12 lines of JS).

## States
- Open: `showModal()`; focus on the filter field; page behind is inert (native).
- Filtering: Rows whose label doesn't contain the text get `hidden`; groups with no visible rows get `hidden`; if nothing is left, `#shortcuts-none` shows.
- No shortcuts in a group on this device: Don't render the group (e.g. touch-only devices: the Help page says shortcuts need a keyboard).
- Phone without a keyboard: Don't offer the dialog in menus; Help shows `keys.need_keyboard`. With a hardware keyboard, ? still opens it.
- Shortcut turned off: Settings → `keys.single_keys` switch (“Use single-key shortcuts”) off: single-letter rows show `keys.off` and don't fire (needed for speech input users).

## Texts
(Key | English | 日本語)
- `keys.title`: Keyboard shortcuts | キーボードショートカット
- `keys.lede`: Press ? anywhere to see this list. | どこでも ? を押すとこの一覧を表示します。
- `keys.filter`: Filter shortcuts | ショートカットを絞り込む
- `keys.none`: No shortcut matches. | 該当するショートカットはありません。
- `keys.close`: Close | 閉じる
- `keys.group.general`: General | 全般
- `keys.group.notes`: Notes | ノート
- `keys.search`: Search | 検索
- `keys.help`: Show shortcuts | ショートカットを表示
- `keys.new_note`: New note | 新しいノート
- `keys.next`: Next / previous | 次へ / 前へ
- `keys.need_keyboard`: Shortcuts work with a keyboard. | ショートカットはキーボードで使えます。
- `keys.single_keys`: Use single-key shortcuts | 1キーのショートカットを使う
- `keys.off`: Off | オフ

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

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> ShortcutHelp` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
