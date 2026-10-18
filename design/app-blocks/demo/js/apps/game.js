// Meadow Quest: a small playable top-down RPG from the Game blocks (GameKit, TitleScreen, HudPieces, TutorialPrompt,
// DialogueBox, PauseMenu, GameSettings, ControlsRemap, InventoryGrid, GameOver, ResultsScores, TouchControls) and the
// game kit CSS, in the Meadow palette with the ArtSprites hero, slime, coin, potion and grass.
// The world is a plain <canvas> + requestAnimationFrame loop (not LittleJS: its engine is global and can't be torn down
// when the playground switches apps). Menus, HUD and dialogue are HTML over the canvas. Keys act only while the game has focus.
import { html, raw } from '../kit.js';

// ---------------------------------------------------------------- palette and sprites (ArtPalettes · Meadow, ArtSprites)
const PAL = { k: '#1b1c2b', p: '#2b2d42', q: '#4a4e69', d: '#9aa0b8', w: '#f4efe1', y: '#f2b33d', o: '#c27c2c', r: '#e05a47', R: '#9e3a3a', g: '#5bb85d', G: '#3a7d44', l: '#a7d86d', b: '#4aa3df', B: '#2f6a9e', s: '#f0b48a', n: '#7a5236' };
const HERO = ['................', '.....kkkkkk.....', '....knnnnnnk....', '...knnnnnnnnk...', '...knnsssssnk...', '...knskssksnk...', '....ksssssssk...', '.....ksssssk....', '....kkrrrrrkk...', '...ksrrryrrRsk..', '...ksrRyyyRRsk..', '...kkrrrrrRRkk..', '....kBBBkBBBk...', '....kBBBkBBBk...', '....knnnknnnk...', '....kkkk.kkkk...'];
const MIRA = HERO.map((r) => r.replace(/n/g, 'd').replace(/r/g, 'b').replace(/R/g, 'B').replace(/y/g, 'w').replace(/B(?=BB)/g, 'G'));
const SLIME = ['................', '................', '................', '................', '......kkkk......', '....kkggggkk....', '...kgllggggGk...', '..kglggggggGGk..', '..kgggwkggwkGk..', '.kggggkkggkkgGk.', '.kgggggggggggGk.', '.kggggggggggGGk.', '.kGgggggggggGGk.', '..kGGGGGGGGGGk..', '...kkkkkkkkkk...', '................'];
const COIN = ['................', '................', '.....kkkkkk.....', '....kyyyyyyk....', '...kywwyyyyok...', '...kywyyooyok...', '...kyyyoyyyok...', '...kyyyoyyyok...', '...kyyyoyyyok...', '...kyyyooyyok...', '...kyyyyyyook...', '....kooooook....', '.....kkkkkk.....', '................', '................', '................'];
const POTION = ['................', '......kkkk......', '......knnk......', '......kkkk......', '.......kwk......', '.......kwk......', '......kwwwk.....', '.....kwwwwwk....', '....kwrrrrrwk...', '....krwrrrrRk...', '....krrrrrrRk...', '....krrrrrRRk...', '.....kRRRRRk....', '......kkkkk.....', '................', '................'];
const GRASS = ['gggggggggggggggg', 'gglggggggggGgggg', 'gglGgggggggGlggg', 'ggggggggggggggGg', 'ggggGggggggggggg', 'gggGlgggglgggggg', 'gggggggggGlggggg', 'gggggggggggggggg', 'gGgggggggggggglg', 'glggggggggggggGg', 'gggggggGgggggggg', 'ggggggglgggggggg', 'gggggggggggGgggg', 'gggglgggggglGggg', 'ggggGggggggggggg', 'gggggggggggggggg'];
const PATH = ['oooooooooooooooo', 'oooonoooooooonoo', 'oooooooyoooooooo', 'onoooooooooooooo', 'oooooooooonooooo', 'oooooyoooooooooo', 'oooooooooooooono', 'oonooooooooooooo', 'oooooooooyoooooo', 'oooooooooooooooo', 'ooooonoooooooooo', 'oooooooooooonooo', 'ooyooooooooooooo', 'oooooooonooooooo', 'onoooooooooooyoo', 'oooooooooooooooo'];
const TREE = ['......kkkk......', '....kkGGGGkk....', '...kGGgggGGGk...', '..kGgggllgggGk..', '..kGglllggggGk..', '.kGgglgggggggGk.', '.kGgggggggggGGk.', '.kGGggggggggGGk.', '..kGGgggggGGGk..', '..kkGGGGGGGGkk..', '...kkkkGGkkkk...', '......knnk......', '......knnk......', '.....knnnnk.....', '....kkkkkkkk....', '................'];
const WATER = ['bbbbbbbbbbbbbbbb', 'bbbbbbbbbbbbbbbb', 'bbbwwbbbbbbbbbbb', 'bbbbbbbbbbbbbBbb', 'bbbbbbbbbbbbbbbb', 'bbbbbbbbbwwbbbbb', 'bBbbbbbbbbbbbbbb', 'bbbbbbbbbbbbbbbb', 'bbbbbbbbbbbbbbbb', 'bbbbbwwbbbbbbbbb', 'bbbbbbbbbbbbbBbb', 'bbbbbbbbbbbbbbbb', 'bbbbbbbbbbbbwwbb', 'bbBbbbbbbbbbbbbb', 'bbbbbbbbbbbbbbbb', 'bbbbbbbbbbbbbbbb'];
const WELL = ['................', '..kkkkkkkkkkkk..', '..knnnnnnnnnnk..', '..k..........k..', '..k..........k..', '..k..........k..', '.kkkkkkkkkkkkkk.', '.kqdqdqdqdqdqdk.', '.kdqqdqqdqqdqqk.', '.kqkkkkkkkkkkqk.', '.kdkbbbbbbbbkdk.', '.kqkbBbbbbBbkqk.', '.kdkkkkkkkkkkdk.', '.kqdqdqdqdqdqdk.', '.kkkkkkkkkkkkkk.', '................'];
const SPR = {};
function sprite(grid) {
  const c = document.createElement('canvas'); c.width = 16; c.height = 16;
  const x = c.getContext('2d');
  grid.forEach((row, j) => [...row].forEach((ch, i) => { if (PAL[ch]) { x.fillStyle = PAL[ch]; x.fillRect(i, j, 1, 1); } }));
  return c;
}
function sprites() {
  if (SPR.hero) return;
  Object.assign(SPR, { hero: sprite(HERO), mira: sprite(MIRA), slime: sprite(SLIME), coin: sprite(COIN), potion: sprite(POTION), grass: sprite(GRASS), path: sprite(PATH), tree: sprite(TREE), water: sprite(WATER), well: sprite(WELL) });
}

// ---------------------------------------------------------------- the map: 32 × 24 tiles of 16 px
// . grass  = path  T tree  ~ water  W well
const MAP = [
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  'T...T.........====.......~~~~~~T',
  'T.............====......~~~~~~~T',
  'T..T....T.....=W==.......~~~~~.T',
  'T.............====........~~~..T',
  'T......T......====.....T.......T',
  'T....==================........T',
  'T....=........====....=....T...T',
  'T..T.=....T...====....=........T',
  'T....=........====....=........T',
  'T....=........====....=====....T',
  'T....=..T.....====........=..T.T',
  'T....=================....=....T',
  'T.T...........====........=....T',
  'T.............====...T....=....T',
  'T......T......====........=....T',
  'T.............====.............T',
  'T...T.........====.......T.....T',
  'T.............====.............T',
  'T........T....====....T........T',
  'T.............====.............T',
  'T..T..........====.......T.....T',
  'T.............====.............T',
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
];
const TS = 16, MW = 32, MH = 24;
const tileAt = (tx, ty) => (tx < 0 || ty < 0 || tx >= MW || ty >= MH ? 'T' : MAP[ty][tx]);
const solid = (ch) => ch === 'T' || ch === '~' || ch === 'W';

