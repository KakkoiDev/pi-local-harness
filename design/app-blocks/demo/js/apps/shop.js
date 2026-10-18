// Komorebi Goods: the AppShop storefront, built from TopBar, BottomBar, ListSearch, ProductGrid, Breadcrumbs, ProductPage,
// Gallery, Cart, Coupons, EmptyState, Checkout, Stepper, EditForm, InlineAlert, OrderConfirmation, OrderHistory, DetailView,
// StatusBadges, LogIn, Toasts, DeleteUndo.
import { html, raw, icon } from '../kit.js';

// ---- products (original illustrations drawn in SVG with the chart tokens) ----
const P = [
  { id: 'mug', cat: 'kitchen', price: 2200, sale: 1650, stock: 12, art: 'mug', name: { en: 'Ceramic Mug', ja: '陶器のマグカップ' },
    desc: { en: 'Hand-glazed stoneware from Mashiko. Holds 320 ml, safe in the dishwasher and microwave.', ja: '益子で手作業で釉薬をかけた陶器。容量 320 ml、食洗機・電子レンジ対応。' },
    variants: [{ id: 'blue', c: 1, en: 'Indigo', ja: '藍', stock: 12 }, { id: 'green', c: 3, en: 'Moss', ja: '苔', stock: 2 }, { id: 'clay', c: 5, en: 'Clay', ja: '土', stock: 0 }] },
  { id: 'tote', cat: 'bags', price: 2800, stock: 30, art: 'tote', name: { en: 'Canvas Tote', ja: '帆布のトートバッグ' },
    desc: { en: 'Heavy cotton canvas with a pocket inside. Fits an A4 notebook and a lunch box.', ja: '厚手のコットン帆布、内ポケット付き。A4 ノートとお弁当箱が入ります。' },
    variants: [{ id: 'natural', c: 2, en: 'Natural', ja: '生成り', stock: 30 }, { id: 'navy', c: 1, en: 'Navy', ja: '紺', stock: 8 }] },
  { id: 'notebook', cat: 'stationery', price: 880, stock: 40, art: 'book', name: { en: 'Grid Notebook A5', ja: '方眼ノート A5' },
    desc: { en: '96 pages of 5 mm grid on paper that fountain pens don’t bleed through.', ja: '5 mm 方眼、96ページ。万年筆でもにじみにくい紙です。' },
    variants: [{ id: 'green', c: 3, en: 'Green', ja: '緑', stock: 40 }, { id: 'orange', c: 2, en: 'Orange', ja: '橙', stock: 25 }] },
  { id: 'vase', cat: 'home', price: 4600, stock: 3, art: 'vase', name: { en: 'Bud Vase', ja: '一輪挿し' },
    desc: { en: 'A small glass vase for one stem. Each one is blown by hand, so no two are the same.', ja: '一輪用の小さなガラスの花瓶。手吹きのため、一つずつ形が違います。' },
    variants: [{ id: 'clear', c: 1, en: 'Clear', ja: '透明', stock: 3 }] },
  { id: 'towel', cat: 'home', price: 1980, stock: 0, art: 'towel', name: { en: 'Imabari Hand Towel', ja: '今治のハンドタオル' },
    desc: { en: 'Soft, quick-drying cotton towel woven in Imabari. 34 × 35 cm.', ja: '今治で織られた、柔らかく乾きやすい綿のタオル。34 × 35 cm。' },
    variants: [{ id: 'white', c: 1, en: 'Sky', ja: '空色', stock: 0 }] },
  { id: 'chopsticks', cat: 'kitchen', price: 1320, stock: 50, art: 'sticks', name: { en: 'Chestnut Chopsticks', ja: '栗の木のお箸' },
    desc: { en: 'Lacquered chestnut wood, 22.5 cm. Wash by hand.', ja: '漆塗りの栗の木、22.5 cm。手洗いしてください。' },
    variants: [{ id: 'brown', c: 5, en: 'Brown', ja: '茶', stock: 50 }] },
  { id: 'plate', cat: 'kitchen', price: 3300, stock: 9, art: 'plate', name: { en: 'Rinka Plate 18 cm', ja: '輪花皿 18 cm' },
    desc: { en: 'A flower-rimmed plate for cakes and side dishes.', ja: 'ケーキやおかずに使える、花の形の縁のお皿。' },
    variants: [{ id: 'white', c: 4, en: 'Plum', ja: '梅', stock: 9 }] },
  { id: 'pen', cat: 'stationery', price: 550, stock: 120, art: 'pen', name: { en: 'Gel Pen 0.5', ja: 'ゲルペン 0.5' },
    desc: { en: 'Smooth gel ink that dries fast, for left-handers too.', ja: 'なめらかで乾きが速いゲルインク。左利きの方にも。' },
    variants: [{ id: 'black', c: 1, en: 'Blue black', ja: 'ブルーブラック', stock: 120 }, { id: 'red', c: 5, en: 'Vermilion', ja: '朱', stock: 60 }] },
];
const CATS = ['all', 'kitchen', 'home', 'bags', 'stationery'];
const COUPONS = { WELCOME500: { off: 500, min: 3000 }, AUTUMN10: { pct: 10, min: 0 } };
const SHIP = { standard: 550, express: 990 };
const FREE_FROM = 5000;

function art(kind, c, view = 0) {
  const fg = `var(--chart-${c})`;
  const bg = 'var(--muted)';
  const tilt = view === 1 ? 'rotate(-8 60 60)' : view === 2 ? 'translate(0 6) scale(1)' : '';
  const shapes = {
    mug: `<rect x="34" y="40" width="44" height="46" rx="6" fill="${fg}"/><path d="M78 50h8a10 10 0 0 1 0 20h-8" fill="none" stroke="${fg}" stroke-width="7"/><rect x="34" y="40" width="44" height="7" rx="3" fill="var(--background)" opacity=".35"/>`,
    tote: `<path d="M46 44a14 14 0 0 1 28 0" fill="none" stroke="${fg}" stroke-width="5"/><path d="M32 46h56l-5 46H37z" fill="${fg}"/><rect x="50" y="60" width="20" height="14" rx="2" fill="var(--background)" opacity=".35"/>`,
    book: `<rect x="36" y="28" width="48" height="64" rx="4" fill="${fg}"/><rect x="42" y="28" width="4" height="64" fill="var(--background)" opacity=".4"/><path d="M54 46h22M54 54h22M54 62h14" stroke="var(--background)" stroke-width="3" opacity=".6"/>`,
    vase: `<path d="M54 30h12v10c10 6 14 16 14 28 0 14-9 24-20 24s-20-10-20-24c0-12 4-22 14-28z" fill="${fg}" opacity=".85"/><path d="M60 30c0-10 4-16 10-20" stroke="var(--chart-3)" stroke-width="3" fill="none"/><circle cx="71" cy="9" r="5" fill="var(--chart-4)"/>`,
    towel: `<rect x="30" y="34" width="60" height="52" rx="5" fill="${fg}" opacity=".8"/><path d="M30 46h60M30 76h60" stroke="var(--background)" stroke-width="3" opacity=".6"/>`,
    sticks: `<rect x="40" y="22" width="5" height="76" rx="2" transform="rotate(-10 42 60)" fill="${fg}"/><rect x="56" y="22" width="5" height="76" rx="2" transform="rotate(-4 58 60)" fill="${fg}"/><rect x="72" y="82" width="22" height="8" rx="4" fill="var(--chart-3)"/>`,
    plate: `<circle cx="60" cy="62" r="34" fill="${fg}" opacity=".35"/><circle cx="60" cy="62" r="24" fill="${fg}" opacity=".7"/><circle cx="60" cy="62" r="9" fill="var(--background)" opacity=".5"/>`,
    pen: `<rect x="56" y="18" width="10" height="70" rx="3" transform="rotate(30 61 53)" fill="${fg}"/><path d="M77 88l-6 12 -3-12z" transform="rotate(30 61 53)" fill="var(--foreground)"/>`,
  };
  return raw(`<svg viewBox="0 0 120 120" class="block size-full" role="img" aria-hidden="true"><rect width="120" height="120" fill="${bg}"/><g transform="${tilt}">${shapes[kind]}</g></svg>`);
}

