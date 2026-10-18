# LevelSelect

App Block card (Game blocks). A grid of levels grouped by world, each showing locked, open or finished with its stars and best time, and Play.

- Basecoat: none (game kit: `game-panel`, `game-tabs`, `game-slots`, `game-slot`, `game-icon[data-kind=star]`)
- Needs: GameKit; level list and progress (Data)
- Used in: GamePlatformer, GamePuzzle, GameTowerDefence, GameRacing, GameArcade

## Markup
Copy, never retype: `{harness}/kit/blocks/game-blocks/LevelSelect.html` (23 lines of HTML).

## States
- Locked: Dim slot with a padlock, `aria-disabled="true"`, the bottom row's detail shows `levels.unlock_hint` (set from code when the slot is focused, “Get 3 more stars to open”).
- Open, not played: Number only; detail `levels.new`.
- Finished: 1–3 stars; detail shows the best time or score.
- Last played: Focus starts here, not on 1-1.
- World locked: Its tab shows ??? and `aria-disabled`; focusing it reads the unlock rule.

## Texts
(Key | English | 日本語)
- `levels.title`: Choose a Level | ステージ選択
- `levels.stars_total`: {stars} / {max} | {stars} / {max}
- `levels.best`: Best | ベスト
- `levels.play`: Play | プレイ
- `levels.new`: Not played yet | 未プレイ
- `levels.locked`: Locked | ロック中
- `levels.unlock_hint`: Get {n} more stars to open | あと {n} 個の星で解放
- `world.1`: 1 · Meadow | 1・草原
- `world.2`: 2 · Caves | 2・洞窟
- `level.1_4`: 1-4 · Windy Hill | 1-4・風の丘

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

## Pi Workbench
- Assumes GameKit (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> LevelSelect` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
