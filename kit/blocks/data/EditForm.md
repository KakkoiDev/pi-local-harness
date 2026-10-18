# EditForm

App Block card (Data). The form that creates a record or edits one: labelled fields, help under them, errors that say how to fix them, and one Save button.

- Basecoat: `field`, `fieldset`, `label`, `input` (text, date, radio), `select` (native, inside `.field`), `textarea`, `alert`, `btn`
- Route: `/notes/new` and `/notes/{{id}}/edit`
- Needs: Web: `POST /notes` (create), `POST /notes/{{id}}` (save). No server: `store.put("notes", note)` after `validate(note)` in `js/logic/notes.mjs`
- Used in: Every app that creates things; AppAdmin, AppCrm, AppShop admin, AppBooking
- Links to: DetailView (after saving), ConfirmDialog (leaving with changes), SavedState, DatePicker, ComboboxField, TagInput (richer fields)

## Markup
Copy, never retype: `{harness}/kit/blocks/data/EditForm.html` (44 lines of HTML).

- The same form creates and edits; only the heading, the action and the button text change (`form.new_title`/`form.create` vs `form.edit_title`/`form.save`).
- Every field: `label for` = input `id`; help in a `p` linked by `aria-describedby`; optional fields say “(optional)”; required fields say nothing extra.
- Validate in the same function on both sides: the browser for speed, the server (or store) as the rule. Messages come from the same keys.

## States
- New: Empty fields; heading `form.new_title`; button `form.create`. Focus in Title.
- Edit: Filled from the record; heading `form.edit_title`; button `form.save`.
- Field error: On submit: the `.field` gets `data-invalid="true"`, the control `aria-invalid="true"`, and a `<p role="alert" id="…-error">` under it, added to `aria-describedby`. Cleared when that field changes.
- Several errors: Also the summary `alert` at the top listing each error as a link to its field; focus moves to the summary.
- Saving: The submit button gets `disabled`, `aria-busy="true"` and `form.saving`; fields stay as they are.
- Saved: Go to DetailView (`HX-Redirect`) and show SavedState's toast “Note saved”.
- Server error: ErrorRetry's inline alert at the top; nothing is lost; Save works again.
- Changed elsewhere (409): An alert with `form.saved_elsewhere`; keep the person's text in the fields.
- Leaving with changes: Cancel, Back or a link: ConfirmDialog with `form.leave_title` (Keep Editing is the default). Closing the tab: the browser's own `beforeunload` prompt.
- Error texts with numbers: `form.errors_title` → the error summary’s heading when there is more than one problem; `error.title_long` → the title field’s error line, with the current count.

## Texts
(Key | English | 日本語)
- `form.new_title`: New Note | 新しいノート
- `form.edit_title`: Edit Note | ノートを編集
- `form.errors_title`: Fix {count} things to save | 保存するには {count} 件の修正が必要です
- `form.title`: Title | タイトル
- `form.title_help`: Up to 120 characters. | 120文字以内。
- `form.subject`: Subject | 科目
- `form.subject_choose`: Choose a subject | 科目を選択
- `form.body`: Note | 本文
- `form.body_help`: Markdown works: **bold**, lists, links. | Markdown が使えます（**太字**、リスト、リンク）。
- `form.due`: Review on | 復習日
- `form.optional`: (optional) | （任意）
- `form.visibility`: Who can see it | 公開範囲
- `form.private`: Only me | 自分のみ
- `form.class`: My class | クラスのメンバー
- `form.save`: Save Note | ノートを保存
- `form.create`: Create Note | ノートを作成
- `form.saving`: Saving… | 保存中…
- `form.cancel`: Cancel | キャンセル
- `error.title_empty`: Write a title. | タイトルを入力してください。
- `error.title_long`: Keep it under 120 characters ({count} now). | 120文字以内にしてください（現在 {count} 文字）。
- `error.subject_empty`: Choose a subject. | 科目を選んでください。
- `error.date_past`: Choose today or a later day. | 今日以降の日付を選んでください。
- `form.leave_title`: Leave without saving? | 保存せずに移動しますか？
- `form.leave_text`: Your changes to this note will be lost. | このノートへの変更は失われます。
- `form.leave`: Leave | 移動する
- `form.stay`: Keep Editing | 編集を続ける
- `form.saved_elsewhere`: Someone changed this note while you were editing. Copy your text, then reload. | 編集中に他の人がこのノートを変更しました。テキストをコピーしてから再読み込みしてください。

## Keyboard and focus
1. Title → 2. Subject → 3. Review on → 4. Note → 5. Who can see it (↑ ↓ between the two radios) → 6. Save → 7. Cancel.
- ⌘↩ / Ctrl ↩ saves from any field (also from the textarea, where ↩ is a new line).
- Esc does nothing (it would lose work); Cancel is the way out.
- After failed validation, focus goes to the error summary (or the only invalid field).

## Phone
- One column; the two short fields stack. Buttons take the full width, Save on top (`@max-3xl:flex-col-reverse`).
- Inputs are 44 px; the date uses DatePicker's calendar popover (full width, 44 px days) so a Japanese page reads 2026年10月25日; the right keyboard per field (`type="email"`, `inputmode="numeric"`).
- The page scrolls; the buttons are at the end, not fixed.

## Data
```json
{"request": {"title": "Week 3 · Vocabulary", "subject": "vocabulary", "review_on": "2026-10-25", "body": "駅 (えき) — station", "visibility": "private", "version": 7},
 "ok": {"id": 42, "redirect": "/notes/42"},
 "error": {"status": 422, "fields": {"title": "error.title_empty", "subject": "error.subject_empty"}}}
```

- Web: `POST` with the fields; 422 re-renders the form fragment with errors; 409 when `version` is stale; success → `HX-Redirect`.
- No server: `validate(note)` returns `{field: key}`; empty object → `store.put`, then navigate.

## Don't
- Don't disable Save until the form is valid; let people press it and show what to fix.
- Don't validate while the person is still typing a field for the first time; validate on submit, then live for fields already shown as wrong.
- Don't use placeholders as labels.

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> EditForm` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
