// Class Notes: AppNotes-style study notes, built from LogIn, SidePanel, TopBar, BottomBar, ListSearch, EmptyState,
// DetailView, DocEditor, SavedState, EditForm, ConfirmDialog, DeleteUndo, Dashboard, KpiTile, BarChart, SettingsPage.
import { html, raw, icon } from '../kit.js';

const SUBJECTS = ['vocabulary', 'grammar', 'kanji'];
const NOW = Date.parse('2026-10-18T09:00:00+09:00');
const seed = () => [
  { id: 40, title: { en: 'Week 3 · Vocabulary', ja: '第3週・単語' }, subject: 'vocabulary', body: { en: '駅 (eki) station\n電車 (densha) train\n切符 (kippu) ticket\n乗り換え (norikae) change trains', ja: '駅（えき）station\n電車（でんしゃ）train\n切符（きっぷ）ticket\n乗り換え（のりかえ）change trains' }, edited: NOW - 2 * 3600e3 },
  { id: 41, title: { en: 'Te-form practice', ja: 'て形の練習' }, subject: 'grammar', body: { en: 'Verbs: 食べる → 食べて, 行く → 行って, する → して.\nThe exception: 行く.', ja: '動詞：食べる → 食べて、行く → 行って、する → して。\n例外は「行く」。' }, edited: NOW - 26 * 3600e3 },
  { id: 42, title: { en: 'Kanji quiz, lessons 4–6', ja: '漢字テスト 第4〜6課' }, subject: 'kanji', body: { en: 'Tuesday. 学校, 先生, 時間, 毎日.', ja: '火曜日。学校、先生、時間、毎日。' }, edited: NOW - 3 * 86400e3 },
  { id: 43, title: { en: 'Counters for things', ja: 'ものの数え方' }, subject: 'grammar', body: { en: '〜つ, 〜本 (long things), 〜枚 (flat things), 〜匹 (small animals).', ja: '〜つ、〜本（長いもの）、〜枚（平たいもの）、〜匹（小さい動物）。' }, edited: NOW - 5 * 86400e3 },
  { id: 44, title: { en: 'Station signs', ja: '駅の案内表示' }, subject: 'vocabulary', body: { en: '出口 exit, 入口 entrance, 改札 ticket gate, 何番線 which platform.', ja: '出口、入口、改札、何番線。' }, edited: NOW - 8 * 86400e3 },
];

