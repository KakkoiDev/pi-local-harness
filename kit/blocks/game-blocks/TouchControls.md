# TouchControls

App Block card (Game blocks). On-screen controls for phones: a movement stick under the left thumb and one to three action buttons under the right, shown only when touch is the device in use.

- Basecoat: none (game kit: `game-touch`, `game-stick`, `game-touchbtn`)
- Needs: GameKit (`data-device="touch"`); pointer events; the bindings (each button fires an action, not a key)
- Used in: every genre with real-time movement; tap-only genres (GameCards, GamePuzzle, GameIdle, GameVisualNovel) don't need it

## Markup
Copy, never retype: `{harness}/kit/blocks/game-blocks/TouchControls.html` (9 lines of HTML).

Copy, never retype: `{harness}/kit/blocks/game-blocks/TouchControls.js` (10 lines of JS).

(LittleJS also offers `setTouchGamepadEnable(true)`, a canvas-drawn pad; use these HTML controls instead so they follow the layout, the language and the left-handed option.)

## States
- Not touch: Hidden (`data-for="touch"`), and so is the pause button.
- Pressed: Button background turns `--g-accent`; a 10 ms vibration where supported.
- Stick dragged: The knob follows the thumb up to 48 px; the base stays.
- Left-handed: `.game-touch` gets `flex-direction: row-reverse`; the stick is on the right.
- Menus, dialogue: Hidden while a menu or DialogueBox is open (the screen's own buttons take over).
- Portrait: Controls shrink to 104 px stick and 56 px buttons and keep 16 px from the edges.

## Texts
(Key | English | 日本語)
- `touch.move`: Move: drag in any direction | 移動：好きな方向にドラッグ
- `touch.left_handed`: Left-Handed Layout | 左利き用レイアウト
- `action.attack`: Attack | 攻撃
- `action.jump`: Jump | ジャンプ
- `game.pause`: Pause | ポーズ

## Keyboard and focus
- Touch-only; the buttons have `tabindex="-1"` so keyboard users never land on them. Each still has an `aria-label` for screen-reader touch exploration.

## Phone
- Landscape is the default for action games: stick bottom-left, buttons bottom-right, pause top-right, all inside the safe areas.
- At most three action buttons; more actions go into a radial menu on a long press or into PauseMenu.

## Data
```json
{"touch": {"move": {"x": 0.62, "y": 0}, "pressed": {"jump": false, "attack": true}, "leftHanded": false}}
```

## Don't
- Don't draw touch controls on the canvas.
- Don't put buttons where the HUD is (bottom corners are theirs on touch).
- Don't require two-finger gestures for core actions.

## Pi Workbench
- Assumes GameKit (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> TouchControls` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
