// One decision at a time (plan 236). Options come from Pi; “Something else…” always comes from the harness.
import { tr } from './language.mjs';
import {choiceRows} from './terminal-planning.mjs';
import {ansiStyle} from './terminal-render.mjs';

export function validateChoice(value) {
  if (!value || typeof value.question !== 'string' || !value.question.trim()) throw Error('Ask one question.');
  if (value.recommended !== 0) throw Error('Put the recommended option first (recommended: 0).');
  if (value.allow_other === false) throw Error('Always allow Something else….');
  if (!Array.isArray(value.options) || value.options.length < 2 || value.options.length > 4) throw Error('Offer two to four options.');
  const options = value.options.map(option => {
    if (!option || typeof option.label !== 'string' || !option.label.replace(/\s+/g,' ').trim() || (option.detail !== undefined && typeof option.detail !== 'string')) throw Error('Each option needs a short label and an optional detail.');
    return { label: option.label.replace(/\s+/g,' ').trim(), ...(option.detail ? {detail:option.detail.replace(/\s+/g,' ').trim()} : {}) };
  });
  if (new Set(options.map(option=>option.label.toLowerCase())).size !== options.length || options.some(option=>option.label === 'Something else…')) throw Error('Use distinct options; the harness adds Something else….');
  if(value.number!==undefined||value.total!==undefined)if(!Number.isInteger(value.number)||!Number.isInteger(value.total)||value.number<1||value.total<value.number)throw Error('Question numbering must be within its total.');
  return { ...(value.system_owned===true?{system_owned:true}:{}),...(value.number?{number:value.number,total:value.total}:{}),question:value.question.replace(/\s+/g,' ').trim(), options, recommended:0, allow_other:true };
}

export function installChoices(pi, {auto=()=>false, web=()=>false, record=async()=>{}, pending=async()=>{}, cancel=async()=>{}, waiting} = {}) {
  // Task 290: one question at a time. In the web a question pauses the turn; a second ask_choices in the same batch is
  // refused, so the first question is never overwritten. `waiting()` (the extension's) says whether one still waits.
  let open=null;const busy=()=>open!==null&&(waiting?waiting():true);
  const tool={
    name:'ask_choices',label:'Ask a choice',
    description:'Ask one decision the request, code and conventions do not answer. Offer 2–4 short options, recommended first (recommended: 0). The harness adds Something else…. Wait for the answer before using the decision.',
    parameters:{type:'object',properties:{question:{type:'string'},number:{type:'number',description:'This question’s number, only when the total is known.'},total:{type:'number',description:'Known total number of questions; omit both numbers if not known.'},options:{type:'array',items:{type:'object',properties:{label:{type:'string'},detail:{type:'string'}},required:['label']}},recommended:{type:'number',enum:[0]},allow_other:{type:'boolean'}},required:['question','options','recommended']},
    async execute(_id,params,_signal,_update,ctx) {
      try {
        const choice=validateChoice(params);let answer,state='chosen';
        if (await auto(ctx)) { answer=choice.options[0].label;state='auto'; }
        else if (web(ctx)) {
          if (busy()) throw Error(`One question at a time: wait for the person's answer to “${open}” before asking another. Stop here.`);
          await pending(choice,ctx);open=choice.question;
          return {content:[{type:'text',text:'Waiting for the person’s choice. Stop here.'}],details:{...choice,pending:true}};
        } else {
          await pending(choice,ctx);
          const other=tr('Something else…'),labels=choiceRows(choice).slice(0,-1);
          const picked=await ctx?.ui?.select?.(choice.system_owned?tr(choice.question):choice.question,[...labels,other]);
          if (picked === other) answer=await ctx?.ui?.input?.(tr('Something else…'),choice.question);
          else {const index=labels.indexOf(picked);if(index>=0) answer=choice.options[index].label;}
          if (typeof answer!=='string' || !answer.trim()) { await cancel(ctx); throw Error('No choice was answered. Ask again before changing code.'); }
        }
        const decision={...choice,answer:answer.trim(),state};await record(decision,ctx);
        if(!web(ctx))ctx?.ui?.notify?.(`${state==='auto'?'~':'✓'} ${choice.question}: ${decision.answer}${state==='auto'?' '+ansiStyle.dim('· '+tr('auto')):''}`,'info');
        return {content:[{type:'text',text:`Choice: ${choice.question} → ${decision.answer}`}],details:decision};
      } catch(error) {return {isError:true,content:[{type:'text',text:error.message}],details:{}};}
    },
  };
  pi.registerTool?.(tool);
  return (params,ctx)=>tool.execute('system-1-choice',params,null,null,ctx);
}
