import { parseMarkdown,serializeMarkdown } from './markdown-blocks.mjs';
export function installWorkspace(host){
 const $=id=>document.getElementById(id),{api,node,error}=host;
 let state={projects:[],jobs:[]},project=null,page=null,blocks=[],dirty=false,saving=null,saveTimer,folderMode='register',folder=null,polling=false,fileRevision='',textFile=false,commentAnchor='',browseSequence=0;
 const notice=(text,failed=false)=>{$('save-status').textContent=text;$('save-status').classList.toggle('failed',failed);};
 const selectedProject=()=>state.projects.find(item=>item.id===project);
 function changed(){dirty=true;notice('Unsaved');clearTimeout(saveTimer);saveTimer=setTimeout(()=>save().catch(e=>notice(e.message,true)),700);}
 function content(){return $('editor-mode').value==='source'||textFile?$('document-source').value:serializeMarkdown(blocks);}
 async function save(){
  clearTimeout(saveTimer);if(saving)await saving;if(!dirty||!page)return;
  const current=page,markdown=content();
  saving=(async()=>{notice('Saving…');const saved=await api('/api/documents/'+(textFile?'save-file':'save'),textFile?{path:current.path,text:markdown,revision:fileRevision}:{path:current.path,markdown,revision:current.revision});
   if(page===current){if(textFile)fileRevision=saved.revision;else{page=saved;}dirty=content()!==markdown;notice(dirty?'Unsaved':'Saved');if(dirty)changed();}
  })();try{await saving;}finally{saving=null;}if(dirty)await save();
 }
 function renderBlocks(){
  $('document-editor').replaceChildren();
  blocks.forEach((block,index)=>{
   const row=node('div','editor-block '+block.type),tools=node('div','block-tools');
   const type=node('select');type.setAttribute('aria-label','Block type');
   for(const [value,label] of [['text','Text'],['heading','Heading'],['check','Task checkbox'],['bullet','Bullet'],['number','Number'],['quote','Quote'],['code','Code'],['raw','Raw Markdown']]){const option=node('option','',label);option.value=value;type.append(option);}type.value=block.type;
   type.onchange=()=>{block.type=type.value;block.level=block.level||2;block.dirty=true;changed();renderBlocks();};tools.append(type);
   for(const [label,offset] of [['↑',-1],['↓',1]]){const button=node('button','',label);button.type='button';button.setAttribute('aria-label',offset<0?'Move block up':'Move block down');button.onclick=()=>{const target=index+offset;if(target<0||target>=blocks.length)return;[blocks[index],blocks[target]]=[blocks[target],blocks[index]];blocks[index].dirty=blocks[target].dirty=true;changed();renderBlocks();};tools.append(button);}
   const remove=node('button','','×');remove.type='button';remove.setAttribute('aria-label','Delete block');remove.onclick=()=>{blocks.splice(index,1);changed();renderBlocks();};tools.append(remove);row.append(tools);
   if(block.type==='check'){const check=node('input');check.type='checkbox';check.checked=block.checked;check.setAttribute('aria-label','Task complete');check.onchange=()=>{block.checked=check.checked;block.dirty=true;changed();};row.append(check);}
   const text=node(block.type==='heading'?'h'+Math.min(block.level||2,6):block.type==='code'||block.type==='raw'?'pre':'div','block-content',block.text);
   text.contentEditable='plaintext-only';text.setAttribute('role','textbox');text.setAttribute('aria-label',block.type==='heading'?'Heading':'Block text');text.spellcheck=block.type!=='code';
   text.oninput=()=>{block.text=text.innerText;block.dirty=true;changed();};row.append(text);$('document-editor').append(row);
  });
 }
 function renderComments(){
  $('document-comments').replaceChildren();
  for(const comment of page?.comments||[]){
   const card=node('article','document-comment'+(comment.resolved?' resolved':''));
   if(comment.anchor)card.append(node('blockquote','',comment.anchor));card.append(node('p','',comment.text));
   if(comment.agent_reply)card.append(node('p','agent-reply','Agent: '+comment.agent_reply));
   const actions=node('div','comment-actions'),resolve=node('button','',comment.resolved?'Reopen':'Resolve');resolve.onclick=async()=>{try{await api('/api/documents/resolve',{path:page.path,id:comment.id,resolved:!comment.resolved});await refreshPageComments();}catch(e){notice(e.message,true);}};actions.append(resolve);
   if(!comment.resolved){const send=node('button','','Send to agent');send.onclick=async()=>{try{await save();await api('/api/jobs/create',{project,message:'Comment: '+comment.text,document_comment:{path:page.path,id:comment.id}});await poll();notice('Comment queued for this project');}catch(e){notice(e.message,true);}};actions.append(send);}
   if(comment.chat_id){const chat=node('button','','Open conversation');chat.onclick=()=>host.selectChat(comment.chat_id);actions.append(chat);}card.append(actions);$('document-comments').append(card);
  }
 }
 async function refreshPageComments(){if(page&&!textFile){const fresh=await api('/api/document?path='+encodeURIComponent(page.path));page.comments=fresh.comments;renderComments();}}
 async function openFile(path){
  try{await save();textFile=!path.toLowerCase().endsWith('.md');
   const value=await api((textFile?'/api/project-file':'/api/document')+'?path='+encodeURIComponent(path));page=value;dirty=false;commentAnchor='';
   fileRevision=value.revision;$('document-source').value=textFile?value.text:value.markdown;blocks=textFile?[]:parseMarkdown(value.markdown);
   $('editor-mode').value=textFile?'source':'blocks';$('editor-mode').disabled=textFile;
   $('document-editor').hidden=textFile;$('document-source').hidden=!textFile;$('comments-panel').hidden=textFile;$('add-block').hidden=textFile;$('delete-page').hidden=textFile;
   renderBlocks();renderComments();notice(textFile?'Live text/code file':'Saved');$('document-toolbar').dataset.path=path;
  }catch(e){notice(e.message,true);}
 }
 async function selectProject(id,openWork=true){
  try{await save();project=id;page=null;dirty=false;const item=selectedProject();
   $('project-title').textContent=item.name;$('project-folder').textContent=item.path;
   $('document-editor').replaceChildren(node('p','','Choose a roadmap, task, or file.'));$('document-source').value='';$('document-comments').replaceChildren();
   await host.selectChat(item.chat);if(openWork)host.showWorkspace();await refreshFiles();renderProjects();renderQueue();
  }catch(e){notice(e.message,true);}
 }
 function renderProjects(){
  $('project-list').replaceChildren();
  for(const item of state.projects){const row=node('div','conversation'+(item.id===project?' active':''));const button=node('button','conversation-select',item.name);button.title=item.path;button.onclick=()=>selectProject(item.id);row.append(button);$('project-list').append(row);}
 }
 async function refreshFiles(){
  if(!project)return;const files=await api('/api/project-files?project='+encodeURIComponent(project));$('file-tree').replaceChildren();
  files.sort((a,b)=>a.name==='ROADMAP.md'?-1:b.name==='ROADMAP.md'?1:a.name.localeCompare(b.name));
  for(const file of files){const button=node('button','file-item',file.name);button.title=file.path;button.onclick=()=>openFile(file.path);$('file-tree').append(button);}
 }
 function renderQueue(){
  const active=state.jobs.find(job=>job.status==='running');$('work-status').replaceChildren();
  if(active){const item=state.projects.find(item=>item.id===active.project);$('work-status').append(node('strong','','Working on '+(item?.name||active.project)),node('p','',active.message),node('span','status',active.progress));const stop=node('button','','Stop agent');stop.onclick=()=>api(`/api/conversations/${active.chat}/stop`,{});$('work-status').append(stop);}
  else $('work-status').append(node('strong','',state.busy?'Agent is working in the terminal':'Agent is idle'));
  $('work-queue').replaceChildren();
  const queue=state.jobs.filter(job=>job.status==='queued');if(queue.length)$('work-queue').append(node('h2','','Queue · '+queue.length));
  for(const job of queue){const row=node('div','queue-item'),name=state.projects.find(item=>item.id===job.project)?.name;row.append(node('span','',`${name||job.project} · ${job.message||'Attached files'}`));const cancel=node('button','','Cancel');cancel.onclick=async()=>{await api('/api/jobs/cancel',{id:job.id});await poll();};row.append(cancel);$('work-queue').append(row);}
  const latest=state.jobs.filter(job=>job.project===project&&!['queued','running'].includes(job.status)).slice(-3).reverse();
  for(const job of latest)$('work-queue').append(node('p','task-result',`${job.status}: ${job.message} — ${job.progress}`));
 }
 async function poll(){
  if(polling)return;polling=true;
  try{state=await api('/api/workspace');renderProjects();renderQueue();await host.updateWork(state);
   if(project&&!$('work-panel').hidden){await refreshFiles();if(page&&!dirty&&!saving&&!$('document-editor').contains(document.activeElement)&&document.activeElement!==$('document-source')){
    const fresh=await api((textFile?'/api/project-file':'/api/document')+'?path='+encodeURIComponent(page.path));
    if(fresh.revision!==page.revision){page=fresh;fileRevision=fresh.revision;blocks=textFile?[]:parseMarkdown(fresh.markdown);$('document-source').value=textFile?fresh.text:fresh.markdown;renderBlocks();notice('Updated by agent / filesystem');}
    if(!textFile){page.comments=fresh.comments;renderComments();}
   }}
  }catch(e){notice(e.message,true);}finally{polling=false;}
 }
 async function browse(path){const sequence=++browseSequence;$('folder-use').disabled=true;try{const result=await api('/api/directories'+(path?'?path='+encodeURIComponent(path):''));if(sequence!==browseSequence)return;folder=result;$('folder-path').value=folder.path;$('folder-list').replaceChildren();for(const child of folder.directories){const button=node('button','folder-item','▸ '+child.name);button.onclick=()=>browse(child.path);$('folder-list').append(button);}$('folder-error').textContent='';}catch(e){if(sequence===browseSequence)$('folder-error').textContent=e.message;}finally{if(sequence===browseSequence)$('folder-use').disabled=false;}}
 async function choose(mode){folderMode=mode;$('folder-dialog-title').textContent=mode==='create'?'Create a project in this folder':'Make this folder a project';$('folder-name').value='';$('folder-path').value='';$('folder-use').textContent=mode==='create'?'Create project':'Use this folder';$('folder-dialog').showModal();await browse();}
 $('new-project').onclick=()=>choose('create');$('add-folder').onclick=()=>choose('register');$('folder-cancel').onclick=()=>$('folder-dialog').close();$('folder-up').onclick=()=>browse(folder.parent);$('folder-go').onclick=()=>browse($('folder-path').value);
 $('folder-use').onclick=async()=>{try{const data=folderMode==='create'?{name:$('folder-name').value,parent:folder.path}:{path:folder.path,name:$('folder-name').value||undefined};const created=await api('/api/projects/'+(folderMode==='create'?'create':'register'),data);$('folder-dialog').close();await poll();await selectProject(created.project);const files=await api('/api/project-files?project='+encodeURIComponent(created.project));const roadmap=files.find(item=>item.name==='ROADMAP.md');if(roadmap)await openFile(roadmap.path);}catch(e){$('folder-error').textContent=e.message;}};
 $('project-chat').onclick=()=>{const item=selectedProject();if(item)host.selectChat(item.chat);};
 $('new-page').onclick=()=>newPage(false);$('new-task').onclick=()=>newPage(true);
 async function newPage(task){if(!project)return;const title=window.prompt(task?'Task name':'Page name');if(!title)return;try{await save();const created=await api('/api/documents/create',{project,title,parent:task?'projects/'+project+'/tasks.md':undefined});await refreshFiles();await openFile(created.path);}catch(e){notice(e.message,true);}}
 $('add-block').onclick=()=>{blocks.push({type:'text',text:'',dirty:true});changed();renderBlocks();$('document-editor').lastElementChild.querySelector('[contenteditable]').focus();};
 $('editor-mode').onchange=()=>{if(!page)return;if($('editor-mode').value==='source'){$('document-source').value=serializeMarkdown(blocks);$('document-editor').hidden=true;$('document-source').hidden=false;}else{blocks=parseMarkdown($('document-source').value);$('document-editor').hidden=false;$('document-source').hidden=true;renderBlocks();}};
 $('document-source').oninput=changed;
 $('reload-document').onclick=()=>{if(page&&(!dirty||window.confirm('Reload from disk and discard the unsaved draft?'))){dirty=false;openFile(page.path);}};
 $('delete-page').onclick=async()=>{if(page&&window.confirm('Move this page to the workspace trash?')){try{await api('/api/documents/delete',{path:page.path});page=null;dirty=false;$('document-editor').replaceChildren();await refreshFiles();}catch(e){notice(e.message,true);}}};
 $('comment-form').onsubmit=async event=>{event.preventDefault();if(!page||textFile)return;try{await save();const anchor=commentAnchor;await api('/api/documents/comment',{path:page.path,text:$('comment-text').value,anchor});$('comment-text').value='';await refreshPageComments();}catch(e){notice(e.message,true);}};
 $('document-prompt-form').onsubmit=async event=>{event.preventDefault();if(!project)return;try{await save();await api('/api/jobs/create',{project,message:$('document-prompt').value,document:page&&!textFile?page.path:undefined});$('document-prompt').value='';await poll();notice('Queued with current project context');}catch(e){notice(e.message,true);}};
 document.addEventListener('selectionchange',()=>{const selection=window.getSelection();if($('document-editor').contains(selection?.anchorNode)&&selection.toString())commentAnchor=selection.toString();});
 window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
 $('work-tab').onclick=()=>host.showWorkspace();
 setInterval(()=>{if(!document.hidden)poll();},1800);
 return {async start(){await poll();if(state.projects.length)await selectProject(state.projects[0].id);},selectChatProject(id){const item=state.projects.find(item=>item.chat===id);if(item){project=item.id;renderProjects();}},save};
}