const M = {
  en: {
    'app.name': 'Class Notes', 'nav.main': 'Main', 'nav.notes': 'Notes', 'nav.progress': 'Progress', 'nav.settings': 'Settings', 'nav.new': 'New Note',
    'login.title': 'Log In', 'login.lede': 'Welcome back. Log in to see your notes.', 'login.email': 'Email', 'login.password': 'Password',
    'login.forgot': 'Forgot your password?', 'login.remember': 'Keep me logged in on this device', 'login.submit': 'Log In', 'login.no_account': 'No account yet?', 'login.signup': 'Sign Up',
    'login.error.title': 'Couldn’t log you in', 'login.error.wrong': 'The email or password is wrong. Check both and try again.',
    'login.error.email_empty': 'Enter your email.', 'login.error.email_invalid': 'Enter an email like name@example.com.', 'login.error.password_empty': 'Enter your password.', 'login.hint': 'Any email and a password of 4+ characters works here. “wrong” shows the error.',
    'list.title': 'Notes', 'list.search': 'Search notes', 'list.search_hint': 'Search titles and text…', 'list.subject': 'Subject', 'list.subject_all': 'All subjects', 'list.sort': 'Sort', 'list.sort_recent': 'Recently edited', 'list.sort_title': 'Title A–Z',
    'list.count': '{n} notes', 'list.count_one': '1 note', 'subject.vocabulary': 'Vocabulary', 'subject.grammar': 'Grammar', 'subject.kanji': 'Kanji',
    'empty.none_title': 'No notes yet', 'empty.none_text': 'Write a note to keep words and grammar in one place.', 'empty.match_title': 'No notes match “{q}”', 'empty.match_text': 'Check the spelling, or clear the filters.', 'empty.clear': 'Clear Filters',
    'time.hours': '{n} hours ago', 'time.yesterday': 'Yesterday', 'time.days': '{n} days ago', 'time.now': 'Just now',
    'detail.back': 'Notes', 'detail.edited': 'Edited {when}', 'detail.delete': 'Delete…', 'detail.more': 'More', 'detail.title': 'Title', 'detail.body': 'Note',
    'saved.saving': 'Saving…', 'saved.at': 'Saved', 'saved.unsaved': 'Not saved yet',
    'delete.title': 'Delete “{title}”?', 'delete.body': 'You can undo this for 8 seconds.', 'delete.ok': 'Delete Note', 'delete.cancel': 'Cancel', 'delete.done': 'Note deleted', 'delete.undo': 'Undo', 'delete.restored': 'Note restored',
    'form.new': 'New Note', 'form.title': 'Title', 'form.subject': 'Subject', 'form.body': 'Note', 'form.body_hint': 'Words, grammar or anything to remember.', 'form.save': 'Save Note', 'form.cancel': 'Cancel',
    'form.error.summary': 'Fix 1 thing before saving', 'form.error.title_empty': 'Write a title first.', 'form.error.title_long': 'Keep it under 120 characters.', 'form.saved': 'Note saved',
    'progress.title': 'Progress', 'progress.notes': 'Notes', 'progress.words': 'Words learned', 'progress.streak': 'Study streak', 'progress.days': '{n} days', 'progress.trend_up': '+{n} this week',
    'progress.chart': 'Notes written per week', 'progress.chart_sub': 'Last 8 weeks, by subject', 'progress.table': 'Show as a table', 'progress.week': 'Week',
    'settings.title': 'Settings', 'settings.language': 'Language', 'settings.language_help': 'The app and its dates use this language.', 'settings.appearance': 'Appearance',
    'settings.theme.system': 'Match System', 'settings.theme.light': 'Light', 'settings.theme.dark': 'Dark', 'settings.account': 'Account', 'settings.logout': 'Log Out', 'settings.saved': 'Settings saved',
  },
  ja: {
    'app.name': 'クラスノート', 'nav.main': 'メイン', 'nav.notes': 'ノート', 'nav.progress': '進み具合', 'nav.settings': '設定', 'nav.new': '新規ノート',
    'login.title': 'ログイン', 'login.lede': 'おかえりなさい。ログインしてノートを表示します。', 'login.email': 'メールアドレス', 'login.password': 'パスワード',
    'login.forgot': 'パスワードをお忘れですか？', 'login.remember': 'このデバイスでログインしたままにする', 'login.submit': 'ログイン', 'login.no_account': 'アカウントをお持ちでない場合', 'login.signup': '新規登録',
    'login.error.title': 'ログインできませんでした', 'login.error.wrong': 'メールアドレスまたはパスワードが正しくありません。両方を確認して、もう一度お試しください。',
    'login.error.email_empty': 'メールアドレスを入力してください。', 'login.error.email_invalid': 'name@example.com の形式で入力してください。', 'login.error.password_empty': 'パスワードを入力してください。', 'login.hint': 'ここでは任意のメールアドレスと4文字以上のパスワードでログインできます。「wrong」と入力するとエラーを表示します。',
    'list.title': 'ノート', 'list.search': 'ノートを検索', 'list.search_hint': 'タイトルと本文を検索…', 'list.subject': '科目', 'list.subject_all': 'すべての科目', 'list.sort': '並べ替え', 'list.sort_recent': '編集が新しい順', 'list.sort_title': 'タイトル順',
    'list.count': '{n}件のノート', 'list.count_one': '1件のノート', 'subject.vocabulary': '単語', 'subject.grammar': '文法', 'subject.kanji': '漢字',
    'empty.none_title': 'ノートはまだありません', 'empty.none_text': '単語や文法をノートにまとめましょう。', 'empty.match_title': '「{q}」に一致するノートはありません', 'empty.match_text': 'つづりを確認するか、絞り込みを解除してください。', 'empty.clear': '絞り込みを解除',
    'time.hours': '{n}時間前', 'time.yesterday': '昨日', 'time.days': '{n}日前', 'time.now': 'たった今',
    'detail.back': 'ノート', 'detail.edited': '{when}に編集', 'detail.delete': '削除…', 'detail.more': 'その他', 'detail.title': 'タイトル', 'detail.body': 'ノート',
    'saved.saving': '保存中…', 'saved.at': '保存しました', 'saved.unsaved': '未保存',
    'delete.title': '「{title}」を削除しますか？', 'delete.body': '8秒間は元に戻せます。', 'delete.ok': 'ノートを削除', 'delete.cancel': 'キャンセル', 'delete.done': 'ノートを削除しました', 'delete.undo': '元に戻す', 'delete.restored': 'ノートを元に戻しました',
    'form.new': '新規ノート', 'form.title': 'タイトル', 'form.subject': '科目', 'form.body': 'ノート', 'form.body_hint': '単語、文法、覚えておきたいことなど。', 'form.save': 'ノートを保存', 'form.cancel': 'キャンセル',
    'form.error.summary': '保存する前に1か所直してください', 'form.error.title_empty': 'タイトルを入力してください。', 'form.error.title_long': '120文字以内にしてください。', 'form.saved': 'ノートを保存しました',
    'progress.title': '進み具合', 'progress.notes': 'ノート', 'progress.words': '覚えた単語', 'progress.streak': '連続学習', 'progress.days': '{n}日', 'progress.trend_up': '今週 +{n}',
    'progress.chart': '週ごとのノート数', 'progress.chart_sub': '過去8週間、科目別', 'progress.table': '表で表示', 'progress.week': '週',
    'settings.title': '設定', 'settings.language': '言語', 'settings.language_help': 'アプリと日付の表示に使う言語です。', 'settings.appearance': '外観',
    'settings.theme.system': 'システムに合わせる', 'settings.theme.light': 'ライト', 'settings.theme.dark': 'ダーク', 'settings.account': 'アカウント', 'settings.logout': 'ログアウト', 'settings.saved': '設定を保存しました',
  },
};

