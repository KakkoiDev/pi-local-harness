# Basecoat for Pi (the card)

The kit's Basecoat is **1.0.2** (`kit/vendor/basecoat-1.0.2/`): shadcn-style components as CSS classes, on Tailwind,
with a small script for the interactive ones and Jinja macros for the complex ones (`jinja/`).

## The lines that are almost always right

```html
<button class="btn">Save</button>   <button class="btn" data-variant="outline">Cancel</button>   <button class="btn" data-variant="destructive">Delete</button>
<button class="btn" data-variant="ghost" data-size="sm">Edit</button>   <span class="badge" data-variant="secondary">New</span>
<div class="card"><header><h2>Title</h2></header><section>…</section></div>
<div class="field"><label class="label" for="title">Title</label><input class="input" id="title" name="title"></div>
<form class="grid gap-4">…</form>   <!-- layout with Tailwind; fields with .field, .input, .select, .textarea -->
<table class="table">…</table>
```

## Rules

1. Components are Basecoat's classes (checked against the stylesheet a project loads, `basecoat.css`: `btn`, `card` with
   `header`, `section`, `footer`; `field`, `label`, `input`, `select`, `textarea`; `table`; `badge`; `alert`); layout
   uses Tailwind utilities (`flex`, `grid`, `gap-4`), which the project's CSS build compiles. Unknown class names do
   nothing, silently: the harness checks them.
2. **Variants and sizes are attributes in 1.0**, not classes: `data-variant` = `primary`, `secondary`, `outline`,
   `ghost`, `destructive`, `link` (on `btn`, `badge`; `destructive` on `alert`), `data-size` = `xs`, `sm`, `lg`, `icon`,
   `icon-sm`… on `btn`. The pre-1.0 classes (btn-outline, btn-ghost, btn-sm and the like) live only in the legacy layer,
   which projects do not load: they render as plain text. Most examples online are pre-1.0.
3. Dialogs, dropdown menus, popovers, selects, tabs, toasts, comboboxes and the sidebar are Jinja macros
   (`{% import 'basecoat/dialog.html.jinja' as dialog %}`), with `js/basecoat.min.js` loaded once.
4. No other CSS framework; the project's own few rules go at the end of `styles/input.css` (`static/app.css` is what the
   Tailwind build writes: never edit it).
5. **Colours, corners, spacing and fonts come from the theme**, never hard-coded: `bg-primary`, `text-primary-foreground`,
   `text-muted-foreground`, `border-border`, `rounded-lg`, `font-sans`, not `#3b82f6`, `bg-blue-500` or `rounded-[7px]`.
   The person tunes the theme in the workbench's theme panel, which writes the block marked
   `/* theme: edited in the workbench */` in `styles/input.css`: leave that block to them.
