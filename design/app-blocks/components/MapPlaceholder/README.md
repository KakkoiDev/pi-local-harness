# MapPlaceholder

Show where a place is without a map library: the address, how to get there, and a link that opens the person's own maps app.

| | |
| --- | --- |
| Group | Other elements |
| Basecoat | `card`, `btn`, `button-group`, `badge` |
| Needs | An address (and optionally latitude/longitude). No network, no tiles, no API key |
| Used in | AppBooking (the venue), ProductPage (store pickup), OrderConfirmation, AppPortfolio (contact), Agenda (event place) |

Generated apps ship no map library and load nothing from other servers, so a map is a **placeholder drawing** plus a link out. The drawing is a decorative SVG grid with a pin (no real streets: it must not pretend to be a map).

## Markup

```html
<section class="card gap-0 overflow-hidden p-0" aria-labelledby="place-name">
  <div class="relative aspect-[16/9] bg-muted" aria-hidden="true">
    <svg class="absolute inset-0 size-full text-border" preserveAspectRatio="none" viewBox="0 0 160 90">
      <defs><pattern id="map-grid" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M16 0H0V16" fill="none" stroke="currentColor" stroke-width="0.6"/></pattern></defs>
      <rect width="160" height="90" fill="url(#map-grid)"/>
      <path d="M0 62 C40 50 70 70 160 44" fill="none" stroke="currentColor" stroke-width="5"/>
    </svg>
    <svg class="absolute left-1/2 top-1/2 size-9 -translate-x-1/2 -translate-y-full text-primary drop-shadow" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a8 8 0 0 0-8 8c0 6 8 12 8 12s8-6 8-12a8 8 0 0 0-8-8zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/></svg>
  </div>
  <div class="grid gap-3 p-4">
    <div>
      <h3 id="place-name" class="font-medium">Kissa Hoshi</h3>
      <address class="text-sm not-italic text-muted-foreground">
        <span translate="no">〒150-0001</span> 東京都渋谷区神宮前 1-2-3<br>
        <span lang="en">1-2-3 Jingumae, Shibuya, Tokyo 150-0001</span>
      </address>
    </div>
    <p class="text-sm" data-t="place.directions_text">5 minutes from Harajuku Station, Omotesando exit.</p>
    <div class="flex flex-wrap gap-2">
      <a class="btn" href="https://www.google.com/maps/search/?api=1&amp;query=35.6702%2C139.7027" target="_blank" rel="noopener" data-t="place.open_maps">Open in Maps</a>
      <a class="btn" data-variant="outline" href="https://www.google.com/maps/dir/?api=1&amp;destination=35.6702%2C139.7027" target="_blank" rel="noopener" data-t="place.directions">Directions</a>
      <button class="btn" data-variant="ghost" type="button" data-copy="東京都渋谷区神宮前 1-2-3" data-t="place.copy">Copy Address</button>
    </div>
  </div>
</section>
```

The link is a plain search URL with the coordinates (or the URL-encoded address when there are none); on phones it opens the installed maps app. Use `geo:35.6702,139.7027` only in an Android-only app. Copy Address writes the address with `navigator.clipboard.writeText` and shows Toasts “Address copied”.

## States

| State | What changes |
| --- | --- |
| With coordinates | Links use `query=lat,lng`. |
| Address only | Links use `query=` + the encoded address; the pin stays centred. |
| No address yet | The drawing without a pin, `place.none` and, for editors, an Add an Address button. |
| Online-only place | Replace the card with `place.online` and the meeting link; no drawing. |
| Several places | A list of these cards (`grid gap-3 @3xl:grid-cols-2`); never one drawing with several pins. |
| Copied | Toast `place.copied`. If the clipboard is refused, select the address text instead. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `place.open_maps` | Open in Maps | 地図アプリで開く |
| `place.directions` | Directions | 経路を表示 |
| `place.copy` | Copy Address | 住所をコピー |
| `place.copied` | Address copied | 住所をコピーしました |
| `place.directions_text` | 5 minutes from Harajuku Station, Omotesando exit. | 原宿駅表参道口から徒歩5分。 |
| `place.none` | No address yet. | 住所はまだ登録されていません。 |
| `place.add` | Add an Address | 住所を追加 |
| `place.online` | This takes place online. | オンラインで開催します。 |

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
