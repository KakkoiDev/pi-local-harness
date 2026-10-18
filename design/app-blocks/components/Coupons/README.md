# Coupons

The coupon code field in the cart with its applied and error states, and the shop’s single rulebook for price and stock states (sale, low stock, sold out, pre-order, price changed).

| | |
| --- | --- |
| Group | Commerce |
| Basecoat | `input`, `label`, `btn`, `badge`, `table` |
| Needs | Web: `POST /cart/coupon`, `DELETE /cart/coupon`. No server: codes need a server to be checked; a no-server shop has no coupons |
| Used in | Cart, Checkout (review shows the line), ProductGrid and ProductPage (price and stock states) |

## Markup

```html
<form id="coupon" class="grid gap-2" method="post" action="/cart/coupon">
  <label class="label" for="coupon-code" data-t="coupon.label">Coupon code</label>
  <div class="flex gap-2">
    <input class="input font-mono uppercase" id="coupon-code" name="code" autocomplete="off" autocapitalize="characters" spellcheck="false" value="">
    <button class="btn" data-variant="outline" type="submit" data-t="coupon.apply">Apply</button>
  </div>
  
</form>

<!-- applied -->
<div class="flex flex-wrap items-center justify-between gap-2 rounded-md border border-dashed p-3"><span class="flex items-center gap-2"><span class="badge font-mono" data-variant="secondary">WELCOME500</span><span class="text-sm">¥500 off your first order</span></span><button class="btn" data-variant="link" data-size="sm" type="button" aria-label="Remove code WELCOME500">Remove</button></div>
```

## States

| State | What changes |
| --- | --- |
| Empty | The field and **Apply** (outline: the main action on the page stays Check Out). |
| Checking | Field and button disabled, button `coupon.checking` with `aria-busy="true"`. |
| Applied | The field is replaced by a dashed box: the code as a badge, what it gives, **Remove**. The summary gains a “Coupon CODE −¥500” line. Focus moves to Remove. |
| Errors | Under the field, `role="alert"`, the input `aria-invalid="true"`; the typed code stays. One message per reason: `unknown`, `ended`, `minimum` (says how much more), `items`, `used`. |
| A second code | One code per order: applying another shows `coupon.one_only` before replacing. |
| Price and stock states | The table in the preview is the rule for every block that shows a price: regular, sale, low stock (1–5), sold out, pre-order, coupon applied, price changed. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `coupon.label` | Coupon code | クーポンコード |
| `coupon.apply` | Apply | 適用 |
| `coupon.checking` | Checking… | 確認中… |
| `coupon.applied` | {amount} off your first order | 初回のご注文から{amount}引き |
| `coupon.remove` | Remove | 削除 |
| `coupon.remove_label` | Remove code {code} | コード {code} を削除 |
| `coupon.summary_line` | Coupon {code} | クーポン {code} |
| `coupon.error.unknown` | There’s no code {code}. Check the spelling. | コード {code} は見つかりません。つづりをご確認ください。 |
| `coupon.error.ended` | {code} ended on {date}. Codes can’t be used after they end. | {code} は{date}で終了しました。終了したコードは使えません。 |
| `coupon.error.minimum` | {code} needs an order of {amount} or more. Add {missing} more to use it. | {code} は{amount}以上のご注文で使えます。あと{missing}で使えます。 |
| `coupon.error.items` | {code} doesn’t apply to anything in your cart. | {code} はカート内の商品には使えません。 |
| `coupon.error.used` | You’ve already used {code}. | {code} はすでに使用済みです。 |
| `coupon.one_only` | One code per order. Applying this one replaces {code}. | 1回のご注文に使えるコードは1つです。適用すると {code} と置き換わります。 |
| `shop.preorder` | Pre-order | 予約する |
| `shop.ships_from` | Ships from {date} | {date}から発送 |
| `cart.price_changed` | Now {new} (was {old} when added) | 現在 {new}（追加時 {old}） |
| `shop.tax_included` | tax included | 税込 |
| `shop.sale` | Sale | セール |
| `shop.off` | {percent} % off | {percent}%オフ |
| `shop.low_stock` | Only {count} left | 残り{count}点 |
| `shop.sold_out` | Sold Out | 売り切れ |
| `shop.notify` | Email Me When It’s Back | 再入荷のお知らせを受け取る |
| `shop.add` | Add to Cart | カートに入れる |
| `shop.was` | Was {price} | 通常価格 {price} |

## Keyboard and focus

1. Coupon code → 2. Apply (Return in the field applies) → after applying, focus on Remove; after removing, focus back to the field.

## Phone

- The field and Apply stay on one row (`flex gap-2`), both 44 px.
- `autocapitalize="characters"` and `spellcheck="false"` so phone keyboards don’t change the code.

## Data

```json
{"request":{"code":"WELCOME500"},"ok":{"code":"WELCOME500","discount":500,"label":{"en":"¥500 off your first order","ja":"初回のご注文から500円引き"}},"error":{"code":"ended","date":"2026-09-30"}}
```

- Codes are matched case-insensitively, trimmed, shown uppercase. The server checks and computes the discount; the page never does.
- Web: `POST /cart/coupon` → 200 replaces the coupon form and the summary (`hx-swap-oob`); 422 with the error key.

## Don't

- Don’t check codes in the browser or ship a list of codes.
- Don’t show “invalid code” for every error: say which rule failed.
- Don’t make Apply a primary button.
- Don’t show “Only 0 left” or invent urgency text.
