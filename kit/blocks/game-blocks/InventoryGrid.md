# InventoryGrid

App Block card (Game blocks). The items the player carries, as a grid of slots with counts, a detail panel for the selected item, and Use, Drop and Sort.

- Basecoat: none (game kit: `game-panel`, `game-tabs`, `game-slots`, `game-slot`, `game-count`)
- Needs: GameKit; item definitions (Data); 16 × 16 item icons from visual-core drawn into each slot (`<canvas>` or a sprite `<img>` from the atlas with `image-rendering: pixelated`)
- Links to: Equipment, ShopScreen, CardHand (deck view uses the same grid)

## Markup
Copy, never retype: `{harness}/kit/blocks/game-blocks/InventoryGrid.html` (34 lines of HTML).

## States
- Empty bag: The grid shows empty slots and `inv.empty` in the detail panel.
- Can't use here: Use is `disabled` with `inv.cant_use` under it (e.g. a key away from its door).
- Key item: No Drop; `inv.key_item` under the description.
- Full: The count reads in `--g-bad`; picking something up shows TutorialPrompt `inv.full` once.
- Moving an item: Enter on a slot then on another swaps them (drag with mouse or finger also works); the first slot shows a dashed outline until the second is chosen; Esc cancels.
- Stack: Counts above 99 show “99+”; the detail shows the real number.

## Texts
(Key | English | 日本語)
- `inv.title`: Bag | もちもの
- `inv.slots_used`: {used} of {max} slots | {used} / {max} 枠
- `inv.all`: All | すべて
- `inv.consumables`: Use | 消耗品
- `inv.materials`: Materials | 素材
- `inv.key_items`: Key Items | だいじなもの
- `inv.use`: Use | 使う
- `inv.drop`: Drop | 捨てる
- `inv.sort`: Sort | 整理
- `inv.empty`: Your bag is empty. | もちものはありません。
- `inv.cant_use`: You can’t use this here. | ここでは使えません。
- `inv.key_item`: Important: can’t be dropped. | だいじなもの：捨てられません。
- `inv.full`: Your bag is full. Drop or use something first. | もちものがいっぱいです。先に何かを使うか捨ててください。
- `item.apple`: Apple | りんご
- `item.apple.desc`: Crisp and sweet. Restores 2 health. | シャキッと甘い。HPを2回復する。

## Keyboard and focus
1. Tabs (Q / E or shoulders switch) → 2. the grid (arrows or d-pad move by slot, wrapping by row) → 3. Use → Drop.
- Enter/south on a slot moves focus to Use; Esc/east goes back to the slot, then closes. I opens and closes the bag from play.

## Phone
- 5 columns in portrait; the detail panel goes under the grid; slots are 48 px (12 art pixels × 4).
- Long-press a slot for its detail without selecting; drag to move.

## Data
```json
{"inventory": {"max": 24, "slots": [{"id": "apple", "n": 5}, {"id": "rope", "n": 1}, null]},
 "items": {"apple": {"kind": "consumable", "icon": "items/apple", "heal": 2, "stack": 99},
           "well_key": {"kind": "key", "icon": "items/key"}}}
```

- Slot order is saved (SaveSlots); item definitions are data files (`data/items.json`).

## Don't
- Don't show item stats only as icons; name them.
- Don't put drag-and-drop as the only way to move items.
- Don't scale item art by non-whole numbers.

## Pi Workbench
- Assumes GameKit (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> InventoryGrid` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
