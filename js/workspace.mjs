import { saveDraft,loadDraft } from './drafts.mjs';
import { icon,readState,writeState } from './ui.mjs';import { ask,askName } from './dialogs.mjs';
import { parseMarkdown,serializeMarkdown } from './markdown-blocks.mjs';
export function installWorkspace(host){
 const $=id=>document.getElementById(id),{api,node,error}=host;
 let state={projects:[],jobs:[]},project=null,page=null,blocks=[],dirty=false,saving=null,saveTimer,folderMode='register',folder=null,polling=false,fileRevision='',textFile=false,commentAnchor='',browseSequence=0,fileSequence=0;
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
 function renderBlocks(){
  $('document-editor').replaceChildren();
  blocks.forEach((block,index)=>{
   const row=node('div','editor-block '+block.type),tools=node('div','block-tools');
   const type=node('select');type.setAttribute('aria-label','Block type');
   for(const [value,label] of [['text','Text'],['heading','Heading'],['check','Task checkbox'],['bullet','Bullet'],['number','Number'],['quote','Quote'],['code','Code'],['raw','Raw Markdown']]){const option=node('option','',label);option.value=value;type.append(option);}type.value=block.type;
   type.onchange=()=>{block.type=type.value;block.level=block.level||2;block.dirty=true;changed();renderBlocks();};tools.append(type);
   for(const [label,offset] of [['↑',-1],['↓',1]]){const button=node('button');button.append(icon(offset<0?'up':'down'));button.type='button';button.setAttribute('aria-label',offset<0?'Move block up':'Move block down');button.onclick=()=>{const target=index+offset;if(target<0||target>=blocks.length)return;[blocks[index],blocks[target]]=[blocks[target],blocks[index]];blocks[index].dirty=blocks[target].dirty=true;changed();renderBlocks();};tools.append(button);}
   const remove=node('button');remove.append(icon('close'));remove.type='button';remove.setAttribute('aria-label','Delete block');remove.onclick=()=>{blocks.splice(index,1);changed();renderBlocks();};tools.append(remove);row.append(tools);
   if(block.type==='check'){const check=node('input');check.type='checkbox';check.checked=block.checked;check.setAttribute('aria-label','Task complete');check.onchange=()=>{block.checked=check.checked;block.dirty=true;changed();};row.append(check);}
   const text=node(block.type==='heading'?'h'+Math.min(block.level||2,6):block.type==='code'||block.type==='raw'?'pre':'div','block-content',block.text);
   text.contentEditable='plaintext-only';text.setAttribute('role','textbox');text.setAttribute('aria-label',block.type==='heading'?'Heading':'Block text');text.spellcheck=block.type!=='code';
   highlightComments(text,block);text.oninput=()=>{block.text=text.innerText;block.dirty=true;changed();};row.append(text);$('document-editor').append(row);
  });
 }
 function renderComments(){
  if(unchanged('comments',[page?.path,page?.comments]))return;const focused=document.activeElement?.dataset.thread;$('document-comments').replaceChildren();$('comment-count').textContent=(page?.comments||[]).filter(comment=>!comment.resolved).length;
  for(const comment of page?.comments||[]){
   const card=node('article','document-comment'+(comment.resolved?' resolved':''));card.id='comment-'+comment.id;
   const quote=node('button','comment-quote',comment.anchor);quote.onclick=()=>focusAnchor(comment);card.append(quote);
   if(page.markdown&&!page.markdown.includes(comment.anchor))card.append(node('p','field-help','Passage changed on disk; this thread keeps the original quote.'));
   card.append(node('p','',comment.text));
   for(const reply of comment.replies||[])card.append(node('p','thread-reply',reply.text));
   if(comment.agent_reply)card.append(node('p','agent-reply','Agent: '+comment.agent_reply));
   const actions=node('div','comment-actions'),resolve=node('button','',comment.resolved?'Reopen':'Resolve');resolve.onclick=async()=>{try{await api('/api/documents/resolve',{path:page.path,id:comment.id,resolved:!comment.resolved});await refreshPageComments();}catch(e){notice(e.message,true);}};actions.append(resolve);
   if(!comment.resolved){const send=node('button','','Ask agent about this passage');send.onclick=async()=>{send.disabled=true;try{await save();await api('/api/jobs/create',{project,message:'Comment: '+comment.text,document_comment:{path:page.path,id:comment.id}});await poll();notice('Text comment sent to the agent');}catch(e){notice(e.message,true);}finally{send.disabled=false;}};actions.append(send);}
   const replyForm=node('form','thread-reply-form'),reply=node('input');reply.placeholder='Reply to this thread…';reply.setAttribute('aria-label','Reply to text comment');reply.maxLength=10000;reply.required=true;reply.dataset.thread=comment.id;reply.value=replyDrafts.get(comment.id)||'';reply.oninput=()=>replyDrafts.set(comment.id,reply.value);
   const submit=node('button','','Reply');replyForm.append(reply,submit);replyForm.onsubmit=async event=>{event.preventDefault();submit.disabled=true;try{await api('/api/documents/reply',{path:page.path,id:comment.id,text:reply.value||replyDrafts.get(comment.id)||''});replyDrafts.delete(comment.id);await refreshPageComments();}catch(e){notice(e.message,true);}finally{submit.disabled=false;}};
   if(comment.chat_id){const chat=node('a','','Open chat');chat.href='/?chat='+comment.chat_id;chat.onclick=event=>{event.preventDefault();host.selectChat(comment.chat_id);};actions.append(chat);}card.append(actions,replyForm);$('document-comments').append(card);if(focused===comment.id)reply.focus();
  }
 }
 function focusAnchor(comment){for(const block of document.querySelectorAll('.block-content'))if(block.textContent.includes(comment.anchor)){block.focus();block.scrollIntoView({block:'center',behavior:'smooth'});break;}}
 function renderDocumentRequests(){
  if(unchanged('requests',[page?.path,state.jobs.filter(job=>job.document===page?.path&&!job.comment_id)]))return;$('document-request-history').hidden=true;$('document-requests').replaceChildren();if(!page)return;
  const jobs=state.jobs.filter(job=>job.document===page.path&&!job.comment_id).slice(-5);$('document-request-history').hidden=!jobs.length;$('document-request-summary').textContent=jobs.length+' recent document '+(jobs.length===1?'request':'requests');
  for(const job of jobs){const thread=node('article','document-request');thread.append(node('p','',job.message),node('small','',job.status));if(job.text)thread.append(node('p','agent-reply',job.text));const open=node('button','','View task');open.onclick=()=>{host.showActivity();$('activity-filter').value='all';renderActivity();document.getElementById('job-'+job.id)?.scrollIntoView({block:'center'});};thread.append(open);$('document-requests').append(thread);}
 }
 function highlightComments(text,block){
  const matches=(page?.comments||[]).filter(comment=>!comment.resolved&&comment.anchor&&block.text.includes(comment.anchor)).map(comment=>({comment,at:block.text.indexOf(comment.anchor)})).sort((a,b)=>a.at-b.at);
  if(!matches.length)return;text.replaceChildren();let cursor=0;
  for(const {comment,at} of matches){if(at<cursor)continue;text.append(document.createTextNode(block.text.slice(cursor,at)));const mark=node('mark','text-anchor',comment.anchor);mark.dataset.comment=comment.id;mark.onclick=()=>document.getElementById('comment-'+comment.id)?.scrollIntoView({block:'center',behavior:'smooth'});text.append(mark);cursor=at+comment.anchor.length;}
  text.append(document.createTextNode(block.text.slice(cursor)));
 }
 function renderActivity(){
  const filter=$('activity-filter').value,scope=$('activity-project').value;if(unchanged('activity',[filter,scope,state.projects,state.jobs]))return;
  const visible=state.jobs.filter(job=>(scope==='all'||job.project===scope)&&(filter==='all'||filter==='pending'&&['running','queued'].includes(job.status)||filter==='completed'&&job.status==='completed'||filter==='attention'&&['failed','stopped','interrupted'].includes(job.status)));
  $('activity-list').replaceChildren();if(!visible.length)$('activity-list').append(node('p','list-empty',state.jobs.length?'No tasks match these filters.':'Send a chat message or a document request. Its progress and result will appear here.'));
  const ordered=visible.slice().sort((a,b)=>{const ranks={running:0,queued:1};return (ranks[a.status]??2)-(ranks[b.status]??2)||(['queued','running'].includes(a.status)?a.order-b.order:b.order-a.order);});
  for(const job of ordered){const item=state.projects.find(project=>project.id===job.project),card=node('article','activity-task');card.id='job-'+job.id;
   const heading=node('div','activity-task-heading');heading.append(node('span','task-state '+job.status,job.status),node('strong','',item?.name||job.project),node('time','',new Date(job.finished||job.started||job.created).toLocaleString()));card.append(heading,node('p','activity-request',job.message||'Attached files'),node('p','field-help',job.progress));
   if(job.text){const result=node('details');result.append(node('summary','','Result'),node('pre','',job.text));card.append(result);}
   const links=node('div','activity-links'),chat=node('a','','Open chat');chat.href='/?chat='+job.chat;chat.onclick=event=>{event.preventDefault();host.selectChat(job.chat);};links.append(chat);
   if(job.document){const doc=node('a','','Open document');doc.href='/?document='+encodeURIComponent(job.document);doc.onclick=async event=>{event.preventDefault();await selectProject(job.project);await openFile(job.document);host.showWorkspace();if(job.comment_id)document.getElementById('comment-'+job.comment_id)?.scrollIntoView({block:'center'});};links.append(doc);}
   const record=node('button','','Markdown record');record.onclick=async()=>{try{const result=await api('/api/activity-record?id='+job.id);$('activity-record-text').textContent=result.markdown;$('activity-record').hidden=false;$('activity-record').open=true;$('activity-record').scrollIntoView({block:'start'});}catch(e){error(e.message);}};links.append(record);
   if(job.status==='queued'){const cancel=node('button','','Cancel');cancel.onclick=async()=>{if(await ask({message:'Cancel the waiting request?',detail:'It has not started. You can send it again from the chat.',danger:'Cancel Request',safe:'Keep Waiting'})!=='danger')return;await api('/api/jobs/cancel',{id:job.id});await poll();};links.append(cancel);}
   if(job.status==='running'){const stop=node('button','','Stop');stop.onclick=()=>api(`/api/conversations/${job.chat}/stop`,{});links.append(stop);}
   card.append(links);$('activity-list').append(card);
  }
  const pending=state.jobs.filter(job=>['queued','running'].includes(job.status)).length;$('activity-summary').textContent=pending?pending+' active or waiting':'All caught up';$('activity-count').textContent=pending;$('activity-count').hidden=!pending;
 }
 $('activity-filter').onchange=$('activity-project').onchange=renderActivity;
 async function refreshPageComments(){if(page&&!textFile){const fresh=await api('/api/document?path='+encodeURIComponent(page.path));page.comments=fresh.comments;renderComments();if(!$('document-editor').contains(document.activeElement))renderBlocks();}}
 async function openFile(path){
  if(page?.path===path&&!dirty)return;const sequence=++fileSequence;
  try{await save();if(sequence!==fileSequence)return;textFile=!path.toLowerCase().endsWith('.md');
   const value=await api((textFile?'/api/project-file':'/api/document')+'?path='+encodeURIComponent(path));if(sequence!==fileSequence)return;page=value;dirty=false;commentAnchor='';
   fileRevision=value.revision;$('document-source').value=textFile?value.text:value.markdown;blocks=textFile?[]:parseMarkdown(value.markdown);
   $('document-prompt').disabled=false;$('comment-text').disabled=false;$('document-source').disabled=false;$('add-block').disabled=false;$('delete-page').disabled=false;$('reload-document').disabled=false;$('editor-mode').value=textFile?'source':'blocks';$('editor-mode').disabled=textFile;
   $('document-editor').hidden=textFile;$('document-source').hidden=!textFile;$('comments-panel').hidden=textFile;$('add-block').hidden=textFile;$('delete-page').hidden=textFile;
   const restored=loadDraft(localStorage,path,value.revision);$('save-recovery').hidden=true;if(restored){dirty=true;$('document-source').value=restored.text;blocks=textFile?[]:parseMarkdown(restored.text);notice(restored.conflict?'Your saved draft differs from the file on disk. Download it before reloading.':'Restored your unsaved draft',restored.conflict);if(!restored.conflict)changed();}
   renderBlocks();renderComments();renderDocumentRequests();$('document-discussion').hidden=textFile;clearAnchor();if(!restored)notice(textFile?'Live text/code file':'Saved');$('document-toolbar').dataset.path=path;$('document-name').textContent=path.split('/').slice(2).join('/');$('file-kind').textContent=textFile?'Code / text':'Markdown';renderFiles();remember();
  }catch(e){notice(e.message,true);}
 }
 async function selectProject(id,openWork=true){
  try{await save();fileSequence++;project=id;page=null;dirty=false;const item=selectedProject();
   $('project-title').textContent=item.name;$('active-project-label').textContent=item.name;$('project-folder').textContent=item.path;
   $('document-name').textContent='Choose a document';$('file-kind').textContent='';$('document-prompt').disabled=true;$('comment-text').disabled=true;$('document-source').disabled=true;$('editor-mode').disabled=true;$('add-block').disabled=true;$('delete-page').disabled=true;$('reload-document').disabled=true;$('document-editor').hidden=false;$('document-source').hidden=true;clearAnchor();renderDocumentRequests();$('document-editor').replaceChildren(node('p','list-empty','Choose a roadmap, task, or file.')); $('document-source').value='';$('document-comments').replaceChildren();
   await host.selectChat(item.chat);if(openWork)host.showWorkspace();await refreshFiles();renderProjects();renderQueue();remember();const target=readState('navigation',{}).files?.[id]||files.find(file=>file.name==='ROADMAP.md')?.path;if(target&&files.some(file=>file.path===target))await openFile(target);
  }catch(e){notice(e.message,true);}
 }
 function renderProjects(){
  if(unchanged('projects',[state.projects,project,$('project-search').value]))return;const query=$('project-search').value.trim().toLocaleLowerCase();$('project-count').textContent=state.projects.length;$('project-list').replaceChildren();
  const matches=state.projects.filter(item=>(item.name+' '+item.path).toLocaleLowerCase().includes(query));
  if(!matches.length)$('project-list').append(node('p','list-empty',query?'No matching projects':'Your projects will appear here.'));
  for(const item of matches){const row=node('div','conversation'+(item.id===project?' active':''));const button=node('button','conversation-select');button.append(icon('folder'),node('span','',item.name));button.title=item.path;button.setAttribute('aria-current',item.id===project?'page':'false');button.onclick=()=>selectProject(item.id);row.append(button);$('project-list').append(row);}
 }
 function renderFiles(){
  if(unchanged('files',[files,page?.path,$('file-search').value]))return;const query=$('file-search').value.trim().toLocaleLowerCase();$('file-tree').replaceChildren();
  const matches=files.filter(file=>file.name.toLocaleLowerCase().includes(query));
  if(!matches.length)$('file-tree').append(node('p','list-empty',query?'No matching files':'This folder is empty. Create a page or task to begin.'));
  for(const file of matches){const button=node('button','file-item'+(file.path===page?.path?' active':''));button.append(icon('file'),node('span','',file.name));button.title=file.name;button.setAttribute('aria-current',file.path===page?.path?'page':'false');button.onclick=()=>openFile(file.path);$('file-tree').append(button);}
 }
 async function refreshFiles(){
  if(!project)return;files=await api('/api/project-files?project='+encodeURIComponent(project));files.sort((a,b)=>a.name==='ROADMAP.md'?-1:b.name==='ROADMAP.md'?1:a.name.localeCompare(b.name));renderFiles();
 }
 $('connection-retry').onclick=poll;
 $('project-search').oninput=renderProjects;$('file-search').oninput=renderFiles;
 $('welcome-create').onclick=()=>$('new-project').click();$('welcome-folder').onclick=()=>$('add-folder').click();
 
 function renderQueue(){const activeCount=state.jobs.filter(job=>job.status==='queued').length;agentState(...(state.busy?['running','Working'+(activeCount?' · '+activeCount+' waiting':'')]:activeCount?['waiting',activeCount+' waiting']:[null,'Ready']));
  if(unchanged('queue',[state.busy,state.jobs,project]))return;const active=state.jobs.find(job=>job.status==='running');$('work-status').replaceChildren();
  if(active){const item=state.projects.find(item=>item.id===active.project);$('work-status').append(node('strong','','Working on '+(item?.name||active.project)),node('p','',active.message),node('span','status',active.progress));const stop=node('button','','Stop agent');stop.onclick=()=>api(`/api/conversations/${active.chat}/stop`,{});$('work-status').append(stop);}
  else $('work-status').append(node('strong','',state.busy?'Agent is working in the terminal':'Agent is idle'));
  $('work-queue').replaceChildren();
  const queue=state.jobs.filter(job=>job.status==='queued');if(queue.length){const open=node('button','queue-link',queue.length+' waiting · Open Activity');open.onclick=()=>host.showActivity();$('work-queue').append(open);}
 }
 async function poll(){
  if(polling)return;polling=true;
  try{state=await api('/api/workspace');$('agent-state').classList.remove('offline');$('connection-retry').hidden=true;host.connection(true);renderProjects();renderQueue();renderActivity();renderDocumentRequests();const scope=$('activity-project').value;if(JSON.stringify(state.projects.map(item=>item.id))!==$('activity-project').dataset.ids){$('activity-project').dataset.ids=JSON.stringify(state.projects.map(item=>item.id));$('activity-project').replaceChildren(node('option','','All projects'));$('activity-project').firstChild.value='all';for(const item of state.projects){const option=node('option','',item.name);option.value=item.id;$('activity-project').append(option);}$('activity-project').value=state.projects.some(item=>item.id===scope)?scope:'all';}await host.updateWork(state);
   if(project&&!$('work-panel').hidden){await refreshFiles();if(page&&!dirty&&!saving&&!$('document-editor').contains(document.activeElement)&&document.activeElement!==$('document-source')){
    const current=page;const fresh=await api((textFile?'/api/project-file':'/api/document')+'?path='+encodeURIComponent(current.path));if(page!==current||dirty||saving)return;
    if(fresh.revision!==page.revision){page=fresh;fileRevision=fresh.revision;blocks=textFile?[]:parseMarkdown(fresh.markdown);$('document-source').value=textFile?fresh.text:fresh.markdown;renderBlocks();notice('Updated by agent / filesystem');}
    if(!textFile){page.comments=fresh.comments;renderComments();}
   }}
  }catch(e){agentState('caution','Connection interrupted');$('agent-state').classList.add('offline');$('connection-retry').hidden=false;host.connection(false);}finally{polling=false;}
 }
 async function browse(path){const sequence=++browseSequence;$('folder-use').disabled=true;try{const result=await api('/api/directories'+(path?'?path='+encodeURIComponent(path):''));if(sequence!==browseSequence)return;folder=result;$('folder-path').value=folder.path;$('folder-list').replaceChildren();for(const child of folder.directories){const button=node('button','folder-item',child.name);button.prepend(icon('folder'));button.onclick=()=>browse(child.path);$('folder-list').append(button);}$('folder-error').textContent='';}catch(e){if(sequence===browseSequence)$('folder-error').textContent=e.message;}finally{if(sequence===browseSequence)$('folder-use').disabled=false;}}
 async function choose(mode){folderMode=mode;$('folder-dialog-title').textContent=mode==='create'?'New Project':'Make This Folder a Project';$('folder-name').value='';$('folder-path').value='';$('folder-use').textContent=mode==='create'?'Create':'Use This Folder';$('folder-dialog').showModal();await browse();}
 $('new-project').onclick=()=>choose('create');$('add-folder').onclick=()=>choose('register');$('folder-cancel').onclick=()=>$('folder-dialog').close();$('folder-up').onclick=()=>browse(folder.parent);$('folder-go').onclick=()=>browse($('folder-path').value);
 $('folder-use').onclick=async()=>{try{const data=folderMode==='create'?{name:$('folder-name').value,parent:folder.path}:{path:folder.path,name:$('folder-name').value||undefined};const created=await api('/api/projects/'+(folderMode==='create'?'create':'register'),data);$('folder-dialog').close();await poll();await selectProject(created.project);const files=await api('/api/project-files?project='+encodeURIComponent(created.project));const roadmap=files.find(item=>item.name==='ROADMAP.md');if(roadmap)await openFile(roadmap.path);}catch(e){$('folder-error').textContent=e.message;}};
 $('project-chat').onclick=()=>{const item=selectedProject();if(item)host.selectChat(item.chat);};
 $('new-page').onclick=()=>newPage(false);$('new-task').onclick=()=>newPage(true);
 async function newPage(task){if(!project)return;const title=await askName(task?{title:'New Task',label:'Task name',help:'Adds a task file to this project and opens it.'}:{title:'New Page',label:'Page name',help:'Creates a Markdown page in this project and opens it.'});if(!title)return;try{await save();const created=await api('/api/documents/create',{project,title,parent:task?'projects/'+project+'/tasks.md':undefined});await refreshFiles();await openFile(created.path);}catch(e){notice(e.message,true);}}
 $('add-block').onclick=()=>{blocks.push({type:'text',text:'',dirty:true});changed();renderBlocks();$('document-editor').lastElementChild.querySelector('[contenteditable]').focus();};
 $('editor-mode').onchange=()=>{if(!page)return;if($('editor-mode').value==='source'){$('document-source').value=serializeMarkdown(blocks);$('document-editor').hidden=true;$('document-source').hidden=false;}else{blocks=parseMarkdown($('document-source').value);$('document-editor').hidden=false;$('document-source').hidden=true;renderBlocks();}};
 $('document-source').oninput=changed;
 $('reload-document').onclick=async()=>{const name=page?.path.split('/').pop();if(page&&(!dirty||await ask({message:`Reload “${name}” from disk?`,detail:'Your unsaved changes in this window will be replaced by the file on disk.',danger:'Reload',safe:'Keep Editing'})==='danger')){const path=page.path;saveDraft(localStorage,path,null);dirty=false;page=null;openFile(path);}};
 $('retry-save').onclick=()=>save().catch(e=>notice(e.message,true));$('discard-draft').onclick=()=>$('reload-document').click();
 $('download-draft').onclick=()=>{if(!page)return;const url=URL.createObjectURL(new Blob([content()],{type:'text/plain;charset=utf-8'})),link=node('a');link.href=url;link.download=page.path.split('/').pop()+'.draft';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 
 $('delete-page').onclick=async()=>{if(page&&await ask({icon:'stop',message:`Move “${page.path.split('/').pop()}” to the Trash?`,detail:'Its comments go with it. You can restore it from the data folder’s .trash.',danger:'Move to Trash',safe:'Cancel'})==='danger'){try{await api('/api/documents/delete',{path:page.path});page=null;dirty=false;$('document-editor').replaceChildren();await refreshFiles();}catch(e){notice(e.message,true);}}};
 $('comment-form').onsubmit=async event=>{event.preventDefault();if(!page||textFile||!commentAnchor)return;$('add-comment').disabled=true;try{await save();const anchor=commentAnchor;await api('/api/documents/comment',{path:page.path,text:$('comment-text').value,anchor});$('comment-text').value='';clearAnchor();await refreshPageComments();renderBlocks();}catch(e){notice(e.message,true);}finally{$('add-comment').disabled=!commentAnchor;}};
 $('document-prompt-form').onsubmit=async event=>{event.preventDefault();if(!project||!page)return;const button=event.currentTarget.querySelector('button');button.disabled=true;try{await save();await api('/api/jobs/create',{project,message:$('document-prompt').value,document:page&&!textFile?page.path:undefined});$('document-prompt').value='';await poll();notice('Document request sent');}catch(e){notice(e.message,true);}finally{button.disabled=false;}};
 function clearAnchor(){commentAnchor='';$('selected-passage').hidden=true;$('selection-comment').hidden=true;$('add-comment').disabled=true;}
 function attachSelection(text){commentAnchor=text;$('comment-anchor').textContent=text;$('selected-passage').hidden=false;$('selection-comment').hidden=false;$('add-comment').disabled=false;}
 $('clear-anchor').onclick=clearAnchor;$('selection-comment').onclick=()=>{$('comments-panel').scrollIntoView({block:'start',behavior:'smooth'});$('comment-text').focus();};
 document.addEventListener('selectionchange',()=>{const selection=window.getSelection();if(selection?.isCollapsed)return;const a=selection.anchorNode,b=selection.focusNode;if($('document-editor').contains(a)&&$('document-editor').contains(b)&&selection.toString().trim())attachSelection(selection.toString().trim());});
 window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
 $('work-tab').onclick=()=>host.showWorkspace();
 setInterval(()=>{if(!document.hidden)poll();},1800);
 return {refresh:poll,async start(){await poll();if(state.projects.length){const query=new URLSearchParams(location.search),documentPath=query.get('document'),chatId=query.get('chat');const chosen=state.projects.find(item=>item.id===documentPath?.split('/')[1]||item.chat===chatId)||state.projects.find(item=>item.id===navigation.project)||state.projects[0];await selectProject(chosen.id);if(documentPath){await openFile(documentPath);host.showWorkspace();}else if(chatId)await host.selectChat(chosen.chat);else host.restoreView(navigation.view||'work');}},async selectChatProject(id){const item=state.projects.find(item=>item.chat===id);if(item){const switched=project!==item.id;project=item.id;$('active-project-label').textContent=item.name;$('project-title').textContent=item.name;$('project-folder').textContent=item.path;if(switched){page=null;dirty=false;await refreshFiles();const target=readState('navigation',{}).files?.[project]||files.find(file=>file.name==='ROADMAP.md')?.path;if(target)await openFile(target);}renderProjects();remember();}},save,saveNow:()=>save().catch(e=>notice(e.message,true)),selectProject,status:()=>({project,projects:state.projects,jobs:state.jobs,page:page?.path||null,textFile,dirty,offline:!$('connection-retry').hidden})};
}
