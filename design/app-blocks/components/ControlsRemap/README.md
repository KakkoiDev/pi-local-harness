# ControlsRemap

Shows every action with its key, mouse button and gamepad button, and lets the person change one by pressing the new input; prompts follow the device in use.

**Requires gaming-core with `padStyle: 'position'` and fixed actions (pull request to KakkoiDev/gaming-core, not merged yet).** The API this card uses: `gcInput.bindings` (read), `gcInput.binding(name, device)`, `gcInput.lastBinding` (the input pressed this frame, while listening), `gcInput.bind(name, list)` (returns `false` for a fixed action), `gcInput.save()`, `gcInput.reset()`, `gcInputCore.label(binding)`. The full table is in GameKit.

| | |
| --- | --- |
| Group | Game blocks |
| Basecoat | none (game kit: `game-panel`, `game-tabs`, `game-list`, `game-key`, `game-mouse`, `game-padpos`) |
| Needs | GameKit; gaming-core's input layer `gcInput` with `padStyle: 'position'` and `fixed: ['pause', 'back']` (GameKit, "The input layer"): it holds, saves and resets the bindings (Data); the game reads `input.pressed.jump`, never a key |
| Links to | GameSettings (Controls tab), PauseMenu, TutorialPrompt (prompts read the same bindings) |

## Markup

```html
<section id="controls" class="game-overlay" role="dialog" aria-modal="true" aria-labelledby="controls-title" hidden>
  <div class="game-panel" style="width:min(620px,100%)">
    <h2 id="controls-title" class="game-h" data-t="controls.title">Controls</h2>
    <div class="game-tabs" role="tablist" aria-label="Device" style="margin:10px 0">
      <button class="game-tab" role="tab" aria-selected="true" data-device-tab="keyboard" data-t="game.device.keyboard">Keyboard</button>
      <button class="game-tab" role="tab" aria-selected="false" tabindex="-1" data-device-tab="gamepad" data-t="game.device.gamepad">Gamepad</button>
    </div>
    <ul class="game-list" role="listbox" aria-label="Actions">
      <li role="option" tabindex="0" aria-selected="true" data-action="move">
        <span style="flex:1" data-t="action.move">Move</span>
        <span class="game-key">W</span><span class="game-key">A</span><span class="game-key">S</span><span class="game-key">D</span>
      </li>
      <li role="option" tabindex="-1" data-action="jump">
        <span style="flex:1" data-t="action.jump">Jump</span><span class="game-key">Space</span>
      </li>
      <li role="option" tabindex="-1" data-action="fire">
        <span style="flex:1" data-t="action.fire">Attack</span><span class="game-key">J</span>
        <span class="game-mouse" data-button="left" aria-label="Left click" data-t-label="game.mouse.left"></span>
      </li>
      <li role="option" tabindex="-1" data-action="interact">
        <span style="flex:1" data-t="action.interact">Talk or Use</span><span class="game-key">E</span>
      </li>
      <li role="option" tabindex="-1" data-action="pause" aria-disabled="true">
        <span style="flex:1" data-t="action.pause">Pause</span><span class="game-key">Esc</span>
        <span class="game-small" data-t="controls.fixed">Fixed</span>
      </li>
      <li role="option" tabindex="-1" data-action="back" aria-disabled="true">
        <span style="flex:1" data-t="action.back">Back (menus)</span><span class="game-key">Esc</span>
        <span class="game-small" data-t="controls.fixed">Fixed</span>
      </li>
    </ul>
    <p class="game-hint" style="margin-top:12px">
      <span class="game-row"><span data-for="keyboard mouse"><span class="game-key">Enter</span></span><span data-for="gamepad"><span class="game-padpos" data-pos="south" aria-label="South button" data-t-label="game.pad.south"></span></span><span data-t="controls.change">Change</span></span>
      <span class="game-row"><span data-for="keyboard mouse"><span class="game-key">R</span></span><span data-for="gamepad"><span class="game-padpos" data-pos="north" aria-label="North button" data-t-label="game.pad.north"></span></span><span data-t="controls.reset">Reset All</span></span>
      <span class="game-row"><span data-for="keyboard mouse"><span class="game-key">Esc</span></span><span data-for="gamepad"><span class="game-padpos" data-pos="east" aria-label="East button" data-t-label="game.pad.east"></span></span><span data-t="game.back">Back</span></span>
    </p>
    <p id="controls-live" class="sr-only" aria-live="assertive"></p>
  </div>
</section>
```

