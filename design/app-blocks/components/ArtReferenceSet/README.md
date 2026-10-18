# ArtReferenceSet

The target set the generators aim at: a hero, a monster, an item, a tile, an icon and a button, each in the pixel style and in the vector style.

| | |
| --- | --- |
| Group | Art |
| Used by | visual-core generator checks (a new recipe's output is compared with these by eye and by its palette and size) |
| Needs | ArtPalettes (Meadow), ArtSprites, ArtFrames |
| Links to | every Games card |

## Rules

| Thing | Pixel | Vector |
| --- | --- | --- |
| Hero | 16 × 16, full outline, parts `body medium · hair short n · outfit tunic r/R · held none · face calm` | 48 × 48 viewBox, stroke 2, head circle r 9, body a 4 px-radius rect, the same keys as fills |
| Monster | 16 × 16 `blob · eyes dots · colour g/G · light l` | blob path, two dot eyes, a highlight arc top-left |
| Item | potion 16 × 16, glass `w`, liquid `r/R`, cork `n` | flask path, liquid fill `r`, a level line |
| Tile | grass 16 × 16, seamless (tiles 3 × 3 without a visible edge), tufts `G` and `l` on less than 15 % of pixels | 48 × 48 square fill `g`, 3 tuft strokes in `G`, seamless at the edges |
| Icon | heart 16 × 16, 2 shading steps and a 2-pixel shine | heart path in a 24 grid, stroke 2 |
| Button | 9-slice `button9`, label in the game font | radius 6, stroke 2, hard shadow 0 4px |

- Everything uses **Meadow** keys; the Dusk column shows the same art through a palette swap, unchanged otherwise.
- A generator passes when: the palette is respected (no other colours), the size and outline match, the silhouette reads at 1× on both a light and a dark ground, and a tile repeats without a seam.

## Recipe fields

```json
{"kind": "character", "size": 16, "palette": "meadow", "outline": "full", "parts": {"body": "medium", "hair": {"style": "short", "key": "n"}, "outfit": {"style": "tunic", "keys": ["r", "R"]}, "face": "calm"}}
{"kind": "monster", "size": 16, "palette": "meadow", "parts": {"body": "blob", "eyes": "dots", "colour": ["g", "G"], "light": "l"}}
{"kind": "item", "size": 16, "name": "potion", "keys": {"glass": "w", "liquid": ["r", "R"], "cork": "n"}}
{"kind": "tile", "size": 16, "terrain": "grass", "detail": "low", "seamless": true}
{"kind": "icon", "style": "pixel", "size": 16, "name": "heart"}
{"kind": "button", "style": "vector", "label_key": "menu.start"}
```

The tile recipe is a static tile; whole terrains (meadow, coast, dungeon with Blob 47 joins) come from visual-core's terrain generator, which follows the same palette and sizes.

## Examples

- Checking a new hero recipe: render it next to this card's hero at 1× and 4× on paper and on night panel; the outline, size and number of colours must match.
- A red slime variant: the monster with `swap {"g": "r", "G": "R", "l": "y"}`.

## Don't

- Don't trace or imitate a known game's sprites for the targets.
- Don't add detail the size can't carry (fingers, buttons on a 16 px tunic).
- Don't change the targets without updating ArtSprites and ArtFrames.
