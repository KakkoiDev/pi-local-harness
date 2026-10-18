# Breadcrumbs

App Block card (Navigation). Shows where a page sits in a hierarchy and links to each level above it; on the phone, one Back link to the parent.

- Basecoat: `breadcrumb`; `dropdown-menu` and `btn` for collapsed levels
- Needs: The trail: the names and addresses of the levels above the current page
- Used in: DetailView, PageTree pages (AppNotes), CodeDiff and file pages (AppCode), AppAdmin record pages
- Links to: TopBar (it sits under it, at the top of the page content)

## Markup
Copy, never retype: `{harness}/kit/blocks/navigation/Breadcrumbs.html` (12 lines of HTML).

- Place it at the top of the page content, above the `<h1>`. The last item is the current page and is not a link.
- "Home" is the app's root; the rest are the person's own names (collections, folders), not text keys.
- Only for real hierarchies (folders, collections, categories). A flat app doesn't need it.

## States
- Short trail (≤ 4 levels): All levels shown.
- Long trail (5 or more): Show Home, a `…` button, and the last two levels; the `…` opens a dropdown menu with the hidden levels in order.
- Long names: Each item keeps its full text; the list wraps onto a second line rather than truncating (`flex-wrap` in Basecoat). Names over 40 characters truncate with `max-w-60 truncate` on that link and its full name in `title`.
- Top level: No breadcrumb at all on top-level pages.
- Phone: Only the Back link to the parent: `‹ Vocabulary`.

## Texts
(Key | English | 日本語)
- `crumbs.label`: Breadcrumb | パンくずリスト
- `crumbs.home`: Home | ホーム
- `crumbs.more`: Show the hidden levels | 途中の階層を表示
- `crumbs.back`: Back to {parent} | {parent} に戻る

The `<nav>`'s `aria-label` uses `crumbs.label`; the phone Back link's `aria-label` uses `crumbs.back`.

## Keyboard and focus
1. Home → 2. each level in order (or the `…` button, then its menu) → 3. the page.
- The current page is not focusable. Separators are hidden from screen readers (`aria-hidden="true"`).
- `…` menu: Return opens, ↑ ↓ move, Esc closes and returns to the button.

## Phone
- Below 48 rem the list is hidden and one Back link to the parent shows instead, 44 px tall, with a chevron.
- It replaces the browser's Back only visually; it is a real link to the parent, not `history.back()`.

## Data
```json
{"trail": [{"name": "Japanese 1", "href": "/c/japanese"}, {"name": "Vocabulary", "href": "/c/japanese/vocabulary"}],
 "current": "Week 3 · Vocabulary"}
```

- Web: build the trail in the route from the record's parents (one query up the tree); pass it to a `breadcrumbs.html` include.
- No server: build it from the store (`store.ancestors(id)`).

## Don't
- Don't make the current page a link.
- Don't use it as the page's history (pages visited); it shows the hierarchy.
- Don't use slashes or `>` characters as separators; use the chevron icon.

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> Breadcrumbs` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