const M = {
  en: {
    'app.name': 'Komorebi Goods', 'nav.main': 'Main', 'nav.home': 'Home', 'nav.search': 'Search', 'nav.cart': 'Cart', 'nav.account': 'Account', 'nav.orders': 'My Orders',
    'search.label': 'Search the shop', 'search.hint': 'Mugs, totes, notebooks…',
    'cat.all': 'All', 'cat.kitchen': 'Kitchen', 'cat.home': 'Home', 'cat.bags': 'Bags', 'cat.stationery': 'Stationery',
    'shop.title': 'Small things for every day', 'shop.lede': 'Made by hand in Japan, shipped from Kyoto.', 'shop.count': '{n} products', 'shop.count_one': '1 product',
    'shop.sort': 'Sort by', 'shop.sort.popular': 'Most popular', 'shop.sort.price_asc': 'Price, low to high', 'shop.sort.price_desc': 'Price, high to low',
    'shop.add': 'Add to Cart', 'shop.sold_out': 'Sold out', 'shop.low': 'Only {n} left', 'shop.off': '{n} % off', 'shop.tax_included': 'tax included', 'shop.was': 'Was {price}',
    'empty.title': 'Nothing matches “{q}”', 'empty.text': 'Try another word, or look in All.', 'empty.clear': 'Clear Search',
    'product.color': 'Colour', 'product.qty': 'Quantity', 'product.less': 'One less', 'product.more': 'One more', 'product.in_stock': 'In stock, ships in 1–2 days', 'product.low': 'Only {n} left', 'product.sold_out': 'Sold out in this colour',
    'product.notify': 'Email Me When It’s Back', 'product.notified': 'We’ll email you when it’s back', 'product.photo': 'Photo {n} of {total}', 'product.free': 'Free delivery from {amount}',
    'added.title': 'Added to cart', 'added.view': 'View Cart',
    'cart.title': 'Your cart', 'cart.remove': 'Remove', 'cart.removed': 'Removed {name}', 'cart.undo': 'Undo', 'cart.summary': 'Order summary', 'cart.subtotal': 'Subtotal', 'cart.discount': 'Coupon', 'cart.shipping': 'Delivery',
    'cart.free': 'Free', 'cart.total': 'Total', 'cart.checkout': 'Check Out', 'cart.continue': 'Keep Shopping', 'cart.to_free': 'Add {amount} more for free delivery.', 'cart.empty_title': 'Your cart is empty', 'cart.empty_text': 'Find something you like and it will wait here.',
    'coupon.label': 'Coupon code', 'coupon.apply': 'Apply', 'coupon.applied': '{off} off', 'coupon.remove': 'Remove', 'coupon.hint': 'Try WELCOME500 or AUTUMN10.',
    'coupon.error.unknown': 'That code doesn’t exist. Check the spelling.', 'coupon.error.min': 'This code needs an order of {amount} or more.', 'coupon.error.empty': 'Enter a code.',
    'checkout.title': 'Check out', 'checkout.steps': 'Checkout steps', 'step.address': 'Address', 'step.delivery': 'Delivery', 'step.payment': 'Payment', 'step.review': 'Review',
    'addr.family': 'Family name', 'addr.given': 'Given name', 'addr.postal': 'Postal code', 'addr.postal_help': '7 digits, like 150-0001', 'addr.pref': 'Prefecture', 'addr.city': 'City, ward, town', 'addr.line1': 'Street and number', 'addr.line2': 'Building and room (optional)', 'addr.tel': 'Phone (for the delivery driver)',
    'addr.error.summary': 'Fix {n} things before going on', 'addr.error.required': 'Fill this in.', 'addr.error.postal': 'Enter 7 digits, like 150-0001.', 'addr.error.tel': 'Enter a phone number, like 090-1234-5678.',
    'delivery.standard': 'Standard', 'delivery.standard_d': '2–3 days', 'delivery.express': 'Express', 'delivery.express_d': 'Tomorrow, if ordered by 15:00', 'delivery.when': 'Delivery time', 'delivery.any': 'Any time', 'delivery.am': 'Morning', 'delivery.pm': '14:00–18:00', 'delivery.eve': '18:00–21:00',
    'pay.card': 'Card', 'pay.konbini': 'Pay at a convenience store', 'pay.konbini_d': 'You get a number to pay within 3 days', 'pay.card_number': 'Card number', 'pay.expiry': 'Expiry (MM/YY)', 'pay.cvc': 'Security code',
    'pay.error.card': 'Enter the 16 digits on the card.', 'pay.error.expiry': 'Enter the month and year, like 08/28.', 'pay.error.cvc': 'Enter the 3 digits on the back.',
    'checkout.back': 'Back', 'checkout.back_cart': 'Back to Cart', 'checkout.next_delivery': 'Continue to Delivery', 'checkout.next_payment': 'Continue to Payment', 'checkout.next_review': 'Review Order', 'checkout.place': 'Place Order', 'checkout.placing': 'Placing Order…',
    'review.ship_to': 'Ship to', 'review.delivery': 'Delivery', 'review.payment': 'Payment', 'review.change': 'Change', 'review.card_ending': 'Card ending {last4}',
    'thanks.title': 'Thank you, {name}', 'thanks.lede': 'Order {id} is placed. We sent the receipt to {email}.', 'thanks.when': 'Arrives', 'thanks.track': 'See My Orders', 'thanks.continue': 'Keep Shopping',
    'orders.title': 'My orders', 'orders.empty_title': 'No orders yet', 'orders.empty_text': 'Orders you place appear here with their delivery status.', 'orders.items': '{n} items', 'orders.open': 'View Order',
    'status.paid': 'Paid', 'status.shipped': 'Shipped', 'status.delivered': 'Delivered', 'status.waiting': 'Waiting for payment',
    'order.title': 'Order {id}', 'order.placed': 'Placed {date}', 'order.placed_label': 'Placed', 'order.tracking': 'Tracking number', 'order.items': 'Items', 'order.buy_again': 'Buy Again',
    'login.title': 'Log In', 'login.lede': 'Log in to see your orders.', 'login.email': 'Email', 'login.password': 'Password', 'login.submit': 'Log In', 'login.error.title': 'Couldn’t log you in', 'login.error.wrong': 'The email or password is wrong. Check both and try again.', 'login.hint': 'Any email and a password of 4+ characters works here.',
    'account.title': 'Account', 'account.hello': 'Logged in as {email}', 'account.logout': 'Log Out',
  },
  ja: {
    'app.name': 'こもれび雑貨', 'nav.main': 'メイン', 'nav.home': 'ホーム', 'nav.search': '検索', 'nav.cart': 'カート', 'nav.account': 'アカウント', 'nav.orders': '注文履歴',
    'search.label': 'ショップを検索', 'search.hint': 'マグ、トート、ノート…',
    'cat.all': 'すべて', 'cat.kitchen': 'キッチン', 'cat.home': '暮らし', 'cat.bags': 'バッグ', 'cat.stationery': '文房具',
    'shop.title': '毎日の小さな道具', 'shop.lede': '日本の手仕事を、京都からお届けします。', 'shop.count': '{n}件の商品', 'shop.count_one': '1件の商品',
    'shop.sort': '並べ替え', 'shop.sort.popular': '人気順', 'shop.sort.price_asc': '価格の安い順', 'shop.sort.price_desc': '価格の高い順',
    'shop.add': 'カートに入れる', 'shop.sold_out': '売り切れ', 'shop.low': '残り{n}点', 'shop.off': '{n}% オフ', 'shop.tax_included': '税込', 'shop.was': '通常 {price}',
    'empty.title': '「{q}」に一致する商品はありません', 'empty.text': '別の言葉で探すか、「すべて」をご覧ください。', 'empty.clear': '検索をクリア',
    'product.color': '色', 'product.qty': '数量', 'product.less': '1つ減らす', 'product.more': '1つ増やす', 'product.in_stock': '在庫あり・1〜2日で発送', 'product.low': '残り{n}点', 'product.sold_out': 'この色は売り切れです',
    'product.notify': '再入荷をメールで知らせる', 'product.notified': '再入荷したらメールでお知らせします', 'product.photo': '写真 {n} / {total}', 'product.free': '{amount}以上で送料無料',
    'added.title': 'カートに入れました', 'added.view': 'カートを見る',
    'cart.title': 'カート', 'cart.remove': '削除', 'cart.removed': '{name}を削除しました', 'cart.undo': '元に戻す', 'cart.summary': 'ご注文内容', 'cart.subtotal': '小計', 'cart.discount': 'クーポン', 'cart.shipping': '送料',
    'cart.free': '無料', 'cart.total': '合計', 'cart.checkout': 'レジに進む', 'cart.continue': '買い物を続ける', 'cart.to_free': 'あと{amount}で送料無料です。', 'cart.empty_title': 'カートは空です', 'cart.empty_text': '気に入った商品をカートに入れると、ここに表示されます。',
    'coupon.label': 'クーポンコード', 'coupon.apply': '適用', 'coupon.applied': '{off}引き', 'coupon.remove': '外す', 'coupon.hint': 'WELCOME500 または AUTUMN10 をお試しください。',
    'coupon.error.unknown': 'このコードはありません。つづりを確認してください。', 'coupon.error.min': 'このコードは{amount}以上のご注文で使えます。', 'coupon.error.empty': 'コードを入力してください。',
    'checkout.title': 'ご購入手続き', 'checkout.steps': '購入の手順', 'step.address': 'お届け先', 'step.delivery': '配送', 'step.payment': 'お支払い', 'step.review': '確認',
    'addr.family': '姓', 'addr.given': '名', 'addr.postal': '郵便番号', 'addr.postal_help': '7桁（例：150-0001）', 'addr.pref': '都道府県', 'addr.city': '市区町村', 'addr.line1': '番地', 'addr.line2': '建物名・部屋番号（任意）', 'addr.tel': '電話番号（配達員からの連絡用）',
    'addr.error.summary': '先に進む前に{n}か所直してください', 'addr.error.required': '入力してください。', 'addr.error.postal': '150-0001 のように7桁で入力してください。', 'addr.error.tel': '090-1234-5678 のように入力してください。',
    'delivery.standard': '通常配送', 'delivery.standard_d': '2〜3日', 'delivery.express': 'お急ぎ便', 'delivery.express_d': '15時までのご注文で翌日', 'delivery.when': '配達時間帯', 'delivery.any': '指定なし', 'delivery.am': '午前中', 'delivery.pm': '14〜18時', 'delivery.eve': '18〜21時',
    'pay.card': 'クレジットカード', 'pay.konbini': 'コンビニ払い', 'pay.konbini_d': '3日以内にお支払いいただく番号をお送りします', 'pay.card_number': 'カード番号', 'pay.expiry': '有効期限（MM/YY）', 'pay.cvc': 'セキュリティコード',
    'pay.error.card': 'カードの16桁の番号を入力してください。', 'pay.error.expiry': '08/28 のように月と年を入力してください。', 'pay.error.cvc': '裏面の3桁を入力してください。',
    'checkout.back': '戻る', 'checkout.back_cart': 'カートに戻る', 'checkout.next_delivery': '配送方法へ', 'checkout.next_payment': 'お支払いへ', 'checkout.next_review': '注文内容を確認', 'checkout.place': '注文を確定する', 'checkout.placing': '注文中…',
    'review.ship_to': 'お届け先', 'review.delivery': '配送', 'review.payment': 'お支払い', 'review.change': '変更', 'review.card_ending': '末尾 {last4} のカード',
    'thanks.title': '{name}様、ありがとうございます', 'thanks.lede': 'ご注文 {id} を承りました。{email} に領収書をお送りしました。', 'thanks.when': 'お届け予定', 'thanks.track': '注文履歴を見る', 'thanks.continue': '買い物を続ける',
    'orders.title': '注文履歴', 'orders.empty_title': '注文はまだありません', 'orders.empty_text': 'ご注文はここに配送状況とともに表示されます。', 'orders.items': '{n}点', 'orders.open': '注文を見る',
    'status.paid': '支払い済み', 'status.shipped': '発送済み', 'status.delivered': '配達済み', 'status.waiting': '支払い待ち',
    'order.title': '注文 {id}', 'order.placed': '{date}にご注文', 'order.placed_label': '注文日', 'order.tracking': '追跡番号', 'order.items': '商品', 'order.buy_again': 'もう一度買う',
    'login.title': 'ログイン', 'login.lede': 'ログインすると注文履歴を見られます。', 'login.email': 'メールアドレス', 'login.password': 'パスワード', 'login.submit': 'ログイン', 'login.error.title': 'ログインできませんでした', 'login.error.wrong': 'メールアドレスまたはパスワードが正しくありません。両方を確認して、もう一度お試しください。', 'login.hint': 'ここでは任意のメールアドレスと4文字以上のパスワードでログインできます。',
    'account.title': 'アカウント', 'account.hello': '{email} でログイン中', 'account.logout': 'ログアウト',
  },
};

