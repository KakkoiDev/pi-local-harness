# TutorialPrompt

App Block card (Game blocks). A short hint at the moment it's needed, naming the action with the prompt of the device in use: “Press [Space] to jump”.

- Basecoat: none (game kit: `game-panel`, `game-row`, `game-key`, `game-mouse`, `game-padpos`, `[data-for]`)
- Needs: GameKit (device switching); ControlsRemap bindings (the prompt shows the CURRENT binding, not the default)
- Used in: every genre's first minutes; HudPieces (energy empty), InventoryGrid (bag full)

## Markup
Copy, never retype: `{harness}/kit/blocks/game-blocks/TutorialPrompt.html` (10 lines of HTML).

The key text comes from the binding (`bindings.jump.keyboard` → its printed label); the gamepad position from `bindings.jump.gamepad`; touch shows the on-screen button's own icon. Screen readers get one sentence: `tutorial.jump_sr` with the device's words (“Press Space to jump” / “Press the south button to jump”).

## States
- Shown: When the player first meets the need (a gap to jump), not before; stays until the action is done once, or 8 s.
- Done: Fades out after the action; never shown again (saved in `flags.tutorial.<id>`).
- Device changed: The prompt updates at once (CSS, through `data-device`).
- Hold actions: A ring fills around the key while held (`tutorial.hold`).
- Two inputs: Move shows WASD and arrows, the left stick, or the touch stick.
- Hints off: Settings › Hints: Off hides all except the first-minute ones.

## Texts
(Key | English | 日本語)
- `tutorial.jump`: to jump | でジャンプ
- `tutorial.jump_sr`: Press {input} to jump | {input} を押すとジャンプ
- `tutorial.move`: to move | で移動
- `tutorial.talk`: to talk | で話す
- `tutorial.hold`: Hold {input} to charge | {input} 長押しでため攻撃
- `tutorial.no_energy`: Out of energy. Rest or drink a potion. | エネルギー切れです。休むか、ポーションを飲みましょう。
- `tutorial.dismiss`: Got It | OK

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

## Pi Workbench
- Assumes GameKit (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> TutorialPrompt` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
