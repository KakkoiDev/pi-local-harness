# TouchControls

On-screen controls for phones: a movement stick under the left thumb and one to three action buttons under the right, shown only when touch is the device in use.

| | |
| --- | --- |
| Group | Game blocks |
| Basecoat | none (game kit: `game-touch`, `game-stick`, `game-touchbtn`) |
| Needs | GameKit (`data-device="touch"`); pointer events; the bindings (each button fires an action, not a key) |
| Used in | every genre with real-time movement; tap-only genres (GameCards, GamePuzzle, GameIdle, GameVisualNovel) don't need it |

## Markup

```html
<div class="game-touch" data-for="touch" aria-label="Touch controls">
  <div class="game-stick" id="stick" role="application" aria-label="Move: drag in any direction" data-t-label="touch.move"></div>
  <div class="game-row" style="gap:16px;align-items:end">
    <button class="game-touchbtn" data-action="attack" aria-label="Attack" data-t-label="action.attack" data-t="action.attack">Attack</button>
    <button class="game-touchbtn" data-action="jump" aria-label="Jump" data-t-label="action.jump" style="width:76px;height:76px;margin-bottom:28px">⤒</button>
  </div>
</div>
<button class="game-touchbtn" data-for="touch" data-action="pause" aria-label="Pause" data-t-label="game.pause"
        style="position:absolute;top:max(12px,env(safe-area-inset-top));right:max(12px,env(safe-area-inset-right));width:44px;height:44px">II</button>
```

```js
// stick: the first touch that starts in the left half; value -1..1 on each axis, 12 px dead zone
const stick = document.getElementById('stick'); let id = null, origin = null; const touchMove = vec2();
stick.addEventListener('pointerdown', e => { id = e.pointerId; origin = [e.clientX, e.clientY]; stick.setPointerCapture(id); });
stick.addEventListener('pointermove', e => { if (e.pointerId !== id) return;
  const dx = e.clientX - origin[0], dy = e.clientY - origin[1], d = Math.hypot(dx, dy);
  touchMove.set(d < 12 ? 0 : clamp(dx / 48, -1, 1), d < 12 ? 0 : clamp(-dy / 48, -1, 1)); });
stick.addEventListener('pointerup', () => { id = null; touchMove.set(0, 0); });
document.querySelectorAll('.game-touchbtn[data-action]').forEach(b => {
  b.addEventListener('pointerdown', () => press(b.dataset.action, true));
  b.addEventListener('pointerup', () => press(b.dataset.action, false)); });
```

(LittleJS also offers `setTouchGamepadEnable(true)`, a canvas-drawn pad; use these HTML controls instead so they follow the layout, the language and the left-handed option.)

## States

| State | What changes |
| --- | --- |
| Not touch | Hidden (`data-for="touch"`), and so is the pause button. |
| Pressed | Button background turns `--g-accent`; a 10 ms vibration where supported. |
| Stick dragged | The knob follows the thumb up to 48 px; the base stays. |
| Left-handed | `.game-touch` gets `flex-direction: row-reverse`; the stick is on the right. |
| Menus, dialogue | Hidden while a menu or DialogueBox is open (the screen's own buttons take over). |
| Portrait | Controls shrink to 104 px stick and 56 px buttons and keep 16 px from the edges. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `touch.move` | Move: drag in any direction | 移動：好きな方向にドラッグ |
| `touch.left_handed` | Left-Handed Layout | 左利き用レイアウト |
| `action.attack` | Attack | 攻撃 |
| `action.jump` | Jump | ジャンプ |
| `game.pause` | Pause | ポーズ |

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
