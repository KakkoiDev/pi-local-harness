// Back Office: the AppAdmin archetype, built from SidePanel, TopBar, BottomBar, Dashboard, KpiTile, LineChart, BarChart,
// DonutChart, DataTable, ListSearch, StatusBadges, DetailView, Timeline, ConfirmDialog, Toasts, Roles, Invite, EditForm,
// SettingsPage, SavedState, CommandPalette, EmptyState.
import { html, raw, icon, esc } from '../kit.js';

const NOW = Date.parse('2026-10-18T09:00:00+09:00');
const H = 3600e3, D = 86400e3;
const STATUSES = ['pending', 'paid', 'shipped', 'refund_requested', 'refunded', 'cancelled'];
const DOT = { pending: 'bg-amber-500', paid: 'bg-green-600', shipped: 'bg-sky-600', refunded: 'bg-muted-foreground', cancelled: 'bg-muted-foreground' };

const PEOPLE = [
  ['Yoko Tanaka', '田中 陽子', 'yoko.tanaka@example.com'], ['Ren Sato', '佐藤 蓮', 'ren.sato@example.com'], ['Mei Wong', 'ウォン・メイ', 'mei.wong@example.com'],
  ['Kenji Ito', '伊藤 健二', 'kenji.ito@example.com'], ['Hana Suzuki', '鈴木 花', 'hana.s@example.com'], ['Daiki Mori', '森 大輝', 'daiki.mori@example.com'],
  ['Sara Lind', 'サラ・リンド', 'sara.lind@example.com'], ['Aoi Kobayashi', '小林 葵', 'aoi.k@example.com'], ['Taro Yamada', '山田 太郎', 'taro.y@example.com'],
  ['Emi Nakamura', '中村 恵美', 'emi.n@example.com'], ['Jun Watanabe', '渡辺 純', 'jun.w@example.com'], ['Noa Kimura', '木村 乃愛', 'noa.k@example.com'],
];
const ITEMS = [['Ceramic Mug', '陶器のマグカップ', 2400], ['Grid Notebook A5', '方眼ノート A5', 880], ['Linen Tote', 'リネンのトートバッグ', 3600], ['Brass Pen', '真鍮のペン', 5200], ['Tea Sampler', 'お茶のセット', 2980], ['Wool Socks', 'ウールの靴下', 1650]];
const PAY = ['card', 'konbini', 'bank', 'qr'];

function seedOrders() {
  const st = ['paid', 'pending', 'shipped', 'refund_requested', 'paid', 'shipped', 'shipped', 'paid', 'cancelled', 'shipped', 'refunded', 'paid', 'pending', 'shipped', 'paid', 'refund_requested', 'shipped', 'shipped', 'paid', 'shipped', 'shipped', 'refunded', 'shipped'];
  return st.map((status, i) => {
    const p = i * 7 % PEOPLE.length, it = ITEMS[(i * 5) % ITEMS.length], qty = 1 + (i % 3);
    return { id: 1048 - i, customer: p, item: (i * 5) % ITEMS.length, qty, total: it[2] * qty + (i % 4 === 0 ? 600 : 0), pay: PAY[i % 4], status, placed: NOW - (i * 5.5 + 1) * H, note: '' };
  });
}
function seedUsers() {
  const roles = ['owner', 'admin', 'member', 'member', 'viewer', 'member', 'member', 'viewer', 'member', 'member', 'member', 'viewer'];
  return PEOPLE.map((p, i) => ({ id: 200 + i, name: { en: p[0], ja: p[1] }, email: p[2], role: roles[i], status: i === 6 ? 'suspended' : i === 10 ? 'invited' : 'active', joined: NOW - (i * 23 + 4) * D, orders: (i * 3) % 7, last: NOW - (i * 9 + 1) * H }));
}

