# ShopScreen

App Block card (Game blocks). Buy and sell with a shopkeeper: a list of goods with prices, what you own of each, your coins, and a quantity step before paying.

- Basecoat: none (game kit: `game-panel`, `game-tabs`, `game-list`, `game-icon[data-kind=coin]`, `game-value`)
- Needs: GameKit; InventoryGrid (owned counts, free slots); the shop's stock (Data)
- Used in: GameRpg, GameCozy, GameRoguelike (between floors), GameTowerDefence (upgrades)

## Markup
Copy, never retype: `{harness}/kit/blocks/game-blocks/ShopScreen.html` (28 lines of HTML).

Buying opens a quantity step in the same panel: `.game-option` “How many?” with `.game-value` (← → by 1, ↑ ↓ by 10), the total, then **Buy** (`game-btn` solid) and **Cancel**.

## States
- Not enough coins: Row `aria-disabled="true"`, price in `--g-dim`, `shop.not_enough`. Still focusable to read the description.
- Bag full: Buy is disabled with `inv.full`.
- Sold out: `shop.sold_out` instead of the price.
- Bought: Coins count down to the new value, a coin sound, `shop.bought` announced; focus stays on the row.
- Sell tab: Your items with sell prices (half the buy price); key items absent.
- Discount: The old price struck through in `--g-dim` before the new one.

## Texts
(Key | English | 日本語)
- `shop.mira`: Mira’s Stall | ミラの屋台
- `shop.buy`: Buy | 買う
- `shop.sell`: Sell | 売る
- `shop.leave`: Leave | 店を出る
- `shop.owned`: Own | 所持
- `shop.how_many`: How many? | いくつ買いますか？
- `shop.total`: Total {coins} | 合計 {coins}
- `shop.not_enough`: Not enough coins | お金が足りません
- `shop.sold_out`: Sold out | 売り切れ
- `shop.bought`: Bought {count} × {item} | {item} を {count} 個買いました
- `item.potion`: Potion | ポーション
- `item.potion.desc`: Restores 5 health. Tastes of mint. | HPを5回復する。ミントの味がする。
- `item.iron_shield`: Iron Shield | 鉄の盾

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

## Pi Workbench
- Assumes GameKit (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> ShopScreen` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
