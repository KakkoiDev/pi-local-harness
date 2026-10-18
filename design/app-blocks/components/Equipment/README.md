# Equipment

What the character wears and holds: one slot per body place, the stats they add, and a comparison before changing anything.

| | |
| --- | --- |
| Group | Game blocks |
| Basecoat | none (game kit: `game-panel`, `game-slot`, `game-list`, `game-num`) |
| Needs | GameKit; InventoryGrid (the items to choose from); item stats (Data) |
| Used in | GameRpg, GameRoguelike, GameTactics (per unit) |

## Markup

```html
<section id="equipment" class="game-overlay" role="dialog" aria-modal="true" aria-labelledby="eq-title" hidden>
  <div class="game-panel" style="width:min(640px,100%);display:grid;gap:12px">
    <h2 id="eq-title" class="game-h"><span data-t="eq.title">Equipment</span> · Rin</h2>
    <div class="game-row" style="align-items:flex-start;gap:20px">
      <ul class="game-list" aria-label="Slots" style="flex:1;min-width:200px">
        <li tabindex="0" aria-selected="true" data-slot="weapon">
          <span class="game-slot" aria-hidden="true"><img src="assets/items/sword.png" alt="" width="32" height="32"></span>
          <span style="flex:1"><span class="game-small" data-t="eq.weapon">Weapon</span><br><span data-t="item.bronze_sword">Bronze Sword</span></span>
        </li>
        <li tabindex="-1" data-slot="armor"><span class="game-slot" aria-hidden="true"></span><span style="flex:1"><span class="game-small" data-t="eq.armor">Armor</span><br><span data-t="eq.none">Nothing</span></span></li>
        <li tabindex="-1" data-slot="shield">…</li>
        <li tabindex="-1" data-slot="feet">…</li>
        <li tabindex="-1" data-slot="charm">…</li>
      </ul>
      <dl class="grid" style="grid-template-columns:auto auto auto;gap:4px 12px;margin:0;min-width:180px" aria-label="Stats">
        <dt data-t="stat.attack">Attack</dt><dd class="game-num" style="margin:0">12</dd><dd class="game-num" style="margin:0;color:var(--g-good)">▲ 15</dd>
        <dt data-t="stat.defence">Defence</dt><dd class="game-num" style="margin:0">8</dd><dd class="game-num" style="margin:0">8</dd>
        <dt data-t="stat.speed">Speed</dt><dd class="game-num" style="margin:0">6</dd><dd class="game-num" style="margin:0;color:var(--g-bad)">▼ 5</dd>
      </dl>
    </div>
    <p class="game-hint"><!-- Enter/south: Change · X/west: Remove · Esc/east: Back --></p>
  </div>
</section>
```

Choosing a slot opens a list of the matching items from the bag (`.game-list`, each with its icon, name and the stat change it would make); the third stats column shows the result for the focused item: ▲ in `--g-good`, ▼ in `--g-bad`, with the arrow so colour isn't the only sign.

## States

| State | What changes |
| --- | --- |
| Empty slot | `eq.none` in dim text; Remove is not offered. |
| Comparing | The third column appears with the value after the change. |
| Can't equip | The item row is `aria-disabled="true"` with its reason (`eq.too_heavy`, `eq.class_only`). |
| Cursed / locked | Remove is disabled; `eq.locked` under the slot. |
| Party | Shoulders (Q / E) switch character; the name in the title changes. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `eq.title` | Equipment | そうび |
| `eq.weapon` | Weapon | 武器 |
| `eq.armor` | Armor | よろい |
| `eq.shield` | Shield | 盾 |
| `eq.feet` | Feet | くつ |
| `eq.charm` | Charm | お守り |
| `eq.none` | Nothing | なし |
| `eq.change` | Change | 変更 |
| `eq.remove` | Remove | はずす |
| `eq.too_heavy` | Too heavy for Rin | リンには重すぎます |
| `eq.class_only` | Only for mages | 魔法使い専用 |
| `eq.locked` | Can’t be removed | はずせません |
| `stat.attack` | Attack | こうげき |
| `stat.defence` | Defence | ぼうぎょ |
| `stat.speed` | Speed | すばやさ |
| `item.bronze_sword` | Bronze Sword | 青銅の剣 |

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
