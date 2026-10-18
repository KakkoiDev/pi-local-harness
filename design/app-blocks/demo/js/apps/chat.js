// Tsuru Chat: AppChat-style team chat, built from SidePanel, Channels, Presence, Mentions, Reactions, Threads,
// ConfirmDialog, DeleteUndo, EditForm, GlobalSearch, EmptyState, Notifications, Profile, SettingsPage, TopBar, BottomBar.
import { html, raw, icon, esc } from '../kit.js';

const ME = 'ak';
const PEOPLE = {
  ak: { en: 'Aiko Kato', ja: '加藤 愛子', ini: 'AK', color: 2, online: true },
  rs: { en: 'Ren Sato', ja: '佐藤 蓮', ini: 'RS', color: 1, online: true },
  ka: { en: 'Kana Abe', ja: '阿部 佳奈', ini: 'KA', color: 3, online: true },
  km: { en: 'Kaito Mori', ja: '森 海斗', ini: 'KM', color: 4, online: false },
  mt: { en: 'Mina Takahashi', ja: '高橋 美奈', ini: 'MT', color: 5, online: true },
};
const EMOJI = [['👍', 'react.thumbs_up'], ['❤️', 'react.heart'], ['😄', 'react.laugh'], ['🎉', 'react.party'], ['👀', 'react.eyes'], ['✅', 'react.check']];
const REPLIES = [
  { en: 'Sounds good to me.', ja: 'いいと思います。' },
  { en: 'Thanks, I’ll check after class.', ja: 'ありがとう、授業のあとで確認します。' },
  { en: 'Got it 👍', ja: '了解です👍' },
  { en: 'Can you share the link?', ja: 'リンクを共有してもらえますか？' },
];

const M = {
  en: {
    'app.name': 'Tsuru Chat', 'ws.name': 'Class 3-B', 'nav.main': 'Main', 'nav.home': 'Home', 'nav.activity': 'Activity', 'nav.search': 'Search', 'nav.you': 'You',
    'chat.channels': 'Channels', 'chat.dms': 'Direct messages', 'chat.new_channel': 'New Channel', 'chat.unread': '{n} unread', 'chat.online': 'Online', 'chat.away': 'Away',
    'chat.members': '{n} members', 'chat.here': '{n} here', 'chat.today': 'Today', 'chat.new': 'New', 'chat.message_label': 'Message {name}', 'chat.placeholder': 'Message {name}',
    'chat.send': 'Send', 'chat.attach': 'Attach a file', 'chat.typing_one': '{name} is typing…', 'chat.back': 'Back', 'chat.edited': '(edited)', 'chat.more': 'More actions for this message',
    'chat.react': 'Add Reaction', 'chat.reply_thread': 'Reply in Thread', 'chat.edit': 'Edit', 'chat.delete': 'Delete…', 'chat.save': 'Save', 'chat.cancel': 'Cancel', 'chat.edit_label': 'Edit message',
    'chat.dm_empty_title': 'This is the start of your messages with {name}', 'chat.dm_empty_text': 'Say hello. Only the two of you can see this conversation.',
    'chat.send_hint': 'Return to send · Shift+Return for a new line · @ to mention',
    'delete.title': 'Delete this message?', 'delete.body': 'It disappears for everyone in {conv}. You can undo for 8 seconds.', 'delete.ok': 'Delete Message', 'delete.done': 'Message deleted', 'delete.undo': 'Undo', 'delete.restored': 'Message restored',
    'react.label': 'Reactions', 'react.add': 'Add a reaction', 'react.choose': 'Choose a reaction', 'react.thumbs_up': 'Thumbs up', 'react.heart': 'Heart', 'react.laugh': 'Laughing', 'react.party': 'Party', 'react.eyes': 'Eyes', 'react.check': 'Check',
    'react.yours': '{emoji} {n} reactions, including yours. Remove yours', 'react.others': '{emoji} {n} reactions. Add yours',
    'mention.people': 'People', 'mention.hint': '↑↓ to choose · Return to mention · Esc to close', 'mention.none': 'No one matches “{q}”', 'mention.list_label': 'People to mention',
    'presence.here': 'Here now', 'presence.live': 'Live', 'presence.away': 'Away', 'presence.you': '(you)', 'presence.label': '{n} people here: {names}',
    'thread.title': 'Thread', 'thread.close': 'Close thread', 'thread.replies': '{n} replies', 'thread.reply_one': '1 reply', 'thread.last': 'Last reply {time}', 'thread.reply_label': 'Reply', 'thread.placeholder': 'Reply…',
    'thread.also_send': 'Also send to {conv}', 'thread.send': 'Reply', 'thread.count': '{n} replies', 'thread.none': 'No replies yet. Start the thread.',
    'nc.title': 'New channel', 'nc.desc': 'Channels are where a topic’s conversation lives.', 'nc.name': 'Name', 'nc.name_help': 'Lowercase letters, numbers and hyphens, like trip-photos.', 'nc.topic': 'Topic (optional)',
    'nc.visibility': 'Who can join', 'nc.public': 'Everyone in Class 3-B', 'nc.private': 'Only people you invite', 'nc.create': 'Create Channel', 'nc.cancel': 'Cancel',
    'nc.error.empty': 'Give the channel a name.', 'nc.error.format': 'Use lowercase letters, numbers and hyphens only.', 'nc.error.long': 'Keep it under 40 characters.', 'nc.error.taken': '#{name} already exists. Choose another name.', 'nc.created': '#{name} created',
    'search.title': 'Search', 'search.label': 'Search messages, channels and people', 'search.hint': 'Search messages, channels and people…', 'search.all': 'All', 'search.messages': 'Messages', 'search.channels': 'Channels', 'search.people': 'People',
    'search.count': '{n} results for “{q}”', 'search.count_one': '1 result for “{q}”', 'search.start': 'Search everything in Class 3-B', 'search.start_text': 'Try “museum”, “banner” or a person’s name.', 'search.none_title': 'Nothing matches “{q}”', 'search.none_text': 'Check the spelling or search all kinds.', 'search.in': 'in {conv}',
    'notif.title': 'Activity', 'notif.mark_all': 'Mark All as Read', 'notif.all': 'All', 'notif.unread': 'Unread', 'notif.unread_dot': 'Unread',
    'notif.mention': '{name} mentioned you in {conv}', 'notif.reply': '{name} replied to your thread in {conv}', 'notif.empty_title': 'You’re all caught up', 'notif.empty_text': 'Mentions and thread replies show up here.', 'notif.marked': 'All marked as read',
    'profile.title': 'Profile and settings', 'profile.name': 'Display name', 'profile.status': 'Status', 'profile.active': 'Active', 'profile.away': 'Away', 'profile.save': 'Save Profile', 'profile.saved': 'Profile saved',
    'profile.error.empty': 'Enter a display name.', 'profile.error.long': 'Keep it under 40 characters.',
    'settings.language': 'Language', 'settings.language_help': 'Tsuru Chat and its dates use this language.', 'settings.appearance': 'Appearance', 'settings.theme.system': 'Match System', 'settings.theme.light': 'Light', 'settings.theme.dark': 'Dark',
    'settings.notify': 'Notifications', 'settings.notify_mentions': 'Notify me about mentions and thread replies', 'settings.saved': 'Settings saved',
    'toast.new_in': 'New message in {conv}',
  },
  ja: {
    'app.name': 'つるチャット', 'ws.name': '3年B組', 'nav.main': 'メイン', 'nav.home': 'ホーム', 'nav.activity': 'アクティビティ', 'nav.search': '検索', 'nav.you': 'あなた',
    'chat.channels': 'チャンネル', 'chat.dms': 'ダイレクトメッセージ', 'chat.new_channel': '新規チャンネル', 'chat.unread': '未読 {n} 件', 'chat.online': 'オンライン', 'chat.away': '離席中',
    'chat.members': 'メンバー {n} 人', 'chat.here': '{n} 人がオンライン', 'chat.today': '今日', 'chat.new': '新着', 'chat.message_label': '{name} へのメッセージ', 'chat.placeholder': '{name} へメッセージを送信',
    'chat.send': '送信', 'chat.attach': 'ファイルを添付', 'chat.typing_one': '{name} さんが入力中…', 'chat.back': '戻る', 'chat.edited': '（編集済み）', 'chat.more': 'このメッセージのその他の操作',
    'chat.react': 'リアクション', 'chat.reply_thread': 'スレッドで返信', 'chat.edit': '編集', 'chat.delete': '削除…', 'chat.save': '保存', 'chat.cancel': 'キャンセル', 'chat.edit_label': 'メッセージを編集',
    'chat.dm_empty_title': '{name} さんとのメッセージはここから始まります', 'chat.dm_empty_text': 'あいさつしてみましょう。この会話は2人だけが見られます。',
    'chat.send_hint': 'Return で送信・Shift+Return で改行・@ でメンション',
    'delete.title': 'このメッセージを削除しますか？', 'delete.body': '{conv} の全員から見えなくなります。8秒間は元に戻せます。', 'delete.ok': 'メッセージを削除', 'delete.done': 'メッセージを削除しました', 'delete.undo': '元に戻す', 'delete.restored': 'メッセージを元に戻しました',
    'react.label': 'リアクション', 'react.add': 'リアクションを追加', 'react.choose': 'リアクションを選択', 'react.thumbs_up': 'いいね', 'react.heart': 'ハート', 'react.laugh': '笑顔', 'react.party': 'お祝い', 'react.eyes': '見てます', 'react.check': 'チェック',
    'react.yours': '{emoji} {n} 件（あなたを含む）。取り消す', 'react.others': '{emoji} {n} 件。追加する',
    'mention.people': 'メンバー', 'mention.hint': '↑↓ で選択・Return でメンション・Esc で閉じる', 'mention.none': '「{q}」に一致するメンバーはいません', 'mention.list_label': 'メンションするメンバー',
    'presence.here': 'オンライン中', 'presence.live': 'ライブ', 'presence.away': '離席中', 'presence.you': '（あなた）', 'presence.label': '{n} 人がオンライン：{names}',
    'thread.title': 'スレッド', 'thread.close': 'スレッドを閉じる', 'thread.replies': '{n} 件の返信', 'thread.reply_one': '1 件の返信', 'thread.last': '最終返信 {time}', 'thread.reply_label': '返信', 'thread.placeholder': '返信…',
    'thread.also_send': '{conv} にも送信', 'thread.send': '返信', 'thread.count': '{n} 件の返信', 'thread.none': 'まだ返信はありません。スレッドを始めましょう。',
    'nc.title': '新規チャンネル', 'nc.desc': 'トピックごとの会話の場所です。', 'nc.name': '名前', 'nc.name_help': '半角英小文字・数字・ハイフンのみ（例：trip-photos）。', 'nc.topic': 'トピック（任意）',
    'nc.visibility': '参加できる人', 'nc.public': '3年B組の全員', 'nc.private': '招待した人のみ', 'nc.create': 'チャンネルを作成', 'nc.cancel': 'キャンセル',
    'nc.error.empty': 'チャンネル名を入力してください。', 'nc.error.format': '半角英小文字・数字・ハイフンだけを使ってください。', 'nc.error.long': '40文字以内にしてください。', 'nc.error.taken': '#{name} はすでにあります。別の名前にしてください。', 'nc.created': '#{name} を作成しました',
    'search.title': '検索', 'search.label': 'メッセージ、チャンネル、メンバーを検索', 'search.hint': 'メッセージ、チャンネル、メンバーを検索…', 'search.all': 'すべて', 'search.messages': 'メッセージ', 'search.channels': 'チャンネル', 'search.people': 'メンバー',
    'search.count': '「{q}」の検索結果 {n} 件', 'search.count_one': '「{q}」の検索結果 1 件', 'search.start': '3年B組のすべてを検索', 'search.start_text': '「博物館」「旗」やメンバーの名前で試してみてください。', 'search.none_title': '「{q}」に一致するものはありません', 'search.none_text': 'つづりを確認するか、すべての種類で検索してください。', 'search.in': '{conv} 内',
    'notif.title': 'アクティビティ', 'notif.mark_all': 'すべて既読にする', 'notif.all': 'すべて', 'notif.unread': '未読', 'notif.unread_dot': '未読',
    'notif.mention': '{name} さんが {conv} であなたをメンションしました', 'notif.reply': '{name} さんが {conv} のスレッドに返信しました', 'notif.empty_title': 'すべて確認済みです', 'notif.empty_text': 'メンションとスレッドの返信がここに表示されます。', 'notif.marked': 'すべて既読にしました',
    'profile.title': 'プロフィールと設定', 'profile.name': '表示名', 'profile.status': 'ステータス', 'profile.active': 'オンライン', 'profile.away': '離席中', 'profile.save': 'プロフィールを保存', 'profile.saved': 'プロフィールを保存しました',
    'profile.error.empty': '表示名を入力してください。', 'profile.error.long': '40文字以内にしてください。',
    'settings.language': '言語', 'settings.language_help': 'つるチャットと日付の表示に使う言語です。', 'settings.appearance': '外観', 'settings.theme.system': 'システムに合わせる', 'settings.theme.light': 'ライト', 'settings.theme.dark': 'ダーク',
    'settings.notify': '通知', 'settings.notify_mentions': 'メンションとスレッドの返信を通知する', 'settings.saved': '設定を保存しました',
    'toast.new_in': '{conv} に新着メッセージ',
  },
};

