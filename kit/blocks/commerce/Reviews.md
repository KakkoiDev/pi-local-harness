# Reviews

App Block card (Commerce). Star ratings and written reviews for a product: the summary, the list with helpful votes and the shop’s replies, and the form to write one.

- Basecoat: `btn`, `badge`, `card`, `field`, `fieldset`, `label`, `input`, `textarea`, `select`, `progress`, `alert`, `empty`
- Route: Part of `/products/<slug>` (below ProductPage)
- Needs: Web: `GET/POST /products/<slug>/reviews`, `POST /reviews/<id>/helpful`; needs a server and Log in and accounts
- Links to: ProductPage, LoadingState, EmptyState, InfiniteScroll, Toasts; used in AppShop

## Markup
Copy, never retype: `{harness}/kit/blocks/commerce/Reviews.html` (76 lines of HTML).

- The summary's big number and the five bars come from the same counts (`summary` in Data); each bar is a Basecoat `progress` with its own label.
- Stars are text in `role="img"` with the number in `aria-label`, never only colour. Filled stars use the text colour, empty ones `text-muted-foreground opacity-40`.
- The rating field is a real radio group (`fieldset` + `legend`, five `input type="radio"` hidden with `sr-only`, each inside a `btn`-styled label that turns `bg-primary` when checked), so arrow keys move between ratings.
- **Write a Review** toggles the form (`hidden`, `aria-expanded`); it scrolls into view and focus goes to the first rating.
- The shop's reply sits inside the review it answers, in a `bg-muted` box headed `reviews.reply_from`.

## States
- Loading: The summary and three review rows are LoadingState skeletons; the Write button stays.
- No reviews: The summary and list are replaced by the empty block (`reviews.empty_title`, `reviews.empty_text`, Write a Review).
- Not bought: The Write button is replaced by `<p class="text-sm text-muted-foreground" data-t="reviews.only_buyers">`.
- Form errors: The alert at the top of the form lists each problem as a link (`reviews.error.summary` with the count); the rating fieldset and the textarea get `aria-invalid="true"` and their message (`reviews.error.rating`, `reviews.error.body_short` with the count so far, `reviews.error.title_long`). Focus moves to the alert.
- Posting: Submit gets `disabled aria-busy="true"` and the text `reviews.form.sending`.
- Posted: The form closes; toast: `reviews.posted` (or `reviews.pending` when the shop approves reviews first). A posted review is added at the top of the list with its own Verified purchase badge.
- Helpful: Pressing toggles `aria-pressed="true"` and adds one to the count in `reviews.helpful`; pressing again takes it back. One vote per person.
- Couldn’t load: The list area shows the destructive alert `reviews.error.load` with **Try Again**.
- Many reviews: 10 at a time; **Show N More Reviews** (`reviews.more`) loads the next 10 at the end of the list (InfiniteScroll’s button version).

## Texts
(Key | English | 日本語)
- `reviews.title`: Reviews | レビュー
- `reviews.average`: {rating} out of 5 | 5点中 {rating}
- `reviews.count`: {count} reviews | {count}件のレビュー
- `reviews.stars_label`: {n} out of 5 stars | 5点中 {n}点
- `reviews.bar_label`: {n} stars: {count} reviews | 星{n}つ：{count}件
- `reviews.sort`: Sort | 並べ替え
- `reviews.sort_recent`: Most recent | 新しい順
- `reviews.sort_helpful`: Most helpful | 参考になった順
- `reviews.sort_low`: Lowest rating first | 評価が低い順
- `reviews.write`: Write a Review | レビューを書く
- `reviews.verified`: Verified purchase | 購入者のレビュー
- `reviews.helpful`: Helpful ({count}) | 参考になった（{count}）
- `reviews.reply_from`: Reply from {shop} | {shop}からの返信
- `reviews.more`: Show {count} More Reviews | さらに{count}件を表示
- `reviews.form.title`: Write a review | レビューを書く
- `reviews.form.rating`: Your rating | あなたの評価
- `reviews.form.star`: {n} ★ | {n} ★
- `reviews.form.headline`: Title | タイトル
- `reviews.form.body`: Your review | レビュー
- `reviews.form.body_hint`: What did you like, or not? At least 20 characters. | 良かった点や気になった点を教えてください。20文字以上。
- `reviews.form.shown_as`: Shown as {name} | {name}として表示されます
- `reviews.form.submit`: Post Review | レビューを投稿
- `reviews.form.cancel`: Cancel | キャンセル
- `reviews.form.sending`: Posting… | 投稿中…
- `reviews.error.summary`: Fix {count} things before posting | 投稿する前に{count}か所を直してください
- `reviews.error.rating`: Choose a rating from 1 to 5 stars. | 星1〜5で評価を選んでください。
- `reviews.error.title_long`: Keep the title under 80 characters. | タイトルは80文字以内にしてください。
- `reviews.error.body_short`: Write at least 20 characters ({count} so far). | 20文字以上で書いてください（現在{count}文字）。
- `reviews.posted`: Thanks. Your review is up. | ありがとうございます。レビューを公開しました。
- `reviews.pending`: Thanks. Your review appears after the shop checks it, usually within a day. | ありがとうございます。ショップの確認後に表示されます（通常1日以内）。
- `reviews.empty_title`: No reviews yet | レビューはまだありません
- `reviews.empty_text`: Bought this? Be the first to say what you think. | 購入された方は、最初のレビューを書いてみませんか。
- `reviews.only_buyers`: Only people who bought this can review it. | レビューを書けるのは、この商品を購入した方だけです。
- `reviews.error.load`: Couldn’t load the reviews. Check your connection and try again. | レビューを読み込めませんでした。接続を確認して、もう一度お試しください。
- `reviews.retry`: Try Again | もう一度試す

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

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> Reviews` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
