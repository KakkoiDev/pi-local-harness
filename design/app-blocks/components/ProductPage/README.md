# ProductPage

One product: a picture gallery, the price with sale and stock, variant choices (size, colour), quantity, Add to Cart, and details in an accordion.

| | |
| --- | --- |
| Group | Commerce |
| Basecoat | `btn`, `badge`, `button-group`, `input`, `label`, `accordion`, `alert`, `skeleton` |
| Route | `/products/<id>` |
| Needs | Web: `GET /products/<id>`, `POST /cart`. No server: `store.products.get(id)`, `store.cart.add(id, variant, qty)` |
| Links to | ProductGrid, Cart, Toasts, Gallery (full-screen pictures) |

## Markup

```html
<article class="grid gap-6 @3xl:grid-cols-2" aria-labelledby="product-title">
  <section class="grid content-start gap-3" aria-label="Pictures" data-t-label="product.pictures">
    <img id="main-image" src="/static/products/mug.webp" alt="Ceramic Mug, blue glaze, 350 ml" class="aspect-square w-full rounded-xl object-cover">
    <div class="flex items-start gap-2 overflow-x-auto" role="group" aria-label="Choose a picture" data-t-label="product.choose_picture"><button type="button" class="overflow-hidden rounded-md border ring-2 ring-ring" aria-label="Picture 1" aria-pressed="true"><img src="/static/products/mug.webp" alt="" class="size-16 object-cover"></button><button type="button" class="overflow-hidden rounded-md border " aria-label="Picture 2" aria-pressed="false"><img src="/static/products/mug.webp" alt="" class="size-16 object-cover"></button><button type="button" class="overflow-hidden rounded-md border " aria-label="Picture 3" aria-pressed="false"><img src="/static/products/mug.webp" alt="" class="size-16 object-cover"></button></div>
  </section>
  <section class="grid content-start gap-4">
    <div class="flex flex-wrap gap-1"><span class="badge" data-variant="destructive" data-t="shop.off">25 % off</span></div>
    <h1 id="product-title" class="text-2xl font-semibold">Ceramic Mug</h1>
    <p class="text-xl font-semibold tabular-nums">¥1,650 <s class="text-muted-foreground text-base font-normal" aria-label="Was ¥2,200">¥2,200</s> <span class="text-muted-foreground text-sm font-normal" data-t="shop.tax_included">tax included</span></p>
    <form class="grid gap-4" method="post" action="/cart">
      <input type="hidden" name="product" value="mug">
      <fieldset class="grid gap-2">
        <legend class="label mb-2" data-t="product.size">Size</legend>
        <div class="flex flex-wrap gap-2"><label class="btn has-[:checked]:border-primary has-[:checked]:ring-2 has-[:checked]:ring-ring/50 " data-variant="outline"><input class="sr-only" type="radio" name="size" value="S"  >S</label><label class="btn has-[:checked]:border-primary has-[:checked]:ring-2 has-[:checked]:ring-ring/50 " data-variant="outline"><input class="sr-only" type="radio" name="size" value="M" checked >M</label><label class="btn has-[:checked]:border-primary has-[:checked]:ring-2 has-[:checked]:ring-ring/50 opacity-50" data-variant="outline"><input class="sr-only" type="radio" name="size" value="L"  disabled>L</label></div>
        <p class="text-muted-foreground text-sm" data-t="product.size_note">S 250 ml · M 350 ml · L 450 ml (L sold out)</p>
      </fieldset>
      <div class="grid gap-2">
        <label class="label" for="qty" data-t="product.quantity">Quantity</label>
        <div class="button-group w-fit" role="group">
          <button class="btn" data-variant="outline" data-size="icon" type="button" aria-label="One less" data-t-label="product.less">−</button>
          <input class="input w-14 text-center tabular-nums" id="qty" name="quantity" type="number" inputmode="numeric" min="1" max="10" value="1">
          <button class="btn" data-variant="outline" data-size="icon" type="button" aria-label="One more" data-t-label="product.more">+</button>
        </div>
      </div>
      <button class="btn w-full @3xl:w-auto" data-size="lg" type="submit"  data-t="shop.add">Add to Cart</button>
      <p class="text-sm" role="status">In stock · ships in 1–2 days</p>
    </form>
    <section class="accordion">
      <details open><summary data-t="product.details">Details</summary><p>Hand-thrown in Mashiko. Dishwasher and microwave safe. Each glaze is a little different.</p></details>
      <details><summary data-t="product.shipping">Shipping and returns</summary><p>Free shipping over ¥5,000. Returns within 14 days.</p></details>
    </section>
  </section>
</article>
```

## States

| State | What changes |
| --- | --- |
| Default | First picture shown and its thumbnail pressed (`aria-pressed="true"`, `ring-2 ring-ring`). The most common variant is pre-selected only if it is in stock. |
| Choosing a variant | Variants are radios in `label.btn data-variant="outline"` (selected: `has-[:checked]:border-primary`). Price, stock line and pictures update for that variant (web: `hx-get="/products/mug?size=M" hx-trigger="change" hx-target="article"`). |
| Variant sold out | The radio stays choosable but its label is `opacity-50`; choosing it makes the button **Sold Out** (disabled) and the stock line `product.size_sold_out` with the notify link. Never silently pick another size. |
| Low stock | Stock line `shop.low_stock` instead of `product.in_stock`; the quantity `max` is the stock. |
| Quantity | Min 1, max 10 or the stock. − is disabled at 1, + at the max. Typing outside the range snaps back on blur. |
| Adding | Button `disabled aria-busy="true"`, then a status alert or toast `shop.added_title` with variant, quantity and price, **View Cart** and **Keep Shopping**. |
| Loading | Skeleton picture, title, price and button. |
| Not found | 404 page with a link back to the shop (EmptyState). |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `shop.tax_included` | tax included | 税込 |
| `shop.sale` | Sale | セール |
| `shop.off` | {percent} % off | {percent}%オフ |
| `shop.low_stock` | Only {count} left | 残り{count}点 |
| `shop.sold_out` | Sold Out | 売り切れ |
| `shop.notify` | Email Me When It’s Back | 再入荷のお知らせを受け取る |
| `shop.add` | Add to Cart | カートに入れる |
| `shop.was` | Was {price} | 通常価格 {price} |
| `product.size` | Size | サイズ |
| `product.size_note` | S 250 ml · M 350 ml · L 450 ml | S 250 ml・M 350 ml・L 450 ml |
| `product.quantity` | Quantity | 数量 |
| `product.less` | One less | 1つ減らす |
| `product.more` | One more | 1つ増やす |
| `product.pictures` | Pictures | 商品画像 |
| `product.choose_picture` | Choose a picture | 画像を選ぶ |
| `product.picture_n` | Picture {n} | 画像 {n} |
| `product.in_stock` | In stock · ships in 1–2 days | 在庫あり・1〜2日で発送 |
| `product.size_sold_out` | Sold out in this size. | このサイズは売り切れです。 |
| `product.details` | Details | 商品の詳細 |
| `product.shipping` | Shipping and returns | 配送と返品 |
| `product.keep_shopping` | Keep Shopping | 買い物を続ける |
| `shop.added_title` | Added to your cart | カートに追加しました |
| `shop.view_cart` | View Cart | カートを見る |

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
