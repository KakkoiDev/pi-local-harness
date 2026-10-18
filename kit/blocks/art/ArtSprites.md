# ArtSprites

App Block card (Art). How generated sprites are built: the size grid, outlines, shading from one light, animation frames and characters made of named parts.

- Used by: visual-core sprite recipes, every Games card
- Needs: a palette (ArtPalettes)
- Links to: ArtPalettes, ArtFrames, ArtReferenceSet

## Rules
**Sizes.** One size per game for its characters, chosen once:

(Size | For | Scale on screen)
- 16 × 16: Tiles, items, icons, small characters (top-down RPG, roguelike, platformer, shooter enemies) | 3× or 4× (`--g-px: 4px`)
- 32 × 32: Characters in close-up games (tactics, brawlers), large enemies, portraits in dialogue | 2× or 3×
- 64 × 64: Bosses, big portraits, title art | 1× or 2×

- The world is on a **16 px grid**: tiles are 16, characters stand on the grid line, a 32 sprite covers 2 × 2 cells.
- Scale by **whole numbers only**, nearest neighbour (`image-rendering: pixelated`; LittleJS `tileFixBleedScale` default). Never draw a 16 sprite at 2.5×.
- **Never upscale** a 16 sprite to make a 32 one: redraw it with the same parts at the bigger size.

**Outline.** 1 art pixel, always.
- `full`: every edge in ink (`k`). The default for 16 px and anything that must read on a busy ground.
- `selective`: top and left edges take the shade of the colour they touch (leaf → moss, poppy → brick), bottom and right stay ink. Use it for 32 and 64 px, where a full ink line looks heavy.
- Inner lines (between arm and body) use the shade, not ink.

**Shading.** One light, from the **top-left**.
- 2 steps at 16 px (base, shade), 3 at 32 and 64 (light, base, shade). The light step is the palette's light key of that hue, the shade its shade key.
- Shade runs along the bottom and right of each form; light only on the top-left of round forms (heads, slimes, potions).
- No pillow shading (dark rim all around, light in the middle). No dithering below 32 px; at 32+ a 2 × 2 checker is allowed only on large flat areas (sky, walls).

**Animation.** Frames are whole sprites of the same size, same origin (feet at the bottom centre).

(Action | Frames | Timing | Notes)
- idle: 2 | 500 ms each | body 1 px down on frame 2 (breath); feet still
- walk: 4 | 120 ms each | contact, pass, contact (other leg), pass; a 1 px bob on pass
- attack: 3 | 80 · 60 · 140 ms | wind-up, strike (the weapon's longest), recover
- hurt: 2 | 80 · 160 ms | a white flash (all keys → `w`), then normal with 2 px knockback; 600 ms of blinking invulnerability after
- die: 4 | 100 ms each | flash, squash, two fade frames by removing every other pixel; no blood

**Characters from named parts.** A character is drawn back to front from parts, each part a small grid with its own keys:

(Part | Variants (names the recipe uses))
- `body`: `small`, `medium`, `large` (the silhouette and legs)
- `skin`: a key swap: `s` → one of the palette's skin keys (`s`, `o`, `n`)
- `hair`: `short`, `long`, `tied`, `none`, `hood`; colour by key (`n`, `y`, `k`, `R`)
- `outfit`: `tunic`, `robe`, `armour`, `overalls`; colour by key pair (`r/R`, `b/B`, `g/G`, `y/o`)
- `held`: `none`, `sword`, `staff`, `bow`, `tool`, `book` (drawn in front on frames that show it)
- `face`: `calm`, `happy`, `angry`, `hurt` (2–3 pixels; eyes always 1 × 1 ink at 16 px)

Monsters use `body` (`blob`, `beast`, `flyer`, `knight`), `eyes` (`dots`, `one`, `slits`), `colour` (a key pair) and `extra` (`horns`, `wings`, `crown`).

## Recipe fields
```json
{"kind": "character", "size": 16, "palette": "meadow", "outline": "full",
 "parts": {"body": "medium", "skin": "s", "hair": {"style": "short", "key": "n"},
           "outfit": {"style": "tunic", "keys": ["r", "R"]}, "held": "sword", "face": "calm"},
 "frames": {"idle": 2, "walk": 4, "attack": 3, "hurt": 2},
 "variants": [{"name": "blue", "swap": {"r": "b", "R": "B"}}],
 "seed": 4127}
```

- `size`: 16, 32 or 64. `outline`: `full` or `selective`. `frames`: which actions to render (counts as in the table; other counts are refused).
- `variants`: palette swaps that make new sheets from the same parts; the sheet's frames and IDs stay the same.
- `seed`: picks among equal choices (hair tufts, monster spots); the same seed draws the same sprite.
- Output: one sheet PNG (rows = actions, columns = frames) and a manifest with each frame's rectangle; games read rectangles from the manifest, never assume order.

## Examples
- Hero for a top-down RPG: `size 16`, `outline full`, frames idle/walk/attack/hurt, variants red and blue.
- Boss slime: `kind monster`, `size 64`, `body blob`, `eyes one`, `extra crown`, `outline selective`.
- Shopkeeper portrait for DialogueBox: `size 32`, `parts.face` happy and calm, idle only.

## Don't
- Don't anti-alias, blur, rotate by odd angles or scale by fractions.
- Don't give a 16 px character more than 3 colours per part (plus ink).
- Don't add frames by interpolating: every frame is drawn from parts.
- Don't draw known characters or mascots, even as “inspired by”.

## Pi Workbench
