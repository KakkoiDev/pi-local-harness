# ResultsScores

App Block card (Game blocks). After a level or a run: the score counted up line by line, stars or rank, a new best marked, and the high-score table with name entry.

- Basecoat: none (game kit: `game-center`, `game-panel`, `game-list`, `game-num`)
- Needs: GameKit; the run's numbers (Data); high scores in `localStorage` (this device only)
- Links to: LevelSelect (Next Level), GameOver (shares the high-score table), TitleScreen

## Markup
Copy, never retype: `{harness}/kit/blocks/game-blocks/ResultsScores.html` (18 lines of HTML).

High scores (arcade and roguelike): a `game-list` of the top 10, rank · name · score · date, the new entry highlighted, and before it a name field: `<input class="game-btn" maxlength="10" aria-label="Your name">` styled like a button row, prefilled with the last name used.

## States
- Counting: Lines appear one by one (0.3 s), numbers count up; any confirm skips to the end. Reduce Motion: all at once.
- New best: `results.new_best` line and the row highlighted in the table.
- High score: Name entry first (Enter saves), then the table.
- Not a high score: The table shows with `results.top_needed` (“Top 10 needs 3 400”).
- Last level of a world: Next Level becomes `results.next_world`.

## Texts
(Key | English | 日本語)
- `results.clear`: Level Clear | ステージクリア
- `results.coins`: Coins | コイン
- `results.time_bonus`: Time bonus | タイムボーナス
- `results.no_damage`: No damage | ノーダメージ
- `results.total`: Total | 合計
- `results.new_best`: New best! | ベスト更新！
- `results.next`: Next Level | 次のステージ
- `results.next_world`: Next World | 次のワールド
- `results.retry`: Try Again | もう一度
- `results.levels`: Level Select | ステージ選択
- `results.high_scores`: High Scores | ハイスコア
- `results.your_name`: Your name | なまえ
- `results.top_needed`: Top 10 needs {score} | トップ10まであと {score}

## Keyboard and focus
1. While counting: any confirm skips. 2. Next Level (focused) → Try Again → Level Select. 3. With a high score: the name field first, Enter saves and moves to Next.
- Esc/east = Level Select.

## Phone
- One column; the table shows rank, name and score (date hidden); the name field opens the phone keyboard.

## Data
```json
{"run": {"level": "1-4", "coins": 42, "timeBonus": 1200, "noDamage": 500, "total": 2120, "stars": 2},
 "highScores": {"key": "<game-id>.scores", "value": [{"name": "AIKO", "score": 9850, "at": "2026-10-18"}]}}
```

## Don't
- Don't claim online rankings; these scores are this device's.
- Don't make the person wait for the count-up.

## Pi Workbench
- Assumes GameKit (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> ResultsScores` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
