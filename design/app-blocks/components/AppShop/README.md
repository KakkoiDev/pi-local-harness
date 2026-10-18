# AppShop

An online shop with its storefront (browse, product page, cart, checkout, orders) and the admin the owner runs it from (products, orders, stock, coupons, sales).

| | |
| --- | --- |
| Group | Apps |
| Example product | Komorebi Goods (a small ceramics shop) |
| Blocks | AccountSettings, BottomBar, Breadcrumbs, Cart, Checkout, ConfirmDialog, Coupons, CsvImport, Dashboard, DataTable, DatePicker, DeleteUndo, DetailView, EditForm, EmptyState, ExportCsv, FileUpload, Gallery, InfiniteScroll, InlineAlert, KpiTile, LineChart, ListSearch, LogIn, OrderConfirmation, OrderHistory, ProductGrid, ProductPage, Profile, Reviews, SettingsPage, ShippingRates, SidePanel, SignUp, StatusBadges, Stepper, TimePicker, Toasts, TopBar |
| Packages | Web app (full stack). Payments and stock live on the server, so there is no no-server version. |
| Related | AppAdmin (the admin side reuses its shell), AppCrm (customers) |

## Screens

| Screen | Route | Blocks |
| --- | --- | --- |
| Shop home | `/` | TopBar, ProductGrid, ListSearch, BottomBar |
| Category | `/c/{slug}` | Breadcrumbs, ProductGrid, ListSearch, InfiniteScroll |
| Product | `/p/{slug}` | Breadcrumbs, ProductPage, Gallery, Reviews, Toasts |
| Cart | `/cart` | Cart, Coupons, EmptyState |
| Checkout | `/checkout` | Checkout, Stepper, EditForm, ShippingRates, DatePicker, TimePicker, InlineAlert |
| Order placed | `/orders/{id}/thanks` | OrderConfirmation |
| My orders | `/account/orders` | OrderHistory, DetailView, EmptyState |
| Account | `/account` | LogIn, SignUp, Profile, AccountSettings |
| Admin · Sales | `/admin` | SidePanel, Dashboard, KpiTile, LineChart |
| Admin · Products | `/admin/products` | DataTable, EditForm, FileUpload, DeleteUndo, CsvImport, ExportCsv |
| Admin · Orders | `/admin/orders` | DataTable, DetailView, StatusBadges, ConfirmDialog |
| Admin · Coupons | `/admin/coupons` | DataTable, EditForm, Coupons |
| Admin · Shipping | `/admin/settings/shipping` | SettingsPage, ShippingRates |
| Admin · Reviews | `/admin/reviews` | DataTable, Reviews, ConfirmDialog |

## Navigation

- **Storefront**: TopBar with the shop name, search, account and the cart (with its count) on the desktop; on the phone a BottomBar with Home · Search · Cart · Account. Categories are links under the TopBar (a horizontal scroll row on the phone).
- **Admin** (`/admin`, owners and staff only): SidePanel with Sales · Products · Orders · Coupons · Reviews · Settings (Shipping is a section of Settings); on the phone the SidePanel opens from the TopBar menu button. A "View shop" link goes back to the storefront.
- The cart count updates on every Add to Cart (a Toasts message with **View Cart**).

## Journeys

The first word of each step is the screen; the blocks named are the cards to copy.

**Browse and buy**

1. Shop home: ListSearch to find "mug", ProductGrid to pick one
2. Product: ProductPage, Reviews to read what buyers say, choose a variant, Add to Cart; Toasts "Added to cart · View Cart"
3. Cart: Cart, change quantity, Coupons to apply a code
4. Checkout: Checkout steps Address → Delivery (ShippingRates price for the address, DatePicker day and TimePicker window) → Payment → Review (Stepper)
5. Order placed: OrderConfirmation with the order number and the email it was sent to

**Review a purchase**

1. My orders: OrderHistory, Write a Review on a delivered item
2. Product: Reviews form with stars and text; shown after Admin · Reviews approves it

**Check an order**

