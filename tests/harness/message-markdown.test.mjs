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
