# GameSettings

App Block card (Game blocks). The game's own settings, in three tabs: Audio, Language and Display; every change applies at once and is saved.

- Basecoat: none (game kit: `game-panel`, `game-tabs`, `game-tab`, `game-option`, `game-value`, `game-meter`)
- Needs: GameKit; `setSoundVolume()` (LittleJS) for sound effects; the music player's volume; messages for both languages
- Links to: ControlsRemap (the Controls tab), PauseMenu, TitleScreen

## Markup
Copy, never retype: `{harness}/kit/blocks/game-blocks/GameSettings.html` (38 lines of HTML).

Each option is one row: the name, then a value changed with ← → (d-pad left/right; click or tap on the left or right half). Language shows each language in its own script (English, 日本語) and switches the whole game at once.

## States
- Changed: Applies at once (volume plays a short blip at the new level); saved to `<game-id>.settings` on every change. No Save button.
- Muted: Music at 0 shows `settings.off` instead of the meter.
- Full screen unavailable: (phones, embedded) the row is `aria-disabled="true"` with `settings.fullscreen_unavailable`.
- Reduce Motion on: No screen shake, flashes or parallax; defaults to on when the system asks for reduced motion.
- Language changed: Every visible text re-renders; the row now reads 日本語; focus stays on the row.

## Texts
(Key | English | 日本語)
- `settings.title`: Settings | 設定
- `settings.audio`: Audio | サウンド
- `settings.language`: Language | 言語
- `settings.display`: Display | 表示
- `settings.controls`: Controls | 操作
- `settings.music`: Music | BGM
- `settings.sfx`: Sound Effects | 効果音
- `settings.mute_background`: Mute When in Background | バックグラウンドで消音
- `settings.fullscreen`: Full Screen | フルスクリーン
- `settings.fullscreen_unavailable`: Not available on this device | この端末では使用できません
- `settings.scale`: Pixel Scale | ピクセル倍率
- `settings.scale_auto`: Auto | 自動
- `settings.reduce_motion`: Reduce Motion | 動きを減らす
- `settings.text_size`: Text Size | 文字サイズ
- `settings.text_normal`: Normal | 標準
- `settings.text_large`: Large | 大
- `settings.on`: On | オン
- `settings.off`: Off | オフ

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

## Pi Workbench
- Assumes GameKit (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> GameSettings` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