const L = (ctx, v) => v[ctx.lang] || v.en;
const prod = (id) => P.find((p) => p.id === id);
const priceOf = (p) => p.sale || p.price;
const cartCount = (s) => s.cart.reduce((n, l) => n + l.qty, 0);
function totals(s) {
  const sub = s.cart.reduce((n, l) => n + priceOf(prod(l.pid)) * l.qty, 0);
  const c = s.coupon && COUPONS[s.coupon];
  const discount = c ? (c.off || Math.round(sub * c.pct / 100)) : 0;
  const ship = !s.cart.length ? 0 : sub - discount >= FREE_FROM ? 0 : SHIP[s.co?.delivery || 'standard'];
  return { sub, discount, ship, total: Math.max(0, sub - discount) + ship };
}
const variantOf = (p, vid) => p.variants.find((v) => v.id === vid) || p.variants[0];
const stockOf = (p) => p.variants.reduce((n, v) => n + v.stock, 0);

// ---- shell: TopBar with categories on the desktop; TopBar + BottomBar on the phone ----
function shell(ctx, body, active) {
  const n = cartCount(ctx.s);
  const tabs = [['home', 'home', 'nav.home'], ['search', 'search', 'nav.search'], ['cart', 'cart', 'nav.cart'], ['account', 'user', 'nav.account']];
  return html`<div class="flex h-full flex-col">
    <header data-block="TopBar" class="shrink-0 border-b bg-background">
      <div class="flex h-14 items-center gap-3 px-4 @3xl:px-6">
        <a href="#" data-go="home" class="flex items-center gap-2 font-semibold">${icon('bag', 'size-5')}<span>${ctx.t('app.name')}</span></a>
        <form role="search" class="ml-4 hidden flex-1 @3xl:flex" data-submit="search">
          <label class="input-group w-full max-w-md"><span data-align="start">${icon('search', 'size-4')}</span>
            <input id="sh-q-top" type="search" name="q" value="${ctx.s.q || ''}" placeholder="${ctx.t('search.hint')}" aria-label="${ctx.t('search.label')}" data-input="searchLive" autocomplete="off"></label>
        </form>
        <span class="flex-1 @3xl:hidden"></span>
        <a href="#" class="btn hidden @3xl:inline-flex" data-variant="ghost" data-go="${ctx.s.user ? 'orders' : 'account'}">${icon('user')}${ctx.t(ctx.s.user ? 'nav.orders' : 'nav.account')}</a>
        <a href="#" class="btn relative" data-variant="outline" data-go="cart" aria-label="${ctx.t('nav.cart')}, ${n}">${icon('cart')}<span class="hidden @3xl:inline">${ctx.t('nav.cart')}</span>${n ? html`<span class="badge tabular-nums" data-size="sm">${n}</span>` : ''}</a>
      </div>
      <nav class="flex gap-1 overflow-x-auto px-3 pb-2 @3xl:px-5" aria-label="${ctx.t('nav.main')}">
        ${CATS.map((c) => html`<a href="#" data-go="home" data-param='${JSON.stringify({ cat: c, q: '' })}' ${raw(active === 'home' && (ctx.s.cat || 'all') === c ? 'aria-current="page"' : '')} class="shrink-0 rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent aria-[current=page]:bg-secondary aria-[current=page]:font-medium aria-[current=page]:text-foreground @max-3xl:min-h-9 @max-3xl:content-center">${ctx.t('cat.' + c)}</a>`)}
      </nav>
    </header>
    <main class="min-h-0 flex-1 overflow-y-auto" data-scroll="main">${body}</main>
    <nav data-block="BottomBar" class="grid shrink-0 grid-cols-4 border-t bg-background @3xl:hidden" aria-label="${ctx.t('nav.main')}">
      ${tabs.map(([r, i, k]) => html`<a href="#" data-go="${r}" ${raw(active === r ? 'aria-current="page"' : '')} class="relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] text-muted-foreground aria-[current=page]:font-medium aria-[current=page]:text-foreground">${icon(i, 'size-5')}<span>${ctx.t(k)}</span>${r === 'cart' && n ? html`<span class="badge absolute right-[22%] top-1.5 px-1.5 text-[10px] tabular-nums">${n}</span>` : ''}</a>`)}
    </nav>
  </div>`;
}

