// Pinwheel: AppBoard-style kanban project board, built from ProductGrid, ListSearch, EmptyState, Kanban, DragList,
// Tabs, AvatarGroup, Presence, LabelsAssignees, DetailView, DocEditor, DatePicker, Comments, ActivityFeed,
// Timeline, Invite, Roles, ConfirmDialog, DeleteUndo, BarChart, SidePanel, TopBar, BottomBar.
import { html, raw, icon } from '../kit.js';

const TODAY = '2026-10-18';
const COLS = ['todo', 'doing', 'done'];
const WIP = { doing: 3 };
const LABELS = { research: 'var(--chart-1)', design: 'var(--chart-2)', writing: 'var(--chart-3)', urgent: 'destructive' };
const PEOPLE = {
  ak: { name: 'Aiko Kato', ja: '加藤 愛子', i: 'AK', email: 'aiko@example.com' },
  ks: { name: 'Kenji Sato', ja: '佐藤 健二', i: 'KS', email: 'kenji@example.com' },
  mw: { name: 'Mei Wong', ja: 'メイ・ウォン', i: 'MW', email: 'mei@example.com' },
  rt: { name: 'Ren Takahashi', ja: '高橋 蓮', i: 'RT', email: 'ren@example.com' },
};
const T = (en, ja) => ({ en, ja });

const seed = () => ({
  boards: [
    { id: 1, name: T('Class project', 'クラスプロジェクト'), members: [['ak', 'owner'], ['ks', 'member'], ['mw', 'member'], ['rt', 'viewer']] },
    { id: 2, name: T('Field trip to Kyoto', '京都への校外学習'), members: [['ak', 'owner'], ['mw', 'member']] },
  ],
  cards: [
    { id: 11, board: 1, col: 'todo', title: T('Interview three classmates', 'クラスメート3人にインタビュー'), body: T('Ask about how they study vocabulary.\n- [ ] Write 5 questions\n- [ ] Book 15 minutes each', '単語の勉強方法について聞く。\n- [ ] 質問を5つ書く\n- [ ] 1人15分ずつ予約する'), labels: ['research'], who: ['ak'], due: '2026-10-20' },
    { id: 12, board: 1, col: 'todo', title: T('Draft the survey', 'アンケートの下書き'), body: T('Ten questions, one page.', '10問、1ページ。'), labels: ['research', 'writing'], who: ['mw'], due: '2026-10-23' },
    { id: 13, board: 1, col: 'todo', title: T('Book the library room', '図書室を予約する'), body: T('', ''), labels: ['urgent'], who: ['ks'], due: '2026-10-17' },
    { id: 14, board: 1, col: 'doing', title: T('Poster layout', 'ポスターのレイアウト'), body: T('A2, portrait. Title, three findings, one chart.', 'A2縦。タイトル、3つの発見、グラフ1つ。'), labels: ['design'], who: ['mw', 'ak'], due: '2026-10-21' },
    { id: 15, board: 1, col: 'doing', title: T('Translate the settings page', '設定ページを翻訳する'), body: T('', ''), labels: ['writing'], who: ['ks'], due: '' },
    { id: 16, board: 1, col: 'done', title: T('Pick the topic', 'テーマを決める'), body: T('How students learn kanji outside class.', '授業外で漢字をどう学んでいるか。'), labels: [], who: ['ak'], due: '2026-10-10' },
    { id: 17, board: 1, col: 'done', title: T('Make the group chat', 'グループチャットを作る'), body: T('', ''), labels: [], who: ['ks'], due: '' },
    { id: 21, board: 2, col: 'todo', title: T('Choose the temples', 'お寺を選ぶ'), body: T('Fushimi Inari, Kiyomizu-dera.', '伏見稲荷、清水寺。'), labels: ['research'], who: ['mw'], due: '2026-10-25' },
    { id: 22, board: 2, col: 'doing', title: T('Collect permission slips', '同意書を集める'), body: T('', ''), labels: ['urgent'], who: ['ak'], due: '2026-10-19' },
  ],
  comments: {
    14: [{ who: 'ks', text: T('Can we fit the chart on the left?', 'グラフを左に置けますか？'), at: '2026-10-17T16:20' }, { who: 'mw', text: T('Yes, trying it now.', 'はい、今やってみます。'), at: '2026-10-17T16:42' }],
    11: [{ who: 'ak', text: T('I’ll start with Ren.', 'まず蓮さんから始めます。'), at: '2026-10-18T08:10' }],
  },
  activity: [
    { who: 'ks', what: 'moved', card: 14, to: 'doing', at: '2026-10-18T08:30' },
    { who: 'mw', what: 'commented', card: 14, at: '2026-10-17T16:42' },
    { who: 'ak', what: 'created', card: 11, at: '2026-10-17T10:05' },
    { who: 'ak', what: 'moved', card: 16, to: 'done', at: '2026-10-16T18:00' },
  ],
  invites: [{ email: 'yui@example.com', role: 'member' }],
  nextId: 100,
  boardId: 1,
});