// ---------------------------------------------------------------- texts
const M = {
  en: {
    'game.name': 'Meadow Quest', 'game.tagline': 'Help Old Mira bring water back to the village well.',
    'title.new': 'New Game', 'title.continue': 'Continue', 'title.settings': 'Settings', 'title.controls': 'Controls', 'title.best': 'Best score {n}', 'title.start': 'Start', 'title.version': 'Version 1.0 · Saved on this device',
    'hud.health': 'Health', 'hud.score': 'Score', 'hud.coins': 'Coins', 'hud.objective': 'Objective', 'hud.map': 'Map: you are in Willow Field', 'hud.time': 'Time',
    'quest.talk': 'Talk to Old Mira by the well', 'quest.coins': 'Find the lost coins: {n} of 5', 'quest.return': 'Bring the coins back to Old Mira',
    'tut.move': 'Move', 'tut.talk': 'Talk', 'tut.attack': 'Swing', 'tut.pause': 'Pause', 'tut.pick': 'Walk over coins to pick them up',
    'npc.mira': 'Old Mira',
    'dlg.mira.1': 'The well dried up the summer the coins went missing. Will you find them for me?', 'dlg.mira.help': 'I’ll find them.', 'dlg.mira.ask': 'What happened to them?', 'dlg.mira.later': 'Not now.',
    'dlg.mira.ask_line': 'A slime took them into the meadow. Five coins, scattered. Mind its bite.', 'dlg.mira.thanks': 'Thank you! Bring all five back to me.', 'dlg.mira.later_line': 'Come back when you’re ready, dear.',
    'dlg.mira.waiting': 'Still {n} coins out there. The slime is south of the path.', 'dlg.mira.done': 'All five! Listen… the water is rising again. You saved the village.', 'dlg.next': 'Continue', 'dlg.close': 'Close',
    'pause.title': 'Paused', 'pause.resume': 'Resume', 'pause.items': 'Items', 'pause.settings': 'Settings', 'pause.controls': 'Controls', 'pause.quit': 'Quit to Title', 'pause.resume_hint': 'Resume',
    'items.title': 'Items', 'items.coin': 'Old coin', 'items.potion': 'Red potion', 'items.empty': 'Empty', 'items.use': 'Use', 'items.potion_used': 'You feel better. +1 heart.', 'items.full': 'Your health is full.', 'items.hint': 'Potions heal one heart.',
    'settings.title': 'Settings', 'settings.sfx': 'Sound Effects', 'settings.shake': 'Screen Shake', 'settings.language': 'Language', 'settings.on': 'On', 'settings.off': 'Off', 'settings.hint': '← → change',
    'controls.title': 'Controls', 'controls.keyboard': 'Keyboard', 'controls.gamepad': 'Gamepad', 'controls.change': 'Change', 'controls.reset': 'Reset', 'controls.press_key': 'Press a key…', 'controls.press_button': 'Press a button…',
    'controls.fixed': 'Fixed', 'controls.swapped': '{a} was on that key; the two were swapped.', 'controls.cancel': 'Esc cancels',
    'action.move': 'Move', 'action.fire': 'Swing', 'action.interact': 'Talk or Use', 'action.pause': 'Pause',
    'pad.south': 'South button', 'pad.east': 'East button', 'pad.west': 'West button', 'pad.north': 'North button', 'pad.start': 'Start', 'pad.dpad': 'D-pad or left stick',
    'gameover.title': 'Game Over', 'gameover.detail': 'The slime got you. You keep the coins you found.', 'gameover.retry': 'Try Again', 'gameover.title_screen': 'Back to Title',
    'results.title': 'Quest Complete', 'results.coins': 'Coins', 'results.slimes': 'Slimes calmed', 'results.time': 'Time bonus', 'results.hearts': 'Hearts left', 'results.total': 'Total', 'results.best': 'New best!', 'results.again': 'Play Again', 'results.title_screen': 'Back to Title', 'results.stars': '{n} of 3 stars',
    'back': 'Back', 'touch.move': 'Move: drag in any direction',
  },
  ja: {
    'game.name': 'メドウクエスト', 'game.tagline': '村の井戸に水を取り戻すため、ミラおばあさんを手伝おう。',
    'title.new': 'はじめから', 'title.continue': 'つづきから', 'title.settings': '設定', 'title.controls': '操作', 'title.best': 'ベストスコア {n}', 'title.start': 'スタート', 'title.version': 'バージョン 1.0・この端末に保存',
    'hud.health': '体力', 'hud.score': 'スコア', 'hud.coins': 'コイン', 'hud.objective': '目的', 'hud.map': 'マップ：ヤナギの野原にいます', 'hud.time': '時間',
    'quest.talk': '井戸のそばのミラおばあさんと話す', 'quest.coins': 'なくしたコインを探す：5枚中{n}枚', 'quest.return': 'コインをミラおばあさんに届ける',
    'tut.move': '移動', 'tut.talk': '話す', 'tut.attack': '振る', 'tut.pause': 'ポーズ', 'tut.pick': 'コインの上を歩くと拾えます',
    'npc.mira': 'ミラおばあさん',
    'dlg.mira.1': 'コインがなくなった夏から、井戸が枯れてしまったの。探してくれるかい？', 'dlg.mira.help': '探してきます。', 'dlg.mira.ask': 'コインはどうなったの？', 'dlg.mira.later': 'また今度。',
    'dlg.mira.ask_line': 'スライムが野原に持っていったのさ。5枚、ばらばらにね。かまれないように気をつけて。', 'dlg.mira.thanks': 'ありがとう！5枚とも持ってきておくれ。', 'dlg.mira.later_line': '準備ができたらおいで。',
    'dlg.mira.waiting': 'まだ{n}枚残っているよ。スライムは道の南にいるよ。', 'dlg.mira.done': '5枚とも！ほら…水がまた湧いてきた。村を救ってくれたね。', 'dlg.next': '次へ', 'dlg.close': '閉じる',
    'pause.title': 'ポーズ中', 'pause.resume': 'つづける', 'pause.items': 'もちもの', 'pause.settings': '設定', 'pause.controls': '操作', 'pause.quit': 'タイトルに戻る', 'pause.resume_hint': 'つづける',
    'items.title': 'もちもの', 'items.coin': '古いコイン', 'items.potion': '赤いくすり', 'items.empty': '空き', 'items.use': '使う', 'items.potion_used': '元気になった。ハート +1。', 'items.full': '体力は満タンです。', 'items.hint': 'くすりでハートが1つ回復します。',
    'settings.title': '設定', 'settings.sfx': '効果音', 'settings.shake': '画面のゆれ', 'settings.language': '言語', 'settings.on': 'オン', 'settings.off': 'オフ', 'settings.hint': '← → で変更',
    'controls.title': '操作', 'controls.keyboard': 'キーボード', 'controls.gamepad': 'ゲームパッド', 'controls.change': '変更', 'controls.reset': 'リセット', 'controls.press_key': 'キーを押してください…', 'controls.press_button': 'ボタンを押してください…',
    'controls.fixed': '固定', 'controls.swapped': '{a}と入れ替えました。', 'controls.cancel': 'Esc でキャンセル',
    'action.move': '移動', 'action.fire': '振る', 'action.interact': '話す・使う', 'action.pause': 'ポーズ',
    'pad.south': '下のボタン', 'pad.east': '右のボタン', 'pad.west': '左のボタン', 'pad.north': '上のボタン', 'pad.start': 'スタート', 'pad.dpad': '十字キーまたは左スティック',
    'gameover.title': 'ゲームオーバー', 'gameover.detail': 'スライムにやられてしまった。見つけたコインはそのままです。', 'gameover.retry': 'もう一度', 'gameover.title_screen': 'タイトルに戻る',
    'results.title': 'クエスト達成', 'results.coins': 'コイン', 'results.slimes': 'しずめたスライム', 'results.time': 'タイムボーナス', 'results.hearts': '残りのハート', 'results.total': '合計', 'results.best': 'ベスト更新！', 'results.again': 'もう一度あそぶ', 'results.title_screen': 'タイトルに戻る', 'results.stars': '星 3つ中 {n}つ',
    'back': 'もどる', 'touch.move': '移動：好きな方向にドラッグ',
  },
};

// ---------------------------------------------------------------- input bindings (KeyboardEvent.code, standard gamepad indices)
const DEF_KEYS = { fire: 'KeyJ', interact: 'KeyE' };   // action ids as gaming-core and the cards name them
const DEF_PAD = { fire: 2, interact: 0 };  // west, south
const PADPOS = { 0: 'south', 1: 'east', 2: 'west', 3: 'north' };
const keyLabel = (code) => code.replace(/^Key/, '').replace(/^Digit/, '').replace('Space', 'Space').replace('Arrow', '').replace('Enter', 'Enter');

