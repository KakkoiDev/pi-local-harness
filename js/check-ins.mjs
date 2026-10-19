// CheckInCard (rounds 10-12; boards R12_Verify, R12_Reopen, Ph12_Verify). A done task waits for the person: verified,
// with its evidence (the test run Gate saw, the tests changed, Pi's "Tried it", Next), or not verified, with Retry Task as
// the default, the files outside the task named, and Accept Anyway… that asks first. A check-in whose chat message was
// lost in a reload comes back from the project's state with a "Restored" notice. Reopen Task… (Work, Activity) asks, then
// unchecks the task's boxes and reopens its ROADMAP.md line (POST /api/tasks/reopen, a person route).
import {icon as glyph} from './ui.mjs';
import {harnessNotice} from './notices.mjs';
const node=(tag,cls='',text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;};
const button=(text,action,primary=false)=>{const el=node('button','pw-btn'+(primary?' pw-btn--default':''),text);el.type='button';el.onclick=action;return el;};
const link=(text,action)=>{const el=node('a','pw-link',text);el.href='#';el.onclick=e=>{e.preventDefault();action?.();};return el;};
const time=value=>value?new Date(value).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):'';
const mono=text=>{const el=node('span','pw-mono',text);el.style.fontSize='13px';return el;};


function testLine(run){
 if(!run?.command)return null;const dd=node('dd');dd.append(mono(run.command));
 for(const [value,word] of [[run.passed,'passed'],[run.failed,'failed']])if(typeof value==='number')dd.append(` · ${value} ${word}`);
 if(typeof run.seconds==='number')dd.append(` · ${run.seconds} s`);if(run.time)dd.append(' · ',node('time','',time(run.time)));return dd;
}
function evidenceFacts(facts,check){
 const proof=check.evidence||{},weakened=proof.weakened||[];
 const run=testLine(proof.test);if(run)facts.append(node('dt','','Test run'),run);
 if(proof.tests_changed?.length||weakened.length){const dd=node('dd');const named=[...new Set([...(proof.tests_changed||[]),...weakened.map(item=>item.path)])];
  named.forEach((path,index)=>{if(index)dd.append(', ');dd.append(mono(path));const weak=weakened.find(item=>item.path===path);if(weak)dd.append(' ',glyph('caution'),` ${weak.how==='removed'?'removed':'fewer checks'}`);});
  if(weakened.length)dd.append(node('span','pw-help',' A test was removed or weakened: review it before accepting.'));facts.append(node('dt','','Tests changed'),dd);}
 if(proof.tried)facts.append(node('dt','','Tried it'),node('dd','',proof.tried));
 return weakened.length>0;
}

export function frameCheckIn(row,check,{data={},state={},next,review,stop,preview,undo,anyway,restored=false}={}){
 if(state.continued&&check.next){row.querySelector('.pw-done__head')?.append(node('span','',` · continued by you · ${time(state.continuedAt)}`));return row;}
 if(check.accepted&&!check.next){const line=node('section','pw-card pw-card--settled'),words=node('div','pw-card__line'),back=link('Back to Discussion',stop);words.append(glyph('done'),node('span','',`All ${check.total} planned tasks are built · still Implementation`),back);line.append(words);row.className=line.className;row.replaceChildren(...line.childNodes);return row;}
 const verified=Boolean(check.verified),title=check.title||data.title||check.task,count=`Task ${check.number} of ${check.total}`;
 row.className='pw-card';row.setAttribute('aria-label',verified?`${count} done`:`${count} not verified`);
 const head=node('div','pw-card__head'),body=node('div','pw-card__body'),foot=node('div','pw-card__foot');
 head.append(glyph(verified?'done':'caution'),node('h3','pw-card__title',verified?`${count} done: ${title}`:`${count} not verified: ${title}`),node('span','',verified?'Waiting for you to check it':'Waiting for you'));
 if(restored)body.append(harnessNotice(`The chat message was lost in a reload. This check-in comes from the project’s state (${check.task}).`,{who:'Restored'}));
 for(const text of data.person||[])body.append(node('p','pw-done__text',text));
 const facts=node('dl','pw-facts');let caution=false;
 if(verified){facts.append(node('dt','','Verified'),node('dd','',check.verification||'a test passed on the final code'));caution=evidenceFacts(facts,check);
  facts.append(node('dt','','Next'),node('dd','',check.next?(check.next_title?`Task ${check.number+1}: ${check.next_title}`:check.next):'Plan complete.'));}
 else{facts.append(node('dt','','Not verified'),node('dd','',check.outside?.length?'changes outside the task’s Files, left out of its commit':check.verification||check.reason||'no passing test run after the last change'));
  if(check.outside?.length){const dd=node('dd');dd.append('Changed files not in its Files: ');check.outside.forEach((path,index)=>{if(index)dd.append(', ');dd.append(mono(path));});facts.append(node('dt','','Outside the task'),dd);}
  facts.append(node('dt','','Next'),node('dd','',`Retry Task runs task ${check.number} again from its steps`));}
 if(check.removed?.length){const dd=node('dd');check.removed.forEach(text=>dd.append(node('span','pw-checkin__removed',`Removed: ${text}`),node('br')));facts.append(node('dt','','Removed'),dd);}/* task 329: a control and its e2e test, removed together */
 body.append(facts);
 const links=node('div','pw-card__links');links.append(link('Show in Preview',preview));if(undo)links.append(link('Undo This Task…',undo));body.append(links);
 const gap=node('span');gap.style.flex='1';
 if(verified)foot.append(button(check.next?'Accept and Continue':'Accept Task',next,!caution),button('Review First',review,caution),gap,button('Stop Here',stop));
 else foot.append(button('Retry Task',next,true),button('Review First',review),button('Accept Anyway…',anyway),gap,button('Stop Here',stop));
 row.replaceChildren(head,body,foot);return row;
}

