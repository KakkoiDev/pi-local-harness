// PlanCard round 12 (task 261, plan 267; board R12_Grant): What you grant, and Gate's two questions about scope.
// - What you grant: each task's Kind and Files with their source (your answer · task file), above Decisions.
// - Scope widening: “Pi wants to change a file outside task N · Gate asks you”, the file, Pi's one-line reason;
//   Add to Task N (default) · Keep Out · Open the Task. Gate refused the write (gate/scope.py); the answer grants it or not.
// - Re-plan: “The plan needs to change · task N of M”: Re-plan (default) · Keep the Plan · Open the Plan.
import {icon as glyph} from './ui.mjs';
const node=(tag,cls='',text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;};
const prose=(tag,cls,text)=>{const el=node(tag,cls,text);el.dataset.noTranslate='';return el;};
const button=(text,action,primary=false)=>{const el=node('button','pw-btn'+(primary?' pw-btn--default':''),text);el.type='button';el.onclick=action;return el;};
const time=value=>value?new Date(value).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):'';
const open=path=>document.dispatchEvent(new CustomEvent('open-plan-file',{detail:path}));

/** The What you grant section of the plan card, or nothing for a plan proposed before round 12. */
export function grantSection(plan){
 const tasks=(plan.tasks||[]).filter(task=>task.grant);if(!tasks.length)return [];
 const list=node('ul','pw-plan__decisions'),kind=tasks[0].grant,item=node('li');
 item.append(node('b','','Kind'),prose('span','',kind.kind),node('span','pw-tag',kind.kind_source));if(kind.kind_at)item.append(node('span','pw-help',time(kind.kind_at)));list.append(item);
 tasks.forEach((task,index)=>{const row=node('li'),files=[...task.grant.files,...(task.grant.granted||[]).map(entry=>entry.file)];
  row.append(node('b','',`Files, task ${index+1}`),prose('span','pw-mono',files.join(' · ')||'—'),node('span','pw-tag','task file'));
  if(task.grant.granted?.length)row.append(node('span','pw-tag',task.grant.granted[0].source==='auto'?'auto':'your answer'),node('span','pw-help',time(task.grant.granted.at(-1).at)));list.append(row);});
 return [node('h4','pw-plan__h','What you grant'),list,node('p','pw-help','Pi may change only these files in each task. A file outside them asks you first.')];
}

function settled(choice,value,when){const el=node('section','pw-card pw-card--settled'),line=node('div','pw-card__line');line.append(glyph('done'),node('span','',`${choice.question}: ${value} · ${choice.state==='auto'?'auto':`you · ${time(when)}`}`));if(choice.state==='auto')line.append(node('span','pw-tag pw-tag--dotted','auto'));el.append(line);return el;}

/** Gate's scope or re-plan question as its card; answer(label) goes through the chat's choice route. */
export function gateQuestionCard(choice,{state={},answer}={}){
 const value=state.answer||choice.answer;if(value)return settled(choice,value,state.answeredAt||choice.when);
 if(choice.settled)return settled(choice,'not answered',choice.when);
 const asked=choice.scope||choice.replan,el=node('section','pw-card'),head=node('div','pw-card__head'),body=node('div','pw-card__body'),foot=node('div','pw-card__foot');
 el.setAttribute('aria-label',choice.question);
 head.append(glyph(choice.scope?'gate':'caution'),node('h3','pw-card__title',choice.question),node('span','',choice.scope?'Gate asks you':`task ${asked.number} of ${asked.total}`));
 const file=node('p','pw-done__text');file.append(prose('span','pw-mono',asked.file));
 if(choice.replan)file.prepend('Pi needs ');
 if(choice.replan)file.append(`, which you kept out of task ${asked.number}. Re-plan goes back to Planning to add it, or to plan a new task for it.`);
 body.append(file);if(asked.reason)body.append(prose('p','pw-help',asked.reason));
 const gap=node('span');gap.style.flex='1';const [first,second]=choice.options.map(option=>option.label);
 foot.append(button(first,()=>answer?.(first),true),button(second,()=>answer?.(second)),gap,button(choice.scope?'Open the Task':'Open the Plan',()=>open(choice.scope?asked.task:'ROADMAP.md')));
 el.append(head,body,foot);return el;
}