// ---------------------------------------------------------------- state
const COIN_SPOTS = [[4, 16], [9, 20], [27, 19], [24, 8], [11, 3]];
function newRun() {
  return {
    hero: { x: 16.5 * TS, y: 9.5 * TS, dir: 1, hp: 5, max: 5, inv: 0, swing: 0, walk: 0 },
    mira: { x: 13.5 * TS, y: 3.6 * TS },
    slime: { x: 7 * TS, y: 18 * TS, vx: 0, vy: 0, alive: true, respawn: 0, hop: 0, hit: 0 },
    coins: COIN_SPOTS.map(([x, y]) => ({ x: x * TS + 8, y: y * TS + 8, got: false })),
    potions: [{ x: 26 * TS + 8, y: 13 * TS + 8, got: false }],
    bag: { coin: 0, potion: 1 },
    quest: 'talk', score: 0, slimes: 0, time: 0, shake: 0, tutorial: 6, msg: null, msgT: 0, fx: [],
  };
}
const fresh = () => ({
  screen: 'title', prev: 'title', run: null, dlg: null, best: readBest(),
  opts: { sfx: 7, shake: true }, keys: { ...DEF_KEYS }, pad: { ...DEF_PAD }, ctab: null, rebind: null, note: '', over: 0, result: null, device: null,
});
function readBest() { try { return +localStorage.getItem('meadow-quest.best') || 0; } catch { return 0; } }
function writeBest(n) { try { localStorage.setItem('meadow-quest.best', String(n)); } catch { /* private window */ } }

// ---------------------------------------------------------------- runtime (one game at a time)
let G = null; // { ctx, root, layer, cv, x, raf, held, padPrev, stick, audio, last, off }

function T(k, v) { return G.ctx.t(k, v); }
const S = () => G.ctx.s;

function sfx(kind) {
  const vol = S().opts.sfx / 10; if (!vol || !G.audio) return;
  const a = G.audio, o = a.createOscillator(), g = a.createGain();
  const f = { coin: [880, 1320], hit: [220, 110], swing: [440, 330], talk: [660, 660], heal: [523, 784], win: [523, 1047] }[kind] || [440, 440];
  o.type = kind === 'hit' ? 'sawtooth' : 'square';
  o.frequency.setValueAtTime(f[0], a.currentTime); o.frequency.linearRampToValueAtTime(f[1], a.currentTime + 0.12);
  g.gain.setValueAtTime(0.06 * vol, a.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.18);
  o.connect(g).connect(a.destination); o.start(); o.stop(a.currentTime + 0.2);
}
function wakeAudio() { if (!G.audio) { try { G.audio = new AudioContext(); } catch { /* no audio */ } } }

function setDevice(d) {
  if (G.ctx.device === 'phone' && d === 'mouse') d = 'touch'; // the playground's phone frame stands in for a touch screen
  if (S().device === d) return;
  S().device = d; G.root.dataset.device = d;
  if (S().screen === 'play') ui();
}

