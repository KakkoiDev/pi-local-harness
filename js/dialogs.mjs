// Alerts and the name dialog. They replace window.confirm and window.prompt; Esc always means the default (safe) button.
import { icon } from './ui.mjs';
const $=id=>document.getElementById(id);
function settle(dialog,read){return new Promise(resolve=>{dialog.addEventListener('close',()=>resolve(read(dialog.returnValue)),{once:true});dialog.returnValue='';dialog.showModal();});}
// plain: the other button is an ordinary one (Show in Activity, Cancel), not a destructive one. escape: what Esc means
// when the default button acts (Remove from List: Return removes, Esc cancels).
export function ask({icon:kind='caution',message,detail='',danger,safe,plain=false,escape='default'}){
 $('alert-icon').replaceChildren(icon('alert-'+kind));$('alert-message').textContent=message;$('alert-detail').textContent=detail;
 $('alert-danger').textContent=danger;$('alert-default').textContent=safe;$('alert-danger').classList.toggle('pw-dialog__danger',!plain);
 const shown=settle($('alert-dialog'),value=>value==='danger'?'danger':value==='default'?'default':escape);$('alert-default').focus();return shown;
}
$('name-dialog-cancel').onclick=()=>$('name-dialog').close('cancel');
export function askName({title,label,help='',describe,value='',action='Create',actionFor,mono=false,selectStem=false,check}){
 // describe(value) keeps the help naming the exact file as the person types (Dialogs2 › New Page); actionFor(value) names the
 // default button (Rename or Move, W_Rename); selectStem selects the name without its extension, so typing replaces only that.
 const input=$('name-dialog-input');$('name-dialog-title').textContent=title;$('name-dialog-label').textContent=label;input.value=value;input.classList.toggle('pw-mono',mono);
 const show=()=>{const typed=input.value.trim();$('name-dialog-help').textContent=describe?describe(typed):help;$('name-dialog-ok').textContent=actionFor?actionFor(typed):action;};input.oninput=show;show();
 // check(value) runs on Return: an error message keeps the dialog open with the error in the help line and the name selected
 // (Dialog card, round 5: a notice after the dialog closed came too late to fix the name).
 const form=$('name-dialog').querySelector('form');form.onsubmit=check?async event=>{event.preventDefault();const typed=input.value.trim();if(!typed)return;$('name-dialog-ok').disabled=true;let problem;try{problem=await check(typed);}finally{$('name-dialog-ok').disabled=false;}if(problem){$('name-dialog-help').textContent=problem;input.focus();input.select();return;}$('name-dialog').close('ok');}:null;
 const settled=settle($('name-dialog'),result=>result==='ok'?input.value.trim()||null:null);
 if(selectStem&&value){const start=value.lastIndexOf('/')+1,dot=value.lastIndexOf('.');input.setSelectionRange(start,dot>start?dot:value.length);}
 return settled;
}

/** Ask Pi to Retry… (plan 184, A_Retry): the stopped request quoted, an optional note; resolves {note} or null on Cancel. */
export function askRetry({request,project}){
 $('retry-dialog-request').textContent=`“${request}”`;$('retry-dialog-note').value='';
 $('retry-dialog-help').textContent=`Queues the request again in ${project}. The failed run stays in its record.`;
 $('retry-dialog-cancel').onclick=()=>$('retry-dialog').close('');
 const settled=settle($('retry-dialog'),result=>result==='ok'?{note:$('retry-dialog-note').value.trim()}:null);
 $('retry-dialog-note').focus();
 return settled;
}
