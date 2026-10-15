# Basecoat for Pi (the card)

The kit's Basecoat is **1.0.2** (`kit/vendor/basecoat-1.0.2/`): shadcn-style components as CSS classes, on Tailwind,
with a small script for the interactive ones and Jinja macros for the complex ones (`jinja/`).

## The lines that are almost always right

```html
<button class="btn">Save</button>   <button class="btn-outline">Cancel</button>   <button class="btn-destructive">Delete</button>
<div class="card"><header><h2>Title</h2></header><section>…</section></div>
<div class="field"><label class="label" for="title">Title</label><input class="input" id="title" name="title"></div>
<form class="grid gap-4">…</form>   <!-- layout with Tailwind; fields with .field, .input, .select, .textarea -->
<table class="table">…</table>
```

## Rules

1. Components are Basecoat's classes (checked against its CSS: `btn` and its variants `btn-outline`, `btn-secondary`,
   `btn-ghost`, `btn-destructive`, `btn-icon…`, `btn-lg…`; `card` with `header`, `section`, `footer`; `field`, `label`,
   `input`, `select`, `textarea`; `table`; `badge`; `alert`); layout uses Tailwind utilities (`flex`, `grid`, `gap-4`), which the project's CSS
   build compiles. Unknown class names do nothing, silently: the harness checks them.
2. Dialogs, dropdown menus, popovers, selects, tabs, toasts, comboboxes and the sidebar are Jinja macros
   (`{% import 'basecoat/dialog.html.jinja' as dialog %}`), with `js/basecoat.min.js` loaded once.
3. No other CSS framework; the project's own few rules go in `app.css`.
