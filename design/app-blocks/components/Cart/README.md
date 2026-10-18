# Cart

The cart: each item with its picture, variant, quantity and line price, a Remove with Undo, and the order summary with shipping, tax and Check Out.

| | |
| --- | --- |
| Group | Commerce |
| Basecoat | `item-group`, `item`, `button-group`, `input`, `btn`, `card`, `empty`, `toast` |
| Route | `/cart` |
| Needs | Web: `GET /cart`, `PATCH /cart/<line>` (quantity), `DELETE /cart/<line>`, `POST /cart/<line>/restore`. No server: `store.cart.*` |
| Links to | Coupons, Checkout, ProductPage, DeleteUndo, TopBar (cart count) |

## Markup

```html
<section class="grid gap-6 @3xl:grid-cols-[1fr_20rem]" aria-labelledby="cart-title">
<div class="grid content-start gap-4">
  <h1 id="cart-title" class="text-2xl font-semibold" data-t="cart.title">Your cart</h1>
  <ul class="item-group gap-3" role="list">
<li class="item" data-variant="outline">
  <figure><img src="/static/products/mug.webp" alt="" class="size-16 rounded-md object-cover"></figure>
  <section class="grid gap-1">
    <h3 class="font-medium"><a href="/products/mug" class="hover:underline">Ceramic Mug</a></h3>
    <p class="text-muted-foreground text-sm">Blue · M</p>
    <div class="flex flex-wrap items-center gap-3">
      <div class="button-group" role="group" aria-label="Quantity of Ceramic Mug" data-t-label="cart.quantity_of">
        <button class="btn" data-variant="outline" data-size="icon-sm" type="button" aria-label="One less" data-t-label="product.less" >−</button>
        <input class="input h-8 w-12 text-center tabular-nums" id="qty-mug" name="quantity" type="number" min="1" max="10" value="2" aria-label="Quantity" >
        <button class="btn" data-variant="outline" data-size="icon-sm" type="button" aria-label="One more" data-t-label="product.more" >+</button>
      </div>
      <button class="btn" data-variant="link" data-size="sm" type="button" data-t="cart.remove">Remove</button>
    </div>
  </section>
  <aside class="text-right font-semibold tabular-nums">¥3,300</aside>
</li><li class="item" data-variant="outline">
  <figure><img src="/static/products/notebook.webp" alt="" class="size-16 rounded-md object-cover"></figure>
  <section class="grid gap-1">
    <h3 class="font-medium"><a href="/products/notebook" class="hover:underline">Grid Notebook A5</a></h3>
    <p class="text-muted-foreground text-sm">Green</p>
    <div class="flex flex-wrap items-center gap-3">
      <div class="button-group" role="group" aria-label="Quantity of Grid Notebook A5" data-t-label="cart.quantity_of">
        <button class="btn" data-variant="outline" data-size="icon-sm" type="button" aria-label="One less" data-t-label="product.less" disabled>−</button>
        <input class="input h-8 w-12 text-center tabular-nums" id="qty-notebook" name="quantity" type="number" min="1" max="10" value="1" aria-label="Quantity" >
        <button class="btn" data-variant="outline" data-size="icon-sm" type="button" aria-label="One more" data-t-label="product.more" >+</button>
      </div>
      <button class="btn" data-variant="link" data-size="sm" type="button" data-t="cart.remove">Remove</button>
    </div>
  </section>
  <aside class="text-right font-semibold tabular-nums">¥880</aside>
</li>
  </ul>
  <a href="#coupon" class="text-sm underline-offset-4 hover:underline" data-t="cart.have_coupon">Have a coupon code?</a>
</div>
<aside class="card" aria-labelledby="cart-summary-title">
  <header><h2 id="cart-summary-title" data-t="cart.summary">Order summary</h2></header>
  <section>
    <dl class="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-sm">
      <dt data-t="cart.subtotal">Subtotal (3 items)</dt><dd class="text-right tabular-nums">¥4,950</dd>
      <dt data-t="cart.shipping">Shipping</dt><dd class="text-right tabular-nums">¥550</dd>
      <dt class="text-muted-foreground col-span-2 text-xs" data-t="cart.free_from">Add ¥50 more for free shipping.</dt>
      <dt class="border-t pt-2 text-base font-semibold" data-t="cart.total">Total</dt><dd class="border-t pt-2 text-right text-base font-semibold tabular-nums">¥5,500</dd>
      <dt class="text-muted-foreground col-span-2 text-xs" data-t="cart.tax_note">Includes ¥500 tax (10 %)</dt>
    </dl>
  </section>
  <footer class="grid gap-2">
    <a class="btn w-full " data-size="lg" href="/checkout"  data-t="cart.checkout">Check Out</a>
    <a class="btn w-full" data-variant="ghost" href="/shop" data-t="cart.continue">Continue Shopping</a>
  </footer>
</aside>
</section>
```