// ---------------------------------------------------------------- screens (all sections live in the layer; one is shown)
function prompt(kb, padPos, touch) {
  return html`<span class="game-row" style="gap:6px">${kb ? html`<span data-for="keyboard mouse">${kb.map((k) => html`<span class="game-key">${k}</span>`)}</span>` : ''}${padPos ? html`<span data-for="gamepad"><span class="game-padpos" data-pos="${padPos}" aria-label="${T('pad.' + padPos)}"></span></span>` : ''}${touch ? html`<span data-for="touch">${touch}</span>` : ''}</span>`;
}
function ui() {
  const s = S(), r = s.run, show = (n) => (s.screen === n ? '' : 'hidden');
  const q = !r ? '' : r.quest === 'talk' ? T('quest.talk') : r.quest === 'coins' ? T('quest.coins', { n: r.bag.coin }) : T('quest.return');
  const hearts = r ? Array.from({ length: r.hero.max }, (_, i) => html`<span class="game-icon" data-kind="heart" aria-hidden="true" style="${i < r.hero.hp ? '' : 'opacity:.25'}"></span>`) : '';
  const opt = (id, label, value, role, extra = '') => html`<div class="game-option" tabindex="0" role="${role}" id="${id}" data-opt="${id}" ${raw(extra)}><span>${label}</span><span class="game-value">${value}</span></div>`;
  const meter = (n) => html`<span class="game-meter" aria-hidden="true">${Array.from({ length: 10 }, (_, i) => raw(i < n ? '<i data-on></i>' : '<i></i>'))}</span>`;
  const tab = s.ctab || (s.device === 'gamepad' ? 'gamepad' : 'keyboard');
  const bindRow = (act) => {
    const waiting = s.rebind === act;
    const val = waiting ? html`<span class="game-small" style="color:var(--g-accent)">${T(tab === 'gamepad' ? 'controls.press_button' : 'controls.press_key')}</span>`
      : tab === 'gamepad' ? html`<span class="game-padpos" data-pos="${PADPOS[s.pad[act]] || 'south'}" aria-label="${T('pad.' + (PADPOS[s.pad[act]] || 'south'))}"></span>`
      : html`<span class="game-key">${keyLabel(s.keys[act])}</span>`;
    return html`<li role="option" tabindex="0" data-bind="${act}" aria-selected="${waiting}"><span style="flex:1">${T('action.' + act)}</span>${val}</li>`;
  };
  const best = s.best;
  const res = s.result;
  G.rendering = true;
  G.layer.innerHTML = html`
    <section data-block="TitleScreen" class="game-center" aria-labelledby="gm-title-name" ${raw(show('title'))}>
      <div style="display:grid;gap:10px;justify-items:center">
        <h1 id="gm-title-name" class="game-title">${T('game.name')}</h1>
        <p class="game-line" style="max-width:34ch;margin:0">${T('game.tagline')}</p>
      </div>
      <nav aria-label="${T('game.name')}"><ul class="game-menu">
        ${r && !s.done ? html`<li><button class="game-btn" data-gm="continue">${T('title.continue')}</button></li>` : ''}
        <li><button class="game-btn" data-gm="new">${T('title.new')}</button></li>
        <li><button class="game-btn" data-gm="settings">${T('title.settings')}</button></li>
        <li><button class="game-btn" data-gm="controls">${T('title.controls')}</button></li>
      </ul></nav>
      <p class="game-hint" style="justify-content:center">${prompt(['Enter'], 'south', '')}<span>${T('title.start')}</span>${best ? html`<span class="game-small">· ${T('title.best', { n: best.toLocaleString(G.ctx.lang === 'ja' ? 'ja-JP' : 'en-US') })}</span>` : ''}</p>
      <p class="game-small" style="margin:0;color:var(--g-dim)">${T('title.version')}</p>
    </section>

    <section data-block="HudPieces" class="game-hud" aria-label="${T('hud.health')}" ${raw(r && ['play', 'dialogue', 'over'].includes(s.screen) ? '' : 'hidden')}>
      <div data-slot="tl" class="grid gap-1">
        <div class="game-row" role="meter" aria-label="${T('hud.health')}" aria-valuemin="0" aria-valuemax="${r ? r.hero.max : 5}" aria-valuenow="${r ? r.hero.hp : 5}" style="gap:3px;flex-wrap:nowrap">${hearts}</div>
      </div>
      <div data-slot="tc" class="game-objective" role="status" style="align-self:start"><span class="game-h">${T('hud.objective')}</span><p class="game-line" style="margin:2px 0 0;font-size:12px" id="gm-obj">${q}</p></div>
      <div data-slot="tr" class="grid gap-1 justify-items-end" style="white-space:nowrap">
        <span class="game-num"><span>${T('hud.score')}</span> <b id="gm-score">${r ? r.score : 0}</b></span>
        <span class="game-row game-num" style="flex-wrap:nowrap;gap:4px"><span class="game-icon" data-kind="coin" aria-hidden="true"></span><span><b id="gm-coins">${r ? r.bag.coin : 0}</b>/5</span></span>
        <button class="game-touchbtn" data-for="touch mouse" data-gm="pause" aria-label="${T('action.pause')}" style="width:44px;height:44px;pointer-events:auto;font-size:12px">II</button>
      </div>
      <canvas data-slot="bl" class="game-minimap" id="gm-mini" width="${MW}" height="${MH}" role="img" aria-label="${T('hud.map')}" style="width:${MW * 3}px;height:${MH * 3}px;image-rendering:pixelated;padding:0" ${raw(s.screen === 'play' && s.device !== 'touch' ? '' : 'hidden')}></canvas>
    </section>

    <p data-block="TutorialPrompt" class="game-panel" id="gm-tut" role="status" style="position:absolute;left:50%;bottom:${s.device === 'touch' ? 170 : 24}px;transform:translateX(-50%);display:flex;gap:14px;flex-wrap:wrap;justify-content:center;font-size:13px;padding:8px 12px;margin:0" ${raw(r && s.screen === 'play' && (r.tutorial > 0 || r.near) ? '' : 'hidden')}>
      ${r && r.near ? html`<span class="game-row">${prompt([keyLabel(s.keys.interact)], PADPOS[s.pad.interact], html`<span class="game-key">${T('tut.talk')}</span>`)}<span>${T('tut.talk')}</span></span>`
        : html`<span class="game-row" data-for="keyboard mouse gamepad">${prompt(['W', 'A', 'S', 'D'], null, '')}<span data-for="gamepad"><span class="game-small">${T('pad.dpad')}</span></span><span>${T('tut.move')}</span></span>
        <span class="game-row" data-for="keyboard mouse gamepad">${prompt([keyLabel(s.keys.fire)], PADPOS[s.pad.fire], '')}<span>${T('tut.attack')}</span></span>
        <span class="game-row" data-for="keyboard mouse gamepad">${prompt(['Esc'], null, '')}<span data-for="gamepad"><span class="game-key">${T('pad.start')}</span></span><span>${T('tut.pause')}</span></span>
        <span data-for="touch">${T('touch.move')}</span>`}
    </p>

    <section data-block="DialogueBox" class="game-dialogue" role="dialog" aria-labelledby="gm-dlg-speaker" aria-describedby="gm-dlg-line" ${raw(show('dialogue'))} style="${s.device === 'touch' ? 'bottom:12px' : ''}">
      <canvas class="game-portrait" id="gm-portrait" width="16" height="16" role="img" aria-label="${T('npc.mira')}"></canvas>
      <div class="game-panel" data-tone="light">
        <span id="gm-dlg-speaker" class="game-speaker" style="color:${PAL.B}">${T('npc.mira')}</span>
        <p id="gm-dlg-line" class="game-line">${s.dlg ? T(s.dlg.line, s.dlg.vars) : ''}</p>
        <ul class="game-menu" style="margin-top:8px" aria-label="${T('npc.mira')}">
          ${s.dlg?.choices ? s.dlg.choices.map((c) => html`<li><button class="game-btn" data-choice="${c}">${T('dlg.mira.' + c)}</button></li>`) : html`<li><button class="game-btn" data-choice="close">${T(s.dlg?.end ? 'dlg.close' : 'dlg.next')}</button></li>`}
        </ul>
        <p class="game-hint" style="justify-content:flex-end">${prompt(['Enter'], 'south', '')}<span>${T('dlg.next')}</span></p>
      </div>
    </section>

    <section data-block="PauseMenu" class="game-overlay" role="dialog" aria-modal="true" aria-labelledby="gm-pause-title" ${raw(show('pause'))}>
      <div class="game-panel" style="min-width:min(320px,100%)">
        <h2 id="gm-pause-title" class="game-h">${T('pause.title')}</h2>
        <ul class="game-menu" style="margin-top:12px">
          <li><button class="game-btn" data-gm="resume">${T('pause.resume')}</button></li>
          <li><button class="game-btn" data-gm="items">${T('pause.items')}</button></li>
          <li><button class="game-btn" data-gm="settings">${T('pause.settings')}</button></li>
          <li><button class="game-btn" data-gm="controls">${T('pause.controls')}</button></li>
          <li><button class="game-btn" data-gm="quit">${T('pause.quit')}</button></li>
        </ul>
        <p class="game-hint" style="margin-top:12px">${prompt(['Esc'], 'east', '')}<span>${T('pause.resume_hint')}</span></p>
      </div>
    </section>

    <section data-block="InventoryGrid" class="game-overlay" role="dialog" aria-modal="true" aria-labelledby="gm-items-title" ${raw(show('items'))}>
      <div class="game-panel" style="display:grid;gap:12px;width:min(360px,100%)">
        <h2 id="gm-items-title" class="game-h">${T('items.title')}</h2>
        <div class="game-slots" role="grid" style="--cols:5" aria-label="${T('items.title')}">
          <button class="game-slot" data-gm="usecoin" aria-label="${T('items.coin')}, ${r ? r.bag.coin : 0}"><canvas data-spr="coin" width="16" height="16" style="width:32px;height:32px;image-rendering:pixelated"></canvas><span class="game-count">${r ? r.bag.coin : 0}</span></button>
          <button class="game-slot" data-gm="potion" aria-label="${T('items.potion')}, ${r ? r.bag.potion : 0}" ${raw(r && r.bag.potion ? '' : 'disabled')}><canvas data-spr="potion" width="16" height="16" style="width:32px;height:32px;image-rendering:pixelated;${r && r.bag.potion ? '' : 'opacity:.3'}"></canvas><span class="game-count">${r ? r.bag.potion : 0}</span></button>
          ${[0, 1, 2].map(() => html`<span class="game-slot" aria-label="${T('items.empty')}"></span>`)}
        </div>
        <p class="game-small" style="margin:0" id="gm-items-note" role="status">${s.note || T('items.hint')}</p>
        <ul class="game-menu"><li><button class="game-btn" data-gm="back">${T('back')}</button></li></ul>
      </div>
    </section>

    <section data-block="GameSettings" class="game-overlay" role="dialog" aria-modal="true" aria-labelledby="gm-set-title" ${raw(show('settings'))}>
      <div class="game-panel" style="width:min(460px,100%);display:grid;gap:6px">
        <h2 id="gm-set-title" class="game-h" style="margin-bottom:6px">${T('settings.title')}</h2>
        ${opt('sfx', T('settings.sfx'), meter(s.opts.sfx), 'slider', `aria-valuemin="0" aria-valuemax="10" aria-valuenow="${s.opts.sfx}"`)}
        ${opt('shake', T('settings.shake'), T(s.opts.shake ? 'settings.on' : 'settings.off'), 'switch', `aria-checked="${s.opts.shake}"`)}
        ${opt('lang', T('settings.language'), G.ctx.lang === 'ja' ? '日本語' : 'English', 'button')}
        <p class="game-hint" style="margin-top:8px">${prompt(['←', '→'], null, '')}<span>${T('settings.hint')}</span>${prompt(['Esc'], 'east', '')}<span>${T('back')}</span></p>
        <ul class="game-menu" style="margin-top:6px"><li><button class="game-btn" data-gm="back">${T('back')}</button></li></ul>
      </div>
    </section>

    <section data-block="ControlsRemap" class="game-overlay" role="dialog" aria-modal="true" aria-labelledby="gm-ctl-title" ${raw(show('controls'))}>
      <div class="game-panel" style="width:min(520px,100%)">
        <h2 id="gm-ctl-title" class="game-h">${T('controls.title')}</h2>
        <div class="game-tabs" role="tablist" aria-label="${T('controls.title')}" style="margin:10px 0">
          <button class="game-tab" role="tab" aria-selected="${tab === 'keyboard'}" data-ctab="keyboard">${T('controls.keyboard')}</button>
          <button class="game-tab" role="tab" aria-selected="${tab === 'gamepad'}" data-ctab="gamepad">${T('controls.gamepad')}</button>
        </div>
        <ul class="game-list" role="listbox" aria-label="${T('controls.title')}">
          <li role="option" aria-disabled="true"><span style="flex:1">${T('action.move')}</span>${tab === 'gamepad' ? html`<span class="game-small">${T('pad.dpad')}</span>` : html`<span class="game-key">W</span><span class="game-key">A</span><span class="game-key">S</span><span class="game-key">D</span><span class="game-small">· ↑ ← ↓ →</span>`}<span class="game-small">${T('controls.fixed')}</span></li>
          ${bindRow('fire')}${bindRow('interact')}
          <li role="option" aria-disabled="true"><span style="flex:1">${T('action.pause')}</span>${tab === 'gamepad' ? html`<span class="game-key">${T('pad.start')}</span>` : html`<span class="game-key">Esc</span><span class="game-key">P</span>`}<span class="game-small">${T('controls.fixed')}</span></li>
        </ul>
        <p class="game-small" role="status" style="margin:8px 0 0;color:var(--g-accent);min-height:1em">${s.rebind ? T('controls.cancel') : s.note}</p>
        <p class="game-hint" style="margin-top:8px">${prompt(['Enter'], 'south', '')}<span>${T('controls.change')}</span>${prompt(['R'], 'north', '')}<span>${T('controls.reset')}</span>${prompt(['Esc'], 'east', '')}<span>${T('back')}</span></p>
        <ul class="game-menu" style="margin-top:6px"><li><button class="game-btn" data-gm="resetkeys">${T('controls.reset')}</button></li><li><button class="game-btn" data-gm="back">${T('back')}</button></li></ul>
      </div>
    </section>

    <section data-block="GameOver" class="game-center" role="alertdialog" aria-labelledby="gm-go-title" aria-describedby="gm-go-detail" style="background:rgb(10 10 20 / 0.7)" ${raw(show('gameover'))}>
      <h2 id="gm-go-title" class="game-title" style="color:var(--g-bad)">${T('gameover.title')}</h2>
      <p id="gm-go-detail" class="game-line" style="margin:0;max-width:36ch">${T('gameover.detail')}</p>
      <ul class="game-menu"><li><button class="game-btn" data-gm="new">${T('gameover.retry')}</button></li><li><button class="game-btn" data-gm="quit">${T('gameover.title_screen')}</button></li></ul>
    </section>

    <section data-block="ResultsScores" class="game-overlay" role="dialog" aria-modal="true" aria-labelledby="gm-res-title" ${raw(show('results'))}>
      <div class="game-panel" style="width:min(440px,100%);display:grid;gap:12px">
        <h2 id="gm-res-title" class="game-h">${T('results.title')}</h2>
        ${res ? html`<dl class="game-num" style="display:grid;grid-template-columns:1fr auto;gap:6px 16px;margin:0">
          <dt>${T('results.coins')}</dt><dd style="margin:0">5 × 100 = 500</dd>
          <dt>${T('results.slimes')}</dt><dd style="margin:0">${res.slimes} × 150 = ${res.slimes * 150}</dd>
          <dt>${T('results.hearts')}</dt><dd style="margin:0">${res.hearts} × 100 = ${res.hearts * 100}</dd>
          <dt>${T('results.time')}</dt><dd style="margin:0">${res.timeBonus}</dd>
          <dt style="color:var(--g-accent)">${T('results.total')}</dt><dd style="margin:0;color:var(--g-accent)">${res.total}</dd></dl>
        <p class="game-row" style="justify-content:center;gap:6px;margin:0" aria-label="${T('results.stars', { n: res.stars })}">${[1, 2, 3].map((i) => html`<span class="game-icon" data-kind="star" aria-hidden="true" style="width:20px;height:20px;${i <= res.stars ? '' : 'opacity:.25'}"></span>`)}</p>
        ${res.best ? html`<p class="game-row" role="status" style="justify-content:center;margin:0;color:var(--g-accent)">${T('results.best')}</p>` : ''}` : ''}
        <ul class="game-menu"><li><button class="game-btn" data-gm="new">${T('results.again')}</button></li><li><button class="game-btn" data-gm="quit">${T('results.title_screen')}</button></li></ul>
      </div>
    </section>

    <div data-block="TouchControls" class="game-touch" data-for="touch" aria-label="${T('touch.move')}" ${raw(r && s.screen === 'play' ? '' : 'hidden')}>
      <div class="game-stick" id="gm-stick" role="application" aria-label="${T('touch.move')}" style="touch-action:none"></div>
      <div class="game-row" style="gap:14px;align-items:end">
        <button class="game-touchbtn" data-hold="interact" aria-label="${T('action.interact')}" style="font-size:12px">${T('tut.talk')}</button>
        <button class="game-touchbtn" data-hold="fire" aria-label="${T('action.fire')}" style="width:76px;height:76px;margin-bottom:24px;background:var(--g-accent);font-size:12px">${T('tut.attack')}</button>
      </div>
    </div>`.s;
  // sprites into the item slots and the portrait
  G.rendering = false;
  G.layer.querySelectorAll('canvas[data-spr]').forEach((c) => c.getContext('2d').drawImage(SPR[c.dataset.spr], 0, 0));
  const p = G.layer.querySelector('#gm-portrait'); if (p) p.getContext('2d').drawImage(SPR.mira, 0, 0);
  bindStick();
}
function focusFirst() {
  const sec = [...G.layer.children].find((el) => el.tagName === 'SECTION' && !el.hidden && el.dataset.block !== 'HudPieces');
  const b = sec?.querySelector('.game-btn, .game-option, [data-bind], .game-slot:not(:disabled)');
  if (b) b.focus({ preventScroll: true }); else G.root.focus({ preventScroll: true });
}
function go(screen, opts = {}) { // opts.nofocus: don't pull focus back (the person clicked outside the game)
  const s = S();
  if (screen !== s.screen && !['settings', 'controls', 'items'].includes(s.screen)) s.prev = s.screen;
  s.screen = screen; s.note = opts.note || ''; s.rebind = null;
  G.held.clear();
  ui();
  if (opts.nofocus) return;
  if (screen !== 'play') focusFirst(); else G.root.focus({ preventScroll: true });
}
function back() { const s = S(); go(s.prev === 'play' || s.prev === 'dialogue' ? 'pause' : s.prev || 'title'); }

