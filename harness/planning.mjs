// Plan previews read the project's Markdown through Gate; only a person's answer approves it.
import { tr } from './language.mjs';
import {planView} from './terminal-planning.mjs';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';

export function installPlanning(pi, { propose, approve, pending, cancel, change=async()=>{}, web=()=>false, auto=()=>false } = {}) {
  pi.registerTool?.({
    name:'propose_plan',label:'Propose the plan',
    description:'After filling ROADMAP.md Goal and real tasks (checkboxes, Done when, Decisions, optional Files:), show the actual plan and wait for approval before code. Each task will be verified and committed separately.',
    parameters:{type:'object',properties:{}},
    async execute(_id,_params,_signal,_update,ctx) {
      try {
        const plan=await propose();
        if (await auto()) await approve('auto');
        else if (web()) {await pending(plan,ctx);return {content:[{type:'text',text:tr('Waiting for plan approval. Stop here.')}],details:plan};}
        else {
          const preview=planView(plan),approveLabel=tr('Approve Plan'),changeLabel=tr('Change…'),openLabel=tr('Open ROADMAP.md');
          for (;;) {
            const picked=await ctx?.ui?.select?.(preview,[approveLabel,changeLabel,openLabel]);
            if (picked===approveLabel) {await approve('chosen');break;}
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
