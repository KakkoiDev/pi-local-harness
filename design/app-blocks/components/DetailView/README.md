# DetailView

One record on its own page: its title, its few facts, its content and the actions on it (Edit, Share, More).

| | |
| --- | --- |
| Group | Data |
| Basecoat | `breadcrumb`, `btn`, `badge`, `dropdown-menu`, `card`, `avatar`, `empty` |
| Route | `/notes/{{id}}` |
| Needs | Web: `GET /notes/{{id}}` (200, 404, 403). No server: `store.get("notes", id)` |
| Used in | AppNotes (a note), AppCrm (a contact), AppAdmin (a user, an order), AppForum (a topic), AppBooking (a booking) |
| Links to | Breadcrumbs, EditForm (Edit), Invite (Share), ConfirmDialog and DeleteUndo (Delete…), Tabs (when the record has several views), Comments |

## Markup

```html
<article class="grid gap-6" aria-labelledby="note-title">
  <nav class="breadcrumb" aria-label="Breadcrumb" data-t-label="crumbs.label">
    <ol>
      <li><a href="/" data-t="crumbs.home">Home</a></li>
      <li aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg></li>
      <li><a href="/c/japanese">Japanese 1</a></li>
      <li aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg></li>
      <li><span aria-current="page">Week 3 · Vocabulary</span></li>
    </ol>
  </nav>
  <header class="flex flex-wrap items-start justify-between gap-3">
    <div class="grid gap-1">
      <h1 id="note-title" class="text-2xl font-semibold">Week 3 · Vocabulary</h1>
      <p class="flex flex-wrap items-center gap-2 text-sm text-muted-foreground"><span class="badge" data-variant="secondary">Vocabulary</span><span>Edited <time datetime="2026-10-18T09:12">2 hours ago</time></span></p>
    </div>
    <div class="flex items-center gap-2">
      <a href="/notes/42/edit" class="btn" data-variant="outline"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg><span data-t="detail.edit">Edit</span></a>
      <button type="button" class="btn" data-variant="outline" onclick="document.getElementById('share-dialog').showModal()"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg><span data-t="detail.share">Share</span></button>
      <div id="note-more" class="dropdown-menu">
        <button type="button" id="note-more-trigger" class="btn" data-variant="ghost" data-size="icon" aria-haspopup="menu" aria-controls="note-more-menu" aria-expanded="false" aria-label="More actions" data-t-label="detail.more"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg></button>
        <div id="note-more-popover" data-popover aria-hidden="true" data-align="end">
          <div role="menu" id="note-more-menu" aria-labelledby="note-more-trigger">
            <button role="menuitem" type="button" hx-post="/notes/42/duplicate" data-t="detail.duplicate">Duplicate</button>
            <a role="menuitem" href="/notes/42.txt" download data-t="detail.export">Export as Text</a>
            <hr role="separator">
            <button role="menuitem" type="button" class="text-destructive" onclick="document.getElementById('delete-note').showModal()" data-t="detail.delete">Delete…</button>
          </div>
        </div>
      </div>
    </div>
  </header>
  <div class="grid gap-6 @3xl:grid-cols-[1fr_16rem]">
    <div class="grid content-start gap-3 text-sm leading-relaxed">
      <p>Words for getting around by train.</p>
      <ul class="ms-5 list-disc">
        <li lang="ja">駅 (えき) — station</li>
        <li lang="ja">電車 (でんしゃ) — train</li>
        <li lang="ja">切符 (きっぷ) — ticket</li>
      </ul>
    </div>
    <aside class="card h-fit gap-3 py-4" aria-labelledby="note-about">
      <header class="px-4"><h2 id="note-about" class="text-sm font-medium" data-t="detail.about">About this note</h2></header>
      <section class="px-4">
        <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt class="text-muted-foreground" data-t="detail.subject">Subject</dt><dd>Vocabulary</dd>
          <dt class="text-muted-foreground" data-t="detail.owner">Owner</dt><dd class="flex items-center gap-2"><span class="avatar" data-size="sm"><span>AY</span></span>Aiko Yamada</dd>
          <dt class="text-muted-foreground" data-t="detail.created">Created</dt><dd><time datetime="2026-10-12">12 Oct 2026</time></dd>
          <dt class="text-muted-foreground" data-t="detail.shared_with">Shared with</dt><dd>2 people</dd>
        </dl>
      </section>
    </aside>
  </div>
</article>
```

