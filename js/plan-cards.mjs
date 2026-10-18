// Round 10: inline cards, using the shared design components. Person messages are durable answer evidence.
import {icon as glyph} from './ui.mjs';
const node=(tag,cls='',text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;};
const prose=(tag,cls,text)=>{const el=node(tag,cls,text);el.dataset.noTranslate='';return el;};
const button=(text,action,primary=false)=>{const el=node('button','pw-btn'+(primary?' pw-btn--default':''),text);el.type='button';el.onclick=action;return el;};
const link=(text,action)=>{const el=node('a','pw-link',text);el.href='#';el.onclick=e=>{e.preventDefault();action();};return el;};
const tag=state=>node('span','pw-tag'+(state==='auto'?' pw-tag--dotted':''),state);
const time=value=>value?new Date(value).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):'';
function card(title,kind='file',label=title){const el=node('section','pw-card');el.setAttribute('aria-label',label);const head=node('div','pw-card__head');head.append(glyph(kind),node('h3','pw-card__title',title));const body=node('div','pw-card__body'),foot=node('div','pw-card__foot');el.append(head,body,foot);return {el,head,body,foot};}
function settled(text,{state,action,label='Change…',old=false}={}){const el=node('section','pw-card pw-card--settled'+(state==='auto'?' pw-card--auto':'')+(old?' pw-card--old':'')),line=node('div','pw-card__line');if(!old)line.append(glyph('done'));line.append(node('span','',text));if(state==='auto')line.append(tag('auto'));if(action)line.append(link(label,action));el.append(line);return el;}

