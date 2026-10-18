// Round 12 (R12_Fixes): Markdown links in Work are links. `[Subjects](tasks/002-subjects.md)` in ROADMAP.md reads as the
// link “Subjects”: a click opens the task in Work, ⌘-click (Ctrl-click) in a new tab; in Edit mode the source shows on
// focus, like the other inline Markdown readings (`.pw-block--plan`). Links to the web open in a new tab.
import { routePath } from './router.mjs';
const LINK=/\[([^\]\n]+)\]\(([^)\s]+)\)/g;
const node=(tag,cls='',text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;};

/** A project-relative target resolved against the open page (projects/<id>/…), or null when it leaves the project. */
export function resolveLink(page,target){
 const match=String(page||'').match(/^projects\/([^/]+)\/(.*)$/);if(!match||/^[a-z][a-z0-9+.-]*:/i.test(target)||target.startsWith('/'))return null;
 const parts=match[2].split('/').slice(0,-1);
 for(const part of decodeURI(target.split('#')[0]).split('/')){if(!part||part==='.')continue;if(part==='..'){if(!parts.length)return null;parts.pop();}else parts.push(part);}
 return parts.length?{project:match[1],path:`projects/${match[1]}/${parts.join('/')}`}:null;
}

/** The reading of a block whose text has Markdown links, or null (plan stamps and decision lines have their own). */
export function linkReading(text,{page,open,focus}){
 if(!LINK.test(text)||/^Plan approved:/.test(text)||/\((?:chosen|given|auto)\)$/.test(text))return null;LINK.lastIndex=0;
 const reading=node('div','pw-plan-reading pw-link-reading');reading.dataset.noTranslate='';let at=0;
 for(const found of text.matchAll(LINK)){
  if(found.index>at)reading.append(text.slice(at,found.index));at=found.index+found[0].length;
  const [,label,target]=found,local=resolveLink(page,target),web=/^https?:\/\//i.test(target);
  if(!local&&!web){reading.append(found[0]);continue;}
  const a=node('a','pw-link',label);
  if(web){a.href=target;a.target='_blank';a.rel='noopener noreferrer';}
  else{a.href=routePath({level:'project',project:local.project,view:'work',file:local.path});a.onclick=event=>{if(event.metaKey||event.ctrlKey||event.shiftKey||event.button!==0)return;event.preventDefault();open(local.path);};}
  a.addEventListener('mousedown',event=>event.preventDefault());/* a press must not move focus into the block: its source would replace the link before the click */a.addEventListener('click',event=>event.stopPropagation());reading.append(a);
 }
 if(at<text.length)reading.append(text.slice(at));
 reading.onclick=()=>focus();return reading;
}