// ---- seed data ----
const MIN = 60e3;
function seed() {
  const now = Date.now();
  let n = 100;
  const m = (by, ago, text, extra = {}) => ({ id: 'm' + (++n), by, ts: now - ago * MIN, text, reactions: {}, replies: [], ...extra });
  const banner = m('rs', 52, { en: 'Who can bring the class banner on Friday?', ja: '金曜日にクラスの旗を持ってこられる人はいますか？' }, {
    reactions: { '👀': ['ka'] },
    replies: [
      m('ka', 44, { en: 'I can, it’s in the art room.', ja: '私が持っていけます。美術室にあります。' }),
      m('km', 40, { en: 'I’ll help carry it.', ja: '運ぶのを手伝います。' }),
    ],
  });
  const worksheet = m('ka', 12, { en: '@Aiko Kato could you bring the worksheet copies?', ja: '@加藤 愛子 さん、ワークシートのコピーを持ってきてもらえますか？' });
  return {
    channels: [
      { id: 'field-trip', topic: { en: 'Plans for Friday’s museum visit', ja: '金曜日の博物館見学の計画' }, members: 28, unread: 0, messages: [
        m('rs', 64, { en: 'The museum confirmed our booking for Friday at 10:00.', ja: '博物館から金曜日10時の予約確認が来ました。' }, { reactions: { '🎉': ['ka', 'mt', 'ak'], '👍': ['km'] } }),
        m('mt', 58, { en: 'We meet at the north gate at 8:40, then take the 8:52 train.', ja: '8時40分に北門に集合して、8時52分の電車に乗ります。' }),
        banner,
        worksheet,
      ] },
      { id: 'homework', topic: { en: 'Questions about this week’s homework', ja: '今週の宿題についての質問' }, members: 31, unread: 3, messages: [
        m('km', 300, { en: 'Is the kanji worksheet due Tuesday or Wednesday?', ja: '漢字のワークシートの締め切りは火曜日ですか、水曜日ですか？' }),
        m('mt', 290, { en: 'Tuesday, before the quiz.', ja: '火曜日、小テストの前です。' }, { reactions: { '👍': ['km', 'rs'] } }),
        m('rs', 120, { en: 'Page 14 question 3 has a typo, it should be 電車.', ja: '14ページの問3は誤植で、「電車」が正しいです。' }),
      ] },
      { id: 'random', topic: { en: 'Anything else', ja: '雑談' }, members: 31, unread: 0, messages: [
        m('mt', 900, { en: 'The cafeteria has melon bread again today.', ja: '今日は食堂にまたメロンパンがあります。' }, { reactions: { '😄': ['rs', 'ka'] } }),
      ] },
    ],
    dms: [
      { id: 'dm-ka', person: 'ka', unread: 1, messages: [m('ka', 30, { en: 'Do you have the museum map? I lost mine.', ja: '博物館の地図、持ってる？なくしちゃった。' })] },
      { id: 'dm-rs', person: 'rs', unread: 0, messages: [m('ak', 600, { en: 'Thanks for organising the trip!', ja: '見学の準備ありがとう！' }), m('rs', 590, { en: 'Happy to. See you Friday.', ja: 'どういたしまして。金曜日に。' })] },
      { id: 'dm-km', person: 'km', unread: 0, messages: [] },
    ],
    notifs: [
      { id: 'n1', kind: 'mention', by: 'ka', conv: 'field-trip', msgId: worksheet.id, ts: now - 12 * MIN, unread: true },
      { id: 'n2', kind: 'reply', by: 'km', conv: 'field-trip', msgId: banner.id, ts: now - 40 * MIN, unread: false },
    ],
    nextId: 500, cur: 'field-trip', drafts: {}, thread: null, mention: null, menu: null, picker: null, editing: null,
    typing: null, presenceOpen: false, q: '', kind: 'all', notifTab: 'all', profile: { name: PEOPLE.ak.en, status: 'active' }, notify: true, ambient: false,
  };
}

