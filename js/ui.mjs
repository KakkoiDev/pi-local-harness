import { icon, stateGlyph } from '../design/icons.mjs';
export { icon, hydrateIcons, stateGlyph } from '../design/icons.mjs';
// ToolCall (design/system/components/ToolCall): the command, then Laya's gate and audit verdicts for it.
export function toolCard(tool,{live=false,showEvent}={}){
 const card=document.createElement('div');card.className='pw-tool'+(live?' pw-tool--live':'');
 const command=document.createElement('div');command.className='pw-tool__cmd';command.textContent=(tool.name==='bash'?'$ ':tool.name+' ')+(tool.detail||'');card.append(command);
 const checks=document.createElement('div');checks.className='pw-tool__checks';const gate=tool.checks?.find(check=>check.phase==='gate'),audit=tool.checks?.find(check=>check.phase==='audit');
 if(gate)checks.append(stateGlyph(gate.outcome));
 if(audit)checks.append(stateGlyph(audit.outcome));else if(tool.status==='running')checks.append(stateGlyph('running'));
 if(!tool.checks?.length){const none=document.createElement('span');none.textContent='No Laya record';checks.append(none);}
 const last=audit||gate;if(last&&showEvent){const link=document.createElement('a');link.href='#';link.textContent='Show in Laya';link.onclick=event=>{event.preventDefault();showEvent(last.event);};checks.append(link);}
 card.append(checks);
 if(gate&&gate.outcome!=='ALLOW'){const reason=document.createElement('p');reason.className='pw-tool__reason';reason.append(icon('caution'),gate.reason||'');card.append(reason);}
 return card;}
// SegmentedControl filter on phone for a desk <select>: a radio sets the select and fires change; the returned sync() shows the select's value.
export function segmentFor(seg,select){
 const radios=[...seg.querySelectorAll('[role="radio"]')];
 const sync=()=>{for(const radio of radios){const on=radio.dataset.value===select.value;radio.setAttribute('aria-checked',String(on));radio.tabIndex=on?0:-1;}};
 const choose=radio=>{if(select.value!==radio.dataset.value){select.value=radio.dataset.value;select.dispatchEvent(new Event('change'));}sync();radio.focus();};
 seg.onclick=event=>{const radio=event.target.closest('[role="radio"]');if(radio)choose(radio);};
 seg.onkeydown=event=>{const step={ArrowLeft:-1,ArrowUp:-1,ArrowRight:1,ArrowDown:1}[event.key];if(!step)return;event.preventDefault();const index=radios.findIndex(radio=>radio.dataset.value===select.value);choose(radios[(index+step+radios.length)%radios.length]);};
 sync();return sync;}
export function readState(key,fallback=null){try{return JSON.parse(localStorage.getItem('plh.'+key))??fallback;}catch{return fallback;}}
export function writeState(key,value){try{if(value===null)localStorage.removeItem('plh.'+key);else localStorage.setItem('plh.'+key,JSON.stringify(value));return true;}catch{return false;}}
