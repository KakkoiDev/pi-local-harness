# GamePuzzle

Puzzle games on a grid — match-3, sliding tiles and Sokoban — sharing one shell: levels, moves or time, stars and undo.

| | |
| --- | --- |
| Group | Games |
| Engine | gaming-core: LittleJS 1.27.0, plain JavaScript, classic script order; menus, HUD and words are the HTML game kit over the canvas (GameKit) |
| Start from | `emptyGame` (`python3 -B tools/game.py init emptyGame --out <project>`), then the blocks below |
| Palette | Arcade (Meadow for calm puzzles) (ArtPalettes); sprites 16 × 16 pieces (gems, tiles, crates) (ArtSprites) |
| Game blocks | GameKit, TitleScreen, LevelSelect, HudPieces, PauseMenu, GameSettings, TutorialPrompt, ResultsScores, GameOver |
| Orientation | Portrait first (the grid fits a phone); centred with side panels on desktop |

## Screen flow

1. **Title**: Play (the next unsolved level), Levels (LevelSelect), Settings.
2. **Puzzle** variants, chosen per game: **match-3** (swap two neighbours to line up 3+; a goal like “Clear 20 red”, a move limit), **sliding** (slide tiles into order; moves counted, no limit), **Sokoban** (push crates onto marks; Undo and Restart always available).
3. **Solved** → ResultsScores: moves, time, stars (by moves), Next (default).
4. Match-3 out of moves → GameOver with “+5 moves” (once, free) or Retry; sliding and Sokoban never fail.

## HUD

- Top: the goal (“Clear 20 red ● 14 left”) or the level number (sliding, Sokoban).
- Top right: moves left (match-3) or moves made (others), the star thresholds as small marks.
- Bottom: Undo, Restart, Hint (Sokoban and sliding), each 44 px with its key shown on desktop.
- Score with a combo count that pops above the grid for 1 s on cascades (match-3).

## Genre menus

- Hint: highlights one move for 2 s (match-3: a swap; Sokoban: the next push); costs nothing but marks the level “hinted” (no third star).
- Level select as a grid of numbered tiles with stars, chapters by 20.

## Controls

Actions are named once (`cursor`, `select`, `swap`, `undo`, `restart`, `hint`, `pause`) and read through gaming-core's input layer; the prompt on screen follows the last device used (`.game[data-device]`). Gamepad buttons by position on the standard layout. Every action is remappable in ControlsRemap except Pause.

| Action | Keyboard | Mouse | Gamepad | Touch |
| --- | --- | --- | --- | --- |
| Move the cursor | Arrow keys or WASD | Hover | D-pad / left stick | — |
| Select / swap | Space or Return, then an arrow | Drag a piece onto its neighbour | South, then a direction | Swipe a piece toward its neighbour |
| Push (Sokoban) / slide | Arrow keys | Click a reachable tile | D-pad | Swipe |
| Undo | Z or Backspace | Undo button | West | Undo button |
| Restart | R | Restart button | North (hold) | Restart button |
| Hint | H | Hint button | Back | Hint button |
| Pause | Esc | — | Start | Pause button |

## Phone layout

- Portrait: the grid full width (8 × 8 at 44 px cells), goal and moves above, Undo · Restart · Hint below.
- Swipes have a 12 px dead zone; a tap-tap swap also works.
- Landscape puts the goal and buttons in a column beside the grid.

## Game blocks

- **LevelSelect**: numbered levels with stars
- **HudPieces**: goal, moves, score, combo
- **TutorialPrompt**: the first swap / push with a pointing hand
- **ResultsScores**: stars and best moves
- **GameOver**: match-3 out of moves
- **PauseMenu**: resume, restart, levels, settings

## Art and sound

- Pieces 16 px with a shape AND a colour each (circle red, square cyan, diamond amber, triangle green, hex grape), so they work without colour.
- Clears: 3 frames (flash, shrink, gone); falling pieces ease in 120 ms per row.
- Sokoban: crates `n`/`o`, marks `y` outlines, walls `q`; the player any ArtSprites hero.
- Music: soft loops; cues for swap, match (pitch rises with combo), invalid move (low tick), solved chime.

## Texts

Game-level keys only; each block's own keys are on its card.

| Key | English | 日本語 |
| --- | --- | --- |
| `puzzle.title` | Gem Grid | ジェムグリッド |
| `hud.goal` | Clear {n} {colour} | {colour}を {n} こ消す |
| `hud.moves_left` | {n} moves left | のこり {n} 手 |
| `hud.moves` | {n} moves | {n} 手 |
| `action.undo` | Undo | 戻す |
| `action.restart` | Restart | やり直し |
| `action.hint` | Hint | ヒント |
| `over.more_moves` | +5 Moves | +5 手 |

## Adding to it

- A new variant (Lights Out, pipes): its rule, its pieces and which HUD parts it uses; the shell stays.
- A level pack: levels as JSON grids; LevelSelect adds a chapter.
- Daily puzzle: one seeded level a day, its own results table.

## Don't

- Don’t draw menus, dialogue or numbers into the canvas: they are game kit HTML so they can be read, translated and focused.
- Don’t rely on colour alone: every piece has its own shape.
- Don’t put a timer on puzzles by default; time is an optional mode.
