# GameKit

App Block card (Game blocks). The game layer: HTML menus, HUD and prompts over a gaming-core (LittleJS) canvas, with the input device in use deciding every prompt.

- Basecoat: none inside the game (the kit's own `game-*` classes); Basecoat only on pages around it (settings outside the game, About)
- Route: `index.html` (the game is the page)
- Needs: LittleJS 1.27.0 as gaming-core scaffolds it (classic scripts, `engineInit`); gaming-core's input layer `starters/input.js` (`gcInput`) with `padStyle: 'position'` and `fixed` (see "The input layer"); `styles/game.css` (below), `js/input.js` and `js/menu.js` (below); the two pixel fonts in `static/fonts/` and `static/fonts.css` (see "Fonts"); `messages/en.json`, `messages/ja.json`
- Used in: every Game block (TitleScreen … TouchControls) and every genre card (GameRpg … GameTactics)

## Markup
Copy, never retype: `{harness}/kit/blocks/game-blocks/GameKit.html` (26 lines of HTML).

In `game.js`, start the engine inside the box (the last argument of `engineInit` is the root element):

Copy, never retype: `{harness}/kit/blocks/game-blocks/GameKit.js` (1 line of JS).

`js/input.js`: the game's actions on top of gaming-core's, the device in use written on `.game` as `data-device` (so only its prompts show), and the prompt for an action in the page's language:

Copy, never retype: `{harness}/kit/blocks/game-blocks/GameKit.2.js` (43 lines of JS).

`js/menu.js`: one focus model for every menu. Arrow keys, the d-pad and the left stick move focus between `.game-btn`, `.game-option`, `.game-slot`, `.game-card` and `[role=tab]` in the open screen; confirm and back are gaming-core's `confirm` and `back` actions (back is fixed, so it is always the same button):

Copy, never retype: `{harness}/kit/blocks/game-blocks/GameKit.3.js` (21 lines of JS).

### The input layer (gaming-core)

**Requires gaming-core with `padStyle: 'position'` and fixed actions (pull request to KakkoiDev/gaming-core, not merged yet).** Until it is merged, a game uses `starters/input.js` from that pull request. The cards assume exactly this:

(API | What it does | In gaming-core today (PR #1))
- `gcInput.init({storageKey, padStyle, fixed, actions, axes})`: Defaults plus the game's actions; loads saved bindings | yes, except `fixed`
- `padStyle: 'position'` (the default): Button names by position: south, east, west, north, left shoulder, right shoulder, left trigger, right trigger, select, start, left stick, right stick, d-pad up/down/left/right, home (`GC_INPUT_PAD_NAMES.position`) | **to add**; today `'xbox'` (default) and `'playstation'`
- `fixed: ['pause', 'back']`: `gcInput.bind()` returns `false` for these names and `reset()` keeps them | **to add**
- `gcInput.binding(name, device)`: The first binding string of an action or axis for a device (`'pad:0'`), what `prompt()` labels | **to add** (the `first()` inside `gcInputCore.prompt`, exposed)
- `gcInput.update()` → `{moveX, moveY, held, pressed, released, device, gamepad, mouse}`: One snapshot per frame | yes
- `gcInput.bind(name, list)`, `save()`, `load()`, `reset()`, `lastBinding`: Rebinding (ControlsRemap) | yes
- `gcInputCore.label('key:KeyW')` → `'W'`: A key's printed name | yes
- `gcInput.prompt(name)`: Words for an action on the device in use (`'south'` with `position`) | yes (brand names today)

Bindings are gaming-core's strings: `'key:<KeyboardEvent.code>'`, `'mouse:<0 left|1 middle|2 right>'`, `'pad:<standard button 0–16>'`; axes `moveX`/`moveY` take `negative` and `positive` lists and `stick: 'left.x'`. The game never reads `keyWasPressed('Space')`: it reads `input.pressed.jump`. On screen, gamepad buttons are positions, never a brand's letters or shapes; the four face buttons are `.game-padpos[data-pos]`, the rest a `.game-padkey` with the position's short name.

### Fonts

The pixel fonts live in the project, never on a CDN: **Silkscreen** (400, 700) and **DotGothic16** (400), both OFL, at `static/fonts/<family>/` exactly as the workbench's theme panel stores a Google font (`harness/theme_fonts.py`): the woff2 files `<weight>-<nnn>.woff2` (one per subset Google serves; DotGothic16 has many Japanese subsets), the licence `OFL.txt`, and `font-face.css` with one `@font-face` per file whose `src` is relative to `static/`. A game links **`static/fonts.css`**, the two `font-face.css` files joined (their paths stay right because both files sit in `static/`); Project Start writes it when it fetches the fonts with the person's yes. A line in it looks like (written by the harness, not copied from here): `@font-face { font-family: "Silkscreen"; font-style: normal; font-weight: 400; font-display: swap; src: url("fonts/Silkscreen/400-000.woff2") format("woff2"); unicode-range: U+0000-00FF, U+0131, U+0152-0153; }`

`styles/game.css` then names the families (`--g-font`, `--g-font-ja`, with system fallbacks if the files are missing). The catalogue's previews load the two fonts from Google Fonts; that is for the catalogue only.

## The stylesheet
Copy this whole file to `styles/game.css`. It is plain CSS (no Tailwind needed in a game). The palette variables at the top come from Art · ArtPalettes; change them together.

Copy, never retype: `{harness}/kit/blocks/game-blocks/GameKit.css` (193 lines of CSS).

## States
- Keyboard: `data-device="keyboard"`: prompts show `.game-key` keycaps (Esc, Enter, WASD/arrows).
- Mouse: `data-device="mouse"`: prompts show `.game-mouse` (`data-button="left|right|wheel"`) or the key when the action has no mouse button. Menus are clickable; the hover state is the focus state.
- Gamepad: `data-device="gamepad"`: prompts come from `promptHTML(action)`: `.game-padpos` with `data-pos="south|east|west|north"` (the dot of that position filled) for face buttons, `.game-padkey` with the position's short name for the others (LS, RS, LT, RT, Select, Start). Never a console brand's letters or shapes.
- Touch: `data-device="touch"` (from pointer events; gaming-core reports a tap as the mouse): prompts show the on-screen button's own label; TouchControls appears and its buttons press the same actions (`touchState`, merged in `inputUpdate()`); every target 44 px or more.
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
- `game.pad.left_shoulder`: Left shoulder | 左ショルダー
- `game.pad.left_shoulder.short`: LS | L
- `game.pad.right_shoulder`: Right shoulder | 右ショルダー
- `game.pad.right_shoulder.short`: RS | R
- `game.pad.left_trigger`: Left trigger | 左トリガー
- `game.pad.left_trigger.short`: LT | LT
- `game.pad.right_trigger`: Right trigger | 右トリガー
- `game.pad.right_trigger.short`: RT | RT
- `game.pad.select`: Select button | セレクトボタン
- `game.pad.select.short`: Select | セレクト
- `game.pad.start`: Start button | スタートボタン
- `game.pad.start.short`: Start | スタート
- `game.pad.left_stick`: Left stick (press) | 左スティック押し込み
- `game.pad.left_stick.short`: L3 | L3
- `game.pad.right_stick`: Right stick (press) | 右スティック押し込み
- `game.pad.right_stick.short`: R3 | R3
- `game.pad.dpad_up.short`: ↑ | ↑
- `game.pad.dpad_down.short`: ↓ | ↓
- `game.pad.dpad_left.short`: ← | ←
- `game.pad.dpad_right.short`: → | →
- `game.pad.home.short`: Home | ホーム
- `game.mouse.left`: Left click | 左クリック
- `game.mouse.middle`: Middle click | ホイールクリック
- `game.mouse.right`: Right click | 右クリック

## Keyboard and focus
1. A screen opens with focus on its first button (or the one marked `autofocus`).
2. ↑ ↓ (and ← → in grids) move focus; Tab and Shift+Tab work too, staying inside the open screen.
3. Enter or Space confirms; Esc or Backspace goes back; Esc during play opens PauseMenu.
4. Gamepad: d-pad or left stick moves, south confirms (`confirm`), east goes back (`back`, fixed), start pauses (`pause`, fixed).
5. When a screen closes, focus returns to the control that opened it.

## Phone
- The game fills the screen (`100dvh`); the HUD keeps clear of notches with `env(safe-area-inset-*)` (built into `.game-hud` and `.game-touch`).
- Landscape is the play orientation for action games; portrait for card, puzzle, idle and visual-novel games. Menus work in both.
- Sizes follow the box, not the window: `.game` is a size container, so `cqi`/`cqb` units scale titles with the game.
- Pixel art scales by whole numbers (`--g-px` = one art pixel; 4 px at 16 px sprites on a 1280-wide screen, 2 px on a phone).

## Data
```json
{"settings": {"v": 1, "lang": "ja", "music": 0.8, "sfx": 1, "reduceMotion": false},
 "input": {"version": 1,
   "actions": {"jump": ["key:Space", "key:KeyZ", "pad:0"], "fire": ["key:KeyX", "key:KeyJ", "mouse:0", "pad:2", "pad:7"],
               "confirm": ["key:Enter", "key:Space", "mouse:0", "pad:0"], "back": ["key:Escape", "key:Backspace", "mouse:2", "pad:1"],
               "pause": ["key:Escape", "key:KeyP", "pad:9"], "interact": ["key:KeyE", "pad:3"], "map": ["key:KeyM", "pad:8"]},
   "axes": {"moveX": {"negative": ["key:ArrowLeft", "key:KeyA", "pad:14"], "positive": ["key:ArrowRight", "key:KeyD", "pad:15"], "stick": "left.x"},
            "moveY": {"negative": ["key:ArrowDown", "key:KeyS", "pad:13"], "positive": ["key:ArrowUp", "key:KeyW", "pad:12"], "stick": "left.y"}}},
 "device": "gamepad"}
```

- Settings live in `localStorage["<game-id>.settings"]`; bindings are gaming-core's, saved by `gcInput.save()` (LittleJS `writeSaveData`) under `<game-id>.input`; saves in `localStorage["<game-id>.save.<slot>"]` (SaveSlots). `<game-id>` is the project folder name in kebab case.
- No server. Everything works offline once loaded.

## Don't
- Don't draw text, menus or buttons on the canvas: put them in `.game-layer` so focus, screen readers and Japanese work.
- Don't load fonts or scripts from a CDN: the pixel fonts (both OFL) live in `static/fonts/<family>/` with their licences, linked through `static/fonts.css`; without them the fallbacks show.
- Don't name gamepad buttons A/B/X/Y or by shapes: name them by position (`padStyle: 'position'`).
- Don't keep a second bindings format: read and write bindings only through `gcInput`.
- Don't keep the game running behind an open menu.

## Pi Workbench
- Set up: `python3 {harness}/kit/blocks/add.py <project> GameKit` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
