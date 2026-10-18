# OrderConfirmation

The page after a successful order: thanks with the order number, where the receipt went, what happens next, and for convenience-store or bank payments the payment number and deadline.

| | |
| --- | --- |
| Group | Commerce |
| Basecoat | `card`, `alert`, `btn` |
| Route | `/orders/<id>/thanks` |
| Needs | **Needs a server** (`GET /orders/<id>/thanks`, `POST /orders/<id>/receipt`) |
| Links to | Checkout, OrderHistory, ProductGrid |

## Markup

```html
<main class="mx-auto grid max-w-xl gap-6">
  <header class="grid gap-2 text-center">
    <svg aria-hidden="true" class="mx-auto size-10 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
    <h1 id="thanks-title" class="text-2xl font-semibold" tabindex="-1" data-t="order.thanks">Thank you, Aiko. Your order is placed.</h1>
    <p class="text-muted-foreground" data-t="order.email_sent">Order 2026-1042. A receipt is on its way to aiko@example.com.</p>
  </header>

  <section class="card" aria-labelledby="order-sum">
    <header><h2 id="order-sum">What happens next</h2></header>
    <section>
      <dl class="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
        <dt class="text-muted-foreground">Arrives</dt><dd>Sat 24 Oct, 14:00–16:00</dd>
        <dt class="text-muted-foreground">Ship to</dt><dd>〒150-0001 東京都渋谷区神宮前1-2-3</dd>
        <dt class="text-muted-foreground">Items</dt><dd>Ceramic Mug × 2, Grid Notebook A5</dd>
        <dt class="text-muted-foreground">Paid</dt><dd class="tabular-nums">¥4,730 · Card ending 4242</dd>
      </dl>
    </section>
    <footer class="flex flex-wrap gap-2">
      <a class="btn" href="/orders/2026-1042" data-t="order.view">View Order</a>
      <a class="btn" data-variant="outline" href="/shop" data-t="order.continue">Continue Shopping</a>
    </footer>
  </section>
</main>
```

## States

| State | What changes |
| --- | --- |
| Paid by card | Header with the check, order number, email; What happens next: arrival window, address, items, amount and card ending. |
| Payment pending (konbini, bank transfer) | An `alert` above the card with the deadline, the payment number in monospace with **Copy** (`order.copied` for 2 s after), and `order.konbini_note`. “Paid” reads “(pending)”. |
| Receipt email failed | Destructive `alert` `order.email_failed_title`: the order is still placed; **Send Again**. |
| Reload | The URL is the order’s; reloading shows the same page and never orders again. |
| Focus | On load, focus goes to the heading (`tabindex="-1"`) so screen readers hear the thanks. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `order.thanks` | Thank you, {name}. Your order is placed. | {name}さま、ご注文ありがとうございます。 |
| `order.email_sent` | Order {number}. A receipt is on its way to {email}. | 注文番号 {number}。確認メールを {email} にお送りしました。 |
| `order.next` | What happens next | このあとの流れ |
| `order.arrives` | Arrives | お届け予定 |
| `order.ship_to` | Ship to | お届け先 |
| `order.items` | Items | 商品 |
| `order.paid` | Paid | お支払い |
| `order.view` | View Order | 注文を見る |
| `order.continue` | Continue Shopping | 買い物を続ける |
| `order.konbini_due` | Pay at a convenience store by {deadline} | {deadline}までにコンビニでお支払いください |
| `order.payment_number` | Payment number | お支払い番号 |
| `order.copy` | Copy | コピー |
| `order.copied` | Copied | コピーしました |
| `order.konbini_note` | We ship once it’s paid. Unpaid orders are cancelled after the deadline. | 入金確認後に発送します。期限を過ぎると注文はキャンセルされます。 |
| `order.email_failed_title` | We couldn’t email your receipt | 確認メールを送信できませんでした |
| `order.send_again` | Send Again | 再送信 |

## Keyboard and focus

1. Heading gets focus on load → 2. Copy (if pending) → 3. View Order → 4. Continue Shopping.

## Phone

- The column is `max-w-xl`, so it already fits; the `dl` keeps 8 rem labels and wraps values.
- The payment number is large enough to read at the till (`text-base`, `tracking-wider`).

## Data

```json
{"number":"2026-1042","email":"aiko@example.com","status":"paid | pending_payment","arrives":{"date":"2026-10-24","window":"14-16"},"total":4730,"payment":{"method":"konbini","number":"1234-5678-9012","deadline":"2026-10-21T23:59:00+09:00"}}
```

- Dates and windows with `Intl.DateTimeFormat(lang, {weekday: "short", month: "short", day: "numeric"})`; JA shows （土）.

## Don't

- Don’t show confetti or a “share your purchase” prompt.
- Don’t ask for an account password here; offering “Save your details for next time” is a separate SignUp link.
- Don’t place the order on page load.