// ---- Shop home: ListSearch + ProductGrid ----
function priceTag(ctx, p) {
  return p.sale
    ? html`${ctx.yen(p.sale)} <s class="text-muted-foreground text-sm font-normal" aria-label="${ctx.t('shop.was', { price: ctx.yen(p.price) })}">${ctx.yen(p.price)}</s>`
    : html`${ctx.yen(p.price)}`;
}
function badges(ctx, p) {
  const st = stockOf(p);
  return html`${p.sale ? html`<span class="badge" data-variant="destructive">${ctx.t('shop.off', { n: Math.round((1 - p.sale / p.price) * 100) })}</span>` : ''}
    ${st === 0 ? html`<span class="badge" data-variant="secondary">${ctx.t('shop.sold_out')}</span>` : st <= 3 ? html`<span class="badge" data-variant="outline">${ctx.t('shop.low', { n: st })}</span>` : ''}`;
}
function home(ctx, searchFocus) {
  const { q = '', cat = 'all', sort = 'popular' } = ctx.s;
  const needle = q.trim().toLowerCase();
  let list = P.filter((p) => (cat === 'all' || p.cat === cat) && (!needle || (p.name.en + ' ' + p.name.ja + ' ' + p.cat).toLowerCase().includes(needle)));
  if (sort === 'price_asc') list = [...list].sort((a, b) => priceOf(a) - priceOf(b));
  if (sort === 'price_desc') list = [...list].sort((a, b) => priceOf(b) - priceOf(a));
  return shell(ctx, html`<section class="grid gap-5 p-4 @3xl:p-8" aria-labelledby="sh-title">
    <div class="grid gap-1"><h1 id="sh-title" class="text-2xl font-semibold">${cat === 'all' ? ctx.t('shop.title') : ctx.t('cat.' + cat)}</h1><p class="text-muted-foreground">${ctx.t('shop.lede')}</p></div>
    <form data-block="ListSearch" role="search" class="flex flex-wrap items-end gap-3" data-submit="search">
      <label class="input-group w-full @3xl:hidden"><span data-align="start">${icon('search', 'size-4')}</span>
        <input id="sh-q" type="search" name="q" value="${q}" placeholder="${ctx.t('search.hint')}" aria-label="${ctx.t('search.label')}" data-input="searchLive" autocomplete="off" ${raw(searchFocus ? 'autofocus' : '')}></label>
      <p class="text-muted-foreground mr-auto text-sm" role="status">${list.length === 1 ? ctx.t('shop.count_one') : ctx.t('shop.count', { n: list.length })}</p>
      <label class="flex items-center gap-2 text-sm"><span>${ctx.t('shop.sort')}</span>
        <select class="select w-44" id="sh-sort" data-change="sort">${['popular', 'price_asc', 'price_desc'].map((v) => html`<option value="${v}" ${raw(v === sort ? 'selected' : '')}>${ctx.t('shop.sort.' + v)}</option>`)}</select></label>
    </form>
    ${list.length ? html`<ul data-block="ProductGrid" class="grid grid-cols-2 gap-4 @3xl:grid-cols-4" role="list">${list.map((p) => {
      const out = stockOf(p) === 0;
      return html`<li class="card gap-0 overflow-hidden py-0" data-size="sm">
        <a href="#" class="block aspect-square" data-go="product" data-param='${JSON.stringify({ pid: p.id, vid: p.variants.find((v) => v.stock)?.id || p.variants[0].id, qty: 1, photo: 0, notified: false })}' aria-label="${L(ctx, p.name)}">${art(p.art, p.variants[0].c)}</a>
        <section class="grid gap-1 py-3"><div class="flex min-h-5 flex-wrap gap-1">${badges(ctx, p)}</div>
          <h3 class="font-medium"><a href="#" class="hover:underline" data-go="product" data-param='${JSON.stringify({ pid: p.id, vid: p.variants.find((v) => v.stock)?.id || p.variants[0].id, qty: 1, photo: 0, notified: false })}'>${L(ctx, p.name)}</a></h3>
          <p class="font-semibold tabular-nums">${priceTag(ctx, p)} <span class="text-muted-foreground text-xs font-normal">${ctx.t('shop.tax_included')}</span></p></section>
        <footer class="grid pb-4"><button class="btn w-full" type="button" data-action="quickAdd" data-pid="${p.id}" ${raw(out ? 'disabled' : '')}>${out ? ctx.t('shop.sold_out') : ctx.t('shop.add')}</button></footer>
      </li>`;
    })}</ul>`
    : html`<div data-block="EmptyState" class="empty rounded-lg border border-dashed"><header><figure>${icon('search')}</figure><h3>${ctx.t('empty.title', { q })}</h3><p>${ctx.t('empty.text')}</p></header><footer class="flex-row"><button class="btn" data-variant="outline" type="button" data-action="clearSearch">${ctx.t('empty.clear')}</button></footer></div>`}
  </section>`, 'home');
}

// ---- ProductPage with Gallery ----
function product(ctx) {
  const p = prod(ctx.s.pid);
  const v = variantOf(p, ctx.s.vid);
  const qty = ctx.s.qty || 1;
  const photos = [0, 1, 2];
  return shell(ctx, html`<article data-block="ProductPage" class="mx-auto grid max-w-5xl gap-6 p-4 @3xl:grid-cols-2 @3xl:gap-10 @3xl:p-8">
    <nav class="breadcrumb @3xl:col-span-2" data-block="Breadcrumbs" aria-label="Breadcrumb"><ol>
      <li><a href="#" data-go="home" data-param='${JSON.stringify({ cat: 'all' })}'>${ctx.t('nav.home')}</a></li><li aria-hidden="true">${icon('chevron', 'size-3.5')}</li>
      <li><a href="#" data-go="home" data-param='${JSON.stringify({ cat: p.cat })}'>${ctx.t('cat.' + p.cat)}</a></li><li aria-hidden="true">${icon('chevron', 'size-3.5')}</li>
      <li><span aria-current="page">${L(ctx, p.name)}</span></li></ol></nav>
    <div data-block="Gallery" class="grid gap-3">
      <figure class="m-0 overflow-hidden rounded-xl border" aria-label="${ctx.t('product.photo', { n: (ctx.s.photo || 0) + 1, total: 3 })}"><div class="aspect-square">${art(p.art, v.c, ctx.s.photo || 0)}</div></figure>
      <div class="flex gap-2" role="group">${photos.map((i) => html`<button type="button" class="size-16 overflow-hidden rounded-md border-2 ${(ctx.s.photo || 0) === i ? 'border-primary' : 'border-transparent'} @max-3xl:size-14" data-action="photo" data-i="${i}" aria-label="${ctx.t('product.photo', { n: i + 1, total: 3 })}" aria-pressed="${(ctx.s.photo || 0) === i}">${art(p.art, v.c, i)}</button>`)}</div>
    </div>
    <div class="grid content-start gap-5">
      <div class="grid gap-2"><div class="flex flex-wrap gap-1">${badges(ctx, p)}</div><h1 class="text-2xl font-semibold @3xl:text-3xl">${L(ctx, p.name)}</h1>
        <p class="text-xl font-semibold tabular-nums">${priceTag(ctx, p)} <span class="text-muted-foreground text-xs font-normal">${ctx.t('shop.tax_included')}</span></p></div>
      <p class="text-muted-foreground leading-relaxed">${L(ctx, p.desc)}</p>
      <fieldset class="grid gap-2"><legend class="label mb-2">${ctx.t('product.color')}: <span class="font-normal">${L(ctx, v)}</span></legend>
        <div class="flex flex-wrap gap-2" role="radiogroup">${p.variants.map((x) => html`<button type="button" role="radio" aria-checked="${x.id === v.id}" data-action="variant" data-vid="${x.id}" class="btn" data-variant="${x.id === v.id ? 'secondary' : 'outline'}"><span class="size-3.5 rounded-full" style="background: var(--chart-${x.c})"></span>${L(ctx, x)}${x.stock ? '' : html` <span class="text-muted-foreground text-xs">· ${ctx.t('shop.sold_out')}</span>`}</button>`)}</div></fieldset>
      ${v.stock ? html`<div class="grid gap-2"><span class="label">${ctx.t('product.qty')}</span>
        <div class="flex flex-wrap items-center gap-3"><div class="button-group" role="group" aria-label="${ctx.t('product.qty')}">
          <button class="btn" data-variant="outline" data-size="icon" type="button" aria-label="${ctx.t('product.less')}" data-action="qty" data-d="-1" ${raw(qty <= 1 ? 'disabled' : '')}>−</button>
          <input class="input h-9 w-14 text-center tabular-nums" id="sh-qty" type="number" min="1" max="${Math.min(10, v.stock)}" value="${qty}" aria-label="${ctx.t('product.qty')}" data-change="qtyInput">
          <button class="btn" data-variant="outline" data-size="icon" type="button" aria-label="${ctx.t('product.more')}" data-action="qty" data-d="1" ${raw(qty >= Math.min(10, v.stock) ? 'disabled' : '')}>+</button></div>
          <span class="text-sm ${v.stock <= 3 ? 'text-destructive font-medium' : 'text-muted-foreground'}">${v.stock <= 3 ? ctx.t('product.low', { n: v.stock }) : ctx.t('product.in_stock')}</span></div></div>
        <button class="btn w-full @3xl:w-auto" data-size="lg" type="button" data-action="addToCart">${icon('cart')}${ctx.t('shop.add')}</button>`
      : html`<div class="alert" role="status"><h2>${ctx.t('product.sold_out')}</h2><section>${ctx.s.notified ? ctx.t('product.notified') : html`<div class="mt-2"><button class="btn" data-variant="outline" data-size="sm" type="button" data-action="notify">${ctx.t('product.notify')}</button></div>`}</section></div>`}
      <p class="text-muted-foreground text-sm">${ctx.t('product.free', { amount: ctx.yen(FREE_FROM) })}</p>
    </div>
  </article>`, 'home');
}

