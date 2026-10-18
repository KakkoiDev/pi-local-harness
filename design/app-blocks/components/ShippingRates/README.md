# ShippingRates

Delivery prices by area and speed, the free-delivery threshold, and the delivery line shown in the cart and at checkout.

| | |
| --- | --- |
| Group | Commerce |
| Basecoat | `table`, `table-container`, `alert` |
| Route | `/shipping` (a page linked from the footer and ProductPage); the line inside Cart and Checkout |
| Needs | Web: `GET /shipping`, `GET /shipping/quote`; no server: `shipping.quote()` over bundled rates |
| Links to | Cart, Checkout, ProductPage, SettingsPage (where the shop edits rates); used in AppShop |

## Markup

```html
<section id="shipping" class="grid gap-4" aria-labelledby="shipping-title">
  <h2 id="shipping-title" class="text-xl font-semibold" data-t="ship.title">Delivery rates</h2>
  <p class="text-sm text-muted-foreground" data-t="ship.lede">Prices include tax. Orders over ¥5,000 ship free to every area except Okinawa and remote islands.</p>
  <div class="table-container">
    <table class="table">
      <caption class="sr-only" data-t="ship.caption">Delivery rates by area</caption>
      <thead><tr><th scope="col" data-t="ship.area">Area</th><th scope="col" data-t="ship.prefectures">Prefectures</th><th scope="col" class="text-right" data-t="ship.standard">Standard (2–4 days)</th><th scope="col" class="text-right" data-t="ship.express">Express (next day)</th></tr></thead>
      <tbody>
      <tr><th scope="row" class="font-medium" data-t="ship.zone.hokkaido">Hokkaido</th><td class="text-sm text-muted-foreground" data-t="ship.pref.hokkaido">Hokkaido</td><td class="text-right tabular-nums">¥1,100</td><td class="text-right tabular-nums">¥1,650</td></tr>
      <tr><th scope="row" class="font-medium" data-t="ship.zone.tohoku">Tohoku</th><td class="text-sm text-muted-foreground" data-t="ship.pref.tohoku">Aomori, Iwate, Miyagi, Akita, Yamagata, Fukushima</td><td class="text-right tabular-nums">¥770</td><td class="text-right tabular-nums">¥1,320</td></tr>
      <tr><th scope="row" class="font-medium" data-t="ship.zone.kanto">Kanto</th><td class="text-sm text-muted-foreground" data-t="ship.pref.kanto">Tokyo, Kanagawa, Saitama, Chiba, Ibaraki, Tochigi, Gunma, Yamanashi</td><td class="text-right tabular-nums">¥550</td><td class="text-right tabular-nums">¥990</td></tr>
      <tr><th scope="row" class="font-medium" data-t="ship.zone.chubu">Chubu</th><td class="text-sm text-muted-foreground" data-t="ship.pref.chubu">Niigata, Toyama, Ishikawa, Fukui, Nagano, Gifu, Shizuoka, Aichi</td><td class="text-right tabular-nums">¥660</td><td class="text-right tabular-nums">¥1,100</td></tr>
      <tr><th scope="row" class="font-medium" data-t="ship.zone.kansai">Kansai</th><td class="text-sm text-muted-foreground" data-t="ship.pref.kansai">Osaka, Kyoto, Hyogo, Nara, Shiga, Wakayama, Mie</td><td class="text-right tabular-nums">¥660</td><td class="text-right tabular-nums">¥1,100</td></tr>
      <tr><th scope="row" class="font-medium" data-t="ship.zone.chugoku_shikoku">Chugoku and Shikoku</th><td class="text-sm text-muted-foreground" data-t="ship.pref.chugoku_shikoku">Tottori, Shimane, Okayama, Hiroshima, Yamaguchi, Tokushima, Kagawa, Ehime, Kochi</td><td class="text-right tabular-nums">¥770</td><td class="text-right tabular-nums">¥1,320</td></tr>
      <tr><th scope="row" class="font-medium" data-t="ship.zone.kyushu">Kyushu</th><td class="text-sm text-muted-foreground" data-t="ship.pref.kyushu">Fukuoka, Saga, Nagasaki, Kumamoto, Oita, Miyazaki, Kagoshima</td><td class="text-right tabular-nums">¥880</td><td class="text-right tabular-nums">¥1,430</td></tr>
      <tr><th scope="row" class="font-medium" data-t="ship.zone.okinawa">Okinawa</th><td class="text-sm text-muted-foreground" data-t="ship.pref.okinawa">Okinawa</td><td class="text-right tabular-nums">¥1,540</td><td class="text-right text-muted-foreground" data-t="ship.not_available">Not available</td></tr>
      </tbody>
      <tfoot><tr><td colspan="3" class="text-sm" data-t="ship.free_over">Free over ¥5,000</td><td class="text-right text-sm text-muted-foreground">—</td></tr></tfoot>
    </table>
  </div>
</section>

<!-- at checkout, Okinawa chosen: above the speed options -->
<div class="alert" role="status"><h2 data-t="ship.checkout.unavailable">Express isn’t available to Okinawa. Choose Standard.</h2></div>

<!-- at checkout and in Cart, under the subtotal -->
<div id="ship-line" class="grid gap-1 border-t pt-3" aria-live="polite">
  <div class="flex items-center justify-between gap-3 text-sm">
    <span class="flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg><span data-t="ship.checkout.label">Delivery to Kanto</span></span>
    <span class="tabular-nums">¥550</span>
  </div>
  <p id="ship-more" class="text-sm text-muted-foreground" data-t="ship.checkout.add_more">Add ¥1,200 more for free delivery.</p>
</div>

<!-- before an address is known -->
<p class="text-sm text-muted-foreground" data-t="ship.checkout.choose_address">Delivery is worked out from your address.</p>
```

