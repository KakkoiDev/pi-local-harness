# SidePanel

App Block card (Navigation). The app's main navigation on the left: sections, collapsible groups and count badges, hidden on the phone until opened.

- Basecoat: `sidebar` (with `js/basecoat.min.js`), `badge`, `btn`
- Needs: The list of sections and counts from the server or store; a toggle button in TopBar
- Used in: AppAdmin, AppNotes, AppChat, AppCode, AppCrm and every app with more than 5 places; phone apps with 5 or fewer use BottomBar instead
- Links to: TopBar (its toggle), BottomBar, SettingsPage

## Markup
Copy, never retype: `{harness}/kit/blocks/navigation/SidePanel.html` (51 lines of HTML).

- The `<main>` must come **right after** the `<aside>`: Basecoat moves it aside by the panel's width (`.sidebar + *`).
- `.app` is `h-dvh` and the page scrolls inside `<main>`, so the panel stays put.
- `aria-current="page"` marks the place you are on; set it on the server (or after navigation in a no-server app).
- A badge that is the last `span` of a link sits at the right. Use `data-variant="secondary"` for totals, the default (filled) badge for unread or attention.

## States
- Open (desktop default): `aria-hidden="false"` on `#sidebar`; the toggle has `aria-expanded="true"`.
- Collapsed (desktop): `aria-hidden="true"` and `inert`: the panel slides out and `<main>` takes the full width. Remember the choice in `localStorage["sidebar"]` and start with `data-initial-open="false"` when it was closed.
- Phone, closed (default): Below 768 px the panel is off screen (`data-initial-mobile-open` is false). The toggle in TopBar opens it.
- Phone, open: The panel covers 18 rem from the left over a dimmed page. Tapping a link, the dimmed area or Esc closes it.
- Group collapsed: `<details>` without `open`; the chevron turns. Keep each group's state in `localStorage["sidebar-group:<id>"]`.
- Count changes: Update the badge text; at 0 remove the badge. Over 99 show `99+`.
- Long names: Names truncate with an ellipsis (`truncate`); the full name is the link's text, read by screen readers.
- No permission: Leave the link out. Don't show disabled links for places a person can never open.

## Texts
(Key | English | 日本語)
- `app.name`: Class Notes | クラスノート
- `nav.main`: Main | メイン
- `nav.workspace`: Workspace | ワークスペース
- `nav.home`: Home | ホーム
- `nav.notes`: Notes | ノート
- `nav.shared`: Shared with Me | 共有されたノート
- `nav.inbox`: Inbox | 受信箱
- `nav.collections`: Collections | コレクション
- `nav.grammar`: Grammar | 文法
- `nav.vocabulary`: Vocabulary | 語彙
- `nav.kanji`: Kanji | 漢字
- `nav.new_collection`: New Collection | 新しいコレクション
- `nav.settings`: Settings | 設定
- `nav.toggle`: Show or hide the side panel | サイドパネルの表示を切り替え
- `nav.count_unread`: {count} unread | 未読 {count} 件

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

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> SidePanel` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