// ---- Cart + Coupons ----
function summary(ctx, { editable = false } = {}) {
  const t = totals(ctx.s);
  return html`<dl class="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-sm">
    <dt class="text-muted-foreground">${ctx.t('cart.subtotal')}</dt><dd class="text-right tabular-nums">${ctx.yen(t.sub)}</dd>
    ${t.discount ? html`<dt class="text-muted-foreground">${ctx.t('cart.discount')} <span class="font-mono text-xs">${ctx.s.coupon}</span></dt><dd class="text-right tabular-nums">−${ctx.yen(t.discount)}</dd>` : ''}
    <dt class="text-muted-foreground">${ctx.t('cart.shipping')}</dt><dd class="text-right tabular-nums">${t.ship ? ctx.yen(t.ship) : ctx.t('cart.free')}</dd>
    <dt class="border-t pt-2 font-semibold">${ctx.t('cart.total')}</dt><dd class="border-t pt-2 text-right text-base font-semibold tabular-nums">${ctx.yen(t.total)}</dd>
  </dl>${editable && t.ship && t.sub - t.discount < FREE_FROM ? html`<p class="text-muted-foreground mt-2 text-xs">${ctx.t('cart.to_free', { amount: ctx.yen(FREE_FROM - (t.sub - t.discount)) })}</p>` : ''}`;
}
function coupons(ctx) {
  const c = ctx.s.coupon;
  if (c) {
    const def = COUPONS[c];
    return html`<div data-block="Coupons" class="flex flex-wrap items-center justify-between gap-2 rounded-md border border-dashed p-3"><span class="flex items-center gap-2"><span class="badge font-mono" data-variant="secondary">${c}</span><span class="text-sm">${ctx.t('coupon.applied', { off: def.off ? ctx.yen(def.off) : def.pct + '%' })}</span></span><button class="btn" data-variant="link" data-size="sm" type="button" data-action="removeCoupon">${ctx.t('coupon.remove')}</button></div>`;
  }
  const err = ctx.s.couponErr;
  return html`<form data-block="Coupons" id="coupon" class="grid gap-2" data-submit="applyCoupon" novalidate>
    <label class="label" for="sh-coupon">${ctx.t('coupon.label')}</label>
    <div class="flex gap-2"><input class="input font-mono uppercase" id="sh-coupon" name="code" autocomplete="off" spellcheck="false" value="${ctx.s.couponDraft || ''}" ${raw(err ? 'aria-invalid="true" aria-describedby="sh-coupon-err"' : 'aria-describedby="sh-coupon-hint"')}>
      <button class="btn" data-variant="outline" type="submit">${ctx.t('coupon.apply')}</button></div>
    ${err ? html`<p class="text-destructive text-sm" id="sh-coupon-err" role="alert">${ctx.t(err.key, err.vars)}</p>` : html`<p class="text-muted-foreground text-xs" id="sh-coupon-hint">${ctx.t('coupon.hint')}</p>`}
  </form>`;
}
function cart(ctx) {
  if (!ctx.s.cart.length) {
    return shell(ctx, html`<section class="mx-auto grid max-w-xl gap-4 p-4 @3xl:p-8"><h1 class="text-2xl font-semibold">${ctx.t('cart.title')}</h1>
      <div data-block="EmptyState" class="empty rounded-lg border border-dashed"><header><figure>${icon('cart')}</figure><h3>${ctx.t('cart.empty_title')}</h3><p>${ctx.t('cart.empty_text')}</p></header><footer class="flex-row"><button class="btn" type="button" data-go="home">${ctx.t('cart.continue')}</button></footer></div></section>`, 'cart');
  }
  return shell(ctx, html`<section data-block="Cart" class="mx-auto grid max-w-5xl gap-6 p-4 @3xl:grid-cols-[1fr_20rem] @3xl:p-8" aria-labelledby="sh-cart-title">
    <div class="grid content-start gap-4">
      <h1 id="sh-cart-title" class="text-2xl font-semibold">${ctx.t('cart.title')}</h1>
      <ul class="item-group gap-3" role="list">${ctx.s.cart.map((l, i) => {
        const p = prod(l.pid); const v = variantOf(p, l.vid); const max = Math.min(10, v.stock);
        return html`<li class="item" data-variant="outline">
          <figure><span class="block size-16 overflow-hidden rounded-md">${art(p.art, v.c)}</span></figure>
          <section class="grid gap-1"><h3 class="font-medium"><a href="#" class="hover:underline" data-go="product" data-param='${JSON.stringify({ pid: p.id, vid: v.id, qty: 1, photo: 0 })}'>${L(ctx, p.name)}</a></h3>
            <p class="text-muted-foreground text-sm">${L(ctx, v)}</p>
            <div class="flex flex-wrap items-center gap-3"><div class="button-group" role="group" aria-label="${ctx.t('product.qty')}: ${L(ctx, p.name)}">
              <button class="btn" data-variant="outline" data-size="icon-sm" type="button" aria-label="${ctx.t('product.less')}" data-action="lineQty" data-i="${i}" data-d="-1" ${raw(l.qty <= 1 ? 'disabled' : '')}>−</button>
              <input class="input h-8 w-12 text-center tabular-nums" id="sh-line-${i}" type="number" min="1" max="${max}" value="${l.qty}" aria-label="${ctx.t('product.qty')}" data-change="lineInput" data-i="${i}">
              <button class="btn" data-variant="outline" data-size="icon-sm" type="button" aria-label="${ctx.t('product.more')}" data-action="lineQty" data-i="${i}" data-d="1" ${raw(l.qty >= max ? 'disabled' : '')}>+</button></div>
              <button class="btn" data-variant="link" data-size="sm" type="button" data-action="removeLine" data-i="${i}">${ctx.t('cart.remove')}</button></div></section>
          <aside class="text-right font-semibold tabular-nums">${ctx.yen(priceOf(p) * l.qty)}</aside></li>`;
      })}</ul>
      ${coupons(ctx)}
    </div>
    <aside class="card h-fit" aria-labelledby="sh-sum-title"><header><h2 id="sh-sum-title" class="font-semibold">${ctx.t('cart.summary')}</h2></header>
      <section>${summary(ctx, { editable: true })}</section>
      <footer class="grid gap-2"><button class="btn w-full" type="button" data-action="startCheckout">${ctx.t('cart.checkout')}</button><button class="btn w-full" data-variant="ghost" type="button" data-go="home">${ctx.t('cart.continue')}</button></footer></aside>
  </section>`, 'cart');
}

