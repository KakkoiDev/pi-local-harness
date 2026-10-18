# LevelSelect

A grid of levels grouped by world, each showing locked, open or finished with its stars and best time, and Play.

| | |
| --- | --- |
| Group | Game blocks |
| Basecoat | none (game kit: `game-panel`, `game-tabs`, `game-slots`, `game-slot`, `game-icon[data-kind=star]`) |
| Needs | GameKit; level list and progress (Data) |
| Used in | GamePlatformer, GamePuzzle, GameTowerDefence, GameRacing, GameArcade |

## Markup

```html
<section id="levels" class="game-overlay" role="dialog" aria-modal="true" aria-labelledby="lv-title" hidden>
  <div class="game-panel" style="width:min(640px,100%);display:grid;gap:12px">
    <div class="game-row" style="justify-content:space-between">
      <h2 id="lv-title" class="game-h" data-t="levels.title">Choose a Level</h2>
      <span class="game-row game-num"><span class="game-icon" data-kind="star" aria-hidden="true"></span><span data-t="levels.stars_total">14 / 30</span></span>
    </div>
    <div class="game-tabs" role="tablist">
      <button class="game-tab" role="tab" aria-selected="true" data-t="world.1">1 · Meadow</button>
      <button class="game-tab" role="tab" aria-selected="false" tabindex="-1" data-t="world.2">2 · Caves</button>
      <button class="game-tab" role="tab" aria-selected="false" tabindex="-1" aria-disabled="true" data-t="world.3">3 · ???</button>
    </div>
    <div class="game-slots" role="grid" style="--cols:5;gap:8px">
      <button class="game-slot" role="gridcell" aria-label="Level 1-1, 3 stars" style="width:64px;height:64px;display:grid;align-content:center;gap:4px">
        <span class="game-num">1-1</span><span class="game-row" style="gap:1px" aria-hidden="true"><i class="game-icon" data-kind="star"></i><i class="game-icon" data-kind="star"></i><i class="game-icon" data-kind="star"></i></span>
      </button>
      <!-- open, not finished: no stars; locked: <span class="game-slot" role="gridcell" aria-disabled="true" aria-label="Level 1-7, locked">🔒 drawn as a padlock sprite</span> -->
    </div>
    <div class="game-row" style="justify-content:space-between" aria-live="polite">
      <span><span class="game-speaker" data-t="level.1_4">1-4 · Windy Hill</span> <span class="game-small"><span data-t="levels.best">Best</span> 0:48.20</span></span>
      <button class="game-btn" data-variant="solid" data-t="levels.play">Play</button>
    </div>
  </div>
</section>
```

## States

| State | What changes |
| --- | --- |
| Locked | Dim slot with a padlock, `aria-disabled="true"`, the bottom row's detail shows `levels.unlock_hint` (set from code when the slot is focused, “Get 3 more stars to open”). |
| Open, not played | Number only; detail `levels.new`. |
| Finished | 1–3 stars; detail shows the best time or score. |
| Last played | Focus starts here, not on 1-1. |
| World locked | Its tab shows ??? and `aria-disabled`; focusing it reads the unlock rule. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `levels.title` | Choose a Level | ステージ選択 |
| `levels.stars_total` | {stars} / {max} | {stars} / {max} |
| `levels.best` | Best | ベスト |
| `levels.play` | Play | プレイ |
| `levels.new` | Not played yet | 未プレイ |
| `levels.locked` | Locked | ロック中 |
| `levels.unlock_hint` | Get {n} more stars to open | あと {n} 個の星で解放 |
| `world.1` | 1 · Meadow | 1・草原 |
| `world.2` | 2 · Caves | 2・洞窟 |
| `level.1_4` | 1-4 · Windy Hill | 1-4・風の丘 |

## Keyboard and focus

1. World tabs (Q / E, shoulders) → 2. the grid (arrows, d-pad) → Enter/south plays the focused level (Play is the same action, for mouse and touch).
- Esc/east goes back to TitleScreen.

## Phone

- 4 columns of 64 px slots in portrait, 6 in landscape; Play is a full-width solid button at the bottom.

## Data

```json
{"worlds": [{"id": 1, "levels": ["1-1", "1-2", "1-3", "1-4", "1-5", "1-6", "1-7"], "unlock": {"stars": 0}}],
 "progress": {"1-1": {"stars": 3, "best": 31.2}, "1-4": {"stars": 0, "best": 48.2}}, "last": "1-4"}
```

- Progress is part of the save (`<game-id>.save.auto` for games without slots).

## Don't

- Don't hide locked levels; show them locked with the rule.
- Don't use stars as the only difficulty sign; the level name says it.
