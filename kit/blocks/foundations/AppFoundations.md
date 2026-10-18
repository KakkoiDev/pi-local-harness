# AppFoundations

App Block card (Foundations). The rules every block assumes: the app root, one breakpoint, phone targets, dark mode, the two languages, chart colours and the Basecoat details that trip a small model.

- Basecoat: 1.0.2, vega style (`basecoat.css` imports `basecoat-vega.css`), the kit's vendored copy
- Needs: `styles/input.css` with the App foundations rules at the end; `js/basecoat.min.js` (interactive parts); Chart.js 4.5.1 only in apps with charts
- Used in: Every card

## The page
Copy, never retype: `{harness}/kit/blocks/foundations/AppFoundations.html` (22 lines of HTML).

## Rules
1. **One container, one breakpoint.** `.app` is the container (`container: app / inline-size`). Blocks use container variants only: `@3xl:` for the desktop layout (48 rem, 768 px and wider), `@max-3xl:` for phone-only. Not `md:` or `lg:`. Two exceptions, because they live outside `.app`: a `<dialog>` is in the top layer, so size its inner panel with viewport `sm:` (`sm:max-w-lg`); Basecoat's `sidebar` switches itself by viewport (`md:`) and is fixed (SidePanel says how).
2. **Nothing fixed inside `.app`.** A phone BottomBar is the last flex child of the full-height `.app`; the page scrolls in `main`. Only dialogs (top layer) and the toaster (after `.app`) float.
3. **Padding goes inside.** Padding on `.app` itself shrinks the container below 768 px on an 800 px window and the desktop layout never shows. Put `p-4` on `main` or an inner `div`.
4. **Phone targets are 44 px.** The App foundations CSS (below) makes buttons, inputs, selects, input groups, menu items, options, tabs and sidebar links 44 px tall under 48 rem. Anything else pressable you add gets `@max-3xl:min-h-11 @max-3xl:min-w-11`.
5. **Dark mode** is Basecoat's `html.dark`, set by the theme script above and by SettingsPage (Match System · Light · Dark). Never write a colour: use the tokens through utilities (`bg-muted`, `text-muted-foreground`, `border`, `text-destructive`, `bg-primary text-primary-foreground`).
6. **Every string has a key**, in `messages/en.json` and `messages/ja.json` (same keys; the harness checks). Markup marks them:
   - `data-t="key"`: the element's text (English inside as the fallback).
   - `data-t-label="key"` → `aria-label`; `data-t-placeholder="key"` → `placeholder`; `data-t-title="key"` → `title`; `data-t-empty="key"` → Basecoat's listbox `data-empty`.
   - `data-t-line="key"`: a whole sentence with elements inside (“{name} moved {thing} to {place}”), filled by a helper so Japanese word order works.
   - Labels built from data (“Quantity of {name}”) use a key with placeholders; the card's Texts table lists it.
   - Web starter (Jinja): write `{{ t("key") }}` in the text or attribute instead; the markers are for the no-server starter's `i18n.mjs`.
   - Dates, times, numbers and yen: `Intl.DateTimeFormat` / `Intl.NumberFormat` with the page's language (`ja-JP`: 2026年10月18日, ¥1,200). A native `<input type="date">` shows the browser's own format.
7. **Chart series** are `var(--chart-1)`…`var(--chart-5)`: colour-blind-safe (Okabe–Ito), told apart by lightness too. Use them for marks and rings only, never as a background behind white text (most fail 4.5:1). A second series also differs by dashes or point shape.
8. **Local files only.** Basecoat, htmx, Chart.js and fonts are vendored in the project; no CDN, no remote fonts.

## App foundations CSS
Copy to the end of `styles/input.css`:

Copy, never retype: `{harness}/kit/blocks/foundations/AppFoundations.css` (13 lines of CSS).

## Basecoat details that trip a small model
- Variants and sizes: Attributes: `class="btn" data-variant="outline" data-size="sm"`. The pre-1.0 classes (`btn-outline`, `btn-sm`) render as nothing.
- Alert with a button: Basecoat pins an alert's `<footer>` top-right with room for one short word. Put actions at the end of the alert's `section`: `<div class="mt-2 flex flex-wrap gap-2">…</div>`.
- `.empty` footer: It is a column; add `flex-row` for a row of buttons.
- `input-group`: The field inside is a bare `<input>` (no `input` class); an icon takes `data-align="inline-start"`.
- `role="group"` in a `.field`: Basecoat stacks it as a sub-group. A quantity stepper (`button-group`) goes in a plain `grid gap-2`, not a `.field`.
- `.item` headings: Flex rows: wrap mixed inline text in one `<span class="block">`.
- Accordion: `<section class="accordion">` around the `<details>`, not on them.
- Ids: Unique per page; Basecoat's tabs, select and combobox find their parts by id.
- Toasts from code: `document.getElementById('toaster').toast({category: 'success', title, description, action: {label, onclick: 'undo()'}, duration: 8000})` (`onclick` is a string), or the `toast` macro.
- Charts: Load `chart.umd.min.js`, then `basecoat.min.js`, then Basecoat's `chart.min.js`; `<canvas class="chart aspect-video" data-chart-type data-chart-label-key data-chart-data data-chart-series data-chart-legend>` and `basecoat.chart(canvas)`. The wrapper hides y ticks: pass `{options: {scales: {y: {beginAtZero: true, ticks: {display: true}}}}}` when numbers matter.

## Keyboard and focus
- Every page has one `h1`; Tab order follows reading order; focus is always visible (Basecoat's ring).
- Dialogs: focus the first field (or the safe button) on open, Esc closes, focus returns to what opened it.
- After an error, focus moves to the error summary or the first invalid field.

## Phone
- 390 px is the design width; 320 px must still work (nothing wider than the screen, text wraps).
- Safe areas: `viewport-fit=cover` and `pb-[env(safe-area-inset-bottom)]` on the bottom bar.
- Every swipe or long-press has a visible button that does the same.

## Don't
- Don't use viewport breakpoints for blocks, `position: fixed` inside `.app`, or colours outside the tokens.
- Don't hard-code English in templates or scripts; add the key in both files.
- Don't load anything from a CDN.

## Pi Workbench
- Set up: `python3 {harness}/kit/blocks/add.py <project> AppFoundations` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