const M = {
  en: {
    'app.name': 'Pinwheel', 'nav.main': 'Main', 'nav.boards': 'Boards', 'nav.due': 'Due Dates', 'nav.members': 'Members', 'nav.new_board': 'New Board',
    'boards.title': 'Boards', 'boards.search': 'Search boards', 'boards.search_hint': 'Search boards…', 'boards.cards': '{n} cards', 'boards.open': '{n} open',
    'boards.none_match': 'No boards match “{q}”', 'boards.none_match_text': 'Check the spelling, or clear the search.', 'boards.clear': 'Clear Search',
    'boards.chart': 'Cards by column', 'boards.chart_sub': 'All boards', 'boards.table': 'Show as a table', 'boards.board': 'Board',
    'newboard.title': 'New Board', 'newboard.desc': 'A board starts with To Do, Doing and Done.', 'newboard.name': 'Name', 'newboard.name_empty': 'Give the board a name.', 'newboard.create': 'Create Board', 'newboard.cancel': 'Cancel', 'newboard.created': 'Board created',
    'col.todo': 'To Do', 'col.doing': 'Doing', 'col.done': 'Done', 'col.empty': 'No cards', 'col.add': 'Add a card to {col}', 'col.over': 'Over the limit of {n}',
    'board.add_card': 'Add Card', 'board.add_placeholder': 'What needs doing?', 'board.add_save': 'Add', 'board.add_cancel': 'Cancel', 'board.add_empty': 'Write a title first.',
    'board.filter': 'Filter', 'board.label': 'Label', 'board.assignee': 'Assignee', 'board.any_label': 'Any label', 'board.anyone': 'Anyone', 'board.clear_filters': 'Clear Filters', 'board.filtered': 'Showing {n} of {total} cards',
    'board.share': 'Share', 'board.viewing': '{name} is viewing', 'board.more': 'Move or edit “{title}”', 'board.move_to': 'Move to {col}', 'board.open': 'Open…', 'board.archive': 'Archive',
    'board.help': 'Drag a card, or focus it and press Space to pick it up, arrow keys to move, Space to drop, Esc to cancel. Return opens it.',
    'board.live.picked': '{title} picked up, in {col}, position {pos}.', 'board.live.moved': '{title} is in {col}, position {pos}.', 'board.live.dropped': '{title} dropped in {col}.', 'board.live.cancelled': 'Move cancelled.',
    'board.moved_toast': 'Moved to {col}', 'board.empty.title': 'This board has no cards yet', 'board.empty.body': 'Add the first thing to do. Cards move from To Do to Done as the work happens.',
    'board.due': 'Due {date}', 'board.overdue': 'Overdue · {date}', 'board.checklist': '{done}/{all}',
    'label.research': 'Research', 'label.design': 'Design', 'label.writing': 'Writing', 'label.urgent': 'Urgent',
    'card.back': 'Board', 'card.title': 'Title', 'card.body': 'Description', 'card.body_hint': 'Write “- [ ]” to start a checklist.', 'card.column': 'Column', 'card.labels': 'Labels', 'card.edit_labels': 'Edit Labels', 'card.assignees': 'Assignees', 'card.edit_assignees': 'Edit Assignees', 'card.none': 'None yet',
    'card.due': 'Due date', 'card.due_clear': 'Clear', 'card.due_help': 'Shown on the card and in Due Dates.', 'card.saved': 'Saved', 'card.archive': 'Archive…',
    'card.archive_title': 'Archive “{title}”?', 'card.archive_body': 'It leaves the board. You can undo this for 8 seconds.', 'card.archive_ok': 'Archive Card', 'card.archived': 'Card archived', 'card.undo': 'Undo', 'card.restored': 'Card restored',
    'comments.title': 'Comments', 'comments.label': 'Add a comment', 'comments.hint': 'Write a comment…', 'comments.send': 'Comment', 'comments.empty': 'No comments yet. Ask a question or share progress.', 'comments.error': 'Write something first.',
    'activity.title': 'Activity', 'activity.moved': '{name} moved {card} to {col}', 'activity.commented': '{name} commented on {card}', 'activity.created': '{name} added {card}', 'activity.archived': '{name} archived {card}', 'activity.empty': 'Nothing has happened here yet.',
    'due.title': 'Due Dates', 'due.overdue': 'Overdue', 'due.week': 'This week', 'due.later': 'Later', 'due.none': 'No due dates', 'due.none_text': 'Give a card a due date and it shows up here.', 'due.in': 'in {board}',
    'members.title': 'Members', 'members.lede': 'People on “{board}”.', 'invite.title': 'Invite people', 'invite.emails': 'Email addresses', 'invite.emails_hint': 'name@example.com, …', 'invite.emails_help': 'Separate addresses with commas.', 'invite.role': 'Role', 'invite.send': 'Send Invitations',
    'invite.error.empty': 'Enter at least one email.', 'invite.error.bad': '“{email}” isn’t an email address.', 'invite.sent': '{n} invitations sent', 'invite.sent_one': 'Invitation sent', 'invite.pending': 'Invited, waiting', 'invite.cancel': 'Cancel Invitation', 'invite.resend': 'Resend', 'invite.resent': 'Invitation sent again',
    'roles.owner': 'Owner', 'roles.member': 'Member', 'roles.viewer': 'Viewer', 'roles.owner_help': 'Can change everything, including who is on the board.', 'roles.member_help': 'Can add, move and edit cards.', 'roles.viewer_help': 'Can see the board and comment.',
    'roles.changed': '{name} is now {role}', 'roles.remove': 'Remove…', 'roles.remove_title': 'Remove {name} from the board?', 'roles.remove_body': 'Their cards stay; they are unassigned.', 'roles.remove_ok': 'Remove', 'roles.removed': '{name} removed', 'roles.you': 'you', 'roles.cancel': 'Cancel',
  },
  ja: {
    'app.name': 'ピンホイール', 'nav.main': 'メイン', 'nav.boards': 'ボード', 'nav.due': '期限', 'nav.members': 'メンバー', 'nav.new_board': '新規ボード',
    'boards.title': 'ボード', 'boards.search': 'ボードを検索', 'boards.search_hint': 'ボードを検索…', 'boards.cards': '{n}枚のカード', 'boards.open': '未完了 {n}',
    'boards.none_match': '「{q}」に一致するボードはありません', 'boards.none_match_text': 'つづりを確認するか、検索を解除してください。', 'boards.clear': '検索を解除',
    'boards.chart': '列ごとのカード数', 'boards.chart_sub': 'すべてのボード', 'boards.table': '表で表示', 'boards.board': 'ボード',
    'newboard.title': '新規ボード', 'newboard.desc': 'ボードは「やること」「作業中」「完了」の3列で始まります。', 'newboard.name': '名前', 'newboard.name_empty': 'ボードに名前を付けてください。', 'newboard.create': 'ボードを作成', 'newboard.cancel': 'キャンセル', 'newboard.created': 'ボードを作成しました',
    'col.todo': 'やること', 'col.doing': '作業中', 'col.done': '完了', 'col.empty': 'カードはありません', 'col.add': '「{col}」にカードを追加', 'col.over': '上限 {n} を超えています',
    'board.add_card': 'カードを追加', 'board.add_placeholder': '何をしますか？', 'board.add_save': '追加', 'board.add_cancel': 'キャンセル', 'board.add_empty': 'タイトルを入力してください。',
    'board.filter': '絞り込み', 'board.label': 'ラベル', 'board.assignee': '担当者', 'board.any_label': 'すべてのラベル', 'board.anyone': 'すべての人', 'board.clear_filters': '絞り込みを解除', 'board.filtered': '{total}枚中{n}枚を表示',
    'board.share': '共有', 'board.viewing': '{name}さんが閲覧中', 'board.more': '「{title}」を移動・編集', 'board.move_to': '「{col}」へ移動', 'board.open': '開く…', 'board.archive': 'アーカイブ',
    'board.help': 'カードをドラッグするか、選択してスペースで持ち上げ、矢印キーで移動、スペースで置きます。Escで取り消し、Returnで開きます。',
    'board.live.picked': '{title}を持ち上げました。{col}の{pos}番目です。', 'board.live.moved': '{title}は{col}の{pos}番目です。', 'board.live.dropped': '{title}を{col}に置きました。', 'board.live.cancelled': '移動を取り消しました。',
    'board.moved_toast': '「{col}」へ移動しました', 'board.empty.title': 'このボードにはまだカードがありません', 'board.empty.body': '最初のやることを追加しましょう。作業が進むとカードは「やること」から「完了」へ移ります。',
    'board.due': '期限 {date}', 'board.overdue': '期限切れ・{date}', 'board.checklist': '{done}/{all}',
    'label.research': '調査', 'label.design': 'デザイン', 'label.writing': '執筆', 'label.urgent': '急ぎ',
    'card.back': 'ボード', 'card.title': 'タイトル', 'card.body': '説明', 'card.body_hint': '「- [ ]」と書くとチェックリストになります。', 'card.column': '列', 'card.labels': 'ラベル', 'card.edit_labels': 'ラベルを編集', 'card.assignees': '担当者', 'card.edit_assignees': '担当者を編集', 'card.none': 'まだありません',
    'card.due': '期限', 'card.due_clear': 'クリア', 'card.due_help': 'カードと「期限」に表示されます。', 'card.saved': '保存しました', 'card.archive': 'アーカイブ…',
    'card.archive_title': '「{title}」をアーカイブしますか？', 'card.archive_body': 'ボードから外れます。8秒間は元に戻せます。', 'card.archive_ok': 'カードをアーカイブ', 'card.archived': 'カードをアーカイブしました', 'card.undo': '元に戻す', 'card.restored': 'カードを元に戻しました',
    'comments.title': 'コメント', 'comments.label': 'コメントを追加', 'comments.hint': 'コメントを入力…', 'comments.send': 'コメント', 'comments.empty': 'コメントはまだありません。質問や進み具合を書きましょう。', 'comments.error': '内容を入力してください。',
    'activity.title': 'アクティビティ', 'activity.moved': '{name}さんが{card}を「{col}」へ移動', 'activity.commented': '{name}さんが{card}にコメント', 'activity.created': '{name}さんが{card}を追加', 'activity.archived': '{name}さんが{card}をアーカイブ', 'activity.empty': 'まだ何も起きていません。',
    'due.title': '期限', 'due.overdue': '期限切れ', 'due.week': '今週', 'due.later': 'それ以降', 'due.none': '期限はありません', 'due.none_text': 'カードに期限を設定するとここに表示されます。', 'due.in': '{board}',
    'members.title': 'メンバー', 'members.lede': '「{board}」のメンバー。', 'invite.title': 'メンバーを招待', 'invite.emails': 'メールアドレス', 'invite.emails_hint': 'name@example.com, …', 'invite.emails_help': '複数の場合はカンマで区切ります。', 'invite.role': '役割', 'invite.send': '招待を送信',
    'invite.error.empty': 'メールアドレスを1つ以上入力してください。', 'invite.error.bad': '「{email}」はメールアドレスではありません。', 'invite.sent': '{n}件の招待を送信しました', 'invite.sent_one': '招待を送信しました', 'invite.pending': '招待中', 'invite.cancel': '招待を取り消す', 'invite.resend': '再送信', 'invite.resent': '招待を再送信しました',
    'roles.owner': 'オーナー', 'roles.member': 'メンバー', 'roles.viewer': '閲覧者', 'roles.owner_help': 'ボードのメンバーを含め、すべてを変更できます。', 'roles.member_help': 'カードの追加、移動、編集ができます。', 'roles.viewer_help': 'ボードの閲覧とコメントができます。',
    'roles.changed': '{name}さんを{role}にしました', 'roles.remove': '外す…', 'roles.remove_title': '{name}さんをボードから外しますか？', 'roles.remove_body': 'カードは残り、担当は外れます。', 'roles.remove_ok': '外す', 'roles.removed': '{name}さんを外しました', 'roles.you': 'あなた', 'roles.cancel': 'キャンセル',
  },
};