Each row's inputs are drawn by GameKit's `promptHTML(action, device)` from `gcInput.binding()`: on the Gamepad tab `.game-padpos` with `data-pos` (south, east, west, north) for face buttons and `.game-padkey` with the position's short name for the rest (`↑ ↓ ← →`, LS, RS, LT, RT, Select, Start; the `aria-label` says “left shoulder”, “right trigger”). The tab of the device in use opens first. Rows are the game's actions in this order: `move` (gaming-core's `moveX`/`moveY`), gaming-core's `jump` and `fire` where the genre has them, the genre's own (`interact`…), then the fixed `pause` and `back`.

## States

| State | What changes |
| --- | --- |
| Listening | Pressing Change on a row: the row's inputs are replaced by `controls.press_new` and a countdown `.game-bar` (5 s); `#controls-live` announces it. Each frame reads `gcInput.lastBinding` (`'key:KeyK'`, `'pad:5'`, `'mouse:2'`); a binding of another device than the open tab is ignored. Esc cancels; with a gamepad, east cancels only after 1 s (so it can be bound). |
| Changed | The new binding replaces the action's binding of the same device (`gcInput.bind(action, list)`, the other devices' bindings kept), `gcInput.save()`; the row redraws. `#controls-live` gets `controls.changed` (set from code: `{action}` the action's text, `{input}` the input's words). |
| Conflict | The new input is already bound to another action that isn't fixed: the two inputs swap (two `bind()` calls), and that row's `.game-small` shows `controls.swapped` for 3 s (set from code). If the other action is fixed, the new input is refused and `#controls-live` says `controls.taken_fixed`. |
| Fixed | Pause (Esc, P / start) and back (Esc / east) can't be rebound: gaming-core's `fixed: ['pause', 'back']` makes `bind()` return `false` and `reset()` keep them; the rows show `controls.fixed` and are `aria-disabled="true"`. |
| No gamepad connected | The Gamepad tab shows `controls.no_gamepad` and the default layout, read-only. |
| Touch | No remapping (the on-screen buttons press the actions themselves); the panel shows the TouchControls layout with each button's action, and the option `touch.left_handed` (mirror). |
| Reset All | Asks first; `gcInput.reset()` (the defaults, fixed actions untouched) and `save()`. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `controls.title` | Controls | 操作設定 |
| `controls.change` | Change | 変更 |
| `controls.reset` | Reset All | すべて初期設定に戻す |
| `controls.press_new` | Press a key or button… | キーまたはボタンを押してください… |
| `controls.changed` | {action}: {input} | {action}：{input} |
| `controls.swapped` | Swapped with {action} | {action} と入れ替えました |
| `controls.fixed` | Fixed | 固定 |
| `controls.no_gamepad` | Connect a gamepad and press any button. | ゲームパッドを接続して、いずれかのボタンを押してください。 |
| `action.move` | Move | 移動 |
| `action.jump` | Jump | ジャンプ |
| `action.fire` | Attack | 攻撃 |
| `action.back` | Back (menus) | 戻る（メニュー） |
| `controls.taken_fixed` | {input} is used by {action}, which can't change. | {input} は {action} に使われていて、変更できません。 |
| `game.mouse.left` | Left click | 左クリック |
| `action.interact` | Talk or Use | 話す・調べる |
| `action.pause` | Pause | ポーズ |
| `touch.left_handed` | Left-Handed Layout | 左利き用レイアウト |

## Keyboard and focus

1. Device tabs (← →) → 2. action rows (↑ ↓) → Enter/south: listen → the next key or button pressed is the new binding.
- While listening, every key is captured except Esc (cancel); with a gamepad, east cancels only after 1 s (so it can be bound).
- R or north: Reset All (asks first). Esc or east: back.

## Phone

- On touch the panel shows the touch layout instead (no remapping), plus Left-Handed Layout.
- Rows are 44 px; a row's Change is the whole row.

## Data

```json
{"version": 1,
 "actions": {
   "jump":     ["key:Space", "key:KeyZ", "pad:0"],
   "fire":     ["key:KeyJ", "mouse:0", "pad:2"],
   "interact": ["key:KeyE", "pad:3"],
   "confirm":  ["key:Enter", "key:Space", "mouse:0", "pad:0"],
   "back":     ["key:Escape", "key:Backspace", "mouse:2", "pad:1"],
   "pause":    ["key:Escape", "key:KeyP", "pad:9"]},
 "axes": {
   "moveX": {"negative": ["key:KeyA", "key:ArrowLeft", "pad:14"], "positive": ["key:KeyD", "key:ArrowRight", "pad:15"], "stick": "left.x"},
   "moveY": {"negative": ["key:KeyS", "key:ArrowDown", "pad:13"], "positive": ["key:KeyW", "key:ArrowUp", "pad:12"], "stick": "left.y"}}}
```

- gaming-core's format, as `gcInput.save()` writes it (LittleJS `writeSaveData`) under `<game-id>.input`; `gcInput.init()` restores it and falls back to the defaults for anything unknown or invalid. No other copy of the bindings exists.
- `'key:<KeyboardEvent.code>'` (layout-independent), `'mouse:<0 left|1 middle|2 right>'`, `'pad:<standard mapping index>'` (0 south, 1 east, 2 west, 3 north, 4/5 shoulders, 6/7 triggers, 8 select, 9 start, 10/11 stick presses, 12–15 d-pad, 16 home). Moving a binding on the Keyboard tab changes the first `key:` entry of the list (and, for move, of `negative` or `positive`: the row asks for each direction in turn).
- The game asks `input.pressed.jump` from `inputUpdate()`, never `keyWasPressed('Space')`.

## Don't

- Don't show A/B/X/Y or face-button shapes; show positions.
- Don't keep bindings anywhere but gaming-core (`<game-id>.input`), or translate between two formats.
- Don't show the key's code (`KeyW`); show the key as printed on the keyboard (`W`), using `navigator.keyboard.getLayoutMap()` where available.
- Don't let two actions share one input silently.
