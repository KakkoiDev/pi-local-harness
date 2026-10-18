# OrderHistory

App Block card (Commerce). The person’s past orders, newest first, with number, date, status, item count and total: a table on the desktop and a list on the phone.

- Basecoat: `table`, `badge`, `item-group`, `item`, `select`, `empty`, `skeleton`, `alert`
- Route: `/orders`
- Needs: **Needs a server** and LogIn: `GET /orders?period=&page=`
- Links to: OrderConfirmation, DetailView (the order page), DataTable (pagination), LogIn

## Markup
Copy, never retype: `{harness}/kit/blocks/commerce/OrderHistory.html` (17 lines of HTML).

## States
- Default: Newest first, 20 per page with DataTable’s pagination below.
- Status badges: `pending` outline “Awaiting payment”, `paid`/`shipped` secondary, `delivered` primary, `cancelled` destructive. Always the word, never only the colour.
- Period filter: The select reloads the list (`hx-get` on change) and keeps `?period=` in the URL.
- Empty: `div.empty` with **Go to the Shop**; after a period filter: “No orders in this period” and **Show All Orders**.
- Loading: Three skeleton rows.
- Logged out: An `alert` asking to log in, with the guest receipt hint.

## Texts
(Key | English | 日本語)
- `orders.title`: Your orders | ご注文履歴
- `orders.caption`: Your orders, newest first | ご注文（新しい順）
- `orders.number`: Order | 注文番号
- `orders.date`: Date | 注文日
- `orders.status`: Status | 状況
- `orders.items`: Items | 点数
- `orders.total`: Total | 合計
- `orders.view`: View | 詳細
- `orders.period`: Show | 表示
- `orders.period.all`: All orders | すべての注文
- `orders.period.3m`: Last 3 months | 過去3か月
- `orders.status.pending`: Awaiting payment | 入金待ち
- `orders.status.paid`: Paid | 支払い済み
- `orders.status.shipped`: Shipped | 発送済み
- `orders.status.delivered`: Delivered | 配達済み
- `orders.status.cancelled`: Cancelled | キャンセル
- `orders.empty_title`: No orders yet | まだ注文はありません
- `orders.empty`: When you buy something, it shows up here with its status. | 購入すると、ここに状況とともに表示されます。
- `orders.login_title`: Log in to see your orders | ログインして注文履歴を表示
- `orders.guest`: Ordered as a guest? Use the link in your receipt email. | ゲストとしてご注文の場合は、確認メールのリンクをご利用ください。

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

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> OrderHistory` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
