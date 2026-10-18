# ArtPalettes

App Block card (Art). The named palettes every generated sprite, tile, icon and game UI draws from, so a whole game agrees on its colours.

- Used by: visual-core recipes (`palette`), the game kit (`.game` CSS variables), every Games card
- Needs: nothing: palettes are data
- Links to: ArtSprites, ArtFrames, ArtReferenceSet, GameKit

## Rules
- A game uses **one palette** for its world and UI. A second palette is allowed only for a place that must feel foreign (a dream, the underworld), and only for its tiles.
- Every colour has a **one-letter key**. Recipes and pixel grids use the keys, never hex, so a palette swap recolours everything at once.
- **Ink is the outline and the text** on light panels; it is the darkest colour, never pure black unless the palette says so (Arcade).
- **UI roles are fixed** per palette (table below): the game kit reads them as `--g-ink`, `--g-paper`, `--g-panel`, `--g-text`, `--g-dim`, `--g-accent`, `--g-good`, `--g-bad`, `--g-energy`. Meadow's values are exactly the game kit defaults.
- Ramps: each hue has a **light → base → shade** step at most (leaf `l → g → G`); the shade is the next darker colour of the same hue, never ink.
- Meaning never by hue alone: health also has a heart icon, danger also flashes or shakes; good (green) and bad (red) also differ in lightness.
- A sprite drawn in a palette that lacks one of its keys uses the palette's **fallback** (Arcade has no skin key: `s → n`; Ink maps every hue to a grey). Fallbacks: Meadow `Q→d`; Dusk `l→w`; Arcade `s→n, B→p, l→g, o→n`; Ink `r,o,b→d · R,G,B,n,p→q · l,y,s→w · g→d`.
- Picking: **Meadow** for daylight and anything cozy; **Dusk** for night, dungeons, space, roguelikes; **Arcade** for shooters, arcade classics, racing and puzzles; **Ink** for visual novels, card games and menu-first games. When unsure, Meadow.

### Meadow (`meadow`, 16 colours)

Daylight worlds: RPG towns and fields, cozy farms, platformers. The game kit’s default.

(Key | Hex | Name | Role)
- `k`: `#1b1c2b` | Ink | Outlines, text on light panels (--g-ink)
- `p`: `#2b2d42` | Night panel | Dark panel fill (--g-panel)
- `q`: `#4a4e69` | Slate | Shade of panels and stone
- `d`: `#9aa0b8` | Mist | Secondary text, disabled (--g-dim)
- `w`: `#f4efe1` | Paper | Light panels, highlights, text on dark (--g-paper, --g-text)
- `y`: `#f2b33d` | Gold | Focus, selection, coins (--g-accent)
- `o`: `#c27c2c` | Amber | Shade of gold, wood light
- `r`: `#e05a47` | Poppy | Damage, danger, hearts (--g-bad)
- `R`: `#9e3a3a` | Brick | Shade of poppy
- `g`: `#5bb85d` | Leaf | Health, success, grass (--g-good)
- `G`: `#3a7d44` | Moss | Shade of leaf
- `l`: `#a7d86d` | Sprout | Light of leaf
- `b`: `#4aa3df` | Sky | Mana, energy, water (--g-energy)
- `B`: `#2f6a9e` | Deep water | Shade of sky, cloth
- `s`: `#f0b48a` | Peach | Skin light
- `n`: `#7a5236` | Bark | Hair, wood, soil

### Dusk (`dusk`, 16 colours)

Night, dungeons, space, roguelikes. Glows read well on its dark ground.

(Key | Hex | Name | Role)
- `k`: `#0f0e17` | Void | Outlines, the ground of space (--g-ink)
- `p`: `#241e3a` | Plum night | Dark panel fill (--g-panel)
- `q`: `#3d3363` | Violet stone | Shade, walls
- `Q`: `#6c5f9e` | Lavender | Light stone, rims
- `d`: `#a99ad6` | Haze | Secondary text (--g-dim)
- `w`: `#f5ecff` | Starlight | Text, highlights (--g-text, --g-paper)
- `y`: `#ffb86b` | Lantern | Focus, selection, fire (--g-accent)
- `o`: `#c9743e` | Ember | Shade of lantern
- `r`: `#ff5c7a` | Rose | Damage, danger (--g-bad)
- `R`: `#a3324f` | Wine | Shade of rose
- `g`: `#5ee6b0` | Mint | Health, success (--g-good)
- `G`: `#2f9e7d` | Teal | Shade of mint
- `b`: `#59c3ff` | Neon sky | Energy, shields (--g-energy)
- `B`: `#2f6fb8` | Cobalt | Shade of neon sky
- `s`: `#e8b4a0` | Dusk skin | Skin light
- `n`: `#6b4a3a` | Umber | Hair, wood

