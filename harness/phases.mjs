// T_Phases: only the person's slash commands can choose the shared project phase.
import {tr} from './language.mjs';
const names={discussion:'Discussion',planning:'Planning',implementation:'Implementation'};
const meanings={discussion:'Pi can read, search and talk, but can’t write files.',planning:'Pi may write ROADMAP.md and tasks/ only.',implementation:'Pi changes only the files of the task in progress.'};
export function installPhases(pi,{call}={}){
 for(const [command,phase] of Object.entries({discuss:'discussion',plan:'planning',build:'implementation'}))pi.registerCommand?.(command,{
  description:tr('Phase: '+names[phase]),
  async handler(_args,ctx){
   try{
    const cwd=ctx?.cwd||process.cwd();
    if(phase==='implementation'){
     const status=await call('/phase',{cwd});
     if(!status.tasks.length){ctx?.ui?.notify?.(tr('■ Not changed: nothing is planned yet. /plan first, then /build.'),'warning');return;}
     const start=tr('Start Building'),cancel=tr('Not now');
     const detail=status.tasks.map((task,index)=>`${index+1} · ${task.title}\n${tr('Done when')}: ${task.done_when}`).join('\n');
     if(await ctx?.ui?.select?.(tr('Build the planned tasks')+'\n\n'+detail,[start,cancel])!==start)return;
    }
    await call('/phase',{cwd,phase,action:'/'+command});
    ctx?.ui?.notify?.(tr('✓ Phase: '+names[phase]+'. '+meanings[phase]),'info');
   }catch(error){ctx?.ui?.notify?.(error.message,'warning');}
  }
 });
}