const ago = (ctx, t) => {
  const h = Math.round((NOW - t) / 3600e3);
  if (h < 1) return ctx.t('time.now');
  if (h < 24) return ctx.t('time.hours', { n: h });
  const d = Math.round(h / 24);
  return d === 1 ? ctx.t('time.yesterday') : ctx.t('time.days', { n: d });
};
const L = (ctx, v) => (typeof v === 'string' ? v : v[ctx.lang] || v.en);

// ---- shell: SidePanel on the desktop, TopBar + BottomBar on the phone ----
const NAV = [['notes', 'file', 'nav.notes'], ['progress', 'chart', 'nav.progress'], ['settings', 'settings', 'nav.settings']];
function shell(ctx, body, active) {
  return html`<div class="flex h-full flex-col @3xl:flex-row">
    <aside data-block="SidePanel" class="hidden w-60 shrink-0 flex-col gap-1 border-r bg-sidebar p-3 text-sm text-sidebar-foreground @3xl:flex" aria-label="${ctx.t('nav.main')}">
      <p class="flex items-center gap-2 px-2 pb-3 pt-1 font-semibold">${icon('file', 'size-4')}${ctx.t('app.name')}</p>
      <button class="btn mb-2 justify-start" type="button" data-go="new">${icon('plus')}${ctx.t('nav.new')}</button>
      <nav class="grid gap-0.5">
        ${NAV.map(([r, i, k]) => html`<a href="#" data-go="${r}" ${raw(active === r ? 'aria-current="page"' : '')} class="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-sidebar-accent aria-[current=page]:bg-sidebar-accent aria-[current=page]:font-medium">${icon(i, 'size-4')}<span>${ctx.t(k)}</span>${r === 'notes' ? html`<span class="badge ml-auto" data-variant="secondary">${ctx.s.notes.length}</span>` : ''}</a>`)}
      </nav>
    </aside>
    <div class="flex min-h-0 min-w-0 flex-1 flex-col">
      <header data-block="TopBar" class="flex h-14 shrink-0 items-center gap-2 border-b px-4 @3xl:hidden">
        <h1 class="flex-1 truncate text-base font-semibold">${ctx.t('app.name')}</h1>
        <button class="btn" data-variant="ghost" data-size="icon" type="button" aria-label="${ctx.t('nav.new')}" data-go="new">${icon('plus')}</button>
      </header>
      <main class="min-h-0 flex-1 overflow-y-auto" data-scroll="main">${body}</main>
      <nav data-block="BottomBar" class="grid shrink-0 grid-cols-3 border-t bg-background @3xl:hidden" aria-label="${ctx.t('nav.main')}">
        ${NAV.map(([r, i, k]) => html`<a href="#" data-go="${r}" ${raw(active === r ? 'aria-current="page"' : '')} class="flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] text-muted-foreground aria-[current=page]:font-medium aria-[current=page]:text-foreground">${icon(i, 'size-5')}<span>${ctx.t(k)}</span></a>`)}
      </nav>
    </div>
  </div>`;
}