// ---- helpers ----
const L = (ctx, v) => (typeof v === 'string' ? v : v[ctx.lang] || v.en);
const pname = (ctx, id) => (id === ME && ctx.s.profile.name !== PEOPLE.ak.en ? ctx.s.profile.name : PEOPLE[id][ctx.lang] || PEOPLE[id].en);
const conv = (s, id) => s.channels.find((c) => c.id === id) || s.dms.find((d) => d.id === id);
const convName = (ctx, c) => (c.person ? pname(ctx, c.person) : '#' + c.id);
const isOnline = (s, id) => (id === ME ? s.profile.status === 'active' : PEOPLE[id].online);
const time = (ctx, ts) => new Intl.DateTimeFormat(ctx.lang === 'ja' ? 'ja-JP' : 'en-GB', { hour: '2-digit', minute: '2-digit' }).format(new Date(ts));
const findMsg = (s, id) => {
  for (const c of [...s.channels, ...s.dms]) {
    for (const m of c.messages) { if (m.id === id) return { c, m, list: c.messages }; const r = m.replies.find((x) => x.id === id); if (r) return { c, m: r, list: m.replies, parent: m }; }
  }
  return null;
};
function av(ctx, id, size = '', badge = false) {
  const p = PEOPLE[id];
  return html`<span class="avatar" ${raw(size ? `data-size="${size}"` : '')}><span class="bg-muted">${p.ini}</span>${badge ? html`<span class="avatar-badge ${isOnline(ctx.s, id) ? 'bg-green-600' : 'bg-muted-foreground'} ring-sidebar" aria-label="${ctx.t(isOnline(ctx.s, id) ? 'chat.online' : 'chat.away')}"></span>` : ''}</span>`;
}
/** Message text with @mentions drawn as badges (yours as primary). */
function rich(ctx, text) {
  let out = esc(L(ctx, text));
  const names = [];
  for (const [id, p] of Object.entries(PEOPLE)) for (const n of new Set([p.en, p.ja, id === ME ? ctx.s.profile.name : null])) if (n) names.push([id, n]);
  names.sort((a, b) => b[1].length - a[1].length);
  for (const [id, n] of names) {
    const tok = '@' + esc(n);
    out = out.split(tok).join(`<a class="badge" data-variant="${id === ME ? 'primary' : 'secondary'}" href="#">@${esc(pname(ctx, id))}</a>`);
  }
  return raw(out.replace(/\n/g, '<br>'));
}

// ---- timers (typing, simulated replies); cleared on unmount ----
let timers = [];
const later = (ms, fn) => { const t = setTimeout(() => { timers = timers.filter((x) => x !== t); fn(); }, ms); timers.push(t); };

function simulateReply(ctx, convId, sentText, parentId) {
  const c = conv(ctx.s, convId);
  const text = L(ctx, sentText);
  let who = c.person || Object.keys(PEOPLE).find((id) => id !== ME && PEOPLE[id].online && (text.includes('@' + PEOPLE[id].en) || text.includes('@' + PEOPLE[id].ja)));
  if (!who) { const pool = ['rs', 'ka', 'mt']; who = pool[Math.floor(Math.random() * pool.length)]; }
  later(900, () => { ctx.s.typing = { conv: convId, who, thread: parentId || null }; ctx.rerender(); });
  later(3200, () => {
    ctx.s.typing = null;
    const msg = { id: 'm' + (++ctx.s.nextId), by: who, ts: Date.now(), text: REPLIES[ctx.s.nextId % REPLIES.length], reactions: {}, replies: [] };
    if (parentId) {
      const p = findMsg(ctx.s, parentId);
      if (p) {
        p.m.replies.push(msg);
        if (p.m.by === ME) ctx.s.notifs.unshift({ id: 'n' + ctx.s.nextId, kind: 'reply', by: who, conv: convId, msgId: parentId, ts: Date.now(), unread: true });
      }
    } else {
      c.messages.push(msg);
      if (!viewing(ctx, convId)) { c.unread = (c.unread || 0) + 1; ctx.toast({ category: 'info', title: ctx.t('toast.new_in', { conv: convName(ctx, c) }), description: L(ctx, msg.text) }); }
    }
    ctx.rerender();
  });
}
const viewing = (ctx, id) => ctx.s.cur === id && (ctx.s.route === 'channel' || (ctx.device === 'desktop' && ctx.s.route === 'home'));

// ---- the message list (Channels) with Reactions, Threads summary and per-message actions ----
function reactions(ctx, m, scope) {
  const entries = Object.entries(m.reactions).filter(([, who]) => who.length);
  return html`<div data-block="Reactions" class="relative mt-1 flex flex-wrap items-center gap-1" role="group" aria-label="${ctx.t('react.label')}">
    ${entries.map(([e, who]) => {
      const mine = who.includes(ME);
      const names = who.map((id) => pname(ctx, id)).join(', ');
      return html`<button class="btn h-7 gap-1 rounded-full px-2" data-variant="${mine ? 'secondary' : 'outline'}" type="button" aria-pressed="${mine}" data-tooltip="${names}"
        aria-label="${ctx.t(mine ? 'react.yours' : 'react.others', { emoji: e, n: who.length })}" data-action="react" data-msg="${m.id}" data-emoji="${e}"><span aria-hidden="true">${e}</span><span class="text-xs tabular-nums ${mine ? 'font-semibold' : ''}">${who.length}</span></button>`;
    })}
    <button class="btn h-7 rounded-full" data-variant="ghost" data-size="icon-sm" type="button" aria-label="${ctx.t('react.add')}" aria-haspopup="dialog" aria-expanded="${ctx.s.picker === m.id + scope}" data-action="picker" data-msg="${m.id}" data-scope="${scope}">${icon('smile', 'size-4')}</button>
    ${ctx.s.picker === m.id + scope ? html`<div class="absolute left-0 top-full z-20 mt-1 rounded-md border bg-popover p-2 text-popover-foreground shadow-md" role="dialog" aria-label="${ctx.t('react.choose')}">
      <div class="grid grid-cols-6 gap-1">${EMOJI.map(([e, k]) => html`<button class="btn" data-variant="ghost" data-size="icon" type="button" aria-label="${ctx.t(k)}" data-action="react" data-msg="${m.id}" data-emoji="${e}">${e}</button>`)}</div></div>` : ''}
  </div>`;
}

function message(ctx, m, c, scope = 'main') {
  const own = m.by === ME;
  const editing = ctx.s.editing === m.id;
  const menuOpen = ctx.s.menu === m.id + scope;
  const hl = ctx.s.highlight === m.id;
  const last = m.replies[m.replies.length - 1];
  return html`<li id="msg-${scope}-${m.id}" class="group relative grid grid-cols-[auto_1fr] gap-x-3 rounded-md px-2 py-1.5 hover:bg-muted/50 @max-3xl:pr-11 ${hl ? 'bg-accent' : ''}">
    ${av(ctx, m.by)}
    <div class="min-w-0">
      <p class="text-sm"><b>${pname(ctx, m.by)}</b> <time class="text-muted-foreground text-xs" datetime="${new Date(m.ts).toISOString()}">${time(ctx, m.ts)}</time>${m.edited ? html` <span class="text-muted-foreground text-xs">${ctx.t('chat.edited')}</span>` : ''}</p>
      ${editing ? html`<form class="mt-1 grid gap-2" data-submit="saveEdit"><label class="sr-only" for="edit-${m.id}">${ctx.t('chat.edit_label')}</label>
          <textarea class="textarea min-h-16" id="edit-${m.id}" name="text" data-keydown="editKey">${L(ctx, m.text)}</textarea>
          <div class="flex gap-2"><button class="btn" data-size="sm" type="submit">${ctx.t('chat.save')}</button><button class="btn" data-variant="outline" data-size="sm" type="button" data-action="cancelEdit">${ctx.t('chat.cancel')}</button></div></form>`
        : html`<p class="break-words">${rich(ctx, m.text)}</p>`}
      ${Object.values(m.reactions).some((w) => w.length) || ctx.s.picker === m.id + scope ? reactions(ctx, m, scope) : ''}
      ${scope === 'main' && m.replies.length ? html`<button data-block="Threads" class="btn mt-1 h-auto gap-2 px-2 py-1" data-variant="ghost" type="button" aria-controls="thread" aria-expanded="${ctx.s.thread === m.id}" data-action="openThread" data-msg="${m.id}">
          <span class="avatar-group">${[...new Set(m.replies.map((r) => r.by))].slice(0, 3).map((id) => av(ctx, id, 'sm'))}</span>
          <span class="text-sm font-medium text-primary underline-offset-4 hover:underline">${m.replies.length === 1 ? ctx.t('thread.reply_one') : ctx.t('thread.replies', { n: m.replies.length })}</span>
          <span class="text-muted-foreground text-xs">${ctx.t('thread.last', { time: time(ctx, last.ts) })}</span></button>` : ''}
    </div>
    ${editing ? '' : html`<div class="absolute right-2 top-1 flex gap-0.5 rounded-md border bg-background p-0.5 opacity-0 shadow-sm group-hover:opacity-100 focus-within:opacity-100 @max-3xl:right-0 @max-3xl:bg-transparent @max-3xl:p-0 @max-3xl:opacity-100 @max-3xl:border-0 @max-3xl:shadow-none ${menuOpen ? 'opacity-100' : ''}">
      <button class="btn @max-3xl:hidden" data-variant="ghost" data-size="icon-sm" type="button" aria-label="${ctx.t('react.add')}" data-action="picker" data-msg="${m.id}" data-scope="${scope}">${icon('smile', 'size-4')}</button>
      ${scope === 'main' ? html`<button class="btn @max-3xl:hidden" data-variant="ghost" data-size="icon-sm" type="button" aria-label="${ctx.t('chat.reply_thread')}" data-action="openThread" data-msg="${m.id}">${icon('message', 'size-4')}</button>` : ''}
      <button class="btn" data-variant="ghost" data-size="icon-sm" type="button" aria-label="${ctx.t('chat.more')}" aria-haspopup="menu" aria-expanded="${menuOpen}" data-action="menu" data-msg="${m.id}" data-scope="${scope}">${icon('more', 'size-4')}</button>
    </div>`}
    ${menuOpen ? html`<div class="absolute right-2 top-9 z-30 grid min-w-44 @max-3xl:top-12 rounded-md border bg-popover p-1 text-sm text-popover-foreground shadow-md" role="menu">
      <button class="flex items-center gap-2 rounded-sm px-2 py-1.5 text-left hover:bg-accent @max-3xl:min-h-11" role="menuitem" type="button" data-action="picker" data-msg="${m.id}" data-scope="${scope}">${icon('smile', 'size-4')}${ctx.t('chat.react')}</button>
      ${scope === 'main' ? html`<button class="flex items-center gap-2 rounded-sm px-2 py-1.5 text-left hover:bg-accent @max-3xl:min-h-11" role="menuitem" type="button" data-action="openThread" data-msg="${m.id}">${icon('message', 'size-4')}${ctx.t('chat.reply_thread')}</button>` : ''}
      ${own ? html`<button class="flex items-center gap-2 rounded-sm px-2 py-1.5 text-left hover:bg-accent @max-3xl:min-h-11" role="menuitem" type="button" data-action="edit" data-msg="${m.id}">${icon('edit', 'size-4')}${ctx.t('chat.edit')}</button>
      <div role="separator" class="-mx-1 my-1 h-px bg-border"></div>
      <button class="flex items-center gap-2 rounded-sm px-2 py-1.5 text-left text-destructive hover:bg-accent @max-3xl:min-h-11" role="menuitem" type="button" data-action="del" data-msg="${m.id}">${icon('trash', 'size-4')}${ctx.t('chat.delete')}</button>` : ''}
    </div>` : ''}
  </li>`;
}

