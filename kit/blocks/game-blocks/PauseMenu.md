# PauseMenu

App Block card (Game blocks). Stops the world and offers Resume, Settings, Controls and Quit to Title; opens on Esc, the start button, the pause button on touch, or when the window loses focus.

- Basecoat: none (game kit: `game-overlay`, `game-panel`, `game-menu`, `game-btn`)
- Needs: GameKit (`openScreen`, `setPaused`); GameSettings; ControlsRemap; SaveSlots (games that save from the menu)
- Links to: GameSettings, ControlsRemap, SaveSlots, TitleScreen

## Markup
Copy, never retype: `{harness}/kit/blocks/game-blocks/PauseMenu.html` (15 lines of HTML).

Copy, never retype: `{harness}/kit/blocks/game-blocks/PauseMenu.js` (2 lines of JS).

## States
- Open: The world freezes (`setPaused(true)`), music ducks to 30 %, the overlay dims the scene.
- Paused by focus loss: A `.game-small` line under the title: `game.paused_on_blur`.
- Nothing to save here: Save is `disabled` with `aria-describedby` → `pause.save_blocked` (e.g. during a boss fight); games that only autosave leave Save out.
- Saved: A line `pause.saved` replaces the hint for 3 s; focus stays on Save.
- Quit with unsaved progress: A game-style confirm: `pause.quit_confirm` with Quit (east/back is Cancel).

## Texts
(Key | English | 日本語)
- `pause.title`: Paused | ポーズ
- `pause.resume`: Resume | ゲームに戻る
- `pause.save`: Save | セーブ
- `pause.settings`: Settings | 設定
- `pause.controls`: Controls | 操作設定
- `pause.quit`: Quit to Title | タイトルに戻る
- `pause.save_blocked`: You can’t save during a battle. | 戦闘中はセーブできません。
- `pause.saved`: Saved to slot {slot}. | スロット {slot} にセーブしました。
- `pause.quit_confirm`: Quit to the title? Progress since your last save is lost. | タイトルに戻りますか？最後のセーブ以降の進行状況は失われます。

## Keyboard and focus
1. Resume (focused) → Save → Settings → Controls → Quit to Title.
- Esc, Backspace, east or start: Resume. Enter, Space or south: the focused item.
- Settings and Controls open over the pause panel; closing them returns focus to their button.

## Phone
- A pause button (`.game-touchbtn`, label `pause.title`, 44 px+) sits top-right in the HUD; it opens this menu.
- The panel fits 90 % of the width; buttons are 44 px tall.

## Data
```json
{"paused": true, "reason": "menu | blur", "canSave": false}
```

- No server; saving writes `localStorage["<game-id>.save.<slot>"]` (SaveSlots).

## Don't
- Don't keep timers, AI or physics running while paused (check `paused` in your update code).
- Don't resume on blur-return by itself; wait for the person.
- Don't put Restart Level here unless the genre has levels (then it goes after Resume).

## Pi Workbench
- Assumes GameKit (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> PauseMenu` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
