# Reviews

Star ratings and written reviews for a product: the summary, the list with helpful votes and the shop’s replies, and the form to write one.

| | |
| --- | --- |
| Group | Commerce |
| Basecoat | `btn`, `badge`, `card`, `field`, `fieldset`, `label`, `input`, `textarea`, `select`, `progress`, `alert`, `empty` |
| Route | Part of `/products/<slug>` (below ProductPage) |
| Needs | Web: `GET/POST /products/<slug>/reviews`, `POST /reviews/<id>/helpful`; needs a server and Log in and accounts |
| Links to | ProductPage, LoadingState, EmptyState, InfiniteScroll, Toasts; used in AppShop |

## Markup

```html
<section id="reviews" class="grid gap-6" aria-labelledby="reviews-title">
  <div class="flex flex-wrap items-center justify-between gap-3">
    <h2 id="reviews-title" class="text-xl font-semibold" data-t="reviews.title">Reviews</h2>
    <button class="btn" data-variant="outline" type="button" aria-expanded="false" aria-controls="review-form" data-t="reviews.write">Write a Review</button>
  </div>
  <div class="grid gap-6 @3xl:grid-cols-[14rem_1fr] @3xl:items-center">
    <div class="grid gap-1">
      <p class="text-4xl font-semibold tabular-nums" data-t="reviews.average">4.6 out of 5</p>
      <p class="text-sm tracking-wide" role="img" aria-label="5 out of 5 stars" data-t-label="reviews.stars_label">★★★★★<span class="text-muted-foreground opacity-40"></span></p>
      <p class="text-sm text-muted-foreground" data-t="reviews.count">128 reviews</p>
    </div>
    <ol class="grid gap-1.5" aria-label="Reviews"><li class="grid grid-cols-[3rem_1fr_2.5rem] items-center gap-2 text-sm"><span>5 ★</span><div class="progress" role="progressbar" aria-valuenow="82" aria-valuemin="0" aria-valuemax="128" aria-label="5 stars: 82 reviews" data-t-label="reviews.bar_label"><span style="width: 64%"></span></div><span class="text-right tabular-nums text-muted-foreground">82</span></li><li class="grid grid-cols-[3rem_1fr_2.5rem] items-center gap-2 text-sm"><span>4 ★</span><div class="progress" role="progressbar" aria-valuenow="28" aria-valuemin="0" aria-valuemax="128" aria-label="4 stars: 28 reviews" data-t-label="reviews.bar_label"><span style="width: 22%"></span></div><span class="text-right tabular-nums text-muted-foreground">28</span></li><li class="grid grid-cols-[3rem_1fr_2.5rem] items-center gap-2 text-sm"><span>3 ★</span><div class="progress" role="progressbar" aria-valuenow="10" aria-valuemin="0" aria-valuemax="128" aria-label="3 stars: 10 reviews" data-t-label="reviews.bar_label"><span style="width: 8%"></span></div><span class="text-right tabular-nums text-muted-foreground">10</span></li><li class="grid grid-cols-[3rem_1fr_2.5rem] items-center gap-2 text-sm"><span>2 ★</span><div class="progress" role="progressbar" aria-valuenow="5" aria-valuemin="0" aria-valuemax="128" aria-label="2 stars: 5 reviews" data-t-label="reviews.bar_label"><span style="width: 4%"></span></div><span class="text-right tabular-nums text-muted-foreground">5</span></li><li class="grid grid-cols-[3rem_1fr_2.5rem] items-center gap-2 text-sm"><span>1 ★</span><div class="progress" role="progressbar" aria-valuenow="3" aria-valuemin="0" aria-valuemax="128" aria-label="1 stars: 3 reviews" data-t-label="reviews.bar_label"><span style="width: 2%"></span></div><span class="text-right tabular-nums text-muted-foreground">3</span></li></ol>
  </div>
  <form id="review-form" class="card" hidden method="post" action="/products/ceramic-mug/reviews" novalidate>
    <header><h3 class="text-lg font-semibold" data-t="reviews.form.title">Write a review</h3><p class="text-sm text-muted-foreground" data-t="reviews.form.shown_as">Shown as Aiko K.</p></header>
    <section class="grid gap-4">
      <fieldset class="fieldset" id="rv-rating">
        <legend class="label" data-t="reviews.form.rating">Your rating</legend>
        <div class="flex flex-wrap gap-2"><label class="btn has-[:checked]:bg-primary has-[:checked]:text-primary-foreground" data-variant="outline" data-size="sm"><input class="sr-only" type="radio" name="rating" value="1" aria-label="1 out of 5 stars" data-t-label="reviews.stars_label"><span aria-hidden="true" data-t="reviews.form.star">1 ★</span></label><label class="btn has-[:checked]:bg-primary has-[:checked]:text-primary-foreground" data-variant="outline" data-size="sm"><input class="sr-only" type="radio" name="rating" value="2" aria-label="2 out of 5 stars" data-t-label="reviews.stars_label"><span aria-hidden="true" data-t="reviews.form.star">2 ★</span></label><label class="btn has-[:checked]:bg-primary has-[:checked]:text-primary-foreground" data-variant="outline" data-size="sm"><input class="sr-only" type="radio" name="rating" value="3" aria-label="3 out of 5 stars" data-t-label="reviews.stars_label"><span aria-hidden="true" data-t="reviews.form.star">3 ★</span></label><label class="btn has-[:checked]:bg-primary has-[:checked]:text-primary-foreground" data-variant="outline" data-size="sm"><input class="sr-only" type="radio" name="rating" value="4" checked aria-label="4 out of 5 stars" data-t-label="reviews.stars_label"><span aria-hidden="true" data-t="reviews.form.star">4 ★</span></label><label class="btn has-[:checked]:bg-primary has-[:checked]:text-primary-foreground" data-variant="outline" data-size="sm"><input class="sr-only" type="radio" name="rating" value="5" aria-label="5 out of 5 stars" data-t-label="reviews.stars_label"><span aria-hidden="true" data-t="reviews.form.star">5 ★</span></label></div>
        
      </fieldset>
      <div class="field">
        <label class="label" for="rv-title" data-t="reviews.form.headline">Title</label>
        <input class="input" id="rv-title" name="title" maxlength="120">
      </div>
      <div class="field">
        <label class="label" for="rv-body" data-t="reviews.form.body">Your review</label>
        <textarea class="textarea min-h-28" id="rv-body" name="body" aria-describedby="rv-body-hint"></textarea>
        <p class="text-muted-foreground text-sm" id="rv-body-hint" data-t="reviews.form.body_hint">What did you like, or not? At least 20 characters.</p>
        
      </div>
    </section>
    <footer class="flex flex-wrap justify-end gap-2">
      <button class="btn" data-variant="outline" type="button" data-t="reviews.form.cancel">Cancel</button>
      <button class="btn" type="submit" data-t="reviews.form.submit">Post Review</button>
    </footer>
  </form>
  <div class="flex items-center gap-2">
    <label class="label" for="reviews-sort" data-t="reviews.sort">Sort</label>
    <select class="select" id="reviews-sort" name="sort">
      <option value="recent" data-t="reviews.sort_recent">Most recent</option>
      <option value="helpful" data-t="reviews.sort_helpful">Most helpful</option>
      <option value="low" data-t="reviews.sort_low">Lowest rating first</option>
    </select>
  </div>
  <ol class="grid gap-4" aria-live="polite">
      <li id="review-301">
        <article class="grid gap-1.5 border-b pb-4">
          <p class="text-sm tracking-wide" role="img" aria-label="5 out of 5 stars" data-t-label="reviews.stars_label">★★★★★<span class="text-muted-foreground opacity-40"></span></p>
          <h3 class="font-medium">Holds heat, feels good in the hand</h3>
          <p class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground"><span>Aiko Kato</span><time datetime="2026-10-12">12 Oct 2026</time><span class="badge" data-variant="secondary" data-t="reviews.verified">Verified purchase</span></p>
          <p class="text-sm leading-relaxed">Bought two. The glaze is slightly different on each, which I like. Tea stays warm for a long time.</p>
          <div><button class="btn" data-variant="outline" data-size="sm" type="button" aria-pressed="false" data-t="reviews.helpful"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/></svg>Helpful (14)</button></div>
        </article>
      </li>
      <li id="review-302">
        <article class="grid gap-1.5 border-b pb-4">
          <p class="text-sm tracking-wide" role="img" aria-label="3 out of 5 stars" data-t-label="reviews.stars_label">★★★<span class="text-muted-foreground opacity-40">★★</span></p>
          <h3 class="font-medium">Smaller than I expected</h3>
          <p class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground"><span>Ren Sato</span><time datetime="2026-10-03">3 Oct 2026</time></p>
          <p class="text-sm leading-relaxed">Nice mug, but 250 ml is a short coffee for me. Check the size before you buy.</p>
          <div class="mt-2 grid gap-1 rounded-md bg-muted p-3 text-sm">
            <p class="font-medium" data-t="reviews.reply_from">Reply from Komorebi Goods</p>
            <p>Thank you, Ren. We’ve added the size in millilitres to the top of the page.</p>
          </div>
          <div><button class="btn" data-variant="outline" data-size="sm" type="button" aria-pressed="false" data-t="reviews.helpful"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/></svg>Helpful (6)</button></div>
        </article>
      </li>
  </ol>
  <button class="btn justify-self-start" data-variant="ghost" type="button" data-t="reviews.more">Show 10 More Reviews</button>
</section>

<!-- the form after a failed submit: this alert at the top, each field with its message -->
<div class="alert" data-variant="destructive" role="alert" tabindex="-1"><h2 data-t="reviews.error.summary">Fix 2 things before posting</h2><section><ul class="list-disc pl-4"><li><a class="underline" href="#rv-rating" data-t="reviews.error.rating">Choose a rating from 1 to 5 stars.</a></li><li><a class="underline" href="#rv-body" data-t="reviews.error.body_short">Write at least 20 characters (12 so far).</a></li></ul></section></div>

<!-- toast after posting: reviews.posted, or reviews.pending when the shop checks reviews first -->
```

