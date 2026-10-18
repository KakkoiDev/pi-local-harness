# ProductPage

App Block card (Commerce). One product: a picture gallery, the price with sale and stock, variant choices (size, colour), quantity, Add to Cart, and details in an accordion.

- Basecoat: `btn`, `badge`, `button-group`, `input`, `label`, `accordion`, `alert`, `skeleton`
- Route: `/products/<id>`
- Needs: Web: `GET /products/<id>`, `POST /cart`. No server: `store.products.get(id)`, `store.cart.add(id, variant, qty)`
- Links to: ProductGrid, Cart, Toasts, Gallery (full-screen pictures)

## Markup
Copy, never retype: `{harness}/kit/blocks/commerce/ProductPage.html` (33 lines of HTML).

## States
- Default: First picture shown and its thumbnail pressed (`aria-pressed="true"`, `ring-2 ring-ring`). The most common variant is pre-selected only if it is in stock.
- Choosing a variant: Variants are radios in `label.btn data-variant="outline"` (selected: `has-[:checked]:border-primary`). Price, stock line and pictures update for that variant (web: `hx-get="/products/mug?size=M" hx-trigger="change" hx-target="article"`).
- Variant sold out: The radio stays choosable but its label is `opacity-50`; choosing it makes the button **Sold Out** (disabled) and the stock line `product.size_sold_out` with the notify link. Never silently pick another size.
- Low stock: Stock line `shop.low_stock` instead of `product.in_stock`; the quantity `max` is the stock.
- Quantity: Min 1, max 10 or the stock. − is disabled at 1, + at the max. Typing outside the range snaps back on blur.
- Adding: Button `disabled aria-busy="true"`, then a status alert or toast `shop.added_title` with variant, quantity and price, **View Cart** and **Keep Shopping**.
- Loading: Skeleton picture, title, price and button.
- Not found: 404 page with a link back to the shop (EmptyState).

## Texts
(Key | English | 日本語)
- `shop.tax_included`: tax included | 税込
- `shop.sale`: Sale | セール
- `shop.off`: {percent} % off | {percent}%オフ
- `shop.low_stock`: Only {count} left | 残り{count}点
- `shop.sold_out`: Sold Out | 売り切れ
- `shop.notify`: Email Me When It’s Back | 再入荷のお知らせを受け取る
- `shop.add`: Add to Cart | カートに入れる
- `shop.was`: Was {price} | 通常価格 {price}
- `product.size`: Size | サイズ
- `product.size_note`: S 250 ml · M 350 ml · L 450 ml | S 250 ml・M 350 ml・L 450 ml
- `product.quantity`: Quantity | 数量
- `product.less`: One less | 1つ減らす
- `product.more`: One more | 1つ増やす
- `product.pictures`: Pictures | 商品画像
- `product.choose_picture`: Choose a picture | 画像を選ぶ
- `product.picture_n`: Picture {n} | 画像 {n}
- `product.in_stock`: In stock · ships in 1–2 days | 在庫あり・1〜2日で発送
- `product.size_sold_out`: Sold out in this size. | このサイズは売り切れです。
- `product.details`: Details | 商品の詳細
- `product.shipping`: Shipping and returns | 配送と返品
- `product.keep_shopping`: Keep Shopping | 買い物を続ける
- `shop.added_title`: Added to your cart | カートに追加しました
- `shop.view_cart`: View Cart | カートを見る

## Keyboard and focus
1. Thumbnails (each a button: Return or Space shows it) → 2. Size radios (one Tab stop; ← → move) → 3. − / quantity / + → 4. Add to Cart → 5. accordion summaries.
- The main picture is not a stop; opening it full screen is a separate Gallery block.

## Phone
- Pictures first, then everything else, one column. The thumbnail row scrolls sideways (`overflow-x-auto`) if there are more than 4.
- Add to Cart is full width and 44 px (`data-size="lg"`); it is not fixed to the bottom.
- Swiping the main picture is an extra; the thumbnails are the way.

## Data
```json
{"id":"mug","name":{"en":"Ceramic Mug","ja":"陶器のマグカップ"},"price":1650,"was":2200,"currency":"JPY","images":["/static/products/mug-1.webp","/static/products/mug-2.webp"],"variants":[{"size":"S","stock":8},{"size":"M","stock":12},{"size":"L","stock":0}],"max_per_order":10}
```

- `POST /cart` body: `product=mug&size=M&quantity=1`. Answers: 200 + toast fragment and `HX-Trigger: cart-changed`; 409 `{"code": "sold_out"}` re-renders the form in the sold-out state.
- Picture `alt` describes the variant (“blue glaze, 350 ml”), never the file name.

## Don't
- Don’t use a dropdown for two to five variants: radios show every choice and its stock.
- Don’t add a “Buy Now” button that skips the cart.
- Don’t auto-play a picture carousel.
- Don’t write “Hurry!” or countdowns next to low stock.

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> ProductPage` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