const M = {
  en: {
    'app.name': 'Back Office', 'nav.main': 'Main', 'nav.overview': 'Overview', 'nav.orders': 'Orders', 'nav.users': 'Users', 'nav.settings': 'Settings', 'nav.more': 'More',
    'top.search': 'Search or jump to…', 'top.search_label': 'Open search and commands', 'top.account': 'Aiko Kato',
    'cmd.label': 'Search and commands', 'cmd.placeholder': 'Type an order number, a name or a command…', 'cmd.empty': 'Nothing found. Try an order number like 1042.', 'cmd.orders': 'Orders', 'cmd.users': 'Users', 'cmd.goto': 'Go To', 'cmd.actions': 'Actions', 'cmd.invite': 'Invite Someone…', 'cmd.theme': 'Switch Light or Dark', 'cmd.hint': '↑↓ Move · ↵ Open · Esc Close',
    'ov.title': 'Overview', 'ov.sub': 'Komorebi Goods · last 7 days', 'kpi.sales': 'Sales', 'kpi.orders': 'Orders', 'kpi.users': 'New users', 'kpi.attention': 'Needs attention', 'kpi.vs': 'vs the 7 days before', 'kpi.attention_link': 'Review refund requests',
    'ov.revenue': 'Revenue by week', 'ov.revenue_sub': 'This period against the one before', 'ov.this': 'This period', 'ov.last': 'Period before', 'ov.daily': 'Orders per day', 'ov.daily_sub': 'This week', 'ov.pay': 'Payment methods', 'ov.pay_sub': 'Share of orders', 'ov.recent': 'Recent orders', 'ov.all_orders': 'All Orders', 'ov.table': 'Show as a table',
    'pay.card': 'Card', 'pay.konbini': 'Convenience store', 'pay.bank': 'Bank transfer', 'pay.qr': 'QR code',
    'day.mon': 'Mon', 'day.tue': 'Tue', 'day.wed': 'Wed', 'day.thu': 'Thu', 'day.fri': 'Fri', 'day.sat': 'Sat', 'day.sun': 'Sun', 'week': 'W{n}',
    'status.pending': 'Pending', 'status.paid': 'Paid', 'status.shipped': 'Shipped', 'status.refund_requested': 'Refund requested', 'status.refunded': 'Refunded', 'status.cancelled': 'Cancelled', 'status.all': 'All statuses',
    'orders.title': 'Orders', 'orders.search': 'Search orders', 'orders.search_hint': 'Order number or customer…', 'orders.status': 'Status', 'orders.count': '{n} orders', 'orders.caption': 'Orders, {from}–{to} of {n}',
    'col.order': 'Order', 'col.customer': 'Customer', 'col.placed': 'Placed', 'col.status': 'Status', 'col.total': 'Total', 'col.actions': 'Actions', 'col.select_all': 'Select all on this page', 'col.select': 'Select order {id}', 'col.sort': 'Sort by {col}', 'col.open': 'Open order {id}',
    'orders.selected': '{n} selected', 'orders.ship': 'Mark as Shipped', 'orders.clear_sel': 'Clear', 'orders.ship_title': 'Mark {n} orders as shipped?', 'orders.ship_body': 'Customers get a shipping email. Only paid orders change.', 'orders.ship_ok': 'Mark as Shipped', 'orders.shipped_toast': '{n} orders marked as shipped', 'orders.none_paid': 'None of the selected orders are paid, so none can ship.',
    'pages': 'Pages', 'prev': 'Previous', 'next': 'Next', 'page': 'Page {n}',
    'empty.title': 'No orders match', 'empty.text': 'Check the order number or clear the filters.', 'empty.clear': 'Clear Filters',
    'order.title': 'Order #{id}', 'order.back': 'Orders', 'order.placed': 'Placed {when}', 'order.items': 'Items', 'order.qty': 'Qty', 'order.price': 'Price', 'order.subtotal': 'Subtotal', 'order.shipping': 'Shipping', 'order.total': 'Total',
    'order.customer': 'Customer', 'order.payment': 'Payment', 'order.history': 'History', 'order.change': 'Change Status…', 'order.approve': 'Approve Refund', 'order.decline': 'Decline', 'order.ship': 'Mark as Shipped',
    'order.change_title': 'Change the status of #{id}', 'order.change_label': 'New status', 'order.change_note': 'Note for the history (optional)', 'order.change_ok': 'Change Status', 'order.changed': 'Order #{id} is now {status}',
    'order.refund_title': 'Refund {amount} to {name}?', 'order.refund_body': 'The money goes back to the card used. This can’t be undone.', 'order.refund_ok': 'Send Refund', 'order.refund_done': 'Refund sent', 'order.missing': 'This order doesn’t exist or was deleted.',
    'ev.placed': 'Order placed', 'ev.paid': 'Payment received', 'ev.shipped': 'Shipped', 'ev.refund_requested': 'Refund requested', 'ev.refunded': 'Refund sent', 'ev.cancelled': 'Cancelled', 'ev.pending': 'Waiting for payment', 'ev.next_ship': 'Ship within 2 days', 'ev.by_you': 'by you', 'ev.reason': '“The mug arrived cracked.”',
    'cancel': 'Cancel', 'save': 'Save', 'undo': 'Undo', 'close': 'Close',
    'users.title': 'Users', 'users.search': 'Search users', 'users.search_hint': 'Name or email…', 'users.invite': 'Invite People', 'users.count': '{n} people', 'col.person': 'Person', 'col.role': 'Role', 'col.state': 'State', 'col.joined': 'Joined', 'roles.role_for': 'Role for {name}',
    'role.owner': 'Owner', 'role.admin': 'Admin', 'role.member': 'Member', 'role.viewer': 'Viewer', 'ustate.active': 'Active', 'ustate.suspended': 'Suspended', 'ustate.invited': 'Invited', 'role.changed': '{name} is now {role}', 'role.owner_locked': 'There must be one owner. Make someone else the owner first.',
    'roles.what_can': 'What can each role do?', 'roles.can.owner': 'Everything, including billing and deleting the shop.', 'roles.can.admin': 'Orders, refunds, users and settings.', 'roles.can.member': 'Orders and refunds up to ¥10,000.', 'roles.can.viewer': 'Can look, can’t change anything.',
    'invite.title': 'Invite people', 'invite.desc': 'They get an email with a link. Invitations expire after 7 days.', 'invite.emails': 'Email addresses', 'invite.emails_hint': 'Separate with commas.', 'invite.role': 'Role', 'invite.send': 'Send Invitations',
    'invite.err.empty': 'Enter at least one email address.', 'invite.err.bad': '“{email}” isn’t an email address.', 'invite.err.exists': '{email} already has an account.', 'invite.sent': 'Invitations sent to {n} people', 'invite.sent_one': 'Invitation sent to {email}',
    'user.back': 'Users', 'user.edit': 'Edit Details', 'user.name': 'Name', 'user.email': 'Email', 'user.role': 'Role', 'user.joined': 'Joined {when}', 'user.orders': 'Orders', 'user.last': 'Last seen {when}', 'user.activity': 'Recent activity',
    'user.suspend': 'Suspend…', 'user.restore': 'Restore Access', 'user.suspend_title': 'Suspend {name}?', 'user.suspend_body': 'They are logged out everywhere and can’t log in until you restore access.', 'user.suspend_ok': 'Suspend', 'user.suspended': '{name} is suspended', 'user.restored': '{name} can log in again',
    'user.act.login': 'Logged in from Safari on iPhone', 'user.act.order': 'Placed order #{id}', 'user.act.password': 'Changed their password',
    'form.title': 'Edit {name}', 'form.save': 'Save Changes', 'form.summary': 'Fix {n} things before saving', 'form.summary_one': 'Fix 1 thing before saving', 'form.err.name': 'Enter a name.', 'form.err.email': 'Enter an email like name@example.com.', 'form.saved': 'Changes saved',
    'set.title': 'Settings', 'set.tab.shop': 'Shop', 'set.tab.app': 'Appearance and language', 'set.shop_name': 'Shop name', 'set.contact': 'Contact email', 'set.notify': 'Email me when a refund is requested', 'set.daily': 'Send a daily summary at 9:00',
    'set.language': 'Language', 'set.theme': 'Appearance', 'theme.system': 'Match System', 'theme.light': 'Light', 'theme.dark': 'Dark', 'saved.saving': 'Saving…', 'saved.at': 'All changes saved', 'set.err.name': 'The shop needs a name.',
    'time.hours': '{n} h ago', 'time.days': '{n} days ago', 'time.now': 'Just now',
  },
  ja: {
    'app.name': 'バックオフィス', 'nav.main': 'メイン', 'nav.overview': '概要', 'nav.orders': '注文', 'nav.users': 'ユーザー', 'nav.settings': '設定', 'nav.more': 'その他',
    'top.search': '検索・移動…', 'top.search_label': '検索とコマンドを開く', 'top.account': '加藤 愛子',
    'cmd.label': '検索とコマンド', 'cmd.placeholder': '注文番号、名前、コマンドを入力…', 'cmd.empty': '見つかりません。1042 のような注文番号でお試しください。', 'cmd.orders': '注文', 'cmd.users': 'ユーザー', 'cmd.goto': '移動', 'cmd.actions': '操作', 'cmd.invite': 'メンバーを招待…', 'cmd.theme': 'ライト／ダークを切り替え', 'cmd.hint': '↑↓ 移動 · ↵ 開く · Esc 閉じる',
    'ov.title': '概要', 'ov.sub': 'こもれび雑貨・過去7日間', 'kpi.sales': '売上', 'kpi.orders': '注文数', 'kpi.users': '新規ユーザー', 'kpi.attention': '要対応', 'kpi.vs': 'その前の7日間と比較', 'kpi.attention_link': '返金リクエストを確認',
    'ov.revenue': '週ごとの売上', 'ov.revenue_sub': '今期と前期の比較', 'ov.this': '今期', 'ov.last': '前期', 'ov.daily': '曜日別の注文数', 'ov.daily_sub': '今週', 'ov.pay': '支払い方法', 'ov.pay_sub': '注文に占める割合', 'ov.recent': '最近の注文', 'ov.all_orders': 'すべての注文', 'ov.table': '表で表示',
    'pay.card': 'カード', 'pay.konbini': 'コンビニ払い', 'pay.bank': '銀行振込', 'pay.qr': 'QRコード決済',
    'day.mon': '月', 'day.tue': '火', 'day.wed': '水', 'day.thu': '木', 'day.fri': '金', 'day.sat': '土', 'day.sun': '日', 'week': '第{n}週',
    'status.pending': '支払い待ち', 'status.paid': '支払い済み', 'status.shipped': '発送済み', 'status.refund_requested': '返金リクエスト', 'status.refunded': '返金済み', 'status.cancelled': 'キャンセル', 'status.all': 'すべてのステータス',
    'orders.title': '注文', 'orders.search': '注文を検索', 'orders.search_hint': '注文番号または顧客名…', 'orders.status': 'ステータス', 'orders.count': '{n}件の注文', 'orders.caption': '注文 {n}件中 {from}〜{to}件',
    'col.order': '注文', 'col.customer': '顧客', 'col.placed': '注文日時', 'col.status': 'ステータス', 'col.total': '合計', 'col.actions': '操作', 'col.select_all': 'このページをすべて選択', 'col.select': '注文 {id} を選択', 'col.sort': '{col}で並べ替え', 'col.open': '注文 {id} を開く',
    'orders.selected': '{n}件を選択中', 'orders.ship': '発送済みにする', 'orders.clear_sel': '選択を解除', 'orders.ship_title': '{n}件の注文を発送済みにしますか？', 'orders.ship_body': 'お客様に発送メールが届きます。変更されるのは支払い済みの注文だけです。', 'orders.ship_ok': '発送済みにする', 'orders.shipped_toast': '{n}件の注文を発送済みにしました', 'orders.none_paid': '選択した注文に支払い済みのものがないため、発送済みにできません。',
    'pages': 'ページ', 'prev': '前へ', 'next': '次へ', 'page': '{n}ページ',
    'empty.title': '一致する注文はありません', 'empty.text': '注文番号を確認するか、絞り込みを解除してください。', 'empty.clear': '絞り込みを解除',
    'order.title': '注文 #{id}', 'order.back': '注文', 'order.placed': '{when}に注文', 'order.items': '商品', 'order.qty': '数量', 'order.price': '価格', 'order.subtotal': '小計', 'order.shipping': '送料', 'order.total': '合計',
    'order.customer': '顧客', 'order.payment': '支払い', 'order.history': '履歴', 'order.change': 'ステータスを変更…', 'order.approve': '返金を承認', 'order.decline': '却下', 'order.ship': '発送済みにする',
    'order.change_title': '#{id} のステータスを変更', 'order.change_label': '新しいステータス', 'order.change_note': '履歴に残すメモ（任意）', 'order.change_ok': 'ステータスを変更', 'order.changed': '注文 #{id} を「{status}」にしました',
    'order.refund_title': '{name}様に{amount}を返金しますか？', 'order.refund_body': '支払いに使われたカードに返金されます。取り消しはできません。', 'order.refund_ok': '返金する', 'order.refund_done': '返金しました', 'order.missing': 'この注文は存在しないか、削除されました。',
    'ev.placed': '注文を受け付け', 'ev.paid': '入金を確認', 'ev.shipped': '発送', 'ev.refund_requested': '返金のリクエスト', 'ev.refunded': '返金済み', 'ev.cancelled': 'キャンセル', 'ev.pending': '入金待ち', 'ev.next_ship': '2日以内に発送', 'ev.by_you': '担当：あなた', 'ev.reason': '「マグカップが割れて届きました。」',
    'cancel': 'キャンセル', 'save': '保存', 'undo': '元に戻す', 'close': '閉じる',
    'users.title': 'ユーザー', 'users.search': 'ユーザーを検索', 'users.search_hint': '名前またはメールアドレス…', 'users.invite': 'メンバーを招待', 'users.count': '{n}人', 'col.person': 'ユーザー', 'col.role': '役割', 'col.state': '状態', 'col.joined': '登録日', 'roles.role_for': '{name}の役割',
    'role.owner': 'オーナー', 'role.admin': '管理者', 'role.member': 'メンバー', 'role.viewer': '閲覧のみ', 'ustate.active': '有効', 'ustate.suspended': '停止中', 'ustate.invited': '招待中', 'role.changed': '{name}を「{role}」にしました', 'role.owner_locked': 'オーナーは必ず1人必要です。先に別の人をオーナーにしてください。',
    'roles.what_can': '役割ごとにできること', 'roles.can.owner': '支払い設定やショップの削除を含め、すべて。', 'roles.can.admin': '注文、返金、ユーザー、設定。', 'roles.can.member': '注文と ¥10,000 までの返金。', 'roles.can.viewer': '見ることだけ。変更はできません。',
    'invite.title': 'メンバーを招待', 'invite.desc': 'リンク付きのメールが届きます。招待は7日間有効です。', 'invite.emails': 'メールアドレス', 'invite.emails_hint': '複数の場合はカンマで区切ります。', 'invite.role': '役割', 'invite.send': '招待を送信',
    'invite.err.empty': 'メールアドレスを1つ以上入力してください。', 'invite.err.bad': '「{email}」はメールアドレスではありません。', 'invite.err.exists': '{email} はすでにアカウントがあります。', 'invite.sent': '{n}人に招待を送りました', 'invite.sent_one': '{email} に招待を送りました',
    'user.back': 'ユーザー', 'user.edit': '詳細を編集', 'user.name': '名前', 'user.email': 'メールアドレス', 'user.role': '役割', 'user.joined': '{when}に登録', 'user.orders': '注文数', 'user.last': '最終アクセス：{when}', 'user.activity': '最近の操作',
    'user.suspend': '利用を停止…', 'user.restore': '利用を再開', 'user.suspend_title': '{name}の利用を停止しますか？', 'user.suspend_body': 'すべての端末でログアウトされ、再開するまでログインできません。', 'user.suspend_ok': '停止する', 'user.suspended': '{name}の利用を停止しました', 'user.restored': '{name}は再びログインできます',
    'user.act.login': 'iPhone の Safari からログイン', 'user.act.order': '注文 #{id} を作成', 'user.act.password': 'パスワードを変更',
    'form.title': '{name}を編集', 'form.save': '変更を保存', 'form.summary': '保存する前に{n}か所直してください', 'form.summary_one': '保存する前に1か所直してください', 'form.err.name': '名前を入力してください。', 'form.err.email': 'name@example.com の形式で入力してください。', 'form.saved': '変更を保存しました',
    'set.title': '設定', 'set.tab.shop': 'ショップ', 'set.tab.app': '外観と言語', 'set.shop_name': 'ショップ名', 'set.contact': '連絡先メールアドレス', 'set.notify': '返金リクエストが来たらメールで知らせる', 'set.daily': '毎日9:00にまとめを送る',
    'set.language': '言語', 'set.theme': '外観', 'theme.system': 'システムに合わせる', 'theme.light': 'ライト', 'theme.dark': 'ダーク', 'saved.saving': '保存中…', 'saved.at': 'すべて保存しました', 'set.err.name': 'ショップ名を入力してください。',
    'time.hours': '{n}時間前', 'time.days': '{n}日前', 'time.now': 'たった今',
  },
};

