# Popup

A popup menu: a native `<select class="pw-popup">` drawn square with a 1px drop shadow and a black triangle. Used for Show filters (Activity, Gate), the Project filter, the editor mode (Document / Markdown Source) and the block style (Paragraph, Heading, Task, Bullet, Number, Quote, Table, Code, a separator, Raw Markdown — the same names and order as Turn Into).

- Always a native select so keyboard and screen readers work; label it with a visible `<label>` or `aria-label`.
- Width fits the longest option; block style is at least 140px.
- Phone (<=760px): 44px tall, 16px text, like every other control.
