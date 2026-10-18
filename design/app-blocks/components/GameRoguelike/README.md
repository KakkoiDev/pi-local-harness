# GameRoguelike

A roguelike or roguelite: descend procedural floors, fight, find items, lose everything on death and carry unlocks into the next run.

| | |
| --- | --- |
| Group | Games |
| Engine | gaming-core: LittleJS 1.27.0, plain JavaScript, classic script order; menus, HUD and words are the HTML game kit over the canvas (GameKit) |
| Start from | `emptyGame` (`python3 -B tools/game.py init emptyGame --out <project>`), then the blocks below |
| Palette | Dusk (ArtPalettes); sprites 16 × 16 (ArtSprites) |
| Game blocks | GameKit, TitleScreen, ShopScreen, HudPieces, InventoryGrid, Equipment, PauseMenu, MapScreen, TutorialPrompt, ResultsScores, GameOver, GameSettings, ControlsRemap, TouchControls |
| Orientation | Landscape on desktop; portrait on the phone |

## Screen flow

1. **Title**: Start Run, Continue (a run in progress is saved on each floor), Unlocks, Settings.
2. **Hub** (ShopScreen layout): spend the meta currency on permanent unlocks before a run (roguelite); a pure roguelike skips it.
3. **Floors**: rooms generated from a seed shown on the pause screen; stairs down end a floor.
4. **Death** → GameOver with the cause (“Slain by a rose slime on floor 4”), then the **run summary** (ResultsScores): floor reached, time, kills, items found, currency earned, new unlocks.
5. Turn-based (classic) or real-time (action): the HUD is the same; turn-based adds a turn counter.

## HUD

- Top left: HP bar with numbers (“14 / 20”), the floor (“Floor 4”).
- Top right: the explored floor map (HudPieces `minimap`), rooms as squares, the stairs once seen.
- Bottom left: 4 quick items with their keys (1–4), counts.
- Bottom right: the run timer and the seed (small).
- Status effects as 12 px icons under the HP bar (poison, haste) with turns left.

## Genre menus

- Run summary: a list of the run’s numbers with the best ever beside each; New Run (default) and Hub.
- Item pick-up: a small card over the item (name, effect, rarity); picking up swaps when the bag is full.
- Unlocks: a grid of locked and unlocked items, each with its cost and what it changes.

## Controls

Actions are named once (`move`, `fire`, `use_item_1`, `use_item_2`, `use_item_3`, `use_item_4`, `wait`, `map`, `pause`); the prompt on screen follows the last device used (`.game[data-device]`). Through gaming-core's input layer (`gcInput`, see GameKit): `move`, `fire`, `pause` are gaming-core's own (`move` is its `moveX`/`moveY` axes); `use_item_1`, `use_item_2`, `use_item_3`, `use_item_4`, `wait`, `map` are added with `gcInput.init({actions: {…}})` with the defaults in the table below. Gamepad buttons by position (`padStyle: 'position'`): south, east, west, north, the shoulders and triggers, select, start. Every action is remappable in ControlsRemap except Pause and Back (gaming-core's `fixed`).

| Action | Keyboard | Mouse | Gamepad | Touch |
| --- | --- | --- | --- | --- |
| Move (and bump to attack) | WASD, arrows, or numpad 8 directions | Click a tile to walk | Left stick or d-pad | Stick, or swipe one tile |
| Attack (action mode) | J or Space | Left click | West | Attack button |
| Quick items 1–4 | 1 2 3 4 | — | D-pad while holding left shoulder | Tap the item slot |
| Wait a turn | . or Z | — | South (hold) | Wait button |
| Map | M or Tab | — | Back | Tap the minimap |
| Pause | Esc | — | Start | Pause button |

## Phone layout

- Portrait: the floor in a square on top, a dark band with the stick left and Attack / Wait right, quick items as a row of four 44 px slots above them.
- Turn-based runs suit the phone: a swipe moves one tile; holding repeats.
- The run saves when the app goes to the background.

## Game blocks

- **HudPieces**: HP, floor, minimap, timer, status icons
- **InventoryGrid**: the bag and quick items
- **Equipment**: weapon and charms for this run
- **MapScreen**: the floor map
- **GameOver**: cause of death
- **ResultsScores**: the run summary and bests
- **TutorialPrompt**: first run only
- **TouchControls**: stick, Attack, Wait

## Art and sound

- Floors from visual-core’s dungeon terrain preset (walls and floors with Blob 47 joins), Dusk palette; torches animate 3 frames.
- Monsters from parts with colour swaps per floor depth (mint → rose → lantern).
- Rarity by frame colour on item cards: common Haze, rare Neon sky, epic Lantern; also written as a word.
- Music: one loop per floor band that gets denser deeper; cues for steps (soft), hit, pick-up, stairs, death sting.

## Texts

Game-level keys only; each block's own keys are on its card.

| Key | English | 日本語 |
| --- | --- | --- |
| `rogue.title` | Deepwell | ディープウェル |
| `rogue.start` | Start Run | ラン開始 |
| `hud.floor` | Floor {n} | 地下 {n} 階 |
| `hud.seed` | Seed {seed} | シード {seed} |
| `death.cause` | Slain by {monster} on floor {n} | 地下 {n} 階で {monster} にたおされた |
| `summary.title` | Run Summary | ランの結果 |
| `summary.new_run` | New Run | もう一度 |
| `summary.best` | Best | ベスト |

Keys with `{…}` are filled from code, never typed into the markup: `hud.floor`, `hud.seed`, `death.cause` (into the HUD slots of HudPieces and the panels named above).


## Adding to it

- A new floor band: a terrain preset, three monsters, one boss, one music loop.
- Daily run: a fixed seed per day and its own high-score table.
- Characters: a select screen before the run, each with a starting item and stats.

## Don't

- Don’t draw menus, dialogue or numbers into the canvas: they are game kit HTML so they can be read, translated and focused.
- Don’t hide what killed the player.
- Don’t make unlocks required to finish the game (roguelite boosts are optional).
