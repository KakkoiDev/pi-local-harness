import { test } from 'node:test';import assert from 'node:assert/strict';
import { parseMarkdown,serializeMarkdown } from '../../js/markdown-blocks.mjs';
test('untouched documents preserve frontmatter, code, tables and links exactly',()=>{
 const text='---\ntype: task\n---\n\n# Plan\n\n- [ ] Build\n\n```js\nconsole.log(1)\n```\n\n| A | B |\n|---|---|\n\n[[other]]\n';
 assert.equal(serializeMarkdown(parseMarkdown(text)),text);
});
test('block editing serializes headings and checkbox state as Markdown',()=>{const blocks=parseMarkdown('# Plan\n\n- [ ] Build\n');blocks[1].checked=true;blocks[1].dirty=true;assert.match(serializeMarkdown(blocks),/- \[x\] Build/);});

test('leading whitespace and empty documents round trip',()=>{for(const text of ['\n\n# Plan\n','   ','\n',''])assert.equal(serializeMarkdown(parseMarkdown(text)),text);});

test('an empty new block adds nothing to the file (clicking below the last block must not edit it)',()=>{
 const text='# Plan\n\n- [ ] Build\n',blocks=parseMarkdown(text);
 blocks.push({type:'text',text:'',dirty:true});assert.equal(serializeMarkdown(blocks),text);
 blocks.splice(1,0,{type:'text',text:'  ',dirty:true});assert.equal(serializeMarkdown(blocks),text);
});
test('a block added after the last line stays its own paragraph',()=>{const blocks=parseMarkdown('# T\n\nHello\nWorld\n');blocks.push({type:'text',text:'New',dirty:true});assert.equal(serializeMarkdown(blocks),'# T\n\nHello\nWorld\n\nNew\n');assert.equal(parseMarkdown(serializeMarkdown(blocks)).length,3);});
test('editing one item of a tight list keeps the list tight',()=>{const blocks=parseMarkdown('- a\n- b\n- c\n');blocks[1]={...blocks[1],text:'B',dirty:true};assert.equal(serializeMarkdown(blocks),'- a\n- B\n- c\n');});
