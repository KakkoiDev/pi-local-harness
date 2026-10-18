# GameRacing

App Block card (Games). A top-down racing game: laps around a track against rivals or the clock, with a start countdown, positions and a results table.

- Engine: gaming-core: LittleJS 1.27.0, plain JavaScript, classic script order; menus, HUD and words are the HTML game kit over the canvas (GameKit)
- Start from: `emptyGame` (`python3 -B tools/game.py init emptyGame --out <project>`), then the blocks below
- Palette: Arcade (ArtPalettes); sprites 16 × 16 cars (8 rotations), the track on the 16 px grid (ArtSprites)
- Game blocks: GameKit, TitleScreen, LevelSelect, HudPieces, PauseMenu, GameSettings, ControlsRemap, TutorialPrompt, ResultsScores, TouchControls
- Orientation: Landscape on desktop; landscape or portrait on the phone (the camera follows the car)

## Screen flow
1. **Title**: Race (Grand Prix of 4 tracks), Time Trial, Tracks (LevelSelect with best laps), Settings.
2. **Countdown**: 3 · 2 · 1 · GO big in the centre, then gone.
3. **Race**: 3 laps; going off the track slows the car; a wrong-way arrow appears after 1 s backwards.
4. **Finish** → ResultsScores: position table (place, racer, time, best lap), points in a Grand Prix, Next Race (default), Retry.
5. Time trial keeps a ghost of the best lap.

## HUD
- Top left: position “2nd / 6” large.
- Top right: lap “Lap 2 / 3” and the race time; the best lap under it.
- Bottom right: speed as a bar and a number.
- Bottom left: the track minimap with dots for every racer (you outlined).
- Centre: countdown, “Final Lap”, “Wrong Way” messages for 1–2 s.

## Genre menus
- Results table: place, name, total time, best lap (yours highlighted), points.
- Car pick: 3 cars with Speed / Grip / Boost as 5-pip meters.

## Controls
Actions are named once (`steer`, `accelerate`, `brake`, `boost`, `look_back`, `pause`) and read through gaming-core's input layer; the prompt on screen follows the last device used (`.game[data-device]`). Gamepad buttons by position on the standard layout. Every action is remappable in ControlsRemap except Pause.

(Action | Keyboard | Mouse | Gamepad | Touch)
- Steer: ← → or A D | — | Left stick or d-pad | Left / right buttons, or tilt (setting)
- Accelerate: ↑, W or Z | — | Right trigger or south | Automatic (setting: Gas button)
- Brake / reverse: ↓, S or X | — | Left trigger or west | Brake button
- Boost: Space | — | East | Boost button
- Pause: Esc | — | Start | Pause button

## Phone layout
- Landscape: steer left and right with two 64 px buttons on the left thumb, Brake and Boost on the right; accelerating is automatic by default.
- Portrait: the camera is zoomed out one step and the buttons sit on a band below.
- Tilt steering is an option in GameSettings, off by default.

## Game blocks
- **LevelSelect**: tracks with best laps
- **HudPieces**: position, lap, time, speed, minimap, messages
- **TutorialPrompt**: the first race explains boost and brake
- **ResultsScores**: the race table and points
- **TouchControls**: steer, brake, boost
- **PauseMenu**: restart, quit race

## Art and sound
- Cars 16 × 16 drawn in 8 rotations (45°), never rotated by the engine (keeps pixels square); colours by palette swap per racer.
- Track from tiles: asphalt `q`, curbs alternating `r` and `w`, grass `G`, a checkered start line `k`/`w`.
- Skid marks as 1 px dark trails that fade after 3 s.
- Music: one fast loop per track; cues for countdown beeps, boost, bump, lap, finish.

## Texts
Game-level keys only; each block's own keys are on its card.

(Key | English | 日本語)
- `race.title`: Turbo Loop | ターボループ
- `hud.position`: {n}{suffix} / {total} | {n}位 / {total}
- `hud.lap`: Lap {n} / {total} | ラップ {n} / {total}
- `race.go`: GO | ゴー
- `race.final_lap`: Final Lap | ファイナルラップ
- `race.wrong_way`: Wrong Way | 逆走
- `results.next`: Next Race | 次のレース

## Adding to it
- A new track: a tile map, a racing line for rivals (a list of points), a start grid.
- Items (kart style): an item box tile and a slot in the HUD top centre.
- Split screen for two players: two cameras side by side, each with its own HUD corner set.

## Don't
- Don’t draw menus, dialogue or numbers into the canvas: they are game kit HTML so they can be read, translated and focused.
- Don’t rotate sprites by arbitrary angles; use the 8 drawn rotations.
- Don’t make tilt the only steering.

## Pi Workbench
- Assumes GameKit (its card comes with this one).
- Load a block’s card with the app_block tool and its exact name, one at a time: GameKit, TitleScreen, LevelSelect, HudPieces, PauseMenu, GameSettings, ControlsRemap, TutorialPrompt, ResultsScores, TouchControls.
- Set up: `python3 {harness}/kit/blocks/add.py <project> GameRacing` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