// ---- Checkout with Stepper ----
const STEPS = ['address', 'delivery', 'payment', 'review'];
function stepper(ctx, cur) {
  const ci = STEPS.indexOf(cur);
  return html`<ol data-block="Stepper" class="flex flex-wrap gap-x-6 gap-y-2" aria-label="${ctx.t('checkout.steps')}">${STEPS.map((s, i) => html`<li class="flex items-center gap-2 text-sm" ${raw(i === ci ? 'aria-current="step"' : '')}>
    <span class="grid size-6 place-items-center rounded-full text-xs ${i < ci ? 'bg-primary text-primary-foreground' : i === ci ? 'bg-primary text-primary-foreground' : 'border text-muted-foreground'}">${i < ci ? icon('check', 'size-3.5') : i + 1}</span>
    <span class="${i === ci ? 'font-medium' : 'text-muted-foreground'}">${ctx.t('step.' + s)}</span></li>`)}</ol>`;
}
const LABEL = { family: 'addr.family', given: 'addr.given', postal: 'addr.postal', city: 'addr.city', line1: 'addr.line1', tel: 'addr.tel', card: 'pay.card_number', expiry: 'pay.expiry', cvc: 'pay.cvc' };
const PREFS = ['東京都', '神奈川県', '大阪府', '京都府', '愛知県', '福岡県', '北海道'];
function field(ctx, id, key, val, err, extra = '') {
  return html`<div class="field"><label class="label" for="sh-${id}">${ctx.t(key)}</label>
    <input class="input" id="sh-${id}" name="${id}" value="${val || ''}" ${raw(extra)} ${raw(err ? `aria-invalid="true" aria-describedby="sh-${id}-err"` : '')}>
    ${err ? html`<p class="text-destructive text-sm" id="sh-${id}-err">${ctx.t(err)}</p>` : ''}</div>`;
}
function checkout(ctx) {
  const co = ctx.s.co; const a = co.address; const e = co.err || {};
  const nErr = Object.keys(e).length;
  const errBox = nErr ? html`<div data-block="InlineAlert" class="alert" data-variant="destructive" role="alert" tabindex="-1" id="sh-err-box"><h2>${ctx.t('addr.error.summary', { n: nErr })}</h2><section><ul class="list-disc pl-5">${Object.entries(e).map(([k, m]) => html`<li><a class="underline" href="#sh-${k}">${ctx.t(LABEL[k])}: ${ctx.t(m)}</a></li>`)}</ul></section></div>` : '';
  let body;
  if (co.step === 'address') {
    body = html`<form data-block="EditForm" class="grid gap-4" data-submit="saveAddress" novalidate>${errBox}
      <div class="grid gap-4 @3xl:grid-cols-2">${field(ctx, 'family', 'addr.family', a.family, e.family, 'autocomplete="family-name"')}${field(ctx, 'given', 'addr.given', a.given, e.given, 'autocomplete="given-name"')}</div>
      <div class="field"><label class="label" for="sh-postal">${ctx.t('addr.postal')}</label><input class="input w-40" id="sh-postal" name="postal" inputmode="numeric" autocomplete="postal-code" placeholder="150-0001" value="${a.postal || ''}" ${raw(e.postal ? 'aria-invalid="true" aria-describedby="sh-postal-err"' : 'aria-describedby="sh-postal-help"')}>
        ${e.postal ? html`<p class="text-destructive text-sm" id="sh-postal-err">${ctx.t(e.postal)}</p>` : html`<p class="text-muted-foreground text-sm" id="sh-postal-help">${ctx.t('addr.postal_help')}</p>`}</div>
      <div class="grid gap-4 @3xl:grid-cols-2"><div class="field"><label class="label" for="sh-pref">${ctx.t('addr.pref')}</label><select class="select" id="sh-pref" name="pref">${PREFS.map((p) => html`<option ${raw(p === a.pref ? 'selected' : '')}>${p}</option>`)}</select></div>
        ${field(ctx, 'city', 'addr.city', a.city, e.city, 'autocomplete="address-level2"')}</div>
      ${field(ctx, 'line1', 'addr.line1', a.line1, e.line1, 'autocomplete="address-line1"')}
      ${field(ctx, 'line2', 'addr.line2', a.line2, null, 'autocomplete="address-line2"')}
      ${field(ctx, 'tel', 'addr.tel', a.tel, e.tel, 'type="tel" autocomplete="tel"')}
      <div class="flex flex-wrap justify-between gap-2"><button class="btn" data-variant="ghost" type="button" data-go="cart">${ctx.t('checkout.back_cart')}</button><button class="btn" type="submit">${ctx.t('checkout.next_delivery')}</button></div></form>`;
  } else if (co.step === 'delivery') {
    const opt = (v) => html`<label class="item cursor-pointer" data-variant="outline"><section class="flex items-start gap-3"><input class="input mt-0.5" type="radio" name="delivery" value="${v}" ${raw(co.delivery === v ? 'checked' : '')} data-change="delivery">
      <span class="grid gap-0.5"><span class="font-medium">${ctx.t('delivery.' + v)}</span><span class="text-muted-foreground text-sm">${ctx.t('delivery.' + v + '_d')}</span></span></section><aside class="tabular-nums">${totals(ctx.s).sub - totals(ctx.s).discount >= FREE_FROM ? ctx.t('cart.free') : ctx.yen(SHIP[v])}</aside></label>`;
    body = html`<form class="grid gap-4" data-submit="saveDelivery">
      <fieldset class="grid gap-2" role="radiogroup">${opt('standard')}${opt('express')}</fieldset>
      <div class="field"><label class="label" for="sh-when">${ctx.t('delivery.when')}</label><select class="select w-56" id="sh-when" name="when">${['any', 'am', 'pm', 'eve'].map((w) => html`<option value="${w}" ${raw(co.when === w ? 'selected' : '')}>${ctx.t('delivery.' + w)}</option>`)}</select></div>
      <div class="flex flex-wrap justify-between gap-2"><button class="btn" data-variant="ghost" type="button" data-action="coStep" data-step="address">${ctx.t('checkout.back')}</button><button class="btn" type="submit">${ctx.t('checkout.next_payment')}</button></div></form>`;
  } else if (co.step === 'payment') {
    const card = co.pay === 'card';
    body = html`<form data-block="EditForm" class="grid gap-4" data-submit="savePayment" novalidate>${errBox}
      <fieldset class="grid gap-2" role="radiogroup">
        <label class="label gap-3 font-normal"><input class="input" type="radio" name="pay" value="card" ${raw(card ? 'checked' : '')} data-change="pay"><span>${ctx.t('pay.card')}</span></label>
        <label class="label gap-3 font-normal"><input class="input" type="radio" name="pay" value="konbini" ${raw(!card ? 'checked' : '')} data-change="pay"><span>${ctx.t('pay.konbini')} <span class="text-muted-foreground text-sm">· ${ctx.t('pay.konbini_d')}</span></span></label></fieldset>
      ${card ? html`${field(ctx, 'card', 'pay.card_number', co.card?.card, e.card, 'inputmode="numeric" autocomplete="cc-number" placeholder="4242 4242 4242 4242"')}
        <div class="grid grid-cols-2 gap-4">${field(ctx, 'expiry', 'pay.expiry', co.card?.expiry, e.expiry, 'autocomplete="cc-exp" placeholder="08/28"')}${field(ctx, 'cvc', 'pay.cvc', co.card?.cvc, e.cvc, 'inputmode="numeric" autocomplete="cc-csc" placeholder="123"')}</div>` : ''}
      <div class="flex flex-wrap justify-between gap-2"><button class="btn" data-variant="ghost" type="button" data-action="coStep" data-step="delivery">${ctx.t('checkout.back')}</button><button class="btn" type="submit">${ctx.t('checkout.next_review')}</button></div></form>`;
  } else {
    const row = (label, value, step) => html`<div class="flex items-start justify-between gap-4 border-b py-3 last:border-0"><div class="grid gap-0.5"><span class="text-muted-foreground text-sm">${label}</span><span>${value}</span></div><button class="btn" data-variant="link" data-size="sm" type="button" data-action="coStep" data-step="${step}">${ctx.t('review.change')}</button></div>`;
    body = html`<div class="grid gap-4"><div class="card py-2"><section>
      ${row(ctx.t('review.ship_to'), `${a.family} ${a.given} · 〒${a.postal} ${a.pref}${a.city}${a.line1}${a.line2 ? ' ' + a.line2 : ''}`, 'address')}
      ${row(ctx.t('review.delivery'), `${ctx.t('delivery.' + co.delivery)} · ${ctx.t('delivery.' + co.when)}`, 'delivery')}
      ${row(ctx.t('review.payment'), co.pay === 'card' ? ctx.t('review.card_ending', { last4: (co.card.card || '').replace(/\D/g, '').slice(-4) }) : ctx.t('pay.konbini'), 'payment')}</section></div>
      <div class="flex flex-wrap justify-between gap-2"><button class="btn" data-variant="ghost" type="button" data-action="coStep" data-step="payment">${ctx.t('checkout.back')}</button>
        <button class="btn" type="button" data-action="placeOrder" ${raw(co.placing ? 'disabled aria-busy="true"' : '')}>${co.placing ? ctx.t('checkout.placing') : ctx.t('checkout.place')}</button></div></div>`;
  }
  return shell(ctx, html`<div data-block="Checkout" class="mx-auto grid max-w-5xl gap-6 p-4 @3xl:p-8">
    <h1 class="text-2xl font-semibold">${ctx.t('checkout.title')}</h1>${stepper(ctx, co.step)}
    <div class="grid gap-6 @3xl:grid-cols-[1fr_18rem]"><section class="grid content-start gap-4" aria-labelledby="sh-step-title"><h2 id="sh-step-title" class="text-lg font-semibold">${ctx.t('step.' + co.step)}</h2>${body}</section>
      <aside class="card h-fit"><header><h2 class="font-semibold">${ctx.t('cart.summary')}</h2></header><section class="grid gap-3">
        <ul class="grid gap-2 text-sm">${ctx.s.cart.map((l) => { const p = prod(l.pid); return html`<li class="flex justify-between gap-3"><span>${L(ctx, p.name)} × ${l.qty}</span><span class="tabular-nums">${ctx.yen(priceOf(p) * l.qty)}</span></li>`; })}</ul>
        ${summary(ctx)}</section></aside></div>
  </div>`, 'cart');
}

// ---- OrderConfirmation ----
function thanks(ctx) {
  const o = ctx.s.orders[0];
  return shell(ctx, html`<section data-block="OrderConfirmation" class="mx-auto grid max-w-xl gap-5 p-4 text-center @3xl:p-10">
    <span class="mx-auto grid size-14 place-items-center rounded-full bg-secondary">${icon('check', 'size-7')}</span>
    <h1 class="text-2xl font-semibold">${ctx.t('thanks.title', { name: o.name })}</h1>
    <p class="text-muted-foreground">${ctx.t('thanks.lede', { id: o.id, email: ctx.s.email || 'aiko@example.com' })}</p>
    <div class="card text-left"><section class="grid gap-3">
      <div class="flex justify-between gap-3 text-sm"><span class="text-muted-foreground">${ctx.t('thanks.when')}</span><span class="font-medium">${ctx.date(o.arrive, { weekday: 'short', month: 'short', day: 'numeric' })}</span></div>
      <ul class="grid gap-2 border-t pt-3 text-sm">${o.lines.map((l) => html`<li class="flex justify-between gap-3"><span>${L(ctx, prod(l.pid).name)} × ${l.qty}</span><span class="tabular-nums">${ctx.yen(l.price * l.qty)}</span></li>`)}</ul>
      <div class="flex justify-between border-t pt-3 font-semibold"><span>${ctx.t('cart.total')}</span><span class="tabular-nums">${ctx.yen(o.total)}</span></div></section></div>
    <div class="flex flex-wrap justify-center gap-2"><button class="btn" type="button" data-go="orders">${ctx.t('thanks.track')}</button><button class="btn" data-variant="outline" type="button" data-go="home">${ctx.t('thanks.continue')}</button></div>
  </section>`, 'cart');
}