// ---- helpers ----
const L = (ctx, v) => (typeof v === 'string' ? v : v[ctx.lang] || v.en);
const pname = (ctx, id) => (ctx.lang === 'ja' ? PEOPLE[id].ja : PEOPLE[id].name);
const board = (ctx) => ctx.s.boards.find((b) => b.id === ctx.s.boardId) || ctx.s.boards[0];
const cardsOf = (ctx, b, col) => ctx.s.cards.filter((c) => c.board === b.id && (!col || c.col === col));
const fmtDate = (ctx, d) => ctx.date(d + 'T12:00:00', { month: 'short', day: 'numeric' });
const checklist = (ctx, c) => { const b = L(ctx, c.body); const all = (b.match(/- \[[ x]\]/g) || []).length; const done = (b.match(/- \[x\]/g) || []).length; return all ? { all, done } : null; };
const log = (ctx, e) => ctx.s.activity.unshift({ ...e, at: '2026-10-18T09:' + String(10 + (ctx.s.activity.length % 50)).padStart(2, '0') });
function visible(ctx, cards) {
  const { flabel = '', fwho = '' } = ctx.s;
  return cards.filter((c) => (!flabel || c.labels.includes(flabel)) && (!fwho || c.who.includes(fwho)));
}
function labelBadge(ctx, l) {
  return LABELS[l] === 'destructive'
    ? html`<span class="badge" data-variant="destructive">${ctx.t('label.' + l)}</span>`
    : html`<span class="badge" data-variant="outline"><span class="size-2 rounded-full" style="background: ${LABELS[l]}" aria-hidden="true"></span>${ctx.t('label.' + l)}</span>`;
}
const avatar = (ctx, id, size = 'sm', one = false) => html`<span class="avatar" data-size="${size}" role="img" aria-label="${pname(ctx, id)}" data-tooltip="${pname(ctx, id)}"><span>${one ? PEOPLE[id].i[0] : PEOPLE[id].i}</span></span>`;

// ---- shell: SidePanel on the desktop, TopBar + BottomBar on the phone ----
const NAV = [['boards', 'board', 'nav.boards'], ['due', 'calendar', 'nav.due'], ['members', 'users', 'nav.members']];
function shell(ctx, body, active, top = '') {
  return html`<div class="flex h-full flex-col @3xl:flex-row">
    <aside data-block="SidePanel" class="hidden w-60 shrink-0 flex-col gap-1 border-r bg-sidebar p-3 text-sm text-sidebar-foreground @3xl:flex" aria-label="${ctx.t('nav.main')}">
      <p class="flex items-center gap-2 px-2 pb-3 pt-1 font-semibold">${icon('board', 'size-4')}${ctx.t('app.name')}</p>
      <button class="btn mb-2 justify-start" type="button" data-action="newBoard">${icon('plus')}${ctx.t('nav.new_board')}</button>
      <nav class="grid gap-0.5">
        ${NAV.map(([r, i, k]) => html`<a href="#" data-go="${r}" ${raw(active === r ? 'aria-current="page"' : '')} class="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-sidebar-accent aria-[current=page]:bg-sidebar-accent aria-[current=page]:font-medium">${icon(i, 'size-4')}<span>${ctx.t(k)}</span></a>`)}
      </nav>
      <p class="px-2 pb-1 pt-4 text-xs font-medium text-muted-foreground">${ctx.t('nav.boards')}</p>
      <nav class="grid gap-0.5">
        ${ctx.s.boards.map((b) => html`<a href="#" data-go="board" data-param='${JSON.stringify({ boardId: b.id })}' ${raw(active === 'board' && b.id === ctx.s.boardId ? 'aria-current="page"' : '')} class="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-sidebar-accent aria-[current=page]:bg-sidebar-accent aria-[current=page]:font-medium"><span class="truncate">${L(ctx, b.name)}</span><span class="badge ml-auto" data-variant="secondary">${cardsOf(ctx, b).length}</span></a>`)}
      </nav>
    </aside>
    <div class="flex min-h-0 min-w-0 flex-1 flex-col">
      <header data-block="TopBar" class="flex h-14 shrink-0 items-center gap-2 border-b px-4 @3xl:hidden">
        ${top || html`<h1 class="flex-1 truncate text-base font-semibold">${ctx.t('app.name')}</h1>
        <button class="btn" data-variant="ghost" data-size="icon" type="button" aria-label="${ctx.t('nav.new_board')}" data-action="newBoard">${icon('plus')}</button>`}
      </header>
      <main class="min-h-0 flex-1 overflow-y-auto" data-scroll="main">${body}</main>
      <nav data-block="BottomBar" class="grid shrink-0 grid-cols-3 border-t bg-background @3xl:hidden" aria-label="${ctx.t('nav.main')}">
        ${NAV.map(([r, i, k]) => html`<a href="#" data-go="${r}" ${raw(active === r || (r === 'boards' && (active === 'board')) ? 'aria-current="page"' : '')} class="flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] text-muted-foreground aria-[current=page]:font-medium aria-[current=page]:text-foreground">${icon(i, 'size-5')}<span>${ctx.t(k)}</span></a>`)}
      </nav>
    </div>
  </div>`;
}

// ---- Boards (ProductGrid + ListSearch + BarChart) ----
function boards(ctx) {
  const q = (ctx.s.bq || '').trim().toLowerCase();
  const list = ctx.s.boards.filter((b) => !q || L(ctx, b.name).toLowerCase().includes(q));
  const data = ctx.s.boards.map((b) => ({ board: L(ctx, b.name), ...Object.fromEntries(COLS.map((c) => [c, cardsOf(ctx, b, c).length])) }));
  const series = Object.fromEntries(COLS.map((c, i) => [c, { label: ctx.t('col.' + c), color: `var(--chart-${i + 1})` }]));
  const opts = { indexAxis: 'y', scales: { x: { stacked: true, beginAtZero: true, ticks: { display: true, precision: 0 } }, y: { stacked: true } } };
  return shell(ctx, html`<section class="grid gap-5 p-4 @3xl:p-8">
    <div class="flex items-center justify-between gap-3"><h1 class="text-2xl font-semibold">${ctx.t('boards.title')}</h1><button class="btn hidden @3xl:inline-flex" type="button" data-action="newBoard">${icon('plus')}${ctx.t('nav.new_board')}</button></div>
    <form role="search" data-block="ListSearch" data-submit="noop">
      <label class="input-group w-full @3xl:w-72"><span data-align="start">${icon('search', 'size-4')}</span>
        <input id="bd-q" type="search" value="${ctx.s.bq || ''}" placeholder="${ctx.t('boards.search_hint')}" aria-label="${ctx.t('boards.search')}" data-input="bsearch" autocomplete="off"></label>
    </form>
    ${list.length ? html`<ul data-block="ProductGrid" class="grid gap-3 @xl:grid-cols-2 @5xl:grid-cols-3">
      ${list.map((b) => { const all = cardsOf(ctx, b); const open = all.filter((c) => c.col !== 'done').length; return html`<li><a href="#" data-go="board" data-param='${JSON.stringify({ boardId: b.id })}' class="card h-full gap-3 p-4 transition-colors hover:bg-accent/50">
        <div class="flex gap-1" aria-hidden="true">${COLS.map((c, i) => html`<span class="h-2 rounded-full" style="flex: ${cardsOf(ctx, b, c).length || 0.2}; background: var(--chart-${i + 1})"></span>`)}</div>
        <h2 class="text-base font-semibold">${L(ctx, b.name)}</h2>
        <p class="text-sm text-muted-foreground">${ctx.t('boards.cards', { n: all.length })} · ${ctx.t('boards.open', { n: open })}</p>
        <div data-block="AvatarGroup" class="avatar-group" role="group" aria-label="${ctx.t('nav.members')}">${b.members.slice(0, 4).map(([p]) => avatar(ctx, p, 'default', true))}</div>
      </a></li>`; })}
    </ul>` : html`<div data-block="EmptyState" class="empty rounded-lg border border-dashed"><header><figure>${icon('search')}</figure><h3>${ctx.t('boards.none_match', { q: ctx.s.bq })}</h3><p>${ctx.t('boards.none_match_text')}</p></header><footer class="flex-row"><button class="btn" data-variant="outline" type="button" data-action="bclear">${ctx.t('boards.clear')}</button></footer></div>`}
    <div data-block="BarChart" class="card">
      <header><h2 class="font-semibold">${ctx.t('boards.chart')}</h2><p class="text-sm text-muted-foreground">${ctx.t('boards.chart_sub')}</p></header>
      <section><canvas class="chart h-48" data-chart-type="bar" data-chart-label-key="board" data-chart-legend="true" role="img" aria-label="${ctx.t('boards.chart')}"
        data-chart-data='${JSON.stringify(data)}' data-chart-series='${JSON.stringify(series)}' data-chart-options='${JSON.stringify(opts)}'></canvas>
        <details class="mt-3 text-sm"><summary class="cursor-pointer">${ctx.t('boards.table')}</summary><div class="table-container mt-2"><table class="table">
          <thead><tr><th>${ctx.t('boards.board')}</th>${COLS.map((c) => html`<th class="text-right">${ctx.t('col.' + c)}</th>`)}</tr></thead>
          <tbody>${data.map((r) => html`<tr><td>${r.board}</td>${COLS.map((c) => html`<td class="text-right tabular-nums">${r[c]}</td>`)}</tr>`)}</tbody></table></div></details></section>
    </div>
  </section>`, 'boards');
}