// ---- screens ----
function login(ctx) {
  const e = ctx.s.loginErr || {};
  return html`<main class="grid h-full place-items-center overflow-y-auto bg-muted/40 p-4">
    <form data-block="LogIn" data-submit="login" class="card w-full max-w-sm" novalidate>
      <header><h1 class="text-xl font-semibold">${ctx.t('login.title')}</h1><p class="text-muted-foreground text-sm">${ctx.t('login.lede')}</p></header>
      <section class="grid gap-4">
        ${e.wrong ? html`<div class="alert" data-variant="destructive" role="alert"><h2>${ctx.t('login.error.title')}</h2><section>${ctx.t('login.error.wrong')}</section></div>` : ''}
        <div class="field">
          <label class="label" for="nt-email">${ctx.t('login.email')}</label>
          <input class="input" id="nt-email" name="email" type="email" autocomplete="email" value="${ctx.s.email || 'aiko@example.com'}" ${raw(e.email ? 'aria-invalid="true" aria-describedby="nt-email-err"' : '')}>
          ${e.email ? html`<p class="text-destructive text-sm" id="nt-email-err">${ctx.t(e.email)}</p>` : ''}
        </div>
        <div class="field">
          <div class="flex items-center justify-between gap-2"><label class="label" for="nt-pass">${ctx.t('login.password')}</label><a class="text-sm underline-offset-4 hover:underline" href="#">${ctx.t('login.forgot')}</a></div>
          <input class="input" id="nt-pass" name="password" type="password" autocomplete="current-password" ${raw(e.password ? 'aria-invalid="true" aria-describedby="nt-pass-err"' : '')}>
          ${e.password ? html`<p class="text-destructive text-sm" id="nt-pass-err">${ctx.t(e.password)}</p>` : ''}
        </div>
        <label class="label gap-2 font-normal"><input class="input" type="checkbox" name="remember" checked><span>${ctx.t('login.remember')}</span></label>
      </section>
      <footer class="grid gap-3">
        <button class="btn w-full" type="submit">${ctx.t('login.submit')}</button>
        <p class="text-muted-foreground text-center text-sm">${ctx.t('login.no_account')} <a class="text-foreground underline underline-offset-4" href="#">${ctx.t('login.signup')}</a></p>
        <p class="text-muted-foreground text-center text-xs">${ctx.t('login.hint')}</p>
      </footer>
    </form>
  </main>`;
}

