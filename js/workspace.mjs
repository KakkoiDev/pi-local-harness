import { saveDraft,loadDraft } from './drafts.mjs';
import { icon,stateGlyph,toolCard,segmentFor,readState,writeState } from './ui.mjs';import { ask,askName } from './dialogs.mjs';import { installPopup } from './menubar.mjs';
import { parseMarkdown,serializeMarkdown } from './markdown-blocks.mjs';import { spoken } from './message-markdown.mjs';
export function installWorkspace(host){
 const $=id=>document.getElementById(id),{api,node,error}=host;
 let state={projects:[],jobs:[]},project=null,page=null,blocks=[],focusedBlock=null,selectedJob=null,commentFilter='open',openThread=null,currentComment=null,showResolved=readState('showResolved',false),dirty=false,saving=null,saveTimer,folderMode='register',folder=null,polling=false,fileRevision='',textFile=false,commentAnchor='',browseSequence=0,fileSequence=0;
 const agentState=(glyph,text)=>$('agent-state').replaceChildren(...(glyph?[icon(glyph)]:[]),text);
 const notice=(text,failed=false)=>{$('save-status').textContent=text;$('save-status').classList.toggle('failed',failed);if(failed&&dirty){$('save-recovery-message').textContent=text;$('save-recovery').hidden=false;}};
 const navigation=readState('navigation',{});let files=[];const replyDrafts=new Map();const signatures={};const unchanged=(key,value)=>{const signature=JSON.stringify(value);if(signatures[key]===signature)return true;signatures[key]=signature;return false;};
 const remember=()=>writeState('navigation',{...readState('navigation',{}),project,files:{...readState('navigation',{}).files,...(page?.path?{[project]:page.path}:{})}});
 const selectedProject=()=>state.projects.find(item=>item.id===project);
 function changed(){dirty=true;if(page&&!saveDraft(localStorage,page.path,content(),fileRevision))notice('Draft is only in this tab; browser storage is unavailable.',true);notice('Unsaved');clearTimeout(saveTimer);saveTimer=setTimeout(()=>save().catch(e=>notice(e.message,true)),700);}
 function content(){return $('editor-mode').value==='source'||textFile?$('document-source').value:serializeMarkdown(blocks);}
 async function save(){
  clearTimeout(saveTimer);if(saving)await saving;if(!dirty||!page)return;
  const current=page,markdown=content();
  saving=(async()=>{notice('Saving…');const saved=await api('/api/documents/'+(textFile?'save-file':'save'),textFile?{path:current.path,text:markdown,revision:fileRevision}:{path:current.path,markdown,revision:current.revision});
   if(page===current){fileRevision=saved.revision;if(!textFile){page=saved;}dirty=content()!==markdown;notice(dirty?'Unsaved':'Saved');if(dirty)changed();else{saveDraft(localStorage,current.path,null);$('save-recovery').hidden=true;}}
  })();try{await saving;}finally{saving=null;}if(dirty)await save();
 }
 // Notion-style keys: Return splits the block (lists continue, an empty list item becomes a paragraph); Backspace in an empty block removes it.
 function caretOffset(element){const selection=getSelection();if(!selection.rangeCount||!element.contains(selection.anchorNode))return element.innerText.length;const range=document.createRange();range.selectNodeContents(element);range.setEnd(selection.anchorNode,selection.anchorOffset);return range.toString().length;}
 function caretToEnd(index){const element=blockRows()[index]?.querySelector('[contenteditable]');if(!element)return;element.focus();const range=document.createRange();range.selectNodeContents(element);range.collapse(false);const selection=getSelection();selection.removeAllRanges();selection.addRange(range);}
 function blockKey(event,index,element){const block=blocks[index];if(event.isComposing||!block)return;
  if(event.key==='Enter'&&!event.shiftKey&&!['code','raw'].includes(block.type)){event.preventDefault();const list=['bullet','number','check'].includes(block.type);
   if(list&&!element.innerText.trim()){setType(index,'text');return;}
   const at=caretOffset(element),value=element.innerText;block.text=value.slice(0,at);block.dirty=true;blocks.splice(index+1,0,{type:list?block.type:'text',text:value.slice(at),checked:false,level:block.level,dirty:true});changed();renderBlocks();refocus(index+1);focusBlock(index+1);}
  else if(event.key==='Backspace'&&!element.innerText.length&&blocks.length>1){event.preventDefault();blocks.splice(index,1);changed();renderBlocks();caretToEnd(Math.max(0,index-1));focusBlock(Math.max(0,index-1));}}
 const blockRows=()=>[...$('document-editor').querySelectorAll(':scope>.pw-block')];
 function focusBlock(index){focusedBlock=index;blockRows().forEach((row,position)=>row.classList.toggle('pw-block--focused',position===index));$('block-style').value=blocks[index]?.type||'text';$('tool-bullet').setAttribute('aria-pressed',String(blocks[index]?.type==='bullet'));$('tool-check').setAttribute('aria-pressed',String(blocks[index]?.type==='check'));}
 function refocus(index){focusedBlock=index;blockRows()[index]?.querySelector('[contenteditable]')?.focus();}
 function setType(index,type){const block=blocks[index];if(!block)return;block.type=type;block.level=block.level||2;block.dirty=true;changed();renderBlocks();refocus(index);}
 function moveBlock(index,delta){const target=index+delta;if(index===null||target<0||target>=blocks.length)return;[blocks[index],blocks[target]]=[blocks[target],blocks[index]];blocks[index].dirty=blocks[target].dirty=true;changed();renderBlocks();refocus(target);}
 function reviewPassage(text){if(document.body.dataset.review==='closed')$('toggle-review').click();attachSelection(text);}
 function commentSelection(){if(!commentAnchor)return;reviewPassage(commentAnchor);$('selection-bar').hidden=true;$('comment-text').focus();}
 function askAbout(text){reviewPassage(text);$('selection-bar').hidden=true;$('document-prompt').value=`About “${text.slice(0,120)}”: `;$('document-prompt').focus();}
 const NOUN={text:'Paragraph',heading:'Heading',check:'Task',bullet:'Bullet',number:'Numbered Item',quote:'Quote',code:'Code Block',raw:'Markdown'};
 function deleteBlock(index){const [removed]=blocks.splice(index,1);if(!removed)return;changed();renderBlocks();refocus(Math.max(0,Math.min(index,blocks.length-1)));host.toast(NOUN[removed.type]+' deleted',()=>{blocks.splice(index,0,{...removed,dirty:true});changed();renderBlocks();refocus(index);});}
 const blockPopup=installPopup($('block-menu'),item=>{const index=focusedBlock,block=blocks[index];if(!block)return;if(item.dataset.action==='add')addBlock(index);else if(item.dataset.type)setType(index,item.dataset.type);else if(item.dataset.action==='up')moveBlock(index,-1);else if(item.dataset.action==='down')moveBlock(index,1);else if(item.dataset.action==='delete')deleteBlock(index);else if(item.dataset.action==='comment'){attachSelection(block.text.trim());commentSelection();}else if(item.dataset.action==='ask')askAbout(block.text.trim());},()=>{const type=blocks[focusedBlock]?.type,noun=NOUN[type]||'Block';for(const item of $('block-menu').querySelectorAll('[data-type]'))item.setAttribute('aria-checked',String(item.dataset.type===type));
  for(const [action,label] of [['comment','Comment on '+noun],['ask','Ask Pi About '+noun+'…'],['delete','Delete '+noun]])$('block-menu').querySelector(`[data-action="${action}"]`).textContent=label;});
 $('block-style').onchange=()=>{if(focusedBlock!==null)setType(focusedBlock,$('block-style').value);};
 // Work board list tools: press to make the focused block a bullet or a task, press again for a paragraph.
 for(const [id,type] of [['tool-bullet','bullet'],['tool-check','check']]){$(id).onpointerdown=event=>event.preventDefault();$(id).onclick=()=>{if(focusedBlock!==null)setType(focusedBlock,blocks[focusedBlock]?.type===type?'text':type);};}
 function renderBlocks(){if(focusedBlock!==null&&focusedBlock>=blocks.length)focusedBlock=null;const focusedThread=document.activeElement?.dataset?.thread,opened=openThread&&page?.comments?.find(comment=>comment.id===openThread&&!comment.deleted);let threaded=false;
  $('document-editor').replaceChildren();
  blocks.forEach((block,index)=>{
   const row=node('div','editor-block pw-block '+block.type+(index===focusedBlock?' pw-block--focused':'')),handle=node('button','pw-block__handle');handle.type='button';handle.tabIndex=-1;handle.append(icon('handle'));handle.setAttribute('aria-label','Block actions');handle.setAttribute('aria-haspopup','menu');handle.setAttribute('aria-expanded','false');handle.onclick=()=>{focusBlock(index);blockPopup.open(handle);};row.append(handle);row.addEventListener('focusin',()=>focusBlock(index));
   // List markers are chrome, not text (task 112): numbers count within a run of numbered blocks.
   if(block.type==='bullet'||block.type==='number'){let n=1;for(let k=index-1;k>=0&&blocks[k].type==='number';k--)n++;const marker=node('span','pw-block__marker',block.type==='bullet'?'•':n+'.');marker.setAttribute('aria-hidden','true');row.append(marker);}
   if(block.type==='check'){const check=node('input','pw-check');check.type='checkbox';check.checked=block.checked;check.setAttribute('aria-label','Task complete');check.onchange=()=>{block.checked=check.checked;block.dirty=true;changed();};row.append(check);}
   const text=node(block.type==='heading'?'h'+Math.min(block.level||2,6):block.type==='code'||block.type==='raw'?'pre':'div','block-content',block.text);
   text.contentEditable='plaintext-only';text.setAttribute('role','textbox');text.setAttribute('aria-label',block.type==='heading'?'Heading':'Block text');text.spellcheck=block.type!=='code';
   highlightComments(text,block);text.oninput=()=>{block.text=text.innerText;block.dirty=true;changed();};text.onkeydown=event=>blockKey(event,index,text);row.append(text);$('document-editor').append(row);if(opened&&!threaded&&block.text.includes(opened.anchor)){threaded=true;$('document-editor').append(thread(opened));}
  });
  if(focusedThread)$('document-editor').querySelector(`[data-thread="${focusedThread}"]`)?.focus();
 }
 const when=iso=>iso?new Date(iso).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):'';
 const commentState=comment=>comment.deleted?'deleted':comment.resolved?'resolved':'open';
 const stateLine=comment=>comment.deleted?'Deleted':comment.resolved?'Resolved':comment.chat_id?'Sent to Pi':'Not sent to Pi';
 function orderedComments(){const text=page?.markdown||'',at=comment=>{const found=text.indexOf(comment.anchor);return found<0?Infinity:found;};return (page?.comments||[]).map((comment,index)=>({comment,index,at:at(comment)})).sort((a,b)=>a.at-b.at||a.index-b.index).map(item=>item.comment);}
 function numbers(){const result=new Map();orderedComments().filter(comment=>!comment.deleted).forEach((comment,index)=>result.set(comment.id,index+1));return result;}
 async function commentAction(url,body,after){try{await api(url,{path:page.path,...body});await refreshPageComments();after?.();}catch(e){notice(e.message,true);}}
 async function applySuggestion(comment){try{await save();const path=page.path;await api('/api/documents/apply-suggestion',{path,id:comment.id,revision:fileRevision});saveDraft(localStorage,path,null);dirty=false;page=null;await openFile(path);host.toast('Change applied');}catch(e){notice(e.message,true);}}
 function deleteComment(comment){if(openThread===comment.id)openThread=null;commentAction('/api/documents/delete-comment',{id:comment.id,deleted:true},()=>host.toast('Comment deleted. It’s kept under Deleted in Review.',()=>commentAction('/api/documents/delete-comment',{id:comment.id,deleted:false})));}
 async function askPi(comment,button){if(button)button.disabled=true;try{await save();await api('/api/jobs/create',{project,message:'Comment: '+comment.text,document_comment:{path:page.path,id:comment.id}});await poll();await refreshPageComments();notice('Comment sent to Pi');return true;}catch(e){notice(e.message,true);if(button)button.disabled=false;return false;}}
 const unsent=()=>orderedComments().filter(comment=>commentState(comment)==='open'&&!comment.chat_id);
 $('send-unsent').onclick=async()=>{$('send-unsent').disabled=true;for(const comment of unsent())if(!await askPi(comment))break;renderComments();};
 function showThread(id){const comment=page?.comments.find(item=>item.id===id);if(!comment)return;currentComment=id;openThread=comment.deleted?null:id;renderBlocks();renderComments();}
 function stepComment(delta){if(commentFilter==='deleted')commentFilter='open';const list=orderedComments().filter(comment=>commentState(comment)===commentFilter);if(!list.length)return;const index=list.findIndex(comment=>comment.id===currentComment),next=list[index<0?(delta>0?0:list.length-1):(index+delta+list.length)%list.length];showThread(next.id);document.getElementById('comment-'+next.id)?.scrollIntoView({block:'nearest'});}
 function button(label,onclick,className='pw-btn'){const item=node('button',className,label);item.type='button';item.onclick=onclick;return item;}
 function replyForm(comment){const form=node('form','pw-thread__actions'),reply=node('input','pw-field');reply.placeholder='Reply…';reply.setAttribute('aria-label','Reply to text comment');reply.maxLength=10000;reply.required=true;reply.dataset.thread=comment.id;reply.value=replyDrafts.get(comment.id)||'';reply.oninput=()=>replyDrafts.set(comment.id,reply.value);
  const submit=node('button','pw-btn','Reply');form.append(reply,submit);form.onsubmit=async event=>{event.preventDefault();submit.disabled=true;try{await api('/api/documents/reply',{path:page.path,id:comment.id,text:reply.value||replyDrafts.get(comment.id)||''});replyDrafts.delete(comment.id);await refreshPageComments();}catch(e){notice(e.message,true);}finally{submit.disabled=false;}};return form;}
 function thread(comment){const box=node('div','pw-thread'+(comment.resolved?' pw-thread--resolved':''));box.setAttribute('role','group');box.setAttribute('aria-label','Comment thread');
  const message=(who,time,text)=>{const row=node('div','pw-thread__msg'),label=node('span','pw-thread__who');label.append(node('b','',who),time?' '+time:'');row.append(label,node('p','',text));return row;};
  box.append(message('You',when(comment.created),comment.text));for(const reply of comment.replies||[])box.append(message('You',when(reply.created),reply.text));if(comment.agent_reply)box.append(message('Pi','',spoken(comment.agent_reply)));
  const suggestion=comment.suggestion;
  if(suggestion?.applied)box.append(node('p','pw-thread__note','Pi’s suggested change was applied.'));else if(suggestion?.kept)box.append(node('p','pw-thread__note','Pi suggested a rewrite. You kept your text.'));
  else if(suggestion&&!comment.resolved){const change=node('div','pw-suggest');change.setAttribute('aria-label','Suggested change');change.append(node('del','',suggestion.anchor),node('ins','',suggestion.replacement));const choices=node('div','pw-suggest__actions');choices.append(button('Keep Mine',()=>commentAction('/api/documents/keep-suggestion',{id:comment.id})),button('Apply Change',()=>applySuggestion(comment),'pw-btn pw-btn--default'));change.append(choices);box.append(change);}
  // Final board: a note line, then the actions; Delete sits apart at the end.
  if(comment.resolved){const actions=node('div','pw-thread__actions');actions.append(node('span','pw-thread__line','Resolved'),button('Reopen',()=>commentAction('/api/documents/resolve',{id:comment.id,resolved:false})));box.append(actions);return box;}
  const actions=replyForm(comment),line=node('span','pw-thread__line');actions.prepend(line);
  if(comment.chat_id){const job=state.jobs.find(job=>job.comment_id===comment.id),phase={queued:'waiting in queue',running:'Pi is working on it'}[job?.status]||'answered';if(job?.status==='running')line.append(icon('running'));line.append('Sent to Pi · '+phase+' · can no longer be deleted');}
  else{line.textContent='Saved with the file · not sent to Pi';const ask=button('Ask Pi',()=>askPi(comment,ask));actions.append(ask);}
  actions.append(button('Resolve',()=>commentAction('/api/documents/resolve',{id:comment.id,resolved:true})));
  if(!comment.chat_id)actions.append(node('span','pw-thread__gap'),button('Delete',()=>deleteComment(comment)));
  box.append(actions);return box;}
 function renderComments(){
  if(unchanged('comments',[page?.path,page?.comments,commentFilter,currentComment,openThread,showResolved]))return;if(!document.activeElement?.isContentEditable)renderBlocks();
  const list=orderedComments(),numbered=numbers(),counts={open:0,resolved:0,deleted:0};for(const comment of list)counts[commentState(comment)]++;
  $('comment-count').textContent=counts.open;const waiting=unsent().length;$('send-unsent').disabled=!waiting;$('send-unsent').textContent=waiting?`Send ${waiting} Unsent Comment${waiting>1?'s':''} to Pi`:'No unsent comments';
  for(const item of $('comment-filter').querySelectorAll('[data-filter]')){const filter=item.dataset.filter;item.textContent={open:'Open',resolved:'Resolved',deleted:'Deleted'}[filter]+' '+counts[filter];item.setAttribute('aria-checked',String(filter===commentFilter));}
  $('document-comments').replaceChildren();const shown=list.filter(comment=>commentState(comment)===commentFilter);
  if(page&&!shown.length)$('document-comments').append(node('p','list-empty pw-empty',{open:'No open comments.',resolved:'Nothing resolved yet.',deleted:'No deleted comments.'}[commentFilter]));
  for(const comment of shown){
   const item=node('div','pw-review-item');item.id='comment-'+comment.id;if(comment.id===currentComment)item.setAttribute('aria-current','true');
   const head=node('button','pw-review-item__head');head.type='button';head.append(node('span','',(numbered.has(comment.id)?numbered.get(comment.id)+' · ':'')+stateLine(comment)),node('span','',when(comment.created)));head.onclick=()=>showThread(comment.id);
   item.append(head,node('p','pw-review-item__quote','“'+comment.anchor+'”'));
   if(page.markdown&&!page.markdown.includes(comment.anchor))item.append(node('p','pw-help','Passage changed on disk; this thread keeps the original quote.'));
   item.append(node('p','pw-review-item__text',comment.text));
   const actions=node('div','pw-review-item__actions'),state=commentState(comment);
   if(state==='open'&&!comment.chat_id){const ask=button('Ask Pi',()=>askPi(comment,ask));actions.append(ask);}
   if(state==='open')actions.append(button('Resolve',()=>commentAction('/api/documents/resolve',{id:comment.id,resolved:true})));
   if(state==='open'&&!comment.chat_id)actions.append(button('Delete',()=>deleteComment(comment)));
   if(state==='resolved')actions.append(button('Reopen',()=>commentAction('/api/documents/resolve',{id:comment.id,resolved:false})));
   if(state==='deleted')actions.append(button('Restore',()=>commentAction('/api/documents/delete-comment',{id:comment.id,deleted:false})));
   if(comment.chat_id){const chat=node('a','pw-link','Open Chat');chat.href='/?chat='+comment.chat_id;chat.onclick=event=>{event.preventDefault();host.selectChat(comment.chat_id);};actions.append(chat);}
   item.append(actions);$('document-comments').append(item);
  }
 }
 $('comment-filter').onclick=event=>{const item=event.target.closest('[data-filter]');if(item){commentFilter=item.dataset.filter;renderComments();}};
 $('show-resolved').checked=showResolved;$('show-resolved').onchange=()=>{showResolved=$('show-resolved').checked;writeState('showResolved',showResolved);renderBlocks();renderComments();};
 function renderDocumentRequests(){
  if(unchanged('requests',[page?.path,state.jobs.filter(job=>job.document===page?.path&&!job.comment_id)]))return;$('document-request-history').hidden=true;$('document-requests').replaceChildren();if(!page)return;
  const jobs=state.jobs.filter(job=>job.document===page.path&&!job.comment_id).slice(-5);$('document-request-history').hidden=!jobs.length;$('document-request-summary').textContent=jobs.length+' recent document '+(jobs.length===1?'request':'requests');
  for(const job of jobs){const thread=node('article','document-request');thread.append(node('p','',job.message),node('small','',job.status));if(job.text)thread.append(node('p','agent-reply',spoken(job.text)));const open=node('button','','View task');open.onclick=()=>{host.showActivity();$('activity-filter').value='all';selectJob(job.id);document.getElementById('job-'+job.id)?.scrollIntoView({block:'center'});};thread.append(open);$('document-requests').append(thread);}
 }
 function highlightComments(text,block){
  const numbered=numbers(),matches=(page?.comments||[]).filter(comment=>!comment.deleted&&(!comment.resolved||showResolved||comment.id===openThread)&&comment.anchor&&block.text.includes(comment.anchor)).map(comment=>({comment,at:block.text.indexOf(comment.anchor)})).sort((a,b)=>a.at-b.at);
  if(!matches.length)return;text.replaceChildren();let cursor=0;
  for(const {comment,at} of matches){if(at<cursor)continue;text.append(document.createTextNode(block.text.slice(cursor,at)));
   const anchor=node('span','pw-anchor'+(comment.resolved?' pw-anchor--resolved':comment.chat_id?' pw-anchor--sent':''),comment.anchor);anchor.dataset.comment=comment.id;
   const mark=node('button','pw-mark'+(comment.resolved?' pw-mark--resolved':''));mark.type='button';mark.contentEditable='false';mark.dataset.n=numbered.get(comment.id);mark.setAttribute('aria-label','Comment '+numbered.get(comment.id));mark.setAttribute('aria-expanded',String(openThread===comment.id));
   mark.onclick=event=>{event.preventDefault();if(openThread===comment.id){openThread=null;renderBlocks();renderComments();}else showThread(comment.id);};
   text.append(anchor,mark);cursor=at+comment.anchor.length;}
  text.append(document.createTextNode(block.text.slice(cursor)));
 }
 const clock=iso=>{if(!iso)return '';const date=new Date(iso),today=new Date(),yesterday=new Date();yesterday.setDate(today.getDate()-1);return date.toDateString()===today.toDateString()?date.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):date.toDateString()===yesterday.toDateString()?'Yesterday':date.toLocaleDateString();};
 const duration=job=>{if(!job.started)return String.fromCharCode(8212);const seconds=Math.max(0,Math.round(((job.finished?new Date(job.finished):new Date())-new Date(job.started))/1000));return Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');};
 const needsAttention=job=>['failed','stopped','interrupted'].includes(job.status);
 function selectJob(id){selectedJob=id;$('activity-record').hidden=true;renderActivity();}
 async function showRecord(id){try{const result=await api('/api/activity-record?id='+id);$('activity-record-text').textContent=result.markdown;$('activity-record').hidden=false;$('activity-record').open=true;$('activity-record').scrollIntoView({block:'nearest'});}catch(e){error(e.message);}}
 function renderJobDetail(job){
  const detail=$('activity-detail');detail.hidden=!job;detail.replaceChildren();if(!job)return;const item=state.projects.find(project=>project.id===job.project);
  detail.append(node('h3','pw-label',stateGlyph(job.status).textContent+' in '+(item?.name||job.project)),node('blockquote','activity-detail__request','“'+(job.message||'Attached files')+'”'));
  const facts=node('dl','activity-detail__facts'),fact=(name,value)=>{if(value)facts.append(node('dt','',name),node('dd','',value));};
  if(job.status!=='failed')fact('Phase',job.progress);const tools=job.tools||[],gates=tools.map(tool=>tool.checks?.find(check=>check.phase==='gate')).filter(Boolean);fact('Last command',tools.at(-1)?.detail||'');if(gates.length)fact('Gate',gates.filter(check=>check.outcome==='ALLOW').length+' approved · '+gates.filter(check=>check.outcome!=='ALLOW').length+' blocked');fact('Started',job.started?new Date(job.started).toLocaleString():'');fact('Files',(job.files||[]).join(', '));detail.append(facts);
  if(job.status==='failed'){const line=node('p','pw-error');line.append(icon('alert-caution'),job.progress);detail.append(line);}
  if(job.tools?.length){const tools=node('section','activity-detail__tools');tools.setAttribute('aria-label','Commands');tools.append(node('h4','pw-label','Commands'));for(const tool of job.tools)tools.append(toolCard(tool,{showEvent:host.showGateEvent}));detail.append(tools);}
  if(job.text){const result=node('details');result.append(node('summary','pw-label','Result'),node('pre','pw-mono',spoken(job.text)));detail.append(result);}
  const actions=node('div','activity-detail__actions'),chat=node('a','pw-btn','Open Chat');chat.href='/?chat='+job.chat;chat.onclick=event=>{event.preventDefault();host.selectChat(job.chat);};actions.append(chat);
  if(job.document){const doc=node('a','pw-btn','Open Document');doc.href='/?document='+encodeURIComponent(job.document);doc.onclick=async event=>{event.preventDefault();await selectProject(job.project);await openFile(job.document);host.showWorkspace();if(job.comment_id)document.getElementById('comment-'+job.comment_id)?.scrollIntoView({block:'center'});};actions.append(doc);}
  if(job.status==='running'){const stop=node('button','pw-btn','Stop');stop.type='button';stop.onclick=()=>api(`/api/conversations/${job.chat}/stop`,{}).catch(e=>error(e.message));actions.append(stop);}
  if(job.status==='queued'){const cancel=node('button','pw-btn','Cancel…');cancel.type='button';cancel.onclick=async()=>{if(await ask({message:'Cancel the waiting request?',detail:'It has not started. You can send it again from the chat.',danger:'Cancel Request',safe:'Keep Waiting'})!=='danger')return;try{await api('/api/jobs/cancel',{id:job.id});await poll();}catch(e){error(e.message);}};actions.append(cancel);}
  const record=node('button','pw-btn','Show Task Record');record.type='button';record.onclick=()=>showRecord(job.id);actions.append(record);detail.append(actions);
 }
 function renderActivity(){
  const filter=$('activity-filter').value,scope=$('activity-project').value;syncActivitySeg();if(unchanged('activity',[filter,scope,state.projects,state.jobs,selectedJob]))return;
  const inScope=state.jobs.filter(job=>scope==='all'||job.project===scope),counts={pending:inScope.filter(job=>['running','queued'].includes(job.status)).length,attention:inScope.filter(needsAttention).length};
  for(const radio of $('activity-seg').querySelectorAll('[data-value="pending"],[data-value="attention"]'))radio.textContent=(radio.dataset.value==='pending'?'Active':'Attention')+(counts[radio.dataset.value]?' '+counts[radio.dataset.value]:'');
  const visible=state.jobs.filter(job=>(scope==='all'||job.project===scope)&&(filter==='all'||filter==='pending'&&['running','queued'].includes(job.status)||filter==='completed'&&job.status==='completed'||filter==='attention'&&needsAttention(job)));
  const ordered=visible.slice().sort((a,b)=>{const ranks={running:0,queued:1};return (ranks[a.status]??2)-(ranks[b.status]??2)||(['queued','running'].includes(a.status)?a.order-b.order:b.order-a.order);});
  if(!ordered.some(job=>job.id===selectedJob))selectedJob=ordered[0]?.id||null;
  const list=$('activity-list'),focused=list.contains(document.activeElement),head=node('div','pw-table__row pw-table__head');head.setAttribute('aria-hidden','true');for(const label of ['State','Request','Project','Source','Started','Time'])head.append(node('span','',label));list.replaceChildren(head);
  if(!ordered.length){if(!state.jobs.length||filter==='pending'){const empty=node('div','activity-empty'),open=node('button','pw-btn pw-btn--default','Open Project Chat');open.type='button';open.onclick=openProjectChat;empty.append(node('h3','pw-label','All caught up'),node('p','pw-help','Send a chat message or a document request. Its progress and result will appear here.'),open);list.append(empty);}else list.append(node('p','list-empty pw-empty','No tasks match these filters.'));}
  for(const job of ordered){const item=state.projects.find(project=>project.id===job.project),row=node('a','activity-task pw-table__row');row.id='job-'+job.id;row.href='/?job='+job.id;row.setAttribute('role','listitem');row.tabIndex=job.id===selectedJob?0:-1;if(job.id===selectedJob)row.setAttribute('aria-current','true');
   const glyph=stateGlyph(job.status);glyph.classList.add('task-state',job.status);
   row.append(glyph,node('span','pw-table__cell--text activity-request',job.message||'Attached files'),node('span','',item?.name||job.project),node('span','',job.document?job.document.split('/').pop():'Chat'),node('span','',job.status==='queued'?'queued '+clock(job.created):clock(job.started||job.created)),node('span','',duration(job)));
   row.onclick=event=>{event.preventDefault();selectJob(job.id);host.jobOpened();};row.onpointerdown=()=>{row.dataset.pointer='1';};row.onfocus=()=>{if(!row.dataset.pointer&&selectedJob!==job.id)selectJob(job.id);};list.append(row);
  }
  if(focused)list.querySelector('[aria-current="true"]')?.focus();
  renderJobDetail(ordered.find(job=>job.id===selectedJob));
  const running=state.jobs.filter(job=>job.status==='running').length,waiting=state.jobs.filter(job=>job.status==='queued').length,attention=state.jobs.filter(needsAttention).length;
  const parts=[running&&running+' running',waiting&&waiting+' waiting'].filter(Boolean);if(!parts.length)parts.push('Nothing running or waiting');if(attention)parts.push(attention+(attention===1?' needs':' need')+' attention');
  $('activity-summary').textContent=parts.join(' · ');$('activity-count').textContent=running+waiting;$('activity-count').hidden=!(running+waiting);
 }
 $('activity-list').onkeydown=event=>{if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return;const rows=[...$('activity-list').querySelectorAll('a.activity-task')];if(!rows.length)return;event.preventDefault();const index=rows.findIndex(row=>row.getAttribute('aria-current')==='true'),next=event.key==='Home'?0:event.key==='End'?rows.length-1:Math.max(0,Math.min(rows.length-1,index+(event.key==='ArrowDown'?1:-1)));selectJob(rows[next].id.slice(4));$('activity-list').querySelector('[aria-current="true"]')?.focus();};
 $('activity-filter').onchange=$('activity-project').onchange=renderActivity;const syncActivitySeg=segmentFor($('activity-seg'),$('activity-filter'));
 async function refreshPageComments(){if(page&&!textFile){const fresh=await api('/api/document?path='+encodeURIComponent(page.path));page.comments=fresh.comments;renderComments();}}
 async function openFile(path){
  if(page?.path===path&&!dirty){host.documentOpened();return;}const sequence=++fileSequence;
  try{await save();if(sequence!==fileSequence)return;textFile=!path.toLowerCase().endsWith('.md');
   const value=await api((textFile?'/api/project-file':'/api/document')+'?path='+encodeURIComponent(path));if(sequence!==fileSequence)return;page=value;dirty=false;commentAnchor='';
   fileRevision=value.revision;$('document-source').value=textFile?value.text:value.markdown;blocks=textFile?[]:parseMarkdown(value.markdown);
   $('document-prompt').disabled=false;$('comment-text').disabled=false;$('document-source').disabled=false;$('editor-mode').value=textFile?'source':'blocks';$('editor-mode').disabled=textFile;$('block-style').disabled=textFile;$('tool-bullet').disabled=$('tool-check').disabled=textFile;
   $('document-editor').hidden=textFile;$('document-source').hidden=!textFile;$('comments-panel').hidden=textFile;
   const restored=loadDraft(localStorage,path,value.revision);$('save-recovery').hidden=true;if(restored){dirty=true;$('document-source').value=restored.text;blocks=textFile?[]:parseMarkdown(restored.text);focusedBlock=null;openThread=currentComment=null;notice(restored.conflict?'Your saved draft differs from the file on disk. Download it before reloading.':'Restored your unsaved draft',restored.conflict);if(!restored.conflict)changed();}
   renderBlocks();renderComments();renderDocumentRequests();$('document-discussion').hidden=textFile;clearAnchor();host.documentOpened();if(!restored)notice(textFile?'Live text/code file':'Saved');$('document-toolbar').dataset.path=path;$('document-path').textContent=path.split('/').slice(2).join('/');host.documentTitle(path.split('/').pop());renderFiles();remember();
  }catch(e){notice(e.message,true);}
 }
 async function selectProject(id,openWork=true){
  try{await save();fileSequence++;project=id;page=null;dirty=false;const item=selectedProject();
   $('project-title').textContent=item.name;$('active-project-label').textContent=item.name;$('project-folder').textContent=item.path;
   $('document-path').textContent='No document open';host.documentTitle(item.name);$('document-prompt').disabled=true;$('comment-text').disabled=true;$('document-source').disabled=true;$('editor-mode').disabled=true;$('block-style').disabled=true;$('tool-bullet').disabled=$('tool-check').disabled=true;$('document-editor').hidden=false;$('document-source').hidden=true;clearAnchor();renderDocumentRequests();$('document-editor').replaceChildren(node('p','list-empty','Choose a roadmap, task, or file.')); $('document-source').value='';$('document-comments').replaceChildren();
   await host.selectChat(item.chat);if(openWork)host.showWorkspace();await refreshFiles();renderProjects();renderQueue();remember();const target=readState('navigation',{}).files?.[id]||files.find(file=>file.name==='ROADMAP.md')?.path;if(target&&files.some(file=>file.path===target))await openFile(target);
  }catch(e){notice(e.message,true);}
 }
 function renderProjects(){
  if(unchanged('projects',[state.projects,project,$('project-search').value]))return;const query=$('project-search').value.trim().toLocaleLowerCase();$('project-count').textContent=state.projects.length;$('project-list').replaceChildren();
  const matches=state.projects.filter(item=>(item.name+' '+item.path).toLocaleLowerCase().includes(query));
  if(!matches.length)$('project-list').append(node('p','list-empty pw-empty',query?'No matching projects':'Your projects will appear here.'));
  for(const item of matches){const button=node('button','pw-row');button.type='button';button.append(icon('folder'),node('span','pw-row__label',item.name));button.title=item.path;button.setAttribute('aria-current',item.id===project?'page':'false');button.onclick=()=>selectProject(item.id);$('project-list').append(button);}
 }
 function renderFiles(){
  if(unchanged('files',[files,page?.path,$('file-search').value]))return;const query=$('file-search').value.trim().toLocaleLowerCase();$('file-tree').replaceChildren();
  const matches=files.filter(file=>file.name.toLocaleLowerCase().includes(query));
  if(!matches.length)$('file-tree').append(node('p','list-empty pw-empty',query?'No matching files':'This folder is empty. Create a page or task to begin.'));
  for(const file of matches){const button=node('button','pw-row file-item');button.type='button';button.append(icon('file'),node('span','pw-row__label',file.name));button.title=file.name;button.setAttribute('aria-current',file.path===page?.path?'page':'false');button.onclick=()=>openFile(file.path);$('file-tree').append(button);}
 }
 async function refreshFiles(){
  if(!project)return;files=await api('/api/project-files?project='+encodeURIComponent(project));files.sort((a,b)=>a.name==='ROADMAP.md'?-1:b.name==='ROADMAP.md'?1:a.name.localeCompare(b.name));renderFiles();
 }
 $('connection-retry').onclick=poll;
 $('project-search').oninput=renderProjects;$('file-search').oninput=renderFiles;
 $('welcome-create').onclick=()=>$('new-project').click();$('welcome-folder').onclick=()=>$('add-folder').click();
 
 function renderQueue(){const activeCount=state.jobs.filter(job=>job.status==='queued').length;agentState(...(state.busy?['running','Working'+(activeCount?' · '+activeCount+' waiting':'')]:activeCount?['waiting',activeCount+' waiting']:[null,'Ready']));}
 async function poll(){
  if(polling)return;polling=true;
  try{state=await api('/api/workspace');$('agent-state').classList.remove('offline');$('connection-retry').hidden=true;host.connection(true);renderProjects();renderQueue();renderActivity();renderDocumentRequests();const scope=$('activity-project').value;if(JSON.stringify(state.projects.map(item=>item.id))!==$('activity-project').dataset.ids){$('activity-project').dataset.ids=JSON.stringify(state.projects.map(item=>item.id));$('activity-project').replaceChildren(node('option','','All projects'));$('activity-project').firstChild.value='all';for(const item of state.projects){const option=node('option','',item.name);option.value=item.id;$('activity-project').append(option);}$('activity-project').value=state.projects.some(item=>item.id===scope)?scope:'all';}await host.updateWork(state);
   if(project&&!$('work-panel').hidden){await refreshFiles();if(page&&!dirty&&!saving&&!$('document-editor').contains(document.activeElement)&&document.activeElement!==$('document-source')){
    const current=page;const fresh=await api((textFile?'/api/project-file':'/api/document')+'?path='+encodeURIComponent(current.path));if(page!==current||dirty||saving)return;
    if(fresh.revision!==page.revision){page=fresh;fileRevision=fresh.revision;blocks=textFile?[]:parseMarkdown(fresh.markdown);focusedBlock=null;$('document-source').value=textFile?fresh.text:fresh.markdown;renderBlocks();notice('Updated by agent / filesystem');}
    if(!textFile){page.comments=fresh.comments;renderComments();}
   }}
  }catch(e){agentState('caution','Connection interrupted');$('agent-state').classList.add('offline');$('connection-retry').hidden=false;host.connection(false);}finally{polling=false;}
 }
 async function browse(path){const sequence=++browseSequence;$('folder-use').disabled=true;try{const result=await api('/api/directories'+(path?'?path='+encodeURIComponent(path):''));if(sequence!==browseSequence)return;folder=result;$('folder-path').value=folder.path;$('folder-list').replaceChildren();for(const child of folder.directories){const button=node('button','folder-item',child.name);button.prepend(icon('folder'));button.onclick=()=>browse(child.path);$('folder-list').append(button);}$('folder-error').textContent='';}catch(e){if(sequence===browseSequence)$('folder-error').textContent=e.message;}finally{if(sequence===browseSequence)$('folder-use').disabled=false;}}
 async function choose(mode){folderMode=mode;$('folder-dialog-title').textContent=mode==='create'?'New Project':'Make This Folder a Project';$('folder-name').value='';$('folder-path').value='';$('folder-use').textContent=mode==='create'?'Create':'Use This Folder';$('folder-dialog').showModal();await browse();}
 $('new-project').onclick=()=>choose('create');$('add-folder').onclick=()=>choose('register');$('folder-cancel').onclick=()=>$('folder-dialog').close();$('folder-up').onclick=()=>browse(folder.parent);$('folder-go').onclick=()=>browse($('folder-path').value);
 $('folder-use').onclick=async()=>{try{const data=folderMode==='create'?{name:$('folder-name').value,parent:folder.path}:{path:folder.path,name:$('folder-name').value||undefined};const created=await api('/api/projects/'+(folderMode==='create'?'create':'register'),data);$('folder-dialog').close();await poll();await selectProject(created.project);const files=await api('/api/project-files?project='+encodeURIComponent(created.project));const roadmap=files.find(item=>item.name==='ROADMAP.md');if(roadmap)await openFile(roadmap.path);}catch(e){$('folder-error').textContent=e.message;}};
 function openProjectChat(){const item=selectedProject();if(item)host.selectChat(item.chat);}
 $('new-file').onclick=newFile;$('new-task').onclick=newTask;
 // New File… makes any file in the project folder (Markdown unless the name has an extension); New Task… numbers it and links it in ROADMAP.md (harness/documents.py).
 const fileName=value=>/\.[^/.]+$/.test(value)?value:value+'.md',taskStem=value=>value.toLowerCase().replace(/[^\p{L}\p{N}_]+/gu,'-').replace(/^-+|-+$/g,'').slice(0,60);
 const nextTask=()=>String(Math.max(0,...files.map(file=>Number(file.name.match(/^tasks\/(\d+)-/)?.[1]||0)))+1).padStart(3,'0');
 async function createAndOpen(url,body){try{await save();const created=await api(url,body);await refreshFiles();await openFile(created.path);}catch(e){notice(e.message,true);}}
 async function newFile(){if(!project)return;const where=selectedProject().name,name=await askName({title:'New File',label:'File name',describe:value=>value?`Creates “${fileName(value)}” in ${where} and opens it.`:`Markdown unless you add an extension: notes, script.py, docs/plan.md.`});if(name)await createAndOpen('/api/documents/create-file',{project,name});}
 async function newTask(){if(!project)return;const where=selectedProject().name,title=await askName({title:'New Task',label:'Task name',describe:value=>value&&taskStem(value)?`Creates “tasks/${nextTask()}-${taskStem(value)}.md” in ${where}, adds it to ROADMAP.md, and opens it.`:'Numbered after the last task and added to ROADMAP.md.'});if(title)await createAndOpen('/api/documents/create-task',{project,title});}
 $('document-editor').parentElement.addEventListener('click',event=>{if(!page||textFile||$('document-editor').hidden)return;const rows=blockRows(),last=rows.at(-1);if(event.target.closest('.pw-block,.pw-thread'))return;if(last&&event.clientY<last.getBoundingClientRect().bottom)return;const end=blocks.length-1;if(blocks[end]?.type==='text'&&!blocks[end].text.trim()){refocus(end);focusBlock(end);}else addBlock(end);});
 function addBlock(after=blocks.length-1){if(!page||textFile)return;const index=after+1;blocks.splice(index,0,{type:'text',text:'',dirty:true});changed();renderBlocks();refocus(index);focusBlock(index);}
 $('editor-mode').onchange=()=>{if(!page)return;if($('editor-mode').value==='source'){$('document-source').value=serializeMarkdown(blocks);$('document-editor').hidden=true;$('document-source').hidden=false;}else{blocks=parseMarkdown($('document-source').value);$('document-editor').hidden=false;$('document-source').hidden=true;renderBlocks();}};
 $('document-source').oninput=changed;
 async function reloadDocument(){const name=page?.path.split('/').pop();if(page&&(!dirty||await ask({message:`Reload “${name}” from disk?`,detail:'Your unsaved changes in this window will be replaced by the file on disk.',danger:'Reload',safe:'Keep Editing'})==='danger')){const path=page.path;saveDraft(localStorage,path,null);dirty=false;page=null;openFile(path);}}
 $('retry-save').onclick=()=>save().catch(e=>notice(e.message,true));$('discard-draft').onclick=reloadDocument;
 $('download-draft').onclick=()=>{if(!page)return;const url=URL.createObjectURL(new Blob([content()],{type:'text/plain;charset=utf-8'})),link=node('a');link.href=url;link.download=page.path.split('/').pop()+'.draft';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 
 async function trashPage(){if(page&&await ask({icon:'stop',message:`Move “${page.path.split('/').pop()}” to the Trash?`,detail:'Its comments go with it. You can restore it from the data folder’s .trash.',danger:'Move to Trash',safe:'Cancel'})==='danger'){try{await api('/api/documents/delete',{path:page.path});page=null;dirty=false;$('document-editor').replaceChildren();$('document-path').textContent='No document open';host.documentTitle(selectedProject()?.name||'');await refreshFiles();}catch(e){notice(e.message,true);}}}
 $('comment-form').onsubmit=async event=>{event.preventDefault();if(!page||textFile||!commentAnchor)return;$('add-comment').disabled=true;try{await save();const anchor=commentAnchor;await api('/api/documents/comment',{path:page.path,text:$('comment-text').value,anchor});$('comment-text').value='';clearAnchor();await refreshPageComments();renderBlocks();}catch(e){notice(e.message,true);}finally{$('add-comment').disabled=!commentAnchor;}};
 $('document-prompt-form').onsubmit=async event=>{event.preventDefault();if(!project||!page)return;const button=event.currentTarget.querySelector('button');button.disabled=true;try{await save();await api('/api/jobs/create',{project,message:$('document-prompt').value,document:page&&!textFile?page.path:undefined});$('document-prompt').value='';await poll();notice('Document request sent');}catch(e){notice(e.message,true);}finally{button.disabled=false;}};
 function clearAnchor(){commentAnchor='';$('selected-passage').hidden=true;$('selection-bar').hidden=true;$('add-comment').disabled=true;}
 function attachSelection(text){commentAnchor=text;$('comment-anchor').textContent=text;$('selected-passage').hidden=false;$('add-comment').disabled=false;}
 $('clear-anchor').onclick=clearAnchor;$('selection-bar-comment').onclick=commentSelection;$('selection-bar-ask').onclick=()=>askAbout(commentAnchor);$('selection-bar').onpointerdown=event=>event.preventDefault();
 document.addEventListener('selectionchange',()=>{const selection=window.getSelection();if(!selection||selection.isCollapsed){$('selection-bar').hidden=true;return;}const a=selection.anchorNode,b=selection.focusNode;if(!$('document-editor').contains(a)||!$('document-editor').contains(b)||!selection.toString().trim())return;attachSelection(selection.toString().trim());
  const box=selection.getRangeAt(0).getBoundingClientRect(),bar=$('selection-bar');bar.hidden=false;bar.style.left=Math.max(4,Math.min(box.left,innerWidth-bar.offsetWidth-4))+'px';bar.style.top=Math.min(box.bottom+6,innerHeight-bar.offsetHeight-4)+'px';});
 window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
 $('work-tab').onclick=()=>host.showWorkspace();
 setInterval(()=>{if(!document.hidden)poll();},1800);
 return {refresh:poll,openProjectChat,reloadDocument,trashPage,addBlock,openJob(id){host.showActivity();$('activity-filter').value='all';$('activity-project').value='all';selectJob(id);document.getElementById('job-'+id)?.scrollIntoView({block:'center'});},async start(){await poll();if(state.projects.length){const query=new URLSearchParams(location.search),documentPath=query.get('document'),chatId=query.get('chat');const chosen=state.projects.find(item=>item.id===documentPath?.split('/')[1]||item.chat===chatId)||state.projects.find(item=>item.id===navigation.project)||state.projects[0];await selectProject(chosen.id);if(documentPath){await openFile(documentPath);host.showWorkspace();}else if(chatId)await host.selectChat(chosen.chat);else host.restoreView(navigation.view||'work');}},async selectChatProject(id){const item=state.projects.find(item=>item.chat===id);if(item){const switched=project!==item.id;project=item.id;$('active-project-label').textContent=item.name;$('project-title').textContent=item.name;$('project-folder').textContent=item.path;if(switched){page=null;dirty=false;await refreshFiles();const target=readState('navigation',{}).files?.[project]||files.find(file=>file.name==='ROADMAP.md')?.path;if(target)await openFile(target);}renderProjects();remember();}},moveBlock:delta=>moveBlock(focusedBlock,delta),showRecord:()=>{if(selectedJob)showRecord(selectedJob);},commentSelection,askSelection:()=>askAbout(commentAnchor),stepComment,toggleResolved:()=>$('show-resolved').click(),save,saveNow:()=>save().catch(e=>notice(e.message,true)),selectProject,status:()=>({project,projects:state.projects,jobs:state.jobs,page:page?.path||null,focusedBlock,selectedJob,anchor:Boolean(commentAnchor),comments:(page?.comments||[]).some(comment=>!comment.deleted),textFile,dirty,offline:!$('connection-retry').hidden})};
}
