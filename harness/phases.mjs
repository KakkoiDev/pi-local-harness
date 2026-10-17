// T_Phases: only the person's slash commands can choose the shared project phase.
import {tr} from './language.mjs';
const names={discussion:'Discussion',planning:'Planning',implementation:'Implementation'};
const meanings={discussion:'Pi can read, search and talk, but can’t write files.',planning:'Pi may write ROADMAP.md and tasks/ only.',implementation:'Pi changes only the files of the task in progress.'};
export function installPhases(pi,{call}={}){
 for(const [command,phase] of Object.entries({discuss:'discussion',plan:'planning',build:'implementation'}))pi.registerCommand?.(command,{
  description:tr('Phase: '+names[phase]),
  async handler(_args,ctx){
   try{
    let cwd=ctx?.cwd||process.cwd(),status=await call('/phase',{cwd});
    if(status.projects){
     if(!status.projects.length){ctx?.ui?.notify?.(tr('No projects yet: New Project… in the workbench.'),'warning');return;}
     const choices=status.projects.map(item=>`${item.name} · ${item.path}`);
     const picked=await ctx?.ui?.select?.(tr('Choose a project'),choices),index=choices.indexOf(picked);
     if(index<0)return;
     cwd=status.projects[index].path;status=await call('/phase',{cwd});
    }
    let selected;
    if(phase==='implementation'){
     if(!status.tasks.length){ctx?.ui?.notify?.(tr('■ Not changed: nothing is planned yet. /plan first, then /build.'),'warning');return;}
     const start=tr('Start Building'),cancel=tr('Not now');
     const detail=status.tasks.map((task,index)=>`${index+1} · ${task.title}\n${tr('Done when')}: ${task.done_when}`).join('\n');
     selected=status.tasks.map(task=>task.path);
     for(;;){const rows=status.tasks.map(task=>(selected.includes(task.path)?'☑ ':'☐ ')+task.title),picked=await ctx?.ui?.select?.(tr('Build the planned tasks')+'\n\n'+detail,[start,...rows,cancel]);if(picked===start){if(selected.length)break;ctx?.ui?.notify?.(tr('Choose at least one task'),'warning');continue;}const index=rows.indexOf(picked);if(index<0)return;const path=status.tasks[index].path;selected=selected.includes(path)?selected.filter(value=>value!==path):[...selected,path];}
    }
    await call(phase==='implementation'?'/phase/build':'/phase',{cwd,phase,action:'/'+command,...(selected?{tasks:selected}:{})});
    ctx?.ui?.notify?.(tr('✓ Phase: '+names[phase]+'. '+meanings[phase]),'info');
   }catch(error){ctx?.ui?.notify?.(error.message,'warning');}
  }
 });
}
