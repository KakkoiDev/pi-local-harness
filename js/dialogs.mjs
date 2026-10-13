// Alerts and the name dialog. They replace window.confirm and window.prompt; Esc always means the default (safe) button.
import { icon } from './ui.mjs';
const $=id=>document.getElementById(id);
function settle(dialog,read){return new Promise(resolve=>{dialog.addEventListener('close',()=>resolve(read(dialog.returnValue)),{once:true});dialog.returnValue='';dialog.showModal();});}
export function ask({icon:kind='caution',message,detail='',danger,safe}){
 $('alert-icon').replaceChildren(icon('alert-'+kind));$('alert-message').textContent=message;$('alert-detail').textContent=detail;
 $('alert-danger').textContent=danger;$('alert-default').textContent=safe;
 const shown=settle($('alert-dialog'),value=>value==='danger'?'danger':'default');$('alert-default').focus();return shown;
}
$('name-dialog-cancel').onclick=()=>$('name-dialog').close('cancel');
export function askName({title,label,help='',describe,value='',action='Create',actionFor,mono=false,selectStem=false}){
 // describe(value) keeps the help naming the exact file as the person types (Dialogs2 › New Page); actionFor(value) names the
 // default button (Rename or Move, W_Rename); selectStem selects the name without its extension, so typing replaces only that.
 const input=$('name-dialog-input');$('name-dialog-title').textContent=title;$('name-dialog-label').textContent=label;input.value=value;input.classList.toggle('pw-mono',mono);
 const show=()=>{const typed=input.value.trim();$('name-dialog-help').textContent=describe?describe(typed):help;$('name-dialog-ok').textContent=actionFor?actionFor(typed):action;};input.oninput=show;show();
 const settled=settle($('name-dialog'),result=>result==='ok'?input.value.trim()||null:null);
 if(selectStem&&value){const start=value.lastIndexOf('/')+1,dot=value.lastIndexOf('.');input.setSelectionRange(start,dot>start?dot:value.length);}
 return settled;
}