function filtered(ctx) {
  const { q = '', subject = '', sort = 'recent' } = ctx.s;
  const needle = q.trim().toLowerCase();
  let list = ctx.s.notes.filter((n) => (!subject || n.subject === subject) && (!needle || (L(ctx, n.title) + ' ' + L(ctx, n.body)).toLowerCase().includes(needle)));
  list = list.sort(sort === 'title' ? (a, b) => L(ctx, a.title).localeCompare(L(ctx, b.title), ctx.lang) : (a, b) => b.edited - a.edited);
  return list;
}
function notes(ctx) {
  const list = filtered(ctx);
  const { q = '', subject = '', sort = 'recent' } = ctx.s;
  const empty = !ctx.s.notes.length
    ? html`<div data-block="EmptyState" class="empty rounded-lg border border-dashed"><header><figure>${icon('file')}</figure><h3>${ctx.t('empty.none_title')}</h3><p>${ctx.t('empty.none_text')}</p></header><footer class="flex-row"><button class="btn" type="button" data-go="new">${ctx.t('nav.new')}</button></footer></div>`
    : html`<div data-block="EmptyState" class="empty rounded-lg border border-dashed"><header><figure>${icon('search')}</figure><h3>${ctx.t('empty.match_title', { q: q || ctx.t('subject.' + subject) })}</h3><p>${ctx.t('empty.match_text')}</p></header><footer class="flex-row"><button class="btn" data-variant="outline" type="button" data-action="clear">${ctx.t('empty.clear')}</button></footer></div>`;
  return shell(ctx, html`<section data-block="ListSearch" class="grid gap-4 p-4 @3xl:p-8" aria-labelledby="nt-title">
    <div class="flex items-center justify-between gap-3"><h1 id="nt-title" class="text-2xl font-semibold">${ctx.t('list.title')}</h1><button class="btn hidden @3xl:inline-flex" type="button" data-go="new">${icon('plus')}${ctx.t('nav.new')}</button></div>
    <form role="search" class="flex flex-wrap items-end gap-3" data-submit="noop">
      <label class="input-group w-full @3xl:w-72">
        <span data-align="start">${icon('search', 'size-4')}</span>
        <input id="nt-q" type="search" name="q" value="${q}" placeholder="${ctx.t('list.search_hint')}" aria-label="${ctx.t('list.search')}" data-input="search" autocomplete="off">
      </label>
      <div class="grid gap-1.5"><label class="label" for="nt-subject">${ctx.t('list.subject')}</label>
        <select id="nt-subject" class="select" data-change="subject"><option value="">${ctx.t('list.subject_all')}</option>${SUBJECTS.map((s) => html`<option value="${s}" ${raw(s === subject ? 'selected' : '')}>${ctx.t('subject.' + s)}</option>`)}</select></div>
      <div class="grid gap-1.5"><label class="label" for="nt-sort">${ctx.t('list.sort')}</label>
        <select id="nt-sort" class="select" data-change="sort"><option value="recent">${ctx.t('list.sort_recent')}</option><option value="title" ${raw(sort === 'title' ? 'selected' : '')}>${ctx.t('list.sort_title')}</option></select></div>
    </form>
    <div class="grid gap-3" aria-live="polite">
      ${list.length ? html`<p class="text-sm text-muted-foreground">${list.length === 1 ? ctx.t('list.count_one') : ctx.t('list.count', { n: list.length })}</p>
      <ul class="grid gap-2">${list.map((n) => html`<li><a href="#" class="item" data-variant="outline" data-go="note" data-param='${JSON.stringify({ noteId: n.id })}'>
        <section><h3>${L(ctx, n.title)}</h3><p class="line-clamp-1">${L(ctx, n.body).split('\n')[0]}</p></section>
        <aside class="flex flex-col items-end gap-1 text-xs text-muted-foreground"><span class="badge" data-variant="secondary">${ctx.t('subject.' + n.subject)}</span><span>${ago(ctx, n.edited)}</span></aside></a></li>`)}</ul>` : empty}
    </div>
  </section>`, 'notes');
}

function note(ctx) {
  const n = ctx.s.notes.find((x) => x.id === ctx.s.noteId);
  if (!n) return notes(ctx);
  const sv = ctx.s.saving ? ctx.t('saved.saving') : ctx.t('saved.at');
  return shell(ctx, html`<article data-block="DetailView" class="mx-auto grid max-w-3xl gap-4 p-4 @3xl:p-8">
    <nav class="breadcrumb" data-block="Breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="#" data-go="notes">${ctx.t('detail.back')}</a></li><li aria-hidden="true">${icon('chevron', 'size-3.5')}</li><li><span aria-current="page">${L(ctx, n.title)}</span></li></ol></nav>
    <div class="flex flex-wrap items-center gap-2">
      <span class="badge" data-variant="secondary">${ctx.t('subject.' + n.subject)}</span>
      <span class="text-sm text-muted-foreground">${ctx.t('detail.edited', { when: ago(ctx, n.edited) })}</span>
      <span data-block="SavedState" class="ml-auto flex items-center gap-1.5 text-sm text-muted-foreground" role="status" aria-live="polite">${ctx.s.saving ? icon('undo', 'size-3.5 animate-spin') : icon('check', 'size-3.5')}${sv}</span>
      <button class="btn" data-variant="outline" data-size="sm" type="button" data-action="askDelete">${icon('trash')}${ctx.t('detail.delete')}</button>
    </div>
    <div data-block="DocEditor" class="grid gap-3">
      <label class="sr-only" for="nt-ed-title">${ctx.t('detail.title')}</label>
      <input id="nt-ed-title" class="w-full bg-transparent text-2xl font-semibold outline-none @3xl:text-3xl" value="${L(ctx, n.title)}" data-input="editTitle">
      <label class="sr-only" for="nt-ed-body">${ctx.t('detail.body')}</label>
      <textarea id="nt-ed-body" class="textarea min-h-72 text-base leading-7" data-input="editBody">${L(ctx, n.body)}</textarea>
    </div>
  </article>`, 'notes');
}