- The summary's big number and the five bars come from the same counts (`summary` in Data); each bar is a Basecoat `progress` with its own label.
- Stars are text in `role="img"` with the number in `aria-label`, never only colour. Filled stars use the text colour, empty ones `text-muted-foreground opacity-40`.
- The rating field is a real radio group (`fieldset` + `legend`, five `input type="radio"` hidden with `sr-only`, each inside a `btn`-styled label that turns `bg-primary` when checked), so arrow keys move between ratings.
- **Write a Review** toggles the form (`hidden`, `aria-expanded`); it scrolls into view and focus goes to the first rating.
- The shop's reply sits inside the review it answers, in a `bg-muted` box headed `reviews.reply_from`.

## States

| State | What changes |
| --- | --- |
| Loading | The summary and three review rows are LoadingState skeletons; the Write button stays. |
| No reviews | The summary and list are replaced by the empty block (`reviews.empty_title`, `reviews.empty_text`, Write a Review). |
| Not bought | The Write button is replaced by `<p class="text-sm text-muted-foreground" data-t="reviews.only_buyers">`. |
| Form errors | The alert at the top of the form lists each problem as a link (`reviews.error.summary` with the count); the rating fieldset and the textarea get `aria-invalid="true"` and their message (`reviews.error.rating`, `reviews.error.body_short` with the count so far, `reviews.error.title_long`). Focus moves to the alert. |
| Posting | Submit gets `disabled aria-busy="true"` and the text `reviews.form.sending`. |
| Posted | The form closes; toast: `reviews.posted` (or `reviews.pending` when the shop approves reviews first). A posted review is added at the top of the list with its own Verified purchase badge. |
| Helpful | Pressing toggles `aria-pressed="true"` and adds one to the count in `reviews.helpful`; pressing again takes it back. One vote per person. |
| Couldn’t load | The list area shows the destructive alert `reviews.error.load` with **Try Again**. |
| Many reviews | 10 at a time; **Show N More Reviews** (`reviews.more`) loads the next 10 at the end of the list (InfiniteScroll’s button version). |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `reviews.title` | Reviews | レビュー |
| `reviews.average` | {rating} out of 5 | 5点中 {rating} |
| `reviews.count` | {count} reviews | {count}件のレビュー |
| `reviews.stars_label` | {n} out of 5 stars | 5点中 {n}点 |
| `reviews.bar_label` | {n} stars: {count} reviews | 星{n}つ：{count}件 |
| `reviews.sort` | Sort | 並べ替え |
| `reviews.sort_recent` | Most recent | 新しい順 |
| `reviews.sort_helpful` | Most helpful | 参考になった順 |
| `reviews.sort_low` | Lowest rating first | 評価が低い順 |
| `reviews.write` | Write a Review | レビューを書く |
| `reviews.verified` | Verified purchase | 購入者のレビュー |
| `reviews.helpful` | Helpful ({count}) | 参考になった（{count}） |
| `reviews.reply_from` | Reply from {shop} | {shop}からの返信 |
| `reviews.more` | Show {count} More Reviews | さらに{count}件を表示 |
| `reviews.form.title` | Write a review | レビューを書く |
| `reviews.form.rating` | Your rating | あなたの評価 |
| `reviews.form.star` | {n} ★ | {n} ★ |
| `reviews.form.headline` | Title | タイトル |
| `reviews.form.body` | Your review | レビュー |
| `reviews.form.body_hint` | What did you like, or not? At least 20 characters. | 良かった点や気になった点を教えてください。20文字以上。 |
| `reviews.form.shown_as` | Shown as {name} | {name}として表示されます |
| `reviews.form.submit` | Post Review | レビューを投稿 |
| `reviews.form.cancel` | Cancel | キャンセル |
| `reviews.form.sending` | Posting… | 投稿中… |
| `reviews.error.summary` | Fix {count} things before posting | 投稿する前に{count}か所を直してください |
| `reviews.error.rating` | Choose a rating from 1 to 5 stars. | 星1〜5で評価を選んでください。 |
| `reviews.error.title_long` | Keep the title under 80 characters. | タイトルは80文字以内にしてください。 |
| `reviews.error.body_short` | Write at least 20 characters ({count} so far). | 20文字以上で書いてください（現在{count}文字）。 |
| `reviews.posted` | Thanks. Your review is up. | ありがとうございます。レビューを公開しました。 |
| `reviews.pending` | Thanks. Your review appears after the shop checks it, usually within a day. | ありがとうございます。ショップの確認後に表示されます（通常1日以内）。 |
| `reviews.empty_title` | No reviews yet | レビューはまだありません |
| `reviews.empty_text` | Bought this? Be the first to say what you think. | 購入された方は、最初のレビューを書いてみませんか。 |
| `reviews.only_buyers` | Only people who bought this can review it. | レビューを書けるのは、この商品を購入した方だけです。 |
| `reviews.error.load` | Couldn’t load the reviews. Check your connection and try again. | レビューを読み込めませんでした。接続を確認して、もう一度お試しください。 |
| `reviews.retry` | Try Again | もう一度試す |

