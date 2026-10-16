// Round 9: the source clone's safe updater, and the phone's Home Screen instructions.
import {readState,writeState} from './ui.mjs';
export const awayFromMac=host=>!['localhost','127.0.0.1','[::1]','::1'].includes(host);
export function updateView(value){
 const why=value.why||'';
 if(value.state==='available')return {title:'A new version of Pi Workbench is ready',detail:'Takes about a minute. Your projects, chats and settings are not touched. Pi’s current request finishes first.',changes:(value.changes||[]).slice(0,20),action:'Update',cancel:'Later'};
 if(value.state==='updated')return {title:`Updated to ${value.commit||'the new version'}. Restart plh to use it.`,detail:'Quit plh: Quit in the π menu-bar item, or Control-C in its terminal.\nStart it again: open Pi Workbench, or type plh.\nThis page reconnects by itself.'};
 if(value.state==='current')return {title:'Pi Workbench is up to date.',detail:'Checked just now. It checks again once a day.'};
 if(value.state==='blocked')return {title:/its own changes/.test(why)?'This copy is not updated automatically.':'Pi Workbench can’t update yet.',detail:why+'\nNothing was changed.',action:/its own changes/.test(why)?'Ask Pi to Update':'Ask Pi to Save Them'};
 return {title:'Can’t check for updates right now.',detail:'GitHub can’t be reached from this Mac. Check the connection, then try again.',action:'Try Again'};
}
const node=(tag,cls='',text)=>{const el=document.createElement(tag);el.className=cls;if(text!==undefined)el.textContent=text;return el;};
const button=(text,action,primary=false)=>{const el=node('button','pw-btn'+(primary?' pw-btn--default':''),text);el.type='button';el.onclick=action;return el;};
export function installUpdates({api,askPi,error}){
 const dialog=node('dialog','pw-dialog'),title=node('h2','pw-dialog__title'),detail=node('p','pw-help'),changes=node('ul','pw-update-changes'),actions=node('div','pw-dialog__actions');dialog.id='updates-dialog';title.id='updates-title';dialog.setAttribute('aria-labelledby',title.id);detail.style.whiteSpace='pre-line';dialog.append(title,detail,changes,actions);document.body.append(dialog);
 let current={},timer;
 function mark(value){current=value;const available=value.state==='available';for(const el of document.querySelectorAll('[data-update-mark]'))el.hidden=!available;for(const el of document.querySelectorAll('[data-update-label]'))el.textContent=available?'● New version':'';}
 function draw(value){mark(value);const view=updateView(value);title.textContent=view.title;detail.replaceChildren(...view.detail.split('\n').flatMap((text,index)=>[...(index?[document.createElement('br')]:[]),node('span','',text)]));changes.replaceChildren(...(view.changes||[]).map(text=>{const li=node('li','',text);li.dataset.noTranslate='';return li;}));changes.hidden=!view.changes?.length;actions.replaceChildren(button(view.cancel||'Done',()=>dialog.close(),!view.action));if(view.action)actions.append(button(view.action,()=>act(value,view.action),true));}
 async function act(value,action){
  if(action.startsWith('Ask Pi')){dialog.close();askPi(action==='Ask Pi to Update'?'Update Pi Workbench, keeping this copy’s own changes.':'Save Pi Workbench’s edited files as a commit first, then update it.');return;}
  title.textContent=action==='Update'?'Updating Pi Workbench…':'Checking for updates…';detail.textContent=action==='Update'?'Keep this window open. Pi’s current request finishes first.':'';changes.hidden=true;actions.replaceChildren();
  try{
   if(action==='Update')while((await api('/api/workspace')).jobs.some(job=>['queued','running'].includes(job.status)))await new Promise(resolve=>setTimeout(resolve,2000));
   draw(await api('/api/updates',{action:action==='Update'?'apply':'check'}));
  }catch(problem){draw({state:'unknown'});error(problem.message);}
 }
 async function open(){if(!dialog.open)dialog.showModal();await act(current,'Try Again');}
 async function daily(){try{mark(await api('/api/updates'));}catch{}timer=setTimeout(daily,60000);}
 const install=node('dialog','pw-dialog'),heading=node('h2','pw-dialog__title','Add to Home Screen'),copy=node('p','','Add Pi Workbench to this phone. It opens the workbench running on your Mac: Pi and the model keep running there, nothing runs on this phone. The Mac must be on and Tailscale connected.'),platform=node('div','pw-seg'),steps=node('ol'),done=node('div','pw-dialog__actions');install.id='install-dialog';heading.id='install-title';install.setAttribute('aria-labelledby',heading.id);platform.setAttribute('role','radiogroup');platform.setAttribute('aria-label','Phone');
 const choose=value=>{for(const el of platform.children)el.setAttribute('aria-checked',String(el.dataset.value===value));steps.replaceChildren(...(value==='iphone'?['Tap Share at the bottom of Safari.','Choose Add to Home Screen.','Tap Add.']:['Open the ⋮ menu.','Choose Install app.']).map(text=>node('li','',text)));};
 for(const [value,label] of [['iphone','iPhone'],['android','Android']]){const el=button(label,()=>choose(value));el.dataset.value=value;el.setAttribute('role','radio');platform.append(el);}choose('iphone');done.append(button('Done',()=>install.close(),true));install.append(heading,copy,platform,steps,node('p','pw-help','The π icon opens the workbench full screen.'),done);document.body.append(install);
 const remote=awayFromMac(location.hostname);for(const el of document.querySelectorAll('[data-command="install-app"]'))el.hidden=!remote;
 function homeScreen(){if(remote&&!install.open){writeState('installSeen',true);install.showModal();}}
 if(remote&&!readState('installSeen',false))homeScreen();daily();
 return {open,homeScreen,dispose:()=>clearTimeout(timer)};
}
