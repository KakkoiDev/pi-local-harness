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
 // Left/Right past the last title reach the model and thinking picks (MenuBar card), then wrap.
 const picks=[...bar.querySelectorAll('.pw-menubar__pick')];
 function step(title,delta){const index=titles.indexOf(title);if(picks.length&&((delta>0&&index===titles.length-1)||(delta<0&&index===0))){close(false);(delta>0?picks[0]:picks.at(-1)).focus();return;}const next=titles[(index+delta+titles.length)%titles.length];if(open)show(next);else{roving(next);next.focus();}}
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
 for(const pick of picks)pick.addEventListener('keydown',event=>{if(event.key!=='ArrowRight'&&event.key!=='ArrowLeft')return;const index=picks.indexOf(pick),next=event.key==='ArrowRight'?(picks[index+1]||titles[0]):(picks[index-1]||titles.at(-1));event.preventDefault();if(titles.includes(next))roving(next);next.focus();});
 return {refresh,close};
}
// A popup menu opened from a button (the block handle). choose(item) runs after it closes; update() runs before it opens.
export function installPopup(menu,choose,update=()=>{}){
 // A nested .pw-menu opened by an item with aria-haspopup and aria-controls is a submenu: click, hover or Right opens it; Left or Esc returns.
 let opener=null,sub=null;const items=()=>[...(sub?.contains(document.activeElement)?sub:menu).querySelectorAll(':scope>[role^="menuitem"]')],parentOf=submenu=>menu.querySelector(`[aria-controls="${submenu.id}"]`);
 function closeSub(focusParent){if(!sub)return;const parent=parentOf(sub);sub.hidden=true;sub=null;parent.setAttribute('aria-expanded','false');if(focusParent)parent.focus();}
 function openSub(parent,focusFirst){const submenu=document.getElementById(parent.getAttribute('aria-controls'));if(sub!==submenu){closeSub(false);sub=submenu;submenu.style.top=parent.offsetTop+'px';submenu.hidden=false;parent.setAttribute('aria-expanded','true');}if(focusFirst)submenu.querySelector(':scope>[role^="menuitem"]')?.focus();}
 function close(focusOpener){if(menu.hidden)return;closeSub(false);menu.hidden=true;opener?.setAttribute('aria-expanded','false');if(focusOpener)opener?.focus();}
 function open(anchor){opener=anchor;update();menu.hidden=false;anchor.setAttribute('aria-expanded','true');const box=anchor.getBoundingClientRect();if(menu.classList.contains('pw-menu--end')){menu.style.left='auto';menu.style.right=Math.max(4,innerWidth-box.right)+'px';}/* right-aligned (menu-bar picks): setting left too stretched it wider on every open */else menu.style.left=Math.max(4,Math.min(box.left,innerWidth-menu.offsetWidth-4))+'px';menu.style.top=(box.bottom+menu.offsetHeight+4>innerHeight?Math.max(4,box.top-menu.offsetHeight-2):box.bottom+2)+'px';items()[0]?.focus();}
 menu.onclick=event=>{const item=event.target.closest('[role^="menuitem"]');if(!item)return;if(item.getAttribute('aria-haspopup')){openSub(item,true);return;}close(false);choose(item);};
 menu.onpointerover=event=>{const item=event.target.closest('[role^="menuitem"]');if(item?.parentElement!==menu)return;if(item.getAttribute('aria-haspopup'))openSub(item,false);else closeSub(false);};
 menu.onkeydown=event=>{const list=items(),index=list.indexOf(document.activeElement);
  if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();list[(index+(event.key==='ArrowDown'?1:-1)+list.length)%list.length]?.focus();}
  else if(event.key==='Home'||event.key==='End'){event.preventDefault();(event.key==='Home'?list[0]:list.at(-1))?.focus();}
  else if(event.key==='ArrowRight'&&document.activeElement?.getAttribute('aria-haspopup')){event.preventDefault();openSub(document.activeElement,true);}
  else if((event.key==='ArrowLeft'||event.key==='Escape')&&sub&&sub.contains(document.activeElement)){event.preventDefault();event.stopPropagation();closeSub(true);}
  else if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close(true);}
  else if(event.key==='Tab')close(false);
  else if(event.key==='Enter'||event.key===' '){event.preventDefault();if(index<0)return;if(list[index].getAttribute('aria-haspopup'))openSub(list[index],true);else{close(false);choose(list[index]);}}};
 document.addEventListener('pointerdown',event=>{if(!menu.hidden&&!menu.contains(event.target)&&!opener?.contains(event.target))close(false);});
 return {open,close};
}
