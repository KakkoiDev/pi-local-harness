# MapScreen

App Block card (Game blocks). The full map of the world or the current area: where the player is, places found, the tracked quest, a legend, and travel to places already visited.

- Basecoat: none (game kit: `game-overlay`, `game-panel`, `game-list`; the map itself is a `<canvas>` drawn from the level data)
- Needs: GameKit; the level's tile map (visual-core terrain export: manifest rectangles); the visited mask (Data); QuestLog (tracked quest)
- Links to: HudPieces (the minimap is the same drawing, smaller), QuestLog

## Markup
Copy, never retype: `{harness}/kit/blocks/game-blocks/MapScreen.html` (19 lines of HTML).

Draw the map at 1 canvas pixel per tile from the same data as the world, using the palette: ground, paths, water, buildings; unvisited tiles in `--g-ink` (fog). Markers are drawn on the canvas AND listed beside it, so the list is the accessible version.

## States
- Fog: Areas not visited are `--g-ink`; their places read `map.unknown`.
- Travel: Places with a waystone: Enter/south asks `map.travel_confirm`; not offered during battle or in dungeons (`map.no_travel`).
- Zoomed: +/− or triggers zoom ×1, ×2, ×4 around the focused place; arrows pan.
- Interior: Dungeons show their floor map; a floor switcher (`.game-tabs`, B1 B2…) above the canvas.

## Texts
(Key | English | 日本語)
- `map.title`: Map | 地図
- `map.found`: {found} of {total} places found | {total} か所中 {found} か所発見
- `map.you`: You are here | 現在地
- `map.unknown`: Not found yet | 未発見
- `map.travel`: Travel | 移動する
- `map.travel_confirm`: Travel to {place}? | {place} へ移動しますか？
- `map.no_travel`: You can’t travel from here. | ここからは移動できません。
- `place.willow_field`: Willow Field | ヤナギの野原
- `place.old_well`: Old Well | 古い井戸
- `place.village`: Village | 村

## Keyboard and focus
1. The places list (↑ ↓) moves the map's highlight to that place → Enter/south: Travel (when allowed).
- Arrows with Shift, or the right stick, pan; +/− or triggers zoom; M or Esc/east closes.

## Phone
- The map takes the full width; the places list becomes a bottom sheet (half height); pinch to zoom, drag to pan, with + / − buttons as well.

## Data
```json
{"map": {"area": "willow_field", "w": 160, "h": 96, "visited": "base64 bitmask, 1 bit per tile", "markers": [{"kind": "quest", "x": 88, "y": 12}, {"kind": "you", "x": 70, "y": 50}]}}
```

## Don't
- Don't show places the player hasn't reached, even greyed out by name.
- Don't make the canvas the only way to read the map.

## Pi Workbench
- Assumes GameKit (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> MapScreen` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
