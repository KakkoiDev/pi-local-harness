# Alert

A modal alert with a 36px icon: **Stop** (something cannot be done, or is destructive), **Caution** (something needs a decision), **Note** (information).

- Message first in chrome type, then one sentence of detail in the text face saying what is safe.
- The default button is always the safe one: Download Draft… for a save conflict, Cancel for Move to Trash, Reconnect for a lost connection.
- Replaces every `window.confirm()` and `window.prompt()` in the current code.

## Icon colours (round 19 closeout)

The three 36px icons use the theme tokens, never fixed colours. The shape's ground and every cutout are `--paper`; its outline and glyph are `currentColor`, which is ink. Ink on paper is 21:1 in both themes, so the icon reads the same in light, dark and Inverse wrappers. The 16px Failed glyph follows the same rule. The exported files in `assets/Icons/` (`alert-note.svg`, `alert-caution.svg`, `alert-stop.svg`, `failed.svg`) use `var(--paper, #ffffff)` and `var(--ink, #000000)`, so they fall back to black and white outside the app.