// ---------------------------------------------------------------- game rules
function startRun() { const s = S(); s.run = newRun(); s.over = 0; s.done = false; s.result = null; go('play'); }
function say(line, vars, choices, end) { S().dlg = { line, vars, choices, end }; go('dialogue'); sfx('talk'); }
function talk() {
  const r = S().run;
  if (r.quest === 'talk') say('dlg.mira.1', null, ['help', 'ask', 'later']);
  else if (r.quest === 'coins') say('dlg.mira.waiting', { n: 5 - r.bag.coin }, null, true);
  else { say('dlg.mira.done', null, null, true); S().dlg.win = true; sfx('win'); }
}
function choose(c) {
  const s = S(), r = s.run, d = s.dlg;
  if (c === 'help') { r.quest = 'coins'; return say('dlg.mira.thanks', null, null, true); }
  if (c === 'ask') return say('dlg.mira.ask_line', null, ['help', 'later']);
  if (c === 'later') return say('dlg.mira.later_line', null, null, true);
  if (d?.win) return finish();
  s.dlg = null; go('play');
}
function finish() {
  const s = S(), r = s.run;
  const timeBonus = Math.max(0, Math.round(1500 - r.time * 10));
  const total = 500 + r.slimes * 150 + r.hero.hp * 100 + timeBonus;
  const best = total > s.best; if (best) { s.best = total; writeBest(total); }
  s.result = { slimes: r.slimes, hearts: r.hero.hp, timeBonus, total, stars: total > 2200 ? 3 : total > 1500 ? 2 : 1, best };
  r.score = total; s.dlg = null; s.done = true;
  go('results');
}
function hurt(from) {
  const r = S().run, h = r.hero;
  if (h.inv > 0) return;
  h.hp -= 1; h.inv = 1.2; sfx('hit');
  if (S().opts.shake) r.shake = 0.25;
  const dx = h.x - from.x, dy = h.y - from.y, d = Math.hypot(dx, dy) || 1;
  moveHero(dx / d * 14, dy / d * 14);
  if (h.hp <= 0) { S().over = 0.9; S().done = true; G.held.clear(); }
}
function moveHero(dx, dy) {
  const h = S().run.hero;
  const blocked = (x, y) => [[-5, -2], [5, -2], [-5, 4], [5, 4]].some(([ox, oy]) => solid(tileAt(Math.floor((x + ox) / TS), Math.floor((y + oy) / TS))))
    || Math.hypot(x - S().run.mira.x, y - S().run.mira.y) < 9;
  if (!blocked(h.x + dx, h.y)) h.x += dx;
  if (!blocked(h.x, h.y + dy)) h.y += dy;
}
function swing() {
  const r = S().run, h = r.hero;
  if (h.swing > 0) return;
  h.swing = 0.25; sfx('swing');
  const sl = r.slime;
  if (sl.alive && Math.hypot(sl.x - (h.x + h.dir * 10), sl.y - h.y) < 18) {
    sl.alive = false; sl.respawn = 6; r.slimes += 1; r.score += 150;
    r.fx.push({ x: sl.x, y: sl.y - 8, t: 0.8, text: '+150' });
  }
}
function interact() {
  const r = S().run;
  if (r.near) return talk();
}

