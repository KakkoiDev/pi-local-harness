# ResultsScores

After a level or a run: the score counted up line by line, stars or rank, a new best marked, and the high-score table with name entry.

| | |
| --- | --- |
| Group | Game blocks |
| Basecoat | none (game kit: `game-center`, `game-panel`, `game-list`, `game-num`) |
| Needs | GameKit; the run's numbers (Data); high scores in `localStorage` (this device only) |
| Links to | LevelSelect (Next Level), GameOver (shares the high-score table), TitleScreen |

## Markup

```html
<section id="results" class="game-overlay" role="dialog" aria-modal="true" aria-labelledby="res-title" hidden>
  <div class="game-panel" style="width:min(520px,100%);display:grid;gap:12px">
    <h2 id="res-title" class="game-h"><span data-t="results.clear">Level Clear</span> · 1-4</h2>
    <dl class="game-num" style="display:grid;grid-template-columns:1fr auto;gap:6px 16px;margin:0">
      <dt data-t="results.coins">Coins</dt><dd style="margin:0">42 × 10 = 420</dd>
      <dt data-t="results.time_bonus">Time bonus</dt><dd style="margin:0">1 200</dd>
      <dt data-t="results.no_damage">No damage</dt><dd style="margin:0">500</dd>
      <dt style="color:var(--g-accent)" data-t="results.total">Total</dt><dd style="margin:0;color:var(--g-accent)">2 120</dd>
    </dl>
    <p class="game-row" style="justify-content:center;gap:6px;margin:0" aria-label="2 of 3 stars">…three .game-icon[data-kind=star]…</p>
    <p class="game-row" role="status" style="justify-content:center;margin:0;color:var(--g-accent)" data-t="results.new_best">New best!</p>
    <ul class="game-menu">
      <li><button class="game-btn" autofocus data-t="results.next">Next Level</button></li>
      <li><button class="game-btn" data-t="results.retry">Try Again</button></li>
      <li><button class="game-btn" data-t="results.levels">Level Select</button></li>
    </ul>
  </div>
</section>
```

High scores (arcade and roguelike): a `game-list` of the top 10, rank · name · score · date, the new entry highlighted, and before it a name field: `<input class="game-btn" maxlength="10" aria-label="Your name">` styled like a button row, prefilled with the last name used.

## States

| State | What changes |
| --- | --- |
| Counting | Lines appear one by one (0.3 s), numbers count up; any confirm skips to the end. Reduce Motion: all at once. |
| New best | `results.new_best` line and the row highlighted in the table. |
| High score | Name entry first (Enter saves), then the table. |
| Not a high score | The table shows, with a line under it: `results.top_needed` (set from code, “Top 10 needs 3 400”). |
| Last level of a world | Next Level becomes `results.next_world`. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `results.clear` | Level Clear | ステージクリア |
| `results.coins` | Coins | コイン |
| `results.time_bonus` | Time bonus | タイムボーナス |
| `results.no_damage` | No damage | ノーダメージ |
| `results.total` | Total | 合計 |
| `results.new_best` | New best! | ベスト更新！ |
| `results.next` | Next Level | 次のステージ |
| `results.next_world` | Next World | 次のワールド |
| `results.retry` | Try Again | もう一度 |
| `results.levels` | Level Select | ステージ選択 |
| `results.high_scores` | High Scores | ハイスコア |
| `results.your_name` | Your name | なまえ |
| `results.top_needed` | Top 10 needs {score} | トップ10まであと {score} |

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