### Arcade (`arcade`, 12 colours)

Shooters, arcade classics, puzzles, racing: saturated, high contrast, few shades.

(Key | Hex | Name | Role)
- `k`: `#0b0b12` | Black | Ground, outlines (--g-ink)
- `p`: `#1f2a5c` | Navy | Panel fill (--g-panel)
- `q`: `#5a5560` | Gunmetal | Shade, metal
- `d`: `#c5c7cf` | Silver | Secondary text (--g-dim)
- `w`: `#fbf5ea` | White | Text, highlights (--g-text, --g-paper)
- `y`: `#ffae1a` | Amber | Focus, score, coins (--g-accent)
- `r`: `#ff3b5c` | Red | Danger, enemies (--g-bad)
- `R`: `#7a2a6b` | Grape | Shade of red, enemy dark
- `g`: `#2ee66b` | Green | Health, go (--g-good)
- `G`: `#0f8a5f` | Pine | Shade of green
- `b`: `#3aa8ff` | Cyan | Player, shields (--g-energy)
- `n`: `#a8552f` | Rust | Warm shade, ground

### Ink (`ink`, 4 colours)

Visual novels, card games, menus-first and print-like games: four greys, art carried by line.

(Key | Hex | Name | Role)
- `k`: `#111111` | Ink | Lines, text (--g-ink)
- `q`: `#3d3d3d` | Graphite | Shade, panel fill (--g-panel)
- `d`: `#aaaaaa` | Pencil | Secondary text, light shade (--g-dim)
- `w`: `#f2f2ec` | Paper | Ground, text on panels (--g-paper, --g-text)

### Contrast of the UI roles (WCAG ratio)

(Palette | Text on panel | Dim on panel | Ink on paper | Ink on accent | Ink on bad)
- Meadow: 11.7 | 5.2 | 14.7 | 9.1 | 4.6
- Dusk: 13.9 | 6.3 | 16.7 | 11.2 | 6.4
- Arcade: 12.5 | 8.1 | 18.1 | 10.6 | 5.6
- Ink: 9.7 | 4.7 | 16.8 | 16.8 | 1.0

All text pairs pass 4.5 : 1. Ink has no colour for good or bad: there, state is carried by icons and words only (its “bad” is ink itself, so never colour a word red in Ink).

## Recipe fields
```json
{"palette": "meadow",
 "swap": {"r": "b", "R": "B"},
 "ui": {"--g-accent": "y"}}
```

- `palette`: one of `meadow`, `dusk`, `arcade`, `ink`.
- `swap`: key → key, applied to one sprite (a blue variant of the red hero). Only keys of the same palette.
- `ui`: optional override of one UI role by key (a game whose accent is leaf green: `{"--g-accent": "g"}`). Keep text pairs ≥ 4.5 : 1; the generator checks and refuses otherwise.

## Examples
- A farming game: `{"palette": "meadow"}`; crops ripen `G → g → l`; coins and selection gold.
- A space shooter: `{"palette": "arcade"}`; the player cyan, enemies red and grape, score amber.
- A dungeon run: `{"palette": "dusk"}`; torches lantern, walls violet stone, potions rose.
- A visual novel: `{"palette": "ink"}` for the UI, illustrations line-only.
- In CSS: `<div class="game" style="--g-panel: #241e3a; --g-accent: #ffb86b; …">` (copy all nine roles from the palette's table).

## Don't
- Don't add colours to a palette or pick hex values by eye: choose another palette or swap keys.
- Don't use pure #000 or #fff in Meadow or Dusk (they read as holes in the art).
- Don't use gradients, transparency ramps or anti-aliased edges inside sprites: one key per pixel.
- Don't reuse a known game's palette; these four are the kit's own.

## Pi Workbench
