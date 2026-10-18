# GameKit

The game layer: HTML menus, HUD and prompts over a gaming-core (LittleJS) canvas, with the input device in use deciding every prompt.

| | |
| --- | --- |
| Group | Game blocks |
| Basecoat | none inside the game (the kit's own `game-*` classes); Basecoat only on pages around it (settings outside the game, About) |
| Route | `index.html` (the game is the page) |
| Needs | LittleJS 1.27.0 as gaming-core scaffolds it (classic scripts, `engineInit`), `styles/game.css` (below), `js/input.js` and `js/menu.js` (below), `messages/en.json`, `messages/ja.json` |
| Used in | every Game block (TitleScreen … TouchControls) and every genre card (GameRpg … GameTactics) |

## Markup

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title data-t="game.name">Meadow Quest</title>
<link rel="stylesheet" href="styles/game.css">
</head>
<body style="margin:0;background:#000">
  <div id="game" class="game" data-device="keyboard" style="width:100vw;height:100dvh">
    <!-- LittleJS puts its canvases here: engineInit(..., rootElement = #game) -->
    <div id="ui" class="game-layer">
      <!-- one screen at a time: TitleScreen, HudPieces, PauseMenu… each a direct child with hidden on the others -->
      <section id="hud" class="game-hud" aria-label="Status" hidden></section>
      <section id="pause" class="game-overlay" role="dialog" aria-modal="true" aria-labelledby="pause-title" hidden></section>
      <p id="live" class="sr-only" aria-live="polite"></p>
    </div>
  </div>
  <script src="js/littlejs.js"></script>
  <script src="js/input.js"></script>
  <script src="js/menu.js"></script>
  <script src="game.js"></script>
</body>
</html>
```

In `game.js`, start the engine inside the box (the last argument of `engineInit` is the root element):

```js
engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost, ['tiles.png'], document.getElementById('game'));
```

`js/input.js`: the device in use, written on `.game` as `data-device`, so only its prompts show:

```js
// keyboard | mouse | gamepad | touch; LittleJS tracks the first three, touch comes from pointer events
const gameBox = document.getElementById('game');
let device = 'keyboard';
function setDevice(next) {
  if (next === device) return;
  device = next;
  gameBox.dataset.device = next;
}
addEventListener('pointerdown', e => setDevice(e.pointerType === 'touch' ? 'touch' : 'mouse'), true);
addEventListener('keydown', () => setDevice('keyboard'), true);
function inputUpdatePost() {            // call from gameUpdatePost()
  if (device === 'touch' && lastInputDevice === 'mouse') return; // a tap also moves the "mouse"
  setDevice(lastInputDevice);           // 'mouse' | 'keyboard' | 'gamepad' from LittleJS
}
```

`js/menu.js`: one focus model for every menu. Arrow keys, the d-pad and the left stick move focus between `.game-btn`, `.game-option`, `.game-slot`, `.game-card` and `[role=tab]` in the open screen; confirm and back are the same everywhere:

```js
const CONFIRM = { keys: ['Enter', 'Space'], pad: 0 };   // pad 0 = south button
const BACK    = { keys: ['Escape', 'Backspace'], pad: 1 }; // pad 1 = east button
// d-pad: 12 up, 13 down, 14 left, 15 right; 9 = start (opens PauseMenu)
function openScreen(el) {                 // show one screen, remember focus, stop the world for menus
  for (const s of document.querySelectorAll('#ui > section')) s.hidden = s !== el;
  setInputPreventDefault(false);          // let keys reach the HTML buttons
  (el.querySelector('[autofocus]') || el.querySelector('button, [tabindex="0"]'))?.focus();
}
function closeScreen(el, back) { el.hidden = true; setInputPreventDefault(true); back?.focus(); }
function menuUpdate() {                   // call from gameUpdate() while a menu is open
  const pad = (b) => gamepadWasPressed(b);
  const move = pad(12) || pad(14) ? -1 : pad(13) || pad(15) ? 1 : 0;
  if (move) moveFocus(move);
  if (pad(CONFIRM.pad)) document.activeElement?.click();
  if (pad(BACK.pad)) document.activeElement?.closest('section')?.dispatchEvent(new CustomEvent('game:back'));
}
function moveFocus(step) {
  const items = [...document.activeElement.closest('section').querySelectorAll('.game-btn:not(:disabled), .game-option, .game-slot, .game-card, [role=tab], .game-list > li[tabindex]')];
  const i = items.indexOf(document.activeElement);
  items[(i + step + items.length) % items.length]?.focus();
}
addEventListener('blur', () => { if (!paused) openPause(); });      // pausing on blur
document.addEventListener('visibilitychange', () => { if (document.hidden && !paused) openPause(); });
```

## The stylesheet

Copy this whole file to `styles/game.css`. It is plain CSS (no Tailwind needed in a game). The palette variables at the top come from Art · ArtPalettes; change them together.

```css
/* ---- Game kit: the HTML layer over a gaming-core (LittleJS) canvas ----
   Menus, HUD and dialogue are HTML over the canvas, so they get real text, focus, screen readers and Japanese.
   The canvas draws the world; this layer draws words and controls. Copy into styles/game.css of a game project. */

.game {
  /* the art direction palette in use; "Meadow" by default (see Art · Palettes) */
  --g-ink: #1b1c2b;      /* outlines, text on light panels */
  --g-paper: #f4efe1;    /* light panel fill */
  --g-panel: #2b2d42;    /* dark panel fill */
  --g-text: #f4efe1;     /* text on dark panels */
  --g-dim: #9aa0b8;      /* secondary text on dark panels */
  --g-accent: #f2b33d;   /* focus, selection, highlights */
  --g-good: #5bb85d;     /* health, success */
  --g-bad: #e05a47;      /* damage, danger */
  --g-energy: #4aa3df;   /* mana, energy, shields */
  --g-px: 4px;           /* one art pixel at the current scale (16 px sprites at 4×) */
  --g-font: "Silkscreen", ui-monospace, "SFMono-Regular", Menlo, monospace;
  --g-font-ja: "DotGothic16", "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif;
  position: relative;
  display: grid;
  overflow: hidden;
  background: #000;
  color: var(--g-text);
  font-family: var(--g-font);
  image-rendering: pixelated;
  container: game / size;
}
.game:lang(ja), .game :lang(ja) { font-family: var(--g-font-ja); }
.game > canvas { grid-area: 1 / 1; width: 100%; height: 100%; image-rendering: pixelated; }
.game-layer { grid-area: 1 / 1; position: relative; pointer-events: none; }
.game-layer > * { pointer-events: auto; }

/* Panels: a two-step pixel frame (outer ink, inner light edge), no blur, no radius */
.game-panel {
  background: var(--g-panel);
  color: var(--g-text);
  padding: calc(var(--g-px) * 3);
  box-shadow:
    0 0 0 var(--g-px) var(--g-ink),
    inset 0 0 0 var(--g-px) color-mix(in srgb, var(--g-text) 22%, var(--g-panel)),
    0 calc(var(--g-px) * 2) 0 var(--g-px) rgb(0 0 0 / 0.35);
}
.game-panel[data-tone="light"] { background: var(--g-paper); color: var(--g-ink); box-shadow: 0 0 0 var(--g-px) var(--g-ink), inset 0 0 0 var(--g-px) #fff8, 0 calc(var(--g-px) * 2) 0 var(--g-px) rgb(0 0 0 / 0.35); }
.game-title { font-size: clamp(24px, 6cqi, 56px); line-height: 1; letter-spacing: 0.04em; text-transform: uppercase; margin: 0; text-shadow: var(--g-px) var(--g-px) 0 var(--g-ink); }
.game-h { font-size: 14px; line-height: 1.2; text-transform: uppercase; letter-spacing: 0.08em; color: var(--g-accent); margin: 0; }

/* Menus: a vertical list of buttons; the focused one shows the ▶ marker and the accent */
.game-menu { display: grid; gap: calc(var(--g-px) * 2); margin: 0; padding: 0; list-style: none; }
.game-btn {
  appearance: none;
  display: flex;
  align-items: center;
  gap: calc(var(--g-px) * 2);
  min-height: 44px;
  padding: 0 calc(var(--g-px) * 4);
  font: inherit;
  font-size: 16px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--g-text);
  background: transparent;
  border: 0;
  cursor: pointer;
  text-align: left;
}
.game-btn::before { content: ""; width: 1ch; }
.game-btn:is(:focus-visible, [data-selected="true"], :hover) { outline: none; color: var(--g-ink); background: var(--g-accent); }
.game-btn:is(:focus-visible, [data-selected="true"])::before { content: "▶"; }
.game-btn:disabled { color: var(--g-dim); background: transparent; cursor: default; }
.game-btn[data-variant="solid"] { justify-content: center; background: var(--g-accent); color: var(--g-ink); box-shadow: 0 0 0 var(--g-px) var(--g-ink); }

/* Bars: health, energy, progress; segmented by the art pixel */
.game-bar { --value: 1; --color: var(--g-good); display: block; height: calc(var(--g-px) * 3); min-width: 80px; background: var(--g-ink); box-shadow: 0 0 0 var(--g-px) var(--g-ink); position: relative; }
.game-bar::after { content: ""; position: absolute; inset: 0 auto 0 0; width: calc(var(--value) * 100%); background: var(--color); box-shadow: inset 0 calc(var(--g-px) * -1) 0 rgb(0 0 0 / 0.25); }
.game-bar[data-kind="energy"] { --color: var(--g-energy); }
.game-bar[data-kind="danger"] { --color: var(--g-bad); }

/* HUD: four corners and a top centre, kept inside the safe area */
.game-hud { position: absolute; inset: 0; padding: max(12px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) max(12px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left)); display: grid; grid-template: "tl tc tr" auto ". . ." 1fr "bl bc br" auto / 1fr auto 1fr; gap: 8px; pointer-events: none; font-size: 14px; text-shadow: 2px 2px 0 var(--g-ink); }
.game-hud > [data-slot="tl"] { grid-area: tl; } .game-hud > [data-slot="tc"] { grid-area: tc; } .game-hud > [data-slot="tr"] { grid-area: tr; justify-self: end; text-align: right; }
.game-hud > [data-slot="bl"] { grid-area: bl; align-self: end; } .game-hud > [data-slot="bc"] { grid-area: bc; align-self: end; } .game-hud > [data-slot="br"] { grid-area: br; justify-self: end; align-self: end; }
.game-num { font-variant-numeric: tabular-nums; }

