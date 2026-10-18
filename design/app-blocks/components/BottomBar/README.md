# BottomBar

The phone's main navigation: up to five places along the bottom edge, in reach of the thumb.

| | |
| --- | --- |
| Group | Navigation |
| Basecoat | `badge`; the rest is Tailwind (Basecoat has no tab bar) |
| Needs | The current place; unread counts |
| Used in | Phone layouts of AppNotes, AppChat, AppShop, AppBooking, AppCourse, AppForum |
| Links to | SidePanel (the desktop counterpart), TopBar |

## Markup

```html
<div class="app flex h-dvh flex-col">
  <main class="min-h-0 flex-1 overflow-y-auto"><!-- the page --></main>
<nav class="grid shrink-0 grid-cols-5 border-t bg-background pb-[env(safe-area-inset-bottom)] @3xl:hidden" aria-label="Main" data-t-label="nav.main">
    <a href="/" aria-current="page" class="relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] text-muted-foreground aria-[current=page]:font-medium aria-[current=page]:text-foreground"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="size-5"><path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z"/></svg><span data-t="nav.home">Home</span></a>
    <a href="/notes" class="relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] text-muted-foreground aria-[current=page]:font-medium aria-[current=page]:text-foreground"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="size-5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8"/></svg><span data-t="nav.notes">Notes</span></a>
    <a href="/search" class="relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] text-muted-foreground aria-[current=page]:font-medium aria-[current=page]:text-foreground"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="size-5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg><span data-t="nav.search">Search</span></a>
    <a href="/inbox" class="relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] text-muted-foreground aria-[current=page]:font-medium aria-[current=page]:text-foreground"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="size-5"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg><span data-t="nav.inbox">Inbox</span><span class="badge absolute top-1.5 left-1/2 ms-2 h-4 min-w-4 px-1 text-[10px]" aria-label="3 unread">3</span></a>
    <a href="/me" class="relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] text-muted-foreground aria-[current=page]:font-medium aria-[current=page]:text-foreground"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="size-5"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg><span data-t="nav.me">Me</span></a>
</nav>
</div>
```

- It is the **last flex child** of a full-height `.app`, not `position: fixed`, so it never covers content and the keyboard pushes it correctly.
- Hidden from 48 rem up (`@3xl:hidden`); the desktop uses SidePanel or TopBar links for the same places, in the same order.
- `pb-[env(safe-area-inset-bottom)]` keeps it clear of the iPhone home indicator; the page needs `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`.

## States

| State | What changes |
| --- | --- |
| Current place | `aria-current="page"` on its link: text in `foreground` and medium weight. |
| Unread | A badge over the icon; `aria-label` from `nav.count_unread`. Over 99: `99+`. None: no badge. |
| Inside a place (a note open) | Keep the bar; the place stays current. Full-screen tasks (EditForm, Checkout) hide it: add `hidden` while they are open. |
| Keyboard open | Nothing to do: it is in the flow and the visual viewport shrinks above it. |
| Four places | `grid-cols-4`; three: `grid-cols-3`. Never more than five: put the rest under "Me". |
| Long Japanese labels | Keep labels to 4 full-width characters (`マイページ`); the item never wraps (11 px text). |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `nav.main` | Main | メイン |
| `nav.home` | Home | ホーム |
| `nav.notes` | Notes | ノート |
| `nav.search` | Search | 検索 |
| `nav.inbox` | Inbox | 受信箱 |
| `nav.me` | Me | マイページ |
| `nav.count_unread` | {count} unread | 未読 {count} 件 |

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
