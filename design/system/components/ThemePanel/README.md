# ThemePanel

Task 312: the app's theme (Basecoat CSS variables, Tailwind v4, in the marked theme block of `styles/input.css`, which the starters’ Tailwind build already reads) edited live from the chat. The **workbench answers itself**: the message is labelled “Pi Workbench · no model”; no model call, no request until Save. Boards: canvas page **Project Start & fixes**, last row (R12_ThemeColours, R12_ThemeRadius, R12_ThemeParts, Ph12_Theme, Ph12_ThemePick).

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

- **Save Theme** writes theme.css as one request and replaces the panel with one done line: “✓ Theme saved: primary, radius · styles/input.css · theme block · 14:38” **Undo**. Above it the panel folds to one line, “✓ Theme · Colours saved” **Open Again** (round 13), so it can be reopened.
- Sending a message, switching project or closing with unsaved changes asks: alert “Save the theme changes before going on?” — detail names what changed and that the Preview goes back otherwise — **Don't Save** · **Cancel** · **Save** (default).

## Entry points

- The request in the chat (“adjust the site's colours”, “rounder corners”): the workbench answers with the matching group.
- **Project › Theme… ⌃⌥K**.
- When Pi is asked something the panel does, a dotted Harness notice under Pi's answer: “The Theme panel can do this without Pi, and you see it change as you drag.” **Open Radius…**

## No theme file

A card “This project has no theme file”: “There is nothing to tinker with yet… Projects made from the web app and no-server starters have one.” **Add a Theme File** (default) — adds Basecoat's defaults as one request you can undo.

## Phone

Full screen: Close · Theme · Light/Dark segment in the bar; the live app scaled on top with a “Live · unsaved” tag (the Preview tab isn't needed); the group segment; 56 px token rows with a 32 px swatch, hex and ›; Discard · Save Theme at the bottom. A row opens the picker page (field, hue, hex, contrast with its text; Reset · Done).

## Round 13 (boards R13_ThemeFonts, R13_ThemeParts, Ph13_ThemeCard, Ph13_ThemeStarting, Ph13_ThemeNoLive)

- **Tabs**: Colours · Radius · Spacing · Chart · **Fonts**. The head shows the file as “styles/input.css · theme block”.
- **Fonts**: one `.pw-fontrow` per role, **Headings** and **Body**: the role, the family in use (mono), **Reset**, a search field “Search Google Fonts” (“or a font already in the project”), and a `.pw-fontsample` with an English and a Japanese line in the app’s look. Choosing a Google font shows a `.pw-fontget` line: “<family> · 400 and 700 · OFL licence · 2.1 MB, saved to static/fonts/<family>/ with OFL.txt. Has Japanese.” and **Download and Use** (the person’s yes; nothing downloads before it). After it: “✓ Downloaded to static/fonts/<family>/ with its licence (OFL.txt) · 14:40”. A font with no Japanese gets a caution line: “<family> has no Japanese: Japanese text uses the system font (Hiragino or Noto Sans JP).” Never blocking.
- **The picker** opens on what the swatch shows: a segment **Colour · Text on it** at its top (as built). Text on it edits the foreground; the contrast line under the hex follows. On **Border · Input · Ring** the segment is **Colour · Focus ring**.
- **Rows that hold several tokens** say so in their small line: Card “cards and dialogs · also popovers and menus”; Border · Input · Ring “lines and fields · border and input; the ring in the picker”. Sidebar tokens are not rows; a theme saved with them keeps them.
- **Border · Input · Ring checks the ring, not the text ratio**: “Ring 5.2 : 1 · 3:1 ✓” against the card (WCAG non-text contrast, 3:1), or “⚠ Ring 2.4 : 1 · below 3:1”. Borders and input edges are decoration in Basecoat’s look (light by design), so they get no check; a ratio there would always read “below AA” and teach people to ignore the column. The focus ring is what someone using a keyboard must see.
- **Chart**: one value per series, light and dark. With Basecoat’s default blues the warning shows at once, as a `.pw-notice`: “⚠ Hard to tell apart · Chart 2 and Chart 3 · Chart 3 and Chart 4 · Chart 4 and Chart 5. Series that differ only a little in blue look the same to many people.” **Use Colour-Blind-Safe Colours** sets App Blocks’ five (Okabe–Ito) as one unsaved change; then the note reads that the series stay apart by lightness as well as hue.
- **Phone, in the chat**: a short card “Theme · Colours · styles/input.css · theme block”, the unsaved line and **Open Theme** (default); the full screen opens on press. Top of the full screen: the live app, or “⧖ Starting the app… The live app shows here in a moment. You can change colours now; they apply when it starts.”, or over the tailnet “ⓘ No live preview here. The app runs on the computer, and this phone reaches it over the tailnet. Your changes show in the app after Save Theme.” The panel works the same in all three.
