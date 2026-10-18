# ThemePanel

Task 312: the app's theme (Basecoat CSS variables, Tailwind v4, in `app/static/theme.css`) edited live from the chat. The **workbench answers itself**: the message is labelled “Pi Workbench · no model”; no model call, no request until Save. Boards: canvas page **Project Start & fixes**, last row (R12_ThemeColours, R12_ThemeRadius, R12_ThemeParts, Ph12_Theme, Ph12_ThemePick).

## Panel

- `section.pw-card.pw-theme` inside the workbench message: head “Theme · <group>”, a segmented control **Colours · Radius · Spacing · Chart** (one group per panel), and the file path. Foot: the unsaved count “1 change not saved: Primary · the Preview shows it now”, **Discard**, **Save Theme** (default). No changes: “No changes yet” and both buttons disabled.
- Workbench chrome stays 1-bit. Only the swatches and samples carry the app's colours.

## Colours

- `role="table"`; a head row “Colour, with its text · Light · Dark”; one `.pw-theme__row` per token pair: **plain-words name** with a `small` line of where it shows (Primary · buttons and links; Secondary; Accent; Muted; Destructive; Background; Card; Border · Input · Ring), then for light and dark: a `.pw-swatch` (the colour with “Aa” in its foreground), a hex field `.pw-theme__hex`, and the contrast `.pw-contrast` “4.8 : 1 · AA ✓” or “⚠ 3.6 : 1 · below AA”. **Never blocking**: a failing pair can still be saved. **Reset** per token, disabled until it changes.
- In the chat, the first five rows and “▸ 3 more: …”.
- The swatch (`aria-expanded`) opens `.pw-picker`: saturation field, hue strip, hex (and the oklch it maps to), five recent colours, “Drag to try; the Preview follows. Esc puts the old value back.”

## Radius and spacing

- One slider each (`.pw-slider`): label, the value in rem and px, **Reset (10 px)**. Under it `.pw-samples` with the derived sizes: Button sm/md, Card lg, Dialog xl, Field (radius); Button py-2 px-4, Card p-6, gap-4 (spacing, unit 3–6 px in 0.5 steps).
- **Chart**: five series colours in order, with the note that they stay apart for common colour blindness and a warning when two get hard to tell apart.

## Live Preview

Every change applies to the Preview at once (desk: the window beside the chat; its note line reads “◐ Showing the unsaved theme · Save or Discard in the chat”). Discard or closing without saving puts the saved theme back.

## Save, Undo, leaving

- **Save Theme** writes theme.css as one request and replaces the panel with one done line: “✓ Theme saved: primary, radius · app/static/theme.css · 14:38” **Undo**.
- Sending a message, switching project or closing with unsaved changes asks: alert “Save the theme changes before going on?” — detail names what changed and that the Preview goes back otherwise — **Don't Save** · **Cancel** · **Save** (default).

## Entry points

- The request in the chat (“adjust the site's colours”, “rounder corners”): the workbench answers with the matching group.
- **Project › Theme… ⌃⌥K**.
- When Pi is asked something the panel does, a dotted Harness notice under Pi's answer: “The Theme panel can do this without Pi, and you see it change as you drag.” **Open Radius…**

## No theme file

A card “This project has no theme file”: “There is nothing to tinker with yet… Projects made from the web app and no-server starters have one.” **Add a Theme File** (default) — adds Basecoat's defaults as one request you can undo.

## Phone

Full screen: Close · Theme · Light/Dark segment in the bar; the live app scaled on top with a “Live · unsaved” tag (the Preview tab isn't needed); the group segment; 56 px token rows with a 32 px swatch, hex and ›; Discard · Save Theme at the bottom. A row opens the picker page (field, hue, hex, contrast with its text; Reset · Done).