/** Accept Anyway…: the alert first (Cancel is the default). True when the person accepts. */
export async function confirmAnyway(ask,check){
 return await ask({icon:'caution',message:`Accept task ${check.number} without a passing test?`,detail:`Its boxes stay checked and ROADMAP.md marks it done, labelled “accepted without verification”. Pi goes on to task ${check.number+1}. You can reopen it later from Work or Activity.`,danger:'Accept Anyway',safe:'Cancel',plain:true})==='danger';
}

/** After phases.renderHistory: the waiting check-in from the project's state when no chat message shows it (a reload lost it). */
export function restoreCheckIn(messages,phase,chat,actions){
 messages.querySelectorAll('.pw-checkin-restored').forEach(el=>el.remove());
 const check=phase?.check_in;if(!check?.task)return;
 const shown=(chat||[]).some(message=>message.check_in?.task===check.task&&!message.check_in.accepted&&message.check_in.state!=='stopped');if(shown)return;
 const article=node('article','message assistant pw-msg pw-checkin-restored'),row=node('section');
 article.append(frameCheckIn(row,check,{...actions,restored:true}));messages.append(article);
}

/** Reopen Task… (R12_Reopen): the alert, then the person route. Resolves the route's answer, or null when cancelled. */
export async function reopenTask({api,ask,project,task}){
 const file=await api('/api/document?path='+encodeURIComponent(`projects/${project}/${task}`)).catch(()=>null),text=file?.markdown||'';
 const name=text.match(/^# (?:\d+: )?(.+)$/m)?.[1]?.trim()||task.split('/').pop(),boxes=(text.split('## Progress')[0].match(/^\s*[-*+] \[[xX]\]/gm)||[]).length;
 if(await ask({icon:'caution',message:`Reopen “${name}”?`,detail:`Its ${boxes} box${boxes===1?' is':'es are'} unchecked and its ROADMAP.md line goes back to open. The code stays as it is; Pi checks the task again when you build it.`,danger:'Reopen Task',safe:'Cancel',plain:true})!=='danger')return null;
 return {name,...await api('/api/tasks/reopen',{project,task})};
}

/** Work (R12_Reopen): a done task file gets an info bar with Done and Reopen Task…; it follows the open file. */
export function installReopenBar({api,ask,toast,error,reopened=()=>{}}){
 const toolbar=document.getElementById('document-toolbar');if(!toolbar)return;
 const bar=node('div','pw-infobar task-infobar');bar.id='task-infobar';bar.hidden=true;toolbar.before(bar);let serial=0;
 async function update(){const path=toolbar.dataset.path||'',match=path.match(/^projects\/([^/]+)\/(tasks\/[^/]+\.md)$/),request=++serial;
  if(!match){bar.hidden=true;return;}
  const file=await api('/api/document?path='+encodeURIComponent(path)).catch(()=>null);if(request!==serial)return;
  const head=(file?.markdown||'').split('## Progress')[0],done=/^\s*[-*+] \[[xX]\]/m.test(head)&&!/^\s*[-*+] \[ \]/m.test(head);
  bar.hidden=!done;if(!done)return;
  const state=node('span','pw-glyph');state.append(glyph('done'),'Done');const gap=node('span');gap.style.marginLeft='auto';
  const reopen=button('Reopen Task…',async()=>{try{const result=await reopenTask({api,ask,project:match[1],task:match[2]});if(!result)return;toast(`Reopened “${result.name}”.`);bar.hidden=true;reopened(path);}catch(e){error(e.message);}});
  bar.replaceChildren(state,gap,reopen);}
 new MutationObserver(update).observe(toolbar,{attributes:true,attributeFilter:['data-path']});update();
 return {update};
}

/** Activity (R12_Reopen): Reopen Task… in the detail of a request that ended at a check-in. */
export function reopenButton(job,{api,ask,toast,error,reopened=()=>{}}){
 const task=job.check_in?.task;if(!task||!['completed','done'].includes(job.status))return null;
 return button('Reopen Task…',async()=>{try{const result=await reopenTask({api,ask,project:job.project,task});if(result){toast(`Reopened “${result.name}”.`);reopened();}}catch(e){error(e.message);}});
}
