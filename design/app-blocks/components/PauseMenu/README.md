# PauseMenu

Stops the world and offers Resume, Settings, Controls and Quit to Title; opens on Esc, the start button, the pause button on touch, or when the window loses focus.

| | |
| --- | --- |
| Group | Game blocks |
| Basecoat | none (game kit: `game-overlay`, `game-panel`, `game-menu`, `game-btn`) |
| Needs | GameKit (`openScreen`, `setPaused`); GameSettings; ControlsRemap; SaveSlots (games that save from the menu) |
| Links to | GameSettings, ControlsRemap, SaveSlots, TitleScreen |

## Markup

```html
<section id="pause" class="game-overlay" role="dialog" aria-modal="true" aria-labelledby="pause-title" hidden>
  <div class="game-panel" style="min-width:min(320px,100%)">
    <h2 id="pause-title" class="game-h" data-t="pause.title">Paused</h2>
    <ul class="game-menu" style="margin-top:12px">
      <li><button class="game-btn" id="pause-resume" data-t="pause.resume" autofocus>Resume</button></li>
      <li><button class="game-btn" id="pause-save" data-t="pause.save">Save</button></li>
      <li><button class="game-btn" id="pause-settings" data-t="pause.settings">Settings</button></li>
      <li><button class="game-btn" id="pause-controls" data-t="pause.controls">Controls</button></li>
      <li><button class="game-btn" id="pause-quit" data-t="pause.quit">Quit to Title</button></li>
    </ul>
    <p id="pause-hint" class="game-hint" style="margin-top:12px">
      <span class="game-row"><span data-for="keyboard mouse"><span class="game-key">Esc</span></span><span data-for="gamepad"><span class="game-padpos" data-pos="east" aria-label="East button" data-t-label="game.pad.east"></span></span><span data-t="pause.resume">Resume</span></span>
    </p>
  </div>
</section>
```

```js
function openPause() { setPaused(true); openScreen(document.getElementById('pause')); }
function resume() { closeScreen(document.getElementById('pause')); setPaused(false); }
```

## States

| State | What changes |
| --- | --- |
| Open | The world freezes (`setPaused(true)`), music ducks to 30 %, the overlay dims the scene. |
| Paused by focus loss | A `.game-small` line under the title: `game.paused_on_blur`. |
| Nothing to save here | Save is `disabled` with `aria-describedby` → `pause.save_blocked` (e.g. during a boss fight); games that only autosave leave Save out. |
| Saved | `#pause-hint` shows `pause.saved` for 3 s (set from code, `{slot}` filled), then the hint again; focus stays on Save. |
| Quit with unsaved progress | A game-style confirm: `pause.quit_confirm` with Quit (east/back is Cancel). |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `pause.title` | Paused | ポーズ |
| `pause.resume` | Resume | ゲームに戻る |
| `pause.save` | Save | セーブ |
| `pause.settings` | Settings | 設定 |
| `pause.controls` | Controls | 操作設定 |
| `pause.quit` | Quit to Title | タイトルに戻る |
| `pause.save_blocked` | You can’t save during a battle. | 戦闘中はセーブできません。 |
| `pause.saved` | Saved to slot {slot}. | スロット {slot} にセーブしました。 |
| `pause.quit_confirm` | Quit to the title? Progress since your last save is lost. | タイトルに戻りますか？最後のセーブ以降の進行状況は失われます。 |

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
