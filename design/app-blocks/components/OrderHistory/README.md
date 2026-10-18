# OrderHistory

The person’s past orders, newest first, with number, date, status, item count and total: a table on the desktop and a list on the phone.

| | |
| --- | --- |
| Group | Commerce |
| Basecoat | `table`, `badge`, `item-group`, `item`, `select`, `empty`, `skeleton`, `alert` |
| Route | `/orders` |
| Needs | **Needs a server** and LogIn: `GET /orders?period=&page=` |
| Links to | OrderConfirmation, DetailView (the order page), DataTable (pagination), LogIn |

## Markup

```html
<section class="grid gap-4" aria-labelledby="orders-title">
  <div class="flex flex-wrap items-center justify-between gap-2">
    <h1 id="orders-title" class="text-2xl font-semibold" data-t="orders.title">Your orders</h1>
    <select class="select w-40" name="period" aria-label="Show" data-t-label="orders.period" data-t="orders.period"><option value="all" data-t="orders.period.all">All orders</option><option value="3m" data-t="orders.period.3m">Last 3 months</option><option value="2026">2026</option></select>
  </div>
  <!-- desktop (@3xl and up): the table; phone: the item list -->
  <div class="hidden @3xl:block">
<div class="table-container">
  <table class="table">
    <caption class="sr-only" data-t="orders.caption">Your orders, newest first</caption>
    <thead><tr><th scope="col" data-t="orders.number">Order</th><th scope="col" data-t="orders.date">Date</th><th scope="col" data-t="orders.status">Status</th><th scope="col" class="text-right" data-t="orders.items">Items</th><th scope="col" class="text-right" data-t="orders.total">Total</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead>
    <tbody><tr><td class="font-mono"><a href="/orders/2026-1042" class="hover:underline">2026-1042</a></td><td>18 Oct 2026</td><td><span class="badge" data-variant="outline" data-t="orders.status.pending">Awaiting payment</span></td><td class="text-right tabular-nums">3</td><td class="text-right tabular-nums">¥4,730</td><td class="text-right"><a class="btn" data-variant="outline" data-size="sm" href="/orders/2026-1042" aria-label="View order 2026-1042" data-t="orders.view">View</a></td></tr><tr><td class="font-mono"><a href="/orders/2026-0987" class="hover:underline">2026-0987</a></td><td>2 Oct 2026</td><td><span class="badge" data-variant="secondary" data-t="orders.status.shipped">Shipped</span></td><td class="text-right tabular-nums">1</td><td class="text-right tabular-nums">¥2,800</td><td class="text-right"><a class="btn" data-variant="outline" data-size="sm" href="/orders/2026-0987" aria-label="View order 2026-0987" data-t="orders.view">View</a></td></tr><tr><td class="font-mono"><a href="/orders/2026-0911" class="hover:underline">2026-0911</a></td><td>14 Sep 2026</td><td><span class="badge" data-variant="primary" data-t="orders.status.delivered">Delivered</span></td><td class="text-right tabular-nums">4</td><td class="text-right tabular-nums">¥7,150</td><td class="text-right"><a class="btn" data-variant="outline" data-size="sm" href="/orders/2026-0911" aria-label="View order 2026-0911" data-t="orders.view">View</a></td></tr><tr><td class="font-mono"><a href="/orders/2026-0850" class="hover:underline">2026-0850</a></td><td>30 Aug 2026</td><td><span class="badge" data-variant="destructive" data-t="orders.status.cancelled">Cancelled</span></td><td class="text-right tabular-nums">1</td><td class="text-right tabular-nums">¥1,650</td><td class="text-right"><a class="btn" data-variant="outline" data-size="sm" href="/orders/2026-0850" aria-label="View order 2026-0850" data-t="orders.view">View</a></td></tr></tbody>
  </table>
</div>
  </div>
  <ul class="item-group gap-2 @3xl:hidden" role="list"><!-- one item per order: number, date · items, status badge, total --></ul>
</section>
```

## States

| State | What changes |
| --- | --- |
| Default | Newest first, 20 per page with DataTable’s pagination below. |
| Status badges | `pending` outline “Awaiting payment”, `paid`/`shipped` secondary, `delivered` primary, `cancelled` destructive. Always the word, never only the colour. |
| Period filter | The select reloads the list (`hx-get` on change) and keeps `?period=` in the URL. |
| Empty | `div.empty` with **Go to the Shop**; after a period filter: “No orders in this period” and **Show All Orders**. |
| Loading | Three skeleton rows. |
| Logged out | An `alert` asking to log in, with the guest receipt hint. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `orders.title` | Your orders | ご注文履歴 |
| `orders.caption` | Your orders, newest first | ご注文（新しい順） |
| `orders.number` | Order | 注文番号 |
| `orders.date` | Date | 注文日 |
| `orders.status` | Status | 状況 |
| `orders.items` | Items | 点数 |
| `orders.total` | Total | 合計 |
| `orders.view` | View | 詳細 |
| `orders.period` | Show | 表示 |
| `orders.period.all` | All orders | すべての注文 |
| `orders.period.3m` | Last 3 months | 過去3か月 |
| `orders.status.pending` | Awaiting payment | 入金待ち |
| `orders.status.paid` | Paid | 支払い済み |
| `orders.status.shipped` | Shipped | 発送済み |
| `orders.status.delivered` | Delivered | 配達済み |
| `orders.status.cancelled` | Cancelled | キャンセル |
| `orders.empty_title` | No orders yet | まだ注文はありません |
| `orders.empty` | When you buy something, it shows up here with its status. | 購入すると、ここに状況とともに表示されます。 |
| `orders.login_title` | Log in to see your orders | ログインして注文履歴を表示 |
| `orders.guest` | Ordered as a guest? Use the link in your receipt email. | ゲストとしてご注文の場合は、確認メールのリンクをご利用ください。 |

## Keyboard and focus

1. Period select → 2. per row: order number link → View.
- The table has a hidden caption and `scope="col"` headers; the View button’s `aria-label` names the order.

## Phone

- Below 48rem the table is replaced by an `item-group` list (number, date · items, badge, total); each item is one link to the order.
- No horizontal scrolling table on the phone.

## Data

```json
{"orders":[{"number":"2026-1042","placed_at":"2026-10-18T10:12:00+09:00","status":"pending","items":3,"total":4730,"currency":"JPY"}],"page":1,"pages":1}
```

## Don't

- Don’t show cancelled orders as struck through: the badge says it.
- Don’t let people reorder from this list with one tap; reordering is on the order page.
- Don’t sort by anything but date here.
