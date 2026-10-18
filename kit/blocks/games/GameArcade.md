# GameArcade

App Block card (Games). Arcade classics on one shell — a paddle game, a brick breaker and a snake game: instant start, lives, a rising score and a high-score table.

- Engine: gaming-core: LittleJS 1.27.0, plain JavaScript, classic script order; menus, HUD and words are the HTML game kit over the canvas (GameKit)
- Start from: `pong` (`python3 -B tools/game.py init pong --out <project>`), then the blocks below
- Palette: Arcade (Ink for a one-colour retro look) (ArtPalettes); sprites shapes on a 4 px grid; 16 px only for power-ups (ArtSprites)
- Game blocks: GameKit, TitleScreen, HudPieces, PauseMenu, GameSettings, ControlsRemap, TutorialPrompt, ResultsScores, GameOver, TouchControls
- Orientation: Landscape for paddle and brick games; any for snake (the grid fits the screen)

## Screen flow
1. **Title**: one button per game in the pack (Paddle, Bricks, Snake), High Scores, Settings; Start is the default.
2. **Serve**: “Press Space to serve” / “Tap to serve” until the first input (TutorialPrompt style, no timeout).
3. **Play**: paddle — first to 7 against the computer or a second player; bricks — clear the wall, 3 lives, power-ups fall from some bricks; snake — eat, grow, don’t hit yourself or the wall.
4. **Game over** (GameOver) shows the score and the best; a top-10 score opens the 3-letter name entry (ResultsScores).
5. Retry starts at once (default); no loading between tries.

## HUD
- Top centre: the score, big tabular digits; the best score small under it.
- Top left: lives as small paddles or hearts (bricks), length (snake).
- Paddle game: two scores, left and right of the centre line.
- Nothing else; the play field is the screen.

## Genre menus
- Name entry: three letters chosen with ↑ ↓ and confirmed with Return (or an on-screen keyboard on touch); Japanese names allowed as 3 kana.
- High scores table per game: rank, name, score, date.

## Controls
Actions are named once (`move`, `serve`, `pause`) and read through gaming-core's input layer; the prompt on screen follows the last device used (`.game[data-device]`). Gamepad buttons by position on the standard layout. Every action is remappable in ControlsRemap except Pause.

(Action | Keyboard | Mouse | Gamepad | Touch)
- Move paddle / turn snake: ← → (paddle, bricks) · arrows (snake) · W S for player 2 in paddle | Paddle follows the pointer | Left stick or d-pad | Drag the paddle; swipe to turn the snake
- Serve / launch: Space | Click | South | Tap
- Pause: Esc or P | — | Start | Pause button

## Phone layout
- Bricks and paddle: the paddle follows the finger’s x with an offset so the finger never covers the ball.
- Snake: swipes turn; a 4-way d-pad option sits below the grid in portrait.
- Lifting the finger in paddle and bricks pauses after 1 s (setting).

## Game blocks
- **TitleScreen**: the pack’s games
- **TutorialPrompt**: serve prompts with the device’s button
- **HudPieces**: score, best, lives
- **GameOver**: score, best, Retry
- **ResultsScores**: name entry and tables
- **TouchControls**: drag and swipe

## Art and sound
- Shapes, not sprites: paddles 4 × 24 px, ball 4 × 4, bricks 16 × 8 in rows of palette colours (red, amber, green, cyan from top), snake segments 8 × 8.
- A 1 px scanline overlay is a setting, off by default.
- Music: none during play by default (bleeps only: paddle hit, wall, brick, eat, lose a life); a short title jingle.

## Texts
Game-level keys only; each block's own keys are on its card.

(Key | English | 日本語)
- `arcade.title`: Arcade Pack | アーケードパック
- `game.paddle`: Paddle | パドル
- `game.bricks`: Bricks | ブロックくずし
- `game.snake`: Snake | スネーク
- `prompt.serve`: Press {button} to serve | {button} でサーブ
- `hud.best`: Best {score} | ベスト {score}
- `scores.enter_name`: Enter Your Name | 名前を入力

## Adding to it
- A new classic: one rule file, the same HUD and results; add it to the title list.
- Two players: a second set of keys and a second score; gamepads take players by order of first press.
- Daily challenge: a fixed brick layout per day with its own table.

## Don't
- Don’t draw menus, dialogue or numbers into the canvas: they are game kit HTML so they can be read, translated and focused.
- Don’t speed the ball past what a phone can follow (cap it).
- Don’t require a name to retry.

## Pi Workbench
- Assumes GameKit (its card comes with this one).
- Load a block’s card with the app_block tool and its exact name, one at a time: GameKit, TitleScreen, HudPieces, PauseMenu, GameSettings, ControlsRemap, TutorialPrompt, ResultsScores, GameOver, TouchControls.
- Set up: `python3 {harness}/kit/blocks/add.py <project> GameArcade` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
