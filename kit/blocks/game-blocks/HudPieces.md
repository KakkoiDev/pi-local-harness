# HudPieces

App Block card (Game blocks). The pieces a game shows during play, each in a fixed corner: health, energy, score, timer, minimap, objective and combo.

- Basecoat: none (game kit: `game-hud` with `data-slot`, `game-bar`, `game-num`, `game-minimap`, `game-objective`, `game-combo`, `game-icon`)
- Needs: GameKit; the game state (Data) read once per frame in `gameRenderPost()`; only changed values are written to the DOM
- Used in: every genre card; PauseMenu hides it

## Markup
Copy, never retype: `{harness}/kit/blocks/game-blocks/HudPieces.html` (29 lines of HTML).

Leave a slot empty when the genre doesn't use it (an arcade game has score and lives only). Lives as icons: repeat `.game-icon[data-kind=heart]`, up to 5, then “×N”.

## States
- Low health (≤ 25 %): The bar uses `data-kind="danger"`; the heart blinks twice a second (not with Reduce Motion); `hud.low_health` is announced once.
- Damage: The bar drops at once; a lighter strip shows the lost part for 0.4 s.
- Energy empty: Energy bar empty, its label dim; actions that need it show the TutorialPrompt `tutorial.no_energy` once.
- Timer under 10 s: Timer text in `--g-bad`; one tick sound per second.
- New objective: The objective panel slides in from the top (fade only with Reduce Motion) and `#hud-live` announces it.
- Combo: Appears from ×2, grows for a moment on each hit, fades after 2 s without a hit.
- Menu open: The whole HUD is `hidden` under PauseMenu, dialogues and shops.

## Texts
(Key | English | 日本語)
- `hud.health`: Health | HP
- `hud.energy`: Energy | エネルギー
- `hud.score`: Score | スコア
- `hud.time`: Time | タイム
- `hud.objective`: Objective | 目的
- `hud.combo`: Combo | コンボ
- `hud.lives`: Lives | 残機
- `hud.low_health`: Health low | HPが少なくなっています
- `hud.new_objective`: New objective: {text} | 新しい目的：{text}
- `quest.find_well`: Find the old well north of the field | 野原の北にある古い井戸を探す

## Keyboard and focus
- The HUD never takes focus (no buttons in it). Screen readers get changes through `#hud-live` (objective, low health, level up), at most one message per second.
- Touch: the pause button (TouchControls) sits in the top-right slot instead of the coins, which move under the score.

## Phone
- Same corners, smaller: bars 80 px, text 12 px minimum; the minimap is hidden below 480 px wide and opens as MapScreen from a button.
- Keep the bottom corners clear where TouchControls sits: on touch, the minimap and combo move to the top row.

## Data
```json
{"player": {"hp": 7, "hpMax": 10, "energy": 30, "energyMax": 50, "coins": 86},
 "run": {"score": 12450, "timeLeft": 161, "combo": 12, "objective": "quest.find_well"}}
```

- Score and coins use the locale's grouping (`toLocaleString(lang)`; a thin space in the preview). Timer is m:ss.

## Don't
- Don't redraw the HUD every frame; write only values that changed.
- Don't use colour alone: bars have their numbers or icons beside them.
- Don't cover the player's position: nothing in the centre of the screen.

## Pi Workbench
- Assumes GameKit (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> HudPieces` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
