import test from 'node:test';
import assert from 'node:assert/strict';
import {messageBlocks,renderMessage} from '../../js/message-markdown.mjs';

test('a real fenced block starts directly after prose without a blank line',()=>{
 const blocks=messageBlocks('Here is the file:\n```markdown\n# Simple App\n\nA short description.\n```\nDone.');
 assert.deepEqual(blocks.map(x=>x.tag),['p','pre','p']);assert.equal(blocks[1].text,'# Simple App\n\nA short description.');
});
test('a wholly escaped fence decodes one layer, while normal source escapes remain literal',()=>{
 assert.deepEqual(messageBlocks('```markdown\\n# Simple App\\n\\nDescription.\\n```'),[{tag:'pre',text:'# Simple App\n\nDescription.'}]);
 const normal='```py\nprint("a\\nb")\n```';assert.equal(messageBlocks(normal)[0].text,'print("a\\nb")');
 const escaped='```py\\nprint(\\"a\\\\nb\\")\\n```';assert.equal(messageBlocks(escaped)[0].text,'print("a\\nb")');
});
class Node{
 constructor(tag){this.tag=tag;this.children=[];this.style={};}
 append(...nodes){this.children.push(...nodes);}
 setAttribute(){}
}
const document={createDocumentFragment:()=>new Node('fragment'),createElement:tag=>new Node(tag),createTextNode:text=>({tag:'#text',textContent:text})};
const descendants=node=>[node,...(node.children||[]).flatMap(descendants)];
test('a table cell displays an escaped fence as inert code and keeps pipe characters inside it',()=>{
 const source='| Field | Value |\n| --- | --- |\n| content | ```html\\n<div title=\\"a|b\\"><script>bad()</script></div>\\n``` |';
 const nodes=descendants(renderMessage(document,source));
 assert.equal(nodes.filter(x=>x.tag==='td').length,2);
 const code=nodes.filter(x=>x.tag==='pre');assert.equal(code.length,1);assert.equal(code[0].textContent,'<div title="a|b"><script>bad()</script></div>');assert.equal(nodes.filter(x=>x.tag==='script').length,0);
});

test('an escaped standalone fence does not swallow the following table',()=>{
 const source='```py\\nprint(1)\\n```\n\n| Field | Value |\n| --- | --- |\n| content | ```html\\n<div>x</div>\\n``` |';
 const blocks=messageBlocks(source);assert.deepEqual(blocks.map(x=>x.tag),['pre','table']);assert.equal(blocks[0].text,'print(1)');
 const nodes=descendants(renderMessage(document,source));assert.equal(nodes.filter(x=>x.tag==='pre').length,2);
});
