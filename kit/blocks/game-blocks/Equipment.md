# Equipment

App Block card (Game blocks). What the character wears and holds: one slot per body place, the stats they add, and a comparison before changing anything.

- Basecoat: none (game kit: `game-panel`, `game-slot`, `game-list`, `game-num`)
- Needs: GameKit; InventoryGrid (the items to choose from); item stats (Data)
- Used in: GameRpg, GameRoguelike, GameTactics (per unit)

## Markup
Copy, never retype: `{harness}/kit/blocks/game-blocks/Equipment.html` (23 lines of HTML).

Choosing a slot opens a list of the matching items from the bag (`.game-list`, each with its icon, name and the stat change it would make); the third stats column shows the result for the focused item: ▲ in `--g-good`, ▼ in `--g-bad`, with the arrow so colour isn't the only sign.

## States
- Empty slot: `eq.none` in dim text; Remove is not offered.
- Comparing: The third column appears with the value after the change.
- Can't equip: The item row is `aria-disabled="true"` with its reason (`eq.too_heavy`, `eq.class_only`).
- Cursed / locked: Remove is disabled; `eq.locked` under the slot.
- Party: Shoulders (Q / E) switch character; the name in the title changes.

## Texts
(Key | English | 日本語)
- `eq.title`: Equipment | そうび
- `eq.weapon`: Weapon | 武器
- `eq.armor`: Armor | よろい
- `eq.shield`: Shield | 盾
- `eq.feet`: Feet | くつ
- `eq.charm`: Charm | お守り
- `eq.none`: Nothing | なし
- `eq.change`: Change | 変更
- `eq.remove`: Remove | はずす
- `eq.too_heavy`: Too heavy for Rin | リンには重すぎます
- `eq.class_only`: Only for mages | 魔法使い専用
- `eq.locked`: Can’t be removed | はずせません
- `stat.attack`: Attack | こうげき
- `stat.defence`: Defence | ぼうぎょ
- `stat.speed`: Speed | すばやさ
- `item.bronze_sword`: Bronze Sword | 青銅の剣

## Keyboard and focus
1. Slots (↑ ↓) → Enter/south opens the item list for that slot → ↑ ↓ to compare → Enter/south equips, Esc/east returns to the slot.
- X/west removes the item in the focused slot. Q / E or shoulders switch party member.

## Phone
- Stats move under the slot list; the item list opens full width over it. Rows are 44 px.

## Data
```json
{"party": [{"id": "rin", "equip": {"weapon": "bronze_sword", "armor": null, "shield": "wood_shield", "feet": "boots", "charm": null},
            "base": {"attack": 9, "defence": 6, "speed": 6}}],
 "items": {"bronze_sword": {"slot": "weapon", "attack": 3}, "iron_sword": {"slot": "weapon", "attack": 6, "speed": -1}}}
```

- Stats shown are base + every equipped item; the save keeps only ids.

## Don't
- Don't show a paper-doll as the only way to pick slots; the list is the control.
- Don't hide the comparison behind a hover.

## Pi Workbench
- Assumes GameKit (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> Equipment` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
