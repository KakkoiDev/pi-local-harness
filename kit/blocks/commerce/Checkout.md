# Checkout

App Block card (Commerce). Checkout in four steps (address, delivery, payment, review) with the order summary beside it, Japanese address fields, and payment by card, convenience store or bank transfer.

- Basecoat: `field`, `label`, `input`, `select`, `item` (payment choices), `card`, `btn`, `alert`; the step list is Stepper
- Route: `/checkout` (`/checkout/address`, `/delivery`, `/payment`, `/review`)
- Needs: **Needs a server** and a payment provider’s hosted card field; no-server apps link to the provider’s hosted checkout page instead
- Links to: Cart, Coupons, OrderConfirmation, Stepper, LogIn (optional: guests can check out)

## Markup
Copy, never retype: `{harness}/kit/blocks/commerce/Checkout.html` (25 lines of HTML).

## States
- Step 1 Address: Family name first (Japanese order), postal code fills prefecture and city (`GET /postal/<code>`), building optional, phone for the driver. Saved addresses (logged in) appear as radio `item`s above the form.
- Field errors: On Continue: `aria-invalid="true"` and the message under the field (`checkout.error.*`); focus goes to the first invalid field.
- Step 2 Delivery: Radio `item`s: Standard (date), Express (date, price), and a delivery time window `select` (午前中, 14–16, 16–18, 18–20, 19–21).
- Step 3 Payment: Radio `item`s for card, convenience store, bank transfer. Card: the provider’s secure field mounts in `#card-element`; this page never sees the number.
- Step 4 Review: Every choice with **Change** (goes back to that step), the total in the button `checkout.place`, the terms line.
- Placing: The button `disabled aria-busy="true"` `checkout.placing` and the don’t-close line. A second click does nothing (the server uses an idempotency key).
- Declined: An `alert` (destructive) `checkout.declined`, back on step 3 with the card field cleared. Nothing was charged.
- Cart changed: If stock or prices changed, back to Cart with its notes (Cart states).

## Texts
(Key | English | 日本語)
- `checkout.title`: Check out | 購入手続き
- `checkout.steps`: Checkout steps | 購入手続きの手順
- `checkout.step.address`: Address | お届け先
- `checkout.step.delivery`: Delivery | 配送方法
- `checkout.step.payment`: Payment | お支払い
- `checkout.step.review`: Review | 確認
- `checkout.family_name`: Family name | 姓
- `checkout.given_name`: Given name | 名
- `checkout.postal`: Postal code | 郵便番号
- `checkout.postal_help`: We fill in the prefecture and city from it. | 入力すると都道府県と市区町村が自動で入ります。
- `checkout.prefecture`: Prefecture | 都道府県
- `checkout.city`: City, ward, town | 市区町村
- `checkout.line1`: Street and number | 番地
- `checkout.line2`: Building and room (optional) | 建物名・部屋番号（任意）
- `checkout.tel`: Phone (for the delivery driver) | 電話番号（配達時の連絡用）
- `checkout.back_cart`: Back to Cart | カートに戻る
- `checkout.to_delivery`: Continue to Delivery | 配送方法へ進む
- `checkout.pay_how`: How do you want to pay? | お支払い方法
- `checkout.card`: Credit or debit card | クレジット・デビットカード
- `checkout.konbini`: Convenience store | コンビニ払い
- `checkout.bank`: Bank transfer | 銀行振込
- `checkout.place`: Place Order · {total} | 注文を確定する・{total}
- `checkout.placing`: Placing Your Order… | 注文を確定しています…
- `checkout.dont_close`: Don’t close this page. It takes a few seconds. | このページを閉じないでください。数秒かかります。
- `checkout.declined_title`: Your card was declined | カードが承認されませんでした
- `checkout.declined`: The card issuer said no. Nothing was charged. Try another card or choose convenience store payment. | カード会社により承認されませんでした。請求は発生していません。別のカードを使うか、コンビニ払いをお選びください。
- `checkout.error.postal`: Enter a 7-digit postal code, like 150-0001. | 150-0001のように7桁で入力してください。
- `checkout.error.required`: Fill this in. | 入力してください。
- `checkout.change`: Change | 変更
- `checkout.terms`: By placing your order you agree to the terms of sale. | ご注文の確定により、販売条件に同意したものとみなされます。

## Keyboard and focus
1. Steps list (not interactive; done steps are links back) → 2. the step’s fields in reading order → 3. Back → 4. Continue.
- Each step’s heading gets focus when the step loads (`tabindex="-1"`), so screen readers hear where they are.
- Return in a field submits the step.

## Phone
- One column; the step list wraps; the summary moves under the form as a closed `details` “Order summary · ¥4,730”.
- Inputs use the right keyboards: `inputmode="numeric"` for the postal code, `type="tel"`.
- Buttons are full width and 44 px; Back is a ghost button above Continue.

## Data
```json
{"address":{"family_name":"佐藤","given_name":"愛子","postal_code":"150-0001","prefecture":"東京都","city":"渋谷区神宮前","line1":"1-2-3","line2":"","tel":"090-1234-5678"},"delivery":{"method":"standard","window":"14-16"},"payment":{"method":"card"},"idempotency_key":"c8f…"}
```

- Web: each step `POST /checkout/<step>` with htmx; 422 re-renders the step with errors; 200 returns the next step (`hx-push-url`). `POST /checkout/place` creates the order and returns `HX-Redirect: /orders/<id>/thanks`.
- Card payments: the provider’s client library mounts its field and returns a token; the server charges with it. Konbini and bank transfer create a pending order with a deadline.

## Don't
- Don’t build your own card number field or store card numbers.
- Don’t require an account to check out.
- Don’t put the steps on one long page without the step list, or hide shipping costs until Review.
- Don’t use Western address order (city before street) for Japanese addresses.

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> Checkout` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