- Two primary actions at most as outline buttons (Edit, Share); everything else in the More menu. Delete is last in that menu, red, after a separator, and ends in `…` because it asks first.
- Facts go in the aside's `dl`: label in `dt` (muted), value in `dd`. Four to eight facts.
- The `<h1>` is the record's own name. The breadcrumb's last item repeats it.

## States

| State | What changes |
| --- | --- |
| Loaded | As above. |
| Read only (shared with you) | Edit, Share and Delete are gone; a badge `detail.read_only` says who shared it. Duplicate and Export stay in More. |
| Loading (no-server or slow) | LoadingState's detail skeleton; the breadcrumb is shown at once. |
| Not found (404) | EmptyState with `detail.not_found` and Back to Notes, status 404. |
| No access (403) | EmptyState with a lock icon, `detail.no_access` and `detail.no_access_hint`, status 403. Never show the title. |
| Deleted from here | Go to the list and show DeleteUndo's toast there. |
| Very long title | Wraps (never truncate an `<h1>`); actions move under it. |
| Changed elsewhere | SavedState's “Changed by Ken · Reload” line under the header. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `crumbs.label` | Breadcrumb | パンくずリスト |
| `crumbs.home` | Home | ホーム |
| `detail.edit` | Edit | 編集 |
| `detail.share` | Share | 共有 |
| `detail.more` | More actions | その他の操作 |
| `detail.duplicate` | Duplicate | 複製 |
| `detail.export` | Export as Text | テキストで書き出す |
| `detail.delete` | Delete… | 削除… |
| `detail.about` | About this note | このノートについて |
| `detail.subject` | Subject | 科目 |
| `detail.owner` | Owner | 作成者 |
| `detail.created` | Created | 作成日 |
| `detail.updated` | Edited | 最終編集 |
| `detail.shared_with` | Shared with | 共有先 |
| `detail.not_found` | This note doesn’t exist any more | このノートは存在しません |
| `detail.not_found_hint` | It may have been deleted, or the link is wrong. | 削除されたか、リンクが間違っている可能性があります。 |
| `detail.back_to_list` | Back to Notes | ノート一覧に戻る |
| `detail.no_access` | You don’t have access to this note | このノートを表示する権限がありません |
| `detail.no_access_hint` | Ask its owner to share it with you. | 作成者に共有を依頼してください。 |
| `detail.read_only` | View only: shared by {owner} | 閲覧のみ（{owner} さんが共有） |

## Keyboard and focus

1. Breadcrumb links → 2. Edit → 3. Share → 4. More (↑ ↓ in the menu, Esc closes) → 5. the content → 6. the aside.
- `E` opens Edit when focus is not in a field (listed in ShortcutHelp). Focus starts at the top of the page; after returning from Edit, focus goes to the `<h1>`.

## Phone

- The aside moves under the content (`@3xl:grid-cols-[1fr_16rem]` only from 48 rem).
- The breadcrumb becomes a Back link (see Breadcrumbs). Edit and Share keep their text if they fit, else become 44 px icon buttons with `aria-label`.

## Data

```json
{"id": 42, "title": "Week 3 · Vocabulary", "subject": "vocabulary", "body_md": "Words for getting around by train.\n- 駅 (えき) — station",
 "owner": {"id": 7, "name": "Aiko Yamada", "initials": "AY"}, "created_at": "2026-10-12", "updated_at": "2026-10-18T09:12:00+09:00",
 "shared_with": 2, "can_edit": true, "trail": [{"name": "Japanese 1", "href": "/c/japanese"}]}
```

- Web: `GET /notes/42` renders the page (200), 404 or 403 with the states above. Duplicate is `POST /notes/42/duplicate` → `HX-Redirect` to the copy.
- No server: `store.get("notes", 42)`; `null` → the not found state.

## Don't

- Don't put Delete as a visible red button next to Edit.
- Don't show IDs or internal fields (`id`, `owner_id`) as facts.
- Don't make the facts editable in place; Edit opens EditForm.
