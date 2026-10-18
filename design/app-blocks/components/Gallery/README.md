# Gallery

A grid of images that opens each one large in a viewer, with previous/next, its caption and a way to download or delete it.

| | |
| --- | --- |
| Group | Content |
| Basecoat | `dialog`, `btn`, `button-group`, `empty`, `skeleton`, `badge` |
| Route | `/photos` or inside a page (album, product, note) |
| Needs | Web: `GET /photos?page=` (grid fragment), `DELETE /photos/{id}`. No server: `store.photos()`, `store.removePhoto(id)`. Images in three sizes: `thumb` (400 px), `large` (1600 px), `original`. |
| Links to | FileUpload (adding photos), InfiniteScroll, DeleteUndo, EmptyState, ProductPage (its gallery), AppPortfolio |

## Markup

```html
<section class="app grid gap-4 p-4 @3xl:p-8" aria-labelledby="gallery-title">
  <header class="flex items-center justify-between gap-2">
    <h1 id="gallery-title" class="text-xl font-semibold @3xl:text-2xl" data-t="gallery.title">Kyoto trip</h1>
    <span class="text-muted-foreground text-sm" data-t="gallery.count">24 photos</span>
  </header>
  <ul class="grid grid-cols-3 gap-1 @3xl:grid-cols-5 @3xl:gap-2" id="gallery-grid">
    <li>
      <button class="block aspect-square w-full overflow-hidden rounded-md focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none" type="button"
        data-photo="51" aria-label="Open photo: Fushimi Inari gates, 1 of 24" data-t-label="gallery.open" onclick="openPhoto(51)">
        <img class="size-full object-cover" src="/photos/51/thumb.jpg" alt="" loading="lazy" decoding="async" width="400" height="400">
      </button>
    </li>
  </ul>
</section>

<dialog id="photo-viewer" class="dialog" aria-labelledby="photo-caption" onclick="if (event.target === this) this.close()">
  <div class="grid w-full max-w-4xl gap-0 overflow-hidden p-0">
    <header class="flex-row items-center justify-between gap-2 p-3">
      <p class="text-muted-foreground text-sm tabular-nums" data-t="gallery.position">1 of 24</p>
      <div class="flex gap-1">
        <a class="btn" data-variant="ghost" data-size="sm" href="/photos/51/original" download data-t="gallery.download">Download</a>
        <button class="btn" data-variant="ghost" data-size="sm" type="button" data-t="gallery.delete">Delete</button>
        <button class="btn" data-variant="ghost" data-size="icon-sm" type="button" aria-label="Close" data-t-label="gallery.close" onclick="this.closest('dialog').close()">×</button>
      </div>
    </header>
    <figure class="relative grid place-items-center bg-muted">
      <img id="photo-large" class="max-h-[75dvh] w-auto object-contain" src="/photos/51/large.jpg" alt="Orange torii gates along a path at Fushimi Inari">
      <button class="btn absolute left-2 top-1/2 -translate-y-1/2" data-variant="secondary" data-size="icon" type="button" aria-label="Previous photo" data-t-label="gallery.previous">‹</button>
      <button class="btn absolute right-2 top-1/2 -translate-y-1/2" data-variant="secondary" data-size="icon" type="button" aria-label="Next photo" data-t-label="gallery.next">›</button>
    </figure>
    <figcaption id="photo-caption" class="grid gap-1 p-4">
      <span class="font-medium">Fushimi Inari gates</span>
      <span class="text-muted-foreground text-sm">12 Oct 2026 · Aiko</span>
    </figcaption>
  </div>
</dialog>
```

Inside a Basecoat dialog the panel's `header` is a column by default; `flex-row` makes it a toolbar row.

Thumbnails have `alt=""` because the button's `aria-label` names the photo; the large image has the real `alt` (the person's description, else the caption).

## States

| State | What changes |
| --- | --- |
| Grid (default) | Square thumbnails, newest first. |
| Loading | 15 `<li><div class="skeleton aspect-square"></div></li>`; more pages load with InfiniteScroll. |
| Empty | EmptyState: `gallery.empty.title`, `gallery.empty.body`, **Add Photos** (opens FileUpload). |
| Viewer open | `#photo-viewer` with `showModal()`; the URL gets `#photo-51` so Back closes it. |
| First / last photo | Previous / Next get `disabled`. |
| Image failed | The tile shows `bg-muted` and a broken-image icon with `gallery.error.image`; the viewer shows the same with **Try Again**. |
| Deleting | ConfirmDialog is not used: the photo is removed, the viewer moves to the next one and a toast offers **Undo** (DeleteUndo). |
| Selecting (optional) | A **Select** button turns tiles into checkboxes (`aria-pressed`) with a bar `gallery.selected` + Delete / Download. |
| No caption | Only the date and who added it. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `gallery.title` | Kyoto trip | 京都旅行 |
| `gallery.count` | {count} photos | 写真 {count} 枚 |
| `gallery.open` | Open photo: {caption}, {n} of {total} | 写真を開く：{caption}（{total} 枚中 {n} 枚目） |
| `gallery.position` | {n} of {total} | {n} / {total} |
| `gallery.previous` | Previous photo | 前の写真 |
| `gallery.next` | Next photo | 次の写真 |
| `gallery.download` | Download | ダウンロード |
| `gallery.delete` | Delete | 削除 |
| `gallery.close` | Close | 閉じる |
| `gallery.deleted` | Photo deleted. | 写真を削除しました。 |
| `gallery.undo` | Undo | 元に戻す |
| `gallery.empty.title` | No photos yet | まだ写真がありません |
| `gallery.empty.body` | Add photos from your computer or phone. | パソコンやスマートフォンから写真を追加しましょう。 |
| `gallery.add` | Add Photos | 写真を追加 |
| `gallery.error.image` | This photo couldn’t load. | この写真を読み込めませんでした。 |
| `gallery.select` | Select | 選択 |
| `gallery.selected` | {count} selected | {count} 枚を選択中 |

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