## Keyboard and focus

1. Write a Review → 2. Sort → 3. each review's Helpful → 4. Show More.
- In the form: the rating group (arrows choose 1–5) → Title → Your review → Cancel → Post Review. Return in Title submits.
- Opening the form moves focus to the checked rating (or the first); Cancel closes it and returns focus to Write a Review.

## Phone

- The summary stacks: the big number and stars, then the bars full width.
- The rating buttons wrap to two rows if needed; each is 44 px tall.
- The form opens in place (not a sheet) so the reviews stay below it.

## Data

```json
{"summary": {"average": 4.6, "count": 128, "by_stars": {"5": 82, "4": 28, "3": 10, "2": 5, "1": 3}},
 "reviews": [{"id": 301, "rating": 5, "title": "Holds heat, feels good in the hand", "body": "…", "author": "Aiko Kato",
   "created": "2026-10-12", "verified": true, "helpful": 14, "voted": false,
   "reply": null}],
 "can_review": true, "moderated": false}
```

- Web: `GET /products/<slug>/reviews?sort=recent&page=2` (htmx fragment of `<li>`s); `POST /products/<slug>/reviews` → 201 with the new `<li>`, or 422 with the form fragment in its error state; `POST /reviews/<id>/helpful` toggles the vote. Needs a server and Log in and accounts (only buyers review).
- No server: reviews can't be shared between people; show them read-only from a bundled JSON file, without the form.

## Don't

- Don't colour stars yellow or rely on colour; the number is always in the label.
- Don't show the form to people who haven't bought the product, and don't let one person vote twice.
- Don't invent a 0.5-star display; round the average to one decimal and show whole stars.