function update(dt) {
  const s = S(), r = s.run; if (!r) return;
  if (s.over) { s.over -= dt; if (s.over <= 0) { s.over = 0; go('gameover'); } return; }
  if (s.screen !== 'play') return;
  r.time += dt; r.tutorial = Math.max(0, r.tutorial - dt);
  const h = r.hero;
  // movement: keys, gamepad axes, touch stick
  let mx = 0, my = 0;
  const k = G.held;
  if (k.has('ArrowLeft') || k.has('KeyA')) mx -= 1; if (k.has('ArrowRight') || k.has('KeyD')) mx += 1;
  if (k.has('ArrowUp') || k.has('KeyW')) my -= 1; if (k.has('ArrowDown') || k.has('KeyS')) my += 1;
  mx += G.pad.x + G.stick.x; my += G.pad.y + G.stick.y;
  const len = Math.hypot(mx, my);
  if (len > 0.15) {
    const sp = 62 * dt / Math.max(1, len);
    moveHero(mx * sp, my * sp);
    if (Math.abs(mx) > 0.2) h.dir = mx > 0 ? 1 : -1;
    h.walk += dt * 8;
  }
  h.inv = Math.max(0, h.inv - dt); h.swing = Math.max(0, h.swing - dt);
  // pickups
  for (const c of r.coins) if (!c.got && Math.hypot(c.x - h.x, c.y - h.y) < 11) {
    c.got = true; r.bag.coin += 1; r.score += 100; sfx('coin'); r.fx.push({ x: c.x, y: c.y - 8, t: 0.8, text: '+100' });
    if (r.quest === 'coins' && r.bag.coin >= 5) r.quest = 'return';
    hudText();
  }
  for (const p of r.potions) if (!p.got && Math.hypot(p.x - h.x, p.y - h.y) < 11) { p.got = true; r.bag.potion += 1; sfx('heal'); }
  // slime: hops toward the hero when close, wanders otherwise
  const sl = r.slime;
  if (!sl.alive) { sl.respawn -= dt; if (sl.respawn <= 0) Object.assign(sl, { alive: true, x: 6 * TS, y: 19 * TS }); }
  else {
    sl.hop -= dt;
    if (sl.hop <= 0) {
      const dx = h.x - sl.x, dy = h.y - sl.y, d = Math.hypot(dx, dy);
      if (d < 90) { sl.vx = dx / d * 34; sl.vy = dy / d * 34; } else { const a = Math.random() * 6.28; sl.vx = Math.cos(a) * 18; sl.vy = Math.sin(a) * 18; }
      sl.hop = 0.9;
    }
    const nx = sl.x + sl.vx * dt, ny = sl.y + sl.vy * dt;
    if (!solid(tileAt(Math.floor(nx / TS), Math.floor(sl.y / TS))) && nx > TS * 2 && nx < TS * 30) sl.x = nx;
    if (!solid(tileAt(Math.floor(sl.x / TS), Math.floor(ny / TS))) && ny > TS * 5 && ny < TS * 22) sl.y = ny;
    if (Math.hypot(sl.x - h.x, sl.y - h.y) < 11) hurt(sl);
  }
  // near Mira: the talk prompt
  const near = Math.hypot(h.x - r.mira.x, h.y - r.mira.y) < 24;
  if (near !== !!r.near) { r.near = near; const t = G.layer.querySelector('#gm-tut'); if (t) { ui(); } }
  if (!near && r.tutorial <= 0) { const t = G.layer.querySelector('#gm-tut'); if (t && !t.hidden) t.hidden = true; }
  r.shake = Math.max(0, r.shake - dt);
  r.fx = r.fx.filter((f) => (f.t -= dt) > 0);
  // HUD numbers (cheap, no re-render)
  const sc = G.layer.querySelector('#gm-score'); if (sc && sc.textContent !== String(r.score)) sc.textContent = r.score;
  const hp = G.layer.querySelector('[role=meter]');
  if (hp && hp.getAttribute('aria-valuenow') !== String(h.hp)) ui();
}
function hudText() {
  const r = S().run;
  const o = G.layer.querySelector('#gm-obj'); if (o) o.textContent = r.quest === 'coins' ? T('quest.coins', { n: r.bag.coin }) : r.quest === 'return' ? T('quest.return') : T('quest.talk');
  const c = G.layer.querySelector('#gm-coins'); if (c) c.textContent = r.bag.coin;
}

// ---------------------------------------------------------------- drawing
function draw(t) {
  const { cv, x } = G, s = S(), r = s.run;
  const W = cv.width, H = cv.height;
  x.imageSmoothingEnabled = false;
  x.fillStyle = PAL.k; x.fillRect(0, 0, W, H);
  // camera: follow the hero (or pan slowly on the title screen)
  let cx, cy;
  if (r && s.screen !== 'title') { cx = r.hero.x - W / 2; cy = r.hero.y - H / 2; }
  else { cx = 8 * TS + Math.sin(t / 4000) * 6 * TS; cy = 6 * TS + Math.cos(t / 5000) * 3 * TS; }
  cx = W >= MW * TS ? (MW * TS - W) / 2 : Math.max(0, Math.min(MW * TS - W, cx));
  cy = H >= MH * TS ? (MH * TS - H) / 2 : Math.max(0, Math.min(MH * TS - H, cy));
  if (r?.shake) { cx += (Math.random() - 0.5) * 4; cy += (Math.random() - 0.5) * 4; }
  cx = Math.round(cx); cy = Math.round(cy);
  const tx0 = Math.floor(cx / TS), ty0 = Math.floor(cy / TS);
  for (let ty = ty0; ty <= ty0 + Math.ceil(H / TS); ty++) for (let tx = tx0; tx <= tx0 + Math.ceil(W / TS); tx++) {
    if (tx < 0 || ty < 0 || tx >= MW || ty >= MH) continue;
    const ch = MAP[ty][tx], px = tx * TS - cx, py = ty * TS - cy;
    x.drawImage(ch === '=' || ch === 'W' ? SPR.path : ch === '~' ? SPR.water : SPR.grass, px, py);
    if (ch === 'T') x.drawImage(SPR.tree, px, py);
    if (ch === 'W') x.drawImage(SPR.well, px, py);
  }
  const ent = [];
  if (r) {
    r.coins.forEach((c) => !c.got && ent.push([c.y, () => x.drawImage(SPR.coin, Math.round(c.x - 8 - cx), Math.round(c.y - 9 - cy + Math.sin(t / 250 + c.x) * 1.5))]));
    r.potions.forEach((p) => !p.got && ent.push([p.y, () => x.drawImage(SPR.potion, Math.round(p.x - 8 - cx), Math.round(p.y - 10 - cy))]));
    ent.push([r.mira.y, () => x.drawImage(SPR.mira, Math.round(r.mira.x - 8 - cx), Math.round(r.mira.y - 14 - cy))]);
    const sl = r.slime;
    if (sl.alive) ent.push([sl.y, () => { const sq = Math.max(0, Math.sin(sl.hop * 7)) * 2; x.drawImage(SPR.slime, Math.round(sl.x - 8 - cx), Math.round(sl.y - 12 - cy + sq), 16, 16 - sq); }]);
    const h = r.hero;
    ent.push([h.y, () => {
      if (h.inv > 0 && Math.floor(t / 80) % 2) return;
      const bob = Math.abs(Math.sin(h.walk)) > 0.7 ? -1 : 0;
      x.save();
      if (h.dir < 0) { x.translate(Math.round(h.x - cx) * 2, 0); x.scale(-1, 1); }
      x.drawImage(SPR.hero, Math.round(h.x - 8 - cx), Math.round(h.y - 14 - cy + bob));
      x.restore();
      if (h.swing > 0) { x.fillStyle = PAL.w; const sx = Math.round(h.x + h.dir * 10 - cx), sy = Math.round(h.y - 6 - cy); x.fillRect(h.dir > 0 ? sx : sx - 8, sy, 8, 2); x.fillStyle = PAL.y; x.fillRect(h.dir > 0 ? sx + 6 : sx - 8, sy - 1, 2, 4); }
    }]);
  }
  ent.sort((a, b) => a[0] - b[0]).forEach((e) => e[1]());
  if (r) {
    x.font = '8px monospace'; x.textAlign = 'center';
    r.fx.forEach((f) => { x.fillStyle = PAL.k; x.fillText(f.text, Math.round(f.x - cx) + 1, Math.round(f.y - cy - (0.8 - f.t) * 14) + 1); x.fillStyle = PAL.y; x.fillText(f.text, Math.round(f.x - cx), Math.round(f.y - cy - (0.8 - f.t) * 14)); });
    if (r.near && s.screen === 'play') { x.fillStyle = PAL.w; x.fillRect(Math.round(r.mira.x - cx) - 1, Math.round(r.mira.y - 26 - cy + Math.sin(t / 200)), 3, 6); }
  }
  if (s.over && r?.hero.hp <= 0) { x.fillStyle = `rgba(30,30,40,${0.6 - s.over * 0.6})`; x.fillRect(0, 0, W, H); }
  // minimap
  const mm = G.layer.querySelector('#gm-mini');
  if (mm && r && !mm.closest('[hidden]')) {
    const m = mm.getContext('2d');
    for (let ty = 0; ty < MH; ty++) for (let tx = 0; tx < MW; tx++) { const ch = MAP[ty][tx]; m.fillStyle = ch === 'T' ? PAL.G : ch === '~' ? PAL.b : ch === '=' ? PAL.o : ch === 'W' ? PAL.q : PAL.g; m.fillRect(tx, ty, 1, 1); }
    r.coins.forEach((c) => { if (!c.got) { m.fillStyle = PAL.y; m.fillRect(Math.floor(c.x / TS), Math.floor(c.y / TS), 1, 1); } });
    m.fillStyle = PAL.B; m.fillRect(Math.floor(r.mira.x / TS), Math.floor(r.mira.y / TS), 1, 1);
    if (Math.floor(t / 300) % 2) { m.fillStyle = PAL.w; m.fillRect(Math.floor(r.hero.x / TS), Math.floor(r.hero.y / TS), 1, 1); }
  }
}

