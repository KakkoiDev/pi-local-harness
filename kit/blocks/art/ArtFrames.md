# ArtFrames

App Block card (Art). How UI frames, buttons and icons look in the pixel style and in the vector (SVG) style, so menus match the world they sit on.

- Used by: the game kit (`game-panel`, `game-btn`), visual-core icon and frame recipes, every Games card
- Needs: a palette (ArtPalettes)
- Links to: ArtPalettes, ArtSprites, ArtReferenceSet, GameKit

## Rules
**Choose one style per game.** Pixel for games whose world is pixel art (most); vector for card games, visual novels, puzzles and idle games whose art is flat illustration. Apps never use either: apps are Basecoat.

**Pixel frames (9-slice).**
- Source: a 12 × 12 grid, corners 4 × 4, edges 4 px thick, stretched only along the edges, the centre filled. Draw at the game's scale (`--g-px`).
- Layers from outside in: 1 px ink outline with **cut corners** (the corner pixel empty), 1 px light edge on top and left (`w`), 1 px shade edge on bottom and right (`d` or the panel's shade), then the fill. Exactly the look of `.game-panel` in CSS (outer ink ring, inner light ring, a 2 px hard drop shadow).
- Panels are `p` (dark) by default; `w` (light, `data-tone="light"`) for paper things: letters, shop price tags, cards.
- No rounded corners beyond the cut pixel, no blur, no gradient, no transparency except the 62 % overlay behind pause screens.

**Pixel buttons.** Same 9-slice, filled with the accent (`y`) and its shade (`o`) on the bottom 2 px. States: normal; focus/hover = 1 px white rim inside the outline and the ▶ marker; pressed = shift down 1 px and drop the bottom shade; disabled = fill `q`, text `d`. Minimum 44 px tall on screen.

**Pixel icons.** 16 × 16 grid (12 × 12 drawn, 2 px margin), full ink outline, 2 shading steps, light top-left. Icons for the HUD at 2× or 3×. One idea per icon: heart, coin, potion, key, star, gear, map, bag, sword, shield.

**Vector frames.** For SVG and CSS-drawn UI:
- Stroke **2 px** in ink at 1×, corner radius **4 px** (cards 8 px), a hard offset shadow `0 4px 0` in ink, no blur. Fills from the palette, no gradients.
- Buttons: radius 6 px, 2 px ink stroke, label in the game font; pressed moves 2 px down and the shadow shrinks to `0 2px 0`.

**Vector icons.** 24 × 24 viewBox, drawn inside 20 × 20 (2 px margin), **stroke 2**, round caps and joins, one fill colour at most plus ink. At 16 × 16 use stroke 1.5. Optical size: circles 1 px larger than squares.

**Text in frames.** The game font (`--g-font`; Japanese `--g-font-ja`), uppercase for English labels in menus, normal case for sentences and all Japanese. Padding: 3 art pixels (12 px at 4×).

## Recipe fields
```json
{"kind": "frame", "style": "pixel", "palette": "meadow", "slice": 4, "fill": "p", "edge": {"light": "w", "shade": "d"}, "outline": "k", "corner": "cut"}
{"kind": "button", "style": "pixel", "palette": "meadow", "fill": ["y", "o"], "states": ["normal", "focus", "pressed", "disabled"]}
{"kind": "icon", "style": "vector", "palette": "dusk", "grid": 24, "stroke": 2, "name": "potion", "fill": "r"}
```

- `style`: `pixel` or `vector`. `slice`: the corner size in source pixels (4). `corner`: `cut` (pixel) or a radius in px (vector).
- `states` renders one image per state into the sheet; the manifest names each rectangle.
- Icons take a `name` from the icon set (heart, coin, potion, key, star, gear, map, bag, sword, shield, clock, lock); new names need a drawn recipe, not a guess.

## Examples
- A dark pixel dialogue box: `{"kind":"frame","style":"pixel","fill":"p"}`, used by DialogueBox at 4×.
- A shop price tag: `{"kind":"frame","style":"pixel","fill":"w"}` (light tone, ink text).
- Vector card frame for a card game: radius 8, stroke 2, fill `w`, art window radius 4.

## Don't
- Don't mix pixel and vector frames on one screen.
- Don't round pixel corners with more than the single cut pixel, or scale a 9-slice corner.
- Don't use emoji or a font's symbols as icons in a game: draw them from the icon set.

## Pi Workbench
