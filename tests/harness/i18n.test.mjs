// The workbench's own language (plan 198): English is the key; exact strings and patterns with parts that change.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { translator, chosenLanguage } from '../../js/i18n.mjs';

test('exact strings keep their spacing; patterns keep their parts, and translate a part that has its own translation', () => {
  const translate = translator({ exact: { Cancel: 'キャンセル', Running: '実行中' }, patterns: [['Preview · {name}', 'プレビュー · {name}'], ['State: {state}', '状態: {state}']] });
  assert.equal(translate('  Cancel '), '  キャンセル ');
  assert.equal(translate('Preview · Class Notes'), 'プレビュー · Class Notes', 'a project name is not translated');
  assert.equal(translate('State: Running'), '状態: 実行中');
  assert.equal(translate('Something Pi wrote'), null, 'no translation: the text stays as it is');
  assert.equal(translate('   '), null);
});

test('count parts match only numbers: a sentence Pi wrote that ends in "tasks" stays as it is (the translation review)', () => {
  const translate = translator({ exact: {}, patterns: [['{n} tasks', '{n} 件のタスク'], ['Using {tool}', '{tool} を使用中']] });
  assert.equal(translate('3 tasks'), '3 件のタスク');
  assert.equal(translate('Something Pi wrote about tasks'), null);
  assert.equal(translate('Using bash'), 'bash を使用中', 'a part that is not a count matches any text');
});

test('the language: the person\'s choice, else the browser\'s, else English', () => {
  assert.equal(chosenLanguage('ja', ['en-US']), 'ja');
  assert.equal(chosenLanguage('system', ['ja-JP', 'en']), 'ja');
  assert.equal(chosenLanguage(null, ['fr-FR']), 'en');
});

test('messages/ja.json is well formed: every pattern keeps its parts', () => {
  const messages = JSON.parse(readFileSync(new URL('../../messages/ja.json', import.meta.url), 'utf8'));
  assert.ok(Object.keys(messages.exact).length > 100, 'the workbench\'s strings');
  for (const [source, target] of messages.patterns) {
    const parts = text => (text.match(/\{\w+\}/g) || []).sort().join();
    assert.equal(parts(target), parts(source), `${source} → ${target}`);
  }
  for (const [english, japanese] of Object.entries(messages.exact)) assert.ok(japanese.trim(), english);
});
