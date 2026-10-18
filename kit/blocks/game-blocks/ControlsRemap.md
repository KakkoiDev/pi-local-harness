# ControlsRemap

App Block card (Game blocks). Shows every action with its key, mouse button and gamepad button, and lets the person change one by pressing the new input; prompts follow the device in use.

- Basecoat: none (game kit: `game-panel`, `game-tabs`, `game-list`, `game-key`, `game-mouse`, `game-padpos`)
- Needs: GameKit; the bindings table (Data); LittleJS `keyWasPressed`, `mouseWasPressed`, `gamepadWasPressed` read through the bindings, never hard-coded
- Links to: GameSettings (Controls tab), PauseMenu, TutorialPrompt (prompts read the same bindings)

## Markup
Copy, never retype: `{harness}/kit/blocks/game-blocks/ControlsRemap.html` (35 lines of HTML).

On the Gamepad tab each row shows `.game-padpos` with `data-pos` (south, east, west, north), `.game-key` labels for the d-pad (`↑ ↓ ← →`), shoulders and triggers (`L1 R1 L2 R2` are positions, not brands: “left shoulder”, “right trigger” in the `aria-label`). The tab of the device in use opens first.

## States
- Listening: Pressing Change on a row: the row's inputs are replaced by `controls.press_new` (“Press a key…” / “Press a button…”) and a countdown `.game-bar` (5 s); `#controls-live` announces it. Esc or east cancels.
- Changed: The row shows the new input; `controls.changed` is announced. Saved at once.
- Conflict: The new input is already used by another action: the two inputs swap, and the other row shows `controls.swapped` for 3 s.
- Fixed: Pause (Esc / start) and menu back can't be rebound: `controls.fixed`, the row is `aria-disabled="true"`.
- No gamepad connected: The Gamepad tab shows `controls.no_gamepad` and the default layout, read-only.
- Touch: No remapping; the panel shows the TouchControls layout with each button's action, and the option `touch.left_handed` (mirror).

## Texts
(Key | English | 日本語)
- `controls.title`: Controls | 操作設定
- `controls.change`: Change | 変更
- `controls.reset`: Reset All | すべて初期設定に戻す
- `controls.press_new`: Press a key or button… | キーまたはボタンを押してください…
- `controls.changed`: {action}: {input} | {action}：{input}
- `controls.swapped`: Swapped with {action} | {action} と入れ替えました
- `controls.fixed`: Fixed | 固定
- `controls.no_gamepad`: Connect a gamepad and press any button. | ゲームパッドを接続して、いずれかのボタンを押してください。
- `action.move`: Move | 移動
- `action.jump`: Jump | ジャンプ
- `action.attack`: Attack | 攻撃
- `action.interact`: Talk or Use | 話す・調べる
- `action.pause`: Pause | ポーズ
- `touch.left_handed`: Left-Handed Layout | 左利き用レイアウト

## Keyboard and focus
1. Device tabs (← →) → 2. action rows (↑ ↓) → Enter/south: listen → the next key or button pressed is the new binding.
- While listening, every key is captured except Esc (cancel); with a gamepad, east cancels only after 1 s (so it can be bound).
- R or north: Reset All (asks first). Esc or east: back.

## Phone
- On touch the panel shows the touch layout instead (no remapping), plus Left-Handed Layout.
- Rows are 44 px; a row's Change is the whole row.

## Data
```json
{"bindings": {
  "move":     {"keyboard": ["KeyW", "KeyA", "KeyS", "KeyD"], "gamepad": "leftStick"},
  "jump":     {"keyboard": "Space", "mouse": null, "gamepad": 0},
  "attack":   {"keyboard": "KeyJ", "mouse": 0, "gamepad": 2},
  "interact": {"keyboard": "KeyE", "gamepad": 3},
  "pause":    {"keyboard": "Escape", "gamepad": 9, "fixed": true}}}
```

- Keyboard values are `KeyboardEvent.code` (layout-independent); gamepad values are standard-mapping indices (0 south, 1 east, 2 west, 3 north, 4/5 shoulders, 6/7 triggers, 9 start, 12–15 d-pad).
- Saved inside `localStorage["<game-id>.settings"].bindings`. The game asks `bound('jump')` instead of `keyWasPressed('Space')`.

## Don't
- Don't show A/B/X/Y or face-button shapes; show positions.
- Don't show the key's code (`KeyW`); show the key as printed on the keyboard (`W`), using `navigator.keyboard.getLayoutMap()` where available.
- Don't let two actions share one input silently.

## Pi Workbench
- Assumes GameKit (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> ControlsRemap` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
