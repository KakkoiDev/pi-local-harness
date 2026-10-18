# GameOver

App Block card (Game blocks). When the player is out of lives or health: what happened, what was kept, and Try Again from the last checkpoint as the first choice.

- Basecoat: none (game kit: `game-center`, `game-title`, `game-menu`, `game-btn`)
- Needs: GameKit; checkpoint or save (SaveSlots); for roguelikes the run summary (ResultsScores table)
- Links to: TitleScreen, ResultsScores (high scores for arcade), SaveSlots

## Markup
Copy, never retype: `{harness}/kit/blocks/game-blocks/GameOver.html` (9 lines of HTML).

Show it after a short beat (0.8 s, the world fading to grey on the canvas), never instantly; input during the beat is ignored so a held button doesn't pick an option.

## States
- Checkpoint game: As above.
- Arcade (score): Detail shows the score; if it's a high score, ResultsScores name entry comes first. Try Again restarts the level.
- Roguelike (permadeath): Title `gameover.run_over`; `#go-detail` shows `gameover.floor` (set from code, floor and time); a short run summary list; first option `gameover.new_run`; no Load.
- Tips: After the second game over at the same spot, one TutorialPrompt-style tip line under the detail.
- Continue with coins: Only if the genre uses it: `gameover.continue_cost` with the cost; never the first option.

## Texts
(Key | English | 日本語)
- `gameover.title`: Game Over | ゲームオーバー
- `gameover.detail`: The slime got you in {place}. You keep the coins you found. | {place} でスライムにやられた。拾ったコインはそのまま残ります。
- `gameover.retry`: Try Again from Checkpoint | チェックポイントから再開
- `gameover.load`: Load a Save | ロード
- `gameover.title_screen`: Back to Title | タイトルに戻る
- `gameover.run_over`: Run Over | 冒険終了
- `gameover.new_run`: New Run | 新しい冒険
- `gameover.floor`: Reached floor {floor} in {time} | {time} で {floor} 階まで到達
- `gameover.tip`: Tip: slimes jump after they flash. Step aside then. | ヒント：スライムは光ったあとに跳ねます。そのときに横へよけましょう。

## Keyboard and focus
1. Try Again (focused) → Load → Back to Title. Enter/south chooses; Esc/east does nothing (no accidental quit).

## Phone
- Centred, buttons 44 px; the title wraps at most to two lines (smaller size by container width).

## Data
```json
{"gameOver": {"cause": "enemy.slime", "place": "place.willow_field", "checkpoint": "cp_field_2", "kept": {"coins": 86}}}
```

## Don't
- Don't make Back to Title the first or default option.
- Don't flash red full-screen (photosensitivity); fade instead.

## Pi Workbench
- Assumes GameKit (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> GameOver` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