function form(ctx) {
  const f = ctx.s.form || { title: '', subject: 'vocabulary', body: '' };
  const err = ctx.s.formErr;
  return shell(ctx, html`<form data-block="EditForm" data-submit="saveNew" class="mx-auto grid max-w-2xl gap-5 p-4 @3xl:p-8" novalidate>
    <h1 class="text-2xl font-semibold">${ctx.t('form.new')}</h1>
    ${err ? html`<div class="alert" data-variant="destructive" role="alert" tabindex="-1"><h2>${ctx.t('form.error.summary')}</h2><section><a class="underline" href="#nt-f-title">${ctx.t(err)}</a></section></div>` : ''}
    <div class="field"><label class="label" for="nt-f-title">${ctx.t('form.title')}</label>
      <input class="input" id="nt-f-title" name="title" value="${f.title}" maxlength="200" ${raw(err ? 'aria-invalid="true" aria-describedby="nt-f-title-err"' : '')}>
      ${err ? html`<p class="text-destructive text-sm" id="nt-f-title-err">${ctx.t(err)}</p>` : ''}</div>
    <div class="field"><label class="label" for="nt-f-subject">${ctx.t('form.subject')}</label>
      <select class="select" id="nt-f-subject" name="subject">${SUBJECTS.map((s) => html`<option value="${s}" ${raw(s === f.subject ? 'selected' : '')}>${ctx.t('subject.' + s)}</option>`)}</select></div>
    <div class="field"><label class="label" for="nt-f-body">${ctx.t('form.body')}</label>
      <textarea class="textarea min-h-40" id="nt-f-body" name="body" aria-describedby="nt-f-body-help">${f.body}</textarea>
      <p class="text-muted-foreground text-sm" id="nt-f-body-help">${ctx.t('form.body_hint')}</p></div>
    <div class="flex flex-wrap justify-end gap-2"><button class="btn" data-variant="outline" type="button" data-go="notes">${ctx.t('form.cancel')}</button><button class="btn" type="submit">${ctx.t('form.save')}</button></div>
  </form>`, 'notes');
}

