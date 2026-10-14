// Preserve every original block until it is edited; unsupported syntax stays raw.
export function parseMarkdown(markdown) {
 const lines=markdown.split('\n'),blocks=[];let index=0;
 const prefix=markdown.match(/^(?:[ \t]*\n)+|^[ \t]+$/)?.[0];
 if(prefix){blocks.push({type:'raw',text:prefix,raw:prefix,dirty:false});index=prefix.split('\n').length-1;if(prefix===markdown)return blocks;}
 while(index<lines.length){
  if(!lines[index].trim()){index++;continue;}
  const start=index;let type='text',text='',level=0,checked=false,language='';
  const first=lines[index];
  if(/^```/.test(first)){type='code';language=first.slice(3);index++;const body=[];while(index<lines.length&&!/^```/.test(lines[index]))body.push(lines[index++]);if(index<lines.length)index++;text=body.join('\n');}
  else if(start===0&&first==='---'){type='raw';index++;while(index<lines.length&&lines[index]!=='---')index++;if(index<lines.length)index++;text=lines.slice(start,index).join('\n');}
  else if(/^#{1,6} /.test(first)){type='heading';level=first.match(/^#+/)[0].length;text=first.slice(level+1);index++;}
  else if(/^[-*] \[[ xX]\] /.test(first)){type='check';checked=/\[[xX]\]/.test(first);text=first.slice(6);index++;}
  else if(/^[-*] /.test(first)){type='bullet';text=first.slice(2);index++;}
  else if(/^\d+\. /.test(first)){type='number';text=first.replace(/^\d+\. /,'');index++;}
  else if(/^> /.test(first)){type='quote';text=first.slice(2);index++;}
  else{while(index<lines.length&&lines[index].trim())index++;text=lines.slice(start,index).join('\n');if(text.includes('|')||/^</.test(text)||/^~~~/.test(text))type='raw';}
  while(index<lines.length&&!lines[index].trim())index++;
  blocks.push({type,text,level,checked,language,raw:lines.slice(start,index).join('\n')+(index<lines.length?'\n':''),dirty:false});
 }
 return blocks;
}
// Unchanged blocks keep their exact text. An edited block is separated from its neighbours by a blank line, except
// between items of the same list, which stay tight ("- a\n- b"); a block added after the last line of the file never
// merges into the paragraph above it.
const LISTS=new Set(['bullet','number','check']);
export function serializeMarkdown(blocks){
 // An empty paragraph someone just added is nothing in Markdown: it must not change the file.
 blocks=blocks.filter(block=>!(block.dirty&&block.type==='text'&&!(block.text||'').trim()));
 let out='';
 blocks.forEach((block,index)=>{
  const previous=blocks[index-1],sameList=previous&&LISTS.has(block.type)&&previous.type===block.type;
  if(block.dirty&&out&&!out.endsWith('\n\n')&&!sameList)out+=out.endsWith('\n')?'\n':'\n\n';
  if(!block.dirty){out+=block.raw;return;}
  const text=block.text||'',next=blocks[index+1];
  const value=block.type==='heading'?'#'.repeat(block.level||1)+' '+text:block.type==='check'?`- [${block.checked?'x':' '}] ${text}`:block.type==='bullet'?'- '+text:block.type==='number'?'1. '+text:block.type==='quote'?'> '+text:block.type==='code'?'```'+(block.language||'')+'\n'+text+'\n```':text;
  out+=value+(!next?'\n':LISTS.has(block.type)&&next.type===block.type?'\n':'\n\n');
 });
 return out;
}