- One table, read from one list of areas (Data). Each area is a row header (`th scope="row"`); a rate the area can't have reads `ship.not_available`, never an empty cell.
- The checkout line goes in Cart's and Checkout's summary, under the subtotal. It changes when the address or the cart changes (`aria-live="polite"` so the new price is read out).
- “Add ¥1,200 more for free delivery” shows only while the subtotal is under the threshold and the area can get free delivery (not Okinawa).

## States

| State | What changes |
| --- | --- |
| No address yet | The checkout line shows `ship.checkout.choose_address` instead of a price. |
| Under the threshold | The price and `ship.checkout.add_more` with the amount still needed. |
| Free | The price reads `ship.checkout.free`; the add-more line is removed. |
| Express not available | For Okinawa the Express option in Checkout is disabled and the status alert `ship.checkout.unavailable` (filled with the area) shows above the options. |
| Couldn’t load | The table area shows the destructive alert `ship.error.load` with Try Again; checkout still works out the price on the server. |
| Phone | The Prefectures column is hidden (the compact table); the area name stays the row header. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `ship.title` | Delivery rates | 送料 |
| `ship.lede` | Prices include tax. Orders over {threshold} ship free to every area except Okinawa and remote islands. | 税込価格です。{threshold}以上のご注文は、沖縄・離島を除く全地域で送料無料です。 |
| `ship.caption` | Delivery rates by area | 地域別の送料 |
| `ship.area` | Area | 地域 |
| `ship.prefectures` | Prefectures | 都道府県 |
| `ship.standard` | Standard (2–4 days) | 通常便（2〜4日） |
| `ship.express` | Express (next day) | 速達便（翌日） |
| `ship.free_over` | Free over {threshold} | {threshold}以上で無料 |
| `ship.not_available` | Not available | 対象外 |
| `ship.zone.hokkaido` | Hokkaido | 北海道 |
| `ship.zone.tohoku` | Tohoku | 東北 |
| `ship.zone.kanto` | Kanto | 関東 |
| `ship.zone.chubu` | Chubu | 中部 |
| `ship.zone.kansai` | Kansai | 関西 |
| `ship.zone.chugoku_shikoku` | Chugoku and Shikoku | 中国・四国 |
| `ship.zone.kyushu` | Kyushu | 九州 |
| `ship.zone.okinawa` | Okinawa | 沖縄 |
| `ship.pref.hokkaido` | Hokkaido | 北海道 |
| `ship.pref.tohoku` | Aomori, Iwate, Miyagi, Akita, Yamagata, Fukushima | 青森、岩手、宮城、秋田、山形、福島 |
| `ship.pref.kanto` | Tokyo, Kanagawa, Saitama, Chiba, Ibaraki, Tochigi, Gunma, Yamanashi | 東京、神奈川、埼玉、千葉、茨城、栃木、群馬、山梨 |
| `ship.pref.chubu` | Niigata, Toyama, Ishikawa, Fukui, Nagano, Gifu, Shizuoka, Aichi | 新潟、富山、石川、福井、長野、岐阜、静岡、愛知 |
| `ship.pref.kansai` | Osaka, Kyoto, Hyogo, Nara, Shiga, Wakayama, Mie | 大阪、京都、兵庫、奈良、滋賀、和歌山、三重 |
| `ship.pref.chugoku_shikoku` | Tottori, Shimane, Okayama, Hiroshima, Yamaguchi, Tokushima, Kagawa, Ehime, Kochi | 鳥取、島根、岡山、広島、山口、徳島、香川、愛媛、高知 |
| `ship.pref.kyushu` | Fukuoka, Saga, Nagasaki, Kumamoto, Oita, Miyazaki, Kagoshima | 福岡、佐賀、長崎、熊本、大分、宮崎、鹿児島 |
| `ship.pref.okinawa` | Okinawa | 沖縄 |
| `ship.checkout.label` | Delivery to {area} | {area}への配送 |
| `ship.checkout.free` | Free | 無料 |
| `ship.checkout.add_more` | Add {amount} more for free delivery. | あと{amount}で送料無料です。 |
| `ship.checkout.choose_address` | Delivery is worked out from your address. | 送料はお届け先の住所から計算されます。 |
| `ship.checkout.unavailable` | Express isn’t available to {area}. Choose Standard. | {area}へは速達便をご利用いただけません。通常便をお選びください。 |
| `ship.error.load` | Couldn’t load the delivery rates. Try again, or see the price at checkout. | 送料を読み込めませんでした。もう一度お試しいただくか、購入手続きで料金をご確認ください。 |
| `ship.retry` | Try Again | もう一度試す |

