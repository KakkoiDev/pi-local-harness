# MapPlaceholder

App Block card (Other elements). Show where a place is without a map library: the address, how to get there, and a link that opens the person's own maps app.

- Basecoat: `card`, `btn`, `button-group`, `badge`
- Needs: An address (and optionally latitude/longitude). No network, no tiles, no API key
- Used in: AppBooking (the venue), ProductPage (store pickup), OrderConfirmation, AppPortfolio (contact), Agenda (event place)

## Markup
Copy, never retype: `{harness}/kit/blocks/elements/MapPlaceholder.html` (25 lines of HTML).

The link is a plain search URL with the coordinates (or the URL-encoded address when there are none); on phones it opens the installed maps app. Use `geo:35.6702,139.7027` only in an Android-only app. Copy Address writes the address with `navigator.clipboard.writeText` and shows Toasts “Address copied”.

## States
- With coordinates: Links use `query=lat,lng`.
- Address only: Links use `query=` + the encoded address; the pin stays centred.
- No address yet: The drawing without a pin, `place.none` and, for editors, an Add an Address button.
- Online-only place: Replace the card with `place.online` and the meeting link; no drawing.
- Several places: A list of these cards (`grid gap-3 @3xl:grid-cols-2`); never one drawing with several pins.
- Copied: Toast `place.copied`. If the clipboard is refused, select the address text instead.

## Texts
(Key | English | 日本語)
- `place.open_maps`: Open in Maps | 地図アプリで開く
- `place.directions`: Directions | 経路を表示
- `place.copy`: Copy Address | 住所をコピー
- `place.copied`: Address copied | 住所をコピーしました
- `place.directions_text`: 5 minutes from Harajuku Station, Omotesando exit. | 原宿駅表参道口から徒歩5分。
- `place.none`: No address yet. | 住所はまだ登録されていません。
- `place.add`: Add an Address | 住所を追加
- `place.online`: This takes place online. | オンラインで開催します。

Japanese addresses run from the largest unit: 〒 postal code, prefecture, city, ward, block numbers, building. English addresses run the other way. Show the one for the page language first and the other below it, `lang` set, when the place is in Japan.

## Keyboard and focus
1. Open in Maps → 2. Directions → 3. Copy Address. The drawing is `aria-hidden`.
- Both links say in `sr-only` that they open another app or tab: `<span class="sr-only" data-t="common.new_tab">(opens in a new tab)</span>`.

## Phone
- The drawing keeps 16:9 and the buttons wrap; Open in Maps first, full width (`@max-3xl:w-full` on the first link).
- On phones the address is long-pressable text (no `user-select: none`).

## Data
```json
{"name": "Kissa Hoshi", "postal_code": "150-0001", "address_ja": "東京都渋谷区神宮前 1-2-3", "address_en": "1-2-3 Jingumae, Shibuya, Tokyo",
 "lat": 35.6702, "lng": 139.7027, "directions": "5 minutes from Harajuku Station, Omotesando exit."}
```

- Web and no server alike: plain fields on the record; build the URLs when rendering (`urllib.parse.quote` / `encodeURIComponent`).

## Don't
- Don't add Leaflet, a tile server, an embed `iframe` or an API key: the app must work offline and load nothing from elsewhere.
- Don't draw fake streets or a fake neighbourhood.
- Don't geocode addresses in the app.

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> MapPlaceholder` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
