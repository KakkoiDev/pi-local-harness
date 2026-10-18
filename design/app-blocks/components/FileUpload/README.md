# FileUpload

A drop zone and file button that uploads one or more files, shows each with a preview, its progress and a way to remove it.

| | |
| --- | --- |
| Group | Content |
| Basecoat | `btn`, `progress`, `item`, `item-group`, `alert`, `label` |
| Route | inside a form or page (no route of its own) |
| Needs | Web: `POST /uploads` (multipart, one file per request), `DELETE /uploads/{id}`. No server: files are kept in IndexedDB as Blobs through `store.addFile(file)`, `store.removeFile(id)`. Capability “File uploads”. |
| Links to | Gallery (showing what was uploaded), EditForm, ProgressStatus, InlineAlert, Comments (attachments) |

## Markup

```html
<div class="grid gap-3" id="upload">
  <label for="upload-input" id="upload-drop"
    class="grid cursor-pointer place-items-center gap-2 rounded-lg border-2 border-dashed p-8 text-center hover:bg-muted/50 focus-within:ring-[3px] focus-within:ring-ring/50">
    <svg class="size-8 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12"/><path d="m17 8-5-5-5 5"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/></svg>
    <span class="font-medium"><span data-t="upload.drop">Drop files here or</span> <span class="underline underline-offset-4" data-t="upload.choose">choose files</span></span>
    <span class="text-muted-foreground text-sm" id="upload-hint" data-t="upload.hint">Images or PDF, up to 10 MB each</span>
    <input id="upload-input" class="sr-only" type="file" name="files" multiple accept="image/*,application/pdf" aria-describedby="upload-hint">
  </label>
  <p id="upload-live" class="sr-only" aria-live="polite"></p>
  <ul class="item-group" id="upload-list" aria-label="Uploaded files" data-t-label="upload.list">
    <li class="item" data-variant="outline" data-state="done">
      <figure><img src="/uploads/31/thumb.jpg" alt="" class="size-10 rounded object-cover"></figure>
      <section>
        <h3 class="truncate">trip-kyoto.jpg</h3>
        <p data-t="upload.done">2.4 MB · Uploaded</p>
      </section>
      <aside><button class="btn" data-variant="ghost" data-size="icon-sm" type="button" aria-label="Remove trip-kyoto.jpg">×</button></aside>
    </li>
    <li class="item" data-variant="outline" data-state="uploading">
      <figure><span class="grid size-10 place-items-center rounded bg-muted text-xs">PDF</span></figure>
      <section class="grid gap-1">
        <h3 class="truncate">field-notes.pdf</h3>
        <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="45" aria-label="Uploading field-notes.pdf"><span style="width: 45%"></span></div>
        <p data-t="upload.progress">45% · 1.1 of 2.5 MB</p>
      </section>
      <aside><button class="btn" data-variant="ghost" data-size="sm" type="button" data-t="upload.cancel">Cancel</button></aside>
    </li>
  </ul>
</div>
```

The `label` wrapping the hidden input makes the whole zone a click target and keeps the native file dialog; `dragover`/`drop` on `#upload-drop` add drag and drop.

## States

| State | What changes |
| --- | --- |
| Empty (default) | Only the drop zone. |
| Dragging over | `#upload-drop` gets `data-dragging` → `border-primary bg-muted/50`; the text becomes `upload.release`. |
| Uploading | A row per file with `progress` and `upload.progress`; **Cancel** aborts that file. `#upload-live` says `upload.live.started` once. |
| Done | The row shows a thumbnail (images) or the type (`PDF`), size and `upload.done`; **×** removes it. |
| Too big / wrong type | The file is not uploaded; its row has `data-state="error"`, the text `upload.error.size` or `upload.error.type` in `text-destructive`, and only **×**. |
| Network error | Row text `upload.error.network` + **Retry** (`btn` `data-size="sm"`). |
| Limit reached | Over `max` files: the zone is `aria-disabled="true"`, the hint becomes `upload.error.count`. |
| Removing | ConfirmDialog only for files already saved with the record; new uploads are removed at once with an Undo toast (DeleteUndo). |
| Offline (no server) | Nothing changes: files are stored on the device. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `upload.drop` | Drop files here or | ここにファイルをドロップするか、 |
| `upload.choose` | choose files | ファイルを選択 |
| `upload.choose_phone` | Choose Files | ファイルを選択 |
| `upload.release` | Release to upload | 離すとアップロードします |
| `upload.hint` | Images or PDF, up to 10 MB each | 画像または PDF（1 ファイル 10 MB まで） |
| `upload.list` | Uploaded files | アップロードしたファイル |
| `upload.progress` | {percent}% · {done} of {total} | {percent}% · {total} 中 {done} |
| `upload.done` | {size} · Uploaded | {size} · アップロード完了 |
| `upload.cancel` | Cancel | キャンセル |
| `upload.remove` | Remove {name} | {name} を削除 |
| `upload.retry` | Retry | 再試行 |
| `upload.live.started` | Uploading {count} files. | {count} 件のファイルをアップロードしています。 |
| `upload.live.done` | {name} uploaded. | {name} をアップロードしました。 |
| `upload.error.size` | Too big: {size}. The limit is 10 MB. | ファイルが大きすぎます（{size}）。上限は 10 MB です。 |
| `upload.error.type` | This type of file can’t be added. Use an image or a PDF. | この種類のファイルは追加できません。画像か PDF を使ってください。 |
| `upload.error.network` | Upload stopped. Check your connection and retry. | アップロードが中断しました。接続を確認して再試行してください。 |
| `upload.error.count` | You can add up to {max} files. | 追加できるファイルは {max} 件までです。 |

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
