// Plan previews read the project's Markdown through Gate; only a person's answer approves it.
import { tr } from './language.mjs';

export function installPlanning(pi, { propose, approve, pending, cancel, web=()=>false, auto=()=>false } = {}) {
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
          const preview=[plan.goal,...plan.tasks.map(task=>`${task.title}\n${task.done_when}${task.decisions?'\n'+task.decisions:''}`)].join('\n\n');
          const picked=await ctx?.ui?.select?.(preview,[tr('Approve Plan'),tr('Change…'),tr('Open the Plan')]);
          if (picked===tr('Approve Plan')) await approve('chosen');
          else {
            if (picked===tr('Open the Plan')) ctx?.ui?.notify?.('ROADMAP.md','info');
            await cancel(ctx);
            return {content:[{type:'text',text:tr('The plan is waiting for changes or approval. Stop here.')}],details:plan};
          }
        }
        return {content:[{type:'text',text:tr('Plan approved. Build the first task only, then verify it and stop for a check-in.')}],details:{...plan,pending:false}};
      } catch(error) {return {isError:true,content:[{type:'text',text:error.message}],details:{}};}
    },
  });
}
