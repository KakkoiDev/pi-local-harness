# Gallery

App Block card (Content). A grid of images that opens each one large in a viewer, with previous/next, its caption and a way to download or delete it.

- Basecoat: `dialog`, `btn`, `button-group`, `empty`, `skeleton`, `badge`
- Route: `/photos` or inside a page (album, product, note)
- Needs: Web: `GET /photos?page=` (grid fragment), `DELETE /photos/{id}`. No server: `store.photos()`, `store.removePhoto(id)`. Images in three sizes: `thumb` (400 px), `large` (1600 px), `original`.
- Links to: FileUpload (adding photos), InfiniteScroll, DeleteUndo, EmptyState, ProductPage (its gallery), AppPortfolio

## Markup
Copy, never retype: `{harness}/kit/blocks/content/Gallery.html` (36 lines of HTML).

Inside a Basecoat dialog the panel's `header` is a column by default; `flex-row` makes it a toolbar row.

Thumbnails have `alt=""` because the button's `aria-label` names the photo; the large image has the real `alt` (the person's description, else the caption).

## States
- Grid (default): Square thumbnails, newest first.
- Loading: 15 `<li><div class="skeleton aspect-square"></div></li>`; more pages load with InfiniteScroll.
- Empty: EmptyState: `gallery.empty.title`, `gallery.empty.body`, **Add Photos** (opens FileUpload).
- Viewer open: `#photo-viewer` with `showModal()`; the URL gets `#photo-51` so Back closes it.
- First / last photo: Previous / Next get `disabled`.
- Image failed: The tile shows `bg-muted` and a broken-image icon with `gallery.error.image`; the viewer shows the same with **Try Again**.
- Deleting: ConfirmDialog is not used: the photo is removed, the viewer moves to the next one and a toast offers **Undo** (DeleteUndo).
- Selecting (optional): A **Select** button turns tiles into checkboxes (`aria-pressed`) with a bar `gallery.selected` + Delete / Download.
- No caption: Only the date and who added it.

## Texts
(Key | English | 日本語)
- `gallery.title`: Kyoto trip | 京都旅行
- `gallery.count`: {count} photos | 写真 {count} 枚
- `gallery.open`: Open photo: {caption}, {n} of {total} | 写真を開く：{caption}（{total} 枚中 {n} 枚目）
- `gallery.position`: {n} of {total} | {n} / {total}
- `gallery.previous`: Previous photo | 前の写真
- `gallery.next`: Next photo | 次の写真
- `gallery.download`: Download | ダウンロード
- `gallery.delete`: Delete | 削除
- `gallery.close`: Close | 閉じる
- `gallery.deleted`: Photo deleted. | 写真を削除しました。
- `gallery.undo`: Undo | 元に戻す
- `gallery.empty.title`: No photos yet | まだ写真がありません
- `gallery.empty.body`: Add photos from your computer or phone. | パソコンやスマートフォンから写真を追加しましょう。
- `gallery.add`: Add Photos | 写真を追加
- `gallery.error.image`: This photo couldn’t load. | この写真を読み込めませんでした。
- `gallery.select`: Select | 選択
- `gallery.selected`: {count} selected | {count} 枚を選択中

## Keyboard and focus
1. Each thumbnail in reading order (Tab), Return/Space opens it.
- In the viewer: ← → previous/next, Esc closes (focus returns to the thumbnail it opened from, which follows ← → so the grid keeps the place), Delete key deletes (with Undo), Tab cycles Download → Delete → Close → Previous → Next.
- Focus starts on the Close button when the viewer opens.

## Phone
- Three columns, 4 px gaps, edge to edge (`p-0` on the section's grid is fine).
- The viewer fills the screen (its inner `div` gets `@max-3xl:max-w-none @max-3xl:h-dvh @max-3xl:rounded-none`); swipe left/right changes photo, swipe down closes; the ‹ › buttons stay as 44 px buttons at the bottom corners.
- Download uses the share sheet where the browser offers it.

## Data
```json
{"photos": [{"id": 51, "thumb": "/photos/51/thumb.jpg", "large": "/photos/51/large.jpg", "original": "/photos/51/original.jpg",
             "width": 4032, "height": 3024, "caption": "Fushimi Inari gates", "alt": "Orange torii gates along a path at Fushimi Inari",
             "taken_at": "2026-10-12", "added_by": "Aiko"}],
 "total": 24, "next_page": 2}
```

- Web: thumbnails and large sizes are made on upload; `GET /photos?page=2` returns more `<li>`s.
- No server: thumbnails are made in the browser with a canvas (`createImageBitmap`, 400 px longest side, JPEG 0.8) and stored next to the original Blob.

## Don't
- Don't load the original images in the grid.
- Don't build a carousel that slides on its own.
- Don't crop the large image; only thumbnails are cropped square.

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> Gallery` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
