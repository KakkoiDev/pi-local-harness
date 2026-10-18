# ProductGrid

App Block card (Commerce). A grid of product cards with picture, name, price and an Add to Cart button, showing sale, low-stock and sold-out states, with a count and a sort control.

- Basecoat: `card`, `badge`, `btn`, `select` (native), `empty`, `skeleton`, `alert`, `toast`
- Route: `/shop`, `/shop/<category>`
- Needs: Web: `GET /shop?sort=&page=`, `POST /cart`. No server: `store.products.list({category, sort})`, `store.cart.add(id)`
- Links to: ProductPage, Cart, ListSearch (filters), InfiniteScroll or DataTable pagination, Toasts

## Markup
Copy, never retype: `{harness}/kit/blocks/commerce/ProductGrid.html` (38 lines of HTML).

## States
- Loaded (default): Two columns on the phone, four from 48rem. Each card: picture (square), badges row (always present, `min-h-5`, so names line up), name, price, button.
- Sale: `badge data-variant="destructive"` with `shop.off`; the old price in `<s>` with `aria-label` `shop.was` so screen readers say “Was ¥2,200”.
- Low stock (1–5): `badge data-variant="outline"` `shop.low_stock`. Not shown above 5.
- Sold out: Picture at 60 % opacity, `badge data-variant="secondary"` `shop.sold_out`, and the button becomes **Email Me When It’s Back** (`shop.notify`, outline). Sold-out items stay in the grid, sorted last.
- Adding: The button gets `disabled aria-busy="true"` until the cart answers; then a success toast `shop.added_title` with the product and price and a **View Cart** button. Focus stays on the button.
- Loading: Skeleton cards (picture, two lines) in the same grid; `aria-busy="true"` on the list and a hidden status `shop.loading`.
- Empty after filtering: `div.empty` with `shop.empty` naming the filter, and **Clear Filters**.
- Error: An `alert` (destructive) with **Try Again**.
- Long names: Names wrap to two lines then clip with `line-clamp-2`; the full name is on the ProductPage.
- Few left: The card shows `shop.low_stock` (“Only 2 left”) as `<span class="badge" data-variant="outline" data-t="shop.low_stock">`.

## Texts
(Key | English | 日本語)
- `shop.title`: Kitchen and Home | キッチンと暮らし
- `shop.count`: {count} products | {count}件の商品
- `shop.sort`: Sort by | 並び替え
- `shop.sort.popular`: Most popular | 人気順
- `shop.sort.new`: Newest | 新着順
- `shop.sort.price_asc`: Price: low to high | 価格の安い順
- `shop.sort.price_desc`: Price: high to low | 価格の高い順
- `shop.tax_included`: tax included | 税込
- `shop.sale`: Sale | セール
- `shop.off`: {percent} % off | {percent}%オフ
- `shop.low_stock`: Only {count} left | 残り{count}点
- `shop.sold_out`: Sold Out | 売り切れ
- `shop.notify`: Email Me When It’s Back | 再入荷のお知らせを受け取る
- `shop.add`: Add to Cart | カートに入れる
- `shop.was`: Was {price} | 通常価格 {price}
- `shop.loading`: Loading products… | 商品を読み込み中…
- `shop.empty_title`: No products match | 該当する商品がありません
- `shop.empty`: Nothing in {category} under {price}. Clear the price filter to see all {count} products. | {category}に{price}以下の商品はありません。価格の絞り込みを解除すると、{count}件すべてが表示されます。
- `shop.clear_filters`: Clear Filters | 絞り込みを解除
- `shop.added_title`: Added to your cart | カートに追加しました
- `shop.view_cart`: View Cart | カートを見る
- `shop.error_title`: Couldn’t load the products | 商品を読み込めませんでした

## Keyboard and focus
1. Sort select → 2. for each card: the picture link, the name link, the button.
- The picture link and name link go to the same page: give the picture link `tabindex="-1" aria-hidden="true"` so each product is one stop plus its button.
- After **Add to Cart**, focus stays; the toast is announced (`role="status"`).

## Phone
- `grid-cols-2` below 48rem, gap 16 px; the button is 44 px tall and full width.
- The sort select stays in the toolbar; filters open in a sheet (ListSearch).
- Prices never wrap away from their tax note: keep `tax included` short.

## Data
```json
{"products":[{"id":"mug","name":{"en":"Ceramic Mug","ja":"陶器のマグカップ"},"price":1650,"was":2200,"currency":"JPY","stock":12,"image":"/static/products/mug.webp"}],"count":4,"sort":"popular"}
```

- Prices are whole yen (integers); display with `Intl.NumberFormat(lang, {style: "currency", currency: "JPY"})` (EN `¥1,650`, JA `￥1,650`) or the `shop.price` pattern if the shop prefers `1,650円`.
- Web: the grid is a fragment; sorting is `hx-get="/shop" hx-trigger="change" hx-target="#products"` on the select, the URL keeps `?sort=`.
- `POST /cart` returns the toast fragment (`HX-Trigger: cart-changed` so the TopBar badge updates); 409 when sold out meanwhile (the card re-renders sold out and an error toast says so).

## Don't
- Don’t hide sold-out products or show “0 left”.
- Don’t show the stock count above 5.
- Don’t put two buttons (Add and Buy Now) on grid cards.
- Don’t compute prices in the browser for a web shop: the server sends the price to show.

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> ProductGrid` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
