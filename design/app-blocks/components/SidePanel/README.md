# SidePanel

The app's main navigation on the left: sections, collapsible groups and count badges, hidden on the phone until opened.

| | |
| --- | --- |
| Group | Navigation |
| Basecoat | `sidebar` (with `js/basecoat.min.js`), `badge`, `btn` |
| Needs | The list of sections and counts from the server or store; a toggle button in TopBar |
| Used in | AppAdmin, AppNotes, AppChat, AppCode, AppCrm and every app with more than 5 places; phone apps with 5 or fewer use BottomBar instead |
| Links to | TopBar (its toggle), BottomBar, SettingsPage |

## Markup

```html
<div class="app h-dvh">
<aside id="sidebar" class="sidebar" data-side="left" aria-hidden="false">
  <nav aria-label="Main" data-t-label="nav.main">
    <header>
      <a href="/" class="flex h-10 items-center gap-2 px-2 font-semibold">
        <span class="grid size-7 place-items-center rounded-md bg-primary text-xs text-primary-foreground" aria-hidden="true">CN</span>
        <span data-t="app.name">Class Notes</span>
      </a>
    </header>
    <section>
      <div role="group" aria-labelledby="sidebar-workspace">
        <h3 id="sidebar-workspace" data-t="nav.workspace">Workspace</h3>
        <ul>
          <li><a href="/" aria-current="page"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z"/></svg><span data-t="nav.home">Home</span></a></li>
          <li><a href="/notes"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8"/></svg><span class="truncate" data-t="nav.notes">Notes</span><span class="badge ms-auto" data-variant="secondary">12</span></a></li>
          <li><a href="/shared"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg><span data-t="nav.shared">Shared with Me</span></a></li>
          <li><a href="/inbox" aria-describedby="sidebar-inbox-count"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg><span class="truncate" data-t="nav.inbox">Inbox</span><span class="badge ms-auto" id="sidebar-inbox-count" aria-label="3 unread" data-t-label="nav.count_unread">3</span></a></li>
        </ul>
      </div>
      <div role="group" aria-labelledby="sidebar-collections">
        <h3 id="sidebar-collections" data-t="nav.collections">Collections</h3>
        <ul>
          <li>
            <details id="sidebar-japanese" open>
              <summary aria-controls="sidebar-japanese-list" class="@max-3xl:min-h-11"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg><span>Japanese 1</span></summary>
              <ul id="sidebar-japanese-list">
                <li><a href="/c/grammar"><span data-t="nav.grammar">Grammar</span></a></li>
                <li><a href="/c/vocabulary"><span data-t="nav.vocabulary">Vocabulary</span></a></li>
                <li><a href="/c/kanji"><span data-t="nav.kanji">Kanji</span></a></li>
              </ul>
            </details>
          </li>
          <li><button type="button" onclick="newCollection()"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M12 5v14"/></svg><span data-t="nav.new_collection">New Collection</span></button></li>
        </ul>
      </div>
    </section>
    <footer>
      <ul>
        <li><a href="/settings" class="flex w-full items-center"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/></svg><span data-t="nav.settings">Settings</span></a></li>
      </ul>
    </footer>
  </nav>
</aside>
<main class="flex h-full min-w-0 flex-col">
  <header class="flex h-14 shrink-0 items-center gap-2 border-b px-4">
    <button type="button" class="btn" data-variant="ghost" data-size="icon" aria-controls="sidebar" aria-expanded="true" aria-label="Show or hide the side panel" data-t-label="nav.toggle" onclick="const s = document.getElementById('sidebar'); s.toggle(); this.setAttribute('aria-expanded', s.getAttribute('aria-hidden') === 'false')"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/></svg></button>
    <h1 class="text-base font-semibold">Home</h1>
  </header>
  <div class="min-h-0 flex-1 overflow-y-auto p-4"><!-- the page --></div>
</main>
</div>
```

- The `<main>` must come **right after** the `<aside>`: Basecoat moves it aside by the panel's width (`.sidebar + *`).
- `.app` is `h-dvh` and the page scrolls inside `<main>`, so the panel stays put.
- `aria-current="page"` marks the place you are on; set it on the server (or after navigation in a no-server app).
- A badge that is the last `span` of a link sits at the right. Use `data-variant="secondary"` for totals, the default (filled) badge for unread or attention.