/* Input prompts: the device in use decides the glyph (data-device on .game: keyboard | mouse | gamepad | touch) */
.game-key { display: inline-grid; place-items: center; min-width: 1.6em; height: 1.6em; padding: 0 0.35em; font-size: 0.85em; line-height: 1; color: var(--g-ink); background: var(--g-paper); box-shadow: 0 0 0 2px var(--g-ink), inset 0 -3px 0 #0003; }
.game-pad { display: inline-grid; place-items: center; width: 1.6em; height: 1.6em; border-radius: 50%; font-size: 0.85em; color: var(--g-ink); background: var(--g-paper); box-shadow: 0 0 0 2px var(--g-ink); }
.game-pad[data-pos="south"] { background: var(--g-good); } .game-pad[data-pos="east"] { background: var(--g-bad); } .game-pad[data-pos="west"] { background: var(--g-energy); } .game-pad[data-pos="north"] { background: var(--g-accent); }
.game [data-for]:not([hidden]) { display: inline-flex; align-items: center; gap: 0.4em; }
.game[data-device="keyboard"] [data-for]:not([data-for~="keyboard"]),
.game[data-device="mouse"] [data-for]:not([data-for~="mouse"]),
.game[data-device="gamepad"] [data-for]:not([data-for~="gamepad"]),
.game[data-device="touch"] [data-for]:not([data-for~="touch"]) { display: none; }

/* Dialogue */
.game-dialogue { position: absolute; left: 12px; right: 12px; bottom: 12px; display: grid; grid-template-columns: auto 1fr; gap: calc(var(--g-px) * 3); align-items: start; }
.game-portrait { width: calc(var(--g-px) * 16); height: calc(var(--g-px) * 16); background: var(--g-ink); box-shadow: 0 0 0 var(--g-px) var(--g-ink); image-rendering: pixelated; }
.game-speaker { color: var(--g-accent); font-size: 14px; text-transform: uppercase; letter-spacing: 0.06em; }
.game-line { font-size: 16px; line-height: 1.5; margin: 4px 0 0; }

/* Slot grids: inventory, equipment, hand of cards */
.game-slots { display: grid; grid-template-columns: repeat(var(--cols, 6), calc(var(--g-px) * 12)); gap: var(--g-px); }
.game-slot { position: relative; width: calc(var(--g-px) * 12); height: calc(var(--g-px) * 12); background: color-mix(in srgb, var(--g-ink) 70%, var(--g-panel)); box-shadow: inset 0 0 0 var(--g-px) color-mix(in srgb, var(--g-text) 12%, var(--g-ink)); display: grid; place-items: center; }
.game-slot:is(:focus-visible, [aria-selected="true"]) { outline: var(--g-px) solid var(--g-accent); outline-offset: 0; }
.game-slot > .game-count { position: absolute; right: 2px; bottom: 0; font-size: 11px; text-shadow: 1px 1px 0 var(--g-ink); }

/* Touch controls: phone only, under the thumbs */
.game-touch { position: absolute; inset: auto 0 0 0; display: flex; justify-content: space-between; align-items: end; padding: 16px max(16px, env(safe-area-inset-left)) max(16px, env(safe-area-inset-bottom)); pointer-events: none; }
.game-touch > * { pointer-events: auto; }
.game-stick { width: 120px; height: 120px; border-radius: 50%; background: rgb(255 255 255 / 0.12); box-shadow: inset 0 0 0 3px rgb(255 255 255 / 0.35); display: grid; place-items: center; }
.game-stick::after { content: ""; width: 48px; height: 48px; border-radius: 50%; background: rgb(255 255 255 / 0.45); }
.game-touchbtn { width: 64px; height: 64px; border-radius: 50%; border: 0; font: inherit; font-size: 14px; color: var(--g-ink); background: rgb(255 255 255 / 0.7); box-shadow: 0 0 0 3px var(--g-ink); }
@media (prefers-reduced-motion: reduce) { .game * { animation: none !important; transition: none !important; } }

/* ---- Game kit additions (game blocks) ---- */
/* Gamepad prompt by POSITION: four dots in a diamond, the button's own dot filled (no console brand letters) */
.game-padpos { position: relative; display: inline-block; width: 1.6em; height: 1.6em; vertical-align: middle; flex: none; }
.game-padpos::before { content: ""; position: absolute; width: 0.42em; height: 0.42em; left: calc(50% - 0.21em); top: calc(50% - 0.21em); border-radius: 50%; background: transparent; box-shadow: 0 -0.55em 0 0 var(--g-dim), 0.55em 0 0 0 var(--g-dim), 0 0.55em 0 0 var(--g-dim), -0.55em 0 0 0 var(--g-dim); }
.game-padpos::after { content: ""; position: absolute; width: 0.52em; height: 0.52em; left: calc(50% - 0.26em); top: calc(50% - 0.26em); border-radius: 50%; background: var(--g-accent); box-shadow: 0 0 0 2px var(--g-ink); }
.game-padpos[data-pos="south"]::after { transform: translateY(0.55em); }
.game-padpos[data-pos="east"]::after { transform: translateX(0.55em); }
.game-padpos[data-pos="west"]::after { transform: translateX(-0.55em); }
.game-padpos[data-pos="north"]::after { transform: translateY(-0.55em); }
.game-mouse { display: inline-block; width: 1em; height: 1.4em; border-radius: 0.5em; box-shadow: inset 0 0 0 2px var(--g-text); position: relative; vertical-align: middle; flex: none; }
.game-mouse::after { content: ""; position: absolute; top: 2px; width: calc(50% - 2px); height: 45%; background: var(--g-accent); border-radius: 0.5em 0 0 0; left: 2px; }
.game-mouse[data-button="right"]::after { left: auto; right: 2px; border-radius: 0 0.5em 0 0; }
.game-mouse[data-button="wheel"]::after { left: calc(50% - 1px); width: 2px; border-radius: 0; }

/* Overlays and layout helpers */
.game-overlay { position: absolute; inset: 0; display: grid; place-items: center; padding: 16px; background: rgb(10 10 20 / 0.62); }
.game-center { position: absolute; inset: 0; display: grid; place-items: center; align-content: center; gap: 24px; text-align: center; padding: 16px; }
.game-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.game-small { font-size: 12px; line-height: 1.4; color: var(--g-dim); }
.game-panel[data-tone="light"] .game-small { color: color-mix(in srgb, var(--g-ink) 70%, var(--g-paper)); }
.game-hint { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 12px; color: var(--g-dim); }

/* Lists of rows (quests, saves, levels, shop, settings) */
.game-list { display: grid; gap: 2px; margin: 0; padding: 0; list-style: none; }
.game-list > li { display: flex; align-items: center; gap: 10px; min-height: 44px; padding: 4px 10px; }
.game-list > li:is([aria-selected="true"], :focus-visible) { outline: none; background: color-mix(in srgb, var(--g-accent) 22%, transparent); box-shadow: inset var(--g-px) 0 0 var(--g-accent); }
.game-list > li[aria-disabled="true"] { color: var(--g-dim); }

/* Tabs inside a game panel */
.game-tabs { display: flex; gap: 4px; flex-wrap: wrap; }
.game-tab { appearance: none; font: inherit; font-size: 13px; text-transform: uppercase; letter-spacing: 0.06em; min-height: 36px; padding: 0 12px; color: var(--g-dim); background: transparent; border: 0; cursor: pointer; }
.game-tab[aria-selected="true"] { color: var(--g-ink); background: var(--g-accent); }

/* Settings rows: a name and a value changed with ◀ ▶ (left/right on keys and d-pad) */
.game-option { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 12px; min-height: 44px; padding: 0 10px; }
.game-option:is(:focus-visible, [aria-selected="true"]) { outline: none; background: color-mix(in srgb, var(--g-accent) 22%, transparent); box-shadow: inset var(--g-px) 0 0 var(--g-accent); }
.game-value { display: inline-flex; align-items: center; gap: 8px; min-width: 9em; justify-content: space-between; font-variant-numeric: tabular-nums; }
.game-value::before { content: "◀"; color: var(--g-dim); }
.game-value::after { content: "▶"; color: var(--g-dim); }
.game-meter { display: inline-grid; grid-auto-flow: column; gap: 2px; }
.game-meter > i { width: 6px; height: 12px; background: var(--g-dim); }
.game-meter > i[data-on] { background: var(--g-accent); }

/* HUD bits */
.game-minimap { width: 96px; height: 72px; background: var(--g-ink); box-shadow: 0 0 0 var(--g-px) var(--g-ink), inset 0 0 0 2px var(--g-dim); position: relative; overflow: hidden; }
.game-objective { font-size: 12px; line-height: 1.4; max-width: 220px; padding: 6px 8px; background: rgb(0 0 0 / 0.45); text-shadow: none; }
.game-combo { font-size: 28px; line-height: 1; color: var(--g-accent); }
.game-icon { display: inline-block; width: 12px; height: 12px; flex: none; background: currentColor; }
.game-icon[data-kind="heart"] { background: var(--g-bad); clip-path: polygon(0 25%, 25% 0, 50% 20%, 75% 0, 100% 25%, 100% 50%, 50% 100%, 0 50%); }
.game-icon[data-kind="coin"] { background: var(--g-accent); border-radius: 50%; box-shadow: inset -2px -2px 0 #0004; }
.game-icon[data-kind="star"] { background: var(--g-accent); clip-path: polygon(50% 0, 62% 35%, 100% 38%, 70% 60%, 80% 100%, 50% 78%, 20% 100%, 30% 60%, 0 38%, 38% 35%); }

/* Cards (trading card games) */
.game-hand { display: flex; justify-content: center; align-items: flex-end; padding: 0 16px; }
.game-hand > .game-card { margin: 0 -8px; transform: rotate(calc((var(--i, 0) - var(--mid, 0)) * 4deg)) translateY(calc(var(--d, 0) * 6px)); transform-origin: 50% 120%; }
.game-card { position: relative; width: calc(var(--g-px) * 22); height: calc(var(--g-px) * 31); background: var(--g-paper); color: var(--g-ink); box-shadow: 0 0 0 var(--g-px) var(--g-ink); padding: 6px; display: grid; grid-template-rows: auto 1fr auto; gap: 4px; font-size: 11px; line-height: 1.25; text-align: left; flex: none; }
.game-card > .game-art { background: var(--g-energy); box-shadow: inset 0 0 0 2px var(--g-ink); min-height: 30px; }
.game-card:is(:focus-visible, [aria-selected="true"]) { outline: none; z-index: 1; box-shadow: 0 0 0 var(--g-px) var(--g-accent), 0 0 0 calc(var(--g-px) * 2) var(--g-ink); }
.game-hand > .game-card[aria-selected="true"] { transform: translateY(-20px); }
.game-card[aria-disabled="true"] { filter: grayscale(1); opacity: 0.6; }
.game-cost { position: absolute; top: -8px; left: -8px; width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; background: var(--g-energy); color: var(--g-ink); box-shadow: 0 0 0 2px var(--g-ink); font-size: 12px; }
.game-pile { position: relative; width: calc(var(--g-px) * 22); height: calc(var(--g-px) * 31); background: var(--g-panel); box-shadow: 0 0 0 var(--g-px) var(--g-ink), 4px 4px 0 var(--g-ink), 8px 8px 0 var(--g-ink); display: grid; place-items: center; font-size: 12px; }
.game-hud :is(.game-key, .game-pad, .game-padpos, .game-mouse) { text-shadow: none; }
.game { grid-template: minmax(0, 1fr) / minmax(0, 1fr); }
/* Text straight over the world (title, results) gets an ink drop shadow so it reads on any scene */
.game-center { text-shadow: 2px 2px 0 var(--g-ink); }
.game-center .game-hint { color: var(--g-text); }
.game-btn:is(:focus-visible, [data-selected="true"], :hover), .game-btn[data-variant="solid"], .game-panel, :is(.game-key, .game-pad, .game-padpos, .game-mouse) { text-shadow: none; }
.game-list > li { flex-wrap: wrap; }
.game-list > li > span[style*="flex:1"] { min-width: 5em; }
.game-panel[data-tone="light"] :is(.game-btn, .game-line) { color: var(--g-ink); }
.game-panel[data-tone="light"] .game-btn:is(:focus-visible, [data-selected="true"], :hover) { background: var(--g-accent); }
.game-panel[data-tone="light"] .game-hint { color: color-mix(in srgb, var(--g-ink) 75%, var(--g-paper)); }

```

## States

| State | What changes |
| --- | --- |
| Keyboard | `data-device="keyboard"`: prompts show `.game-key` keycaps (Esc, Enter, WASD/arrows). |
| Mouse | `data-device="mouse"`: prompts show `.game-mouse` (`data-button="left|right|wheel"`) or the key when the action has no mouse button. Menus are clickable; the hover state is the focus state. |
| Gamepad | `data-device="gamepad"`: prompts show `.game-padpos` with `data-pos="south|east|west|north"` (the dot of that position filled). Never a console brand's letters or shapes. |
| Touch | `data-device="touch"`: prompts show the on-screen button's own label; TouchControls appears; every target 44 px or more. |
| Menu open | The world pauses (`setPaused(true)`), `setInputPreventDefault(false)`, focus is inside the menu. |
| Window loses focus | PauseMenu opens; nothing happens until the person comes back and chooses. |
| Japanese | `lang="ja"` on `<html>`: `--g-font-ja` replaces the Latin pixel font; longer labels wrap, never shrink below 12 px. |
| Reduced motion | No screen shake, flashes or animated UI (`prefers-reduced-motion`); also an option in GameSettings. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `game.name` | Meadow Quest | メドウ・クエスト |
| `game.confirm` | Confirm | 決定 |
| `game.back` | Back | 戻る |
| `game.paused_on_blur` | Paused while you were away | 離れている間、一時停止しました |
| `game.device.keyboard` | Keyboard | キーボード |
| `game.device.mouse` | Mouse | マウス |
| `game.device.gamepad` | Gamepad | ゲームパッド |
| `game.device.touch` | Touch | タッチ |
| `game.pad.south` | South button | 下ボタン |
| `game.pad.east` | East button | 右ボタン |
| `game.pad.west` | West button | 左ボタン |
| `game.pad.north` | North button | 上ボタン |

## Keyboard and focus

1. A screen opens with focus on its first button (or the one marked `autofocus`).
2. ↑ ↓ (and ← → in grids) move focus; Tab and Shift+Tab work too, staying inside the open screen.
3. Enter or Space confirms; Esc or Backspace goes back; Esc during play opens PauseMenu.
4. Gamepad: d-pad or left stick moves, south confirms, east goes back, start pauses.
5. When a screen closes, focus returns to the control that opened it.

## Phone

- The game fills the screen (`100dvh`); the HUD keeps clear of notches with `env(safe-area-inset-*)` (built into `.game-hud` and `.game-touch`).
- Landscape is the play orientation for action games; portrait for card, puzzle, idle and visual-novel games. Menus work in both.
- Sizes follow the box, not the window: `.game` is a size container, so `cqi`/`cqb` units scale titles with the game.
- Pixel art scales by whole numbers (`--g-px` = one art pixel; 4 px at 16 px sprites on a 1280-wide screen, 2 px on a phone).

## Data

```json
{"settings": {"v": 1, "lang": "ja", "music": 0.8, "sfx": 1, "reduceMotion": false, "bindings": {"jump": {"keyboard": "Space", "gamepad": 0}}},
 "device": "gamepad"}
```

- Settings live in `localStorage["<game-id>.settings"]`; saves in `localStorage["<game-id>.save.<slot>"]` (SaveSlots). `<game-id>` is the project folder name in kebab case.
- No server. Everything works offline once loaded.

## Don't

- Don't draw text, menus or buttons on the canvas: put them in `.game-layer` so focus, screen readers and Japanese work.
- Don't load fonts or scripts from a CDN: vendor the pixel fonts (both OFL) into `fonts/` with their licences, or use the fallbacks.
- Don't name gamepad buttons A/B/X/Y or by shapes: name them by position.
- Don't keep the game running behind an open menu.
