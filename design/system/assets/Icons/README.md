# Icons

16px glyphs on a pixel grid (alerts: 36px), 1px strokes, crisp edges, drawn in ink. In the app they come from `design/icons.mjs` and use `currentColor`, so they invert inside selected rows and in the Inverse theme; these SVG files are the same drawings in plain ink (#000000) for reference, except the alert icons and the Failed glyph, whose ground and cutouts use `var(--paper, #ffffff)` and whose ink uses `var(--ink, #000000)` so they follow the theme (round 19 closeout). Status glyphs always appear beside their word.
- `gate.svg`: the Gate fence (two posts, two rails, three pickets). The Agent section's Gate row; `icon("gate")` in icons.mjs.
- `more.svg`: three dots, the ⋯ More button on phone rows and headers; `icon("more")` in icons.mjs.