// ---- Board (Kanban + DragList + Tabs on the phone) ----
function cardEl(ctx, c, pre) {
  const t = L(ctx, c.title);
  const ck = checklist(ctx, c);
  const late = c.due && c.due < TODAY && c.col !== 'done';
  const picked = ctx.s.picked === c.id;
  return html`<li><article id="${pre}-card-${c.id}" class="card gap-2 p-3 outline-none focus-visible:ring-2 focus-visible:ring-ring ${picked ? 'opacity-60 ring-2 ring-primary' : ''}" draggable="true" tabindex="0"
      data-card="${c.id}" data-keydown="cardKey" aria-describedby="bd-help" ${raw(picked ? 'aria-grabbed="true"' : '')} aria-label="${t}">
    <div class="flex items-start gap-2">
      <a href="#" class="flex-1 text-sm font-medium hover:underline" data-go="card" data-param='${JSON.stringify({ cardId: c.id })}' tabindex="-1">${t}</a>
      <div class="dropdown-menu">
        <button id="${pre}-menu-${c.id}" class="btn -mr-1 -mt-1" data-variant="ghost" data-size="icon-sm" type="button" aria-haspopup="menu" aria-controls="${pre}-menu-${c.id}-list" aria-expanded="false" aria-label="${ctx.t('board.more', { title: t })}">${icon('more')}</button>
        <div data-popover aria-hidden="true" data-align="end"><div role="menu" id="${pre}-menu-${c.id}-list" aria-labelledby="${pre}-menu-${c.id}">
          ${COLS.filter((x) => x !== c.col).map((x) => html`<div role="menuitem" data-action="moveTo" data-card="${c.id}" data-col="${x}">${ctx.t('board.move_to', { col: ctx.t('col.' + x) })}</div>`)}
          <hr role="separator">
          <div role="menuitem" data-go="card" data-param='${JSON.stringify({ cardId: c.id })}'>${ctx.t('board.open')}</div>
          <div role="menuitem" data-action="archive" data-card="${c.id}">${ctx.t('board.archive')}</div>
        </div></div>
      </div>
    </div>
    ${c.labels.length ? html`<div class="flex flex-wrap gap-1">${c.labels.map((l) => labelBadge(ctx, l))}</div>` : ''}
    <div class="flex items-center justify-between gap-2 text-xs text-muted-foreground">
      <span class="flex items-center gap-2">
        ${c.due ? html`<span class="${late ? 'font-medium text-destructive' : ''}">${icon('calendar', 'size-3.5 inline -mt-0.5')} ${late ? ctx.t('board.overdue', { date: fmtDate(ctx, c.due) }) : fmtDate(ctx, c.due)}</span>` : ''}
        ${ck ? html`<span>${icon('check', 'size-3.5 inline -mt-0.5')} ${ctx.t('board.checklist', ck)}</span>` : ''}
      </span>
      <span class="avatar-group">${c.who.map((p) => avatar(ctx, p, 'sm', c.who.length > 1))}</span>
    </div>
  </article></li>`;
}
function column(ctx, b, col, pre) {
  const all = cardsOf(ctx, b, col);
  const cards = visible(ctx, all);
  const over = WIP[col] && all.length > WIP[col];
  const adding = ctx.s.adding === col && pre === ctx.s.addingPre;
  return html`<section class="grid min-w-0 content-start gap-3 rounded-lg bg-muted/50 p-3" aria-labelledby="${pre}-col-${col}" data-column="${col}">
    <header class="flex items-center justify-between">
      <h2 id="${pre}-col-${col}" class="flex items-center gap-2 text-sm font-semibold"><span>${ctx.t('col.' + col)}</span>
        <span class="badge" ${raw(over ? 'data-variant="destructive"' : 'data-variant="secondary"')} ${raw(over ? `title="${ctx.t('col.over', { n: WIP[col] })}"` : '')}>${WIP[col] ? `${all.length} / ${WIP[col]}` : all.length}</span></h2>
      <button class="btn" data-variant="ghost" data-size="icon-sm" type="button" aria-label="${ctx.t('col.add', { col: ctx.t('col.' + col) })}" data-action="startAdd" data-col="${col}" data-pre="${pre}">${icon('plus')}</button>
    </header>
    <ol class="grid min-h-12 gap-2" role="list" data-drop="${col}">
      ${cards.length ? cards.map((c) => cardEl(ctx, c, pre)) : html`<li class="text-muted-foreground px-1 text-sm">${ctx.t('col.empty')}</li>`}
    </ol>
    ${adding ? html`<form class="grid gap-2" data-submit="addCard" novalidate>
      <input type="hidden" name="col" value="${col}">
      <label class="sr-only" for="${pre}-add-${col}">${ctx.t('board.add_card')}</label>
      <textarea class="textarea min-h-16" id="${pre}-add-${col}" name="title" placeholder="${ctx.t('board.add_placeholder')}" data-keydown="addKey" ${raw(ctx.s.addErr ? `aria-invalid="true" aria-describedby="${pre}-add-err"` : '')}>${ctx.s.addDraft || ''}</textarea>
      ${ctx.s.addErr ? html`<p id="${pre}-add-err" class="text-destructive text-sm">${ctx.t('board.add_empty')}</p>` : ''}
      <div class="flex gap-2"><button class="btn" data-size="sm" type="submit">${ctx.t('board.add_save')}</button><button class="btn" data-variant="ghost" data-size="sm" type="button" data-action="cancelAdd">${ctx.t('board.add_cancel')}</button></div>
    </form>` : html`<button class="btn justify-start text-muted-foreground" data-variant="ghost" data-size="sm" type="button" data-action="startAdd" data-col="${col}" data-pre="${pre}">${icon('plus')}${ctx.t('board.add_card')}</button>`}
  </section>`;
}
function boardScreen(ctx) {
  const b = board(ctx);
  const all = cardsOf(ctx, b);
  const shown = visible(ctx, all).length;
  const filtered = ctx.s.flabel || ctx.s.fwho;
  const tab = ctx.s.tab || 'todo';
  const top = html`<button class="btn -ml-2" data-variant="ghost" data-size="icon" type="button" aria-label="${ctx.t('nav.boards')}" data-go="boards">${icon('back')}</button>
    <h1 class="flex-1 truncate text-base font-semibold">${L(ctx, b.name)}</h1>
    <button class="btn" data-variant="ghost" data-size="icon" type="button" aria-label="${ctx.t('board.share')}" data-go="members">${icon('users')}</button>`;
  const filters = html`<form class="flex flex-wrap items-end gap-3" data-block="ListSearch" data-submit="noop" aria-label="${ctx.t('board.filter')}">
    <div class="grid gap-1.5"><label class="label" for="bd-flabel">${ctx.t('board.label')}</label>
      <select id="bd-flabel" class="select" data-change="flabel"><option value="">${ctx.t('board.any_label')}</option>${Object.keys(LABELS).map((l) => html`<option value="${l}" ${raw(ctx.s.flabel === l ? 'selected' : '')}>${ctx.t('label.' + l)}</option>`)}</select></div>
    <div class="grid gap-1.5"><label class="label" for="bd-fwho">${ctx.t('board.assignee')}</label>
      <select id="bd-fwho" class="select" data-change="fwho"><option value="">${ctx.t('board.anyone')}</option>${b.members.map(([p]) => html`<option value="${p}" ${raw(ctx.s.fwho === p ? 'selected' : '')}>${pname(ctx, p)}</option>`)}</select></div>
    ${filtered ? html`<p class="flex h-9 items-center gap-2 text-sm text-muted-foreground @max-3xl:h-11">${ctx.t('board.filtered', { n: shown, total: all.length })}<button class="btn" data-variant="link" data-size="sm" type="button" data-action="fclear">${ctx.t('board.clear_filters')}</button></p>` : ''}
  </form>`;
  const body = !all.length
    ? html`<div data-block="EmptyState" class="empty rounded-lg border border-dashed"><header><figure>${icon('board')}</figure><h3>${ctx.t('board.empty.title')}</h3><p>${ctx.t('board.empty.body')}</p></header>
        <footer class="flex-row"><button class="btn" type="button" data-action="startAdd" data-col="todo" data-pre="${ctx.device === 'phone' ? 'p' : 'd'}">${icon('plus')}${ctx.t('board.add_card')}</button></footer></div>
       ${ctx.s.adding ? html`<div class="max-w-sm">${column(ctx, b, 'todo', ctx.s.addingPre)}</div>` : ''}`
    : html`<div data-block="Kanban" class="grid gap-4">
      <div class="hidden grid-cols-3 gap-4 @3xl:grid" data-block="DragList">${COLS.map((c) => column(ctx, b, c, 'd'))}</div>
      <div class="tabs grid gap-3 @3xl:hidden" data-block="Tabs">
        <nav role="tablist" aria-label="${ctx.t('board.filter')}" class="w-full">
          ${COLS.map((c) => html`<button type="button" role="tab" id="bd-tab-${c}" aria-controls="bd-panel-${c}" aria-selected="${tab === c}" ${raw(tab === c ? '' : 'tabindex="-1"')} data-action="tab" data-col="${c}" class="flex-1">${ctx.t('col.' + c)} <span class="text-muted-foreground">${cardsOf(ctx, b, c).length}</span></button>`)}
        </nav>
        ${COLS.map((c) => html`<div role="tabpanel" id="bd-panel-${c}" aria-labelledby="bd-tab-${c}" ${raw(tab === c ? '' : 'hidden')}>${column(ctx, b, c, 'p')}</div>`)}
      </div>
    </div>`;
  return shell(ctx, html`<section class="grid gap-4 p-4 @3xl:p-8">
    <div class="hidden items-center gap-3 @3xl:flex">
      <h1 class="text-2xl font-semibold">${L(ctx, b.name)}</h1>
      ${b.members.some(([p]) => p === 'ks') ? html`<div data-block="Presence" class="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
        <span class="avatar" role="img" aria-label="${ctx.t('board.viewing', { name: pname(ctx, 'ks') })}" data-tooltip="${ctx.t('board.viewing', { name: pname(ctx, 'ks') })}"><span>KS</span><span class="avatar-badge bg-green-600"></span></span>
        <span>${ctx.t('board.viewing', { name: pname(ctx, 'ks') })}</span>
      </div>` : html`<span class="ml-auto"></span>`}
      <div data-block="AvatarGroup" class="avatar-group" role="group" aria-label="${ctx.t('nav.members')}">${b.members.slice(0, 4).map(([p]) => avatar(ctx, p, 'default', true))}</div>
      <button class="btn" data-variant="outline" type="button" data-go="members">${icon('users')}${ctx.t('board.share')}</button>
      <button class="btn" type="button" data-action="startAdd" data-col="todo" data-pre="d">${icon('plus')}${ctx.t('board.add_card')}</button>
    </div>
    ${all.length ? filters : ''}
    <p id="bd-help" class="text-muted-foreground text-xs @max-3xl:sr-only">${ctx.t('board.help')}</p>
    <p id="bd-live" class="sr-only" aria-live="polite">${ctx.s.live || ''}</p>
    ${body}
  </section>`, 'board', top);
}