const WEEKS = ['Aug 31', 'Sep 7', 'Sep 14', 'Sep 21', 'Sep 28', 'Oct 5', 'Oct 12', 'Oct 19'];
const WEEKS_JA = ['8/31', '9/7', '9/14', '9/21', '9/28', '10/5', '10/12', '10/19'];
const PER = [[2, 1, 0], [3, 1, 1], [1, 2, 1], [4, 1, 2], [2, 3, 1], [3, 2, 2], [5, 2, 1], [2, 1, 1]];
function progress(ctx) {
  const weeks = ctx.lang === 'ja' ? WEEKS_JA : WEEKS;
  const data = weeks.map((w, i) => ({ week: w, vocabulary: PER[i][0], grammar: PER[i][1], kanji: PER[i][2] }));
  const series = Object.fromEntries(SUBJECTS.map((s, i) => [s, { label: ctx.t('subject.' + s), color: `var(--chart-${i + 1})` }]));
  const opts = { scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true, ticks: { display: true, precision: 0 } } } };
  const kpi = (label, value, trend) => html`<div data-block="KpiTile" class="card gap-1 py-5"><section class="grid gap-1"><p class="text-sm text-muted-foreground">${label}</p><p class="text-3xl font-semibold tabular-nums">${value}</p>${trend ? html`<p class="text-sm text-muted-foreground"><span class="font-medium text-foreground">▲</span> ${trend}</p>` : ''}</section></div>`;
  return shell(ctx, html`<section data-block="Dashboard" class="grid gap-5 p-4 @3xl:p-8">
    <h1 class="text-2xl font-semibold">${ctx.t('progress.title')}</h1>
    <div class="grid gap-3 @xl:grid-cols-3">
      ${kpi(ctx.t('progress.notes'), ctx.num(ctx.s.notes.length), ctx.t('progress.trend_up', { n: 2 }))}
      ${kpi(ctx.t('progress.words'), ctx.num(186), ctx.t('progress.trend_up', { n: 14 }))}
      ${kpi(ctx.t('progress.streak'), ctx.t('progress.days', { n: 9 }), '')}
    </div>
    <div data-block="BarChart" class="card">
      <header><h2 class="font-semibold">${ctx.t('progress.chart')}</h2><p class="text-sm text-muted-foreground">${ctx.t('progress.chart_sub')}</p></header>
      <section><canvas class="chart aspect-[16/7] @max-3xl:aspect-[4/3]" data-chart-type="bar" data-chart-label-key="week" data-chart-legend="true"
        data-chart-data='${JSON.stringify(data)}' data-chart-series='${JSON.stringify(series)}' data-chart-options='${JSON.stringify(opts)}' role="img" aria-label="${ctx.t('progress.chart')}"></canvas>
      <details class="mt-3 text-sm"><summary class="cursor-pointer">${ctx.t('progress.table')}</summary>
        <div class="table-container mt-2"><table class="table"><thead><tr><th>${ctx.t('progress.week')}</th>${SUBJECTS.map((s) => html`<th class="text-right">${ctx.t('subject.' + s)}</th>`)}</tr></thead>
        <tbody>${data.map((r) => html`<tr><td>${r.week}</td>${SUBJECTS.map((s) => html`<td class="text-right tabular-nums">${r[s]}</td>`)}</tr>`)}</tbody></table></div></details></section>
    </div>
  </section>`, 'progress');
}

function settings(ctx) {
  const radio = (name, v, label, on) => html`<label class="label gap-3 font-normal"><input class="input" type="radio" name="${name}" value="${v}" data-change="${name}" ${raw(on ? 'checked' : '')}><span ${raw(v === 'ja' ? 'lang="ja"' : '')}>${label}</span></label>`;
  return shell(ctx, html`<section data-block="SettingsPage" class="mx-auto grid max-w-2xl gap-6 p-4 @3xl:p-8">
    <h1 class="text-2xl font-semibold">${ctx.t('settings.title')}</h1>
    <fieldset class="fieldset grid gap-3"><legend class="text-base font-semibold">${ctx.t('settings.language')}</legend>
      <p class="text-sm text-muted-foreground">${ctx.t('settings.language_help')}</p>
      ${radio('lang', 'en', 'English', ctx.lang === 'en')}${radio('lang', 'ja', '日本語', ctx.lang === 'ja')}</fieldset>
    <fieldset class="fieldset grid gap-3"><legend class="text-base font-semibold">${ctx.t('settings.appearance')}</legend>
      ${radio('theme', 'system', ctx.t('settings.theme.system'), ctx.theme === 'system')}${radio('theme', 'light', ctx.t('settings.theme.light'), ctx.theme === 'light')}${radio('theme', 'dark', ctx.t('settings.theme.dark'), ctx.theme === 'dark')}</fieldset>
    <section class="grid gap-3"><h2 class="text-base font-semibold">${ctx.t('settings.account')}</h2>
      <div class="flex items-center gap-3"><span class="avatar"><span>AK</span></span><div class="grid text-sm"><span class="font-medium">Aiko Kato</span><span class="text-muted-foreground">${ctx.s.email || 'aiko@example.com'}</span></div>
      <button class="btn ml-auto" data-variant="outline" type="button" data-action="logout">${icon('logout')}${ctx.t('settings.logout')}</button></div></section>
  </section>`, 'settings');
}

