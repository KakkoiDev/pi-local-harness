import { saveDraft,loadDraft } from './drafts.mjs';
import { icon,stateGlyph,toolCard,segmentFor,readState,writeState,imeEnter } from './ui.mjs';import { ask,askName } from './dialogs.mjs';import { dictateButton } from './dictation.mjs';import { installPopup } from './menubar.mjs';
import { parseMarkdown,serializeMarkdown } from './markdown-blocks.mjs';import { spoken } from './message-markdown.mjs';import { installFilesWindow } from './files-window.mjs';
export function installWorkspace(host){
 const $=id=>document.getElementById(id),{api,node,error}=host;
 let state={projects:[],jobs:[]},project=null,page=null,blocks=[],focusedBlock=null,selectedJob=null,commentFilter='open',openThread=null,currentComment=null,showResolved=readState('showResolved',false),dirty=false,saving=null,saveTimer,folderMode='register',folder=null,fileRevision='',textFile=false,commentAnchor='',browseSequence=0,fileSequence=0;
 const agentState=(glyph,text)=>$('agent-state').replaceChildren(...(glyph?[icon(glyph)]:[]),text);
 const notice=(text,failed=false)=>{$('save-status').textContent=text;$('save-status').classList.toggle('failed',failed);if(failed&&dirty){$('save-recovery-message').textContent=text;$('save-recovery').hidden=false;}};
 const navigation=readState('navigation',{});let files=[];const replyDrafts=new Map();const signatures={};const unchanged=(key,value)=>{const signature=JSON.stringify(value);if(signatures[key]===signature)return true;signatures[key]=signature;return false;};
 const remember=()=>writeState('navigation',{...readState('navigation',{}),project,files:{...readState('navigation',{}).files,...(page?.path?{[project]:page.path}:{})}});
 const selectedProject=()=>state.projects.find(item=>item.id===project);
 function changed(){dirty=true;if(page&&!saveDraft(localStorage,page.path,content(),fileRevision))notice('Unsaved · draft only in this tab (browser storage is unavailable)',true);else notice('Unsaved');clearTimeout(saveTimer);saveTimer=setTimeout(()=>save().catch(e=>notice(e.message,true)),700);}
 function content(){return $('editor-mode').value==='source'||textFile?$('document-source').value:serializeMarkdown(blocks);}
 // One save at a time: later callers wait for the running one (and any newer one), then save what is still unsaved, so two
 // saves never race with the same revision (that raised a false "changed on disk"). A text file keeps its revision too.
 async function save(){
  clearTimeout(saveTimer);while(saving)await saving.catch(()=>{});if(!dirty||!page)return;
  const current=page,markdown=content();
  const run=(async()=>{notice('Saving…');const saved=await api('/api/documents/'+(textFile?'save-file':'save'),textFile?{path:current.path,text:markdown,revision:fileRevision}:{path:current.path,markdown,revision:current.revision});
   if(page===current){fileRevision=saved.revision;if(textFile)page.revision=saved.revision;else page=saved;dirty=content()!==markdown;notice(dirty?'Unsaved':'Saved');if(dirty)changed();else{saveDraft(localStorage,current.path,null);$('save-recovery').hidden=true;}}
  })();
  saving=run;try{await run;}finally{if(saving===run)saving=null;}if(dirty&&page===current)await save();
 }
 // Notion-style keys: Return splits the block (lists continue, an empty list item becomes a paragraph); Backspace in an empty block removes it.
 function caretOffset(element){const selection=getSelection();if(!selection.rangeCount||!element.contains(selection.anchorNode))return element.innerText.length;const range=document.createRange();range.selectNodeContents(element);range.setEnd(selection.anchorNode,selection.anchorOffset);return range.toString().length;}
 function caretToEnd(index){const element=blockRows()[index]?.querySelector('[contenteditable]');if(!element)return;element.focus();const range=document.createRange();range.selectNodeContents(element);range.collapse(false);const selection=getSelection();selection.removeAllRanges();selection.addRange(range);}
 function blockKey(event,index,element){const block=blocks[index];if(imeEnter(event)||!block)return;
  if(event.key==='Enter'&&!event.shiftKey&&!['code','raw'].includes(block.type)){event.preventDefault();const list=['bullet','number','check'].includes(block.type);
   if(list&&!element.innerText.trim()){setType(index,'text');return;}
   const at=caretOffset(element),value=element.innerText;block.text=value.slice(0,at);block.dirty=true;blocks.splice(index+1,0,{type:list?block.type:'text',text:value.slice(at),checked:false,level:block.level,dirty:true});changed();renderBlocks();refocus(index+1);focusBlock(index+1);}
  else if(event.key==='Backspace'&&!element.innerText.length&&blocks.length>1){event.preventDefault();blocks.splice(index,1);changed();renderBlocks();caretToEnd(Math.max(0,index-1));focusBlock(Math.max(0,index-1));}}
 const blockRows=()=>[...$('document-editor').querySelectorAll(':scope>.pw-block')];
 function focusBlock(index){focusedBlock=index;blockRows().forEach((row,position)=>row.classList.toggle('pw-block--focused',position===index));$('block-style').value=blocks[index]?.type||'text';$('tool-bullet').setAttribute('aria-pressed',String(blocks[index]?.type==='bullet'));$('tool-check').setAttribute('aria-pressed',String(blocks[index]?.type==='check'));$('phone-block-style').value=$('block-style').value;$('phone-tool-check').setAttribute('aria-pressed',String(blocks[index]?.type==='check'));editBar();}
 // PhoneEdit1: the bottom edit bar shows while a block is being edited on the phone.
 function editBar(){const editing=focusedBlock!==null&&($('document-editor').contains(document.activeElement)||$('phone-edit-bar').contains(document.activeElement));$('phone-edit-bar').hidden=!editing;}
 $('document-editor').addEventListener('focusout',()=>setTimeout(editBar,0));$('phone-edit-bar').addEventListener('focusout',()=>setTimeout(editBar,0));
 $('phone-block-style').onchange=()=>{if(focusedBlock!==null)setType(focusedBlock,$('phone-block-style').value);};
 $('phone-tool-check').onpointerdown=event=>event.preventDefault();$('phone-tool-check').onclick=()=>{if(focusedBlock!==null)setType(focusedBlock,blocks[focusedBlock]?.type==='check'?'text':'check');};
 $('phone-edit-done').onclick=()=>{document.activeElement?.blur();$('phone-edit-bar').hidden=true;};
 function refocus(index){focusedBlock=index;blockRows()[index]?.querySelector('[contenteditable]')?.focus();}
 function setType(index,type){const block=blocks[index];if(!block)return;block.type=type;block.level=block.level||2;block.dirty=true;changed();renderBlocks();refocus(index);}
 function moveBlock(index,delta){const target=index+delta;if(index===null||target<0||target>=blocks.length)return;[blocks[index],blocks[target]]=[blocks[target],blocks[index]];blocks[index].dirty=blocks[target].dirty=true;changed();renderBlocks();refocus(target);}
 function reviewPassage(text){if(document.body.dataset.review==='closed')$('toggle-review').click();if(matchMedia('(max-width:760px)').matches&&!$('comments-panel').classList.contains('is-sheet'))$('phone-comments').click();attachSelection(text);}/* Comment and Ask Pi on a phone: the Comments sheet */
 function commentSelection(){if(!commentAnchor)return;reviewPassage(commentAnchor);$('selection-bar').hidden=true;$('comment-text').focus();}
 // Ask Pi… on a selection: the question box lives folded in Review (task 108), so show Review (the Comments sheet on a phone),
 // unfold the box, quote the passage and put the cursor after it. Before, the folded box took the text and nothing showed.
 function askAbout(text){reviewPassage(text);$('selection-bar').hidden=true;
  $('document-discussion').open=true;const box=$('document-prompt');box.value=`About “${text.slice(0,120)}”: `;box.scrollIntoView({block:'nearest'});box.focus();box.setSelectionRange(box.value.length,box.value.length);}
 const NOUN={text:'Paragraph',heading:'Heading',check:'Task',bullet:'Bullet',number:'Number',quote:'Quote',code:'Code',raw:'Raw Markdown'};/* the type names the menus use (DocumentBlock card) */
 function deleteBlock(index){const [removed]=blocks.splice(index,1);if(!removed)return;const origin=page?.path;changed();renderBlocks();refocus(Math.max(0,Math.min(index,blocks.length-1)));host.toast(NOUN[removed.type]+' deleted.',()=>{if(page?.path!==origin){notice('Undo applies to the document the block was deleted from.',true);return;}/* never into another document */blocks.splice(index,0,{...removed,dirty:true});changed();renderBlocks();refocus(index);});}
 const blockPopup=installPopup($('block-menu'),item=>{const index=focusedBlock,block=blocks[index];if(!block)return;if(item.dataset.action==='add')addBlock(index);else if(item.dataset.type)setType(index,item.dataset.type);else if(item.dataset.action==='up')moveBlock(index,-1);else if(item.dataset.action==='down')moveBlock(index,1);else if(item.dataset.action==='delete')deleteBlock(index);else if(item.dataset.action==='comment'){attachSelection(block.text.trim());commentSelection();}else if(item.dataset.action==='ask')askAbout(block.text.trim());},()=>{const type=blocks[focusedBlock]?.type,noun=NOUN[type]||'Block';for(const item of $('block-menu').querySelectorAll('[data-type]'))item.setAttribute('aria-checked',String(item.dataset.type===type));
  for(const [action,label] of [['comment','Comment on '+noun],['ask','Ask Pi About '+noun+'…'],['delete','Delete '+noun]])$('block-menu').querySelector(`[data-action="${action}"]`).textContent=label;$('block-menu-title').textContent=noun;});
 $('block-menu').querySelector('[data-action="cancel"]').onclick=()=>blockPopup.close(true);
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
 const stateLine=comment=>comment.deleted?'Deleted':comment.resolved?'Resolved':failedComment(comment)?'Pi could not answer':sent(comment)?(pendingReplies(comment)?'Reply not sent to Pi':'Sent to Pi'):'Not sent to Pi';
 function orderedComments(){const text=page?.markdown||'',at=comment=>{const found=text.indexOf(comment.anchor);return found<0?Infinity:found;};return (page?.comments||[]).map((comment,index)=>({comment,index,at:at(comment)})).sort((a,b)=>a.at-b.at||a.index-b.index).map(item=>item.comment);}
 function numbers(){const result=new Map();orderedComments().filter(comment=>!comment.deleted).forEach((comment,index)=>result.set(comment.id,index+1));return result;}
 async function commentAction(url,body,after){try{await api(url,{path:page?.path,...body});if(!body.path||body.path===page?.path)await refreshPageComments();after?.();}catch(e){notice(e.message,true);}}
 async function applySuggestion(comment){try{await save();const path=page.path;await api('/api/documents/apply-suggestion',{path,id:comment.id,revision:fileRevision});saveDraft(localStorage,path,null);dirty=false;page=null;await openFile(path);host.toast('Change applied');}catch(e){notice(e.message,true);}}
 function deleteComment(comment){if(openThread===comment.id)openThread=null;const path=page.path;commentAction('/api/documents/delete-comment',{path,id:comment.id,deleted:true},()=>host.toast('Comment deleted. It’s kept under Deleted in Review.',()=>commentAction('/api/documents/delete-comment',{path,id:comment.id,deleted:false})));}
 async function askPi(comment,button){if(button)button.disabled=true;try{await save();await api('/api/jobs/create',{project,message:'Comment: '+comment.text,document_comment:{path:page.path,id:comment.id}});await poll();await refreshPageComments();notice('Comment sent to Pi');return true;}catch(e){notice(e.message,true);if(button)button.disabled=false;return false;}}
 // A thread is unsent when it never went to Pi, or when you wrote in it after its last request and nothing is queued for it.
 const busyComment=comment=>state.jobs.some(job=>job.comment_id===comment.id&&['queued','running'].includes(job.status));
 // Sent = it reached Pi (chat_id, set when the job starts) or waits in Pi's queue: a waiting comment must not be sent twice or deleted.
 const sent=comment=>Boolean(comment.chat_id)||busyComment(comment);
 // Its last request failed, stopped or was interrupted: Pi did not answer it, so it can be asked again.
 const failedComment=comment=>['failed','stopped','interrupted'].includes(state.jobs.filter(job=>job.comment_id===comment.id).at(-1)?.status);
 const pendingReplies=comment=>Boolean(comment.chat_id)&&!busyComment(comment)&&(comment.replies||[]).some(reply=>reply.author!=='pi'&&(reply.created||'')>(comment.sent_at||''));
 const unsent=()=>orderedComments().filter(comment=>commentState(comment)==='open'&&(!sent(comment)||pendingReplies(comment)||failedComment(comment)));
 $('send-unsent').onclick=async()=>{$('send-unsent').disabled=true;for(const comment of unsent())if(!await askPi(comment))break;delete signatures.comments;renderComments();};
 // Choosing a comment in Review opens its thread under the passage and brings it into view with focus (the person: clicking a comment did not show it).
 function showThread(id,{reveal=false}={}){const comment=page?.comments.find(item=>item.id===id);if(!comment)return;currentComment=id;openThread=comment.deleted?null:id;renderBlocks();renderComments();
  if(reveal&&openThread){const box=document.querySelector('#document-editor .pw-thread');if(box){box.tabIndex=-1;box.scrollIntoView({block:'center'});box.focus({preventScroll:true});}}}
 function stepComment(delta){if(commentFilter==='deleted'){commentFilter='open';renderComments();}const list=orderedComments().filter(comment=>commentState(comment)===commentFilter);if(!list.length)return;const index=list.findIndex(comment=>comment.id===currentComment),next=list[index<0?(delta>0?0:list.length-1):(index+delta+list.length)%list.length];showThread(next.id);document.getElementById('comment-'+next.id)?.scrollIntoView({block:'nearest'});}
 function button(label,onclick,className='pw-btn'){const item=node('button',className,label);item.type='button';item.onclick=onclick;return item;}
 function replyForm(comment){const form=node('form','pw-thread__actions'),reply=node('input','pw-field');reply.placeholder='Reply…';reply.setAttribute('aria-label','Reply to text comment');reply.maxLength=10000;reply.required=true;reply.dataset.thread=comment.id;reply.value=replyDrafts.get(comment.id)||'';reply.oninput=()=>replyDrafts.set(comment.id,reply.value);
  // InlineThread round 4: Add Note keeps what you typed with the file (Pi does not see it); Ask Pi sends the thread with it,
  // and is the default button once there is text. Replaces Reply, which read as if it reached Pi.
  const submit=node('button','pw-btn','Add Note');form.append(reply,dictateButton(reply,{api,report:message=>notice(message,true)}),submit);/* voice input in comments */
  form.onsubmit=async event=>{event.preventDefault();submit.disabled=true;try{await api('/api/documents/reply',{path:page.path,id:comment.id,text:reply.value||replyDrafts.get(comment.id)||''});replyDrafts.delete(comment.id);await refreshPageComments();}catch(e){notice(e.message,true);}finally{submit.disabled=false;}};return form;}
 function thread(comment){const box=node('div','pw-thread'+(comment.resolved?' pw-thread--resolved':''));box.setAttribute('role','group');box.setAttribute('aria-label','Comment thread');
  const message=(who,time,text)=>{const row=node('div','pw-thread__msg'),label=node('span','pw-thread__who');label.append(node('b','',who),time?' '+time:'');row.append(label,node('p','',text));return row;};
  box.append(message('You',when(comment.created),comment.text));for(const reply of comment.replies||[])box.append(reply.author==='pi'?message('Pi',when(reply.created),spoken(reply.text)):message('You',when(reply.created),reply.text)); // one conversation, in order (task 135)
  const suggestion=comment.suggestion;
  if(suggestion?.applied)box.append(node('p','pw-thread__note','Pi’s suggested change was applied.'));else if(suggestion?.kept)box.append(node('p','pw-thread__note','Pi suggested a rewrite. You kept your text.'));
  else if(suggestion&&!comment.resolved){const change=node('div','pw-suggest');change.setAttribute('aria-label','Suggested change');change.append(node('del','',suggestion.anchor),node('ins','',suggestion.replacement));const choices=node('div','pw-suggest__actions');choices.append(button('Keep Mine',()=>commentAction('/api/documents/keep-suggestion',{id:comment.id})),button('Apply Change',()=>applySuggestion(comment),'pw-btn pw-btn--default'));change.append(choices);box.append(change);}
  // Final board: a note line, then the actions; Delete sits apart at the end.
  if(comment.resolved){const actions=node('div','pw-thread__actions');actions.append(node('span','pw-thread__state','Resolved'),button('Reopen',()=>commentAction('/api/documents/resolve',{id:comment.id,resolved:false})));box.append(actions);return box;}
  const actions=replyForm(comment),line=node('span','pw-thread__state');actions.prepend(line);
  // InlineThread states; Ask Pi stays after an answer: it sends the whole thread again (a follow-up), with what is typed in the reply field.
  const jobs=state.jobs.filter(job=>job.comment_id===comment.id),job=jobs.at(-1),busy=['queued','running'].includes(job?.status),answers=(comment.replies||[]).filter(reply=>reply.author==='pi');
  if(sent(comment)){if(job?.status==='running'){line.append(icon('running'),'Pi is working on it');}else if(job?.status==='queued'){line.append(icon('waiting'),'Sent to Pi · waiting in queue · '+(answers.length?'follow-up':'can no longer be deleted'));}else if(['failed','stopped','interrupted'].includes(job?.status)){line.append(icon('caution'),'Pi could not answer · '+job.status);}else if(pendingReplies(comment)){line.append(icon('note'),'Reply saved · not sent to Pi');}else{const last=answers.at(-1);line.append(icon('done'),'Pi answered'+(last?.created?' · '+new Date(last.created).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):'')+' · can no longer be deleted');}}
  else line.textContent='Saved with the file · not sent to Pi';
  if(!busy){const ask=button('Ask Pi',async()=>{const field=actions.querySelector('input'),text=field.value.trim();ask.disabled=true;try{if(text){await api('/api/documents/reply',{path:page.path,id:comment.id,text});replyDrafts.delete(comment.id);field.value='';}}catch(e){notice(e.message,true);ask.disabled=false;return;}await askPi(comment,ask);});actions.append(ask);const field=actions.querySelector('input'),mark=()=>ask.classList.toggle('pw-btn--default',Boolean(field.value.trim()));field.addEventListener('input',mark);mark();}
  actions.append(button('Resolve',()=>commentAction('/api/documents/resolve',{id:comment.id,resolved:true})));
  if(!sent(comment))actions.append(node('span','pw-thread__gap'),button('Delete',()=>deleteComment(comment)));
  if(busy&&job){const show=node('a','pw-link','Show in Activity');show.href='/activity';show.onclick=event=>{event.preventDefault();openJob(job.id);};actions.append(show);}/* a sent, unanswered thread (InlineThread card) */
  if(!busy)actions.append(node('p','pw-help pw-thread__help','Add Note keeps your reply with the file. Ask Pi sends the thread with what you typed.'));/* inside the actions, only while Ask Pi is offered */
  box.append(actions);return box;}
 function renderComments(){
  if(unchanged('comments',[page?.path,page?.revision,page?.comments,commentFilter,currentComment,openThread,showResolved,state.jobs.filter(job=>job.comment_id).map(job=>[job.comment_id,job.status])]))return;if(!document.activeElement?.isContentEditable)renderBlocks();
  const list=orderedComments(),numbered=numbers(),counts={open:0,resolved:0,deleted:0};for(const comment of list)counts[commentState(comment)]++;
  $('comment-count').textContent=counts.open;const waiting=unsent().length;$('send-unsent').disabled=!waiting;$('send-unsent').textContent=waiting?`Send ${waiting} Unsent Comment${waiting>1?'s':''} to Pi`:'No unsent comments';
  for(const item of $('comment-filter').querySelectorAll('[data-filter]')){const filter=item.dataset.filter;item.textContent={open:'Open',resolved:'Resolved',deleted:'Deleted'}[filter]+' '+counts[filter];item.setAttribute('aria-checked',String(filter===commentFilter));item.tabIndex=filter===commentFilter?0:-1;}
  $('document-comments').replaceChildren();const shown=list.filter(comment=>commentState(comment)===commentFilter);
  if(page&&!shown.length)$('document-comments').append(node('p','list-empty pw-empty',{open:'No open comments.',resolved:'Nothing resolved yet.',deleted:'No deleted comments.'}[commentFilter]));
  for(const comment of shown){
   const item=node('div','pw-review-item');item.id='comment-'+comment.id;if(comment.id===currentComment)item.setAttribute('aria-current','true');
   const head=node('button','pw-review-item__head');head.type='button';head.append(node('span','',(numbered.has(comment.id)?numbered.get(comment.id)+' · ':'')+stateLine(comment)),node('span','',when(comment.created)));head.onclick=()=>showThread(comment.id,{reveal:true});item.onclick=event=>{if(!event.target.closest('button,a,input,textarea'))showThread(comment.id,{reveal:true});};
   item.append(head,node('p','pw-review-item__quote','“'+comment.anchor+'”'));
   if(page.markdown&&!page.markdown.includes(comment.anchor))item.append(node('p','pw-help','Passage changed on disk; this thread keeps the original quote.'));
   item.append(node('p','pw-review-item__text',comment.text));
   const actions=node('div','pw-review-item__actions'),state=commentState(comment);
   if(state==='open'&&(!sent(comment)||failedComment(comment))){const ask=button('Ask Pi',()=>askPi(comment,ask));actions.append(ask);}
   if(state==='open')actions.append(button('Resolve',()=>commentAction('/api/documents/resolve',{id:comment.id,resolved:true})));
   if(state==='open'&&!sent(comment))actions.append(button('Delete',()=>deleteComment(comment)));
   if(state==='resolved')actions.append(button('Reopen',()=>commentAction('/api/documents/resolve',{id:comment.id,resolved:false})));
   if(state==='deleted')actions.append(button('Restore',()=>commentAction('/api/documents/delete-comment',{id:comment.id,deleted:false})));
   item.append(actions);$('document-comments').append(item);
  }
 }
 $('comment-filter').onclick=event=>{const item=event.target.closest('[data-filter]');if(item){commentFilter=item.dataset.filter;renderComments();}};
 $('comment-filter').onkeydown=event=>{const step={ArrowLeft:-1,ArrowUp:-1,ArrowRight:1,ArrowDown:1}[event.key];if(!step)return;event.preventDefault();const order=['open','resolved','deleted'];commentFilter=order[(order.indexOf(commentFilter)+step+order.length)%order.length];renderComments();$('comment-filter').querySelector('[aria-checked="true"]')?.focus();};/* a radio group: arrows choose */
 $('show-resolved').checked=showResolved;$('show-resolved').onchange=()=>{showResolved=$('show-resolved').checked;writeState('showResolved',showResolved);renderBlocks();renderComments();};
 function renderDocumentRequests(){
  if(unchanged('requests',[page?.path,state.jobs.filter(job=>job.document===page?.path&&!job.comment_id)]))return;$('document-request-history').hidden=true;$('document-requests').replaceChildren();if(!page)return;
  const jobs=state.jobs.filter(job=>job.document===page.path&&!job.comment_id).slice(-5);$('document-request-history').hidden=!jobs.length;$('document-request-summary').textContent=jobs.length+' recent document '+(jobs.length===1?'request':'requests');
  for(const job of jobs){const thread=node('article','document-request');thread.append(node('p','',job.message),node('small','',job.status));if(job.text)thread.append(node('p','agent-reply',spoken(job.text)));const open=node('a','pw-link','Show in Activity');open.href='/activity';open.onclick=event=>{event.preventDefault();openJob(job.id);};thread.append(open);/* F4 card: one way into Activity, filters cleared */$('document-requests').append(thread);}
 }
 function highlightComments(text,block){
  const numbered=numbers(),matches=(page?.comments||[]).filter(comment=>!comment.deleted&&(!comment.resolved||showResolved||comment.id===openThread)&&comment.anchor&&block.text.includes(comment.anchor)).map(comment=>({comment,at:block.text.indexOf(comment.anchor)})).sort((a,b)=>a.at-b.at);
  if(!matches.length)return;text.replaceChildren();let cursor=0;
  for(const {comment,at} of matches){if(at<cursor)continue;text.append(document.createTextNode(block.text.slice(cursor,at)));
   const anchor=node('span','pw-anchor'+(comment.resolved?' pw-anchor--resolved':sent(comment)?' pw-anchor--sent':''),comment.anchor);anchor.dataset.comment=comment.id;
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
  if(job.status==='failed'){const line=node('div','pw-alert-line');line.append(icon('failed'),job.progress);detail.append(line);}/* C_ActivityDesk error line */
  if(job.tools?.length){const tools=node('section','activity-detail__tools');tools.setAttribute('aria-label','Commands');tools.append(node('h4','pw-label','Commands'));for(const tool of job.tools)tools.append(toolCard(tool,{showEvent:host.showGateEvent}));detail.append(tools);}
  if(job.text){const result=node('details');result.append(node('summary','pw-label','Result'),node('pre','pw-mono',spoken(job.text)));detail.append(result);}
  // C_ActivityDesk: one button opens the request where it came from (task 128).
  const actions=node('div','activity-detail__actions'),name=state.projects.find(project=>project.id===job.project)?.name||job.project,open=node('a','pw-btn','Open in '+name);open.href=job.document?'/p/'+job.project+'/work/'+job.document.split('/').slice(2).join('/'):'/p/'+job.project+'/chat';open.onclick=async event=>{event.preventDefault();await goToProject(job.project,job.document?'work':'chat',job.document);if(job.comment_id)document.getElementById('comment-'+job.comment_id)?.scrollIntoView({block:'center'});};actions.append(open);
  if(job.status==='running'){const stop=node('button','pw-btn','Stop');stop.type='button';stop.onclick=()=>api(`/api/conversations/${job.chat}/stop`,{}).catch(e=>error(e.message));actions.append(stop);}
  if(job.status==='queued'){const cancel=node('button','pw-btn','Cancel…');cancel.type='button';cancel.onclick=async()=>{if(await ask({message:'Cancel the waiting request?',detail:'It has not started. You can send it again from the chat.',danger:'Cancel Request',safe:'Keep Waiting'})!=='danger')return;try{await api('/api/jobs/cancel',{id:job.id});await poll();}catch(e){error(e.message);}};actions.append(cancel);}
  const record=node('button','pw-btn','Show Task Record');record.type='button';record.onclick=()=>showRecord(job.id);actions.append(record);detail.append(actions);
 }
 function renderActivity(){
  const filter=$('activity-filter').value,scope=$('activity-project').value;syncActivitySeg();if(unchanged('activity',[filter,scope,state.projects,state.jobs,selectedJob,state.jobs.some(job=>job.status==='running')&&Math.floor(Date.now()/10000)]))return;/* a running time keeps moving */
  const inScope=state.jobs.filter(job=>scope==='all'||job.project===scope),counts={pending:inScope.filter(job=>['running','queued'].includes(job.status)).length,attention:inScope.filter(needsAttention).length};
  for(const radio of $('activity-seg').querySelectorAll('[data-value="pending"],[data-value="attention"]'))radio.textContent=(radio.dataset.value==='pending'?'Active':'Attention')+(counts[radio.dataset.value]?' '+counts[radio.dataset.value]:'');
  const visible=state.jobs.filter(job=>(scope==='all'||job.project===scope)&&(filter==='all'||filter==='pending'&&['running','queued'].includes(job.status)||filter==='completed'&&job.status==='completed'||filter==='attention'&&needsAttention(job)));
  const ordered=visible.slice().sort((a,b)=>{const ranks={running:0,queued:1};return (ranks[a.status]??2)-(ranks[b.status]??2)||(['queued','running'].includes(a.status)?a.order-b.order:b.order-a.order);});
  if(!ordered.some(job=>job.id===selectedJob))selectedJob=ordered[0]?.id||null;
  const list=$('activity-list'),focused=list.contains(document.activeElement),head=node('div','pw-table__row pw-table__head');head.setAttribute('role','row');for(const label of ['State','Request','Project','Source','Started','Time']){const cell=node('span','',label);cell.setAttribute('role','columnheader');head.append(cell);}list.replaceChildren(head);
  if(!ordered.length){if(!state.jobs.length||filter==='pending'){const empty=node('div','activity-empty');empty.append(node('h3','pw-label','All caught up'),node('p','pw-help','Requests from every project, its comments and whole-file questions wait here in one queue. Terminal Pi runs directly and shows in Gate.')/* C_ActivityDesk */);list.append(empty);}else list.append(node('p','list-empty pw-empty','No tasks match these filters.'));}
  for(const job of ordered){const item=state.projects.find(project=>project.id===job.project),row=node('div','activity-task pw-table__row');row.id='job-'+job.id;row.setAttribute('role','row');/* C_ActivityDesk: a row, not a link, so the project name can be one */row.tabIndex=job.id===selectedJob?0:-1;if(job.id===selectedJob)row.setAttribute('aria-current','true');
   const glyph=stateGlyph(job.status);glyph.classList.add('task-state',job.status);
   const link=node('a','pw-link',item?.name||job.project);link.href='/p/'+job.project+'/chat';link.onclick=event=>{event.preventDefault();event.stopPropagation();goToProject(job.project,'chat');};const where=node('span');where.append(link);
   row.append(glyph,node('span','pw-table__cell--text activity-request',job.message||'Attached files'),where,node('span','',job.comment_id?'Comment · '+job.document.split('/').pop().replace(/\.md$/,'').slice(0,12)+'…':job.document?job.document.split('/').pop():'Chat'),node('span','',job.status==='queued'?'queued '+clock(job.created):clock(job.started||job.created)),node('span','',duration(job)));
   row.onclick=event=>{event.preventDefault();selectJob(job.id);host.jobOpened();};row.onpointerdown=()=>{row.dataset.pointer='1';};row.onfocus=()=>{if(!row.dataset.pointer&&selectedJob!==job.id)selectJob(job.id);};for(const cell of row.children)cell.setAttribute('role','gridcell');list.append(row);
  }
  if(focused)list.querySelector('[aria-current="true"]')?.focus();
  renderJobDetail(ordered.find(job=>job.id===selectedJob));
  const running=state.jobs.filter(job=>job.status==='running').length,waiting=state.jobs.filter(job=>job.status==='queued').length,attention=state.jobs.filter(needsAttention).length;
  const parts=[running&&running+' running',waiting&&waiting+' waiting'].filter(Boolean);if(!parts.length)parts.push('Nothing running or waiting');if(attention)parts.push(attention+(attention===1?' needs':' need')+' attention');
  const breakdown=['failed','interrupted','stopped'].map(kind=>[kind,state.jobs.filter(job=>job.status===kind).length]).filter(([,n])=>n);$('activity-summary').textContent=filter==='attention'&&attention?`${attention} ${attention===1?'needs':'need'} attention: `+breakdown.map(([kind,n])=>n+' '+kind).join(', '):parts.join(' · ');
 }
 $('activity-list').onkeydown=event=>{if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return;const rows=[...$('activity-list').querySelectorAll('.activity-task')];if(!rows.length)return;event.preventDefault();const index=rows.findIndex(row=>row.getAttribute('aria-current')==='true'),next=event.key==='Home'?0:event.key==='End'?rows.length-1:Math.max(0,Math.min(rows.length-1,index+(event.key==='ArrowDown'?1:-1)));selectJob(rows[next].id.slice(4));$('activity-list').querySelector('[aria-current="true"]')?.focus();};
 $('activity-filter').onchange=$('activity-project').onchange=renderActivity;const syncActivitySeg=segmentFor($('activity-seg'),$('activity-filter'));
 async function refreshPageComments(){if(page&&!textFile){const current=page;const fresh=await api('/api/document?path='+encodeURIComponent(current.path));if(page!==current)return;page.comments=fresh.comments;renderComments();}}
 async function openFile(path){
  if(page?.path===path&&!dirty){host.documentOpened();return;}const sequence=++fileSequence;
  try{await save();if(sequence!==fileSequence)return;textFile=!path.toLowerCase().endsWith('.md');
   const value=await api((textFile?'/api/project-file':'/api/document')+'?path='+encodeURIComponent(path));if(sequence!==fileSequence)return;page=value;dirty=false;commentAnchor='';focusedBlock=null;openThread=currentComment=null;
   fileRevision=value.revision;$('document-source').value=textFile?value.text:value.markdown;blocks=textFile?[]:parseMarkdown(value.markdown);
   $('document-prompt').disabled=false;$('comment-text').disabled=false;$('document-source').disabled=false;$('editor-mode').value=textFile?'source':'blocks';$('editor-mode').disabled=textFile;$('block-style').disabled=textFile;$('tool-bullet').disabled=$('tool-check').disabled=textFile;$('toggle-review').disabled=textFile;/* a code file has no Review */
   $('document-editor').hidden=textFile;$('document-source').hidden=!textFile;$('comments-panel').hidden=textFile;
   const restored=loadDraft(localStorage,path,value.revision);$('save-recovery').hidden=true;if(restored){dirty=true;$('document-source').value=restored.text;blocks=textFile?[]:parseMarkdown(restored.text);focusedBlock=null;openThread=currentComment=null;notice(restored.conflict?'Your saved draft differs from the file on disk. Download it before reloading.':'Restored your unsaved draft',restored.conflict);if(!restored.conflict)changed();}
   renderBlocks();renderComments();renderDocumentRequests();$('document-discussion').hidden=textFile;clearAnchor();host.documentOpened();if(!restored)notice(textFile?'Live text/code file':'Saved');$('document-toolbar').dataset.path=path;$('document-path').textContent=path.split('/').slice(2).join('/');host.documentTitle(path.split('/').pop());renderFiles();remember();
  }catch(e){notice(e.message,true);}
 }
 async function selectProject(id,{view}={}){
  try{await save();fileSequence++;project=id;const item=selectedProject();
   $('project-title').textContent=item.name;$('files-title').textContent=item.name;$('project-folder').textContent=item.path;$('file-search').value='';filesWindow.search('');
   resetDocument();
   await host.selectChat(item.chat,false);if(view)host.showView(view);await refreshFiles();renderProjects();renderQueue();remember();const target=readState('navigation',{}).files?.[id]||files.find(file=>file.name==='ROADMAP.md')?.path;if(target&&files.some(file=>file.path===target))await openFile(target);
  }catch(e){notice(e.message,true);}
 }
 // Agent summary over every project (task 130): attention is a failed, stopped or interrupted request since Activity was last opened.
 const ATTENTION=['failed','stopped','interrupted'];
 function agentSummary(){const seen=new Set(readState('activitySeen',[])),jobs=state.jobs||[];const attention=jobs.filter(job=>ATTENTION.includes(job.status)&&!seen.has(job.id));
  return {running:jobs.filter(job=>job.status==='running').length,waiting:jobs.filter(job=>job.status==='queued').length,attention,any:jobs.length>0,gate:state.gate||{today:0,blocked_today:0}};}
 function markActivitySeen(){writeState('activitySeen',(state.jobs||[]).filter(job=>ATTENTION.includes(job.status)).map(job=>job.id));renderProjects();host.agentChanged?.();}
 const plural=(n,word)=>n+' '+word+(n===1?'':'s');
 // A registered folder that is gone (unplugged drive, renamed): offer to remove it from the list; the folder is never touched.
 async function forgetMissing(item){if(await ask({icon:'caution',message:`The folder for “${item.name}” is missing.`,detail:`${item.path} is not there any more (an unplugged drive, or renamed). Remove from List forgets it here; nothing is deleted.`,danger:'Remove from List',safe:'Keep'})!=='danger')return;try{await api('/api/projects/forget',{project:item.id});await poll();}catch(e){notice(e.message,true);}}
 function renderProjects(){
  const projectState=item=>state.jobs.some(job=>job.project===item.id&&job.status==='running')?'running':state.jobs.some(job=>job.project===item.id&&job.status==='queued')?'waiting':summary.attention.some(job=>job.project===item.id)?'failed':'';
  if(document.body.dataset.view==='activity'&&agentSummary().attention.length)writeState('activitySeen',state.jobs.filter(job=>ATTENTION.includes(job.status)).map(job=>job.id)); // seen while Activity is open
  const summary=agentSummary(),busy=Object.fromEntries(state.projects.map(item=>[item.id,projectState(item)])),view=document.body.dataset.view;
  if(unchanged('projects',[state.projects,project,$('project-search').value,busy,summary.running,summary.waiting,summary.attention.length,summary.gate,view]))return;
  const query=$('project-search').value.trim().toLocaleLowerCase();$('project-count').textContent=state.projects.length?plural(state.projects.length,'project'):'No projects';$('project-n').textContent=String(state.projects.length);$('project-list').replaceChildren();
  const matches=state.projects.filter(item=>(item.name+' '+item.path).toLocaleLowerCase().includes(query));
  if(!matches.length)$('project-list').append(node('p','pw-group__empty',query?'No matching projects':'Your projects will appear here.'));
  for(const item of matches){const button=node('button','pw-row');button.type='button';button.append(icon('folder'),node('span','pw-row__label',item.name));const meta=busy[item.id];if(meta){const cell=node('span','pw-row__meta');if(meta==='running')cell.append(icon('running',{size:12}));if(meta==='failed')cell.append(icon('caution',{size:12}));cell.append(meta);button.append(cell);}button.classList.add('conversation');button.title=item.path;button.setAttribute('aria-current',item.id===project&&!['activity','gate'].includes(view)?'page':'false');/* in Activity or Gate only the Agent row is current */button.onclick=async()=>{if(item.missing){await forgetMissing(item);return;}const fromApp=['activity','gate'].includes(document.body.dataset.view);await selectProject(item.id);host.setLevel('project');if(fromApp)host.showView('chat');};if(item.missing){button.classList.add('pw-row--missing');button.querySelector('.pw-row__meta')?.remove();button.append(node('span','pw-row__meta','folder missing'));button.title=item.path+' is missing. Choose to remove it from the list.';}/* from Activity or Gate a project opens its Chat (round 3, B10) */$('project-list').append(button);}
  const empty=!state.projects.length&&!summary.any,attention=summary.attention.length,activity=$('agent-activity-meta'),gate=$('agent-gate-meta'),g=summary.gate;
  activity.replaceChildren();if(attention)activity.append(icon('caution',{size:12}),attention+' needs attention');else if(summary.running||summary.waiting){if(summary.running)activity.append(icon('running',{size:12}));activity.append([summary.running&&summary.running+' running',summary.waiting&&summary.waiting+' waiting'].filter(Boolean).join(' · '));}else activity.append(empty?'Nothing yet':'Nothing running');
  gate.replaceChildren();if(!g.today)gate.append('No checks yet');else if(g.blocked_today)gate.append(icon('failed',{size:12}),plural(g.today,'check')+' · '+g.blocked_today+' blocked');else gate.append(plural(g.today,'check')+' today');
  $('agent-activity').setAttribute('aria-current',view==='activity'?'page':'false');$('agent-gate').setAttribute('aria-current',view==='gate'?'page':'false');
 }
 for(const [row,next] of [['agent-activity','activity'],['agent-gate','gate']])$(row).onclick=event=>{if(event.metaKey||event.ctrlKey||event.shiftKey)return;event.preventDefault();host.showView(next);if(innerWidth<=760)host.closeMenu?.();};
 for(const toggle of document.querySelectorAll('#projects-nav .pw-group__toggle')){const sync=()=>{const open=toggle.getAttribute('aria-expanded')==='true';toggle.firstElementChild.replaceChildren(icon(open?'disclosure-open':'disclosure-closed',{size:10}));$(toggle.getAttribute('aria-controls')).hidden=!open;};sync();toggle.onclick=()=>{toggle.setAttribute('aria-expanded',String(toggle.getAttribute('aria-expanded')!=='true'));sync();};}
 const filesWindow=installFilesWindow({tree:$('file-tree'),note:$('file-search-note'),seg:$('file-seg'),add:$('file-seg-add'),node,open:async path=>{await openFile(path);host.showView('work');},newTask:()=>newTask(),newFile:()=>newFile(),createRoadmap:()=>createRoadmap(),selected:()=>host.selectionChanged?.()});
 function renderFiles(){if(unchanged('files',[project,files,page?.path]))return;filesWindow.update({project,files,current:page?.path||null});$('files-summary').textContent=filesWindow.summary();}
 async function createRoadmap(){if(!project)return;await createAndOpen('/api/documents/create-roadmap',{project});}
 // One file-list request per project at a time: callers share it, so a background poll can never make a project switch
 // drop its own answer; an answer for a project that is no longer chosen is ignored.
 let filesRun=null;
 async function refreshFiles({fresh=false}={}){/* fresh: after a change, never reuse a list fetched before it */
  if(!project)return;const asked=project;
  if(fresh||filesRun?.project!==asked){const run={project:asked,promise:api('/api/project-files?project='+encodeURIComponent(asked)).finally(()=>{if(filesRun===run)filesRun=null;})};filesRun=run;}
  const listed=await filesRun.promise;if(asked!==project)return;files=listed;files.sort((a,b)=>a.name==='ROADMAP.md'?-1:b.name==='ROADMAP.md'?1:a.name.localeCompare(b.name));renderFiles();
 }
 $('connection-retry').onclick=poll;
 $('project-search').oninput=renderProjects;$('file-search').oninput=()=>filesWindow.search($('file-search').value);$('file-search').onkeydown=event=>{if(event.key==='Escape'&&$('file-search').value){event.preventDefault();event.stopPropagation();$('file-search').value='';filesWindow.search('');}};
 $('show-projects').onclick=$('files-close').onclick=()=>host.setLevel('projects');
 $('welcome-create').onclick=()=>$('new-project').click();$('welcome-folder').onclick=()=>$('add-folder').click();
 
 function renderQueue(){const activeCount=state.jobs.filter(job=>job.status==='queued').length;agentState(...(state.busy?['running','Working'+(activeCount?' · '+activeCount+' waiting':'')]:activeCount?['waiting',activeCount+' waiting']:[null,'Ready']));}
 // One poll at a time; a caller during a poll waits for it (await poll() always sees fresh state).
 let pollRun=null;
 function poll(){return pollRun||(pollRun=pollOnce().finally(()=>{pollRun=null;}));}
 async function pollOnce(){
  try{state=await api('/api/workspace');$('agent-state').classList.remove('offline');$('connection-retry').hidden=true;host.connection(true);renderProjects();renderQueue();renderActivity();renderDocumentRequests();const scope=$('activity-project').value;if(JSON.stringify(state.projects.map(item=>item.id))!==$('activity-project').dataset.ids){$('activity-project').dataset.ids=JSON.stringify(state.projects.map(item=>item.id));$('activity-project').replaceChildren(node('option','','All Projects'));$('activity-project').firstChild.value='all';for(const item of state.projects){const option=node('option','',item.name);option.value=item.id;$('activity-project').append(option);}$('activity-project').value=state.projects.some(item=>item.id===scope)?scope:'all';}await host.updateWork(state);
   if(project&&!$('work-panel').hidden){await refreshFiles();if(page&&!dirty&&!saving&&!$('document-editor').contains(document.activeElement)&&document.activeElement!==$('document-source')){
    const current=page;const fresh=await api((textFile?'/api/project-file':'/api/document')+'?path='+encodeURIComponent(current.path));if(page!==current||dirty||saving||$('document-editor').contains(document.activeElement)||document.activeElement===$('document-source'))return;/* the person started editing meanwhile */
    if(fresh.revision!==page.revision){page=fresh;fileRevision=fresh.revision;blocks=textFile?[]:parseMarkdown(fresh.markdown);focusedBlock=null;$('document-source').value=textFile?fresh.text:fresh.markdown;renderBlocks();notice('Updated by agent / filesystem');}
    if(!textFile){page.comments=fresh.comments;renderComments();}
   }}
  }catch(e){agentState('caution','Connection interrupted');$('agent-state').classList.add('offline');$('connection-retry').hidden=false;host.connection(false);}
 }
 async function browse(path){const sequence=++browseSequence;$('folder-use').disabled=true;try{const result=await api('/api/directories'+(path?'?path='+encodeURIComponent(path):''));if(sequence!==browseSequence)return;folder=result;$('folder-path').value=folder.path;$('folder-list').replaceChildren();for(const child of folder.directories){const button=node('button','pw-row');button.type='button';button.append(icon('folder'),node('span','pw-row__label',child.name));button.title=child.path;button.onclick=()=>browse(child.path);$('folder-list').append(button);}if(!folder.directories.length)$('folder-list').append(node('p','pw-group__empty','No folders here.'));folderHelp();$('folder-error').textContent='';}catch(e){if(sequence===browseSequence)$('folder-error').textContent=e.message;}finally{if(sequence===browseSequence)$('folder-use').disabled=false;}}
 // The help names what will happen (Dialogs, Dialogs2, Ph_NewProject).
 function folderHelp(){const name=$('folder-name').value.trim()||'<name>',base=folder?.path||'';$('folder-help').textContent=folderMode==='create'?`Creates the folder “${base?base.replace(/\/$/,'')+'/':''}${name}” with ROADMAP.md and tasks/001-first-task.md, then opens its Chat.`:'Registers the folder in place. Nothing is moved or created.';}
 $('folder-name').addEventListener('input',()=>folderHelp());
 async function choose(mode){folderMode=mode;$('folder-dialog-title').textContent=mode==='create'?'New Project':'Make This Folder a Project';$('folder-name').value='';$('folder-path').value='';$('folder-use').textContent=mode==='create'?'Create':'Use This Folder';$('folder-dialog').showModal();await browse();}
 $('new-project').onclick=()=>choose('create');$('add-folder').onclick=()=>choose('register');$('folder-cancel').onclick=()=>$('folder-dialog').close();$('folder-up').onclick=()=>browse(folder.parent);$('folder-go').onclick=()=>browse($('folder-path').value);
 $('folder-use').onclick=async()=>{try{const data=folderMode==='create'?{name:$('folder-name').value,parent:folder.path}:{path:folder.path,name:$('folder-name').value||undefined};const created=await api('/api/projects/'+(folderMode==='create'?'create':'register'),data);$('folder-dialog').close();await poll();await selectProject(created.project,{view:'chat'});host.setLevel('project');}/* its Chat (F1); selectProject also opens ROADMAP.md in Work */catch(e){$('folder-error').textContent=e.message;}};
 function openJob(id){host.showActivity();$('activity-filter').value='all';$('activity-project').value='all';selectJob(id);document.getElementById('job-'+id)?.scrollIntoView({block:'center'});}
 // From Activity or Gate into a project (task 128): its window, the view, and a file when the request had one.
 async function goToProject(id,view,file){await selectProject(id,{view});host.setLevel('project');if(file)await openFile(file);host.showView(view);}
 function openProjectChat(){const item=selectedProject();if(item)host.selectChat(item.chat);}
 // New File… and New Task…: the + actions on the Files and Plan groups and the File menu (⌘T, ⇧⌘N).
 // New File… makes any file in the project folder (Markdown unless the name has an extension); New Task… numbers it and links it in ROADMAP.md (harness/documents.py).
 const fileName=value=>/\.[^/.]+$/.test(value)?value:value+'.md',taskStem=value=>value.toLowerCase().replace(/[^\p{L}\p{N}_]+/gu,'-').replace(/^-+|-+$/g,'').slice(0,60);
 const nextTask=()=>String(Math.max(0,...files.map(file=>Number(file.name.match(/^tasks\/(\d+)-/)?.[1]||0)))+1).padStart(3,'0');
 async function createAndOpen(url,body){try{await save();const created=await api(url,body);await refreshFiles({fresh:true});await openFile(created.path);host.showView('work');}catch(e){notice(e.message,true);}}
 async function newFile(){if(!project)return;const where=selectedProject().name,name=await askName({title:'New File',label:'File name',describe:value=>(value?`Creates “${fileName(value)}” in ${where} and opens it. `:'')+'Any name works; .md is added when there is no extension, and “specs/phone.md” creates the folder too.'});/* Dialogs2 */if(name)await createAndOpen('/api/documents/create-file',{project,name});}
 async function newTask(){if(!project)return;const where=selectedProject().name,title=await askName({title:'New Task',label:'Task name',describe:value=>value&&taskStem(value)?`Creates “tasks/${nextTask()}-${taskStem(value)}.md” in ${where}, adds it to ROADMAP.md, and opens it.`:'Numbered after the last task and added to ROADMAP.md.'});if(title)await createAndOpen('/api/documents/create-task',{project,title});}
 $('document-editor').parentElement.addEventListener('click',event=>{if(!page||textFile||$('document-editor').hidden)return;const rows=blockRows(),last=rows.at(-1);if(event.target.closest('.pw-block,.pw-thread'))return;if(last&&event.clientY<last.getBoundingClientRect().bottom)return;const end=blocks.length-1;if(blocks[end]?.type==='text'&&!blocks[end].text.trim()){refocus(end);focusBlock(end);}else addBlock(end);});
 function addBlock(after=blocks.length-1){if(!page||textFile)return;const index=after+1;blocks.splice(index,0,{type:'text',text:'',dirty:true});changed();renderBlocks();refocus(index);focusBlock(index);}
 $('editor-mode').onchange=()=>{if(!page)return;clearAnchor();/* the selection belonged to the other mode */if($('editor-mode').value==='source'){$('document-source').value=serializeMarkdown(blocks);$('document-editor').hidden=true;$('document-source').hidden=false;}else{blocks=parseMarkdown($('document-source').value);$('document-editor').hidden=false;$('document-source').hidden=true;renderBlocks();}};
 $('document-source').oninput=changed;
 async function reloadDocument(){const name=page?.path.split('/').pop();if(page&&(!dirty||await ask({message:`Reload “${name}” from disk?`,detail:'Your unsaved changes in this window will be replaced by the file on disk.',danger:'Reload',safe:'Keep Editing'})==='danger')){const path=page.path;saveDraft(localStorage,path,null);dirty=false;page=null;openFile(path);}}
 $('retry-save').onclick=()=>save().catch(e=>notice(e.message,true));$('discard-draft').onclick=reloadDocument;
 $('download-draft').onclick=()=>{if(!page)return;const url=URL.createObjectURL(new Blob([content()],{type:'text/plain;charset=utf-8'})),link=node('a');link.href=url;link.download=page.path.split('/').pop()+'.draft';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 
 // Rename or Move… and Move to Trash… for a file or a folder (task 146). Without a path they act on the open file.
 const inProject=path=>path.split('/').slice(2).join('/'),isOpenUnder=path=>page&&(page.path===path||page.path.startsWith(path+'/'));
 // No document open: one routine for switching project, trashing the open file and arriving from a chat link. It clears
 // the editor, Review, the request history, the render caches, the pending save and the draft of the file that is gone.
 function resetDocument(){const gone=page?.path;clearTimeout(saveTimer);if(gone)saveDraft(localStorage,gone,null);page=null;dirty=false;focusedBlock=null;openThread=currentComment=null;commentAnchor='';$('save-recovery').hidden=true;
  $('document-path').textContent='No document open';host.documentTitle(selectedProject()?.name||'');for(const id of ['document-prompt','comment-text','document-source','editor-mode','block-style','tool-bullet','tool-check'])$(id).disabled=true;
  $('document-editor').hidden=false;$('document-source').hidden=true;$('document-source').value='';clearAnchor();$('document-editor').replaceChildren(node('p','list-empty','Choose a roadmap, task, or file.'));$('document-comments').replaceChildren();
  delete signatures.comments;delete signatures.requests;renderDocumentRequests();renderComments();}
 const closeOpenFile=resetDocument;
 async function renameFile(path=page?.path,folder=false){if(!path)return;const old=inProject(path),where=selectedProject()?.name||'the project',kind=folder?'folder':'file';
  const dir=value=>value.includes('/')?value.slice(0,value.lastIndexOf('/')):'',full=value=>!folder&&value&&!/\.[^/]+$/.test(value)&&/\.[^/]+$/.test(old)?value+old.slice(old.lastIndexOf('.')):value;
  const name=await askName({title:folder?'Rename or Move Folder':'Rename or Move',label:`New name or path in ${where}`,value:old,mono:true,selectStem:!folder,actionFor:value=>value&&dir(value)!==dir(old)?'Move':'Rename',
   describe:value=>value&&value!==old?`Moves the ${kind} “${old}” to “${full(value)}”. Folders are created as needed. ${folder?'Their comments move with them.':'Its comments move with it.'}`:`Type a new name, or a path such as archive/${old.split('/').pop()} to move it.`});
  if(!name||name===old)return;try{const open=isOpenUnder(path),tail=open?page.path.slice(path.length):'';if(open)await save();const moved=await api('/api/documents/move',{path,name});if(open){const target=moved.path+tail;page=null;dirty=false;await refreshFiles({fresh:true});await openFile(target);remember();}else await refreshFiles();host.toast(`Moved to “${inProject(moved.path)}”.`);}catch(e){notice(e.message,true);}}
 async function trashPage(path=page?.path,folder=false){if(!path)return;const name=inProject(path);
  const count=folder?files.filter(file=>file.path.startsWith(path+'/')).length:0;
  if(await ask({icon:'stop',message:folder?`Move the folder “${name.split('/').pop()}” and its ${count===1?'1 file':count+' files'} to the Trash?`:`Move “${name.split('/').pop()}” to the Trash?`,detail:folder?'Their comments go with them. You can restore them from the data folder’s .trash.':'Its comments go with it. You can restore it from the data folder’s .trash.',danger:'Move to Trash',safe:'Cancel'})!=='danger')return;
  try{const open=isOpenUnder(path);await api('/api/documents/delete',{path});if(open)closeOpenFile();await refreshFiles({fresh:true});}catch(e){notice(e.message,true);}}
 // Add Comment keeps it with the file; Add & Ask Pi also sends it to Pi at once (C_WorkDesk, round 3 F3).
 async function addComment(ask){if(!page||textFile||!commentAnchor)return;$('add-comment').disabled=$('add-ask').disabled=true;try{await save();const anchor=commentAnchor;const created=await api('/api/documents/comment',{path:page.path,text:$('comment-text').value,anchor});$('comment-text').value='';clearAnchor();await refreshPageComments();renderBlocks();if(ask)await askPi(created);}catch(e){notice(e.message,true);}finally{$('add-comment').disabled=$('add-ask').disabled=!commentAnchor;}}
 $('comment-form').onsubmit=event=>{event.preventDefault();addComment(false);};
 $('comment-form').querySelector('.comment-actions').prepend(dictateButton($('comment-text'),{api,report:message=>notice(message,true)}));$('document-prompt-form').querySelector('.comment-actions').prepend(dictateButton($('document-prompt'),{api,report:message=>notice(message,true)}));/* voice input for comments and the whole-file question */$('add-ask').onclick=()=>addComment(true);
 $('document-prompt-form').onsubmit=async event=>{event.preventDefault();if(!project||!page)return;const button=event.currentTarget.querySelector('button');button.disabled=true;try{await save();await api('/api/jobs/create',{project,message:$('document-prompt').value,document:page&&!textFile?page.path:undefined});$('document-prompt').value='';await poll();notice('Document request sent');}catch(e){notice(e.message,true);}finally{button.disabled=false;}};
 function clearAnchor(){commentAnchor='';$('selected-passage').hidden=true;$('selection-bar').hidden=true;$('add-comment').disabled=$('add-ask').disabled=true;}
 function attachSelection(text){commentAnchor=text;$('comment-anchor').textContent=text;$('selected-passage').hidden=false;$('add-comment').disabled=$('add-ask').disabled=false;}
 $('clear-anchor').onclick=clearAnchor;$('selection-bar-comment').onclick=commentSelection;$('selection-bar-ask').onclick=()=>askAbout(commentAnchor);$('selection-bar').onpointerdown=event=>event.preventDefault();
 document.addEventListener('selectionchange',()=>{const selection=window.getSelection();if(!selection||selection.isCollapsed){$('selection-bar').hidden=true;return;}const a=selection.anchorNode,b=selection.focusNode;if(!$('document-editor').contains(a)||!$('document-editor').contains(b)||!selection.toString().trim())return;attachSelection(selection.toString().trim());
  const box=selection.getRangeAt(0).getBoundingClientRect(),bar=$('selection-bar');bar.hidden=false;bar.style.left=Math.max(4,Math.min(box.left,innerWidth-bar.offsetWidth-4))+'px';bar.style.top=Math.min(box.bottom+6,innerHeight-bar.offsetHeight-4)+'px';});
 window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
 $('work-tab').onclick=()=>host.showWorkspace();
 setInterval(()=>{if(!document.hidden)poll();},1800);
 return {refresh:poll,renderProjects,agentSummary,markActivitySeen,goToProject,openProjectChat,reloadDocument,trashPage:()=>{const item=filesWindow.selection();return item?trashPage(item.path,item.folder):trashPage();},renameFile:()=>{const item=filesWindow.selection();return item?renameFile(item.path,item.folder):renameFile();},selection:()=>filesWindow.selection(),addBlock,openJob,async start(){await poll();return state.projects;},openFile,newFile:()=>newFile(),newTask:()=>newTask(),async selectChatProject(id){const item=state.projects.find(item=>item.chat===id);if(item){const switched=project!==item.id;if(switched)await save();project=item.id;$('files-title').textContent=item.name;$('project-title').textContent=item.name;$('project-folder').textContent=item.path;if(switched){resetDocument();await refreshFiles();const target=readState('navigation',{}).files?.[project]||files.find(file=>file.name==='ROADMAP.md')?.path;if(target)await openFile(target);}renderProjects();remember();}},moveBlock:delta=>moveBlock(focusedBlock,delta),showRecord:()=>{if(selectedJob)showRecord(selectedJob);},commentSelection,askSelection:()=>askAbout(commentAnchor),stepComment,toggleResolved:()=>$('show-resolved').click(),save,saveNow:()=>save().catch(e=>notice(e.message,true)),selectProject,status:()=>({project,projects:state.projects,jobs:state.jobs,page:page?.path||null,focusedBlock,selectedJob,anchor:Boolean(commentAnchor),comments:(page?.comments||[]).some(comment=>!comment.deleted),textFile,dirty,offline:!$('connection-retry').hidden})};
}