// ---------------------------------------------------------------- sizing: whole-number scale, crisp pixels
function fit() {
  const { cv, root } = G;
  const w = root.clientWidth || 800, h = root.clientHeight || 450;
  const sc = Math.max(2, Math.round(Math.min(w / 300, h / 190)));
  cv.width = Math.ceil(w / sc); cv.height = Math.ceil(h / sc);
  cv.style.width = cv.width * sc + 'px'; cv.style.height = cv.height * sc + 'px';
  G.root.style.setProperty('--g-px', Math.max(2, Math.min(4, sc)) + 'px');
}

// ---------------------------------------------------------------- input
function menuMove(dir) {
  const sec = document.activeElement?.closest('.game-overlay, .game-center, .game-dialogue');
  if (!sec) return focusFirst();
  const items = [...sec.querySelectorAll('.game-btn:not(:disabled), .game-option, [data-bind], .game-tab, .game-slot:not(:disabled)')].filter((el) => !el.closest('[hidden]'));
  const i = items.indexOf(document.activeElement);
  const n = items[(i + dir + items.length) % items.length]; n?.focus();
}
function adjust(el, d) {
  const s = S(), o = el?.dataset.opt;
  if (o === 'sfx') { s.opts.sfx = Math.max(0, Math.min(10, s.opts.sfx + d)); sfx('coin'); }
  else if (o === 'shake') s.opts.shake = !s.opts.shake;
  else if (o === 'lang') { G.ctx.setLang(G.ctx.lang === 'ja' ? 'en' : 'ja'); G.ctx.rerender(); return; }
  else return;
  ui(); G.layer.querySelector(`[data-opt="${o}"]`)?.focus();
}
function pausePressed() {
  const s = S();
  if (s.screen === 'play') go('pause');
  else if (s.screen === 'pause') go('play');
  else if (['settings', 'controls', 'items'].includes(s.screen)) back();
}
function rebind(code, kind) {
  const s = S(), act = s.rebind; if (!act) return;
  const map = kind === 'pad' ? s.pad : s.keys;
  const other = Object.keys(map).find((a) => a !== act && map[a] === code);
  if (other) map[other] = map[act];
  map[act] = code; s.rebind = null;
  s.note = other ? T('controls.swapped', { a: T('action.' + other) }) : '';
  ui(); G.layer.querySelector(`[data-bind="${act}"]`)?.focus();
}
function onKey(e) {
  const s = S();
  setDevice('keyboard'); wakeAudio();
  if (s.rebind) { e.preventDefault(); if (e.code === 'Escape') { s.rebind = null; ui(); return; } if (['Enter', 'Tab'].includes(e.code)) return; return rebind(e.code, 'key'); }
  const inMenu = s.screen !== 'play';
  if (e.code === 'Escape' || e.code === 'KeyP') {
    e.preventDefault();
    if (s.screen === 'dialogue') return choose('close');
    if (s.screen === 'title' || s.screen === 'gameover' || s.screen === 'results') return;
    return pausePressed();
  }
  if (inMenu) {
    if (['ArrowDown', 'KeyS'].includes(e.code)) { e.preventDefault(); return menuMove(1); }
    if (['ArrowUp', 'KeyW'].includes(e.code)) { e.preventDefault(); return menuMove(-1); }
    if (['ArrowLeft', 'ArrowRight'].includes(e.code) && document.activeElement?.dataset.opt) { e.preventDefault(); return adjust(document.activeElement, e.code === 'ArrowLeft' ? -1 : 1); }
    if (['ArrowLeft', 'ArrowRight'].includes(e.code) && document.activeElement?.dataset.ctab) { e.preventDefault(); s.ctab = s.ctab === 'gamepad' || (!s.ctab && s.device === 'gamepad') ? 'keyboard' : 'gamepad'; ui(); G.layer.querySelector('[data-ctab][aria-selected=true]')?.focus(); return; }
    if (e.code === 'KeyR' && s.screen === 'controls') { s.keys = { ...DEF_KEYS }; s.pad = { ...DEF_PAD }; ui(); return; }
    if ((e.code === 'Enter' || e.code === 'Space') && document.activeElement?.matches('[data-bind], .game-option')) { e.preventDefault(); return activate(document.activeElement); }
    return;
  }
  if (e.repeat) return;
  const gameKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyW', 'KeyA', 'KeyS', 'KeyD', s.keys.fire, s.keys.interact, 'Space'];
  if (gameKeys.includes(e.code)) e.preventDefault();
  G.held.add(e.code);
  if (e.code === s.keys.fire) swing();
  if (e.code === s.keys.interact || (e.code === 'Enter' && s.run?.near)) interact();
}
function onKeyUp(e) { G.held.delete(e.code); }
function activate(el) {
  const s = S();
  if (el.dataset.bind) { s.rebind = el.dataset.bind; s.ctab = s.ctab || (s.device === 'gamepad' ? 'gamepad' : 'keyboard'); s.note = ''; ui(); G.layer.querySelector(`[data-bind="${el.dataset.bind}"]`)?.focus(); return; }
  if (el.dataset.opt) return adjust(el, 1);
  if (el.dataset.ctab) { s.ctab = el.dataset.ctab; s.rebind = null; ui(); G.layer.querySelector(`[data-ctab="${s.ctab}"]`)?.focus(); return; }
  if (el.dataset.choice) return choose(el.dataset.choice);
  const a = el.dataset.gm;
  if (a === 'new') return startRun();
  if (a === 'continue' || a === 'resume') return go('play');
  if (a === 'settings' || a === 'controls' || a === 'items') return go(a);
  if (a === 'back') return back();
  if (a === 'pause') return go('pause');
  if (a === 'quit') { s.prev = 'title'; return go('title'); }
  if (a === 'resetkeys') { s.keys = { ...DEF_KEYS }; s.pad = { ...DEF_PAD }; s.note = ''; ui(); return; }
  if (a === 'potion') {
    const r = s.run; if (!r?.bag.potion) return;
    if (r.hero.hp >= r.hero.max) { s.note = T('items.full'); ui(); G.layer.querySelector('[data-gm="potion"]')?.focus(); return; }
    r.bag.potion -= 1; r.hero.hp += 1; sfx('heal'); s.note = T('items.potion_used'); ui(); G.layer.querySelector('[data-gm="back"]')?.focus();
  }
}
function onClick(e) {
  const el = e.target.closest('[data-gm], [data-choice], [data-bind], [data-opt], [data-ctab]');
  wakeAudio();
  if (!el || !G.root.contains(el)) return;
  e.preventDefault(); e.stopPropagation();
  activate(el);
}
function onPointer(e) { setDevice(e.pointerType === 'touch' ? 'touch' : 'mouse'); wakeAudio(); }
function bindStick() {
  const st = G.layer.querySelector('#gm-stick'); if (!st) return;
  let id = null, o = null;
  st.addEventListener('pointerdown', (e) => { id = e.pointerId; o = [e.clientX, e.clientY]; st.setPointerCapture(id); });
  st.addEventListener('pointermove', (e) => {
    if (e.pointerId !== id) return;
    const dx = e.clientX - o[0], dy = e.clientY - o[1], d = Math.hypot(dx, dy);
    G.stick.x = d < 12 ? 0 : Math.max(-1, Math.min(1, dx / 40)); G.stick.y = d < 12 ? 0 : Math.max(-1, Math.min(1, dy / 40));
  });
  const end = () => { id = null; G.stick.x = 0; G.stick.y = 0; };
  st.addEventListener('pointerup', end); st.addEventListener('pointercancel', end);
  G.layer.querySelectorAll('[data-hold]').forEach((b) => b.addEventListener('pointerdown', (e) => { e.preventDefault(); if (b.dataset.hold === 'fire') swing(); else interact(); }));
}
function pollPad() {
  const pads = navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : [];
  G.pad.x = 0; G.pad.y = 0;
  const p = pads[0]; if (!p) return;
  const s = S(), prev = G.padPrev, now = p.buttons.map((b) => b.pressed);
  const was = (i) => now[i] && !prev[i];
  const ax = Math.abs(p.axes[0]) > 0.25 ? p.axes[0] : 0, ay = Math.abs(p.axes[1]) > 0.25 ? p.axes[1] : 0;
  G.pad.x = ax + (now[15] ? 1 : 0) - (now[14] ? 1 : 0); G.pad.y = ay + (now[13] ? 1 : 0) - (now[12] ? 1 : 0);
  if (now.some(Boolean) || ax || ay) { if (G.root.contains(document.activeElement) || document.activeElement === G.root) setDevice('gamepad'); }
  if (!(G.root.contains(document.activeElement) || document.activeElement === G.root)) { G.padPrev = now; return; } // only while the game has focus
  if (s.rebind) { const i = now.findIndex((b, k) => b && !prev[k] && k < 4); if (i >= 0) rebind(i, 'pad'); if (was(1)) { s.rebind = null; ui(); } G.padPrev = now; return; }
  if (was(9)) pausePressed();
  if (s.screen === 'play') { if (was(s.pad.fire)) swing(); if (was(s.pad.interact)) interact(); }
  else {
    if (was(12)) menuMove(-1); if (was(13)) menuMove(1);
    if (was(14) || was(15)) { const el = document.activeElement; if (el?.dataset.opt) adjust(el, was(14) ? -1 : 1); }
    if (was(0)) { const el = document.activeElement; if (el && G.root.contains(el)) { if (el.matches('[data-bind], .game-option, [data-ctab]')) activate(el); else el.click(); } }
    if (was(1)) { if (s.screen === 'dialogue') choose('close'); else if (s.screen !== 'title') pausePressed(); }
    if (was(3) && s.screen === 'controls') { s.keys = { ...DEF_KEYS }; s.pad = { ...DEF_PAD }; ui(); }
  }
  G.padPrev = now;
}

