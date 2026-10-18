# GameTowerDefence

App Block card (Games). A tower defence game: enemies walk a path in waves; place and upgrade towers beside it so none reach the end.

- Engine: gaming-core: LittleJS 1.27.0, plain JavaScript, classic script order; menus, HUD and words are the HTML game kit over the canvas (GameKit)
- Start from: `emptyGame` (`python3 -B tools/game.py init emptyGame --out <project>`), then the blocks below
- Palette: Meadow (Dusk for night maps) (ArtPalettes); sprites 16 × 16 towers and enemies, the map on the 16 px grid (ArtSprites)
- Game blocks: GameKit, TitleScreen, LevelSelect, HudPieces, ShopScreen, PauseMenu, GameSettings, TutorialPrompt, ResultsScores, GameOver, TouchControls
- Orientation: Landscape on desktop; portrait on the phone (the map scrolls vertically)

## Screen flow
1. **Title** → **Maps** (LevelSelect): each map with its stars and best wave.
2. **Build time** before each wave: the build bar (ShopScreen in a strip) lists towers with prices; choose one, then a free tile; invalid tiles show a red outline and the reason (“On the path”, “Not enough gold”).
3. **Wave**: Start Wave sends it early for bonus gold; fast-forward ×2; towers fire on their own.
4. Selecting a tower opens its panel: level, damage, range circle on the map, Upgrade (price), Sell (refund 70 %).
5. All waves cleared → Victory (ResultsScores: lives left = stars); lives at 0 → Defeat (GameOver: Retry from wave 1 or from the last wave with half gold).

## HUD
- Top left: lives (heart, “18”), gold (coin, “240”).
- Top centre: “Wave 5 / 20” and the next wave’s enemy icons.
- Top right: Start Wave / fast-forward / pause buttons.
- Bottom: the build bar with tower cards (icon, name, price; disabled with its reason when unaffordable).
- On the map: range circles only for the chosen tower and while placing.

## Genre menus
- Tower panel: level pips, damage, rate, range; Upgrade (default, price shown) · Sell (refund) · Target: First / Strongest / Closest.
- Wave preview: what is coming, with an icon per type and its weakness.

## Controls
Actions are named once (`cursor`, `place`, `select`, `upgrade`, `sell`, `start_wave`, `speed`, `pause`); the prompt on screen follows the last device used (`.game[data-device]`). Through gaming-core's input layer (`gcInput`, see GameKit): `pause` is gaming-core's own (`move` is its `moveX`/`moveY` axes); `cursor`, `place`, `select`, `upgrade`, `sell`, `start_wave`, `speed` are added with `gcInput.init({actions: {…}})` with the defaults in the table below. Gamepad buttons by position (`padStyle: 'position'`): south, east, west, north, the shoulders and triggers, select, start. Every action is remappable in ControlsRemap except Pause and Back (gaming-core's `fixed`).

(Action | Keyboard | Mouse | Gamepad | Touch)
- Move the cursor: Arrow keys or WASD | Hover | Left stick (tile by tile) or d-pad | —
- Choose a tower to build: 1–6 | Click its card | Shoulders cycle, south picks | Tap its card
- Place / select: Space or Return | Left click | South | Tap the tile
- Upgrade: U | Upgrade button | North | Upgrade button
- Sell: Delete | Sell button | West (hold) | Sell button (asks to confirm)
- Start wave / ×2: N / F | Buttons top right | Start / Back | Buttons top right
- Pause: Esc | — | Start (hold) | Pause button

## Phone layout
- Portrait: the map fills the top, pinch to zoom, drag to pan; the build bar becomes a 2-row grid of 44 px cards at the bottom.
- Placing is two taps (tower card, then tile) with a ghost tower and its range before confirming.
- Fast-forward and Start Wave are a pair of 44 px buttons above the bar.

## Game blocks
- **LevelSelect**: maps with stars
- **HudPieces**: lives, gold, wave counter
- **ShopScreen**: the build bar and tower upgrades
- **TutorialPrompt**: place the first tower, start the first wave
- **ResultsScores**: victory and stars
- **GameOver**: defeat
- **TouchControls**: tap to place, pinch and pan

## Art and sound
- Towers 16 px on a 16 px base, three upgrade looks per tower (a band, a second barrel, a gold top); enemies from ArtSprites monsters with walk cycles.
- Path tiles from visual-core’s meadow kit (dirt path joins); blocked tiles darker.
- Projectiles 2–4 px in the tower’s colour; hits flash the enemy white for 1 frame.
- Music: a build loop (calm) and a wave loop (driving); cues for place, upgrade, sell, leak (an enemy reaches the end), wave cleared.

## Texts
Game-level keys only; each block's own keys are on its card.

(Key | English | 日本語)
- `td.title`: Garden Guard | ガーデンガード
- `hud.wave`: Wave {n} / {total} | ウェーブ {n} / {total}
- `hud.lives`: Lives | ライフ
- `action.start_wave`: Start Wave | ウェーブ開始
- `tower.upgrade`: Upgrade ({price} g) | 強化（{price} G）
- `tower.sell`: Sell ({price} g) | 売る（{price} G）
- `place.on_path`: Not on the path | 道の上には置けません
- `place.no_gold`: Not enough gold | ゴールドが足りません

Keys with `{…}` are filled from code, never typed into the markup: `hud.wave`, `tower.upgrade`, `tower.sell` (into the HUD slots of HudPieces and the panels named above).

## Adding to it
- A new tower: icon, price, damage, rate, range, 3 upgrade looks, one sentence of what it is good against.
- A new enemy: speed, health, a weakness, a walk cycle; the wave preview shows it.
- Endless mode: waves scale after the last map wave; the results show the wave reached.

## Don't
- Don’t draw menus, dialogue or numbers into the canvas: they are game kit HTML so they can be read, translated and focused.
- Don’t hide range: show it whenever a tower is chosen or being placed.
- Don’t sell without confirming on touch.

## Pi Workbench
- Assumes GameKit (its card comes with this one).
- Load a block’s card with the app_block tool and its exact name, one at a time: GameKit, TitleScreen, LevelSelect, HudPieces, ShopScreen, PauseMenu, GameSettings, TutorialPrompt, ResultsScores, GameOver, TouchControls.
- Set up: `python3 {harness}/kit/blocks/add.py <project> GameTowerDefence` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
