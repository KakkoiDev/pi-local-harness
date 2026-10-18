# TitleScreen

App Block card (Game blocks). The first screen of a game: its name over the world, Continue or New Game, and the way to settings and quitting.

- Basecoat: none (game kit: `game-center`, `game-title`, `game-menu`, `game-btn`, `game-hint`)
- Route: the game's start; shown after loading, before play
- Needs: GameKit; SaveSlots (Continue reads the latest save); GameSettings
- Links to: SaveSlots, GameSettings, LevelSelect (games with levels)

## Markup
Copy, never retype: `{harness}/kit/blocks/game-blocks/TitleScreen.html` (16 lines of HTML).

The canvas keeps drawing the world behind it (slow camera pan, no player control). On touch devices the hint row is hidden; the buttons are the targets.

## States
- No save yet: `#title-continue` and `#title-load` are removed; focus starts on New Game.
- A save exists: Continue is first and focused; its `aria-describedby` points to `#title-continue-detail`: `title.continue_detail` (place and play time, filled from the latest save). No save: Continue and the line are removed.
- Press to start (first launch): Before audio may play, the menu is replaced by one button `title.press_start` (any key, click, tap or button press); audio starts on that gesture.
- Loading: `title.loading` with a `.game-bar` (`--value` 0–1) instead of the menu; nothing is focusable.
- Save can't be read: Continue stays, disabled, with `title.save_broken`; New Game and Load still work.
- Japanese: Title stays the game's name (it may have its own Japanese name); menu in Japanese.

## Texts
(Key | English | 日本語)
- `title.continue`: Continue | つづきから
- `title.continue_detail`: {place} · {time} played | {place}・プレイ時間 {time}
- `title.new`: New Game | はじめから
- `title.load`: Load Game | ロード
- `title.settings`: Settings | 設定
- `title.press_start`: Press Any Button | ボタンを押してください
- `title.loading`: Loading… | 読み込み中…
- `title.save_broken`: This save can’t be read | このセーブデータは読み込めません
- `title.version`: Version {version} · Saved on this device | バージョン {version}・この端末に保存

## Keyboard and focus
1. Continue (or New Game) → 2. New Game → 3. Load Game → 4. Settings. ↑ ↓ or the d-pad move; Enter, Space or south confirm.
- Esc and east do nothing here (there is nowhere to go back to).
- Settings opens GameSettings; closing it returns focus to Settings.

## Phone
- Portrait and landscape both work; the menu is centred and every button is 44 px tall.
- No hint row on touch (`data-device="touch"`).
- New Game asks first when a save exists (ConfirmDialog in game style: `.game-overlay` + `.game-panel`, “Start over? Your saves stay.”).

## Data
```json
{"title": {"hasSave": true, "latest": {"slot": 2, "place": "Willow Field", "playTime": 7380, "savedAt": "2026-10-18T14:20:00Z"}}}
```

- Read from `localStorage["<game-id>.save.*"]` (SaveSlots); no server.

## Don't
- Don't put the logo or menu on the canvas.
- Don't add Quit on the web (a tab can't close itself); add it only in an installed desktop build.
- Don't play music before the first press.

## Pi Workbench
- Assumes GameKit (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> TitleScreen` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
