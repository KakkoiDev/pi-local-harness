# Skeletons

App Block card (Other elements). Grey shapes in the layout of the content that is loading, so the page does not jump when it arrives.

- Basecoat: `skeleton` (vega gives it the pulse, `bg-muted` and `rounded-md`; add the size and, for circles and lines, `rounded-full` / `rounded`)
- Needs: Nothing. The real content replaces the skeleton in the same container
- Used in: LoadingState (the rules for when), ListSearch, DataTable, Dashboard, Timeline, FileTree, AvatarGroup, InfiniteScroll, ProductGrid

## Markup
Copy, never retype: `{harness}/kit/blocks/elements/Skeletons.html` (14 lines of HTML).

Shapes to reuse:

(Real thing | Skeleton)
- Line of text: `skeleton h-4 rounded bg-muted` with a width (`w-1/2`); last line of a paragraph shorter
- Small text: `h-3`
- Heading: `h-6 w-1/3`
- Avatar: `size-8 rounded-full` (or the avatar's size)
- Image, card cover: `aspect-video w-full rounded-md`
- Button: `h-9 w-24 rounded-md`
- Badge: `h-5 w-14 rounded-full`
- Table row: one `h-4` per cell, inside the real `table` (`<td><div class="skeleton …"></div></td>`)
- Stat tile number: `h-8 w-24`
- Chart: `aspect-video w-full rounded-md` with no axes

## States
- Loading: `aria-busy="true"` on the container, skeleton items with `aria-hidden="true"`, a `sr-only` line saying what loads.
- Loaded: Swap the skeleton for the content in one go; remove `aria-busy`. Keep the container's size the same so nothing jumps.
- Slow (over 5 s): Keep the skeleton and add, under it, `loading.slow` (“Still loading. This is taking longer than usual.”) in `text-sm text-muted-foreground`.
- Failed: Replace with ErrorRetry, never leave a skeleton on screen.
- Reduced motion: The pulse stops (`motion-reduce:animate-none` on `.skeleton` items, or the global rule); the grey stays.

## Texts
(Key | English | 日本語)
- `loading.notes`: Loading notes… | ノートを読み込み中…
- `loading.generic`: Loading… | 読み込み中…
- `loading.slow`: Still loading. This is taking longer than usual. | 読み込み中です。いつもより時間がかかっています。

## Keyboard and focus
- Nothing in a skeleton is focusable. If focus was in the area that reloads (a filter changed), keep focus on the control that caused it, not on the skeleton.

## Phone
- Use the phone layout's own shapes (a card list instead of table rows). Show as many items as fill one screen (usually 4), not more.

## Data
- None. Web with htmx: put the skeleton in the target first (`hx-indicator`, or render the skeleton in the page and `hx-trigger="load"` to fetch the real fragment). No server: render the skeleton, then the store's result.

## Don't
- Don't show skeletons for under ~300 ms (it flashes): wait 300 ms before showing them.
- Don't animate shimmer gradients across the page; Basecoat's pulse is enough.
- Don't use skeletons for errors or empty lists.

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> Skeletons` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
