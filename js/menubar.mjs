// Menu bar: WAI-ARIA menubar pattern plus one shortcut table, both running the same commands.
const mac=/Mac|iPhone|iPad/.test(navigator.platform);
export const modifier=event=>mac?event.metaKey&&!event.ctrlKey:event.ctrlKey&&!event.metaKey;
export function shortcutOf(event){return (event.altKey?'alt+':'')+(event.shiftKey?'shift+':'')+event.code;}
export function installMenubar(bar,{run,enabled,update,shortcuts}){
 const titles=[...bar.querySelectorAll('.pw-menubar__title')],menuOf=title=>document.getElementById(title.getAttribute('aria-controls'));
 let open=null,returnTo=null;
 const items=menu=>[...menu.querySelectorAll('[role^="menuitem"]')].filter(item=>item.getAttribute('aria-disabled')!=='true');
 function roving(current){for(const title of titles)title.tabIndex=title===current?0:-1;}
 function refresh(){update();for(const item of bar.querySelectorAll('[data-command]'))item.setAttribute('aria-disabled',String(!enabled(item.dataset.command,item)));}
 function show(title,focus='first'){if(open!==title)close(false);if(!open&&!bar.contains(document.activeElement))returnTo=document.activeElement;refresh();const menu=menuOf(title);menu.hidden=false;title.setAttribute('aria-expanded','true');open=title;roving(title);const list=items(menu);(focus==='last'?list.at(-1):focus==='first'?list[0]:null)?.focus();}
 function close(focusTitle){if(!open)return;const title=open;menuOf(title).hidden=true;title.setAttribute('aria-expanded','false');open=null;if(focusTitle)title.focus();}
 function step(title,delta){const next=titles[(titles.indexOf(title)+delta+titles.length)%titles.length];if(open)show(next);else{roving(next);next.focus();}}
 function choose(item){if(item.getAttribute('aria-disabled')==='true')return;const finish=()=>{delete item.dataset.active;close(false);if(returnTo?.isConnected)returnTo.focus();returnTo=null;run(item.dataset.command,item);};if(matchMedia('(prefers-reduced-motion: reduce)').matches){finish();return;}item.dataset.active='true';setTimeout(finish,80);}
 roving(titles[0]);
 for(const title of titles){
  title.onclick=()=>open===title?close(true):show(title);
  title.onpointerenter=()=>{if(open&&open!==title)show(title,'none');};
  title.onkeydown=event=>{const keys={Enter:'first',' ':'first',ArrowDown:'first',ArrowUp:'last'};if(keys[event.key]){event.preventDefault();show(title,keys[event.key]);}else if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();step(title,event.key==='ArrowRight'?1:-1);}else if(event.key==='Escape')close(true);};
  const menu=menuOf(title);
  menu.onclick=event=>{const item=event.target.closest('[role^="menuitem"]');if(item)choose(item);};
  menu.onkeydown=event=>{const list=items(menu),index=list.indexOf(document.activeElement);
   if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();list[(index+(event.key==='ArrowDown'?1:-1)+list.length)%list.length]?.focus();}
   else if(event.key==='Home'||event.key==='End'){event.preventDefault();(event.key==='Home'?list[0]:list.at(-1))?.focus();}
   else if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();step(title,event.key==='ArrowRight'?1:-1);}
   else if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close(true);}
   else if(event.key==='Tab')close(false);
   else if(event.key==='Enter'||event.key===' '){event.preventDefault();if(index>=0)choose(list[index]);}};
 }
 document.addEventListener('pointerdown',event=>{if(open&&!bar.contains(event.target))close(false);});
 document.addEventListener('keydown',event=>{if(event.isComposing||!modifier(event))return;const command=shortcuts[shortcutOf(event)];if(!command)return;update();if(!enabled(command))return;event.preventDefault();run(command);});
 return {refresh,close};
}