## Keyboard and focus

- The table is read row by row; each row starts with its area name. No controls inside it.
- At checkout the line updates without moving focus; screen readers hear the new price.

## Phone

- The Prefectures column is removed below 48rem (render the compact table, or add `@max-3xl:hidden` to that column's cells); the table scrolls sideways inside `.table-container` if prices still don't fit.
- The checkout line stays one row: label left, price right.

## Data

```json
{"currency": "JPY", "tax_included": true, "free_over": 5000, "free_excludes": ["okinawa"],
 "zones": [{"id": "kanto", "prefectures": ["tokyo", "kanagawa", "saitama", "chiba", "ibaraki", "tochigi", "gunma", "yamanashi"],
            "standard": 550, "express": 990},
           {"id": "okinawa", "prefectures": ["okinawa"], "standard": 1540, "express": null}]}
```

- Web: `GET /shipping` renders the table; Checkout asks `GET /shipping/quote?prefecture=tokyo&subtotal=3800&speed=standard` → `{"price": 550, "free": false, "add_more": 1200}` and swaps the line (htmx fragment). The shop edits the rates in its admin (SettingsPage section); the server always recomputes the price when the order is placed.
- No server: the same JSON shipped with the app, `shipping.quote(prefecture, subtotal, speed)` in `js/logic/`.

## Don't

- Don't calculate the final delivery price only in the browser; the order uses the server's number.
- Don't leave a rate empty or write 0 for “not available”.
- Don't add weight- or size-based tiers here; that is a different block.