// ---- OrderHistory, DetailView ----
const statusBadge = (ctx, st) => html`<span data-block="StatusBadges" class="badge" ${raw(st === 'delivered' ? 'data-variant="outline"' : st === 'shipped' ? 'data-variant="secondary"' : st === 'waiting' ? 'data-variant="destructive"' : '')}>${st === 'delivered' ? icon('check', 'size-3') : ''}${ctx.t('status.' + st)}</span>`;
function orders(ctx) {
  if (!ctx.s.user) return account(ctx);
  const list = ctx.s.orders;
  return shell(ctx, html`<section class="mx-auto grid max-w-3xl gap-4 p-4 @3xl:p-8"><h1 class="text-2xl font-semibold">${ctx.t('orders.title')}</h1>
    ${list.length ? html`<ul data-block="OrderHistory" class="grid gap-3" role="list">${list.map((o) => html`<li><a href="#" class="item" data-variant="outline" data-go="order" data-param='${JSON.stringify({ oid: o.id })}'>
      <figure><span class="flex -space-x-3">${o.lines.slice(0, 3).map((l) => html`<span class="block size-12 overflow-hidden rounded-md border-2 border-background">${art(prod(l.pid).art, variantOf(prod(l.pid), l.vid).c)}</span>`)}</span></figure>
      <section class="grid gap-1"><h3 class="font-medium">${o.id}</h3><p class="text-muted-foreground text-sm">${ctx.date(o.placed, { year: 'numeric', month: 'short', day: 'numeric' })} · ${ctx.t('orders.items', { n: o.lines.reduce((n, l) => n + l.qty, 0) })}</p></section>
      <aside class="flex flex-col items-end gap-1">${statusBadge(ctx, o.status)}<span class="font-semibold tabular-nums">${ctx.yen(o.total)}</span></aside></a></li>`)}</ul>`
    : html`<div data-block="EmptyState" class="empty rounded-lg border border-dashed"><header><figure>${icon('box')}</figure><h3>${ctx.t('orders.empty_title')}</h3><p>${ctx.t('orders.empty_text')}</p></header></div>`}
  </section>`, 'account');
}
function order(ctx) {
  const o = ctx.s.orders.find((x) => x.id === ctx.s.oid);
  if (!o) return orders(ctx);
  return shell(ctx, html`<article data-block="DetailView" class="mx-auto grid max-w-3xl gap-5 p-4 @3xl:p-8">
    <nav class="breadcrumb" data-block="Breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="#" data-go="orders">${ctx.t('orders.title')}</a></li><li aria-hidden="true">${icon('chevron', 'size-3.5')}</li><li><span aria-current="page">${o.id}</span></li></ol></nav>
    <div class="flex flex-wrap items-center gap-3"><h1 class="text-2xl font-semibold">${ctx.t('order.title', { id: o.id })}</h1>${statusBadge(ctx, o.status)}</div>
    <dl class="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm"><dt class="text-muted-foreground">${ctx.t('order.placed_label')}</dt><dd>${ctx.date(o.placed, { year: 'numeric', month: 'long', day: 'numeric' })}</dd>
      ${o.tracking ? html`<dt class="text-muted-foreground">${ctx.t('order.tracking')}</dt><dd class="font-mono">${o.tracking}</dd>` : ''}
      <dt class="text-muted-foreground">${ctx.t('review.ship_to')}</dt><dd>${o.address}</dd></dl>
    <section class="card"><header><h2 class="font-semibold">${ctx.t('order.items')}</h2></header><section><ul class="item-group gap-2">${o.lines.map((l) => { const p = prod(l.pid); const v = variantOf(p, l.vid); return html`<li class="item"><figure><span class="block size-12 overflow-hidden rounded-md">${art(p.art, v.c)}</span></figure><section><h3 class="font-medium">${L(ctx, p.name)}</h3><p class="text-muted-foreground text-sm">${L(ctx, v)} · × ${l.qty}</p></section><aside class="tabular-nums">${ctx.yen(l.price * l.qty)}</aside></li>`; })}</ul>
      <div class="mt-3 flex justify-between border-t pt-3 font-semibold"><span>${ctx.t('cart.total')}</span><span class="tabular-nums">${ctx.yen(o.total)}</span></div></section>
      <footer><button class="btn" data-variant="outline" type="button" data-action="buyAgain" data-oid="${o.id}">${icon('undo')}${ctx.t('order.buy_again')}</button></footer></section>
  </article>`, 'account');
}

// ---- Account: LogIn ----
function account(ctx) {
  if (ctx.s.user) {
    return shell(ctx, html`<section data-block="Profile" class="mx-auto grid max-w-xl gap-4 p-4 @3xl:p-8"><h1 class="text-2xl font-semibold">${ctx.t('account.title')}</h1>
      <div class="flex flex-wrap items-center gap-3"><span class="avatar"><span>AS</span></span><span class="text-sm">${ctx.t('account.hello', { email: ctx.s.email })}</span></div>
      <div class="flex flex-wrap gap-2"><button class="btn" type="button" data-go="orders">${ctx.t('nav.orders')}</button><button class="btn" data-variant="outline" type="button" data-action="logout">${icon('logout')}${ctx.t('account.logout')}</button></div></section>`, 'account');
  }
  const e = ctx.s.loginErr || {};
  return shell(ctx, html`<div class="grid place-items-center p-4 @3xl:p-10"><form data-block="LogIn" data-submit="login" class="card w-full max-w-sm" novalidate>
    <header><h1 class="text-xl font-semibold">${ctx.t('login.title')}</h1><p class="text-muted-foreground text-sm">${ctx.t('login.lede')}</p></header>
    <section class="grid gap-4">
      ${e.wrong ? html`<div class="alert" data-variant="destructive" role="alert"><h2>${ctx.t('login.error.title')}</h2><section>${ctx.t('login.error.wrong')}</section></div>` : ''}
      <div class="field"><label class="label" for="sh-email">${ctx.t('login.email')}</label><input class="input" id="sh-email" name="email" type="email" autocomplete="email" value="${ctx.s.email || 'aiko.sato@example.com'}"></div>
      <div class="field"><label class="label" for="sh-pass">${ctx.t('login.password')}</label><input class="input" id="sh-pass" name="password" type="password" autocomplete="current-password"></div>
    </section>
    <footer class="grid gap-3"><button class="btn w-full" type="submit">${ctx.t('login.submit')}</button><p class="text-muted-foreground text-center text-xs">${ctx.t('login.hint')}</p></footer>
  </form></div>`, 'account');
}

// ---- actions ----
function addLine(s, pid, vid, qty) {
  const v = variantOf(prod(pid), vid);
  const line = s.cart.find((l) => l.pid === pid && l.vid === vid);
  if (line) line.qty = Math.min(10, v.stock, line.qty + qty); else s.cart.push({ pid, vid, qty: Math.min(qty, v.stock) });
}
function added(ctx, p, qty) {
  ctx.toast({ category: 'success', title: ctx.t('added.title'), description: `${L(ctx, p.name)} × ${qty}`, action: { label: ctx.t('added.view'), run: () => ctx.go('cart') } });
}
const REQ = ['family', 'given', 'city', 'line1', 'tel', 'postal'];
const focusErr = () => setTimeout(() => document.getElementById('sh-err-box')?.focus(), 0);

