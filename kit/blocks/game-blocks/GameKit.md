# GameKit

App Block card (Game blocks). The game layer: HTML menus, HUD and prompts over a gaming-core (LittleJS) canvas, with the input device in use deciding every prompt.

- Basecoat: none inside the game (the kit's own `game-*` classes); Basecoat only on pages around it (settings outside the game, About)
- Route: `index.html` (the game is the page)
- Needs: LittleJS 1.27.0 as gaming-core scaffolds it (classic scripts, `engineInit`), `styles/game.css` (below), `js/input.js` and `js/menu.js` (below), `messages/en.json`, `messages/ja.json`
- Used in: every Game block (TitleScreen … TouchControls) and every genre card (GameRpg … GameTactics)

## Markup
Copy, never retype: `{harness}/kit/blocks/game-blocks/GameKit.html` (24 lines of HTML).

In `game.js`, start the engine inside the box (the last argument of `engineInit` is the root element):

Copy, never retype: `{harness}/kit/blocks/game-blocks/GameKit.js` (1 line of JS).

`js/input.js`: the device in use, written on `.game` as `data-device`, so only its prompts show:

Copy, never retype: `{harness}/kit/blocks/game-blocks/GameKit.2.js` (14 lines of JS).

`js/menu.js`: one focus model for every menu. Arrow keys, the d-pad and the left stick move focus between `.game-btn`, `.game-option`, `.game-slot`, `.game-card` and `[role=tab]` in the open screen; confirm and back are the same everywhere:

Copy, never retype: `{harness}/kit/blocks/game-blocks/GameKit.3.js` (23 lines of JS).

## The stylesheet
Copy this whole file to `styles/game.css`. It is plain CSS (no Tailwind needed in a game). The palette variables at the top come from Art · ArtPalettes; change them together.

Copy, never retype: `{harness}/kit/blocks/game-blocks/GameKit.css` (186 lines of CSS).

## States
- Keyboard: `data-device="keyboard"`: prompts show `.game-key` keycaps (Esc, Enter, WASD/arrows).
- Mouse: `data-device="mouse"`: prompts show `.game-mouse` (`data-button="left|right|wheel"`) or the key when the action has no mouse button. Menus are clickable; the hover state is the focus state.
- Gamepad: `data-device="gamepad"`: prompts show `.game-padpos` with `data-pos="south|east|west|north"` (the dot of that position filled). Never a console brand's letters or shapes.
- Touch: `data-device="touch"`: prompts show the on-screen button's own label; TouchControls appears; every target 44 px or more.
- Menu open: The world pauses (`setPaused(true)`), `setInputPreventDefault(false)`, focus is inside the menu.
- Window loses focus: PauseMenu opens; nothing happens until the person comes back and chooses.
- Japanese: `lang="ja"` on `<html>`: `--g-font-ja` replaces the Latin pixel font; longer labels wrap, never shrink below 12 px.
- Reduced motion: No screen shake, flashes or animated UI (`prefers-reduced-motion`); also an option in GameSettings.

## Texts
(Key | English | 日本語)
- `game.name`: Meadow Quest | メドウ・クエスト
- `game.confirm`: Confirm | 決定
- `game.back`: Back | 戻る
- `game.paused_on_blur`: Paused while you were away | 離れている間、一時停止しました
- `game.device.keyboard`: Keyboard | キーボード
- `game.device.mouse`: Mouse | マウス
- `game.device.gamepad`: Gamepad | ゲームパッド
- `game.device.touch`: Touch | タッチ
- `game.pad.south`: South button | 下ボタン
- `game.pad.east`: East button | 右ボタン
- `game.pad.west`: West button | 左ボタン
- `game.pad.north`: North button | 上ボタン

## Keyboard and focus
1. A screen opens with focus on its first button (or the one marked `autofocus`).
2. ↑ ↓ (and ← → in grids) move focus; Tab and Shift+Tab work too, staying inside the open screen.
3. Enter or Space confirms; Esc or Backspace goes back; Esc during play opens PauseMenu.
4. Gamepad: d-pad or left stick moves, south confirms, east goes back, start pauses.
5. When a screen closes, focus returns to the control that opened it.

## Phone
- The game fills the screen (`100dvh`); the HUD keeps clear of notches with `env(safe-area-inset-*)` (built into `.game-hud` and `.game-touch`).
- Landscape is the play orientation for action games; portrait for card, puzzle, idle and visual-novel games. Menus work in both.
- Sizes follow the box, not the window: `.game` is a size container, so `cqi`/`cqb` units scale titles with the game.
- Pixel art scales by whole numbers (`--g-px` = one art pixel; 4 px at 16 px sprites on a 1280-wide screen, 2 px on a phone).

## Data
```json
{"settings": {"v": 1, "lang": "ja", "music": 0.8, "sfx": 1, "reduceMotion": false, "bindings": {"jump": {"keyboard": "Space", "gamepad": 0}}},
 "device": "gamepad"}
```

- Settings live in `localStorage["<game-id>.settings"]`; saves in `localStorage["<game-id>.save.<slot>"]` (SaveSlots). `<game-id>` is the project folder name in kebab case.
- No server. Everything works offline once loaded.

## Don't
- Don't draw text, menus or buttons on the canvas: put them in `.game-layer` so focus, screen readers and Japanese work.
- Don't load fonts or scripts from a CDN: vendor the pixel fonts (both OFL) into `fonts/` with their licences, or use the fallbacks.
- Don't name gamepad buttons A/B/X/Y or by shapes: name them by position.
- Don't keep the game running behind an open menu.

## Pi Workbench
- Set up: `python3 {harness}/kit/blocks/add.py <project> GameKit` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
