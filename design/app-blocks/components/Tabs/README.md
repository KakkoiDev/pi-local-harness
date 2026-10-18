# Tabs

Switches between a few views of the same thing (a note, an order, a person) without leaving the page.

| | |
| --- | --- |
| Group | Navigation |
| Basecoat | `tabs` (with `js/basecoat.min.js`), `badge` |
| Needs | Nothing; a panel that is slow to build loads itself on first show (`hx-trigger="intersect once"`) |
| Used in | DetailView, SettingsPage, ProductPage, IssueDetail, Profile |
| Links to | SidePanel (for places), not Tabs: tabs never change the page |

## Markup

```html
<div class="tabs" id="note-tabs">
  <nav role="tablist" aria-orientation="horizontal" aria-label="Note sections" data-t-label="tabs.label" class="@max-3xl:w-full @max-3xl:justify-start @max-3xl:overflow-x-auto">
    <button type="button" role="tab" id="note-tabs-tab-1" aria-controls="note-tabs-panel-1" aria-selected="true" tabindex="0"><span data-t="tabs.note">Note</span></button>
    <button type="button" role="tab" id="note-tabs-tab-2" aria-controls="note-tabs-panel-2" aria-selected="false" tabindex="-1"><span data-t="tabs.details">Details</span></button>
    <button type="button" role="tab" id="note-tabs-tab-3" aria-controls="note-tabs-panel-3" aria-selected="false" tabindex="-1"><span data-t="tabs.history">History</span></button>
    <button type="button" role="tab" id="note-tabs-tab-4" aria-controls="note-tabs-panel-4" aria-selected="false" tabindex="-1"><span data-t="tabs.sharing">Sharing</span><span class="badge ms-1.5" data-variant="secondary">2</span></button>
  </nav>
  <div role="tabpanel" id="note-tabs-panel-1" aria-labelledby="note-tabs-tab-1" tabindex="-1"><div class="py-4 text-sm">駅 (eki) station · 電車 (densha) train · 切符 (kippu) ticket</div></div>
  <div role="tabpanel" id="note-tabs-panel-2" aria-labelledby="note-tabs-tab-2" tabindex="-1" hidden><!-- details --></div>
  <div role="tabpanel" id="note-tabs-panel-3" aria-labelledby="note-tabs-tab-3" tabindex="-1" hidden><div class="py-4" hx-get="/notes/42/history" hx-trigger="intersect once" hx-swap="innerHTML"><p class="text-muted-foreground text-sm" data-t="tabs.loading">Loading history…</p></div></div>
  <div role="tabpanel" id="note-tabs-panel-4" aria-labelledby="note-tabs-tab-4" tabindex="-1" hidden><!-- sharing --></div>
</div>
```

- Two styles: the default (a filled pill row, for 2–4 tabs in a card) and `data-variant="line"` on the tablist (an underline, for a page's main sections).
- Keep the chosen tab in the address as `?tab=history` (web: render that tab selected; no server: `history.replaceState`), so reload and Back keep it.
- 2 to 6 tabs. More than six, or places of their own: use SidePanel links.

## States

| State | What changes |
| --- | --- |
| Selected | `aria-selected="true"`, `tabindex="0"` on the tab; its panel has no `hidden`. All others `aria-selected="false"`, `tabindex="-1"`, panel `hidden`. |
| Count on a tab | A secondary `badge` after the label (`2` people it's shared with). |
| Disabled tab | `aria-disabled="true"` and a `title` saying why (“Only the owner can see Sharing”). It stays in its place. |
| Panel loading | The panel shows `tabs.loading` until its fragment arrives (first show only). |
| Panel error | `<div class="alert" data-variant="destructive">` with `tabs.error` and a Try Again button that repeats the request. |
| Too wide (phone, Japanese) | The tablist scrolls sideways (`@max-3xl:overflow-x-auto`); the selected tab is scrolled into view on load. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `tabs.label` | Note sections | ノートの項目 |
| `tabs.note` | Note | ノート |
| `tabs.details` | Details | 詳細 |
| `tabs.history` | History | 履歴 |
| `tabs.sharing` | Sharing | 共有 |
| `tabs.loading` | Loading history… | 履歴を読み込み中… |
| `tabs.error` | Couldn’t load the history. | 履歴を読み込めませんでした。 |
| `tabs.retry` | Try Again | 再試行 |

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
