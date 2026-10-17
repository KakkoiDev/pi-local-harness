// Round 11 PhaseControl: the person chooses; Gate's saved record is the shared authority.
const NAMES={discussion:'Discussion',planning:'Planning',implementation:'Implementation'};
const MEANINGS={discussion:'Pi reads, talks and searches the web. No file changes.',planning:'Pi writes the plan: ROADMAP.md and tasks/ only. Code can’t change.',implementation:'Pi changes the files of the task in progress.'};
const PLACEHOLDERS={discussion:'Ask, discuss, or describe what you want',planning:'Describe the task to plan, or answer Pi',implementation:'Ask about the task in progress'};
const PATHS={discussion:'M1.5 2.5h13v8.5h-7l-3.5 3v-3h-2.5z',planning:'M2.5.5h11v15h-11zM5 4.5h6M5 8h6M5 11.5h4',implementation:'M9.5 1.5l5 5-2 2-5-5zM8.5 6.5l-7 7 1 1 7-7'};
const node=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;};
function glyph(phase){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg'),path=document.createElementNS(svg.namespaceURI,'path');for(const [name,value] of Object.entries({viewBox:'0 0 16 16',width:'13',height:'13','aria-hidden':'true'}))svg.setAttribute(name,value);path.setAttribute('d',PATHS[phase]);path.setAttribute('fill','none');path.setAttribute('stroke','currentColor');svg.append(path);return svg;}
export function installPhases({api,project,changed=()=>{},auto=()=>false}={}){
 const form=document.getElementById('composer'),row=form.querySelector('.pw-composer__row'),prompt=document.getElementById('prompt');
 const control=node('div','phase-controls'),button=node('button','pw-phase'),meaning=node('span','pw-help'),alert=node('div','pw-alert-line');
 control.id='phase-controls';button.id='phase-button';button.type='button';button.setAttribute('aria-haspopup','menu');button.setAttribute('aria-controls','phase-menu');alert.id='phase-error';alert.setAttribute('role','alert');alert.hidden=true;control.append(button,meaning);row.prepend(control);row.after(alert);
 let state={phase:'discussion',history:[],tasks:[]},owner=null,busy=false,host=null,closeMenu=()=>{},serial=0;
 const phone=matchMedia('(max-width:760px)');
 function placement(){if(phone.matches)form.insertBefore(control,form.querySelector('label[for=prompt]'));else row.prepend(control);meaning.hidden=!phone.matches;closeMenu();}
 phone.addEventListener('change',placement);placement();
 function draw(){button.replaceChildren(glyph(state.phase),node('span','pw-phase__label',NAMES[state.phase]));if(auto())button.append(node('span','pw-tag pw-tag--dotted','auto'));button.disabled=!project();button.setAttribute('aria-expanded',String(Boolean(host)));button.setAttribute('aria-label',`Phase: ${NAMES[state.phase]}. Change phase`);meaning.textContent=MEANINGS[state.phase];prompt.placeholder=PLACEHOLDERS[state.phase];}
 async function choose(phase){if(busy||!project()||phase==='implementation'&&(!state.tasks.length||state.pending))return;const id=project(),before=state;closeMenu();busy=true;button.setAttribute('aria-busy','true');button.querySelector('.pw-phase__label').textContent=NAMES[phase]+'…';alert.hidden=true;
  try{const saved=await api('/api/phase',{project:id,phase});if(project()!==id)return;state=saved;changed();}
  catch(error){if(project()!==id)return;state=before;const retry=node('button','pw-btn','Try Again');retry.type='button';retry.onclick=()=>choose(phase);alert.replaceChildren(node('span','',`Couldn’t change the phase to ${NAMES[phase]}: the project file couldn’t be saved. The project stays in ${NAMES[before.phase]}.`),retry);alert.hidden=false;}
  finally{busy=false;button.removeAttribute('aria-busy');draw();}
 }
 function open(){if(busy||!project())return;if(host){closeMenu();return;}const mobile=phone.matches,menu=node('div','pw-menu pw-phase-menu');menu.id='phase-menu';menu.setAttribute('role',mobile?'radiogroup':'menu');menu.setAttribute('aria-label','Phase');const abort=new AbortController();
  closeMenu=()=>{abort.abort();host?.remove();host=null;button.setAttribute('aria-expanded','false');};
  const items=[];for(const [index,phase] of Object.keys(NAMES).entries()){
   const disabled=phase==='implementation'&&(!state.tasks.length||state.pending);
   const item=node(mobile?'label':'button',mobile?'pw-option':'pw-menu__item'),name=node('span',mobile?'pw-option__label':''),small=node('small','',disabled?(state.pending?'Build the planned tasks':'No planned task yet. Plan one first.'):MEANINGS[phase]);name.append(glyph(phase),NAMES[phase]);
   if(mobile){const radio=node('input','pw-radio');radio.type='radio';radio.name='phase';radio.value=phase;radio.checked=phase===state.phase;radio.disabled=disabled;radio.setAttribute('aria-label',NAMES[phase]);radio.onclick=()=>choose(phase);item.append(radio,name,small);}
   else{item.type='button';item.setAttribute('role','menuitemradio');item.setAttribute('aria-checked',String(phase===state.phase));item.setAttribute('aria-disabled',String(disabled));item.tabIndex=-1;const head=node('span');head.append(name,node('span','pw-menu__key',`⇧⌘${index+1}`));item.append(head,small);item.onclick=()=>{if(!disabled)choose(phase);};}
   menu.append(item);items.push(item);
  }
  const note=node('p','pw-menu__note',mobile?'Only you change the phase. Pi can’t. The terminal shares it.':'Only you change the phase. Pi can’t. Saved with the project; terminal Pi shares it.');note.setAttribute('role','note');menu.append(node('div','pw-menu__sep'),note);
  if(mobile){host=node('dialog','pw-sheet');host.setAttribute('aria-label','Phase');const head=node('div','pw-sheet__head'),close=node('button','pw-btn pw-btn--plain pw-btn--touch','Close');close.type='button';close.onclick=()=>{closeMenu();button.focus();};head.append(node('h2','pw-dialog__title','Phase'),close);host.append(head,menu);document.body.append(host);host.addEventListener('cancel',()=>{closeMenu();button.focus();},{signal:abort.signal});host.showModal();}
  else{host=menu;host.setAttribute('popover','manual');form.append(host);host.showPopover();const box=button.getBoundingClientRect();Object.assign(host.style,{position:'fixed',margin:'0',left:Math.max(8,Math.min(box.left,innerWidth-host.offsetWidth-8))+'px',top:Math.max(8,box.top-host.offsetHeight-4)+'px'});items[Object.keys(NAMES).indexOf(state.phase)].focus();}
  button.setAttribute('aria-expanded','true');
  menu.addEventListener('keydown',event=>{const index=items.indexOf(document.activeElement);if(!mobile&&['ArrowDown','ArrowUp'].includes(event.key)){event.preventDefault();items[(index+(event.key==='ArrowDown'?1:-1)+3)%3].focus();}if(event.key==='Tab'&&!mobile){event.preventDefault();closeMenu();(event.shiftKey?prompt:document.getElementById('attach')).focus();}},{signal:abort.signal});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();closeMenu();button.focus();}},{signal:abort.signal});
  document.addEventListener('pointerdown',event=>{if(!host?.contains(event.target)&&!button.contains(event.target))closeMenu();},{signal:abort.signal});
 }
 button.onclick=open;button.onkeydown=event=>{if(event.key==='ArrowDown'){event.preventDefault();open();}};
 document.addEventListener('keydown',event=>{if(event.metaKey&&event.shiftKey&&['Digit1','Digit2','Digit3'].includes(event.code)){event.preventDefault();choose(Object.keys(NAMES)[Number(event.code.slice(-1))-1]);}});
 return {
  open,choose,get state(){return state;},
  async refresh(){const id=project(),request=++serial;if(owner!==id){owner=id;state={phase:'discussion',tasks:[],history:[]};closeMenu();alert.hidden=true;}draw();if(!id||busy)return;try{const saved=await api('/api/phase?project='+encodeURIComponent(id));if(request!==serial||project()!==id||busy)return;if(JSON.stringify(saved)!==JSON.stringify(state)){state=saved;draw();changed();}}catch{}},
  renderHistory(messages){messages.querySelectorAll('.pw-phase-line').forEach(el=>el.remove());for(const change of state.history){const line=node('p','pw-phase-line'),who=change.actor==='auto'?'Run on its own':change.action.startsWith('/')?`from the terminal (${change.action})`:change.action==='Start Building'?'Start Building · you':'chosen by you';line.append(glyph(change.phase),`Phase: ${NAMES[change.phase]} · ${who} · ${new Date(change.at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}`);if(change.actor==='auto')line.append(node('span','pw-tag pw-tag--dotted','auto'));const next=[...messages.children].find(el=>(el.querySelector('time')?.dateTime||'')>change.at);messages.insertBefore(line,next||null);}},
 };
}
