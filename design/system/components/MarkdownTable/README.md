# MarkdownTable

The one look for tables written in Markdown: Pi's tables in Chat (`.pw-msg__table`) and Table blocks in documents (`.pw-mdtable` inside `.pw-block--table`).

- Markup: `<div class="pw-mdtable"><table><thead><tr><th scope="col" data-align>…</th></tr></thead><tbody><tr><td data-align>…</td></tr></tbody></table></div>`. `data-align="center|right"` comes from the rule row; right-aligned cells use tabular figures.
- 1px ink rules on every cell; the header row in the chrome face, regular weight, closed by a 3px double rule (like every other header in the system). Body cells in Source Serif 16/1.45. Inline code framed, links underlined.
- Cells wrap at 280px (200px on phone). A wider table scrolls sideways inside the box; the box is focusable (`tabindex="0"`, `role="region"`, `aria-label` = first header cells) so keyboard users can scroll it.
- Never coloured stripes or shaded headers: state and structure are rules, not fills.
