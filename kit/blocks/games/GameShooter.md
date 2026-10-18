# GameShooter

App Block card (Games). A vertical shoot ’em up: fly through waves of enemies, pick up power-ups, beat the boss, chase the high score.

- Engine: gaming-core: LittleJS 1.27.0, plain JavaScript, classic script order; menus, HUD and words are the HTML game kit over the canvas (GameKit)
- Start from: `emptyGame` (`python3 -B tools/game.py init emptyGame --out <project>`), then the blocks below
- Palette: Arcade (ArtPalettes); sprites 16 × 16 ships and enemies, bosses 64 × 64 (ArtSprites)
- Game blocks: GameKit, TitleScreen, LevelSelect, HudPieces, PauseMenu, GameSettings, ControlsRemap, TutorialPrompt, ResultsScores, GameOver, TouchControls
- Orientation: Portrait play field (9:16) centred on desktop with the HUD beside it; portrait on the phone

## Screen flow
1. **Title** (TitleScreen): Start, Stage Select (LevelSelect, unlocked stages only), High Scores (ResultsScores), Settings.
2. **Play**: waves come from the top; the ship fires on its own while Fire is held (auto-fire is a setting, on by default on the phone).
3. A **boss** ends each stage: its HP bar appears top centre with its name.
4. **Results** (ResultsScores): score, enemies hit %, lives left, a name entry when the score is in the top 10.
5. Losing the last life → GameOver: Continue (score resets to 0, 3 continues per run) or Title.

## HUD
- Top left: the score (HudPieces `score`, tabular digits, 8 places).
- Top right: lives as ship icons, bombs as small icons under them.
- Top centre: boss name and HP bar only during a boss.
- Bottom centre: the power level (1–4) as pips.
- On desktop the play field is 9:16 in the middle; score and high score sit in the side margins instead of over the field.

## Genre menus
- Between stages: a one-screen upgrade pick (choose 1 of 3: Spread shot, Shield, Speed) as three cards; confirm picks.
- Pause shows the current stage, score and the controls (PauseMenu).

## Controls
Actions are named once (`move`, `fire`, `bomb`, `focus`, `pause`) and read through gaming-core's input layer; the prompt on screen follows the last device used (`.game[data-device]`). Gamepad buttons by position on the standard layout. Every action is remappable in ControlsRemap except Pause.

(Action | Keyboard | Mouse | Gamepad | Touch)
- Move: Arrow keys or WASD | The ship follows the pointer while the left button is held | Left stick or d-pad | Drag anywhere: the ship moves with the finger, offset above it
- Fire: Z or Space (hold) | Left button (hold) | South (hold) or right trigger | Automatic while dragging
- Bomb: X | Right click | East | Bomb button (bottom right)
- Focus (slow, precise): Shift (hold) | Middle button | Left trigger | Two-finger hold
- Pause: Esc or P | — | Start | Pause button (top right); also on lifting the finger for 1 s

## Phone layout
- Portrait, full screen; the ship sits 72 px above the finger so it stays visible.
- Score top left and lives top right inside the safe area; Bomb bottom right, 64 px.
- Lifting the finger for a second pauses (a setting), so a phone call never kills a run.

## Game blocks
- **GameKit**: HTML over the canvas, Arcade palette roles
- **TitleScreen**: title, Start, High Scores
- **LevelSelect**: stages with best score and stars
- **HudPieces**: score, lives, power pips, boss bar
- **TutorialPrompt**: first-run hints: “Hold Z to fire”, “X for a bomb”
- **PauseMenu**: resume, restart stage, settings, quit
- **ResultsScores**: stage results and the top-10 name entry
- **GameOver**: Continue or Title
- **TouchControls**: drag-to-move and the bomb button

## Art and sound
- Ships and enemies 16 px from ArtSprites parts (`flyer` bodies), the player in cyan (`b`), enemies red and grape; bullets 2 × 4 px in amber (player) and red (enemy) with a 1 px white core.
- Background: a starfield in 3 layers scrolling at 1×, 2×, 4× speed; no tiles.
- Explosions: 4 frames, 16 px, palette keys only.
- Music: one driving loop per stage, a boss loop; cues for shot (quiet), hit, explosion, power-up, extra life.

## Texts
Game-level keys only; each block's own keys are on its card.

(Key | English | 日本語)
- `shooter.title`: Star Lane | スターレーン
- `shooter.start`: Start | スタート
- `hud.score`: Score | スコア
- `hud.hi`: Hi | ハイ
- `hud.lives`: Lives | のこり
- `hud.boss`: Hive Queen | ハイブクイーン
- `upgrade.title`: Choose an Upgrade | パワーアップをえらぶ
- `upgrade.spread`: Spread Shot | ワイドショット
- `upgrade.shield`: Shield | シールド
- `upgrade.speed`: Speed | スピード

## Adding to it
- A new stage: a wave script (enemy type, path, time) and a boss; the HUD and results stay.
- Horizontal shooter: rotate the field to 16:9 and move the HUD to the top band.
- Two players on one keyboard: a second score and lives on the right, WASD + F for player 2.

## Don't
- Don’t draw menus, dialogue or numbers into the canvas: they are game kit HTML so they can be read, translated and focused.
- Don’t require precise taps on the phone: firing is automatic while dragging.
- Don’t flash the whole screen white on explosions (photosensitivity): flash only the sprite.

## Pi Workbench
- Assumes GameKit (its card comes with this one).
- Load a block’s card with the app_block tool and its exact name, one at a time: GameKit, TitleScreen, LevelSelect, HudPieces, PauseMenu, GameSettings, ControlsRemap, TutorialPrompt, ResultsScores, GameOver, TouchControls.
- Set up: `python3 {harness}/kit/blocks/add.py <project> GameShooter` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