function mentionPicker(ctx) {
  const mm = ctx.s.mention;
  if (!mm) return '';
  const list = mentionMatches(ctx, mm.q);
  return html`<div data-block="Mentions" class="absolute bottom-full left-3 right-3 z-20 mb-1 max-w-72 rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
    <p class="text-muted-foreground px-2 py-1 text-xs">${ctx.t('mention.people')}</p>
    ${list.length ? html`<ul id="mention-list" role="listbox" aria-label="${ctx.t('mention.list_label')}" class="grid">
      ${list.map((id, i) => html`<li id="mention-${id}" role="option" aria-selected="${i === mm.sel}" data-action="pickMention" data-person="${id}" class="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 ${i === mm.sel ? 'bg-accent' : ''} @max-3xl:min-h-11">
        ${av(ctx, id, 'sm')}<span class="flex-1 truncate">${pname(ctx, id)}</span><span class="text-muted-foreground text-xs">${PEOPLE[id].en.split(' ')[0].toLowerCase()}</span></li>`)}</ul>`
      : html`<p class="px-2 py-1.5 text-sm">${ctx.t('mention.none', { q: mm.q })}</p>`}
    <p class="text-muted-foreground border-t px-2 py-1 text-xs">${ctx.t('mention.hint')}</p>
  </div>`;
}
const mentionMatches = (ctx, q) => Object.keys(PEOPLE).filter((id) => id !== ME).filter((id) => !q || [PEOPLE[id].en, PEOPLE[id].ja, id].some((n) => n.toLowerCase().includes(q.toLowerCase()))).slice(0, 5);

function presence(ctx, c) {
  const ids = c.person ? [c.person, ME] : Object.keys(PEOPLE);
  const here = ids.filter((id) => isOnline(ctx.s, id));
  const names = here.map((id) => pname(ctx, id)).join(', ');
  return html`<div data-block="Presence" class="relative">
    <button class="btn" data-variant="ghost" type="button" aria-haspopup="dialog" aria-expanded="${ctx.s.presenceOpen}" aria-label="${ctx.t('presence.label', { n: here.length, names })}" data-action="presence">
      <span class="avatar-group">${here.slice(0, 4).map((id) => html`<span class="avatar ring-2 ring-[var(--presence)]" data-size="sm" style="--presence: var(--chart-${PEOPLE[id].color})"><span>${PEOPLE[id].ini}</span></span>`)}</span>
      <span class="text-muted-foreground text-sm @max-3xl:hidden">${ctx.t('chat.here', { n: here.length })}</span>
    </button>
    ${ctx.s.presenceOpen ? html`<div class="absolute right-0 top-full z-30 mt-1 w-64 rounded-md border bg-popover p-3 text-popover-foreground shadow-md" role="dialog" aria-label="${ctx.t('presence.here')}">
      <h3 class="text-sm font-medium">${ctx.t('presence.here')}</h3>
      <ul class="mt-2 grid gap-2 text-sm">${ids.map((id) => html`<li class="flex items-center gap-2 ${isOnline(ctx.s, id) ? '' : 'text-muted-foreground'}">
        <span class="avatar ${isOnline(ctx.s, id) ? 'ring-2 ring-[var(--presence)]' : ''}" data-size="sm" style="--presence: var(--chart-${PEOPLE[id].color})"><span>${PEOPLE[id].ini}</span></span>
        <span class="flex-1">${pname(ctx, id)} ${id === ME ? html`<span class="text-muted-foreground">${ctx.t('presence.you')}</span>` : ''}</span>
        ${isOnline(ctx.s, id) ? '' : html`<span class="text-xs">${ctx.t('presence.away')}</span>`}</li>`)}</ul>
      <p class="text-muted-foreground mt-3 flex items-center gap-1 text-xs" role="status"><span class="size-2 rounded-full bg-[var(--chart-3)]" aria-hidden="true"></span>${ctx.t('presence.live')}</p></div>` : ''}
  </div>`;
}

function conversation(ctx, c, phone) {
  const name = convName(ctx, c);
  const typing = ctx.s.typing && ctx.s.typing.conv === c.id && !ctx.s.typing.thread ? ctx.t('chat.typing_one', { name: pname(ctx, ctx.s.typing.who) }) : '';
  const draft = ctx.s.drafts[c.id] || '';
  return html`<section data-block="Channels" class="flex min-h-0 min-w-0 flex-1 flex-col" aria-labelledby="chan-title">
    <header class="flex min-h-14 shrink-0 items-center gap-2 border-b px-3 @3xl:px-4">
      ${phone ? html`<button class="btn" data-variant="ghost" data-size="icon" type="button" aria-label="${ctx.t('chat.back')}" data-go="home">${icon('back')}</button>` : ''}
      ${c.person ? av(ctx, c.person, 'sm', true) : ''}
      <div class="min-w-0 flex-1 @3xl:flex @3xl:items-baseline @3xl:gap-3">
        <h1 id="chan-title" class="truncate font-semibold">${name}</h1>
        ${c.topic ? html`<p class="text-muted-foreground truncate text-xs @3xl:text-sm">${L(ctx, c.topic)}</p>` : html`<p class="text-muted-foreground text-xs @3xl:text-sm">${ctx.t(isOnline(ctx.s, c.person) ? 'chat.online' : 'chat.away')}</p>`}
      </div>
      ${presence(ctx, c)}
    </header>
    ${c.messages.length ? html`<ol id="messages" data-scroll="msgs-${c.id}" class="grid min-h-0 flex-1 content-start gap-1 overflow-y-auto px-2 py-3 @3xl:px-3" aria-label="${name}" aria-live="polite">
        <li role="separator" class="text-muted-foreground flex items-center gap-2 px-2 text-xs"><hr class="flex-1"><span>${ctx.t('chat.today')}</span><hr class="flex-1"></li>
        ${c.messages.map((m) => message(ctx, m, c))}
      </ol>`
      : html`<div class="grid min-h-0 flex-1 place-items-center overflow-y-auto p-6"><div data-block="EmptyState" class="empty"><header><figure>${av(ctx, c.person, 'lg')}</figure><h3>${ctx.t('chat.dm_empty_title', { name })}</h3><p>${ctx.t('chat.dm_empty_text')}</p></header></div></div>`}
    <p id="typing" class="text-muted-foreground h-5 shrink-0 px-4 text-xs" aria-live="polite">${typing}</p>
    <form class="relative shrink-0 border-t p-3" data-submit="send">
      ${mentionPicker(ctx)}
      <div class="flex items-end gap-2">
        <button class="btn" data-variant="ghost" data-size="icon" type="button" aria-label="${ctx.t('chat.attach')}">${icon('plus')}</button>
        <label class="sr-only" for="msg-input">${ctx.t('chat.message_label', { name })}</label>
        <textarea id="msg-input" name="text" class="textarea max-h-36 min-h-10 flex-1 resize-none" rows="1" placeholder="${ctx.t('chat.placeholder', { name })}"
          aria-autocomplete="list" aria-controls="mention-list" aria-expanded="${!!ctx.s.mention}" data-input="draft" data-keydown="composerKey">${draft}</textarea>
        <button class="btn" type="submit" ${raw(draft.trim() ? '' : 'disabled')}>${icon('send')}<span class="@max-3xl:sr-only">${ctx.t('chat.send')}</span></button>
      </div>
      <p class="text-muted-foreground mt-1.5 text-xs @max-3xl:hidden">${ctx.t('chat.send_hint')}</p>
    </form>
  </section>`;
}

