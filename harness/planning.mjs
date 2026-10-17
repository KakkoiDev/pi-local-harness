// Plan previews read the project's Markdown through Gate; only a person's answer approves it.
import { tr } from './language.mjs';
import {planView} from './terminal-planning.mjs';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';

export function installPlanning(pi, { propose, approve, pending, cancel, another=async()=>{}, change=async()=>{}, web=()=>false, auto=()=>false } = {}) {
  pi.registerTool?.({
    name:'propose_plan',label:'Propose the plan',
    description:'Provide goal and task content (title, kind, files, done_when, content without checkboxes); System 1 lays out ROADMAP.md and task files. Show the actual plan and wait for Start Building before code. Each task will be verified and committed separately.',
    parameters:{type:'object',properties:{goal:{type:'string'},tasks:{type:'array',items:{type:'object',properties:{title:{type:'string'},kind:{type:'string',enum:['code','docs','chore']},files:{type:'array',items:{type:'string'}},done_when:{type:'string'},content:{type:'string'}},required:['title','files','done_when','content']}}}},
    async execute(_id,params,_signal,_update,ctx) {
      try {
        const plan=await propose(params);
        if (await auto()) await approve('auto');
        else if (web()) {await pending(plan,ctx);return {content:[{type:'text',text:tr('Waiting for plan approval. Stop here.')}],details:plan};}
        else {
          const preview=planView(plan),approveLabel=tr('Start Building'),changeLabel=tr('Change…'),openLabel=tr('Open ROADMAP.md');
          for (;;) {
            const picked=await ctx?.ui?.select?.(preview,[approveLabel,tr('Plan Another Task'),changeLabel,openLabel]);
            if (picked===approveLabel) {await approve('chosen');break;}
            if(picked===tr('Plan Another Task')){await another(plan);await cancel(ctx);return {content:[{type:'text',text:tr('Plan waiting. Back to Discussion.')}],details:{...plan,waiting:true}};}
            if (picked===openLabel) {
              try {await ctx?.ui?.select?.(readFileSync(join(plan.root || ctx?.cwd || process.cwd(),'ROADMAP.md'),'utf8'),[tr('Back')]);}
              catch(error){ctx?.ui?.notify?.(error.message,'warning');}
              continue;
            }
            if (picked===changeLabel) {
              const text=await ctx?.ui?.input?.(tr('What should change in the plan?'));
              if(text?.trim())await change(text.trim(),ctx);
            }
            await cancel(ctx);
            return {content:[{type:'text',text:tr('The plan is waiting for changes or approval. Stop here.')}],details:plan};
          }
        }
        return {content:[{type:'text',text:tr('Plan approved. Build the first task only, then verify it and stop for a check-in.')}],details:{...plan,pending:false}};
      } catch(error) {return {isError:true,content:[{type:'text',text:error.message}],details:{}};}
    },
  });
}
