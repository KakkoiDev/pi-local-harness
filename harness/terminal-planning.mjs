// T_PlanMode: Pi's native selects, the shared monochrome terminal renderer, and actual Markdown for review.
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {ansiStyle,columns,renderView,wrap} from './terminal-render.mjs';
import {tr} from './language.mjs';

export function choiceRows(choice,width=80) {
 const labels=choice.options.map(option=>option.label),column=Math.min(Math.max(...labels.map(columns))+4,Math.max(12,width-20));
 return [...choice.options.map((option,index)=>option.label+(index===0?' '.repeat(Math.max(2,column-columns(option.label)))+ansiStyle.dim(tr('Recommended')):'')+(option.detail?'\n'+wrap(option.detail,Math.max(16,width-4)).map(line=>'  '+ansiStyle.dim(line)).join('\n'):'')),tr('Something else…')];
}

export function planView(plan,width=80) {
 const decisions=plan.tasks.flatMap(task=>task.decisions?[task.decisions]:[]);
 return renderView({title:tr('Plan'),summary:`${plan.tasks.length} ${tr('tasks')}`,parts:[{kind:'prose',text:tr('Goal')+'  '+plan.goal},
  ...plan.tasks.map((task,index)=>({kind:'lines',lines:[`${index+1}  ${task.title}`,...wrap(tr('Done when')+': '+task.done_when,Math.max(20,width-6)).map(line=>ansiStyle.dim('   '+line))]})),
  ...(decisions.length?[{kind:'lines',heading:tr('Decisions'),lines:decisions.flatMap(text=>text.split('\n'))}]:[])]},width,{style:ansiStyle}).join('\n');
}

export async function checkIn(ctx,value,{read=path=>readFileSync(join(value.root || ctx?.cwd || process.cwd(),path),'utf8'),width=80}={}) {
 const next=value.next,verified=value.verified;
 const title=renderView({title:(verified?(value.number?tr(`Task ${value.number} of ${value.total} done`):tr('Task done')):tr('Not verified'))+(value.title?' · '+value.title:''),summary:value.number?`${value.number} / ${value.total}`:'',parts:[
  {kind:'lines',lines:[value.task || '',value.reason || '']},
  {kind:'kv',rows:[[tr('Verified'),value.verification || value.reason || '—'],[tr('Next'),next || tr('Plan complete.')]]}]},width,{style:ansiStyle}).join('\n');
 const keep=tr(next?'Accept and Continue':'Accept Task'),review=tr('Review First'),stop=tr('Stop Here'),back=tr('Back');
 for (;;) {
  const options=verified?[keep,review,stop]:[review,keep,stop];
  const picked=await ctx?.ui?.select?.(title,options);
  if(picked===keep)return 'continue';
  if(picked===review) {
   try {await ctx?.ui?.select?.(read(value.task),[back]);}
   catch(error){ctx?.ui?.notify?.(error.message,'warning');}
   continue;
  }
  ctx?.ui?.notify?.(tr('Stopped here. The task still waits for your acceptance.'),'info');return 'stop';
 }
}