## States

| State | What changes |
| --- | --- |
| Default | Items newest first; summary on the right from 48rem, under the items on the phone. |
| Change quantity | − / + or typing; the line price and summary update (web: `hx-patch` with `hx-trigger="change delay:400ms"`, the response replaces the line and the summary via `hx-swap-oob`). At 1, − is disabled; to remove, use Remove. |
| Remove | The line disappears; a toast `cart.removed` with **Undo** for 8 seconds (DeleteUndo). Focus goes to the next line’s name, or to the heading if it was the last. |
| Sold out meanwhile | The line shows `cart.sold_out_since` (destructive), its quantity is disabled, and **Check Out** is disabled (`aria-disabled="true"`) until it is removed. |
| Price changed meanwhile | A line note `cart.price_changed`; the summary uses the new price. Never charge the old one silently. |
| Free shipping | Below the threshold: `cart.free_from` with the missing amount. At or above: shipping reads `cart.shipping_free`. |
| Empty | `div.empty` with **Go to the Shop**; no summary. |
| Saving | While a quantity change is sent the summary gets `aria-busy="true"` and Check Out waits. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `cart.title` | Your cart | カート |
| `cart.remove` | Remove | 削除 |
| `cart.quantity_of` | Quantity of {name} | {name}の数量 |
| `cart.summary` | Order summary | ご注文内容 |
| `cart.subtotal` | Subtotal ({count} items) | 小計（{count}点） |
| `cart.shipping` | Shipping | 送料 |
| `cart.shipping_free` | Free | 無料 |
| `cart.free_from` | Add {amount} more for free shipping. | あと{amount}で送料無料です。 |
| `cart.total` | Total | 合計 |
| `cart.tax_note` | Includes {amount} tax (10 %) | うち消費税 {amount}（10%） |
| `cart.checkout` | Check Out | 購入手続きへ |
| `cart.continue` | Continue Shopping | 買い物を続ける |
| `cart.have_coupon` | Have a coupon code? | クーポンコードをお持ちですか？ |
| `cart.sold_out_since` | Sold out since you added it. Remove it to check out. | カートに入れた後に売り切れました。購入手続きに進むには削除してください。 |
| `cart.price_changed` | The price changed from {old} to {new}. | 価格が{old}から{new}に変わりました。 |
| `cart.removed` | Removed {name} | {name}を削除しました |
| `cart.undo` | Undo | 元に戻す |
| `cart.empty_title` | Your cart is empty | カートは空です |
| `cart.empty` | Things you add from the shop wait here until you check out. | ショップで追加した商品は、購入手続きまでここに保存されます。 |
| `cart.go_shop` | Go to the Shop | ショップへ |
| `product.less` | One less | 1つ減らす |
| `product.more` | One more | 1つ増やす |

## Keyboard and focus

1. For each line: name link → − → quantity → + → Remove.
2. Have a coupon code? → 3. Check Out → 4. Continue Shopping.
- The total is announced when it changes (`aria-live="polite"` on the summary’s `dl`).

## Phone

- One column: items, coupon link, summary card, buttons full width and 44 px tall.
- Item rows keep the picture at 64 px; the price stays on the right.
- Nothing fixed to the bottom.

## Data

```json
{"lines":[{"id":"l1","product":"mug","variant":"Blue · M","quantity":2,"unit_price":1650,"stock":12}],"subtotal":4950,"shipping":550,"free_shipping_from":5000,"tax_included":500,"total":5500,"currency":"JPY"}
```

- The server (or the store) computes every amount; the page only shows them. Tax is included in Japanese prices; the note shows the tax part (10 %, or 8 % for food).
- No server: the cart lives in localStorage (`store.cart`), and checkout needs a server or a hosted payment page (Checkout).

## Don't

- Don’t ask “Are you sure?” before removing: Undo is the safety.
- Don’t hide the shipping cost until the last step.
- Don’t show a quantity selector above the stock.
