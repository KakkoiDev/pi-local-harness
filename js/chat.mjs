import { decodeLines, applyDelta } from './chat-state.mjs';
const $ = id => document.getElementById(id);
const node = (tag, className, text) => { const element=document.createElement(tag);if(className)element.className=className;if(text!==undefined)element.textContent=text;return element; };
let selecting=false, selected=null, conversations=[], current=null, maxFileBytes=12*1024*1024, recorder, recordStream;
const drafts=new Map(), running=new Map();
function draft(id=selected){if(!drafts.has(id))drafts.set(id,{text:'',files:[]});return drafts.get(id);}
function error(message){$('error').textContent=message;$('error').hidden=!message;}
async function api(path,body){const response=await fetch(path,body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await response.json();if(!response.ok)throw new Error(data.error||'Request failed');return data;}
function menu(open){document.body.classList.toggle('menu-open',open);$('backdrop').hidden=!open;$('open-menu').setAttribute('aria-expanded',String(open));}
$('open-menu').onclick=()=>menu(true);$('close-menu').onclick=$('backdrop').onclick=()=>menu(false);
document.addEventListener('keydown',event=>{if(event.key==='Escape')menu(false);});
function renderSidebar(){
 $('conversations').replaceChildren();
 for(const conversation of conversations){
  const row=node('div',`conversation${conversation.id===selected?' active':''}`);
  const button=node('button','conversation-select',conversation.title);button.title=conversation.title;button.onclick=()=>select(conversation.id).catch(e=>error(e.message));if(conversation.id===selected)button.setAttribute('aria-current','page');
  const rename=node('button','manage','✎');rename.setAttribute('aria-label',`Rename ${conversation.title}`);rename.onclick=async()=>{const title=window.prompt('Conversation name',conversation.title);if(title!==null)try{await api(`/api/conversations/${conversation.id}/rename`,{title});await refresh();}catch(e){error(e.message);}};
  const remove=node('button','manage','×');remove.setAttribute('aria-label',`Delete ${conversation.title}`);remove.onclick=async()=>{if(!window.confirm(`Delete “${conversation.title}” and its files?`))return;try{await api(`/api/conversations/${conversation.id}/delete`,{});drafts.delete(conversation.id);await refresh();if(selected===conversation.id){selected=null;if(conversations.length)await select(conversations[0].id);else await create();}}catch(e){error(e.message);}};
  row.append(button,rename,remove);$('conversations').append(row);
 }
}
async function refresh(){conversations=await api('/api/conversations');renderSidebar();}
async function select(id){
 selecting=true;controls();
 try {
 if(selected){draft().text=$('prompt').value;}
 const value=await api(`/api/conversations/${id}`);selected=id;current=value;localStorage.setItem('pi-chat-selected',id);
 $('prompt').value=draft().text;error('');menu(false);renderSidebar();renderMessages();renderAttachments();resize();
 } finally { selecting=false;controls(); }
}
async function create(){selecting=true;controls();try{const value=await api('/api/conversations',{});await refresh();await select(value.id);$('prompt').focus();}finally{selecting=false;controls();}}
$('new-chat').onclick=()=>create().catch(e=>error(e.message));
function messageView(message){
 const article=node('article',`message ${message.role}`),label=node('div','message-label',message.role==='user'?'You':'Pi');
 if(message.timestamp){const time=node('time','',new Date(message.timestamp).toLocaleString());time.dateTime=message.timestamp;label.append(time);}
 article.append(label);
 if(message.thinking){const details=node('details'),summary=node('summary','','Reasoning');details.append(summary,node('pre','',message.thinking));article.append(details);}
 const body=node('div','message-body',message.content||'');article.append(body);
 for(const file of message.attachments||[]){
  if(file.mime.startsWith('image/')){const image=node('img');image.src=file.url;image.alt=file.name;article.append(image);}
  if(file.mime.startsWith('audio/')){const audio=node('audio');audio.src=file.url;audio.controls=true;article.append(audio);}
  const link=node('a','file-link',`↗ ${file.name}`);link.href=file.url;link.download=file.name;article.append(link);
 }
 return article;
}
function renderMessages(){
 const state=running.get(selected);$('welcome').hidden=Boolean(current?.messages.length||state);
 $('messages').replaceChildren(...(current?.messages||[]).map(messageView));
 if(state){
  const article=messageView({role:'assistant',content:state.text,thinking:state.thinking});article.id='live-message';article.append(node('div','status',state.status));$('messages').append(article);
 }
 $('thread').scrollTop=$('thread').scrollHeight;
}
function updateLive(id){if(id!==selected)return;const state=running.get(id);if(!state)return;let live=$('live-message');if(!live){renderMessages();live=$('live-message');}const nearBottom=$('thread').scrollHeight-$('thread').scrollTop-$('thread').clientHeight<150;live.querySelector('.message-body').textContent=state.text;live.querySelector('.status').textContent=state.status;let details=live.querySelector('details');if(state.thinking){if(!details){details=node('details');details.append(node('summary','','Reasoning'),node('pre'));live.insertBefore(details,live.querySelector('.message-body'));}details.querySelector('pre').textContent=state.thinking.slice(-50000);}if(nearBottom)$('thread').scrollTop=$('thread').scrollHeight;}
function controls(){const busy=running.has(selected);$('send').hidden=busy;$('stop').hidden=!busy;$('send').disabled=!selected||selecting;$('prompt').disabled=selecting;$('new-chat').disabled=selecting;}
function resize(){$('prompt').style.height='auto';$('prompt').style.height=Math.min($('prompt').scrollHeight,180)+'px';}
$('prompt').oninput=()=>{draft().text=$('prompt').value;resize();};
$('prompt').onkeydown=event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing&&window.matchMedia('(min-width:761px)').matches){event.preventDefault();if(!running.has(selected))$('composer').requestSubmit();}};
function renderAttachments(){$('attachments').replaceChildren();draft().files.forEach((file,index)=>{const chip=node('div','attachment-chip');if(file.type.startsWith('image/')){const image=node('img');image.src=file.preview;image.alt='';chip.append(image);}chip.append(node('span','',file.name));const remove=node('button','','×');remove.type='button';remove.setAttribute('aria-label',`Remove ${file.name}`);remove.onclick=()=>{URL.revokeObjectURL(file.preview);draft().files.splice(index,1);renderAttachments();};chip.append(remove);$('attachments').append(chip);});}
function addFiles(files){error('');for(const file of files){if(draft().files.length>=8){error('Attach at most eight files.');break;}if(file.size>maxFileBytes){error(`${file.name} exceeds 12 MiB.`);continue;}if([...draft().files,file].reduce((sum,f)=>sum+f.size,0)>20*1024*1024){error('Keep the total attachments below 20 MiB.');continue;}draft().files.push({file,name:file.name,size:file.size,type:file.type,preview:URL.createObjectURL(file)});}renderAttachments();}
$('attach').onclick=()=>$('files').click();$('files').onchange=()=>{addFiles($('files').files);$('files').value='';};
$('composer').ondragover=event=>{event.preventDefault();$('composer').classList.add('dragging');};$('composer').ondragleave=()=>$('composer').classList.remove('dragging');$('composer').ondrop=event=>{event.preventDefault();$('composer').classList.remove('dragging');addFiles(event.dataTransfer.files);};
$('prompt').addEventListener('paste',event=>{if(event.clipboardData.files.length){event.preventDefault();addFiles(event.clipboardData.files);}});
async function encode(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve({name:file.name,mime:file.type,data:String(reader.result).split(',')[1]});reader.onerror=()=>reject(new Error(`Cannot read ${file.name}`));reader.readAsDataURL(file.file);});}
$('composer').onsubmit=async event=>{
 event.preventDefault();if(!selected||running.has(selected))return;const id=selected,submitted=draft();const text=$('prompt').value.trim();if(!text&&!submitted.files.length)return;error('');
 const state={text:'',thinking:'',status:'Sending…'};running.set(id,state);controls();renderMessages();let sent=false;
 try{
  const attachments=await Promise.all(submitted.files.map(encode));
  const response=await fetch(`/api/conversations/${id}/send`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text,attachments})});
  if(!response.ok)throw new Error((await response.json()).error||'Send failed');
  const reader=response.body.getReader(),decoder=new TextDecoder();let rest='';
  while(true){const {done,value}=await reader.read();const parsed=decodeLines(rest,decoder.decode(value||new Uint8Array(),{stream:!done}),done);rest=parsed.rest;
   for(const update of parsed.events){
    if(update.type==='conversation'||update.type==='done'){
     if(id===selected){current=update.conversation;renderMessages();}
     if(update.type==='conversation'&&!sent){sent=true;submitted.files.forEach(file=>URL.revokeObjectURL(file.preview));drafts.set(id,{text:'',files:[]});if(id===selected){$('prompt').value='';renderAttachments();resize();}await refresh();}
    }else{applyDelta(state,update);updateLive(id);}
    if(update.type==='error')throw new Error(update.error);
   }
   if(done)break;
  }
 }catch(e){if(id===selected)error(e.message);}
 finally{running.delete(id);await refresh().catch(()=>{});if(id===selected){current=await api(`/api/conversations/${id}`).catch(()=>current);renderMessages();controls();}}
};
$('stop').onclick=async()=>{try{await api(`/api/conversations/${selected}/stop`,{});}catch(e){error(e.message);}};
$('record').onclick=async()=>{
 if(recorder?.state==='recording'){recorder.stop();return;}
 if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){error('Audio recording is unavailable here. Attach an audio file instead.');return;}
 try{
  const recordingConversation=selected;recordStream=await navigator.mediaDevices.getUserMedia({audio:true});recorder=new MediaRecorder(recordStream);const chunks=[];
  recorder.ondataavailable=event=>{if(event.data.size)chunks.push(event.data);};
  recorder.onstop=()=>{recordStream.getTracks().forEach(track=>track.stop());$('record').classList.remove('recording');$('record').setAttribute('aria-label','Record audio');const type=recorder.mimeType;const file=new File(chunks,`recording-${Date.now()}.${type.includes('mp4')?'m4a':'webm'}`,{type});if(recordingConversation===selected)addFiles([file]);else{const stored={file,name:file.name,size:file.size,type:file.type,preview:URL.createObjectURL(file)};draft(recordingConversation).files.push(stored);}};
  recorder.start();$('record').classList.add('recording');$('record').setAttribute('aria-label','Stop recording');
 }catch(e){error(`Microphone unavailable: ${e.message}`);}
};
document.querySelectorAll('[data-prompt]').forEach(button=>{button.onclick=()=>{$('prompt').value=button.dataset.prompt;draft().text=$('prompt').value;resize();$('prompt').focus();};});
try{const config=await api('/api/config');$('model').textContent=config.model;maxFileBytes=config.maxFileBytes;await refresh();const remembered=localStorage.getItem('pi-chat-selected');if(conversations.length)await select(conversations.some(c=>c.id===remembered)?remembered:conversations[0].id);else await create();}catch(e){error(`Cannot connect to local chat: ${e.message}`);}
