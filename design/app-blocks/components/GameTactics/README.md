# GameTactics

A grid tactics game: turn-based battles on a square grid where each unit moves, attacks or uses a skill, with the outcome forecast before acting.

| | |
| --- | --- |
| Group | Games |
| Engine | gaming-core: LittleJS 1.27.0, plain JavaScript, classic script order; menus, HUD and words are the HTML game kit over the canvas (GameKit) |
| Start from | `emptyGame` (`python3 -B tools/game.py init emptyGame --out <project>`), then the blocks below |
| Palette | Meadow (Dusk for night battles) (ArtPalettes); sprites 16 × 16 units on 16 px tiles, portraits 32 × 32 (ArtSprites) |
| Game blocks | GameKit, TitleScreen, LevelSelect, SaveSlots, HudPieces, DialogueBox, Equipment, InventoryGrid, PauseMenu, GameSettings, ControlsRemap, TutorialPrompt, ResultsScores, GameOver, TouchControls |
| Orientation | Landscape on desktop; portrait on the phone (the map pans) |

## Screen flow

1. **Campaign** (LevelSelect): battles on a map with their goal (“Defeat all”, “Survive 8 turns”, “Reach the gate”).
2. **Briefing**: a few lines of DialogueBox with portraits; **Deploy**: choose units and their gear (Equipment, InventoryGrid).
3. **Battle**: Player Phase → Enemy Phase, a banner at each change. Choose a unit → blue tiles it can reach, red tiles it can attack → move → action menu (Attack, Skill, Item, Wait) → choose a target with the **forecast** (damage, hit %, counter).
4. Undo the last move until an action is confirmed.
5. **Victory** → ResultsScores (turns, units lost, MVP, rewards); **Defeat** (the goal failed) → GameOver: Retry, Retry from turn 1, Campaign.

## HUD

- Top left: “Turn 3 · Player Phase” and the battle goal.
- Bottom left: the hovered or chosen unit’s card — portrait, name, HP bar with numbers, move and attack range.
- Bottom right: the terrain under the cursor (Forest: +20 % dodge).
- On the grid: blue move tiles, red attack tiles, the path as arrows, a gold cursor; units that have acted are greyed.

## Genre menus

- Action menu next to the unit: Attack · Skill · Item · Wait (unavailable ones disabled with the reason).
- Forecast panel: both units side by side — HP now → after, damage, hit %, crit %, whether a counter happens; Confirm (default) and Back.
- End Turn asks to confirm only when units have not acted.

## Controls

Actions are named once (`cursor`, `select`, `back`, `next_unit`, `end_turn`, `info`, `pause`) and read through gaming-core's input layer; the prompt on screen follows the last device used (`.game[data-device]`). Gamepad buttons by position on the standard layout. Every action is remappable in ControlsRemap except Pause.

| Action | Keyboard | Mouse | Gamepad | Touch |
| --- | --- | --- | --- | --- |
| Move the cursor | Arrow keys or WASD | Hover a tile | D-pad or left stick | Tap a tile (drag pans) |
| Select / confirm | Space or Return | Left click | South | Tap |
| Back / undo move | X or Esc | Right click | East | Back button |
| Next unit | Tab | — | Right shoulder | Next button |
| Unit info | I | Middle click | North | Press and hold a unit |
| End turn | E | End Turn button | Back (left centre) | End Turn button |
| Pause | Esc (nothing chosen) | — | Start | Menu button |

## Phone layout

- Portrait: the grid at 32 px tiles (2× of 16), pinch to zoom 1×–3×, drag to pan; the unit card as a bottom sheet; the action menu as a row of 44 px buttons over it.
- Tap a unit, tap a blue tile, tap again to confirm the move (no accidental moves).
- The forecast opens as a full-width sheet with Confirm and Back.

## Game blocks

- **LevelSelect**: the campaign
- **DialogueBox**: briefings and battle talk
- **Equipment**: deploy and gear
- **InventoryGrid**: items
- **HudPieces**: turn, goal, unit card, terrain
- **TutorialPrompt**: the first battle walks through move → attack → wait
- **ResultsScores**: victory
- **GameOver**: defeat
- **SaveSlots**: between battles
- **TouchControls**: tap, pan, pinch

## Art and sound

- Units 16 px from ArtSprites parts (classes by `held`: sword, bow, staff), team by outfit keys (player `b/B`, enemy `r/R`); acted units desaturated to `d`.
- Tiles from the meadow terrain kit; terrain types told apart by shape (trees, rocks, water ripples), not colour alone.
- Highlights: move tiles `b` at 45 % over the tile, attack `r` at 45 %, the path as 2 px arrows in `w`.
- Music: a planning loop (calm) and an enemy-phase loop (tense); cues for select, move steps, hit, miss, phase banner.

## Texts

Game-level keys only; each block's own keys are on its card.

| Key | English | 日本語 |
| --- | --- | --- |
| `tactics.title` | Grid Oath | グリッドの誓い |
| `hud.turn` | Turn {n} | ターン {n} |
| `phase.player` | Player Phase | 味方フェイズ |
| `phase.enemy` | Enemy Phase | 敵フェイズ |
| `action.attack` | Attack | 攻撃 |
| `action.wait` | Wait | 待機 |
| `forecast.hit` | Hit {n}% | 命中 {n}% |
| `forecast.counter` | Counter | 反撃 |
| `goal.defeat_all` | Defeat all enemies | 敵を全滅させる |

## Adding to it

- A class: a part set, move range, weapon, one skill; its row in Equipment.
- A battle: a grid map, starting positions, a goal, enemy behaviour (charge, hold, guard a tile).
- Weather or fog: a tile layer that hides enemies outside vision; the HUD terrain panel names it.

## Don't

- Don’t draw menus, dialogue or numbers into the canvas: they are game kit HTML so they can be read, translated and focused.
- Don’t act without a forecast or let a move happen on the first tap on touch.
- Don’t show hit chances that aren’t the real ones.
