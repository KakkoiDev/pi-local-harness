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
export function askName({title,label,help=''}){
 $('name-dialog-title').textContent=title;$('name-dialog-label').textContent=label;$('name-dialog-help').textContent=help;$('name-dialog-input').value='';
 return settle($('name-dialog'),value=>value==='ok'?$('name-dialog-input').value.trim()||null:null);
}