// ---------------------------------------------------------------- lifecycle
function loop(t) {
  if (!G) return;
  const dt = Math.min(0.05, (t - (G.last || t)) / 1000); G.last = t;
  pollPad();
  update(dt);
  draw(t);
  G.raf = requestAnimationFrame(loop);
}
function stop() {
  if (!G) return;
  cancelAnimationFrame(G.raf);
  G.off.forEach((f) => f());
  G.audio?.close?.();
  G = null;
}
function mount(ctx, stage) {
  stop();
  sprites();
  const root = stage.querySelector('#gm-root'); if (!root) return;
  G = { ctx, root, layer: root.querySelector('#gm-layer'), cv: root.querySelector('#gm-canvas'), held: new Set(), padPrev: [], pad: { x: 0, y: 0 }, stick: { x: 0, y: 0 }, audio: null, off: [] };
  G.x = G.cv.getContext('2d');
  const s = S();
  s.device = s.device || (ctx.device === 'phone' ? 'touch' : 'keyboard');
  if (ctx.device !== 'phone' && s.device === 'touch') s.device = 'keyboard';
  root.dataset.device = s.device;
  if (s.screen === 'play' && s.run) s.screen = 'pause'; // coming back (language change, app switch) lands on the pause menu
  const on = (el, ev, fn, opt) => { el.addEventListener(ev, fn, opt); G.off.push(() => el.removeEventListener(ev, fn, opt)); };
  on(root, 'keydown', onKey); on(root, 'keyup', onKeyUp); on(root, 'click', onClick, true); on(root, 'pointerdown', onPointer, true);
  on(root, 'focusout', (e) => { if (G.rendering || !e.target.isConnected) return; if (!root.contains(e.relatedTarget) && S().screen === 'play') { G.held.clear(); go('pause', { nofocus: true }); } });
  on(window, 'blur', () => { if (S().screen === 'play') go('pause', { nofocus: true }); G && G.held.clear(); });
  on(document, 'visibilitychange', () => { if (document.hidden && S().screen === 'play') go('pause', { nofocus: true }); });
  const ro = new ResizeObserver(() => fit()); ro.observe(root); G.off.push(() => ro.disconnect());
  fit();
  ui();
  const a = document.activeElement;
  if (!a || a === document.body || stage.contains(a)) focusFirst();
  G.raf = requestAnimationFrame(loop);
}

export default {
  id: 'game', icon: 'game', host: 'meadow-quest.local', archetype: 'GameRpg', start: 'play',
  name: { en: 'Meadow Quest', ja: 'メドウクエスト' }, short: { en: 'Game', ja: 'ゲーム' },
  about: {
    en: 'A small playable RPG from the game blocks: title, HUD, dialogue with choices, pause, items, settings, controls remapping, game over and results. The world is a plain canvas loop here (LittleJS can’t be stopped when you switch apps in this one page); menus and text are HTML over it.',
    ja: 'ゲームブロックで作った小さなRPG。タイトル、HUD、選択肢つきの会話、ポーズ、もちもの、設定、操作の変更、ゲームオーバー、結果画面。このページではアプリを切り替えても止められるよう、世界は LittleJS ではなく素の canvas で描いています。メニューと文字は canvas の上の HTML です。',
  },
  try: {
    en: 'Click the game first so it has focus. Move with WASD or the arrows, press E by Old Mira and pick an answer, collect five coins, J swings at the slime, Esc pauses. In Controls, change Swing to another key. On Phone, use the stick and buttons.',
    ja: 'まずゲームをクリックしてフォーカスを移します。WASD か矢印キーで移動、ミラおばあさんの前で E を押して答えを選び、コインを5枚集めます。J でスライムに振り、Esc でポーズ。操作で「振る」のキーを変えられます。スマートフォン表示ではスティックとボタンで遊べます。',
  },
  messages: M,
  init: fresh,
  render(ctx) {
    return html`<div class="game" id="gm-root" data-block="GameKit" tabindex="0" aria-label="${ctx.t('game.name')}" style="height:100%;width:100%;place-items:center;outline:none" lang="${ctx.lang}">
      <canvas id="gm-canvas" aria-hidden="true" style="grid-area:1/1"></canvas>
      <div class="game-layer" id="gm-layer" style="width:100%;height:100%"></div>
    </div>`;
  },
  mount,
  unmount() { stop(); },
  actions: {},
};
