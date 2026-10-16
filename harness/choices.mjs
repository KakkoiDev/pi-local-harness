// One decision at a time (plan 236). Options come from Pi; “Something else…” always comes from the harness.
import { tr } from './language.mjs';

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
  return { question:value.question.replace(/\s+/g,' ').trim(), options, recommended:0, allow_other:true };
}

export function installChoices(pi, {auto=()=>false, web=()=>false, record=async()=>{}, pending=async()=>{}, cancel=async()=>{}} = {}) {
  pi.registerTool?.({
    name:'ask_choices',label:'Ask a choice',
    description:'Ask one decision the request, code and conventions do not answer. Offer 2–4 short options, recommended first (recommended: 0). The harness adds Something else…. Wait for the answer before using the decision.',
    parameters:{type:'object',properties:{question:{type:'string'},options:{type:'array',items:{type:'object',properties:{label:{type:'string'},detail:{type:'string'}},required:['label']}},recommended:{type:'number',enum:[0]},allow_other:{type:'boolean'}},required:['question','options','recommended']},
    async execute(_id,params,_signal,_update,ctx) {
      try {
        const choice=validateChoice(params);let answer,state='chosen';
        if (await auto(ctx)) { answer=choice.options[0].label;state='auto'; }
        else if (web(ctx)) {
          await pending(choice,ctx);
          return {content:[{type:'text',text:'Waiting for the person’s choice. Stop here.'}],details:{...choice,pending:true}};
        } else {
          await pending(choice,ctx);
          const other=tr('Something else…'),labels=choice.options.map((option,index)=>`${option.label}${index===0?' · '+tr('Recommended'):''}${option.detail?' · '+option.detail:''}`);
          const picked=await ctx?.ui?.select?.(choice.question,[...labels,other]);
          if (picked === other) answer=await ctx?.ui?.input?.(tr('Something else…'),choice.question);
          else {const index=labels.indexOf(picked);if(index>=0) answer=choice.options[index].label;}
          if (typeof answer!=='string' || !answer.trim()) { await cancel(ctx); throw Error('No choice was answered. Ask again before changing code.'); }
        }
        const decision={...choice,answer:answer.trim(),state};await record(decision,ctx);
        return {content:[{type:'text',text:`Choice: ${choice.question} → ${decision.answer}`}],details:decision};
      } catch(error) {return {isError:true,content:[{type:'text',text:error.message}],details:{}};}
    },
  });
}
