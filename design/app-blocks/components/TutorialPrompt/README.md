# TutorialPrompt

A short hint at the moment it's needed, naming the action with the prompt of the device in use: “Press [Space] to jump”.

| | |
| --- | --- |
| Group | Game blocks |
| Basecoat | none (game kit: `game-panel`, `game-row`, `game-key`, `game-mouse`, `game-padpos`, `[data-for]`) |
| Needs | GameKit (device switching, `promptHTML()`); gaming-core's bindings through `gcInput.binding()` (the prompt shows the CURRENT binding, not the default) |
| Used in | every genre's first minutes; HudPieces (energy empty), InventoryGrid (bag full) |

## Markup

```html
<div class="game-panel" role="status" aria-live="polite" data-tutorial="jump"
     style="position:absolute;left:50%;bottom:18%;transform:translateX(-50%);padding:8px 12px">
  <p class="game-row" style="margin:0;font-size:14px" aria-hidden="true">
    <span data-for="keyboard"><span class="game-key">Space</span></span>
    <span data-for="mouse"><span class="game-key">Space</span></span>
    <span data-for="gamepad"><span class="game-padpos" data-pos="south" aria-label="South button" data-t-label="game.pad.south"></span></span>
    <span data-for="touch"><span class="game-key">⤒</span></span>
    <span data-t="tutorial.jump">to jump</span>
  </p>
  <span class="sr-only" data-t="tutorial.jump_sr">Press Space to jump</span>
</div>
```

The prompt comes from the CURRENT binding through gaming-core: GameKit's `promptHTML('jump', device)` (from `gcInput.binding()`; a key's printed name, a gamepad position); touch shows the on-screen button's own icon. Screen readers get one sentence: `tutorial.jump_sr` with the device's words (“Press Space to jump” / “Press the south button to jump”).

## States

| State | What changes |
| --- | --- |
| Shown | When the player first meets the need (a gap to jump), not before; stays until the action is done once, or 8 s. |
| Done | Fades out after the action; never shown again (saved in `flags.tutorial.<id>`). |
| Device changed | The prompt updates at once (CSS, through `data-device`). |
| Hold actions | A ring fills around the key while held; the line reads `tutorial.hold` (set from code, `{input}` the prompt's words). |
| Two inputs | Move shows WASD and arrows, the left stick, or the touch stick. |
| Hints off | Settings › Hints: Off hides all except the first-minute ones. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `tutorial.jump` | to jump | でジャンプ |
| `tutorial.jump_sr` | Press {input} to jump | {input} を押すとジャンプ |
| `tutorial.move` | to move | で移動 |
| `tutorial.talk` | to talk | で話す |
| `tutorial.hold` | Hold {input} to charge | {input} 長押しでため攻撃 |
| `tutorial.no_energy` | Out of energy. Rest or drink a potion. | エネルギー切れです。休むか、ポーションを飲みましょう。 |
| `tutorial.dismiss` | Got It | OK |

## Keyboard and focus

- Never takes focus and never pauses the game, except a first-time screen tutorial (a `.game-overlay` with `tutorial.dismiss`), which pauses and focuses its button.

## Phone

- Sits above TouchControls, centred; points at the on-screen button it names with a small ▼ under it when that button is in the same row.

## Data

```json
{"tutorial": {"id": "jump", "action": "jump", "trigger": "near_gap", "seen": false}, "flags": {"tutorial.move": true}}
```

## Don't

- Don't write “Press A” or a fixed key: read the binding and the device.
- Don't show more than one prompt at a time.
