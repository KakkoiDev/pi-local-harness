# ShopScreen

Buy and sell with a shopkeeper: a list of goods with prices, what you own of each, your coins, and a quantity step before paying.

| | |
| --- | --- |
| Group | Game blocks |
| Basecoat | none (game kit: `game-panel`, `game-tabs`, `game-list`, `game-icon[data-kind=coin]`, `game-value`) |
| Needs | GameKit; InventoryGrid (owned counts, free slots); the shop's stock (Data) |
| Used in | GameRpg, GameCozy, GameRoguelike (between floors), GameTowerDefence (upgrades) |

## Markup

```html
<section id="shop" class="game-overlay" role="dialog" aria-modal="true" aria-labelledby="shop-title" hidden>
  <div class="game-panel" style="width:min(640px,100%);display:grid;gap:10px">
    <div class="game-row" style="justify-content:space-between">
      <h2 id="shop-title" class="game-h" data-t="shop.mira">Mira’s Stall</h2>
      <span class="game-row game-num" aria-label="Your coins: 86"><span class="game-icon" data-kind="coin"></span>86</span>
    </div>
    <div class="game-tabs" role="tablist">
      <button class="game-tab" role="tab" aria-selected="true" data-t="shop.buy">Buy</button>
      <button class="game-tab" role="tab" aria-selected="false" tabindex="-1" data-t="shop.sell">Sell</button>
    </div>
    <ul class="game-list" role="listbox" aria-label="Goods">
      <li role="option" tabindex="0" aria-selected="true">
        <img src="assets/items/potion.png" alt="" width="32" height="32">
        <span style="flex:1" data-t="item.potion">Potion</span>
        <span class="game-small"><span data-t="shop.owned">Own</span> 2</span>
        <span class="game-row game-num" style="min-width:4.5em;justify-content:flex-end"><span class="game-icon" data-kind="coin" aria-hidden="true"></span>12</span>
      </li>
      <li role="option" tabindex="-1" aria-disabled="true">
        <img src="assets/items/shield.png" alt="" width="32" height="32">
        <span style="flex:1" data-t="item.iron_shield">Iron Shield</span>
        <span class="game-small" data-t="shop.not_enough">Not enough coins</span>
        <span class="game-row game-num" style="min-width:4.5em;justify-content:flex-end"><span class="game-icon" data-kind="coin" aria-hidden="true"></span>140</span>
      </li>
    </ul>
    <p class="game-small" aria-live="polite" data-t="item.potion.desc">Restores 5 health. Tastes of mint.</p>
    <p class="game-hint"><!-- Enter/south: Buy · Tab or shoulders: Buy/Sell · Esc/east: Leave --></p>
  </div>
</section>
```

Buying opens a quantity step in the same panel: `.game-option` “How many?” with `.game-value` (← → by 1, ↑ ↓ by 10), the total, then **Buy** (`game-btn` solid) and **Cancel**.

## States

| State | What changes |
| --- | --- |
| Not enough coins | Row `aria-disabled="true"`, price in `--g-dim`, `shop.not_enough`. Still focusable to read the description. |
| Bag full | Buy is disabled with `inv.full`. |
| Sold out | `shop.sold_out` instead of the price. |
| Choosing how many | Enter/south on a row opens a quantity step on it (− 1 +, ← → or the d-pad); the panel's last line shows `shop.total` (set from code, `{coins}` the price × count); Enter buys, Esc goes back to the list. |
| Bought | Coins count down to the new value, a coin sound; the `aria-live` description line gets `shop.bought` (set from code); focus stays on the row. |
| Sell tab | Your items with sell prices (half the buy price); key items absent. |
| Discount | The old price struck through in `--g-dim` before the new one. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `shop.mira` | Mira’s Stall | ミラの屋台 |
| `shop.buy` | Buy | 買う |
| `shop.sell` | Sell | 売る |
| `shop.leave` | Leave | 店を出る |
| `shop.owned` | Own | 所持 |
| `shop.how_many` | How many? | いくつ買いますか？ |
| `shop.total` | Total {coins} | 合計 {coins} |
| `shop.not_enough` | Not enough coins | お金が足りません |
| `shop.sold_out` | Sold out | 売り切れ |
| `shop.bought` | Bought {count} × {item} | {item} を {count} 個買いました |
| `item.potion` | Potion | ポーション |
| `item.potion.desc` | Restores 5 health. Tastes of mint. | HPを5回復する。ミントの味がする。 |
| `item.iron_shield` | Iron Shield | 鉄の盾 |

## Keyboard and focus

1. Buy/Sell tabs (Tab, Q / E, shoulders) → 2. goods (↑ ↓) → Enter/south: quantity → ← → ↑ ↓ amount → Enter: Buy, Esc: back to the row.
- Esc/east from the list leaves the shop; the shopkeeper says a closing line (DialogueBox).

## Phone

- Full-width list; the owned count drops under the name; the quantity step has − and + buttons (44 px) beside the number.

## Data

```json
{"shop": {"id": "mira", "stock": [{"id": "potion", "price": 12, "left": null}, {"id": "iron_shield", "price": 140, "left": 1}], "sellRate": 0.5},
 "player": {"coins": 86}}
```

## Don't

- Don't use real money words or currency symbols for game coins.
- Don't buy on a single press without the quantity step for stackable items.
