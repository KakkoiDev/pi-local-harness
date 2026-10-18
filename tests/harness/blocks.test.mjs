// Plan 266 item 7 (task 317): System 1 picks the App Block cards a request calls for; Pi never browses the library.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadBlocks, chooseBlocks, blocksPrompt, blocksHint, loadCard, installBlocks, MAX_CARDS, BUDGET } from '../../harness/blocks.mjs';

const index = loadBlocks();

test('English and Japanese requests get exactly the matching card', () => {
  const cards = text => chooseBlocks(text, index).cards;
  const cases = [
    ['Add a login page', ['LogIn']], ['ログイン画面を作って', ['LogIn']],
    ['I want a side panel with sections', ['SidePanel']], ['サイドバーを付けたい', ['SidePanel']],
    ['build an online shop', ['AppShop']], ['オンラインショップを作りたい', ['AppShop']], ['通販サイトを作る', ['AppShop']],
    ['a kanban board for my tasks', ['Kanban']], ['カンバンでタスク管理', ['Kanban']],
    ['make an RPG', ['GameRpg']], ['RPGを作りたい', ['GameRpg']],
    ['add a bar chart of sales', ['BarChart']], ['売上の棒グラフ', ['BarChart']],
    ['show the cart with a coupon field', ['Cart', 'Coupons']], ['カートを表示', ['Cart']],
    ['data table of customers', ['DataTable']],
    ['admin dashboard please', ['AppAdmin']], ['ゲーム設定を追加', ['GameSettings']],
    ['Rename area_rect to rectangle_area', []], ['Write a README', []],
  ];
  for (const [text, expected] of cases) assert.deepEqual(cards(text), expected, text);
});

test('a longer phrase wins over the words inside it', () => {
  assert.deepEqual(chooseBlocks('an admin dashboard', index).cards, ['AppAdmin'], 'not also Dashboard');
  assert.deepEqual(chooseBlocks('open the command palette', index).cards, ['CommandPalette'], 'not ArtPalettes');
  assert.deepEqual(chooseBlocks('ミニマップを表示', index).cards, ['HudPieces'], 'not the map card');
});

test('never more than the cap; the rest are named, not attached', () => {
  const chosen = chooseBlocks('add login, sign up, forgot password and log out pages', index);
  assert.equal(chosen.cards.length, MAX_CARDS);
  assert.deepEqual(chosen.cards, ['LogIn', 'SignUp']);
  assert.deepEqual(chosen.others, ['ForgotPassword', 'LogOut']);
  const prompt = blocksPrompt(chosen.cards, index, BUDGET, chosen.others);
  assert.ok((prompt.match(/^# /gm) || []).length <= MAX_CARDS + 1, 'at most two cards and the foundation they assume');
  assert.match(prompt, /^# LogIn$/m); assert.match(prompt, /^# AppFoundations$/m);
  const more = prompt.match(/Also relevant \(load with app_block when you need it\): (.*)\.$/m)?.[1].split(', ') || [];
  assert.ok(/^# SignUp$/m.test(prompt) || more.includes('SignUp'), 'a card over the budget is named instead');
  for (const name of ['ForgotPassword', 'LogOut']) assert.ok(more.includes(name), name);
  assert.ok(prompt.length < BUDGET + 600, 'within the budget');
  assert.doesNotMatch(prompt, /\{harness\}/, 'paths point at the installed harness');
});

test('an archetype comes with its block names and the tool, not its blocks', () => {
  const prompt = blocksPrompt(chooseBlocks('build an online shop', index).cards, index);
  assert.match(prompt, /^# AppShop$/m); assert.match(prompt, /^# AppFoundations$/m);
  assert.doesNotMatch(prompt, /^# Cart$/m);
  assert.match(prompt, /Load a block’s card with the app_block tool[^\n]*Cart/);
  assert.match(blocksPrompt(['GameRpg'], index), /^# GameKit$/m, 'a game assumes the game kit');
});

test('common or shared words only: candidates for the classifier, nothing attached', () => {
  for (const [text, expected] of [['fix the settings', ['SettingsPage']], ['a table of orders', ['DataTable']], ['add a chart', ['BarChart', 'DonutChart', 'LineChart']], ['グラフを追加', ['BarChart', 'DonutChart', 'LineChart']]]) {
    const chosen = chooseBlocks(text, index);
    assert.deepEqual(chosen.cards, [], text); assert.deepEqual(chosen.candidates, expected, text);
  }
  assert.match(blocksHint(['SettingsPage']), /SettingsPage[^\n]*app_block/);
  assert.equal(blocksHint([]), '');
});

test('the app_block tool loads one card by its exact name and refuses anything else', async () => {
  let tool; installBlocks({ registerTool(definition) { tool = definition; } }, { index });
  assert.equal(tool.name, 'app_block');
  const card = await tool.execute('1', { name: 'Kanban' });
  assert.ok(!card.isError); assert.match(card.content[0].text, /^# Kanban/); assert.equal(card.details.block, 'Kanban');
  assert.match((await tool.execute('2', { name: 'kanban' })).content[0].text, /^# Kanban/, 'the same name in another case');
  for (const name of ['Kanbann', '../../etc/passwd', '', 'kit/blocks/content/Kanban.md']) {
    const refused = await tool.execute('3', { name });
    assert.equal(refused.isError, true, name); assert.match(refused.content[0].text, /No App Block called/);
  }
  assert.match(loadCard('chart', index).error, /BarChart/, 'the nearest real names');
});