## States

| State | What changes |
| --- | --- |
| Open (desktop default) | `aria-hidden="false"` on `#sidebar`; the toggle has `aria-expanded="true"`. |
| Collapsed (desktop) | `aria-hidden="true"` and `inert`: the panel slides out and `<main>` takes the full width. Remember the choice in `localStorage["sidebar"]` and start with `data-initial-open="false"` when it was closed. |
| Phone, closed (default) | Below 768 px the panel is off screen (`data-initial-mobile-open` is false). The toggle in TopBar opens it. |
| Phone, open | The panel covers 18 rem from the left over a dimmed page. Tapping a link, the dimmed area or Esc closes it. |
| Group collapsed | `<details>` without `open`; the chevron turns. Keep each group's state in `localStorage["sidebar-group:<id>"]`. |
| Count changes | Update the badge text; at 0 remove the badge. Over 99 show `99+`. |
| Long names | Names truncate with an ellipsis (`truncate`); the full name is the link's text, read by screen readers. |
| No permission | Leave the link out. Don't show disabled links for places a person can never open. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `app.name` | Class Notes | クラスノート |
| `nav.main` | Main | メイン |
| `nav.workspace` | Workspace | ワークスペース |
| `nav.home` | Home | ホーム |
| `nav.notes` | Notes | ノート |
| `nav.shared` | Shared with Me | 共有されたノート |
| `nav.inbox` | Inbox | 受信箱 |
| `nav.collections` | Collections | コレクション |
| `nav.grammar` | Grammar | 文法 |
| `nav.vocabulary` | Vocabulary | 語彙 |
| `nav.kanji` | Kanji | 漢字 |
| `nav.new_collection` | New Collection | 新しいコレクション |
| `nav.settings` | Settings | 設定 |
| `nav.toggle` | Show or hide the side panel | サイドパネルの表示を切り替え |
| `nav.count_unread` | {count} unread | 未読 {count} 件 |

The `<nav>`'s `aria-label` uses `nav.main`; the toggle's `aria-label` uses `nav.toggle`; an unread badge's `aria-label` uses `nav.count_unread`. Collection names are the person's own data, not keys.

## Keyboard and focus

1. App name → 2. Home → 3. Notes → 4. Shared with Me → 5. Inbox → 6. Japanese 1 (group) → 7. its links when open → 8. New Collection → 9. Settings → then the page.
- Return or Space on a group's summary opens or closes it.
- On the phone, opening moves focus to the first link; Esc closes and returns focus to the toggle.
- Collapsed panels are `inert`: Tab skips them.

## Phone

- Basecoat switches the panel by the **viewport** (768 px, `data-breakpoint` to change it), not by the `.app` container: this is the one block that does. Keep the default.
- Below 768 px: a drawer 18 rem wide over a 50 % black scrim, opened by the TopBar toggle; every link is 44 px tall (App foundations; summaries get `@max-3xl:min-h-11`).
- Apps with 5 or fewer places use BottomBar on the phone and hide the TopBar toggle there.

## Data

```json
{"sections": [
  {"id": "workspace", "label_key": "nav.workspace", "items": [
    {"id": "home", "href": "/", "label_key": "nav.home"},
    {"id": "notes", "href": "/notes", "label_key": "nav.notes", "count": 12, "count_style": "total"},
    {"id": "inbox", "href": "/inbox", "label_key": "nav.inbox", "count": 3, "count_style": "unread"}]},
  {"id": "collections", "label_key": "nav.collections", "groups": [
    {"id": "japanese", "name": "Japanese 1", "items": [{"id": "grammar", "href": "/c/grammar", "label_key": "nav.grammar"}]}]}],
 "current": "home"}
```

- Web: render it in `base.html` from a `nav` context the route fills; refresh counts with `hx-get="/nav/counts" hx-trigger="every 60s"` swapping the badges only.
- No server: build the counts from the store (`store.count("notes")`) on load and after each change.

## Don't

- Don't add a second toggle inside the panel; the TopBar toggle is the only one.
- Don't nest groups more than one level (`details` inside `details`).
- Don't use viewport variants (`md:`) on the page itself because the panel does; the page still uses `@3xl:`.
- Don't put actions that change data in the panel except one "New …" button per group.
