# FileUpload

App Block card (Content). A drop zone and file button that uploads one or more files, shows each with a preview, its progress and a way to remove it.

- Basecoat: `btn`, `progress`, `item`, `item-group`, `alert`, `label`
- Route: inside a form or page (no route of its own)
- Needs: Web: `POST /uploads` (multipart, one file per request), `DELETE /uploads/{id}`. No server: files are kept in IndexedDB as Blobs through `store.addFile(file)`, `store.removeFile(id)`. Capability “File uploads”.
- Links to: Gallery (showing what was uploaded), EditForm, ProgressStatus, InlineAlert, Comments (attachments)

## Markup
Copy, never retype: `{harness}/kit/blocks/content/FileUpload.html` (29 lines of HTML).

The `label` wrapping the hidden input makes the whole zone a click target and keeps the native file dialog; `dragover`/`drop` on `#upload-drop` add drag and drop.

## States
- Empty (default): Only the drop zone.
- Dragging over: `#upload-drop` gets `data-dragging` → `border-primary bg-muted/50`; the text becomes `upload.release`.
- Uploading: A row per file with `progress` and `upload.progress`; **Cancel** aborts that file. `#upload-live` says `upload.live.started` once.
- Done: The row shows a thumbnail (images) or the type (`PDF`), size and `upload.done`; **×** removes it.
- Too big / wrong type: The file is not uploaded; its row has `data-state="error"`, the text `upload.error.size` or `upload.error.type` in `text-destructive`, and only **×**.
- Network error: Row text `upload.error.network` + **Retry** (`btn` `data-size="sm"`).
- Limit reached: Over `max` files: the zone is `aria-disabled="true"`, the hint becomes `upload.error.count`.
- Removing: ConfirmDialog only for files already saved with the record; new uploads are removed at once with an Undo toast (DeleteUndo).
- Offline (no server): Nothing changes: files are stored on the device.
- Finished: `upload.live.done` → the `aria-live` line `#upload-live` (“trip-kyoto.jpg uploaded.”).

## Texts
(Key | English | 日本語)
- `upload.drop`: Drop files here or | ここにファイルをドロップするか、
- `upload.choose`: choose files | ファイルを選択
- `upload.choose_phone`: Choose Files | ファイルを選択
- `upload.release`: Release to upload | 離すとアップロードします
- `upload.hint`: Images or PDF, up to 10 MB each | 画像または PDF（1 ファイル 10 MB まで）
- `upload.list`: Uploaded files | アップロードしたファイル
- `upload.progress`: {percent}% · {done} of {total} | {percent}% · {total} 中 {done}
- `upload.done`: {size} · Uploaded | {size} · アップロード完了
- `upload.cancel`: Cancel | キャンセル
- `upload.remove`: Remove {name} | {name} を削除
- `upload.retry`: Retry | 再試行
- `upload.live.started`: Uploading {count} files. | {count} 件のファイルをアップロードしています。
- `upload.live.done`: {name} uploaded. | {name} をアップロードしました。
- `upload.error.size`: Too big: {size}. The limit is 10 MB. | ファイルが大きすぎます（{size}）。上限は 10 MB です。
- `upload.error.type`: This type of file can’t be added. Use an image or a PDF. | この種類のファイルは追加できません。画像か PDF を使ってください。
- `upload.error.network`: Upload stopped. Check your connection and retry. | アップロードが中断しました。接続を確認して再試行してください。
- `upload.error.count`: You can add up to {max} files. | 追加できるファイルは {max} 件までです。

## Keyboard and focus
1. The drop zone (focus is on the hidden input; Space or Return opens the file dialog) → 2. each row's Cancel / Retry / × in list order.
- After removing a file, focus moves to the next row's button, or to the drop zone when the list is empty.
- Progress is announced only at start and end (`#upload-live`), not every percent.

## Phone
- The zone shrinks to `p-6` and says `upload.choose_phone` (“Choose Files” / “ファイルを選択”); drag-and-drop text is hidden below 48rem (`@max-3xl:hidden` on `upload.drop`).
- With `accept="image/*"` the phone offers the camera and photo library.
- Row buttons are 44 px.

## Data
```json
{"files": [{"id": 31, "name": "trip-kyoto.jpg", "type": "image/jpeg", "size": 2516582, "url": "/uploads/31", "thumb": "/uploads/31/thumb.jpg", "state": "done"},
           {"id": null, "name": "field-notes.pdf", "type": "application/pdf", "size": 2621440, "loaded": 1179648, "state": "uploading"}],
 "limits": {"max": 10, "bytes": 10485760, "accept": ["image/*", "application/pdf"]}}
```

- Web: `POST /uploads` (multipart, field `file`) with `XMLHttpRequest` for progress (`upload.onprogress`) → 201 `{"id", "url", "thumb"}`; 413 too big; 415 wrong type. Check size and type on the server too.
- No server: `store.addFile(file)` stores the Blob and returns an id; previews use `URL.createObjectURL(blob)` (revoke when removed).
- Sizes are shown with `Intl.NumberFormat(lang, {style: "unit", unit: "megabyte", maximumFractionDigits: 1})`.

## Don't
- Don't hide the native file input with `display:none` (use `sr-only` so it stays focusable).
- Don't upload before checking size and type on the device.
- Don't show a percentage for files under 1 MB; show the row as done when finished.

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> FileUpload` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