// ---- helpers ----
const who = (ctx, i) => PEOPLE[i][ctx.lang === 'ja' ? 1 : 0];
const L = (ctx, v) => (typeof v === 'string' ? v : v[ctx.lang] || v.en);
const ago = (ctx, t) => { const h = Math.round((NOW - t) / H); if (h < 1) return ctx.t('time.now'); if (h < 48) return ctx.t('time.hours', { n: h }); return ctx.t('time.days', { n: Math.round(h / 24) }); };
const when = (ctx, t) => ctx.date(t, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
const initials = (name) => name.split(/[\s・]+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
const statusBadge = (ctx, s) => s === 'refund_requested'
  ? html`<span class="badge" data-variant="destructive">${ctx.t('status.' + s)}</span>`
  : html`<span class="badge" data-variant="outline"><span class="size-1.5 rounded-full ${DOT[s]}" aria-hidden="true"></span><span>${ctx.t('status.' + s)}</span></span>`;
const userBadge = (ctx, s) => s === 'active'
  ? html`<span class="badge" data-variant="outline"><span class="size-1.5 rounded-full bg-green-600" aria-hidden="true"></span><span>${ctx.t('ustate.active')}</span></span>`
  : s === 'suspended' ? html`<span class="badge" data-variant="destructive">${ctx.t('ustate.suspended')}</span>` : html`<span class="badge" data-variant="secondary">${ctx.t('ustate.invited')}</span>`;
const attention = (ctx) => ctx.s.orders.filter((o) => o.status === 'refund_requested').length;
const opt = (v, label, sel) => html`<option value="${v}" ${raw(sel ? 'selected' : '')}>${label}</option>`;
const chartAttrs = (type, key, data, series, options) => raw(`data-chart-type="${type}" data-chart-label-key="${key}" data-chart-data='${esc(JSON.stringify(data))}' data-chart-series='${esc(JSON.stringify(series))}' data-chart-options='${esc(JSON.stringify(options || {}))}'`);

// ---- shell: SidePanel (desktop), TopBar + BottomBar (phone) ----
const NAV = [['overview', 'chart', 'nav.overview'], ['orders', 'box', 'nav.orders'], ['users', 'users', 'nav.users'], ['settings', 'settings', 'nav.settings']];
function shell(ctx, body, active) {
  const att = attention(ctx);
  return html`<div class="flex h-full flex-col @3xl:flex-row">
    <aside data-block="SidePanel" class="hidden w-60 shrink-0 flex-col gap-1 border-r bg-sidebar p-3 text-sm text-sidebar-foreground @3xl:flex" aria-label="${ctx.t('nav.main')}">
      <p class="flex items-center gap-2 px-2 pb-3 pt-1 font-semibold">${icon('chart', 'size-4')}${ctx.t('app.name')}</p>
      <nav class="grid gap-0.5">
        ${NAV.map(([r, i, k]) => html`<a href="#" data-go="${r}" ${raw(active === r ? 'aria-current="page"' : '')} class="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-sidebar-accent aria-[current=page]:bg-sidebar-accent aria-[current=page]:font-medium">${icon(i, 'size-4')}<span>${ctx.t(k)}</span>${r === 'orders' && att ? html`<span class="badge ml-auto" data-variant="destructive">${att}</span>` : ''}</a>`)}
      </nav>
      <div class="mt-auto flex items-center gap-2 border-t px-2 pt-3"><span class="avatar" data-size="sm"><span>AK</span></span><span class="truncate">${ctx.t('top.account')}</span></div>
    </aside>
    <div class="flex min-h-0 min-w-0 flex-1 flex-col">
      <header data-block="TopBar" class="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <h1 class="flex-1 truncate text-base font-semibold @3xl:hidden">${ctx.t('app.name')}</h1>
        <button type="button" data-action="palette" aria-label="${ctx.t('top.search_label')}" class="btn hidden w-80 justify-start text-muted-foreground @3xl:inline-flex" data-variant="outline">${icon('search')}<span class="flex-1 text-left">${ctx.t('top.search')}</span><kbd class="kbd">⌘K</kbd></button>
        <span class="hidden flex-1 @3xl:block"></span>
        <button type="button" class="btn @3xl:hidden" data-variant="ghost" data-size="icon" data-action="palette" aria-label="${ctx.t('top.search_label')}">${icon('search')}</button>
        <button type="button" class="btn relative" data-variant="ghost" data-size="icon" aria-label="${ctx.t('kpi.attention')}" data-go="orders" data-param='${JSON.stringify({ status: 'refund_requested', page: 1, q: '' })}'>${icon('bell')}${att ? html`<span class="absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive"></span>` : ''}</button>
      </header>
      <main class="min-h-0 flex-1 overflow-y-auto" data-scroll="main">${body}</main>
      <nav data-block="BottomBar" class="grid shrink-0 grid-cols-4 border-t bg-background @3xl:hidden" aria-label="${ctx.t('nav.main')}">
        ${NAV.map(([r, i, k]) => html`<a href="#" data-go="${r}" ${raw(active === r ? 'aria-current="page"' : '')} class="relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] text-muted-foreground aria-[current=page]:font-medium aria-[current=page]:text-foreground">${icon(i, 'size-5')}<span>${ctx.t(k)}</span>${r === 'orders' && att ? html`<span class="badge absolute right-[22%] top-1.5 h-4 min-w-4 px-1 text-[10px]" data-variant="destructive">${att}</span>` : ''}</a>`)}
      </nav>
    </div>
  </div>`;
}

// ---- Overview: Dashboard ----
function overview(ctx) {
  const o = ctx.s.orders, att = attention(ctx);
  const sales = o.filter((x) => !['cancelled', 'refunded', 'pending'].includes(x.status)).reduce((a, x) => a + x.total, 0);
  const kpi = (id, label, value, trend, spark, extra) => html`<section data-block="KpiTile" class="card" data-size="sm" aria-labelledby="ad-k-${id}">
    <header><h2 id="ad-k-${id}" class="text-muted-foreground text-sm font-normal">${label}</h2></header>
    <section class="grid gap-2">
      <p class="text-3xl font-semibold tabular-nums">${value}</p>
      ${trend ? html`<p class="flex flex-wrap items-center gap-2 text-sm"><span class="badge" data-variant="secondary">${trend}</span><span class="text-muted-foreground">${ctx.t('kpi.vs')}</span></p>` : ''}
      ${spark ? html`<canvas class="chart aspect-auto h-10 w-full" role="img" aria-label="${label}" ${chartAttrs('line', 'w', spark.map((v, i) => ({ w: i, v })), { v: { label, color: 'var(--chart-1)' } }, { scales: { x: { display: false }, y: { display: false } }, elements: { point: { radius: 0 }, line: { borderWidth: 2 } } })}></canvas>` : ''}
      ${extra || ''}
    </section>
  </section>`;
  const weeks = Array.from({ length: 8 }, (_, i) => ctx.t('week', { n: 35 + i }));
  const rev = [310, 342, 330, 365, 352, 388, 401, 420], prev = [280, 300, 296, 320, 318, 330, 342, 351];
  const revData = weeks.map((w, i) => ({ w, a: rev[i] * 1000, b: prev[i] * 1000 }));
  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const daily = days.map((d, i) => ({ d: ctx.t('day.' + d), n: [42, 51, 44, 62, 57, 83, 74][i] }));
  const payShare = [['card', 48], ['konbini', 21], ['bank', 14], ['qr', 17]];
  const recent = [...o].sort((a, b) => b.placed - a.placed).slice(0, 5);
  return shell(ctx, html`<section data-block="Dashboard" class="grid gap-5 p-4 @3xl:p-8">
    <header><h1 class="text-2xl font-semibold">${ctx.t('ov.title')}</h1><p class="text-sm text-muted-foreground">${ctx.t('ov.sub')}</p></header>
    <div class="grid gap-3 @xl:grid-cols-2 @5xl:grid-cols-4">
      ${kpi('sales', ctx.t('kpi.sales'), ctx.yen(1284600), '▲ 9 %', [310, 342, 330, 365, 352, 388, 420])}
      ${kpi('orders', ctx.t('kpi.orders'), ctx.num(413), '▲ 6 %', [52, 58, 55, 61, 57, 64, 66])}
      ${kpi('users', ctx.t('kpi.users'), ctx.num(37), '▼ 3 %', [8, 6, 7, 5, 6, 4, 5])}
      ${kpi('att', ctx.t('kpi.attention'), ctx.num(att), '', null, html`<a href="#" class="text-sm underline underline-offset-4" data-go="orders" data-param='${JSON.stringify({ status: 'refund_requested', page: 1, q: '' })}'>${ctx.t('kpi.attention_link')}</a>`)}
    </div>
    <div class="grid gap-4 @5xl:grid-cols-3">
      <section data-block="LineChart" class="card @5xl:col-span-2" aria-labelledby="ad-rev">
        <header><h2 id="ad-rev" class="font-semibold">${ctx.t('ov.revenue')}</h2><p class="text-sm text-muted-foreground">${ctx.t('ov.revenue_sub')}</p></header>
        <section><canvas class="chart aspect-[16/7] @max-3xl:aspect-[4/3]" role="img" aria-label="${ctx.t('ov.revenue')}" data-chart-legend="true" ${chartAttrs('line', 'w', revData, { a: { label: ctx.t('ov.this'), color: 'var(--chart-1)', surface: 'gradient' }, b: { label: ctx.t('ov.last'), color: 'var(--chart-2)', dataset: { borderDash: [5, 4] } } }, { scales: { y: { beginAtZero: false, ticks: { display: true } } } })}></canvas>
          <details class="mt-3 text-sm"><summary class="cursor-pointer">${ctx.t('ov.table')}</summary><div class="table-container mt-2"><table class="table"><thead><tr><th></th><th class="text-right">${ctx.t('ov.this')}</th><th class="text-right">${ctx.t('ov.last')}</th></tr></thead><tbody>${revData.map((r) => html`<tr><td>${r.w}</td><td class="text-right tabular-nums">${ctx.yen(r.a)}</td><td class="text-right tabular-nums">${ctx.yen(r.b)}</td></tr>`)}</tbody></table></div></details></section>
      </section>
      <section data-block="DonutChart" class="card" aria-labelledby="ad-pay">
        <header><h2 id="ad-pay" class="font-semibold">${ctx.t('ov.pay')}</h2><p class="text-sm text-muted-foreground">${ctx.t('ov.pay_sub')}</p></header>
        <section><canvas class="chart aspect-square max-h-64" role="img" aria-label="${ctx.t('ov.pay')}" data-chart-legend="true" ${chartAttrs('doughnut', 'm', payShare.map(([k, v]) => ({ m: ctx.t('pay.' + k), share: v })), { share: { label: '%' } }, { cutout: '62%' })}></canvas></section>
      </section>
    </div>
    <div class="grid gap-4 @5xl:grid-cols-3">
      <section data-block="BarChart" class="card" aria-labelledby="ad-daily">
        <header><h2 id="ad-daily" class="font-semibold">${ctx.t('ov.daily')}</h2><p class="text-sm text-muted-foreground">${ctx.t('ov.daily_sub')}</p></header>
        <section><canvas class="chart aspect-[4/3]" role="img" aria-label="${ctx.t('ov.daily')}" ${chartAttrs('bar', 'd', daily, { n: { label: ctx.t('kpi.orders'), color: 'var(--chart-1)' } }, { scales: { y: { beginAtZero: true, ticks: { display: true } } } })}></canvas></section>
      </section>
      <section data-block="DataTable" class="card @5xl:col-span-2" aria-labelledby="ad-recent">
        <header class="flex-row items-center justify-between"><h2 id="ad-recent" class="font-semibold">${ctx.t('ov.recent')}</h2><a href="#" class="btn" data-variant="outline" data-size="sm" data-go="orders">${ctx.t('ov.all_orders')}</a></header>
        <section><div class="table-container"><table class="table"><thead><tr><th>${ctx.t('col.order')}</th><th>${ctx.t('col.customer')}</th><th class="@max-3xl:hidden">${ctx.t('col.status')}</th><th class="text-right">${ctx.t('col.total')}</th></tr></thead>
          <tbody>${recent.map((r) => html`<tr><td><a href="#" class="font-medium underline-offset-4 hover:underline" data-go="order" data-param='${JSON.stringify({ orderId: r.id })}'>#${r.id}</a></td><td>${who(ctx, r.customer)}</td><td class="@max-3xl:hidden">${statusBadge(ctx, r.status)}</td><td class="text-right tabular-nums">${ctx.yen(r.total)}</td></tr>`)}</tbody></table></div></section>
      </section>
    </div>
  </section>`, 'overview');
}

// ---- Orders: ListSearch + DataTable ----
const PER_PAGE = 8;
function orderRows(ctx) {
  const { q = '', status = '', sort = 'placed', dir = 'desc' } = ctx.s;
  const n = q.trim().toLowerCase().replace(/^#/, '');
  let rows = ctx.s.orders.filter((o) => (!status || o.status === status) && (!n || String(o.id).includes(n) || PEOPLE[o.customer][0].toLowerCase().includes(n) || PEOPLE[o.customer][1].includes(n)));
  const key = { id: (o) => o.id, customer: (o) => who(ctx, o.customer), placed: (o) => o.placed, total: (o) => o.total }[sort];
  rows.sort((a, b) => { const x = key(a), y = key(b); const c = typeof x === 'string' ? x.localeCompare(y, ctx.lang) : x - y; return dir === 'asc' ? c : -c; });
  return rows;
}
function orders(ctx) {
  const rows = orderRows(ctx), sel = ctx.s.sel;
  const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE)), page = Math.min(ctx.s.page || 1, pages);
  const slice = rows.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const allOn = slice.length && slice.every((o) => sel.includes(o.id));
  const sortTh = (key, label, cls = '') => {
    const on = ctx.s.sort === key, aria = on ? (ctx.s.dir === 'asc' ? 'ascending' : 'descending') : 'none';
    return html`<th scope="col" class="${cls}" aria-sort="${aria}"><button type="button" class="btn -ms-2.5" data-variant="ghost" data-size="sm" data-action="sort" data-key="${key}" aria-label="${ctx.t('col.sort', { col: label })}"><span>${label}</span>${icon(on ? (ctx.s.dir === 'asc' ? 'down' : 'down') : 'down', on ? (ctx.s.dir === 'asc' ? 'rotate-180' : '') : 'opacity-40')}</button></th>`;
  };
  const from = rows.length ? (page - 1) * PER_PAGE + 1 : 0, to = Math.min(page * PER_PAGE, rows.length);
  return shell(ctx, html`<section data-block="ListSearch" class="grid gap-4 p-4 @3xl:p-8" aria-labelledby="ad-orders-title">
    <h1 id="ad-orders-title" class="text-2xl font-semibold">${ctx.t('orders.title')}</h1>
    <form role="search" class="flex flex-wrap items-end gap-3" data-submit="noop">
      <label class="input-group w-full @3xl:w-72"><span data-align="start">${icon('search', 'size-4')}</span>
        <input id="ad-q" type="search" value="${ctx.s.q || ''}" placeholder="${ctx.t('orders.search_hint')}" aria-label="${ctx.t('orders.search')}" data-input="search" autocomplete="off"></label>
      <div class="grid gap-1.5"><label class="label" for="ad-status">${ctx.t('orders.status')}</label>
        <select id="ad-status" class="select" data-change="status">${opt('', ctx.t('status.all'), !ctx.s.status)}${STATUSES.map((s) => opt(s, ctx.t('status.' + s), ctx.s.status === s))}</select></div>
    </form>
    ${sel.length ? html`<div class="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2" role="region" aria-label="${ctx.t('orders.selected', { n: sel.length })}">
      <span class="text-sm font-medium">${ctx.t('orders.selected', { n: sel.length })}</span><span class="flex-1"></span>
      <button class="btn" data-variant="ghost" data-size="sm" type="button" data-action="clearSel">${ctx.t('orders.clear_sel')}</button>
      <button class="btn" data-size="sm" type="button" data-action="bulkShip">${icon('box')}${ctx.t('orders.ship')}</button></div>` : ''}
    ${rows.length ? html`<div data-block="DataTable" class="grid gap-3">
      <p class="text-sm text-muted-foreground" aria-live="polite">${ctx.t('orders.count', { n: rows.length })}</p>
      <div class="table-container"><table class="table">
        <caption class="sr-only">${ctx.t('orders.caption', { from, to, n: rows.length })}</caption>
        <thead><tr>
          <th scope="col" class="w-8"><input class="input" type="checkbox" id="ad-all" aria-label="${ctx.t('col.select_all')}" data-change="selAll" ${raw(allOn ? 'checked' : '')}></th>
          ${sortTh('id', ctx.t('col.order'))}${sortTh('customer', ctx.t('col.customer'))}${sortTh('placed', ctx.t('col.placed'), '@max-3xl:hidden')}
          <th scope="col" class="@max-3xl:hidden">${ctx.t('col.status')}</th>${sortTh('total', ctx.t('col.total'), 'text-end')}
          <th scope="col" class="text-end"><span class="sr-only">${ctx.t('col.actions')}</span></th></tr></thead>
        <tbody>${slice.map((o) => html`<tr ${raw(sel.includes(o.id) ? 'aria-selected="true" class="bg-muted/50"' : '')}>
          <td><input class="input" type="checkbox" id="ad-sel-${o.id}" data-change="selOne" data-id="${o.id}" aria-label="${ctx.t('col.select', { id: o.id })}" ${raw(sel.includes(o.id) ? 'checked' : '')}></td>
          <td class="font-medium tabular-nums">#${o.id}</td>
          <td><div class="grid"><span>${who(ctx, o.customer)}</span><span class="@3xl:hidden">${statusBadge(ctx, o.status)}</span></div></td>
          <td class="@max-3xl:hidden text-muted-foreground">${when(ctx, o.placed)}</td>
          <td class="@max-3xl:hidden">${statusBadge(ctx, o.status)}</td>
          <td class="text-end tabular-nums">${ctx.yen(o.total)}</td>
          <td class="text-end"><a href="#" class="btn" data-variant="ghost" data-size="icon-sm" aria-label="${ctx.t('col.open', { id: o.id })}" data-go="order" data-param='${JSON.stringify({ orderId: o.id })}'>${icon('chevron')}</a></td></tr>`)}</tbody>
      </table></div>
      <nav class="flex items-center justify-between gap-2" aria-label="${ctx.t('pages')}">
        <p class="text-sm text-muted-foreground" aria-hidden="true">${from}–${to} / ${rows.length}</p>
        <div class="flex items-center gap-1">
          <button type="button" class="btn" data-variant="outline" data-size="sm" data-action="page" data-to="${page - 1}" ${raw(page <= 1 ? 'disabled' : '')}>${icon('back')}<span class="@max-3xl:sr-only">${ctx.t('prev')}</span></button>
          ${Array.from({ length: pages }, (_, i) => html`<button type="button" class="btn @max-3xl:hidden" data-size="icon-sm" data-variant="${i + 1 === page ? 'outline' : 'ghost'}" ${raw(i + 1 === page ? 'aria-current="page"' : '')} aria-label="${ctx.t('page', { n: i + 1 })}" data-action="page" data-to="${i + 1}">${i + 1}</button>`)}
          <button type="button" class="btn" data-variant="outline" data-size="sm" data-action="page" data-to="${page + 1}" ${raw(page >= pages ? 'disabled' : '')}><span class="@max-3xl:sr-only">${ctx.t('next')}</span>${icon('chevron')}</button>
        </div>
      </nav>
    </div>` : html`<div data-block="EmptyState" class="empty rounded-lg border border-dashed"><header><figure>${icon('search')}</figure><h3>${ctx.t('empty.title')}</h3><p>${ctx.t('empty.text')}</p></header><footer class="flex-row"><button class="btn" data-variant="outline" type="button" data-action="clearFilters">${ctx.t('empty.clear')}</button></footer></div>`}
  </section>`, 'orders');
}

// ---- Order: DetailView + Timeline ----
function events(o) {
  const ev = [['placed', o.placed]];
  if (o.status === 'pending') return [...ev, ['pending', null, 'now']];
  if (o.status === 'cancelled') return [...ev, ['cancelled', o.placed + 20 * H]];
  ev.push(['paid', o.placed + 0.2 * H]);
  if (o.status === 'paid') return [...ev, ['next_ship', null, 'future']];
  ev.push(['shipped', o.placed + 26 * H]);
  if (o.status === 'refund_requested') return [...ev, ['refund_requested', o.placed + 50 * H, 'now']];
  if (o.status === 'refunded') return [...ev, ['refund_requested', o.placed + 50 * H], ['refunded', o.placed + 54 * H]];
  return ev;
}
function order(ctx) {
  const o = ctx.s.orders.find((x) => x.id === ctx.s.orderId);
  if (!o) return shell(ctx, html`<div class="p-8"><div data-block="EmptyState" class="empty rounded-lg border border-dashed"><header><h3>${ctx.t('order.missing')}</h3></header><footer class="flex-row"><button class="btn" type="button" data-go="orders">${ctx.t('order.back')}</button></footer></div></div>`, 'orders');
  const it = ITEMS[o.item], ship = o.total - it[2] * o.qty;
  const evs = [...events(o), ...(o.log || [])];
  const marker = (k) => k === 'now' ? html`<span class="grid size-6 place-items-center rounded-full border-2 border-primary bg-background" aria-hidden="true"><span class="size-2 rounded-full bg-primary"></span></span>`
    : k === 'future' ? html`<span class="grid size-6 place-items-center rounded-full border border-dashed border-muted-foreground bg-background" aria-hidden="true"></span>`
    : html`<span class="grid size-6 place-items-center rounded-full bg-primary text-primary-foreground" aria-hidden="true">${icon('check', 'size-3.5')}</span>`;
  return shell(ctx, html`<article data-block="DetailView" class="mx-auto grid max-w-5xl gap-5 p-4 @3xl:p-8" aria-labelledby="ad-o-title">
    <nav class="breadcrumb" data-block="Breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="#" data-go="orders">${ctx.t('order.back')}</a></li><li aria-hidden="true">${icon('chevron', 'size-3.5')}</li><li><span aria-current="page">#${o.id}</span></li></ol></nav>
    <header class="flex flex-wrap items-center gap-3">
      <h1 id="ad-o-title" class="text-2xl font-semibold">${ctx.t('order.title', { id: o.id })}</h1>${statusBadge(ctx, o.status)}
      <span class="text-sm text-muted-foreground">${ctx.t('order.placed', { when: when(ctx, o.placed) })}</span>
      <span class="flex-1"></span>
      ${o.status === 'refund_requested' ? html`<button class="btn" data-variant="outline" type="button" data-action="decline">${ctx.t('order.decline')}</button><button class="btn" type="button" data-action="refund">${ctx.t('order.approve')}</button>` : ''}
      ${o.status === 'paid' ? html`<button class="btn" type="button" data-action="shipOne">${icon('box')}${ctx.t('order.ship')}</button>` : ''}
      <button class="btn" data-variant="outline" type="button" data-action="changeStatus">${ctx.t('order.change')}</button>
    </header>
    ${o.status === 'refund_requested' ? html`<div class="alert" role="note">${icon('alert')}<h2>${ctx.t('status.refund_requested')}</h2><section>${ctx.t('ev.reason')}</section></div>` : ''}
    <div class="grid gap-5 @4xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <section class="card" aria-labelledby="ad-o-items"><header><h2 id="ad-o-items" class="font-semibold">${ctx.t('order.items')}</h2></header>
        <section><div class="table-container"><table class="table"><thead><tr><th>${ctx.t('order.items')}</th><th class="text-end">${ctx.t('order.qty')}</th><th class="text-end">${ctx.t('order.price')}</th></tr></thead>
          <tbody><tr><td>${it[ctx.lang === 'ja' ? 1 : 0]}</td><td class="text-end tabular-nums">${o.qty}</td><td class="text-end tabular-nums">${ctx.yen(it[2] * o.qty)}</td></tr></tbody>
          <tfoot><tr><td colspan="2">${ctx.t('order.shipping')}</td><td class="text-end tabular-nums">${ctx.yen(ship)}</td></tr><tr><td colspan="2" class="font-semibold">${ctx.t('order.total')}</td><td class="text-end font-semibold tabular-nums">${ctx.yen(o.total)}</td></tr></tfoot></table></div></section></section>
      <div class="grid content-start gap-5">
        <section class="card" aria-labelledby="ad-o-cust"><header><h2 id="ad-o-cust" class="font-semibold">${ctx.t('order.customer')}</h2></header>
          <section class="grid gap-3 text-sm"><div class="flex items-center gap-3"><span class="avatar"><span>${initials(PEOPLE[o.customer][0])}</span></span><div class="grid min-w-0"><a href="#" class="font-medium underline-offset-4 hover:underline" data-go="user" data-param='${JSON.stringify({ userId: 200 + o.customer })}'>${who(ctx, o.customer)}</a><span class="truncate text-muted-foreground">${PEOPLE[o.customer][2]}</span></div></div>
            <p><span class="text-muted-foreground">${ctx.t('order.payment')}:</span> ${ctx.t('pay.' + o.pay)}</p></section></section>
        <section data-block="Timeline" class="card" aria-labelledby="ad-o-hist"><header><h2 id="ad-o-hist" class="font-semibold">${ctx.t('order.history')}</h2></header>
          <section><ol class="grid">${evs.map(([k, t, kind, note]) => html`<li ${raw(kind === 'now' ? 'aria-current="step"' : '')} class="relative grid grid-cols-[1.5rem_1fr] gap-x-3 pb-5 last:pb-0 before:absolute before:left-3 before:top-6 before:bottom-0 before:w-px before:bg-border last:before:hidden">
            ${marker(kind)}<div class="grid gap-0.5"><p class="text-sm font-medium">${ctx.t('ev.' + k)}</p>${note ? html`<p class="text-sm text-muted-foreground">${note}</p>` : ''}${t ? html`<time class="text-xs text-muted-foreground">${when(ctx, t)}</time>` : ''}</div></li>`)}</ol></section></section>
      </div>
    </div>
  </article>`, 'orders');
}

// ---- Users: Roles + Invite ----
function users(ctx) {
  const n = (ctx.s.uq || '').trim().toLowerCase();
  const list = ctx.s.users.filter((u) => !n || u.email.includes(n) || u.name.en.toLowerCase().includes(n) || u.name.ja.includes(n));
  return shell(ctx, html`<section data-block="Roles" class="grid gap-4 p-4 @3xl:p-8" aria-labelledby="ad-users-title">
    <header class="flex flex-wrap items-center justify-between gap-2"><h1 id="ad-users-title" class="text-2xl font-semibold">${ctx.t('users.title')}</h1>
      <button class="btn" type="button" data-action="invite">${icon('plus')}${ctx.t('users.invite')}</button></header>
    <label data-block="ListSearch" class="input-group w-full @3xl:w-72"><span data-align="start">${icon('search', 'size-4')}</span>
      <input id="ad-uq" type="search" value="${ctx.s.uq || ''}" placeholder="${ctx.t('users.search_hint')}" aria-label="${ctx.t('users.search')}" data-input="usearch" autocomplete="off"></label>
    <p class="text-sm text-muted-foreground" aria-live="polite">${ctx.t('users.count', { n: list.length })}</p>
    ${list.length ? html`<div class="table-container" data-block="DataTable"><table class="table"><thead><tr><th scope="col">${ctx.t('col.person')}</th><th scope="col">${ctx.t('col.role')}</th><th scope="col" class="@max-3xl:hidden">${ctx.t('col.state')}</th><th scope="col" class="@max-3xl:hidden">${ctx.t('col.joined')}</th><th scope="col"><span class="sr-only">${ctx.t('col.actions')}</span></th></tr></thead>
      <tbody>${list.map((u) => html`<tr>
        <td><div class="flex items-center gap-3"><span class="avatar"><span>${initials(u.name.en)}</span></span><div class="grid min-w-0"><a href="#" class="font-medium underline-offset-4 hover:underline" data-go="user" data-param='${JSON.stringify({ userId: u.id })}'>${L(ctx, u.name)}</a><span class="truncate text-sm text-muted-foreground">${u.email}</span></div></div></td>
        <td><label class="sr-only" for="ad-role-${u.id}">${ctx.t('roles.role_for', { name: L(ctx, u.name) })}</label>
          <select class="select w-32" id="ad-role-${u.id}" data-change="role" data-id="${u.id}">${['owner', 'admin', 'member', 'viewer'].map((r) => opt(r, ctx.t('role.' + r), u.role === r))}</select></td>
        <td class="@max-3xl:hidden">${userBadge(ctx, u.status)}</td>
        <td class="@max-3xl:hidden text-muted-foreground">${ctx.date(u.joined, { year: 'numeric', month: 'short', day: 'numeric' })}</td>
        <td class="text-end"><a href="#" class="btn" data-variant="ghost" data-size="icon-sm" aria-label="${L(ctx, u.name)}" data-go="user" data-param='${JSON.stringify({ userId: u.id })}'>${icon('chevron')}</a></td></tr>`)}</tbody></table></div>`
    : html`<div data-block="EmptyState" class="empty rounded-lg border border-dashed"><header><figure>${icon('users')}</figure><h3>${ctx.t('empty.title')}</h3></header></div>`}
    <section class="accordion"><details><summary>${ctx.t('roles.what_can')}</summary>
      <div class="table-container"><table class="table"><tbody>${['owner', 'admin', 'member', 'viewer'].map((r) => html`<tr><th scope="row" class="w-32">${ctx.t('role.' + r)}</th><td class="whitespace-normal">${ctx.t('roles.can.' + r)}</td></tr>`)}</tbody></table></div></details></section>
  </section>`, 'users');
}

// ---- User: DetailView + EditForm ----
function user(ctx) {
  const u = ctx.s.users.find((x) => x.id === ctx.s.userId);
  if (!u) return users(ctx);
  const ords = ctx.s.orders.filter((o) => 200 + o.customer === u.id).slice(0, 2);
  const acts = [['login', u.last], ...ords.map((o) => ['order', o.placed, o.id]), ['password', u.last - 9 * D]];
  return shell(ctx, html`<article data-block="DetailView" class="mx-auto grid max-w-4xl gap-5 p-4 @3xl:p-8" aria-labelledby="ad-u-title">
    <nav class="breadcrumb" data-block="Breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="#" data-go="users">${ctx.t('user.back')}</a></li><li aria-hidden="true">${icon('chevron', 'size-3.5')}</li><li><span aria-current="page">${L(ctx, u.name)}</span></li></ol></nav>
    <header class="flex flex-wrap items-center gap-4">
      <span class="avatar" data-size="lg"><span>${initials(u.name.en)}</span></span>
      <div class="grid gap-1"><h1 id="ad-u-title" class="text-2xl font-semibold">${L(ctx, u.name)}</h1><div class="flex flex-wrap items-center gap-2 text-sm text-muted-foreground"><span>${u.email}</span>${userBadge(ctx, u.status)}<span class="badge" data-variant="secondary">${ctx.t('role.' + u.role)}</span></div></div>
      <span class="flex-1"></span>
      <button class="btn" data-variant="outline" type="button" data-go="userEdit">${icon('edit')}${ctx.t('user.edit')}</button>
      ${u.role !== 'owner' ? (u.status === 'suspended' ? html`<button class="btn" type="button" data-action="restore">${ctx.t('user.restore')}</button>` : html`<button class="btn" data-variant="destructive" type="button" data-action="suspend">${ctx.t('user.suspend')}</button>`) : ''}
    </header>
    <dl class="grid gap-3 @xl:grid-cols-3">
      <div class="card" data-size="sm"><section><dt class="text-sm text-muted-foreground">${ctx.t('user.orders')}</dt><dd class="text-2xl font-semibold tabular-nums">${u.orders}</dd></section></div>
      <div class="card" data-size="sm"><section><dt class="text-sm text-muted-foreground">${ctx.t('col.joined')}</dt><dd class="text-lg font-medium">${ctx.date(u.joined, { year: 'numeric', month: 'short', day: 'numeric' })}</dd></section></div>
      <div class="card" data-size="sm"><section><dt class="text-sm text-muted-foreground">${ctx.t('user.last', { when: '' }).replace(/[:：]\s*$/, '')}</dt><dd class="text-lg font-medium">${ago(ctx, u.last)}</dd></section></div>
    </dl>
    <section data-block="ActivityFeed" class="card" aria-labelledby="ad-u-act"><header><h2 id="ad-u-act" class="font-semibold">${ctx.t('user.activity')}</h2></header>
      <section><ul class="grid gap-3">${acts.map(([k, t, id]) => html`<li class="flex items-start gap-3 text-sm"><span class="mt-1.5 size-2 shrink-0 rounded-full bg-muted-foreground"></span><div class="grid"><span>${ctx.t('user.act.' + k, { id })}</span><time class="text-xs text-muted-foreground">${when(ctx, t)}</time></div></li>`)}</ul></section></section>
  </article>`, 'users');
}
function userEdit(ctx) {
  const u = ctx.s.users.find((x) => x.id === ctx.s.userId);
  if (!u) return users(ctx);
  const f = ctx.s.uform || { name: L(ctx, u.name), email: u.email, role: u.role };
  const err = ctx.s.uerr || {};
  const n = Object.keys(err).length;
  const fld = (id, key, label, type) => html`<div class="field"><label class="label" for="ad-f-${id}">${label}</label>
    <input class="input" id="ad-f-${id}" name="${key}" type="${type}" value="${f[key]}" ${raw(err[key] ? `aria-invalid="true" aria-describedby="ad-f-${id}-err"` : '')}>
    ${err[key] ? html`<p class="text-destructive text-sm" id="ad-f-${id}-err">${ctx.t(err[key])}</p>` : ''}</div>`;
  return shell(ctx, html`<form data-block="EditForm" data-submit="saveUser" class="mx-auto grid max-w-xl gap-5 p-4 @3xl:p-8" novalidate>
    <nav class="breadcrumb" aria-label="Breadcrumb"><ol><li><a href="#" data-go="users">${ctx.t('user.back')}</a></li><li aria-hidden="true">${icon('chevron', 'size-3.5')}</li><li><a href="#" data-go="user">${L(ctx, u.name)}</a></li></ol></nav>
    <h1 class="text-2xl font-semibold">${ctx.t('form.title', { name: L(ctx, u.name) })}</h1>
    ${n ? html`<div class="alert" data-variant="destructive" role="alert" tabindex="-1" id="ad-f-summary"><h2>${n === 1 ? ctx.t('form.summary_one') : ctx.t('form.summary', { n })}</h2><section><ul>${Object.entries(err).map(([k, m]) => html`<li><a class="underline" href="#ad-f-${k}">${ctx.t(m)}</a></li>`)}</ul></section></div>` : ''}
    ${fld('name', 'name', ctx.t('user.name'), 'text')}${fld('email', 'email', ctx.t('user.email'), 'email')}
    <div class="field"><label class="label" for="ad-f-role">${ctx.t('user.role')}</label><select class="select" id="ad-f-role" name="role" ${raw(u.role === 'owner' ? 'disabled aria-describedby="ad-f-role-help"' : '')}>${['owner', 'admin', 'member', 'viewer'].map((r) => opt(r, ctx.t('role.' + r), f.role === r))}</select>
      ${u.role === 'owner' ? html`<p class="text-muted-foreground text-sm" id="ad-f-role-help">${ctx.t('role.owner_locked')}</p>` : ''}</div>
    <div class="flex flex-wrap justify-end gap-2"><button class="btn" data-variant="outline" type="button" data-go="user">${ctx.t('cancel')}</button><button class="btn" type="submit">${ctx.t('form.save')}</button></div>
  </form>`, 'users');
}

// ---- Settings: SettingsPage + Tabs + SavedState ----
function settings(ctx) {
  const st = ctx.s.settings, tab = ctx.s.tab || 'shop';
  const tabBtn = (k, label) => html`<button type="button" role="tab" id="ad-tab-${k}" aria-controls="ad-panel-${k}" aria-selected="${tab === k}" tabindex="${tab === k ? 0 : -1}" data-action="tab" data-tab="${k}">${label}</button>`;
  const radio = (name, v, label, on) => html`<label class="label gap-3 font-normal"><input class="input" type="radio" name="${name}" value="${v}" data-change="${name}" ${raw(on ? 'checked' : '')}><span ${raw(v === 'ja' ? 'lang="ja"' : '')}>${label}</span></label>`;
  return shell(ctx, html`<section data-block="SettingsPage" class="mx-auto grid max-w-2xl gap-5 p-4 @3xl:p-8">
    <header class="flex flex-wrap items-center gap-3"><h1 class="text-2xl font-semibold">${ctx.t('set.title')}</h1><span class="flex-1"></span>
      <span data-block="SavedState" class="flex items-center gap-1.5 text-sm text-muted-foreground" role="status" aria-live="polite">${ctx.s.saving ? ctx.t('saved.saving') : html`${icon('check', 'size-3.5')}${ctx.t('saved.at')}`}</span></header>
    <div data-block="Tabs" class="tabs w-full">
      <nav role="tablist" aria-orientation="horizontal" class="w-full">${tabBtn('shop', ctx.t('set.tab.shop'))}${tabBtn('app', ctx.t('set.tab.app'))}</nav>
      ${tab === 'shop' ? html`<div role="tabpanel" id="ad-panel-shop" aria-labelledby="ad-tab-shop" class="grid gap-5 pt-4">
        <div class="field"><label class="label" for="ad-s-name">${ctx.t('set.shop_name')}</label><input class="input" id="ad-s-name" value="${st.name}" data-input="setName" ${raw(st.name.trim() ? '' : 'aria-invalid="true" aria-describedby="ad-s-name-err"')}>
          ${st.name.trim() ? '' : html`<p class="text-destructive text-sm" id="ad-s-name-err">${ctx.t('set.err.name')}</p>`}</div>
        <div class="field"><label class="label" for="ad-s-mail">${ctx.t('set.contact')}</label><input class="input" id="ad-s-mail" type="email" value="${st.mail}" data-input="setMail"></div>
        <label class="label gap-3 font-normal"><input class="input" type="checkbox" role="switch" data-change="setNotify" ${raw(st.notify ? 'checked' : '')}><span>${ctx.t('set.notify')}</span></label>
        <label class="label gap-3 font-normal"><input class="input" type="checkbox" role="switch" data-change="setDaily" ${raw(st.daily ? 'checked' : '')}><span>${ctx.t('set.daily')}</span></label>
      </div>` : html`<div role="tabpanel" id="ad-panel-app" aria-labelledby="ad-tab-app" class="grid gap-6 pt-4">
        <fieldset class="fieldset grid gap-3"><legend class="text-base font-semibold">${ctx.t('set.language')}</legend>${radio('lang', 'en', 'English', ctx.lang === 'en')}${radio('lang', 'ja', '日本語', ctx.lang === 'ja')}</fieldset>
        <fieldset class="fieldset grid gap-3"><legend class="text-base font-semibold">${ctx.t('set.theme')}</legend>${['system', 'light', 'dark'].map((v) => radio('theme', v, ctx.t('theme.' + v), ctx.theme === v))}</fieldset>
      </div>`}
    </div>
  </section>`, 'settings');
}

// ---- CommandPalette (Basecoat command dialog, built on open) ----
function openPalette(ctx) {
  if (document.getElementById('ad-command')) return;
  const ords = [...ctx.s.orders].sort((a, b) => b.placed - a.placed);
  const us = ctx.s.users;
  const item = (id, go, param, ic, label, kw) => `<div role="menuitem" class="@max-3xl:min-h-11" id="${id}" data-go="${go}" ${param ? `data-param='${esc(JSON.stringify(param))}'` : ''} data-keywords="${esc(kw || '')}">${icon(ic)}<span>${esc(label)}</span></div>`;
  const d = document.createElement('dialog');
  d.id = 'ad-command'; d.className = 'command-dialog'; d.lang = ctx.lang;
  d.setAttribute('aria-label', ctx.t('cmd.label'));
  d.innerHTML = `<div class="command"><header>${icon('search')}<input type="text" id="ad-command-input" placeholder="${esc(ctx.t('cmd.placeholder'))}" autocomplete="off" autocorrect="off" spellcheck="false" aria-autocomplete="list" role="combobox" aria-expanded="true" aria-controls="ad-command-menu"></header>
    <div role="menu" id="ad-command-menu" aria-orientation="vertical" data-empty="${esc(ctx.t('cmd.empty'))}" class="scrollbar">
      <div role="group" aria-labelledby="ad-cmd-o"><span role="heading" id="ad-cmd-o">${esc(ctx.t('cmd.orders'))}</span>${ords.map((o) => item('ad-c-o' + o.id, 'order', { orderId: o.id }, 'box', `#${o.id} · ${who(ctx, o.customer)} · ${ctx.t('status.' + o.status)}`, `${o.id} ${PEOPLE[o.customer][0]} ${PEOPLE[o.customer][1]}`)).join('')}</div>
      <hr role="separator">
      <div role="group" aria-labelledby="ad-cmd-u"><span role="heading" id="ad-cmd-u">${esc(ctx.t('cmd.users'))}</span>${us.map((u) => item('ad-c-u' + u.id, 'user', { userId: u.id }, 'user', `${L(ctx, u.name)} · ${u.email}`, `${u.name.en} ${u.name.ja} ${u.email}`)).join('')}</div>
      <hr role="separator">
      <div role="group" aria-labelledby="ad-cmd-g"><span role="heading" id="ad-cmd-g">${esc(ctx.t('cmd.goto'))}</span>${NAV.map(([r, i, k]) => item('ad-c-g' + r, r, null, i, ctx.t(k), r)).join('')}</div>
      <hr role="separator">
      <div role="group" aria-labelledby="ad-cmd-a"><span role="heading" id="ad-cmd-a">${esc(ctx.t('cmd.actions'))}</span>
        <div role="menuitem" id="ad-c-invite" data-cmd="invite" data-keywords="invite add staff 招待">${icon('plus')}<span>${esc(ctx.t('cmd.invite'))}</span></div>
        <div role="menuitem" id="ad-c-theme" data-cmd="theme" data-keywords="dark light theme ダーク ライト">${icon('settings')}<span>${esc(ctx.t('cmd.theme'))}</span></div></div>
    </div>
    <footer class="flex justify-end border-t px-3 py-2 text-xs text-muted-foreground">${esc(ctx.t('cmd.hint'))}</footer></div>`;
  const close = () => { d.close(); };
  d.addEventListener('close', () => d.remove());
  d.addEventListener('click', (e) => {
    if (e.target === d) { close(); return; }
    const it = e.target.closest('[role=menuitem]'); if (!it) return;
    choose(it);
  });
  // Basecoat's command fires a click on the highlighted item for Return; keep a fallback for keyboards without it.
  d.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { const it = d.querySelector('[role=menuitem][aria-selected="true"], [role=menuitem][data-selected="true"]') || [...d.querySelectorAll('[role=menuitem]')].find((x) => !x.hidden && x.getAttribute('aria-hidden') !== 'true'); if (it) { e.preventDefault(); choose(it); } }
  });
  let chosen = false;
  function choose(it) {
    if (chosen) return; chosen = true;
    close();
    if (it.dataset.cmd === 'invite') { openInvite(ctx); return; }
    if (it.dataset.cmd === 'theme') { const dark = document.documentElement.classList.contains('dark'); ctx.setTheme(dark ? 'light' : 'dark'); return; }
    const p = it.dataset.param ? JSON.parse(it.dataset.param) : undefined;
    ctx.go(it.dataset.go, p);
  }
  document.body.append(d);
  d.showModal();
  setTimeout(() => d.querySelector('input')?.focus(), 0);
}

// ---- Invite dialog ----
function openInvite(ctx, prev = {}) {
  const err = prev.err;
  const body = html`<form id="ad-invite" data-submit="send" class="grid gap-4" novalidate>
    <div class="field"><label class="label" for="ad-inv-emails">${ctx.t('invite.emails')}</label>
      <textarea class="textarea" id="ad-inv-emails" name="emails" rows="2" placeholder="name@example.com, …" aria-describedby="ad-inv-help${err ? ' ad-inv-err' : ''}" ${raw(err ? 'aria-invalid="true"' : '')}>${prev.emails || ''}</textarea>
      <p class="text-muted-foreground text-sm" id="ad-inv-help">${ctx.t('invite.emails_hint')}</p>
      ${err ? html`<p class="text-destructive text-sm" id="ad-inv-err" role="alert">${err}</p>` : ''}</div>
    <div class="field"><label class="label" for="ad-inv-role">${ctx.t('invite.role')}</label>
      <select class="select" id="ad-inv-role" name="role">${['admin', 'member', 'viewer'].map((r) => opt(r, ctx.t('role.' + r), (prev.role || 'member') === r))}</select></div>
  </form>`;
  const footer = html`<button class="btn" data-variant="outline" type="button" data-close>${ctx.t('cancel')}</button><button class="btn" type="submit" form="ad-invite">${ctx.t('invite.send')}</button>`;
  const dlg = ctx.dialog({
    title: ctx.t('invite.title'), description: ctx.t('invite.desc'), body, footer,
    onAction: (name, form, e, close, data) => {
      if (name !== 'send') return;
      const emails = (data.emails || '').split(/[,\s、]+/).map((x) => x.trim()).filter(Boolean);
      let msg = '';
      if (!emails.length) msg = ctx.t('invite.err.empty');
      else {
        const bad = emails.find((x) => !/^\S+@\S+\.\S+$/.test(x));
        const dup = emails.find((x) => ctx.s.users.some((u) => u.email === x.toLowerCase()));
        if (bad) msg = ctx.t('invite.err.bad', { email: bad });
        else if (dup) msg = ctx.t('invite.err.exists', { email: dup });
      }
      if (msg) { close(); openInvite(ctx, { err: msg, emails: data.emails, role: data.role }); return; }
      emails.forEach((em) => ctx.s.users.push({ id: ctx.s.nextUser++, name: { en: em.split('@')[0], ja: em.split('@')[0] }, email: em.toLowerCase(), role: data.role, status: 'invited', joined: NOW, orders: 0, last: NOW }));
      close();
      ctx.toast({ category: 'success', title: emails.length === 1 ? ctx.t('invite.sent_one', { email: emails[0] }) : ctx.t('invite.sent', { n: emails.length }) });
      ctx.rerender();
    },
  });
  setTimeout(() => dlg.el.querySelector('textarea')?.focus(), 0);
}

let keyHandler = null, saveTimer = null;
function autosave(ctx) { ctx.s.saving = true; clearTimeout(saveTimer); saveTimer = setTimeout(() => { ctx.s.saving = false; ctx.rerender(); }, 700); }
function setStatus(ctx, o, status, note) {
  const prev = o.status;
  o.status = status;
  (o.log ||= []).push([status, NOW + (o.log.length + 1) * 60e3, null, note || ctx.t('ev.by_you')]);
  return prev;
}

export default {
  id: 'admin', icon: 'chart', host: 'admin.komorebi.local', archetype: 'AppAdmin', start: 'overview',
  name: { en: 'Back Office', ja: 'バックオフィス' }, short: { en: 'Admin', ja: '管理' },
  about: { en: 'The admin of a small shop: numbers at a glance, orders to sort, filter and ship, refunds to approve, users and roles, settings that save themselves.', ja: '小さなショップの管理画面。数字の概要、並べ替え・絞り込み・発送ができる注文、返金の承認、ユーザーと役割、自動保存の設定。' },
  try: { en: 'Press ⌘K or Ctrl K and type 1042. Open Needs attention and approve a refund. On Orders, sort by Total, select paid rows and Mark as Shipped. Invite “someone@” to see validation.', ja: '⌘K または Ctrl K を押して 1042 と入力。「要対応」から返金を承認。注文画面で合計で並べ替え、支払い済みの行を選んで発送済みに。「someone@」を招待すると入力チェックが出ます。' },
  messages: M,
  init: () => ({ orders: seedOrders(), users: seedUsers(), nextUser: 300, sel: [], page: 1, sort: 'placed', dir: 'desc', status: '', q: '', uq: '', settings: { name: 'Komorebi Goods', mail: 'shop@komorebi.example', notify: true, daily: false } }),
  render(ctx) {
    const r = ctx.s.route;
    if (r === 'orders') return orders(ctx);
    if (r === 'order') return order(ctx);
    if (r === 'users') return users(ctx);
    if (r === 'user') { ctx.s.uform = null; ctx.s.uerr = null; return user(ctx); }
    if (r === 'userEdit') return userEdit(ctx);
    if (r === 'settings') return settings(ctx);
    return overview(ctx);
  },
  mount(ctx) {
    if (keyHandler) return;
    keyHandler = (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); const p = document.getElementById('ad-command'); p ? p.close() : openPalette(ctx); } };
    document.addEventListener('keydown', keyHandler);
  },
  unmount() { if (keyHandler) document.removeEventListener('keydown', keyHandler); keyHandler = null; document.getElementById('ad-command')?.remove(); },
  actions: {
    noop: () => false,
    palette(ctx) { openPalette(ctx); return false; },
    search(ctx, el) { ctx.s.q = el.value; ctx.s.page = 1; },
    status(ctx, el) { ctx.s.status = el.value; ctx.s.page = 1; ctx.s.sel = []; },
    clearFilters(ctx) { ctx.s.q = ''; ctx.s.status = ''; ctx.s.page = 1; },
    sort(ctx, el) { const k = el.dataset.key; if (ctx.s.sort === k) ctx.s.dir = ctx.s.dir === 'asc' ? 'desc' : 'asc'; else { ctx.s.sort = k; ctx.s.dir = k === 'customer' || k === 'id' ? 'asc' : 'desc'; } ctx.s.page = 1; },
    page(ctx, el) { ctx.s.page = Number(el.dataset.to); },
    selOne(ctx, el) { const id = Number(el.dataset.id); ctx.s.sel = el.checked ? [...ctx.s.sel, id] : ctx.s.sel.filter((x) => x !== id); },
    selAll(ctx, el) {
      const rows = orderRows(ctx), page = ctx.s.page || 1, ids = rows.slice((page - 1) * PER_PAGE, page * PER_PAGE).map((o) => o.id);
      ctx.s.sel = el.checked ? [...new Set([...ctx.s.sel, ...ids])] : ctx.s.sel.filter((x) => !ids.includes(x));
    },
    clearSel(ctx) { ctx.s.sel = []; },
    async bulkShip(ctx) {
      const paid = ctx.s.orders.filter((o) => ctx.s.sel.includes(o.id) && o.status === 'paid');
      if (!paid.length) { ctx.toast({ category: 'warning', title: ctx.t('orders.none_paid') }); return false; }
      const ok = await ctx.confirm({ title: ctx.t('orders.ship_title', { n: paid.length }), body: ctx.t('orders.ship_body'), ok: ctx.t('orders.ship_ok'), cancel: ctx.t('cancel') });
      if (!ok) return false;
      paid.forEach((o) => setStatus(ctx, o, 'shipped'));
      ctx.s.sel = [];
      ctx.toast({ category: 'success', title: ctx.t('orders.shipped_toast', { n: paid.length }), duration: 8000,
        action: { label: ctx.t('undo'), run: () => { paid.forEach((o) => { o.status = 'paid'; o.log.pop(); }); ctx.rerender(); } } });
    },
    shipOne(ctx) { const o = ctx.s.orders.find((x) => x.id === ctx.s.orderId); setStatus(ctx, o, 'shipped'); ctx.toast({ category: 'success', title: ctx.t('order.changed', { id: o.id, status: ctx.t('status.shipped') }), action: { label: ctx.t('undo'), run: () => { o.status = 'paid'; o.log.pop(); ctx.rerender(); } } }); },
    async refund(ctx) {
      const o = ctx.s.orders.find((x) => x.id === ctx.s.orderId);
      const ok = await ctx.confirm({ title: ctx.t('order.refund_title', { amount: ctx.yen(o.total), name: who(ctx, o.customer) }), body: ctx.t('order.refund_body'), ok: ctx.t('order.refund_ok'), cancel: ctx.t('cancel'), danger: true });
      if (!ok) return false;
      setStatus(ctx, o, 'refunded');
      ctx.toast({ category: 'success', title: ctx.t('order.refund_done'), description: `#${o.id} · ${ctx.yen(o.total)}` });
    },
    decline(ctx) { const o = ctx.s.orders.find((x) => x.id === ctx.s.orderId); setStatus(ctx, o, 'shipped'); ctx.toast({ category: 'info', title: ctx.t('order.changed', { id: o.id, status: ctx.t('status.shipped') }) }); },
    changeStatus(ctx) {
      const o = ctx.s.orders.find((x) => x.id === ctx.s.orderId);
      const body = html`<form id="ad-chg" data-submit="apply" class="grid gap-4">
        <div class="field"><label class="label" for="ad-chg-s">${ctx.t('order.change_label')}</label><select class="select" id="ad-chg-s" name="status">${STATUSES.map((s) => opt(s, ctx.t('status.' + s), s === o.status))}</select></div>
        <div class="field"><label class="label" for="ad-chg-n">${ctx.t('order.change_note')}</label><input class="input" id="ad-chg-n" name="note"></div></form>`;
      ctx.dialog({ title: ctx.t('order.change_title', { id: o.id }), body,
        footer: html`<button class="btn" data-variant="outline" type="button" data-close>${ctx.t('cancel')}</button><button class="btn" type="submit" form="ad-chg">${ctx.t('order.change_ok')}</button>`,
        onAction: (name, f, e, close, data) => {
          if (name !== 'apply') return;
          close();
          if (data.status === o.status) return;
          const prev = setStatus(ctx, o, data.status, data.note);
          ctx.toast({ category: 'success', title: ctx.t('order.changed', { id: o.id, status: ctx.t('status.' + data.status) }), action: { label: ctx.t('undo'), run: () => { o.status = prev; o.log.pop(); ctx.rerender(); } } });
          ctx.rerender();
        } });
      return false;
    },
    usearch(ctx, el) { ctx.s.uq = el.value; },
    role(ctx, el) {
      const u = ctx.s.users.find((x) => x.id === Number(el.dataset.id));
      if (u.role === 'owner' && el.value !== 'owner') { ctx.toast({ category: 'warning', title: ctx.t('role.owner_locked') }); return; }
      const prev = u.role;
      if (el.value === 'owner') ctx.s.users.forEach((x) => { if (x.role === 'owner') x.role = 'admin'; });
      u.role = el.value;
      ctx.toast({ category: 'success', title: ctx.t('role.changed', { name: L(ctx, u.name), role: ctx.t('role.' + u.role) }), action: { label: ctx.t('undo'), run: () => { u.role = prev; ctx.rerender(); } } });
    },
    invite(ctx) { openInvite(ctx); return false; },
    async suspend(ctx) {
      const u = ctx.s.users.find((x) => x.id === ctx.s.userId);
      const ok = await ctx.confirm({ title: ctx.t('user.suspend_title', { name: L(ctx, u.name) }), body: ctx.t('user.suspend_body'), ok: ctx.t('user.suspend_ok'), cancel: ctx.t('cancel'), danger: true });
      if (!ok) return false;
      u.status = 'suspended';
      ctx.toast({ category: 'success', title: ctx.t('user.suspended', { name: L(ctx, u.name) }), action: { label: ctx.t('undo'), run: () => { u.status = 'active'; ctx.rerender(); } } });
    },
    restore(ctx) { const u = ctx.s.users.find((x) => x.id === ctx.s.userId); u.status = 'active'; ctx.toast({ category: 'success', title: ctx.t('user.restored', { name: L(ctx, u.name) }) }); },
    saveUser(ctx, f, e, d) {
      const u = ctx.s.users.find((x) => x.id === ctx.s.userId);
      ctx.s.uform = { name: d.name ?? '', email: d.email ?? '', role: d.role ?? u.role };
      const err = {};
      if (!ctx.s.uform.name.trim()) err.name = 'form.err.name';
      if (!/^\S+@\S+\.\S+$/.test(ctx.s.uform.email)) err.email = 'form.err.email';
      ctx.s.uerr = Object.keys(err).length ? err : null;
      if (ctx.s.uerr) { setTimeout(() => document.getElementById('ad-f-summary')?.focus(), 0); return; }
      u.name = ctx.lang === 'ja' ? { ...u.name, ja: ctx.s.uform.name.trim() } : { ...u.name, en: ctx.s.uform.name.trim() };
      u.email = ctx.s.uform.email.trim().toLowerCase();
      if (d.role) u.role = d.role;
      ctx.toast({ category: 'success', title: ctx.t('form.saved') });
      ctx.go('user');
      return false;
    },
    tab(ctx, el) { ctx.s.tab = el.dataset.tab; setTimeout(() => document.getElementById('ad-tab-' + el.dataset.tab)?.focus(), 0); },
    setName(ctx, el) { ctx.s.settings.name = el.value; if (el.value.trim()) autosave(ctx); },
    setMail(ctx, el) { ctx.s.settings.mail = el.value; autosave(ctx); },
    setNotify(ctx, el) { ctx.s.settings.notify = el.checked; autosave(ctx); },
    setDaily(ctx, el) { ctx.s.settings.daily = el.checked; autosave(ctx); },
    lang(ctx, el) { ctx.setLang(el.value); },
    theme(ctx, el) { ctx.setTheme(el.value); },
  },
};
