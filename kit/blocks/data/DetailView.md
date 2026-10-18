# DetailView

App Block card (Data). One record on its own page: its title, its few facts, its content and the actions on it (Edit, Share, More).

- Basecoat: `breadcrumb`, `btn`, `badge`, `dropdown-menu`, `card`, `avatar`, `empty`
- Route: `/notes/{{id}}`
- Needs: Web: `GET /notes/{{id}}` (200, 404, 403). No server: `store.get("notes", id)`
- Used in: AppNotes (a note), AppCrm (a contact), AppAdmin (a user, an order), AppForum (a topic), AppBooking (a booking)
- Links to: Breadcrumbs, EditForm (Edit), Invite (Share), ConfirmDialog and DeleteUndo (Delete…), Tabs (when the record has several views), Comments

## Markup
Copy, never retype: `{harness}/kit/blocks/data/DetailView.html` (53 lines of HTML).

- Two primary actions at most as outline buttons (Edit, Share); everything else in the More menu. Delete is last in that menu, red, after a separator, and ends in `…` because it asks first.
- Facts go in the aside's `dl`: label in `dt` (muted), value in `dd`. Four to eight facts.
- The `<h1>` is the record's own name. The breadcrumb's last item repeats it.

## States
- Loaded: As above.
- Read only (shared with you): Edit, Share and Delete are gone; a badge `detail.read_only` says who shared it. Duplicate and Export stay in More.
- Loading (no-server or slow): LoadingState's detail skeleton; the breadcrumb is shown at once.
- Not found (404): EmptyState with `detail.not_found` and Back to Notes, status 404.
- No access (403): EmptyState with a lock icon, `detail.no_access` and `detail.no_access_hint`, status 403. Never show the title.
- Deleted from here: Go to the list and show DeleteUndo's toast there.
- Very long title: Wraps (never truncate an `<h1>`); actions move under it.
- Changed elsewhere: SavedState's “Changed by Ken · Reload” line under the header.

## Texts
(Key | English | 日本語)
- `crumbs.label`: Breadcrumb | パンくずリスト
- `crumbs.home`: Home | ホーム
- `detail.edit`: Edit | 編集
- `detail.share`: Share | 共有
- `detail.more`: More actions | その他の操作
- `detail.duplicate`: Duplicate | 複製
- `detail.export`: Export as Text | テキストで書き出す
- `detail.delete`: Delete… | 削除…
- `detail.about`: About this note | このノートについて
- `detail.subject`: Subject | 科目
- `detail.owner`: Owner | 作成者
- `detail.created`: Created | 作成日
- `detail.updated`: Edited | 最終編集
- `detail.shared_with`: Shared with | 共有先
- `detail.not_found`: This note doesn’t exist any more | このノートは存在しません
- `detail.not_found_hint`: It may have been deleted, or the link is wrong. | 削除されたか、リンクが間違っている可能性があります。
- `detail.back_to_list`: Back to Notes | ノート一覧に戻る
- `detail.no_access`: You don’t have access to this note | このノートを表示する権限がありません
- `detail.no_access_hint`: Ask its owner to share it with you. | 作成者に共有を依頼してください。
- `detail.read_only`: View only: shared by {owner} | 閲覧のみ（{owner} さんが共有）

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

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> DetailView` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
