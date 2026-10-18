# BottomBar

App Block card (Navigation). The phone's main navigation: up to five places along the bottom edge, in reach of the thumb.

- Basecoat: `badge`; the rest is Tailwind (Basecoat has no tab bar)
- Needs: The current place; unread counts
- Used in: Phone layouts of AppNotes, AppChat, AppShop, AppBooking, AppCourse, AppForum
- Links to: SidePanel (the desktop counterpart), TopBar

## Markup
Copy, never retype: `{harness}/kit/blocks/navigation/BottomBar.html` (10 lines of HTML).

- It is the **last flex child** of a full-height `.app`, not `position: fixed`, so it never covers content and the keyboard pushes it correctly.
- Hidden from 48 rem up (`@3xl:hidden`); the desktop uses SidePanel or TopBar links for the same places, in the same order.
- `pb-[env(safe-area-inset-bottom)]` keeps it clear of the iPhone home indicator; the page needs `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`.

## States
- Current place: `aria-current="page"` on its link: text in `foreground` and medium weight.
- Unread: A badge over the icon; `aria-label` from `nav.count_unread`. Over 99: `99+`. None: no badge.
- Inside a place (a note open): Keep the bar; the place stays current. Full-screen tasks (EditForm, Checkout) hide it: add `hidden` while they are open.
- Keyboard open: Nothing to do: it is in the flow and the visual viewport shrinks above it.
- Four places: `grid-cols-4`; three: `grid-cols-3`. Never more than five: put the rest under "Me".
- Long Japanese labels: Keep labels to 4 full-width characters (`マイページ`); the item never wraps (11 px text).

## Texts
(Key | English | 日本語)
- `nav.main`: Main | メイン
- `nav.home`: Home | ホーム
- `nav.notes`: Notes | ノート
- `nav.search`: Search | 検索
- `nav.inbox`: Inbox | 受信箱
- `nav.me`: Me | マイページ
- `nav.count_unread`: {count} unread | 未読 {count} 件

## Keyboard and focus
1. Home → 2. Notes → 3. Search → 4. Inbox → 5. Me, after the page content.
- Each item is a plain link; Return follows it. Focus moves to the new page's `<h1>` after navigation (no-server apps: `h1.focus()` with `tabindex="-1"`).

## Phone
- Each item is at least 56 px tall and a fifth of the width: icons 20 px, labels 11 px under them.
- Search opens the search page (or CommandPalette in apps that have one).
- No swipe gestures; tapping is the only way.

## Data
```json
{"items": ["home", "notes", "search", "inbox", "me"], "current": "inbox", "counts": {"inbox": 3}}
```

- Web: render from the same `nav` context as SidePanel, `current` from the route.
- No server: set `aria-current` in the router after each navigation.

## Don't
- Don't use `position: fixed` or `sticky` for it.
- Don't put a primary action (a big + button) in the middle of the bar; the page's own New button does that.
- Don't show it on the desktop.

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> BottomBar` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
