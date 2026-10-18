# CardHand

A hand of cards along the bottom, the deck and discard piles, card detail on focus, and the deck list for building.

| | |
| --- | --- |
| Group | Game blocks |
| Basecoat | none (game kit: `game-hand`, `game-card`, `game-cost`, `game-art`, `game-pile`, `game-list`) |
| Needs | GameKit; card definitions (Data); card art from visual-core (32 × 24 art pixels) |
| Used in | GameCards (trading card game), GameRoguelike (deck-building variants) |

## Markup

```html
<section id="hand-area" aria-label="Your hand" style="position:absolute;left:0;right:0;bottom:12px;display:flex;align-items:flex-end;justify-content:space-between;padding:0 16px">
  <div class="game-pile" role="img" aria-label="Deck: 18 cards"><span class="game-num">18</span></div>
  <div class="game-hand" role="listbox" aria-label="Hand, 5 cards" aria-orientation="horizontal" style="--mid:2">
    <button class="game-card" role="option" aria-selected="false" style="--i:0;--d:1" aria-describedby="card-1-text">
      <span class="game-cost" aria-label="Cost 1">1</span>
      <b data-t="card.spark">Spark</b>
      <span class="game-art" aria-hidden="true"></span>
      <span id="card-1-text" data-t="card.spark.text">Deal 3 damage.</span>
    </button>
    <!-- … one .game-card per card; --i its index, --d its distance from the middle (0, 1, 2) for the fan -->
  </div>
  <div class="game-pile" role="img" aria-label="Discard: 4 cards" style="opacity:.8"><span class="game-num">4</span></div>
</section>
<p class="game-row" style="position:absolute;right:16px;top:12px"><span data-t="cards.energy">Energy</span> <b class="game-num">3/3</b></p>
```

The focused card rises (`aria-selected="true"`) and a larger detail of it appears above the hand (`.game-card` at double size, read-only). Play: Enter/south then choose a target, or drag the card up onto the board.

## States

| State | What changes |
| --- | --- |
| Can't afford | `aria-disabled="true"` (grey); detail says `cards.need_energy`. |
| Targeting | The card stays raised; targets on the board are highlighted on the canvas and listed for keys (← → between targets); Esc/east cancels. |
| Too many cards | Over 7 the fan overlaps more (`margin` −20 px); detail on focus still shows the full card. |
| Deck view | `.game-overlay` with `.game-slots` of cards by cost, filter tabs (All · 1 · 2 · 3+), and counts “×2”. |
| Empty deck | The pile shows `cards.reshuffle` (discard shuffled back). |
| Opponent's turn | Hand is `inert`; `cards.their_turn` at top centre. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `cards.energy` | Energy | エネルギー |
| `cards.deck` | Deck: {n} cards | 山札：{n} 枚 |
| `cards.discard` | Discard: {n} cards | 捨て札：{n} 枚 |
| `cards.end_turn` | End Turn | ターン終了 |
| `cards.need_energy` | Needs {n} energy | エネルギーが {n} 必要です |
| `cards.choose_target` | Choose a target | 対象を選んでください |
| `cards.reshuffle` | Shuffling the discard back in | 捨て札を山札に戻します |
| `cards.their_turn` | Opponent’s turn | 相手のターン |
| `card.spark` | Spark | スパーク |
| `card.spark.text` | Deal 3 damage. | 3 ダメージを与える。 |
| `card.guard` | Guard | ガード |
| `card.guard.text` | Gain 5 block. | ブロックを 5 得る。 |

## Keyboard and focus

1. ← → along the hand (d-pad, shoulders) → Enter/south: play → target (← →) → Enter/south.
- E or north: End Turn. D or west: Deck view. Number keys 1–9 pick a card directly.

## Phone

- Portrait: the hand fans across the bottom third, cards 66 × 93 px; tap to raise, tap again or drag up to play; End Turn is a 44 px button above the hand at the right.

## Data

```json
{"cards": {"spark": {"cost": 1, "type": "attack", "damage": 3, "art": "cards/spark"}, "guard": {"cost": 1, "type": "skill", "block": 5}},
 "battle": {"energy": 3, "energyMax": 3, "hand": ["spark", "guard", "spark", "heal", "bolt"], "deck": 18, "discard": 4}}
```

## Don't

- Don't make dragging the only way to play a card.
- Don't shrink card text below 11 px; open the detail instead.
