# CardHand

App Block card (Game blocks). A hand of cards along the bottom, the deck and discard piles, card detail on focus, and the deck list for building.

- Basecoat: none (game kit: `game-hand`, `game-card`, `game-cost`, `game-art`, `game-pile`, `game-list`)
- Needs: GameKit; card definitions (Data); card art from visual-core (32 × 24 art pixels)
- Used in: GameCards (trading card game), GameRoguelike (deck-building variants)

## Markup
Copy, never retype: `{harness}/kit/blocks/game-blocks/CardHand.html` (14 lines of HTML).

The focused card rises (`aria-selected="true"`) and a larger detail of it appears above the hand (`.game-card` at double size, read-only). Play: Enter/south then choose a target, or drag the card up onto the board.

## States
- Can't afford: `aria-disabled="true"` (grey); the card's detail line gets `cards.need_energy` (set from code, `{n}` the missing energy).
- Targeting: The card stays raised; targets on the board are highlighted on the canvas and listed for keys (← → between targets); Esc/east cancels.
- Too many cards: Over 7 the fan overlaps more (`margin` −20 px); detail on focus still shows the full card.
- Deck view: `.game-overlay` with `.game-slots` of cards by cost, filter tabs (All · 1 · 2 · 3+), and counts “×2”.
- Empty deck: The pile shows `cards.reshuffle` (discard shuffled back).
- Opponent's turn: Hand is `inert`; `cards.their_turn` at top centre.

## Texts
(Key | English | 日本語)
- `cards.energy`: Energy | エネルギー
- `cards.deck`: Deck: {n} cards | 山札：{n} 枚
- `cards.discard`: Discard: {n} cards | 捨て札：{n} 枚
- `cards.end_turn`: End Turn | ターン終了
- `cards.need_energy`: Needs {n} energy | エネルギーが {n} 必要です
- `cards.choose_target`: Choose a target | 対象を選んでください
- `cards.reshuffle`: Shuffling the discard back in | 捨て札を山札に戻します
- `cards.their_turn`: Opponent’s turn | 相手のターン
- `card.spark`: Spark | スパーク
- `card.spark.text`: Deal 3 damage. | 3 ダメージを与える。
- `card.guard`: Guard | ガード
- `card.guard.text`: Gain 5 block. | ブロックを 5 得る。

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

## Pi Workbench
- Assumes GameKit (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> CardHand` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
