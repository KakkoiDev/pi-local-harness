// Round 12: two refusals with their own words instead of the generic error line.
// - A stale page (task 261, R12_Grant): plh restarted, so the page's person secret is old and a person route answers 403
//   with `stale`. The alert line appears where the press happened (inside that card), with Reload Page; the reload keeps
//   the draft (saved as you type) and the chat's scroll position.
// - Rename refused while terminal Pi works (task 262, R12_Renamed): its own alert, Show in Activity · OK.
const node=(tag,cls='',text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;};
const KEY='plh.reload-scroll';
let pressed=null;

export const STALE='This page is out of date after plh restarted, so your choice wasn’t sent. Reload the page, then choose again.';

/** Remember the control the person pressed last, and give the chat back its scroll position after Reload Page. */
export function installStalePage(){
 document.addEventListener('pointerdown',event=>{pressed=event.target.closest?.('button,a,[role^="menuitem"],input')||pressed;},true);
 document.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' ')pressed=document.activeElement;},true);
 let saved=null;try{saved=JSON.parse(sessionStorage.getItem(KEY)||'null');sessionStorage.removeItem(KEY);}catch{}
 if(saved&&typeof saved.thread==='number'){const started=Date.now(),restore=()=>{const thread=document.getElementById('thread');if(thread&&thread.scrollHeight>saved.thread){thread.scrollTop=saved.thread;return;}if(Date.now()-started<4000)setTimeout(restore,100);};setTimeout(restore,100);}
}

function reload(){try{sessionStorage.setItem(KEY,JSON.stringify({thread:document.getElementById('thread')?.scrollTop||0}));}catch{}location.reload();}

/** The alert line for a stale page, placed in the card (or dialog, or form) of the last press. */
export function showStale(){
 const at=pressed?.isConnected?pressed:document.activeElement;
 const host=at?.closest?.('.pw-card,dialog[open],.pw-dialog,form')||document.getElementById('error')?.parentElement||document.body;
 host.querySelectorAll(':scope>.pw-stale').forEach(el=>el.remove());
 const line=node('p','pw-alert-line pw-stale'),again=node('button','pw-btn pw-btn--default','Reload Page');line.setAttribute('role','alert');again.type='button';again.onclick=reload;
 line.append(node('span','',STALE),again);
 if(host===document.getElementById('error')?.parentElement)host.insertBefore(line,document.getElementById('error'));else host.append(line);
 return line;
}

/** Can't rename “<name>” while terminal Pi works in it. Show in Activity · OK (OK is the default). */
export async function terminalBusy(ask,data,showActivity){
 document.getElementById('name-dialog')?.open&&document.getElementById('name-dialog').close('cancel');
 const since=data.since?` (a request started at ${data.since})`:'';
 const answer=await ask({icon:'note',message:data.error,detail:`plh in a terminal is using this folder${since}. Wait until it finishes, or stop it with Esc in that terminal. Nothing was changed.`,danger:'Show in Activity',safe:'OK',plain:true});
 if(answer==='danger')showActivity?.();
}
