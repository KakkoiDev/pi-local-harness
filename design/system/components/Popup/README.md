# Popup

A popup menu: a native `<select class="pw-popup">` drawn square with a 1px drop shadow and a black triangle. Used for Show filters (Activity, Laya), the Project filter, the editor mode (Document / Markdown Source) and the block style (Text, Heading, Bullet, Number, Checkbox, Quote, Code, Raw Markdown).

- Always a native select so keyboard and screen readers work; label it with a visible `<label>` or `aria-label`.
- Width fits the longest option; block style is at least 140px.