let saveTimer = null;
export default {
  id: 'notes', icon: 'file', host: 'class-notes.local', archetype: 'AppNotes', start: 'login',
  name: { en: 'Class Notes', ja: 'クラスノート' }, short: { en: 'Notes', ja: 'ノート' },
  about: { en: 'A study notes app: log in, search and filter, edit with autosave, delete with undo, see progress, change language and theme.', ja: '学習ノートのアプリ。ログイン、検索と絞り込み、自動保存の編集、元に戻せる削除、進み具合、言語と外観の切り替え。' },
  try: { en: 'Log in with “wrong” as the password to see the error. Search “駅”, open a note and type to see Saving…, then delete it and press Undo. Settings switches the language.', ja: 'パスワードに「wrong」と入力するとエラーを表示します。「駅」で検索し、ノートを開いて入力すると「保存中…」になります。削除して「元に戻す」も試せます。' },
  messages: M,
  init: () => ({ notes: seed(), nextId: 45 }),
  render(ctx) {
    const r = ctx.s.route;
    if (r === 'login') return login(ctx);
    if (r === 'note') return note(ctx);
    if (r === 'new') return form(ctx);
    if (r === 'progress') return progress(ctx);
    if (r === 'settings') return settings(ctx);
    return notes(ctx);
  },
  actions: {
    login(ctx, f, e, d) {
      const err = {};
      if (!d.email) err.email = 'login.error.email_empty';
      else if (!/^\S+@\S+\.\S+$/.test(d.email)) err.email = 'login.error.email_invalid';
      if (!d.password) err.password = 'login.error.password_empty';
      else if (d.password === 'wrong' || d.password.length < 4) err.wrong = true;
      ctx.s.email = d.email;
      ctx.s.loginErr = Object.keys(err).length ? err : null;
      if (!ctx.s.loginErr) { ctx.go('notes'); return false; }
    },
    noop: () => false,
    search(ctx, el) { ctx.s.q = el.value; },
    subject(ctx, el) { ctx.s.subject = el.value; },
    sort(ctx, el) { ctx.s.sort = el.value; },
    clear(ctx) { ctx.s.q = ''; ctx.s.subject = ''; },
    editTitle(ctx, el) { return edit(ctx, 'title', el.value); },
    editBody(ctx, el) { return edit(ctx, 'body', el.value); },
    async askDelete(ctx) {
      const n = ctx.s.notes.find((x) => x.id === ctx.s.noteId);
      const ok = await ctx.confirm({ title: ctx.t('delete.title', { title: L(ctx, n.title) }), body: ctx.t('delete.body'), ok: ctx.t('delete.ok'), cancel: ctx.t('delete.cancel'), danger: true });
      if (!ok) return false;
      const i = ctx.s.notes.indexOf(n);
      ctx.s.notes.splice(i, 1);
      ctx.toast({ category: 'success', title: ctx.t('delete.done'), description: L(ctx, n.title), duration: 8000,
        action: { label: ctx.t('delete.undo'), run: () => { ctx.s.notes.splice(i, 0, n); ctx.toast({ category: 'info', title: ctx.t('delete.restored') }); ctx.rerender(); } } });
      ctx.go('notes');
      return false;
    },
    saveNew(ctx, f, e, d) {
      ctx.s.form = d;
      const title = (d.title || '').trim();
      ctx.s.formErr = !title ? 'form.error.title_empty' : title.length > 120 ? 'form.error.title_long' : null;
      if (ctx.s.formErr) { setTimeout(() => document.querySelector('#stage [role=alert]')?.focus(), 0); return; }
      const id = ctx.s.nextId++;
      ctx.s.notes.unshift({ id, title: { en: title, ja: title }, subject: d.subject, body: { en: d.body || '', ja: d.body || '' }, edited: NOW });
      ctx.s.form = null;
      ctx.toast({ category: 'success', title: ctx.t('form.saved') });
      ctx.go('note', { noteId: id });
      return false;
    },
    lang(ctx, el) { ctx.setLang(el.value); ctx.toast({ category: 'success', title: ctx.t('settings.saved') }); },
    theme(ctx, el) { ctx.setTheme(el.value); ctx.toast({ category: 'success', title: ctx.t('settings.saved') }); },
    logout(ctx) { ctx.s.loginErr = null; ctx.go('login'); return false; },
  },
};

function edit(ctx, field, value) {
  const n = ctx.s.notes.find((x) => x.id === ctx.s.noteId);
  if (typeof n[field] === 'string') n[field] = value; else n[field] = { en: value, ja: value };
  n.edited = NOW;
  ctx.s.saving = true;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { ctx.s.saving = false; ctx.rerender(); }, 700);
  const st = document.querySelector('#stage [data-block="SavedState"]');
  if (st) st.lastChild.textContent = ctx.t('saved.saving');
  return false;
}
