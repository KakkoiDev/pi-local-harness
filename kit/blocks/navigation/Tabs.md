# Tabs

App Block card (Navigation). Switches between a few views of the same thing (a note, an order, a person) without leaving the page.

- Basecoat: `tabs` (with `js/basecoat.min.js`), `badge`
- Needs: Nothing; a panel that is slow to build loads itself on first show (`hx-trigger="intersect once"`)
- Used in: DetailView, SettingsPage, ProductPage, IssueDetail, Profile
- Links to: SidePanel (for places), not Tabs: tabs never change the page

## Markup
Copy, never retype: `{harness}/kit/blocks/navigation/Tabs.html` (12 lines of HTML).

- Two styles: the default (a filled pill row, for 2–4 tabs in a card) and `data-variant="line"` on the tablist (an underline, for a page's main sections).
- Keep the chosen tab in the address as `?tab=history` (web: render that tab selected; no server: `history.replaceState`), so reload and Back keep it.
- 2 to 6 tabs. More than six, or places of their own: use SidePanel links.

## States
- Selected: `aria-selected="true"`, `tabindex="0"` on the tab; its panel has no `hidden`. All others `aria-selected="false"`, `tabindex="-1"`, panel `hidden`.
- Count on a tab: A secondary `badge` after the label (`2` people it's shared with).
- Disabled tab: `aria-disabled="true"` and a `title` saying why (“Only the owner can see Sharing”). It stays in its place.
- Panel loading: The panel shows `tabs.loading` until its fragment arrives (first show only).
- Panel error: `<div class="alert" data-variant="destructive">` with `tabs.error` and a Try Again button that repeats the request.
- Too wide (phone, Japanese): The tablist scrolls sideways (`@max-3xl:overflow-x-auto`); the selected tab is scrolled into view on load.

## Texts
(Key | English | 日本語)
- `tabs.label`: Note sections | ノートの項目
- `tabs.note`: Note | ノート
- `tabs.details`: Details | 詳細
- `tabs.history`: History | 履歴
- `tabs.sharing`: Sharing | 共有
- `tabs.loading`: Loading history… | 履歴を読み込み中…
- `tabs.error`: Couldn’t load the history. | 履歴を読み込めませんでした。
- `tabs.retry`: Try Again | 再試行

The tablist's `aria-label` uses `tabs.label`.

## Keyboard and focus
1. Tab moves into the tablist, onto the selected tab only → 2. Tab again moves into the panel.
- ← → move between tabs and select them (Basecoat), Home and End jump to the first and last. Disabled tabs are skipped.
- The vertical style (`aria-orientation="vertical"`) uses ↑ ↓.

## Phone
- The tablist takes the full width and scrolls sideways when the labels don't fit; each tab is 44 px tall (App foundations).
- Don't switch tabs on swipe; tapping is the only way.

## Data
```json
{"tabs": [{"id": "note", "label_key": "tabs.note"}, {"id": "details", "label_key": "tabs.details"},
          {"id": "history", "label_key": "tabs.history", "lazy": "/notes/42/history"},
          {"id": "sharing", "label_key": "tabs.sharing", "count": 2, "disabled": false}], "selected": "note"}
```

- Web: `GET /notes/42?tab=history` renders that tab selected; lazy panels return a fragment (200) or the error alert (500).
- No server: render all panels at once; there is nothing to load.

## Don't
- Don't use tabs as page navigation (each tab a link to another URL): that is SidePanel or BottomBar.
- Don't put a form's Save button inside one tab when the form spans several.
- Don't nest tabs inside tabs.

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> Tabs` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