// ---- Card (DetailView + DocEditor + DatePicker + LabelsAssignees + Comments + ActivityFeed) ----
function cardScreen(ctx) {
  const c = ctx.s.cards.find((x) => x.id === ctx.s.cardId);
  if (!c) return boardScreen(ctx);
  const b = ctx.s.boards.find((x) => x.id === c.board);
  const t = L(ctx, c.title);
  const comments = ctx.s.comments[c.id] || [];
  const acts = ctx.s.activity.filter((a) => a.card === c.id);
  const top = html`<button class="btn -ml-2" data-variant="ghost" data-size="icon" type="button" aria-label="${ctx.t('card.back')}" data-go="board">${icon('back')}</button>
    <h1 class="flex-1 truncate text-base font-semibold">${t}</h1>`;
  return shell(ctx, html`<article data-block="DetailView" class="mx-auto grid max-w-5xl gap-5 p-4 @3xl:p-8">
    <nav class="breadcrumb" data-block="Breadcrumbs" aria-label="Breadcrumb"><ol>
      <li><a href="#" data-go="boards">${ctx.t('nav.boards')}</a></li><li aria-hidden="true">${icon('chevron', 'size-3.5')}</li>
      <li><a href="#" data-go="board" data-param='${JSON.stringify({ boardId: b.id })}'>${L(ctx, b.name)}</a></li><li aria-hidden="true">${icon('chevron', 'size-3.5')}</li>
      <li><span aria-current="page">${t}</span></li></ol></nav>
    <div class="grid gap-6 @3xl:grid-cols-[minmax(0,1fr)_17rem]">
      <div class="grid content-start gap-6">
        <div data-block="DocEditor" class="grid gap-3">
          <label class="sr-only" for="bd-c-title">${ctx.t('card.title')}</label>
          <input id="bd-c-title" class="w-full bg-transparent text-2xl font-semibold outline-none" value="${t}" data-input="editTitle">
          <div class="field"><label class="label" for="bd-c-body">${ctx.t('card.body')}</label>
            <textarea id="bd-c-body" class="textarea min-h-36 leading-7" data-input="editBody" aria-describedby="bd-c-body-help">${L(ctx, c.body)}</textarea>
            <p id="bd-c-body-help" class="text-muted-foreground text-sm">${ctx.t('card.body_hint')}</p></div>
        </div>
        <section data-block="Comments" class="grid gap-3" aria-labelledby="bd-cm-title">
          <h2 id="bd-cm-title" class="text-base font-semibold">${ctx.t('comments.title')} <span class="text-muted-foreground font-normal">${comments.length}</span></h2>
          ${comments.length ? html`<ol class="grid gap-3">${comments.map((m) => html`<li class="flex gap-3">${avatar(ctx, m.who)}
            <div class="grid min-w-0 flex-1 gap-1 rounded-lg border p-3"><p class="text-sm"><span class="font-medium">${pname(ctx, m.who)}</span> <time class="text-muted-foreground text-xs">${ctx.date(m.at, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</time></p><p class="text-sm">${L(ctx, m.text)}</p></div></li>`)}</ol>`
            : html`<p class="text-muted-foreground text-sm">${ctx.t('comments.empty')}</p>`}
          <form class="flex gap-3" data-submit="comment" novalidate>${avatar(ctx, 'ak')}
            <div class="grid flex-1 gap-2"><label class="sr-only" for="bd-cm-text">${ctx.t('comments.label')}</label>
              <textarea id="bd-cm-text" name="text" class="textarea min-h-16" placeholder="${ctx.t('comments.hint')}" ${raw(ctx.s.cmErr ? 'aria-invalid="true" aria-describedby="bd-cm-err"' : '')}>${ctx.s.cmDraft || ''}</textarea>
              ${ctx.s.cmErr ? html`<p id="bd-cm-err" class="text-destructive text-sm">${ctx.t('comments.error')}</p>` : ''}
              <div><button class="btn" data-size="sm" type="submit">${ctx.t('comments.send')}</button></div></div>
          </form>
        </section>
        <section data-block="ActivityFeed" class="grid gap-3" aria-labelledby="bd-ac-title">
          <h2 id="bd-ac-title" class="text-base font-semibold">${ctx.t('activity.title')}</h2>
          ${acts.length ? html`<ol class="grid gap-3">${acts.map((a) => html`<li class="flex items-start gap-3 text-sm">${avatar(ctx, a.who)}<div class="grid gap-0.5">
            <p>${ctx.t('activity.' + a.what, { name: pname(ctx, a.who), card: t, col: a.to ? ctx.t('col.' + a.to) : '' })}</p>
            <time class="text-muted-foreground text-xs">${ctx.date(a.at, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</time></div></li>`)}</ol>`
            : html`<p class="text-muted-foreground text-sm">${ctx.t('activity.empty')}</p>`}
        </section>
      </div>
      <aside class="grid content-start gap-5 text-sm">
        <div class="field"><label class="label" for="bd-c-col">${ctx.t('card.column')}</label>
          <select id="bd-c-col" class="select w-full" data-change="setCol">${COLS.map((x) => html`<option value="${x}" ${raw(x === c.col ? 'selected' : '')}>${ctx.t('col.' + x)}</option>`)}</select></div>
        <div data-block="DatePicker" class="field"><label class="label" for="bd-c-due">${ctx.t('card.due')}</label>
          <div class="flex gap-2"><input id="bd-c-due" class="input flex-1" type="date" value="${c.due}" data-change="setDue" aria-describedby="bd-c-due-help">
          ${c.due ? html`<button class="btn" data-variant="ghost" data-size="sm" type="button" data-action="clearDue">${ctx.t('card.due_clear')}</button>` : ''}</div>
          <p id="bd-c-due-help" class="text-muted-foreground text-xs">${c.due ? ctx.date(c.due + 'T12:00:00', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ctx.t('card.due_help')}</p></div>
        <section data-block="LabelsAssignees" class="grid gap-4">
          <div class="grid gap-2"><h3 class="font-medium">${ctx.t('card.labels')}</h3>
            <p class="flex flex-wrap gap-1">${c.labels.length ? c.labels.map((l) => labelBadge(ctx, l)) : html`<span class="text-muted-foreground">${ctx.t('card.none')}</span>`}</p>
            <details ${raw(ctx.s.openLabels ? 'open' : '')}><summary class="cursor-pointer text-sm underline-offset-4 hover:underline">${ctx.t('card.edit_labels')}</summary>
              <ul class="mt-2 grid gap-0.5" role="group" aria-label="${ctx.t('card.labels')}">${Object.keys(LABELS).map((l) => html`<li><label class="label gap-2 rounded-sm px-2 py-1.5 font-normal hover:bg-accent">
                <input class="input" type="checkbox" value="${l}" data-change="toggleLabel" ${raw(c.labels.includes(l) ? 'checked' : '')}>
                <span class="size-3 rounded-full ${LABELS[l] === 'destructive' ? 'bg-destructive' : ''}" ${raw(LABELS[l] === 'destructive' ? '' : `style="background: ${LABELS[l]}"`)} aria-hidden="true"></span>${ctx.t('label.' + l)}</label></li>`)}</ul></details></div>
          <div class="grid gap-2"><h3 class="font-medium">${ctx.t('card.assignees')}</h3>
            <p class="flex flex-wrap items-center gap-2">${c.who.length ? c.who.map((p) => html`<span class="flex items-center gap-1.5">${avatar(ctx, p)}${pname(ctx, p)}</span>`) : html`<span class="text-muted-foreground">${ctx.t('card.none')}</span>`}</p>
            <details ${raw(ctx.s.openWho ? 'open' : '')}><summary class="cursor-pointer text-sm underline-offset-4 hover:underline">${ctx.t('card.edit_assignees')}</summary>
              <ul class="mt-2 grid gap-0.5" role="group" aria-label="${ctx.t('card.assignees')}">${b.members.filter(([, r]) => r !== 'viewer').map(([p]) => html`<li><label class="label gap-2 rounded-sm px-2 py-1.5 font-normal hover:bg-accent">
                <input class="input" type="checkbox" value="${p}" data-change="toggleWho" ${raw(c.who.includes(p) ? 'checked' : '')}>${avatar(ctx, p)}${pname(ctx, p)}</label></li>`)}</ul></details></div>
        </section>
        <button class="btn" data-variant="outline" type="button" data-action="archive" data-card="${c.id}">${icon('box')}${ctx.t('card.archive')}</button>
      </aside>
    </div>
  </article>`, 'board', top);
}

