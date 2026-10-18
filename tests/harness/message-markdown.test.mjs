import test from 'node:test';
import assert from 'node:assert/strict';
import { spoken, inlineTokens, messageBlocks } from '../../js/message-markdown.mjs';

test('the reply marker is the harness’s, not the reader’s', () => {
  assert.equal(spoken('[CANARY] Done.'), 'Done.');
  assert.equal(spoken('[CANARY]Done.'), 'Done.');
  assert.equal(spoken('  [CANARY]\n\nDone.'), 'Done.');
  assert.equal(spoken('Quoting [CANARY] mid-text stays.'), 'Quoting [CANARY] mid-text stays.');
  assert.equal(spoken(''), '');
});

test('the marker in code or bold is hidden too, and never flashes while a reply streams (task 324)', () => {
  assert.equal(spoken('`[CANARY]` Done.'), 'Done.');
  assert.equal(spoken('**[CANARY]**\n\nDone.'), 'Done.');
  assert.equal(spoken('[CANARY]\n- one\n- two'), '- one\n- two', 'a list after the marker keeps its first bullet');
  assert.equal(spoken('[CANARY]\n**Bold** start'), '**Bold** start');
  for (const head of ['[', '[CAN', '`[CANARY', '**[CANARY]']) assert.equal(spoken(head, true), '', head);
  assert.equal(spoken('[CAN'), '[CAN', 'only while streaming');
});

test('inline marks become tokens, never HTML', () => {
  assert.deepEqual(inlineTokens('a **b** `c` *d* [e](https://x.test/y) <b>f</b>'), [
    { type: 'text', text: 'a ' }, { type: 'strong', text: 'b' }, { type: 'text', text: ' ' }, { type: 'code', text: 'c' },
    { type: 'text', text: ' ' }, { type: 'em', text: 'd' }, { type: 'text', text: ' ' }, { type: 'link', text: 'e', href: 'https://x.test/y' },
    { type: 'text', text: ' <b>f</b>' }]);
  assert.deepEqual(inlineTokens('[x](javascript:alert(1))'), [{ type: 'text', text: '[x](javascript:alert(1))' }], 'only http(s) links');
  assert.deepEqual(inlineTokens('2 * 3 * 4'), [{ type: 'text', text: '2 * 3 * 4' }], 'a lone star is text');
});

test('consecutive list items group into one list', () => {
  const blocks = messageBlocks('## Result\n\nText **b**.\n\n1. One\n2. Two\n\n- a\n- b\n\n```py\nprint(1)\n```');
  assert.deepEqual(blocks.map(block => [block.tag, block.items?.length ?? block.text]), [
    ['h3', 'Result'], ['p', 'Text **b**.'], ['ol', 2], ['ul', 2], ['pre', 'print(1)']]);
});

test('GFM tables become tables (task 143)', () => {
  const [table] = messageBlocks('| If you are… | Action | Example |\n| :--- | :---: | ---: |\n| **Looking** | Use `sou` | 美味しそう |\n| Told | Use *sou* | おいしいそう |');
  assert.equal(table.tag, 'table');
  assert.deepEqual(table.head, ['If you are…', 'Action', 'Example']);
  assert.deepEqual(table.align, ['left', 'center', 'right']);
  assert.deepEqual(table.rows, [['**Looking**', 'Use `sou`', '美味しそう'], ['Told', 'Use *sou*', 'おいしいそう']]);
  assert.equal(messageBlocks('a | b\n--- | ---\n1 | 2')[0].tag, 'table', 'outer pipes are optional');
  assert.equal(messageBlocks('Costs | about 3 | hours')[0].tag, 'p', 'a pipe in a sentence is not a table');
});
test('model reply shapes: a list right under text, a numbered list split by code, a multi-line quote (task 150)',()=>{
 assert.deepEqual(messageBlocks('Steps:\n1. one\n2. two').map(block=>block.tag),['p','ol']);
 const split=messageBlocks('1. one\n\n```\ncode\n```\n\n2. two');assert.equal(split.at(-1).start,2,'keeps counting after the code block');
 assert.deepEqual(messageBlocks('> a\n> b\n\n> c').map(block=>block.text),['a\nb','c']);
});

test('underscores inside identifiers never start emphasis (task 324: add_habit, get_daily_stats)', () => {
  assert.deepEqual(inlineTokens('Call add_habit and get_daily_stats.'), [{ type: 'text', text: 'Call add_habit and get_daily_stats.' }]);
  assert.deepEqual(inlineTokens('an _emphasised_ word'), [{ type: 'text', text: 'an ' }, { type: 'em', text: 'emphasised' }, { type: 'text', text: ' word' }]);
  assert.deepEqual(inlineTokens('snake_case_name'), [{ type: 'text', text: 'snake_case_name' }]);
});

test('a small model’s numbered questions with lettered options become nested lists (task 324)', () => {
  assert.deepEqual(messageBlocks('1. Which colour?\n   * A) Red\n   * B) Blue\n2. Which size?\n   * A) Big').map(block => block.items), [[
    { text: 'Which colour?', items: ['A) Red', 'B) Blue'], checked: undefined }, { text: 'Which size?', items: ['A) Big'], checked: undefined }]]);
  assert.deepEqual(messageBlocks('1. Which colour? * A) Red * B) Blue')[0].items[0], { text: 'Which colour?', items: ['A) Red', 'B) Blue'], checked: undefined });
  assert.deepEqual(messageBlocks('```\n1. x\n   * y\n```'), [{ tag: 'pre', text: '1. x\n   * y' }], 'code stays code');
});
