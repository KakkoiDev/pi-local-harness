# SaveSlots

Three save slots for saving and loading, each showing the place, play time and when it was saved, with overwrite and delete confirmed first.

| | |
| --- | --- |
| Group | Game blocks |
| Basecoat | none (game kit: `game-panel`, `game-list`, `game-btn`) |
| Needs | GameKit; `localStorage` (no server); a tiny screenshot of the moment (a 160 × 90 PNG from the main canvas, `canvas.toDataURL()`, optional) |
| Links to | TitleScreen (Load Game, Continue), PauseMenu (Save) |

## Markup

```html
<section id="saves" class="game-overlay" role="dialog" aria-modal="true" aria-labelledby="saves-title" data-mode="save" hidden>
  <div class="game-panel" style="width:min(620px,100%);display:grid;gap:10px">
    <h2 id="saves-title" class="game-h" data-t="saves.save_title">Save Game</h2>
    <ul class="game-list" role="listbox" aria-label="Save slots">
      <li role="option" tabindex="0" aria-selected="true" data-slot="1">
        <img src="data:image/png;base64,…" alt="" width="80" height="45" style="image-rendering:pixelated">
        <span style="flex:1"><span class="game-small" data-t="saves.slot">Slot 1</span><br><span data-t="place.willow_field">Willow Field</span></span>
        <span class="game-small game-num" style="text-align:right">2:03:00<br>18 Oct 14:20</span>
      </li>
      <li role="option" tabindex="-1" data-slot="2"><span class="game-small" style="width:80px;text-align:center">—</span><span style="flex:1"><span class="game-small">Slot 2</span><br><span data-t="saves.empty">Empty</span></span></li>
      <li role="option" tabindex="-1" data-slot="3">…</li>
    </ul>
    <p class="game-hint"><!-- Enter/south: Save here · Delete/west: Delete · Esc/east: Back --></p>
  </div>
</section>
```

`data-mode="load"` reuses the same panel: title `saves.load_title`, empty slots `aria-disabled="true"`, Enter loads.

## States

| State | What changes |
| --- | --- |
| Saving over a slot | A game-style confirm `.game-panel` over the list: `saves.overwrite` (set from code, `{n}` the slot) with Overwrite (solid) and Cancel; Cancel is focused. |
| Saved | The slot updates; a polite live region announces `saves.saved` (set from code); focus stays. |
| Autosave | A fourth row first, `saves.autosave`, load-only. |
| Delete | The same confirm with `saves.delete_confirm` (set from code); Cancel focused. |
| Broken save | Dim row with `saves.broken`; can be deleted, not loaded. |
| Storage full | `saves.storage_full` under the list; nothing is lost. |
| Newer version | A save from a newer game version: `saves.too_new`, not loadable. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `saves.save_title` | Save Game | セーブ |
| `saves.load_title` | Load Game | ロード |
| `saves.slot` | Slot {n} | スロット {n} |
| `saves.empty` | Empty | 空き |
| `saves.autosave` | Autosave | オートセーブ |
| `saves.save_here` | Save Here | ここにセーブ |
| `saves.delete` | Delete | 削除 |
| `saves.overwrite` | Save over Slot {n}? The old save is replaced. | スロット {n} に上書きしますか？以前のデータは消えます。 |
| `saves.overwrite_btn` | Overwrite | 上書き |
| `saves.delete_confirm` | Delete the save in Slot {n}? This can’t be undone. | スロット {n} のデータを削除しますか？元に戻せません。 |
| `saves.saved` | Saved to Slot {n}. | スロット {n} にセーブしました。 |
| `saves.broken` | This save can’t be read | このデータは読み込めません |
| `saves.storage_full` | The browser has no room left for saves. Delete a save or free space in the browser’s settings. | ブラウザの保存領域がいっぱいです。データを削除するか、ブラウザの設定で空きを作ってください。 |
| `saves.too_new` | Made with a newer version | 新しいバージョンで作成されたデータです |

## Keyboard and focus

1. Slots (↑ ↓) → Enter/south saves or loads → the confirm (Cancel focused; ← → between buttons).
- Delete or Backspace, or west: delete. Esc/east: back to where it was opened.

## Phone

- Rows are 64 px with the thumbnail at 64 × 36; dates in short form.
- Saves stay in this browser only; `saves.device_note` (“Saves stay on this device.” / “セーブデータはこの端末に保存されます。”) under the list.

## Data

```json
{"key": "meadow-quest.save.1",
 "value": {"v": 1, "game": "1.0.0", "savedAt": "2026-10-18T05:20:00Z", "playTime": 7380, "place": "place.willow_field",
           "thumb": "data:image/png;base64,…",
           "state": {"player": {"x": 70, "y": 50, "hp": 7}, "inventory": {}, "quests": {}, "flags": {"quest.well": "active"}}}}
```

- One key per slot (`<game-id>.save.<1|2|3|auto>`); write the new value whole, then read it back to check it parses before announcing Saved.

## Don't

- Don't save to a server or a cookie.
- Don't overwrite without asking.
