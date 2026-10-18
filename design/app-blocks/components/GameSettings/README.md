# GameSettings

The game's own settings, in three tabs: Audio, Language and Display; every change applies at once and is saved.

| | |
| --- | --- |
| Group | Game blocks |
| Basecoat | none (game kit: `game-panel`, `game-tabs`, `game-tab`, `game-option`, `game-value`, `game-meter`) |
| Needs | GameKit; `setSoundVolume()` (LittleJS) for sound effects; the music player's volume; messages for both languages |
| Links to | ControlsRemap (the Controls tab), PauseMenu, TitleScreen |

## Markup

```html
<section id="settings" class="game-overlay" role="dialog" aria-modal="true" aria-labelledby="settings-title" hidden>
  <div class="game-panel" style="width:min(520px,100%)">
    <h2 id="settings-title" class="game-h" data-t="settings.title">Settings</h2>
    <div class="game-tabs" role="tablist" aria-label="Settings" data-t-label="settings.title" style="margin:10px 0">
      <button class="game-tab" role="tab" id="tab-audio" aria-selected="true" aria-controls="panel-audio" data-t="settings.audio">Audio</button>
      <button class="game-tab" role="tab" id="tab-lang" aria-selected="false" aria-controls="panel-lang" tabindex="-1" data-t="settings.language">Language</button>
      <button class="game-tab" role="tab" id="tab-display" aria-selected="false" aria-controls="panel-display" tabindex="-1" data-t="settings.display">Display</button>
      <button class="game-tab" role="tab" id="tab-controls" aria-selected="false" tabindex="-1" data-t="settings.controls">Controls</button>
    </div>
    <div id="panel-audio" role="tabpanel" aria-labelledby="tab-audio">
      <div class="game-option" tabindex="0" role="slider" aria-valuemin="0" aria-valuemax="10" aria-valuenow="8" aria-labelledby="opt-music">
        <span id="opt-music" data-t="settings.music">Music</span>
        <span class="game-value"><span class="game-meter" aria-hidden="true"><i data-on></i><i data-on></i><i data-on></i><i data-on></i><i data-on></i><i data-on></i><i data-on></i><i data-on></i><i></i><i></i></span></span>
      </div>
      <div class="game-option" tabindex="0" role="slider" aria-valuemin="0" aria-valuemax="10" aria-valuenow="10" aria-labelledby="opt-sfx">
        <span id="opt-sfx" data-t="settings.sfx">Sound Effects</span>
        <span class="game-value"><span class="game-meter" aria-hidden="true"><i data-on></i>…ten…</span></span>
      </div>
      <div class="game-option" tabindex="0" role="switch" aria-checked="false" aria-labelledby="opt-mute-bg">
        <span id="opt-mute-bg" data-t="settings.mute_background">Mute When in Background</span>
        <span class="game-value" data-t="settings.off">Off</span>
      </div>
    </div>
    <div id="panel-lang" role="tabpanel" aria-labelledby="tab-lang" hidden>
      <div class="game-option" tabindex="0" role="button" aria-labelledby="opt-lang">
        <span id="opt-lang" data-t="settings.language">Language</span>
        <span class="game-value">English</span>
      </div>
    </div>
    <div id="panel-display" role="tabpanel" aria-labelledby="tab-display" hidden>
      <div class="game-option" tabindex="0" role="switch" aria-checked="false"><span data-t="settings.fullscreen">Full Screen</span><span class="game-value" data-t="settings.off">Off</span></div>
      <div class="game-option" tabindex="0" role="button"><span data-t="settings.scale">Pixel Scale</span><span class="game-value" data-t="settings.scale_auto">Auto</span></div>
      <div class="game-option" tabindex="0" role="switch" aria-checked="false"><span data-t="settings.reduce_motion">Reduce Motion</span><span class="game-value" data-t="settings.off">Off</span></div>
      <div class="game-option" tabindex="0" role="button"><span data-t="settings.text_size">Text Size</span><span class="game-value" data-t="settings.text_normal">Normal</span></div>
    </div>
    <p class="game-hint" style="margin-top:12px"><span class="game-row"><span data-for="keyboard mouse"><span class="game-key">Esc</span></span><span data-for="gamepad"><span class="game-padpos" data-pos="east" aria-label="East button"></span></span><span data-t="game.back">Back</span></span></p>
  </div>
</section>
```

Each option is one row: the name, then a value changed with ← → (d-pad left/right; click or tap on the left or right half). Language shows each language in its own script (English, 日本語) and switches the whole game at once.

## States

| State | What changes |
| --- | --- |
| Changed | Applies at once (volume plays a short blip at the new level); saved to `<game-id>.settings` on every change. No Save button. |
| Muted | Music at 0 shows `settings.off` instead of the meter. |
| Full screen unavailable | (phones, embedded) the row is `aria-disabled="true"` with `settings.fullscreen_unavailable`. |
| Reduce Motion on | No screen shake, flashes or parallax; defaults to on when the system asks for reduced motion. |
| Language changed | Every visible text re-renders; the row now reads 日本語; focus stays on the row. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `settings.title` | Settings | 設定 |
| `settings.audio` | Audio | サウンド |
| `settings.language` | Language | 言語 |
| `settings.display` | Display | 表示 |
| `settings.controls` | Controls | 操作 |
| `settings.music` | Music | BGM |
| `settings.sfx` | Sound Effects | 効果音 |
| `settings.mute_background` | Mute When in Background | バックグラウンドで消音 |
| `settings.fullscreen` | Full Screen | フルスクリーン |
| `settings.fullscreen_unavailable` | Not available on this device | この端末では使用できません |
| `settings.scale` | Pixel Scale | ピクセル倍率 |
| `settings.scale_auto` | Auto | 自動 |
| `settings.reduce_motion` | Reduce Motion | 動きを減らす |
| `settings.text_size` | Text Size | 文字サイズ |
| `settings.text_normal` | Normal | 標準 |
| `settings.text_large` | Large | 大 |
| `settings.on` | On | オン |
| `settings.off` | Off | オフ |

## Keyboard and focus

1. The tab list (← → switch tabs) → 2. the rows of the open tab (↑ ↓ move, ← → change) → back to the tabs.
- Q / E, or the shoulder buttons (gamepad 4 / 5), switch tabs from anywhere in the panel.
- Esc, Backspace or east closes; focus returns to the button that opened it.

## Phone

- The panel takes 94 % of the width; rows are 44 px; the value's ◀ ▶ halves are separate tap targets (each at least 44 px wide).
- Full Screen is hidden where the browser has no fullscreen API (iPhone Safari).

## Data

```json
{"v": 1, "lang": "en", "music": 0.8, "sfx": 1, "muteBackground": false, "fullscreen": false, "scale": "auto", "reduceMotion": false, "textSize": "normal"}
```

- `localStorage["<game-id>.settings"]`; read before the title screen so the first frame is already in the right language.

## Don't

- Don't use a native `<input type="range">` styled as a slider here; the row is the slider (one focus stop, ← →).
- Don't put graphics quality settings in a pixel game; scale and motion are enough.
- Don't make the person press Apply.