function threadPanel(ctx, phone) {
  const f = findMsg(ctx.s, ctx.s.thread);
  if (!f) return '';
  const { c, m } = f;
  const typing = ctx.s.typing && ctx.s.typing.thread === m.id ? ctx.t('chat.typing_one', { name: pname(ctx, ctx.s.typing.who) }) : '';
  return html`<aside id="thread" data-block="Threads" class="flex min-h-0 flex-1 flex-col bg-background @3xl:w-96 @3xl:flex-none @3xl:border-l" aria-labelledby="thread-title">
    <header class="flex min-h-14 shrink-0 items-center gap-2 border-b px-3 @3xl:px-4">
      ${phone ? html`<button class="btn" data-variant="ghost" data-size="icon" type="button" aria-label="${ctx.t('chat.back')}" data-action="closeThread">${icon('back')}</button>` : ''}
      <div class="flex-1"><h2 id="thread-title" class="font-semibold">${ctx.t('thread.title')}</h2><p class="text-muted-foreground text-xs">${convName(ctx, c)}</p></div>
      ${phone ? '' : html`<button class="btn" data-variant="ghost" data-size="icon" type="button" aria-label="${ctx.t('thread.close')}" data-action="closeThread">${icon('x')}</button>`}
    </header>
    <ol class="grid min-h-0 flex-1 content-start gap-1 overflow-y-auto px-2 py-3" data-scroll="thread" aria-label="${ctx.t('thread.title')}">
      ${message(ctx, m, c, 'thread')}
      <li role="separator" class="text-muted-foreground flex items-center gap-2 px-2 text-xs"><hr class="flex-1"><span>${m.replies.length ? ctx.t('thread.count', { n: m.replies.length }) : ctx.t('thread.none')}</span><hr class="flex-1"></li>
      ${m.replies.map((r) => message(ctx, r, c, 'thread'))}
    </ol>
    <p class="text-muted-foreground h-5 shrink-0 px-4 text-xs" aria-live="polite">${typing}</p>
    <form class="grid shrink-0 gap-2 border-t p-3" data-submit="reply">
      <label class="sr-only" for="reply-input">${ctx.t('thread.reply_label')}</label>
      <textarea id="reply-input" name="text" class="textarea min-h-16" rows="2" placeholder="${ctx.t('thread.placeholder')}" data-input="replyDraft" data-keydown="replyKey">${ctx.s.replyDraft || ''}</textarea>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <label class="label gap-2 text-sm font-normal"><input class="input" type="checkbox" name="also">${ctx.t('thread.also_send', { conv: convName(ctx, c) })}</label>
        <button class="btn" data-size="sm" type="submit">${ctx.t('thread.send')}</button>
      </div>
    </form>
  </aside>`;
}