export default {
  id: 'shop', icon: 'bag', host: 'komorebi-goods.local', archetype: 'AppShop', start: 'home',
  name: { en: 'Komorebi Goods', ja: 'こもれび雑貨' }, short: { en: 'Shop', ja: 'ショップ' },
  about: { en: 'An online shop: browse and search, pick a colour, fill the cart, apply a coupon, check out in four steps and follow the order.', ja: 'オンラインショップ。検索して色を選び、カートに入れ、クーポンを使い、4つの手順で購入し、注文を確認できます。' },
  try: { en: 'Open the Ceramic Mug and pick Clay (sold out) or Moss (2 left). In the cart, try the code WELCOME500 or a wrong one, remove a line and Undo. At checkout, empty the postal code to see the errors.', ja: '陶器のマグカップを開き、「土」（売り切れ）や「苔」（残り2点）を選んでみてください。カートでは WELCOME500 や間違ったコードを試し、商品を削除して「元に戻す」も試せます。購入手続きで郵便番号を空にするとエラーを表示します。' },
  messages: M,
  init: () => ({
    cat: 'all', q: '', sort: 'popular', cart: [{ pid: 'notebook', vid: 'green', qty: 1 }], coupon: null, user: true, email: 'aiko.sato@example.com',
    orders: [
      { id: 'KG-10482', placed: '2026-10-02', status: 'delivered', name: 'Aiko', total: 3350, tracking: '4521-8890-1123', address: '佐藤 愛子 · 〒150-0001 東京都渋谷区神宮前1-2-3', lines: [{ pid: 'tote', vid: 'natural', qty: 1, price: 2800 }], arrive: '2026-10-04' },
      { id: 'KG-10517', placed: '2026-10-14', status: 'shipped', name: 'Aiko', total: 5170, tracking: '4521-8890-2246', address: '佐藤 愛子 · 〒150-0001 東京都渋谷区神宮前1-2-3', lines: [{ pid: 'plate', vid: 'white', qty: 1, price: 3300 }, { pid: 'chopsticks', vid: 'brown', qty: 1, price: 1320 }], arrive: '2026-10-16' },
    ],
    nextOrder: 10533,
  }),
  render(ctx) {
    const r = ctx.s.route;
    if (r === 'search') return home(ctx, true);
    if (r === 'product') return product(ctx);
    if (r === 'cart') return cart(ctx);
    if (r === 'checkout') return checkout(ctx);
    if (r === 'thanks') return thanks(ctx);
    if (r === 'orders') return orders(ctx);
    if (r === 'order') return order(ctx);
    if (r === 'account') return account(ctx);
    return home(ctx);
  },
  mount(ctx, root) {
    if (ctx.s.route === 'search' && ctx.s.focusSearch !== false) { root.querySelector('#sh-q')?.focus(); ctx.s.focusSearch = false; }
  },
  actions: {
    search(ctx, f, e, d) { ctx.s.q = d.q || ''; ctx.s.cat = 'all'; if (ctx.s.route !== 'home' && ctx.s.route !== 'search') { ctx.go('home'); return false; } },
    searchLive(ctx, el) {
      ctx.s.q = el.value;
      if (ctx.s.route !== 'home' && ctx.s.route !== 'search') { ctx.s.cat = 'all'; ctx.go('home'); return false; }
    },
    sort(ctx, el) { ctx.s.sort = el.value; },
    clearSearch(ctx) { ctx.s.q = ''; ctx.s.cat = 'all'; },
    quickAdd(ctx, el) {
      const p = prod(el.dataset.pid); const v = p.variants.find((x) => x.stock) || p.variants[0];
      addLine(ctx.s, p.id, v.id, 1); added(ctx, p, 1);
    },
    photo(ctx, el) { ctx.s.photo = +el.dataset.i; },
    variant(ctx, el) { ctx.s.vid = el.dataset.vid; ctx.s.qty = 1; ctx.s.notified = false; },
    qty(ctx, el) { const v = variantOf(prod(ctx.s.pid), ctx.s.vid); ctx.s.qty = Math.max(1, Math.min(10, v.stock, (ctx.s.qty || 1) + +el.dataset.d)); },
    qtyInput(ctx, el) { const v = variantOf(prod(ctx.s.pid), ctx.s.vid); ctx.s.qty = Math.max(1, Math.min(10, v.stock, parseInt(el.value, 10) || 1)); },
    addToCart(ctx) { const p = prod(ctx.s.pid); addLine(ctx.s, p.id, ctx.s.vid, ctx.s.qty || 1); added(ctx, p, ctx.s.qty || 1); },
    notify(ctx) { ctx.s.notified = true; ctx.toast({ category: 'info', title: ctx.t('product.notified') }); },
    lineQty(ctx, el) { const l = ctx.s.cart[+el.dataset.i]; const v = variantOf(prod(l.pid), l.vid); l.qty = Math.max(1, Math.min(10, v.stock, l.qty + +el.dataset.d)); },
    lineInput(ctx, el) { const l = ctx.s.cart[+el.dataset.i]; const v = variantOf(prod(l.pid), l.vid); l.qty = Math.max(1, Math.min(10, v.stock, parseInt(el.value, 10) || 1)); },
    removeLine(ctx, el) {
      const i = +el.dataset.i; const [l] = ctx.s.cart.splice(i, 1); const p = prod(l.pid);
      ctx.toast({ category: 'success', title: ctx.t('cart.removed', { name: L(ctx, p.name) }), duration: 8000, action: { label: ctx.t('cart.undo'), run: () => { ctx.s.cart.splice(i, 0, l); ctx.rerender(); } } });
    },
    applyCoupon(ctx, f, e, d) {
      const code = (d.code || '').trim().toUpperCase(); ctx.s.couponDraft = code;
      const c = COUPONS[code]; const sub = totals(ctx.s).sub;
      if (!code) ctx.s.couponErr = { key: 'coupon.error.empty' };
      else if (!c) ctx.s.couponErr = { key: 'coupon.error.unknown' };
      else if (sub < c.min) ctx.s.couponErr = { key: 'coupon.error.min', vars: { amount: ctx.yen(c.min) } };
      else { ctx.s.coupon = code; ctx.s.couponErr = null; ctx.s.couponDraft = ''; }
    },
    removeCoupon(ctx) { ctx.s.coupon = null; },
    startCheckout(ctx) {
      ctx.s.co = ctx.s.co || { step: 'address', address: { family: '佐藤', given: '愛子', postal: '150-0001', pref: '東京都', city: '渋谷区神宮前', line1: '1-2-3', line2: '', tel: '090-1234-5678' }, delivery: 'standard', when: 'any', pay: 'card', card: {} };
      ctx.s.co.step = 'address'; ctx.s.co.err = null; ctx.go('checkout'); return false;
    },
    saveAddress(ctx, f, e, d) {
      const err = {};
      for (const k of REQ) if (!(d[k] || '').trim()) err[k] = 'addr.error.required';
      if (!err.postal && !/^\d{3}-?\d{4}$/.test(d.postal.trim())) err.postal = 'addr.error.postal';
      if (!err.tel && !/^[\d-]{10,13}$/.test(d.tel.trim())) err.tel = 'addr.error.tel';
      ctx.s.co.address = d; ctx.s.co.err = Object.keys(err).length ? err : null;
      if (ctx.s.co.err) focusErr(); else ctx.s.co.step = 'delivery';
    },
    delivery(ctx, el) { ctx.s.co.delivery = el.value; },
    saveDelivery(ctx, f, e, d) { ctx.s.co.delivery = d.delivery || 'standard'; ctx.s.co.when = d.when; ctx.s.co.step = 'payment'; ctx.s.co.err = null; },
    pay(ctx, el) { ctx.s.co.pay = el.value; ctx.s.co.err = null; },
    savePayment(ctx, f, e, d) {
      const err = {};
      if (ctx.s.co.pay === 'card') {
        ctx.s.co.card = d;
        if ((d.card || '').replace(/\D/g, '').length !== 16) err.card = 'pay.error.card';
        if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test((d.expiry || '').trim())) err.expiry = 'pay.error.expiry';
        if (!/^\d{3}$/.test((d.cvc || '').trim())) err.cvc = 'pay.error.cvc';
      }
      ctx.s.co.err = Object.keys(err).length ? err : null;
      if (ctx.s.co.err) focusErr(); else ctx.s.co.step = 'review';
    },
    coStep(ctx, el) { ctx.s.co.step = el.dataset.step; ctx.s.co.err = null; },
    placeOrder(ctx) {
      ctx.s.co.placing = true;
      setTimeout(() => {
        const s = ctx.s; const t = totals(s); const a = s.co.address;
        const arrive = s.co.delivery === 'express' ? '2026-10-19' : '2026-10-21';
        s.orders.unshift({ id: 'KG-' + s.nextOrder++, placed: '2026-10-18', status: s.co.pay === 'card' ? 'paid' : 'waiting', name: a.given, total: t.total, tracking: '', address: `${a.family} ${a.given} · 〒${a.postal} ${a.pref}${a.city}${a.line1}`,
          lines: s.cart.map((l) => ({ ...l, price: priceOf(prod(l.pid)) })), arrive });
        s.cart = []; s.coupon = null; s.co.placing = false; s.co.step = 'address';
        ctx.go('thanks');
      }, 900);
    },
    buyAgain(ctx, el) {
      const o = ctx.s.orders.find((x) => x.id === el.dataset.oid);
      o.lines.forEach((l) => { if (variantOf(prod(l.pid), l.vid).stock) addLine(ctx.s, l.pid, l.vid, l.qty); });
      ctx.go('cart'); return false;
    },
    login(ctx, f, e, d) {
      ctx.s.email = d.email;
      if (!d.password || d.password.length < 4 || d.password === 'wrong' || !/^\S+@\S+\.\S+$/.test(d.email || '')) { ctx.s.loginErr = { wrong: true }; return; }
      ctx.s.loginErr = null; ctx.s.user = true; ctx.go('orders'); return false;
    },
    logout(ctx) { ctx.s.user = false; },
  },
};