1. Account: LogIn
2. My orders: OrderHistory, open one
3. My orders: DetailView with its status (StatusBadges) and tracking

**Add a product (owner)**

1. Admin · Products: DataTable, New Product
2. Admin · Products: EditForm with FileUpload for photos, price, stock and variants
3. Admin · Products: save; SavedState; the product appears in the shop

**Set shipping prices (owner)**

1. Admin · Shipping: ShippingRates zones (Kanto, Kansai, Hokkaido, Okinawa…) with a price and a free-over amount
2. Checkout: the buyer sees the price for their prefecture

**Ship an order (owner)**

1. Admin · Orders: DataTable filtered to Paid
2. Admin · Orders: DetailView, Mark as Shipped (ConfirmDialog), tracking number
3. My orders: the buyer sees Shipped

## Phone

- Storefront: ProductGrid in 2 columns, categories in one scrolling row, the BottomBar for Home · Search · Cart · Account. The product page puts Add to Cart in a bar at the end of the page column (not fixed) and the Gallery swipes with dots.
- Checkout is one column; each step is its own screen with Back.
- Admin works on the phone for orders (list → detail); product editing is possible but the photo order uses drag with Move Up/Down buttons as the alternative (DragList).

## Data model

| Table | Fields |
| --- | --- |
| `products` | id, slug, name_en, name_ja, description_en, description_ja, price_yen, status (draft · active · archived), created_at |
| `variants` | id, product_id, name (e.g. "Small · Blue"), sku, price_yen (null = product price), stock |
| `photos` | id, product_id, path, alt_en, alt_ja, position |
| `carts` | id, user_id or session_id, updated_at · `cart_items`: cart_id, variant_id, quantity |
| `orders` | id, number, user_id, email, status (pending · paid · shipped · delivered · cancelled · refunded), subtotal_yen, shipping_yen, discount_yen, total_yen, address (JSON), placed_at |
| `order_items` | order_id, variant_id, name, price_yen, quantity (copied at purchase) |
| `coupons` | code, kind (percent · fixed), value, min_total_yen, starts_at, ends_at, uses_left |
| `reviews` | id, product_id, user_id, order_id, stars (1–5), body, status (pending · shown · hidden), created_at |
| `shipping_zones` | id, name_en, name_ja, prefectures[], price_yen, free_over_yen |

Money is whole yen (integers); prices shown with `Intl.NumberFormat(lang, {style: "currency", currency: "JPY"})`.

## Capabilities and packages

Capabilities: **Log in and accounts**, **Database**, **File uploads** (product photos), **Admin pages**, **Dashboard and charts** (sales). Optional: **Installs on a phone**. Package: **Web app (full stack)**.

Payments go through a payment provider's hosted page or SDK; the provider is the person's choice and is not part of the base. Until one is chosen, Checkout ends with "Pay on delivery" or "Bank transfer" only.

## Texts

App-level keys only; each block brings its own.

| Key | English | 日本語 |
| --- | --- | --- |
| `shop.name` | Komorebi Goods | こもれび雑貨 |
| `nav.home` | Home | ホーム |
| `nav.search` | Search | 検索 |
| `nav.cart` | Cart | カート |
| `nav.account` | Account | アカウント |
| `nav.orders` | My Orders | 注文履歴 |
| `admin.sales` | Sales | 売上 |
| `admin.products` | Products | 商品 |
| `admin.orders` | Orders | 注文 |
| `admin.coupons` | Coupons | クーポン |
| `admin.reviews` | Reviews | レビュー |
| `admin.shipping` | Shipping | 配送 |
| `admin.view_shop` | View Shop | ショップを表示 |

## Adding to it

- A new storefront page (a lookbook, a gift guide) is a ProductGrid with a heading and a filter preset; add its route under the shop's TopBar.
- Reviews on product pages are **Reviews** (stars, the list, the write-a-review form, owner approval); shipping prices by region are **ShippingRates** in Admin · Shipping, read by Checkout's Delivery step.
- Bulk changes to products go through **CsvImport** and **ExportCsv** (same columns both ways).