// ---- Due dates (Timeline) ----
function dueScreen(ctx) {
  const withDue = ctx.s.cards.filter((c) => c.due && c.col !== 'done').sort((a, b) => a.due.localeCompare(b.due));
  const weekEnd = '2026-10-25';
  const groups = [['overdue', withDue.filter((c) => c.due < TODAY)], ['week', withDue.filter((c) => c.due >= TODAY && c.due <= weekEnd)], ['later', withDue.filter((c) => c.due > weekEnd)]].filter(([, l]) => l.length);
  return shell(ctx, html`<section class="mx-auto grid max-w-3xl gap-6 p-4 @3xl:p-8">
    <h1 class="text-2xl font-semibold">${ctx.t('due.title')}</h1>
    ${groups.length ? groups.map(([g, list]) => html`<section data-block="Timeline" aria-labelledby="bd-due-${g}">
      <h2 id="bd-due-${g}" class="text-sm font-medium ${g === 'overdue' ? 'text-destructive' : ''}">${ctx.t('due.' + g)}</h2>
      <ol class="mt-3 grid">${list.map((c) => { const b = ctx.s.boards.find((x) => x.id === c.board); return html`<li class="relative grid grid-cols-[1.5rem_1fr] gap-x-3 pb-6 last:pb-0 before:absolute before:left-3 before:top-6 before:bottom-0 before:w-px before:bg-border last:before:hidden">
        ${g === 'overdue' ? html`<span class="grid size-6 place-items-center rounded-full bg-destructive text-white" aria-hidden="true">${icon('alert', 'size-3.5')}</span>` : html`<span class="grid size-6 place-items-center rounded-full border bg-background" aria-hidden="true"><span class="size-2 rounded-full bg-muted-foreground"></span></span>`}
        <div class="grid gap-1"><a href="#" class="text-sm font-medium hover:underline" data-go="card" data-param='${JSON.stringify({ cardId: c.id, boardId: c.board })}'>${L(ctx, c.title)}</a>
          <p class="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><time datetime="${c.due}">${ctx.date(c.due + 'T12:00:00', { weekday: 'short', month: 'short', day: 'numeric' })}</time>
            <span>·</span><span>${ctx.t('due.in', { board: L(ctx, b.name) })}</span><span class="badge" data-variant="secondary">${ctx.t('col.' + c.col)}</span>${c.who.map((p) => avatar(ctx, p))}</p></div></li>`; })}</ol>
    </section>`) : html`<div data-block="EmptyState" class="empty rounded-lg border border-dashed"><header><figure>${icon('calendar')}</figure><h3>${ctx.t('due.none')}</h3><p>${ctx.t('due.none_text')}</p></header></div>`}
  </section>`, 'due');
}

// ---- Members (Invite + Roles) ----
function membersScreen(ctx) {
  const b = board(ctx);
  const roleSel = (id, val, action, data = '') => html`<select class="select" id="${id}" ${raw(action ? `data-change="${action}"` : 'name="role"')} ${raw(data)}>${['member', 'viewer'].map((r) => html`<option value="${r}" ${raw(val === r ? 'selected' : '')}>${ctx.t('roles.' + r)}</option>`)}</select>`;
  const e = ctx.s.invErr;
  return shell(ctx, html`<section class="mx-auto grid max-w-3xl gap-6 p-4 @3xl:p-8">
    <div><h1 class="text-2xl font-semibold">${ctx.t('members.title')}</h1><p class="text-muted-foreground text-sm">${ctx.t('members.lede', { board: L(ctx, b.name) })}</p></div>
    <form data-block="Invite" class="card" data-submit="invite" novalidate>
      <header><h2 class="text-base font-semibold">${ctx.t('invite.title')}</h2></header>
      <section class="grid gap-4 @3xl:grid-cols-[minmax(0,1fr)_10rem_auto] @3xl:items-start">
        <div class="field"><label class="label" for="bd-inv-emails">${ctx.t('invite.emails')}</label>
          <input class="input" id="bd-inv-emails" name="emails" type="text" inputmode="email" autocomplete="off" placeholder="${ctx.t('invite.emails_hint')}" value="${ctx.s.invDraft || ''}" ${raw(e ? 'aria-invalid="true" aria-describedby="bd-inv-err"' : 'aria-describedby="bd-inv-help"')}>
          ${e ? html`<p id="bd-inv-err" class="text-destructive text-sm">${ctx.t(e.key, e.vars)}</p>` : html`<p id="bd-inv-help" class="text-muted-foreground text-sm">${ctx.t('invite.emails_help')}</p>`}</div>
        <div class="field"><label class="label" for="bd-inv-role">${ctx.t('invite.role')}</label>${roleSel('bd-inv-role', 'member')}</div>
        <button class="btn @3xl:mt-[1.6rem]" type="submit">${ctx.t('invite.send')}</button>
      </section>
    </form>
    <section data-block="Roles" class="grid gap-3" aria-labelledby="bd-roles-title">
      <h2 id="bd-roles-title" class="text-base font-semibold">${ctx.t('members.title')} <span class="text-muted-foreground font-normal">${b.members.length}</span></h2>
      <ul class="item-group rounded-lg border">${b.members.map(([p, r]) => html`<li class="item">
        <figure>${avatar(ctx, p, 'default')}</figure>
        <section><h3><span class="block">${pname(ctx, p)}${p === 'ak' ? html` <span class="text-muted-foreground font-normal">(${ctx.t('roles.you')})</span>` : ''}</span></h3><p>${PEOPLE[p].email}</p></section>
        <aside class="flex flex-wrap items-center gap-2">${r === 'owner'
          ? html`<span class="badge">${ctx.t('roles.owner')}</span>`
          : html`<label class="sr-only" for="bd-role-${p}">${ctx.t('invite.role')}</label>${roleSel('bd-role-' + p, r, 'setRole', `data-who="${p}"`)}<button class="btn" data-variant="ghost" data-size="sm" type="button" data-action="removeMember" data-who="${p}">${ctx.t('roles.remove')}</button>`}</aside>
      </li>`)}
      ${ctx.s.invites.map((iv, i) => html`<li class="item">
        <figure><span class="avatar" role="img" aria-label="${iv.email}"><span>${iv.email[0].toUpperCase()}</span></span></figure>
        <section><h3><span class="block">${iv.email}</span></h3><p><span class="badge" data-variant="outline">${ctx.t('invite.pending')}</span> ${ctx.t('roles.' + iv.role)}</p></section>
        <aside class="flex flex-wrap gap-2"><button class="btn" data-variant="outline" data-size="sm" type="button" data-action="resend" data-i="${i}">${ctx.t('invite.resend')}</button><button class="btn" data-variant="ghost" data-size="sm" type="button" data-action="cancelInvite" data-i="${i}">${ctx.t('invite.cancel')}</button></aside>
      </li>`)}</ul>
      <dl class="grid gap-1 text-sm text-muted-foreground">${['owner', 'member', 'viewer'].map((r) => html`<div class="flex gap-2"><dt class="font-medium text-foreground">${ctx.t('roles.' + r)}</dt><dd>${ctx.t('roles.' + r + '_help')}</dd></div>`)}</dl>
    </section>
  </section>`, 'members');
}