export function planningState(messages,index){
 if(index<0||!messages[index])return {};
 const item=messages[index],later=messages.slice(index+1),people=later.filter(m=>m.role==='user');
 const prefix='Choice: '+item.choice?.question+' → ';
 const answer=people.find(m=>m.content?.startsWith(prefix));
 const version=messages.slice(0,index+1).filter(m=>m.plan).length;
 const nextPlan=later.find(m=>m.plan),approved=Boolean(item.plan?.approved);
 return {answer:answer?.content.slice(prefix.length),answeredAt:answer?.timestamp,version,replaced:nextPlan&&!approved?version+1:null,replacedAt:nextPlan?.timestamp,approved,
  continued:Boolean(item.check_in?.accepted),continuedAt:people[0]?.timestamp};
}
export function planDecisions(plan){
 const result=[],seen=new Set();
 for(const task of plan.tasks||[])for(const line of String(task.decisions||'').split('\n')){
  const match=line.match(/^\s*-\s+(.+?):\s*(.*?)\s*(?:\((chosen|given|auto)\))?$/);if(!match)continue;
  const value={question:match[1],answer:match[2],state:match[3]||'given'},key=JSON.stringify(value);
  if(!seen.has(key)){seen.add(key);result.push(value);}
 }
 return result;
}
export function choiceCard(choice,{state={},answer,change}={}){
 /* task 290: approval or a new plan replaced a question nobody answered; it says so and cannot be answered (needs design) */
 /* round 12 (R12_Conversation): “Sorting: not answered · settled by Start Building · 14:12”, with Change… to answer it after all */
 if(choice.settled&&!state.answer&&!choice.answer){const el=settled('',{old:true,action:change}),line=el.querySelector('.pw-card__line > span');line.append(prose('span','',choice.question),': ',node('b','','not answered'),' · ',node('span','',`settled by ${choice.settled}`),...(choice.when?[` · ${time(choice.when)}`]:[]));return el;}
 if(state.answer||choice.answer){const value=choice.changed_from!==undefined?choice.answer:state.answer||choice.answer;/* task 273: a changed answer wins over the first one's message */return settled(`${choice.question}: ${value}${choice.options?.some(o=>o.label===value)?'':' · your words'} · ${choice.state==='auto'?'auto':`you · ${time(state.answeredAt||choice.when)}`}`,{state:choice.state,action:change});}
 const {el,head,body,foot}=card(choice.question,'question',choice.question);if(!choice.system_owned)head.querySelector('h3').dataset.noTranslate='';body.setAttribute('role','radiogroup');body.setAttribute('aria-label',choice.question);
 if(choice.number&&choice.total>1)head.append(node('span','',`Question ${choice.number} of ${choice.total}`));
 else if(!choice.system_owned&&choice.task){const number=String(choice.task).match(/(\d+)/);head.append(node('span','',number?`Pi asked a question · task ${Number(number[1])}`:'Pi asked a question'));}/* R12_Gate: a question Pi asked during a task */
 let selected=0;const group='choice-'+crypto.randomUUID(),radios=[],other=node('input','pw-field');other.placeholder='Type your answer';other.setAttribute('aria-label','Your answer');other.hidden=true;
 const options=[...choice.options,{label:'Something else…'}];
 for(const [index,option] of options.entries()){
  const row=node('label','pw-option'),radio=node('input','pw-radio'),label=(index===choice.options.length||choice.system_owned?node:prose)('span','pw-option__label',option.label);radio.type='radio';radio.name=group;radio.checked=index===0;radios.push(radio);
  radio.onchange=()=>{selected=index;radios.forEach((r,i)=>r.checked=i===index);other.hidden=index!==choice.options.length;if(!other.hidden)other.focus();};
  if(index===0)label.append(tag('Recommended'));row.append(radio,label);if(option.detail)row.append(prose('small','',option.detail));if(index===choice.options.length)row.append(other);body.append(row);
 }
 foot.append(button('Answer',()=>{const value=selected===choice.options.length?other.value.trim():choice.options[selected].label;if(value)answer(value);else other.focus();},true));
 if(choice.number&&choice.total&&choice.number<choice.total)foot.append(button('Take All Recommendations',()=>answer(choice.options[0].label,{take_all:true})));/* R12_Gate: this one and the rest of the batch take their recommendations */
 foot.append(node('span','pw-help','or type your answer below'));return el;
}
export function planCard(plan,{name='',state={},approve,another,change,open}={}){
 const decisions=planDecisions(plan),count=`${plan.tasks.length} tasks · ${decisions.length} decisions`;
 if(state.replaced){const el=settled(`Plan v${state.version} · replaced by v${state.replaced} at ${time(state.replacedAt)}`,{old:true,action:()=>{el.replaceWith(planCard(plan,{name,state:{historical:true},approve,change,open}));},label:'Show'});return el;}
 if(state.approved||plan.approved)return settled(`Plan approved: building · ${count} · Start Building${plan.state==='auto'?'':` · you · ${time(state.continuedAt||plan.when)}`}`,{state:plan.state,action:open,label:'Open the Plan'});
 const {el,head,body,foot}=card('Plan: '+name,'file','Plan');head.append(node('span','',count));body.append(prose('p','pw-plan__goal',plan.goal),node('h4','pw-plan__h','Tasks'));
 const tasks=node('ol','pw-plan__tasks');for(const task of plan.tasks.length>7?plan.tasks.slice(0,5):plan.tasks){const item=node('li');item.append(prose('span','',task.title));item.append(node('small','',`Done when ${task.done_when}`));tasks.append(item);}
 if(plan.tasks.length>7){const item=node('li');item.append(link(`and ${plan.tasks.length-5} more tasks · Open the Plan`,open));tasks.append(item);}body.append(tasks,node('h4','pw-plan__h','Decisions'));
 const list=node('ul','pw-plan__decisions');for(const decision of decisions){const li=node('li');li.append(glyph('done'),prose('b','',decision.question),prose('span','',decision.answer),tag(decision.state));list.append(li);}body.append(list);
 if(plan.waiting)return settled(`Plan waiting · ${plan.tasks.length} tasks, not started · Plan Another Task · you`,{action:open,label:'Open the Plan'});
 if(!state.historical){body.append(node('p','pw-help','Start Building approves this plan and moves to Implementation. Plan Another Task keeps it waiting and goes back to Discussion.'));foot.append(button('Start Building',approve,true),button('Plan Another Task',another),button('Change…',change));}foot.append(link('Open the Plan',open));return el;
}
export function frameCheckIn(row,check,{data={},state={},next,review,stop,preview,undo}={}){
 if(state.continued&&check.next){row.querySelector('.pw-done__head')?.append(node('span','',` · continued by you · ${time(state.continuedAt)}`));return row;}
 if(check.accepted&&!check.next){const line=settled(`All ${check.total} planned tasks are built · still Implementation`,{action:stop,label:'Back to Discussion'});row.className=line.className;row.replaceChildren(...line.childNodes);return row;}
 row.className='pw-card';row.setAttribute('aria-label',`Task ${check.number} of ${check.total} done${check.verified?'':', not verified'}`);
 const head=node('div','pw-card__head'),body=node('div','pw-card__body'),foot=node('div','pw-card__foot');head.append(glyph(check.verified?'done':'caution'),node('h3','pw-card__title',`Task ${check.number} of ${check.total} done${check.verified?'':', not verified'}: ${check.title||data.title||check.task}`),node('span','','Waiting for you to check it'));
 for(const text of data.person||[])body.append(node('p','pw-done__text',text));
 const facts=node('dl','pw-facts');facts.append(node('dt','',check.verified?'Verified':'Not verified'),node('dd','',check.verification||check.reason||'no passing test run after the last change'),node('dt','','Next'),node('dd','',check.next||'Plan complete.'));body.append(facts);
 const links=node('div','pw-card__links');links.append(link('Show in Preview',preview));if(undo)links.append(link('Undo This Task…',undo));body.append(links);
 foot.append(button(check.next?'Accept and Continue':'Accept Task',next,check.verified),button('Review First',review,!check.verified),button('Stop Here',stop));row.replaceChildren(head,body,foot);return row;
}
export function awayCard(report,{change,seen,activity}={}){
 const {el,head,body,foot}=card('Ran on its own: report','clock','Report: ran on its own');head.append(node('span','',`${time(report.started)} – ${time(report.ended)} · ${report.outcome||''}`));
 for(const [key,title] of [['done','Done'],['decisions','Decided on its own'],['external','Left this Mac or used the Trash'],['problems','Problems']]){
  const values=report[key]||[];body.append(node('h4','pw-plan__h',`${title} · ${values.length}${key==='done'?' tasks':''}`));const list=node('ul','pw-plan__decisions');
  for(const value of values){const item=node('li');
   if(key==='decisions')item.append(tag('auto'),node('span','',`${value.question}: ${value.answer}`),link('Change…',()=>change(value)));
   else if(key==='done')item.append(glyph(value.verified?'done':'caution'),node('span','',value.title||value.task),node('span','pw-help',value.verified?'verified':'not verified: '+(value.reason||'no passing test run after the last change')));
   else {item.append(glyph(key==='problems'?'caution':'done'),node('span','',value.action||value.reason||value.detail||''),node('span','pw-help',time(value.when)));if(value.url&&/^https?:\/\//.test(value.url)){const a=node('a','pw-link','Open');a.href=value.url;a.target='_blank';a.rel='noopener';item.append(a);}}
   list.append(item);
  }body.append(list);
 }
 foot.append(button('Got It',()=>seen(report.id,el),true),link('Show in Activity',activity));return el;
}