// ---- shell ----
const unreadNotifs = (s) => s.notifs.filter((n) => n.unread).length;
function convLists(ctx, phone) {
  const s = ctx.s;
  const row = (c) => {
    const active = !phone && c.id === s.cur && (s.route === 'home' || s.route === 'channel');
    const cls = phone ? 'min-h-12 px-3' : 'px-2 py-1.5';
    return html`<li><a href="#" data-action="openConv" data-conv="${c.id}" ${raw(active ? 'aria-current="page"' : '')}
      class="flex items-center gap-2 rounded-md ${cls} hover:bg-sidebar-accent aria-[current=page]:bg-sidebar-accent aria-[current=page]:font-medium ${c.unread ? 'font-semibold' : 'text-muted-foreground'}">
      ${c.person ? av(ctx, c.person, 'sm', true) : html`<span aria-hidden="true" class="w-6 text-center">#</span>`}
      <span class="truncate">${c.person ? pname(ctx, c.person) : c.id}</span>
      ${c.unread ? html`<span class="badge ml-auto" aria-label="${ctx.t('chat.unread', { n: c.unread })}">${c.unread}</span>` : ''}</a></li>`;
  };
  return html`<nav data-block="Channels" aria-label="${ctx.t('chat.channels')}" class="grid gap-1">
    <h3 class="text-muted-foreground px-3 pt-2 text-xs font-medium" id="ch-label">${ctx.t('chat.channels')}</h3>
    <ul class="grid gap-0.5 px-2" aria-labelledby="ch-label">${s.channels.map(row)}</ul>
    <h3 class="text-muted-foreground px-3 pt-3 text-xs font-medium" id="dm-label">${ctx.t('chat.dms')}</h3>
    <ul class="grid gap-0.5 px-2" aria-labelledby="dm-label">${s.dms.map(row)}</ul>
  </nav>`;
}
function sidePanel(ctx) {
  const s = ctx.s;
  const item = (r, i, k, badge) => html`<a href="#" data-go="${r}" ${raw(s.route === r ? 'aria-current="page"' : '')} class="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-sidebar-accent aria-[current=page]:bg-sidebar-accent aria-[current=page]:font-medium">${icon(i, 'size-4')}<span>${ctx.t(k)}</span>${badge ? html`<span class="badge ml-auto">${badge}</span>` : ''}</a>`;
  return html`<aside data-block="SidePanel" class="hidden w-64 shrink-0 flex-col gap-2 overflow-y-auto border-r bg-sidebar py-3 text-sm text-sidebar-foreground @3xl:flex" aria-label="${ctx.t('nav.main')}">
    <p class="flex items-center gap-2 px-4 pb-1 font-semibold"><span class="grid size-7 place-items-center rounded-md bg-primary text-xs text-primary-foreground">3B</span>${ctx.t('ws.name')}</p>
    <nav class="grid gap-0.5 px-2">${item('activity', 'bell', 'nav.activity', unreadNotifs(s))}${item('search', 'search', 'nav.search')}${item('settings', 'user', 'nav.you')}</nav>
    ${convLists(ctx, false)}
    <div class="px-2 pt-1"><button class="btn w-full justify-start" data-variant="ghost" type="button" data-action="newChannel">${icon('plus')}${ctx.t('chat.new_channel')}</button></div>
  </aside>`;
}
function bottomBar(ctx) {
  const tabs = [['home', 'home', 'nav.home'], ['activity', 'bell', 'nav.activity'], ['search', 'search', 'nav.search'], ['settings', 'user', 'nav.you']];
  return html`<nav data-block="BottomBar" class="grid shrink-0 grid-cols-4 border-t bg-background @3xl:hidden" aria-label="${ctx.t('nav.main')}">
    ${tabs.map(([r, i, k]) => html`<a href="#" data-go="${r}" ${raw(ctx.s.route === r ? 'aria-current="page"' : '')} class="relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] text-muted-foreground aria-[current=page]:font-medium aria-[current=page]:text-foreground">
      ${icon(i, 'size-5')}<span>${ctx.t(k)}</span>${r === 'activity' && unreadNotifs(ctx.s) ? html`<span class="badge absolute right-[calc(50%-22px)] top-1.5 h-4 min-w-4 px-1 text-[10px]">${unreadNotifs(ctx.s)}</span>` : ''}</a>`)}
  </nav>`;
}
function topBar(ctx, title, extra = '') {
  return html`<header data-block="TopBar" class="flex h-14 shrink-0 items-center gap-2 border-b px-4 @3xl:hidden"><h1 class="flex-1 truncate text-base font-semibold">${title}</h1>${extra}</header>`;
}
function layout(ctx, body, { phoneChrome = true, title } = {}) {
  return html`<div class="flex h-full flex-col @3xl:flex-row">
    ${sidePanel(ctx)}
    <div class="flex min-h-0 min-w-0 flex-1 flex-col">
      ${phoneChrome ? topBar(ctx, title || ctx.t('app.name')) : ''}
      <div class="flex min-h-0 flex-1">${body}</div>
      ${phoneChrome ? bottomBar(ctx) : ''}
    </div>
  </div>`;
}

// ---- screens ----
function home(ctx) {
  const c = conv(ctx.s, ctx.s.cur);
  // the phone shows the list; the desktop shows the current conversation (and its thread)
  if (ctx.device === 'phone') {
    return layout(ctx, html`<div class="min-h-0 flex-1 overflow-y-auto py-2" data-scroll="home">${convLists(ctx, true)}
      <div class="px-2 pt-3"><button class="btn w-full" data-variant="outline" type="button" data-action="newChannel">${icon('plus')}${ctx.t('chat.new_channel')}</button></div></div>`, { title: ctx.t('ws.name') });
  }
  return layout(ctx, html`${conversation(ctx, c, false)}${ctx.s.thread ? threadPanel(ctx, false) : ''}`, { phoneChrome: false });
}
function channelScreen(ctx) {
  const c = conv(ctx.s, ctx.s.cur);
  if (ctx.device !== 'phone') return home(ctx);
  return layout(ctx, conversation(ctx, c, true), { phoneChrome: false });
}
function threadScreen(ctx) {
  if (ctx.device !== 'phone') return home(ctx);
  return layout(ctx, threadPanel(ctx, true), { phoneChrome: false });
}

function allHits(ctx) {
  const q = ctx.s.q.trim().toLowerCase();
  if (!q) return { messages: [], channels: [], people: [] };
  const messages = [];
  for (const c of [...ctx.s.channels, ...ctx.s.dms]) for (const m of c.messages) {
    for (const x of [m, ...m.replies]) if (L(ctx, x.text).toLowerCase().includes(q) || pname(ctx, x.by).toLowerCase().includes(q)) messages.push({ c, m: x, parent: x === m ? null : m });
  }
  const channels = ctx.s.channels.filter((c) => c.id.includes(q) || L(ctx, c.topic).toLowerCase().includes(q));
  const people = Object.keys(PEOPLE).filter((id) => [PEOPLE[id].en, PEOPLE[id].ja].some((n) => n.toLowerCase().includes(q)));
  return { messages, channels, people };
}
function mark(ctx, text) {
  const q = ctx.s.q.trim();
  const t = L(ctx, text);
  if (!q) return t;
  const i = t.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return t;
  return html`${t.slice(0, i)}<mark class="rounded-sm bg-yellow-200 px-0.5 text-foreground dark:bg-yellow-500/40">${t.slice(i, i + q.length)}</mark>${t.slice(i + q.length)}`;
}
function search(ctx) {
  const s = ctx.s;
  const hits = allHits(ctx);
  const total = hits.messages.length + hits.channels.length + hits.people.length;
  const show = (k) => s.kind === 'all' || s.kind === k;
  const kinds = [['all', 'search.all', total], ['messages', 'search.messages', hits.messages.length], ['channels', 'search.channels', hits.channels.length], ['people', 'search.people', hits.people.length]];
  const shown = kinds.find(([k]) => k === s.kind)[2];
  const group = (k, title, rows) => (show(k) && rows.length ? html`<section class="grid gap-2" aria-labelledby="res-${k}"><h2 id="res-${k}" class="text-muted-foreground text-xs font-medium uppercase tracking-wide">${ctx.t(title)}</h2><div class="item-group gap-1">${rows}</div></section>` : '');
  const body = html`<section data-block="GlobalSearch" class="mx-auto grid w-full max-w-3xl content-start gap-4 p-4 @3xl:p-8" aria-labelledby="search-title">
    <h1 id="search-title" class="text-2xl font-semibold @max-3xl:sr-only">${ctx.t('search.title')}</h1>
    <form role="search" data-submit="noop">
      <div class="input-group h-11 rounded-lg border">
        <span data-align="inline-start" aria-hidden="true">${icon('search', 'size-4')}</span>
        <input id="search-q" type="search" name="q" value="${s.q}" aria-label="${ctx.t('search.label')}" placeholder="${ctx.t('search.hint')}" autocomplete="off" data-input="q">
      </div>
      ${s.q.trim() ? html`<nav class="mt-3 flex flex-wrap gap-1" aria-label="${ctx.t('search.all')}">${kinds.map(([k, label, n]) => html`<button class="btn" data-variant="${s.kind === k ? 'secondary' : 'ghost'}" data-size="sm" type="button" ${raw(s.kind === k ? 'aria-current="page"' : '')} data-action="kind" data-kind="${k}"><span>${ctx.t(label)}</span> <span class="tabular-nums">${n}</span></button>`)}</nav>` : ''}
    </form>
    ${!s.q.trim() ? html`<div data-block="EmptyState" class="empty rounded-lg border border-dashed"><header><figure>${icon('search')}</figure><h3>${ctx.t('search.start')}</h3><p>${ctx.t('search.start_text')}</p></header></div>`
      : !shown ? html`<div data-block="EmptyState" class="empty rounded-lg border border-dashed"><header><figure>${icon('search')}</figure><h3>${ctx.t('search.none_title', { q: s.q })}</h3><p>${ctx.t('search.none_text')}</p></header>${s.kind !== 'all' ? html`<footer class="flex-row"><button class="btn" data-variant="outline" type="button" data-action="kind" data-kind="all">${ctx.t('search.all')}</button></footer>` : ''}</div>`
      : html`<p id="search-status" role="status" class="text-muted-foreground text-sm">${shown === 1 ? ctx.t('search.count_one', { q: s.q }) : ctx.t('search.count', { n: shown, q: s.q })}</p>
      <div class="grid gap-6">
        ${group('messages', 'search.messages', hits.messages.map(({ c, m, parent }) => html`<a class="item gap-3 rounded-md border-transparent px-3 py-2" href="#" data-action="jump" data-conv="${c.id}" data-msg="${m.id}" data-parent="${parent ? parent.id : ''}">
          <figure>${av(ctx, m.by, 'sm')}</figure><section><h3 class="text-sm font-medium">${pname(ctx, m.by)}</h3><p class="text-sm">${mark(ctx, m.text)}</p></section>
          <aside class="text-muted-foreground text-xs">${ctx.t('search.in', { conv: convName(ctx, c) })} · ${time(ctx, m.ts)}</aside></a>`))}
        ${group('channels', 'search.channels', hits.channels.map((c) => html`<a class="item gap-3 rounded-md border-transparent px-3 py-2" href="#" data-action="openConv" data-conv="${c.id}">
          <figure class="text-muted-foreground" aria-hidden="true">#</figure><section><h3 class="text-sm font-medium">#${c.id}</h3><p class="text-sm">${mark(ctx, c.topic)}</p></section><aside class="text-muted-foreground text-xs">${ctx.t('chat.members', { n: c.members })}</aside></a>`))}
        ${group('people', 'search.people', hits.people.map((id) => html`<a class="item gap-3 rounded-md border-transparent px-3 py-2" href="#" data-action="openDm" data-person="${id}">
          <figure>${av(ctx, id, 'sm', true)}</figure><section><h3 class="text-sm font-medium">${pname(ctx, id)}</h3><p class="text-sm">${ctx.t(isOnline(ctx.s, id) ? 'chat.online' : 'chat.away')}</p></section></a>`))}
      </div>`}
  </section>`;
  return layout(ctx, html`<div class="min-h-0 flex-1 overflow-y-auto" data-scroll="search">${body}</div>`, { title: ctx.t('search.title') });
}

function activity(ctx) {
  const s = ctx.s;
  const list = s.notifs.filter((n) => s.notifTab === 'all' || n.unread);
  const unread = unreadNotifs(s);
  const body = html`<section data-block="Notifications" class="mx-auto grid w-full max-w-3xl content-start gap-4 p-4 @3xl:p-8" aria-labelledby="notif-title">
    <header class="flex flex-wrap items-center justify-between gap-2">
      <h1 id="notif-title" class="text-xl font-semibold @3xl:text-2xl">${ctx.t('notif.title')}</h1>
      <button class="btn" data-variant="outline" data-size="sm" type="button" data-action="markAll" ${raw(unread ? '' : 'disabled')}>${ctx.t('notif.mark_all')}</button>
    </header>
    <div class="tabs"><nav role="tablist" aria-orientation="horizontal">
      <button type="button" role="tab" id="nt-tab-all" aria-controls="notif-list" aria-selected="${s.notifTab === 'all'}" data-action="notifTab" data-tab="all">${ctx.t('notif.all')}</button>
      <button type="button" role="tab" id="nt-tab-unread" aria-controls="notif-list" aria-selected="${s.notifTab === 'unread'}" data-action="notifTab" data-tab="unread"><span>${ctx.t('notif.unread')}</span> ${unread ? html`<span class="badge" data-variant="secondary">${unread}</span>` : ''}</button>
    </nav></div>
    ${list.length ? html`<ol id="notif-list" class="grid gap-1" role="tabpanel">${list.map((n) => {
      const c = conv(s, n.conv); const f = findMsg(s, n.msgId);
      return html`<li><a class="item" href="#" data-action="openNotif" data-id="${n.id}" ${raw(n.unread ? 'data-unread="true"' : '')}>
        <figure>${av(ctx, n.by)}</figure>
        <section><h3 class="${n.unread ? 'font-semibold' : ''}"><span class="block">${ctx.t('notif.' + n.kind, { name: pname(ctx, n.by), conv: convName(ctx, c) })}</span></h3>
          <p class="line-clamp-1">${f ? L(ctx, f.m.text) : ''}</p><p><time datetime="${new Date(n.ts).toISOString()}">${time(ctx, n.ts)}</time></p></section>
        ${n.unread ? html`<aside><span class="size-2 rounded-full bg-primary" role="img" aria-label="${ctx.t('notif.unread_dot')}"></span></aside>` : ''}</a></li>`;
    })}</ol>`
      : html`<div data-block="EmptyState" class="empty rounded-lg border border-dashed"><header><figure>${icon('bell')}</figure><h3>${ctx.t('notif.empty_title')}</h3><p>${ctx.t('notif.empty_text')}</p></header></div>`}
  </section>`;
  return layout(ctx, html`<div class="min-h-0 flex-1 overflow-y-auto" data-scroll="activity">${body}</div>`, { title: ctx.t('notif.title') });
}

function settings(ctx) {
  const s = ctx.s;
  const e = s.profileErr;
  const radio = (name, v, label, on, change = name) => html`<label class="label gap-3 font-normal"><input class="input" type="radio" name="${name}" value="${v}" data-change="${change}" ${raw(on ? 'checked' : '')}><span ${raw(v === 'ja' ? 'lang="ja"' : '')}>${label}</span></label>`;
  const body = html`<div class="mx-auto grid w-full max-w-2xl content-start gap-8 p-4 @3xl:p-8">
    <h1 class="text-2xl font-semibold @max-3xl:sr-only">${ctx.t('profile.title')}</h1>
    <form data-block="Profile" class="card" data-submit="saveProfile" novalidate>
      <header class="flex-row items-center gap-3"><span class="avatar" data-size="lg"><span class="bg-muted">AK</span><span class="avatar-badge ${s.profile.status === 'active' ? 'bg-green-600' : 'bg-muted-foreground'} ring-card"></span></span>
        <div><h2 class="font-semibold">${pname(ctx, ME)}</h2><p class="text-muted-foreground text-sm">aiko@example.com</p></div></header>
      <section class="grid gap-4">
        <div class="field"><label class="label" for="pf-name">${ctx.t('profile.name')}</label>
          <input class="input" id="pf-name" name="name" value="${s.profileDraft ?? s.profile.name}" maxlength="60" ${raw(e ? 'aria-invalid="true" aria-describedby="pf-name-err"' : '')}>
          ${e ? html`<p class="text-destructive text-sm" id="pf-name-err">${ctx.t(e)}</p>` : ''}</div>
        <fieldset class="fieldset grid gap-2"><legend class="label">${ctx.t('profile.status')}</legend>
          ${radio('status', 'active', ctx.t('profile.active'), s.profile.status === 'active', 'noopChange')}${radio('status', 'away', ctx.t('profile.away'), s.profile.status === 'away', 'noopChange')}</fieldset>
      </section>
      <footer><button class="btn" type="submit">${ctx.t('profile.save')}</button></footer>
    </form>
    <section data-block="SettingsPage" class="grid gap-6">
      <fieldset class="fieldset grid gap-3"><legend class="text-base font-semibold">${ctx.t('settings.language')}</legend>
        <p class="text-sm text-muted-foreground">${ctx.t('settings.language_help')}</p>
        ${radio('lang', 'en', 'English', ctx.lang === 'en')}${radio('lang', 'ja', '日本語', ctx.lang === 'ja')}</fieldset>
      <fieldset class="fieldset grid gap-3"><legend class="text-base font-semibold">${ctx.t('settings.appearance')}</legend>
        ${radio('theme', 'system', ctx.t('settings.theme.system'), ctx.theme === 'system')}${radio('theme', 'light', ctx.t('settings.theme.light'), ctx.theme === 'light')}${radio('theme', 'dark', ctx.t('settings.theme.dark'), ctx.theme === 'dark')}</fieldset>
      <fieldset class="fieldset grid gap-3"><legend class="text-base font-semibold">${ctx.t('settings.notify')}</legend>
        <label class="label gap-3 font-normal"><input class="input" type="checkbox" role="switch" data-change="notify" ${raw(s.notify ? 'checked' : '')}>${ctx.t('settings.notify_mentions')}</label></fieldset>
    </section>
  </div>`;
  return layout(ctx, html`<div class="min-h-0 flex-1 overflow-y-auto" data-scroll="settings">${body}</div>`, { title: ctx.t('profile.title') });
}

// ---- actions ----
function send(ctx, convId, text, parentId = null, also = false) {
  const s = ctx.s;
  const c = conv(s, convId);
  const msg = { id: 'm' + (++s.nextId), by: ME, ts: Date.now(), text, reactions: {}, replies: [] };
  if (parentId) {
    findMsg(s, parentId).m.replies.push(msg);
    if (also) c.messages.push({ ...msg, id: 'm' + (++s.nextId) });
  } else c.messages.push(msg);
  simulateReply(ctx, convId, text, parentId);
  setTimeout(() => { const ol = document.querySelector(parentId ? '#stage [data-scroll="thread"]' : '#stage #messages'); if (ol) ol.scrollTop = ol.scrollHeight; }, 0);
}
function openConv(ctx, id) {
  const s = ctx.s;
  s.cur = id; s.thread = null; s.mention = null; s.menu = null; s.picker = null; s.presenceOpen = false; s.highlight = null;
  const c = conv(s, id); c.unread = 0;
  ctx.go(ctx.device === 'phone' ? 'channel' : 'home');
}
function insertMention(ctx, id) {
  const s = ctx.s;
  const el = document.getElementById('msg-input');
  const text = s.drafts[s.cur] || '';
  const caret = el ? el.selectionStart : text.length;
  const before = text.slice(0, caret).replace(/@([^\s@]*)$/, '@' + pname(ctx, id) + ' ');
  s.drafts[s.cur] = before + text.slice(caret);
  s.mention = null;
  s.caretTo = before.length;
}
const closeMenus = (s) => { s.menu = null; s.picker = null; s.presenceOpen = false; };

export default {
  id: 'chat', icon: 'message', host: 'tsuru.chat.local', archetype: 'AppChat', start: 'home',
  name: { en: 'Tsuru Chat', ja: 'つるチャット' }, short: { en: 'Chat', ja: 'チャット' },
  about: { en: 'A team chat: channels and direct messages with presence, mentions, reactions, threads, editing with undo, search across everything and an activity inbox.', ja: 'チームチャット。オンライン表示、メンション、リアクション、スレッド、元に戻せる削除、全体検索、アクティビティがあるチャンネルとダイレクトメッセージ。' },
  try: { en: 'Type “@ka” in #field-trip and press Return to mention Kana, send it and watch her type a reply. Open the banner thread and reply. React with 🎉, edit or delete your own message with ⋯, search “museum”.', ja: '#field-trip で「@ka」と入力して Return で阿部さんをメンションし、送信すると返信が届きます。旗のスレッドを開いて返信、🎉でリアクション、⋯ から自分のメッセージを編集・削除、「博物館」を検索してみてください。' },
  messages: M,
  init: seed,
  render(ctx) {
    const r = ctx.s.route;
    if (r === 'channel') return channelScreen(ctx);
    if (r === 'thread') return threadScreen(ctx);
    if (r === 'search') return search(ctx);
    if (r === 'activity') return activity(ctx);
    if (r === 'settings') return settings(ctx);
    return home(ctx);
  },
  mount(ctx, root) {
    const s = ctx.s;
    if (s.caretTo != null) { const el = document.getElementById('msg-input'); if (el) { el.focus(); el.setSelectionRange(s.caretTo, s.caretTo); } s.caretTo = null; }
    if (s.scrollToEnd) { const ol = root.querySelector('#messages'); if (ol) ol.scrollTop = ol.scrollHeight; s.scrollToEnd = false; }
    if (s.highlight) { const el = root.querySelector(`[id$="-${s.highlight}"]`); if (el) el.scrollIntoView({ block: 'center' }); }
    const ta = root.querySelector('#msg-input'); if (ta) { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight + 2, 144) + 'px'; }
    if (!s.ambient) {
      s.ambient = true;
      later(9000, () => {
        const hw = conv(s, 'homework');
        const m = { id: 'm' + (++s.nextId), by: 'mt', ts: Date.now(), text: { en: '@Aiko Kato can you post the worksheet answers when you’re back?', ja: '@加藤 愛子 さん、戻ったらワークシートの答えを投稿してもらえますか？' }, reactions: {}, replies: [] };
        hw.messages.push(m);
        if (!viewing(ctx, 'homework')) hw.unread += 1;
        if (s.notify) s.notifs.unshift({ id: 'n' + s.nextId, kind: 'mention', by: 'mt', conv: 'homework', msgId: m.id, ts: Date.now(), unread: true });
        ctx.rerender();
      });
    }
  },
  unmount(ctx) { timers.forEach(clearTimeout); timers = []; ctx.s.typing = null; ctx.s.ambient = false; },
  actions: {
    noop: () => false,
    noopChange: () => false,
    openConv(ctx, el) { openConv(ctx, el.dataset.conv); return false; },
    openDm(ctx, el) { const d = ctx.s.dms.find((x) => x.person === el.dataset.person); if (d) openConv(ctx, d.id); else ctx.toast({ category: 'info', title: pname(ctx, el.dataset.person) }); return false; },
    draft(ctx, el) {
      const s = ctx.s;
      s.drafts[s.cur] = el.value;
      el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight + 2, 144) + 'px';
      const btn = el.form.querySelector('[type=submit]'); if (btn) btn.disabled = !el.value.trim();
      const m = el.value.slice(0, el.selectionStart).match(/(^|\s)@([^\s@]*)$/);
      const next = m ? { q: m[2], sel: 0 } : null;
      if (JSON.stringify(next && next.q) === JSON.stringify(s.mention && s.mention.q)) return false;
      s.mention = next;
    },
    composerKey(ctx, el, ev) {
      const s = ctx.s;
      if (s.mention) {
        const list = mentionMatches(ctx, s.mention.q);
        if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') { ev.preventDefault(); if (list.length) s.mention.sel = (s.mention.sel + (ev.key === 'ArrowDown' ? 1 : -1) + list.length) % list.length; return true; }
        if ((ev.key === 'Enter' || ev.key === 'Tab') && list.length) { ev.preventDefault(); insertMention(ctx, list[s.mention.sel]); return true; }
        if (ev.key === 'Escape') { ev.preventDefault(); s.mention = null; return true; }
      }
      if (ev.key === 'Enter' && !ev.shiftKey && !ev.isComposing) {
        ev.preventDefault();
        const text = el.value.trim();
        if (!text) return false;
        s.drafts[s.cur] = ''; s.mention = null;
        send(ctx, s.cur, text);
        return true;
      }
      return false;
    },
    pickMention(ctx, el) { insertMention(ctx, el.dataset.person); },
    send(ctx, f, e, d) {
      const s = ctx.s; const text = (d.text || '').trim();
      if (!text) return false;
      s.drafts[s.cur] = ''; s.mention = null;
      send(ctx, s.cur, text);
    },
    react(ctx, el) {
      const s = ctx.s; const f = findMsg(s, el.dataset.msg); if (!f) return false;
      const who = (f.m.reactions[el.dataset.emoji] ||= []);
      const i = who.indexOf(ME);
      if (i >= 0) who.splice(i, 1); else who.push(ME);
      s.picker = null; s.menu = null;
    },
    picker(ctx, el) { const k = el.dataset.msg + el.dataset.scope; ctx.s.picker = ctx.s.picker === k ? null : k; ctx.s.menu = null; },
    menu(ctx, el) { const k = el.dataset.msg + el.dataset.scope; ctx.s.menu = ctx.s.menu === k ? null : k; ctx.s.picker = null; },
    presence(ctx) { ctx.s.presenceOpen = !ctx.s.presenceOpen; },
    openThread(ctx, el) {
      const s = ctx.s; closeMenus(s); s.thread = el.dataset.msg; s.replyDraft = '';
      if (ctx.device === 'phone') { ctx.go('thread'); return false; }
      setTimeout(() => document.getElementById('reply-input')?.focus(), 0);
    },
    closeThread(ctx) { const s = ctx.s; s.thread = null; if (ctx.device === 'phone') { ctx.go('channel'); return false; } },
    replyDraft(ctx, el) { ctx.s.replyDraft = el.value; return false; },
    replyKey(ctx, el, ev) {
      if (ev.key === 'Enter' && !ev.shiftKey && !ev.isComposing) {
        ev.preventDefault();
        const text = el.value.trim(); if (!text) return false;
        ctx.s.replyDraft = '';
        send(ctx, conv(ctx.s, findMsg(ctx.s, ctx.s.thread).c.id).id, text, ctx.s.thread, el.form.also.checked);
        return true;
      }
      return false;
    },
    reply(ctx, f, e, d) {
      const text = (d.text || '').trim(); if (!text) return false;
      ctx.s.replyDraft = '';
      send(ctx, findMsg(ctx.s, ctx.s.thread).c.id, text, ctx.s.thread, !!d.also);
    },
    edit(ctx, el) { closeMenus(ctx.s); ctx.s.editing = el.dataset.msg; setTimeout(() => { const t = document.getElementById('edit-' + el.dataset.msg); if (t) { t.focus(); t.setSelectionRange(t.value.length, t.value.length); } }, 0); },
    cancelEdit(ctx) { ctx.s.editing = null; },
    editKey(ctx, el, ev) {
      if (ev.key === 'Escape') { ctx.s.editing = null; return true; }
      if (ev.key === 'Enter' && !ev.shiftKey && !ev.isComposing) { ev.preventDefault(); el.form.requestSubmit(); }
      return false;
    },
    saveEdit(ctx, f, e, d) {
      const s = ctx.s; const m = findMsg(s, s.editing)?.m;
      const text = (d.text || '').trim();
      if (m && text && text !== L(ctx, m.text)) { m.text = text; m.edited = true; }
      s.editing = null;
    },
    async del(ctx, el) {
      const s = ctx.s; closeMenus(s);
      const f = findMsg(s, el.dataset.msg); if (!f) return;
      ctx.rerender();
      const ok = await ctx.confirm({ title: ctx.t('delete.title'), body: ctx.t('delete.body', { conv: convName(ctx, f.c) }), ok: ctx.t('delete.ok'), cancel: ctx.t('chat.cancel'), danger: true });
      if (!ok) return false;
      const i = f.list.indexOf(f.m); f.list.splice(i, 1);
      if (s.thread === f.m.id) { s.thread = null; if (s.route === 'thread') s.route = 'channel'; }
      ctx.toast({ category: 'success', title: ctx.t('delete.done'), duration: 8000,
        action: { label: ctx.t('delete.undo'), run: () => { f.list.splice(i, 0, f.m); ctx.toast({ category: 'info', title: ctx.t('delete.restored') }); ctx.rerender(); } } });
    },
    newChannel(ctx) {
      const err = (k, vars) => ctx.t(k, vars);
      const { el } = ctx.dialog({
        title: ctx.t('nc.title'), description: ctx.t('nc.desc'),
        body: html`<form id="nc-form" class="grid gap-4" data-submit="create" novalidate>
          <div class="field"><label class="label" for="nc-name">${ctx.t('nc.name')}</label>
            <div class="input-group"><span data-align="inline-start" aria-hidden="true">#</span><input id="nc-name" name="name" autocomplete="off" aria-describedby="nc-name-help" placeholder="trip-photos"></div>
            <p class="text-muted-foreground text-sm" id="nc-name-help">${ctx.t('nc.name_help')}</p>
            <p class="text-destructive text-sm" id="nc-name-err" hidden></p></div>
          <div class="field"><label class="label" for="nc-topic">${ctx.t('nc.topic')}</label><input class="input" id="nc-topic" name="topic"></div>
          <fieldset class="fieldset grid gap-2"><legend class="label">${ctx.t('nc.visibility')}</legend>
            <label class="label gap-3 font-normal"><input class="input" type="radio" name="vis" value="public" checked>${ctx.t('nc.public')}</label>
            <label class="label gap-3 font-normal"><input class="input" type="radio" name="vis" value="private">${ctx.t('nc.private')}</label></fieldset>
        </form>`,
        footer: html`<button class="btn" data-variant="outline" type="button" data-close>${ctx.t('nc.cancel')}</button><button class="btn" type="submit" form="nc-form">${ctx.t('nc.create')}</button>`,
        onAction: (name, form, e, close, d) => {
          if (name !== 'create') return;
          const v = (d.name || '').trim().replace(/^#/, '');
          const msg = !v ? err('nc.error.empty') : v.length > 40 ? err('nc.error.long') : !/^[a-z0-9-]+$/.test(v) ? err('nc.error.format') : ctx.s.channels.some((c) => c.id === v) ? err('nc.error.taken', { name: v }) : '';
          const input = form.querySelector('#nc-name'); const p = form.querySelector('#nc-name-err');
          if (msg) { p.textContent = msg; p.hidden = false; input.setAttribute('aria-invalid', 'true'); input.setAttribute('aria-describedby', 'nc-name-err nc-name-help'); input.focus(); return; }
          ctx.s.channels.push({ id: v, topic: { en: d.topic || '', ja: d.topic || '' }, members: 1, unread: 0, messages: [] });
          close();
          ctx.toast({ category: 'success', title: ctx.t('nc.created', { name: v }) });
          openConv(ctx, v);
        },
      });
      setTimeout(() => el.querySelector('#nc-name')?.focus(), 0);
      return false;
    },
    q(ctx, el) { ctx.s.q = el.value; },
    kind(ctx, el) { ctx.s.kind = el.dataset.kind; },
    jump(ctx, el) {
      const s = ctx.s;
      const parent = el.dataset.parent;
      openConv(ctx, el.dataset.conv);
      if (parent) { s.thread = parent; s.highlight = el.dataset.msg; if (ctx.device === 'phone') { ctx.go('thread'); } else ctx.rerender(); }
      else { s.highlight = el.dataset.msg; ctx.rerender(); }
      later(2500, () => { s.highlight = null; ctx.rerender(); });
      return false;
    },
    notifTab(ctx, el) { ctx.s.notifTab = el.dataset.tab; },
    markAll(ctx) { ctx.s.notifs.forEach((n) => { n.unread = false; }); ctx.toast({ category: 'success', title: ctx.t('notif.marked') }); },
    openNotif(ctx, el) {
      const s = ctx.s; const n = s.notifs.find((x) => x.id === el.dataset.id); if (!n) return false;
      n.unread = false;
      const f = findMsg(s, n.msgId);
      openConv(ctx, n.conv);
      if (n.kind === 'reply' || (f && f.parent)) { s.thread = f && f.parent ? f.parent.id : n.msgId; if (ctx.device === 'phone') ctx.go('thread'); else ctx.rerender(); }
      else { s.highlight = n.msgId; ctx.rerender(); later(2500, () => { s.highlight = null; ctx.rerender(); }); }
      return false;
    },
    saveProfile(ctx, f, e, d) {
      const s = ctx.s; const name = (d.name || '').trim();
      s.profileDraft = d.name;
      s.profileErr = !name ? 'profile.error.empty' : name.length > 40 ? 'profile.error.long' : null;
      if (s.profileErr) { setTimeout(() => document.getElementById('pf-name')?.focus(), 0); return; }
      s.profile = { name, status: d.status || 'active' };
      s.profileDraft = null;
      ctx.toast({ category: 'success', title: ctx.t('profile.saved') });
    },
    lang(ctx, el) { ctx.setLang(el.value); ctx.toast({ category: 'success', title: ctx.t('settings.saved') }); },
    theme(ctx, el) { ctx.setTheme(el.value); ctx.toast({ category: 'success', title: ctx.t('settings.saved') }); },
    notify(ctx, el) { ctx.s.notify = el.checked; ctx.toast({ category: 'success', title: ctx.t('settings.saved') }); },
  },
};