// ---- moving cards ----
function moveCard(ctx, id, col, beforeId) {
  const c = ctx.s.cards.find((x) => x.id === id);
  if (!c) return;
  const from = c.col;
  const arr = ctx.s.cards;
  arr.splice(arr.indexOf(c), 1);
  c.col = col;
  let at = beforeId ? arr.findIndex((x) => x.id === beforeId) : -1;
  if (at < 0) { const last = arr.map((x, i) => [x, i]).filter(([x]) => x.board === c.board && x.col === col).pop(); at = last ? last[1] + 1 : arr.length; }
  arr.splice(at, 0, c);
  if (from !== col) log(ctx, { who: 'ak', what: 'moved', card: id, to: col });
  return from !== col;
}
function posOf(ctx, c) { return cardsOf(ctx, board(ctx), c.col).indexOf(c) + 1; }

let saveTimer = null;
export default {
  id: 'board', icon: 'board', host: 'pinwheel.local', archetype: 'AppBoard', start: 'board',
  name: { en: 'Pinwheel', ja: 'ピンホイール' }, short: { en: 'Board', ja: 'ボード' },
  about: { en: 'A kanban project board: drag cards between columns or move them with the keyboard, add cards inline, open a card for its details, see due dates and invite people.', ja: 'かんばん式のプロジェクトボード。カードをドラッグやキーボードで移動、その場で追加、詳細の編集、期限の一覧、メンバーの招待ができます。' },
  try: { en: 'Drag “Poster layout” to Done, or focus a card and press Space, then the arrow keys. Add a card with an empty title to see the error. Open a card, set a due date and comment. On the phone, the columns are tabs.', ja: '「ポスターのレイアウト」を「完了」へドラッグするか、カードを選んでスペースと矢印キーで移動。空のタイトルで追加するとエラーを表示します。カードを開いて期限とコメントを試せます。スマートフォンでは列がタブになります。' },
  messages: M,
  init: () => seed(),
  render(ctx) {
    const r = ctx.s.route;
    if (r === 'boards') return boards(ctx);
    if (r === 'card') return cardScreen(ctx);
    if (r === 'due') return dueScreen(ctx);
    if (r === 'members') return membersScreen(ctx);
    return boardScreen(ctx);
  },
  mount(ctx, root) {
    if (root._bd) return;
    let dragId = null;
    const clearMarks = () => root.querySelectorAll('[data-drop-over]').forEach((el) => { el.removeAttribute('data-drop-over'); el.classList.remove('ring-2', 'ring-ring'); });
    const h = {
      dragstart(e) { const a = e.target.closest?.('[data-card][draggable]'); if (!a) return; dragId = +a.dataset.card; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(dragId)); setTimeout(() => a.classList.add('opacity-50'), 0); },
      dragover(e) { if (dragId == null) return; const col = e.target.closest?.('[data-column]'); if (!col) return; e.preventDefault(); if (!col.hasAttribute('data-drop-over')) { clearMarks(); col.setAttribute('data-drop-over', ''); col.classList.add('ring-2', 'ring-ring'); } },
      drop(e) {
        if (dragId == null) return; const col = e.target.closest?.('[data-column]'); if (!col) return; e.preventDefault();
        const cards = [...col.querySelectorAll('[data-card][draggable]')].filter((x) => +x.dataset.card !== dragId);
        const before = cards.find((x) => { const r = x.getBoundingClientRect(); return e.clientY < r.top + r.height / 2; });
        const id = dragId; dragId = null; clearMarks();
        const moved = moveCard(ctx, id, col.dataset.column, before ? +before.dataset.card : null);
        const c = ctx.s.cards.find((x) => x.id === id);
        ctx.s.live = ctx.t('board.live.dropped', { title: L(ctx, c.title), col: ctx.t('col.' + c.col) });
        if (moved) ctx.toast({ category: 'success', title: ctx.t('board.moved_toast', { col: ctx.t('col.' + c.col) }) });
        ctx.rerender();
      },
      dragend() { dragId = null; clearMarks(); root.querySelectorAll('[data-card].opacity-50').forEach((x) => x.classList.remove('opacity-50')); },
    };
    for (const [k, f] of Object.entries(h)) root.addEventListener(k, f);
    root._bd = h;
  },
  unmount(ctx, root) { if (root._bd) { for (const [k, f] of Object.entries(root._bd)) root.removeEventListener(k, f); delete root._bd; } },
  actions: {
    noop: () => false,
    noop2: () => false,
    bsearch(ctx, el) { ctx.s.bq = el.value; },
    bclear(ctx) { ctx.s.bq = ''; },
    newBoard(ctx) {
      ctx.dialog({
        title: ctx.t('newboard.title'), description: ctx.t('newboard.desc'),
        body: html`<form id="bd-nb-form" class="grid gap-2" data-submit="create" novalidate><div class="field"><label class="label" for="bd-nb-name">${ctx.t('newboard.name')}</label>
          <input class="input" id="bd-nb-name" name="name" autocomplete="off" autofocus><p id="bd-nb-err" class="text-destructive text-sm" hidden>${ctx.t('newboard.name_empty')}</p></div></form>`,
        footer: html`<button class="btn" data-variant="outline" type="button" data-close>${ctx.t('newboard.cancel')}</button><button class="btn" type="submit" form="bd-nb-form">${ctx.t('newboard.create')}</button>`,
        onAction(name, el, e, close, d) {
          if (name !== 'create') return;
          const n = (d.name || '').trim();
          if (!n) { const inp = el.querySelector('#bd-nb-name'); inp.setAttribute('aria-invalid', 'true'); inp.setAttribute('aria-describedby', 'bd-nb-err'); el.querySelector('#bd-nb-err').hidden = false; inp.focus(); return; }
          const id = ctx.s.nextId++;
          ctx.s.boards.push({ id, name: n, members: [['ak', 'owner']] });
          close();
          ctx.toast({ category: 'success', title: ctx.t('newboard.created') });
          ctx.s.flabel = ''; ctx.s.fwho = ''; ctx.s.adding = null;
          ctx.go('board', { boardId: id });
        },
      });
      return false;
    },
    flabel(ctx, el) { ctx.s.flabel = el.value; },
    fwho(ctx, el) { ctx.s.fwho = el.value; },
    fclear(ctx) { ctx.s.flabel = ''; ctx.s.fwho = ''; },
    tab(ctx, el) { ctx.s.tab = el.dataset.col; },
    startAdd(ctx, el) {
      ctx.s.adding = el.dataset.col; ctx.s.addingPre = el.dataset.pre || 'd'; ctx.s.addErr = false; ctx.s.addDraft = '';
      if (ctx.s.addingPre === 'p') ctx.s.tab = el.dataset.col;
      setTimeout(() => document.getElementById(`${ctx.s.addingPre}-add-${ctx.s.adding}`)?.focus(), 0);
    },
    cancelAdd(ctx) { ctx.s.adding = null; ctx.s.addErr = false; },
    addKey(ctx, el, e) {
      if (e.key === 'Escape') { ctx.s.adding = null; return true; }
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); el.form.requestSubmit(); }
      return false;
    },
    addCard(ctx, f, e, d) {
      const title = (d.title || '').trim();
      if (!title) { ctx.s.addErr = true; ctx.s.addDraft = ''; setTimeout(() => document.getElementById(`${ctx.s.addingPre}-add-${ctx.s.adding}`)?.focus(), 0); return; }
      const id = ctx.s.nextId++;
      const b = board(ctx);
      ctx.s.cards.push({ id, board: b.id, col: d.col, title, body: '', labels: [], who: ['ak'], due: '' });
      log(ctx, { who: 'ak', what: 'created', card: id });
      ctx.s.addErr = false; ctx.s.addDraft = '';
      setTimeout(() => document.getElementById(`${ctx.s.addingPre}-add-${d.col}`)?.focus(), 0);
    },
    moveTo(ctx, el) {
      const id = +el.dataset.card; const col = el.dataset.col;
      moveCard(ctx, id, col);
      const c = ctx.s.cards.find((x) => x.id === id);
      ctx.s.live = ctx.t('board.live.dropped', { title: L(ctx, c.title), col: ctx.t('col.' + col) });
      ctx.toast({ category: 'success', title: ctx.t('board.moved_toast', { col: ctx.t('col.' + col) }) });
      setTimeout(() => document.getElementById(`${ctx.device === 'phone' ? 'p' : 'd'}-card-${id}`)?.focus(), 0);
    },
    cardKey(ctx, el, e) {
      const id = +el.dataset.card;
      const c = ctx.s.cards.find((x) => x.id === id);
      const pre = el.id.split('-')[0];
      const refocus = () => setTimeout(() => document.getElementById(`${pre}-card-${id}`)?.focus(), 0);
      const say = (k) => { ctx.s.live = ctx.t(k, { title: L(ctx, c.title), col: ctx.t('col.' + c.col), pos: posOf(ctx, c) }); };
      if (e.target !== el) return false;
      if (ctx.s.picked !== id) {
        if (e.key === 'Enter') { e.preventDefault(); ctx.go('card', { cardId: id }); return false; }
        if (e.key === ' ') { e.preventDefault(); ctx.s.picked = id; ctx.s.pickFrom = { col: c.col, idx: ctx.s.cards.indexOf(c) }; say('board.live.picked'); refocus(); return true; }
        return false;
      }
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault(); const from = ctx.s.pickFrom.col; ctx.s.picked = null; say('board.live.dropped');
        if (from !== c.col) { log(ctx, { who: 'ak', what: 'moved', card: id, to: c.col }); ctx.toast({ category: 'success', title: ctx.t('board.moved_toast', { col: ctx.t('col.' + c.col) }) }); }
        refocus(); return true;
      }
      if (e.key === 'Escape') {
        e.preventDefault(); const arr = ctx.s.cards; arr.splice(arr.indexOf(c), 1); c.col = ctx.s.pickFrom.col; arr.splice(ctx.s.pickFrom.idx, 0, c);
        ctx.s.picked = null; ctx.s.live = ctx.t('board.live.cancelled'); refocus(); return true;
      }
      const ci = COLS.indexOf(c.col);
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault(); const ni = ci + (e.key === 'ArrowRight' ? 1 : -1); if (ni < 0 || ni >= COLS.length) return false;
        const arr = ctx.s.cards; arr.splice(arr.indexOf(c), 1); c.col = COLS[ni];
        const last = arr.map((x, i) => [x, i]).filter(([x]) => x.board === c.board && x.col === c.col).pop(); arr.splice(last ? last[1] + 1 : arr.length, 0, c);
        if (pre === 'p') ctx.s.tab = c.col;
        say('board.live.moved'); refocus(); return true;
      }
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault(); const same = cardsOf(ctx, board(ctx), c.col); const i = same.indexOf(c); const j = i + (e.key === 'ArrowDown' ? 1 : -1);
        if (j < 0 || j >= same.length) return false;
        const arr = ctx.s.cards; const a = arr.indexOf(c), b2 = arr.indexOf(same[j]); [arr[a], arr[b2]] = [arr[b2], arr[a]];
        say('board.live.moved'); refocus(); return true;
      }
      return false;
    },
    async archive(ctx, el) {
      const id = +el.dataset.card;
      const c = ctx.s.cards.find((x) => x.id === id);
      const t = L(ctx, c.title);
      const ok = await ctx.confirm({ title: ctx.t('card.archive_title', { title: t }), body: ctx.t('card.archive_body'), ok: ctx.t('card.archive_ok'), cancel: ctx.t('roles.cancel') });
      if (!ok) return false;
      const i = ctx.s.cards.indexOf(c);
      ctx.s.cards.splice(i, 1);
      log(ctx, { who: 'ak', what: 'archived', card: id });
      ctx.toast({ category: 'success', title: ctx.t('card.archived'), description: t, duration: 8000,
        action: { label: ctx.t('card.undo'), run: () => { ctx.s.cards.splice(i, 0, c); ctx.toast({ category: 'info', title: ctx.t('card.restored') }); ctx.rerender(); } } });
      if (ctx.s.route === 'card') { ctx.go('board', { boardId: c.board }); return false; }
    },
    editTitle(ctx, el) { const c = ctx.s.cards.find((x) => x.id === ctx.s.cardId); c.title = el.value; return saved(ctx); },
    editBody(ctx, el) { const c = ctx.s.cards.find((x) => x.id === ctx.s.cardId); c.body = el.value; return saved(ctx); },
    setCol(ctx, el) {
      moveCard(ctx, ctx.s.cardId, el.value);
      ctx.toast({ category: 'success', title: ctx.t('board.moved_toast', { col: ctx.t('col.' + el.value) }) });
    },
    setDue(ctx, el) { ctx.s.cards.find((x) => x.id === ctx.s.cardId).due = el.value; },
    clearDue(ctx) { ctx.s.cards.find((x) => x.id === ctx.s.cardId).due = ''; },
    toggleLabel(ctx, el) {
      const c = ctx.s.cards.find((x) => x.id === ctx.s.cardId);
      c.labels = el.checked ? [...c.labels, el.value] : c.labels.filter((l) => l !== el.value);
      ctx.s.openLabels = true;
    },
    toggleWho(ctx, el) {
      const c = ctx.s.cards.find((x) => x.id === ctx.s.cardId);
      c.who = el.checked ? [...c.who, el.value] : c.who.filter((p) => p !== el.value);
      ctx.s.openWho = true;
    },
    comment(ctx, f, e, d) {
      const text = (d.text || '').trim();
      if (!text) { ctx.s.cmErr = true; setTimeout(() => document.getElementById('bd-cm-text')?.focus(), 0); return; }
      (ctx.s.comments[ctx.s.cardId] ||= []).push({ who: 'ak', text, at: '2026-10-18T09:05' });
      log(ctx, { who: 'ak', what: 'commented', card: ctx.s.cardId });
      ctx.s.cmErr = false; ctx.s.cmDraft = '';
    },
    invite(ctx, f, e, d) {
      const list = (d.emails || '').split(/[,\s、]+/).map((x) => x.trim()).filter(Boolean);
      ctx.s.invDraft = d.emails;
      if (!list.length) { ctx.s.invErr = { key: 'invite.error.empty' }; return; }
      const bad = list.find((x) => !/^\S+@\S+\.\S+$/.test(x));
      if (bad) { ctx.s.invErr = { key: 'invite.error.bad', vars: { email: bad } }; return; }
      list.forEach((email) => ctx.s.invites.push({ email, role: d.role }));
      ctx.s.invErr = null; ctx.s.invDraft = '';
      ctx.toast({ category: 'success', title: list.length === 1 ? ctx.t('invite.sent_one') : ctx.t('invite.sent', { n: list.length }) });
    },
    resend(ctx) { ctx.toast({ category: 'success', title: ctx.t('invite.resent') }); return false; },
    cancelInvite(ctx, el) { ctx.s.invites.splice(+el.dataset.i, 1); },
    setRole(ctx, el) {
      const b = board(ctx); const m = b.members.find(([p]) => p === el.dataset.who); m[1] = el.value;
      ctx.toast({ category: 'success', title: ctx.t('roles.changed', { name: pname(ctx, m[0]), role: ctx.t('roles.' + el.value) }) });
    },
    async removeMember(ctx, el) {
      const p = el.dataset.who; const name = pname(ctx, p);
      const ok = await ctx.confirm({ title: ctx.t('roles.remove_title', { name }), body: ctx.t('roles.remove_body'), ok: ctx.t('roles.remove_ok'), cancel: ctx.t('roles.cancel'), danger: true });
      if (!ok) return false;
      const b = board(ctx); b.members = b.members.filter(([x]) => x !== p);
      ctx.s.cards.filter((c) => c.board === b.id).forEach((c) => { c.who = c.who.filter((x) => x !== p); });
      ctx.toast({ category: 'success', title: ctx.t('roles.removed', { name }) });
    },
  },
};

function saved(ctx) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => ctx.toast({ category: 'success', title: ctx.t('card.saved'), duration: 1500 }), 900);
  return false;
}
