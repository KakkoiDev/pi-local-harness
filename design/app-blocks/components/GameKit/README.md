# GameKit

The game layer: HTML menus, HUD and prompts over a gaming-core (LittleJS) canvas, with the input device in use deciding every prompt.

| | |
| --- | --- |
| Group | Game blocks |
| Basecoat | none inside the game (the kit's own `game-*` classes); Basecoat only on pages around it (settings outside the game, About) |
| Route | `index.html` (the game is the page) |
| Needs | LittleJS 1.27.0 as gaming-core scaffolds it (classic scripts, `engineInit`); gaming-core's input layer `starters/input.js` (`gcInput`) with `padStyle: 'position'` and `fixed` (see "The input layer"); `styles/game.css` (below), `js/input.js` and `js/menu.js` (below); the two pixel fonts in `static/fonts/` and `static/fonts.css` (see "Fonts"); `messages/en.json`, `messages/ja.json` |
| Used in | every Game block (TitleScreen … TouchControls) and every genre card (GameRpg … GameTactics) |

## Markup

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title data-t="game.name">Meadow Quest</title>
<link rel="stylesheet" href="static/fonts.css">
<link rel="stylesheet" href="styles/game.css">
</head>
<body class="game-page">
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
  <script src="js/gc-input.js"></script><!-- gaming-core starters/input.js, copied as is -->
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

`js/input.js`: the game's actions on top of gaming-core's, the device in use written on `.game` as `data-device` (so only its prompts show), and the prompt for an action in the page's language:

```js
// Actions: gaming-core's own (moveX/moveY axes, jump, fire, confirm, back, pause) plus the genre's, declared once here.
// Every genre card lists its actions; the primary action is always `fire` (its label says Attack, Shoot or Use).
const GAME_ID = document.documentElement.dataset.gameId || 'meadow-quest';
const GAME_ACTIONS = {
  interact: ['key:KeyE', 'pad:3'],                  // genre additions: [binding strings]
  map:      ['key:KeyM', 'pad:8'],
};
function inputInit() {                              // call from gameInit()
  gcInput.init({ storageKey: GAME_ID + '.input', padStyle: 'position', fixed: ['pause', 'back'], actions: GAME_ACTIONS });
}

// keyboard | mouse | gamepad from gaming-core; touch from pointer events (LittleJS reports a tap as the mouse)
const gameBox = document.getElementById('game');
let touching = false;
addEventListener('pointerdown', (e) => { touching = e.pointerType === 'touch'; if (touching) gameBox.dataset.device = 'touch'; }, true);
function inputUpdate() {                            // call first in gameUpdate(); returns gaming-core's snapshot
  const input = gcInput.update();
  if (!(touching && input.device === 'mouse')) gameBox.dataset.device = input.device;
  if (input.device !== 'mouse') touching = false;
  const t = touchState.pressed;                     // TouchControls: its buttons press the same actions
  for (const name in t) { input.pressed[name] ||= t[name]; input.held[name] ||= touchState.held[name]; }
  if (touchState.move) { input.moveX ||= touchState.move.x; input.moveY ||= touchState.move.y; }
  touchState.pressed = {};
  return input;
}
const touchState = { pressed: {}, held: {}, move: null };   // filled by TouchControls' pointer handlers

// The prompt for an action on the device in use, as HTML, in the page's language (t = the game's text lookup)
const PAD = ['south', 'east', 'west', 'north', 'left_shoulder', 'right_shoulder', 'left_trigger', 'right_trigger',
  'select', 'start', 'left_stick', 'right_stick', 'dpad_up', 'dpad_down', 'dpad_left', 'dpad_right', 'home'];
function promptHTML(action, device = gameBox.dataset.device) {
  const binding = gcInput.binding(action, device === 'touch' ? 'mouse' : device);  // 'key:Space' | 'mouse:0' | 'pad:0' | ''
  const [kind, code] = binding.split(':');
  if (kind === 'pad') {
    const pos = PAD[+code];
    return +code < 4
      ? `<span class="game-padpos" data-pos="${pos}" aria-label="${t('game.pad.' + pos)}"></span>`
      : `<span class="game-padkey">${t('game.pad.' + pos + '.short')}</span>`;
  }
  if (kind === 'mouse') return `<span class="game-mouse" data-button="${['left', 'middle', 'right'][+code] || 'left'}" aria-label="${t('game.mouse.' + (['left', 'middle', 'right'][+code] || 'left'))}"></span>`;
  if (kind === 'key') return `<span class="game-key">${gcInputCore.label(binding)}</span>`;
  return '';
}
```

`js/menu.js`: one focus model for every menu. Arrow keys, the d-pad and the left stick move focus between `.game-btn`, `.game-option`, `.game-slot`, `.game-card` and `[role=tab]` in the open screen; confirm and back are gaming-core's `confirm` and `back` actions (back is fixed, so it is always the same button):

```js
function openScreen(el) {                 // show one screen, remember focus, stop the world for menus
  for (const s of document.querySelectorAll('#ui > section')) s.hidden = s !== el;
  setInputPreventDefault(false);          // let keys reach the HTML buttons
  (el.querySelector('[autofocus]') || el.querySelector('button, [tabindex="0"]'))?.focus();
}
function closeScreen(el, back) { el.hidden = true; setInputPreventDefault(true); back?.focus(); }
function menuUpdate(input) {              // call from gameUpdate() while a menu is open, with inputUpdate()'s snapshot
  if (input.device !== 'gamepad') return; // keys and clicks already reach the focused HTML button
  const pad = (b) => gamepadWasPressed(b);
  const move = pad(12) || pad(14) ? -1 : pad(13) || pad(15) ? 1 : 0;   // d-pad: menus always move with it
  if (move) moveFocus(move);
  if (input.pressed.confirm) document.activeElement?.click();
  if (input.pressed.back) document.activeElement?.closest('section')?.dispatchEvent(new CustomEvent('game:back'));
}
function moveFocus(step) {
  const items = [...document.activeElement.closest('section').querySelectorAll('.game-btn:not(:disabled), .game-option, .game-slot, .game-card, [role=tab], .game-list > li[tabindex]')];
  const i = items.indexOf(document.activeElement);
  items[(i + step + items.length) % items.length]?.focus();
}
addEventListener('blur', () => { if (!paused) openPause(); });      // pausing on blur
document.addEventListener('visibilitychange', () => { if (document.hidden && !paused) openPause(); });
```

### The input layer (gaming-core)

**Requires gaming-core with `padStyle: 'position'` and fixed actions (pull request to KakkoiDev/gaming-core, not merged yet).** Until it is merged, a game uses `starters/input.js` from that pull request. The cards assume exactly this:

| API | What it does | In gaming-core today (PR #1) |
| --- | --- | --- |
| `gcInput.init({storageKey, padStyle, fixed, actions, axes})` | Defaults plus the game's actions; loads saved bindings | yes, except `fixed` |
| `padStyle: 'position'` (the default) | Button names by position: south, east, west, north, left shoulder, right shoulder, left trigger, right trigger, select, start, left stick, right stick, d-pad up/down/left/right, home (`GC_INPUT_PAD_NAMES.position`) | **to add**; today `'xbox'` (default) and `'playstation'` |
| `fixed: ['pause', 'back']` | `gcInput.bind()` returns `false` for these names and `reset()` keeps them | **to add** |
| `gcInput.binding(name, device)` | The first binding string of an action or axis for a device (`'pad:0'`), what `prompt()` labels | **to add** (the `first()` inside `gcInputCore.prompt`, exposed) |
| `gcInput.update()` → `{moveX, moveY, held, pressed, released, device, gamepad, mouse}` | One snapshot per frame | yes |
| `gcInput.bind(name, list)`, `save()`, `load()`, `reset()`, `lastBinding` | Rebinding (ControlsRemap) | yes |
| `gcInputCore.label('key:KeyW')` → `'W'` | A key's printed name | yes |
| `gcInput.prompt(name)` | Words for an action on the device in use (`'south'` with `position`) | yes (brand names today) |

Bindings are gaming-core's strings: `'key:<KeyboardEvent.code>'`, `'mouse:<0 left|1 middle|2 right>'`, `'pad:<standard button 0–16>'`; axes `moveX`/`moveY` take `negative` and `positive` lists and `stick: 'left.x'`. The game never reads `keyWasPressed('Space')`: it reads `input.pressed.jump`. On screen, gamepad buttons are positions, never a brand's letters or shapes; the four face buttons are `.game-padpos[data-pos]`, the rest a `.game-padkey` with the position's short name.

### Fonts

The pixel fonts live in the project, never on a CDN: **Silkscreen** (400, 700) and **DotGothic16** (400), both OFL, at `static/fonts/<family>/` exactly as the workbench's theme panel stores a Google font (`harness/theme_fonts.py`): the woff2 files `<weight>-<nnn>.woff2` (one per subset Google serves; DotGothic16 has many Japanese subsets), the licence `OFL.txt`, and `font-face.css` with one `@font-face` per file whose `src` is relative to `static/`. A game links **`static/fonts.css`**, the two `font-face.css` files joined (their paths stay right because both files sit in `static/`); Project Start writes it when it fetches the fonts with the person's yes. A line in it looks like (written by the harness, not copied from here): `@font-face { font-family: "Silkscreen"; font-style: normal; font-weight: 400; font-display: swap; src: url("fonts/Silkscreen/400-000.woff2") format("woff2"); unicode-range: U+0000-00FF, U+0131, U+0152-0153; }`

`styles/game.css` then names the families (`--g-font`, `--g-font-ja`, with system fallbacks if the files are missing). The catalogue's previews load the two fonts from Google Fonts; that is for the catalogue only.

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

/* Round 13: the page behind the game and the dimmed scrim behind a game-over screen are roles too, never a colour in the markup */
.game { --g-backdrop: #000; --g-scrim: rgb(10 10 20 / 0.7); }
.game-page { margin: 0; background: #000; }
.game-scrim { background: var(--g-scrim); }
/* Gamepad buttons other than the four face buttons: a keycap with the position's short name (LB/RB are brands; these are positions) */
.game-padkey { display: inline-grid; place-items: center; min-width: 1.6em; height: 1.6em; padding: 0 0.35em; font-size: 0.75em; line-height: 1; color: var(--g-ink); background: var(--g-paper); border-radius: 0.5em; box-shadow: 0 0 0 2px var(--g-ink); text-shadow: none; }
```

## States

| State | What changes |
| --- | --- |
| Keyboard | `data-device="keyboard"`: prompts show `.game-key` keycaps (Esc, Enter, WASD/arrows). |
| Mouse | `data-device="mouse"`: prompts show `.game-mouse` (`data-button="left|right|wheel"`) or the key when the action has no mouse button. Menus are clickable; the hover state is the focus state. |
| Gamepad | `data-device="gamepad"`: prompts come from `promptHTML(action)`: `.game-padpos` with `data-pos="south|east|west|north"` (the dot of that position filled) for face buttons, `.game-padkey` with the position's short name for the others (LS, RS, LT, RT, Select, Start). Never a console brand's letters or shapes. |
| Touch | `data-device="touch"` (from pointer events; gaming-core reports a tap as the mouse): prompts show the on-screen button's own label; TouchControls appears and its buttons press the same actions (`touchState`, merged in `inputUpdate()`); every target 44 px or more. |
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
| `game.pad.left_shoulder` | Left shoulder | 左ショルダー |
| `game.pad.left_shoulder.short` | LS | L |
| `game.pad.right_shoulder` | Right shoulder | 右ショルダー |
| `game.pad.right_shoulder.short` | RS | R |
| `game.pad.left_trigger` | Left trigger | 左トリガー |
| `game.pad.left_trigger.short` | LT | LT |
| `game.pad.right_trigger` | Right trigger | 右トリガー |
| `game.pad.right_trigger.short` | RT | RT |
| `game.pad.select` | Select button | セレクトボタン |
| `game.pad.select.short` | Select | セレクト |
| `game.pad.start` | Start button | スタートボタン |
| `game.pad.start.short` | Start | スタート |
| `game.pad.left_stick` | Left stick (press) | 左スティック押し込み |
| `game.pad.left_stick.short` | L3 | L3 |
| `game.pad.right_stick` | Right stick (press) | 右スティック押し込み |
| `game.pad.right_stick.short` | R3 | R3 |
| `game.pad.dpad_up.short` | ↑ | ↑ |
| `game.pad.dpad_down.short` | ↓ | ↓ |
| `game.pad.dpad_left.short` | ← | ← |
| `game.pad.dpad_right.short` | → | → |
| `game.pad.home.short` | Home | ホーム |
| `game.mouse.left` | Left click | 左クリック |
| `game.mouse.middle` | Middle click | ホイールクリック |
| `game.mouse.right` | Right click | 右クリック |

## Keyboard and focus

1. A screen opens with focus on its first button (or the one marked `autofocus`).
2. ↑ ↓ (and ← → in grids) move focus; Tab and Shift+Tab work too, staying inside the open screen.
3. Enter or Space confirms; Esc or Backspace goes back; Esc during play opens PauseMenu.
4. Gamepad: d-pad or left stick moves, south confirms (`confirm`), east goes back (`back`, fixed), start pauses (`pause`, fixed).
5. When a screen closes, focus returns to the control that opened it.

## Phone

- The game fills the screen (`100dvh`); the HUD keeps clear of notches with `env(safe-area-inset-*)` (built into `.game-hud` and `.game-touch`).
- Landscape is the play orientation for action games; portrait for card, puzzle, idle and visual-novel games. Menus work in both.
- Sizes follow the box, not the window: `.game` is a size container, so `cqi`/`cqb` units scale titles with the game.
- Pixel art scales by whole numbers (`--g-px` = one art pixel; 4 px at 16 px sprites on a 1280-wide screen, 2 px on a phone).

## Data

```json
{"settings": {"v": 1, "lang": "ja", "music": 0.8, "sfx": 1, "reduceMotion": false},
 "input": {"version": 1,
   "actions": {"jump": ["key:Space", "key:KeyZ", "pad:0"], "fire": ["key:KeyX", "key:KeyJ", "mouse:0", "pad:2", "pad:7"],
               "confirm": ["key:Enter", "key:Space", "mouse:0", "pad:0"], "back": ["key:Escape", "key:Backspace", "mouse:2", "pad:1"],
               "pause": ["key:Escape", "key:KeyP", "pad:9"], "interact": ["key:KeyE", "pad:3"], "map": ["key:KeyM", "pad:8"]},
   "axes": {"moveX": {"negative": ["key:ArrowLeft", "key:KeyA", "pad:14"], "positive": ["key:ArrowRight", "key:KeyD", "pad:15"], "stick": "left.x"},
            "moveY": {"negative": ["key:ArrowDown", "key:KeyS", "pad:13"], "positive": ["key:ArrowUp", "key:KeyW", "pad:12"], "stick": "left.y"}}},
 "device": "gamepad"}
```

- Settings live in `localStorage["<game-id>.settings"]`; bindings are gaming-core's, saved by `gcInput.save()` (LittleJS `writeSaveData`) under `<game-id>.input`; saves in `localStorage["<game-id>.save.<slot>"]` (SaveSlots). `<game-id>` is the project folder name in kebab case.
- No server. Everything works offline once loaded.

## Don't

- Don't draw text, menus or buttons on the canvas: put them in `.game-layer` so focus, screen readers and Japanese work.
- Don't load fonts or scripts from a CDN: the pixel fonts (both OFL) live in `static/fonts/<family>/` with their licences, linked through `static/fonts.css`; without them the fallbacks show.
- Don't name gamepad buttons A/B/X/Y or by shapes: name them by position (`padStyle: 'position'`).
- Don't keep a second bindings format: read and write bindings only through `gcInput`.
- Don't keep the game running behind an open menu.
