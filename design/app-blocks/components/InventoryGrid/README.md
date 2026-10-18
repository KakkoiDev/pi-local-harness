# InventoryGrid

The items the player carries, as a grid of slots with counts, a detail panel for the selected item, and Use, Drop and Sort.

| | |
| --- | --- |
| Group | Game blocks |
| Basecoat | none (game kit: `game-panel`, `game-tabs`, `game-slots`, `game-slot`, `game-count`) |
| Needs | GameKit; item definitions (Data); 16 × 16 item icons from visual-core drawn into each slot (`<canvas>` or a sprite `<img>` from the atlas with `image-rendering: pixelated`) |
| Links to | Equipment, ShopScreen, CardHand (deck view uses the same grid) |

## Markup

```html
<section id="inventory" class="game-overlay" role="dialog" aria-modal="true" aria-labelledby="inv-title" hidden>
  <div class="game-panel" style="width:min(640px,100%);display:grid;gap:12px">
    <div class="game-row" style="justify-content:space-between">
      <h2 id="inv-title" class="game-h" data-t="inv.title">Bag</h2>
      <span class="game-small"><span data-t="inv.slots_used">18 of 24 slots</span></span>
    </div>
    <div class="game-tabs" role="tablist" aria-label="Item kind">
      <button class="game-tab" role="tab" aria-selected="true" data-t="inv.all">All</button>
      <button class="game-tab" role="tab" aria-selected="false" tabindex="-1" data-t="inv.consumables">Use</button>
      <button class="game-tab" role="tab" aria-selected="false" tabindex="-1" data-t="inv.materials">Materials</button>
      <button class="game-tab" role="tab" aria-selected="false" tabindex="-1" data-t="inv.key_items">Key Items</button>
    </div>
    <div class="game-row" style="align-items:flex-start;gap:16px">
      <div class="game-slots" role="grid" aria-label="Bag" data-t-label="inv.title" style="--cols:6">
        <button class="game-slot" role="gridcell" aria-selected="true" aria-label="Apple, 5"><img src="assets/items/apple.png" alt="" width="32" height="32"><span class="game-count">5</span></button>
        <button class="game-slot" role="gridcell" aria-selected="false" aria-label="Rope, 1"><img src="assets/items/rope.png" alt="" width="32" height="32"></button>
        <!-- … one button per slot; empty slots: <span class="game-slot" role="gridcell" aria-label="Empty"></span> -->
      </div>
      <div style="flex:1;min-width:160px;display:grid;gap:6px" aria-live="polite">
        <span class="game-speaker" data-t="item.apple">Apple</span>
        <p class="game-line" style="font-size:13px;margin:0" data-t="item.apple.desc">Crisp and sweet. Restores 2 health.</p>
        <ul class="game-menu">
          <li><button class="game-btn" data-t="inv.use">Use</button></li>
          <li><button class="game-btn" data-t="inv.drop">Drop</button></li>
        </ul>
      </div>
    </div>
    <p class="game-hint">
      <span class="game-row"><span data-for="keyboard mouse"><span class="game-key">Enter</span></span><span data-for="gamepad"><span class="game-padpos" data-pos="south" aria-label="South button"></span></span><span data-t="inv.use">Use</span></span>
      <span class="game-row"><span data-for="keyboard mouse"><span class="game-key">S</span></span><span data-for="gamepad"><span class="game-padpos" data-pos="north" aria-label="North button"></span></span><span data-t="inv.sort">Sort</span></span>
      <span class="game-row"><span data-for="keyboard mouse"><span class="game-key">I</span></span><span data-for="gamepad"><span class="game-padpos" data-pos="east" aria-label="East button"></span></span><span data-t="game.back">Back</span></span>
    </p>
  </div>
</section>
```

## States

| State | What changes |
| --- | --- |
| Empty bag | The grid shows empty slots and `inv.empty` in the detail panel. |
| Can't use here | Use is `disabled` with `inv.cant_use` under it (e.g. a key away from its door). |
| Key item | No Drop; `inv.key_item` under the description. |
| Full | The count reads in `--g-bad`; picking something up shows TutorialPrompt `inv.full` once. |
| Moving an item | Enter on a slot then on another swaps them (drag with mouse or finger also works); the first slot shows a dashed outline until the second is chosen; Esc cancels. |
| Stack | Counts above 99 show “99+”; the detail shows the real number. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `inv.title` | Bag | もちもの |
| `inv.slots_used` | {used} of {max} slots | {used} / {max} 枠 |
| `inv.all` | All | すべて |
| `inv.consumables` | Use | 消耗品 |
| `inv.materials` | Materials | 素材 |
| `inv.key_items` | Key Items | だいじなもの |
| `inv.use` | Use | 使う |
| `inv.drop` | Drop | 捨てる |
| `inv.sort` | Sort | 整理 |
| `inv.empty` | Your bag is empty. | もちものはありません。 |
| `inv.cant_use` | You can’t use this here. | ここでは使えません。 |
| `inv.key_item` | Important: can’t be dropped. | だいじなもの：捨てられません。 |
| `inv.full` | Your bag is full. Drop or use something first. | もちものがいっぱいです。先に何かを使うか捨ててください。 |
| `item.apple` | Apple | りんご |
| `item.apple.desc` | Crisp and sweet. Restores 2 health. | シャキッと甘い。HPを2回復する。 |

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
