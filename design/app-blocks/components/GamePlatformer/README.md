# GamePlatformer

A side-scrolling platformer: run and jump through levels, collect coins, avoid or stomp enemies and reach the flag.

| | |
| --- | --- |
| Group | Games |
| Engine | gaming-core: LittleJS 1.27.0, plain JavaScript, classic script order; menus, HUD and words are the HTML game kit over the canvas (GameKit) |
| Start from | `emptyGame` (`python3 -B tools/game.py init emptyGame --out <project>`), then the blocks below |
| Palette | Meadow (Dusk for night and cave levels) (ArtPalettes); sprites 16 × 16 (ArtSprites) |
| Game blocks | GameKit, TitleScreen, LevelSelect, HudPieces, PauseMenu, GameSettings, ControlsRemap, TutorialPrompt, ResultsScores, GameOver, TouchControls |
| Orientation | Landscape preferred (a wider view); portrait works with the controls on a band below the level |

## Screen flow

1. **Title**: Play (opens the world map), Settings.
2. **World map** (LevelSelect): levels as nodes on a path; each shows stars (coins found, time, no damage) and locks until the previous is done.
3. **Level**: checkpoints flags midway; falling or touching an enemy loses a life and returns to the last checkpoint.
4. **Flag**: the level result (ResultsScores) with time, coins and stars; Next Level (default), Replay, World Map.
5. No lives left → GameOver: Continue from the world map with 3 lives (no progress lost).

## HUD

- Top left: lives (hero head icon × 3) and coins (coin icon, “24 / 50”).
- Top right: the level timer (counts up), the best time small under it.
- Top centre: the level name for 2 seconds at the start, then nothing.
- Nothing else over the play area; the world must be readable.

## Genre menus

- Level result: three stars with what each was for; Next Level is the default.
- Assist options in GameSettings: slower game speed (90 %, 75 %), extra jump forgiveness, infinite lives; they never block stars except the time star.

## Controls

Actions are named once (`move`, `jump`, `run`, `down`, `pause`) and read through gaming-core's input layer; the prompt on screen follows the last device used (`.game[data-device]`). Gamepad buttons by position on the standard layout. Every action is remappable in ControlsRemap except Pause.

| Action | Keyboard | Mouse | Gamepad | Touch |
| --- | --- | --- | --- | --- |
| Move | ← → or A D | — | Left stick or d-pad | Left and right buttons (bottom left) |
| Jump (hold = higher) | Space, Z or ↑ | — | South | Jump button (bottom right) |
| Run | Shift or X (hold) | — | West (hold) | Run toggle (setting) or always run |
| Down / drop through | ↓ or S | — | D-pad down | Down button |
| Pause | Esc or P | — | Start | Pause button (top right) |

## Phone layout

- Landscape: two 64 px arrow buttons bottom left, Jump 72 px bottom right, Run beside it if not always-on; all inside the safe area.
- Portrait: the camera zooms out one step; arrows and Jump sit on a dark band below the level so thumbs never cover the hero.
- Coyote time 100 ms and jump buffer 120 ms by default, larger on touch.

## Game blocks

- **LevelSelect**: the world map with stars and locks
- **HudPieces**: lives, coins, timer
- **TutorialPrompt**: in-world prompts at the first jump and the first drop-through
- **ResultsScores**: level results and stars
- **GameOver**: out of lives
- **TouchControls**: arrows + jump

## Art and sound

- Tiles from visual-core’s meadow terrain kit (grass top, soil, Blob 47 joins); one-way platforms as wood planks (`o`, `n`).
- Hero 16 px with idle, walk, jump (1 frame up, 1 down), hurt; enemies `blob` and `beast`.
- Parallax: 2 background layers (hills, clouds) at 0.25× and 0.5×.
- Music: one loop per world; cues for jump, coin (pitch rises in a chain), stomp, hurt, flag fanfare.

## Texts

Game-level keys only; each block's own keys are on its card.

| Key | English | 日本語 |
| --- | --- | --- |
| `platformer.title` | Hop Hill | ホップヒル |
| `hud.coins` | {n} / {total} | {n} / {total} |
| `hud.time` | Time | タイム |
| `level.name` | 1-2 Windy Ledge | 1-2 かぜの がけ |
| `result.next` | Next Level | つぎのレベル |
| `result.replay` | Replay | もう一度 |

## Adding to it

- A new level: a tile map, coins, enemies and one checkpoint; its node on the world map.
- A new move (wall jump, dash): one action, one ControlsRemap row, one tutorial prompt where it is first needed.
- Collectible stars per level: a third star condition and its icon.

## Don't

- Don’t draw menus, dialogue or numbers into the canvas: they are game kit HTML so they can be read, translated and focused.
- Don’t place enemies or pits right after a screen edge the player can’t see.
- Don’t make a jump that needs frame-perfect timing.
