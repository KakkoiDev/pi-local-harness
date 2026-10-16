// Small, structured music tool. No model-generated JavaScript is executed.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync, renameSync, rmSync, lstatSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import { name, validate, revise, source } from './music/score.mjs';
import { toneInfo } from './music/tone.mjs';
import { decodeWav, encodeWav } from './music/wav.mjs';
const run=promisify(execFile),local=fileURLToPath(new URL('./music/',import.meta.url));
const read=path=>JSON.parse(readFileSync(path,'utf8'));
const save=(path,value)=>writeFileSync(path,JSON.stringify(value,null,2)+'\n');
const blips=async args=>JSON.parse((await run(process.env.PI_BLIPS||'blips',[...args,'--json'],{timeout:30000,maxBuffer:2*1024*1024})).stdout);
function safeFolder(cwd,id){
 const parts=['assets','music',name(id)];let path=cwd;
 for(const part of parts){path=join(path,part);if(existsSync(path)&&lstatSync(path).isSymbolicLink())throw Error('Music folders must not be symlinks');}
 return path;
}
export function musicAvailable(cwd){return existsSync(join(cwd,'assets/music'));}
export async function musicAction(input,{cwd=process.cwd(),cli=blips,exportSound,signal}={}){
 if(signal?.aborted)throw Error('Stopped');
 if(input.action==='template')return read(join(local,'uplifting.json'));
 if(input.action==='catalog'){
  const category=input.category||(input.tone?'fanfare':'success');if(!/^[a-z-]+$/.test(category))throw Error('Invalid category');
  const candidates=await cli(['list','--category',category]);
  if(!Array.isArray(candidates))throw Error('Unexpected Blips catalog format');
  let sounds=candidates.slice(0,24).map(({id,name,tags,duration,librarySeed})=>({id,name,tags,duration,librarySeed}));
  if(input.tone){const details=await Promise.all(sounds.map(x=>cli(['show',x.id])));sounds=sounds.flatMap((sound,i)=>{const tone=toneInfo(details[i]);return tone?[{...sound,...tone}]:[];});}
  return {category,sounds,note:input.tone?'Stable first-note instruments: bank {lead:{id:"returned-id",tone:true}} enables notes. rootMidi and cropSeconds describe the isolated note.':'First 24 curated candidates; select IDs for a reusable project bank. No listening analysis is performed.'};
 }
 const folder=safeFolder(cwd,input.name),pointer=join(folder,'current.json');
 if(input.action==='read'){
  const {revision}=read(pointer),revisionFolder=join(folder,String(revision).padStart(4,'0'));
  return {name:input.name,revision,score:read(join(revisionFolder,'score.json')),bank:read(join(folder,'bank.json')),source:readFileSync(join(revisionFolder,'pattern.strudel'),'utf8')};
 }
 if(!['create','revise','render'].includes(input.action))throw Error('action must be template, catalog, read, create, revise or render');
 const creating=input.action==='create';
 if(creating&&existsSync(folder))throw Error('This music name already exists; read it, then revise');
 if(!creating&&!existsSync(pointer))throw Error('Music not found; create it first');
 const old=creating?null:await musicAction({action:'read',name:input.name},{cwd});
 if(!creating&&input.base!==old.revision)throw Error(`Read the current revision first; expected base ${old.revision}`);
 let bank=old?.bank;
 if(creating){
  if(!input.bank||typeof input.bank!=='object'||Array.isArray(input.bank)||Object.keys(input.bank).length<1||Object.keys(input.bank).length>8)throw Error('Select 1–8 Blips IDs as a bank: {chime:"success-003",click:"click-001"}');
  bank={};for(const [alias,selection] of Object.entries(input.bank)){
   name(alias);const id=typeof selection==='string'?selection:selection?.id;
   if(typeof selection==='object'&&(!selection||Object.keys(selection).some(k=>!['id','tone'].includes(k))||selection.tone!==true))throw Error('Instrument selection must be {id, tone:true}');
   if(typeof id!=='string'||!/^[-a-z]+-\d{3,4}$/.test(id))throw Error('Invalid Blips sound ID');
   const sound=await cli(['show',id]);if(sound.id!==id||!Number.isInteger(sound.librarySeed))throw Error('Blips must provide matching ID and librarySeed');
   const tone=selection?.tone?toneInfo(sound):null;
   if(selection?.tone&&!tone)throw Error(`${id} has no isolated stable first note; use catalog with tone:true`);
   bank[alias]={id,librarySeed:sound.librarySeed,tags:sound.tags||[],file:`samples/${alias}.wav`,...(tone||{})};
  }
  if(new Set(Object.values(bank).map(x=>x.librarySeed)).size!==1)throw Error('The bank must come from one Blips library seed');
 }
 const score=validate(creating?input.score:input.action==='revise'?revise(old.score,input.changes):old.score,bank);
 const parent=creating?dirname(folder):folder;mkdirSync(parent,{recursive:true});
 const stage=mkdtempSync(join(parent,'.music-'));const revision=(old?.revision||0)+1;
 try{
  if(creating){mkdirSync(join(stage,'samples'));for(const item of Object.values(bank)){
   const target=join(stage,item.file);
   if(exportSound)await exportSound(item.id,target);else await run(process.env.PI_BLIPS||'blips',['export',item.id,'--seed',String(item.librarySeed),'--to',dirname(target),'--name',target.split('/').at(-1)],{timeout:30000,signal,maxBuffer:1024*1024});
   const wav=decodeWav(readFileSync(target));
   if(item.cropSeconds!==undefined){const frames=Math.floor(item.cropSeconds*wav.rate);if(frames>wav.samples.length)throw Error('Blips note timing exceeds the WAV');const pcm=wav.samples.slice(0,frames);for(let i=0;i<pcm.length;i++)pcm[i]*=Math.min(1,i/(wav.rate*0.001),(pcm.length-1-i)/(wav.rate*0.005));writeFileSync(target,encodeWav(pcm,wav.rate));}
  }save(join(stage,'bank.json'),bank);}
  const bankFile=creating?join(stage,'bank.json'):join(folder,'bank.json');
  save(join(stage,'score.json'),score);writeFileSync(join(stage,'pattern.strudel'),source(score,bank));
  // Offline rendering runs in a bounded process, so a pathological mini pattern cannot hang Pi.
  const toolchain=join(process.env.PI_AGENT_DATA||join(homedir(),'pi-local-harness-data'),'toolchain/music');
  const runtime=existsSync(join(local,'node_modules/@strudel/core'))?local:toolchain;
  if(!existsSync(join(runtime,'node_modules/@strudel/core')))throw Error('Music renderer is not installed. Run: plh setup music');
  const output=join(stage,'audio.wav');
  const {stdout}=await run(process.execPath,['--max-old-space-size=256',join(runtime,'bootstrap.mjs'),join(stage,'score.json'),bankFile,output],{timeout:30000,signal,maxBuffer:1024*1024});
  const line=stdout.split('\n').find(x=>x.startsWith('PLH_MUSIC '));if(!line)throw Error('Renderer returned no audio validation');const stats=JSON.parse(line.slice(10));
  save(join(stage,'render.json'),{revision,stats,engine:'@strudel/core + @strudel/mini 1.2.6; PCM sample mixer',bank});
  // The complete revision is published only after successful evaluation and audible WAV validation.
  const revName=String(revision).padStart(4,'0');let published;
  if(creating){const rev=join(stage,revName);mkdirSync(rev);for(const file of ['score.json','pattern.strudel','audio.wav','render.json'])renameSync(join(stage,file),join(rev,file));save(join(stage,'current.json'),{revision});renameSync(stage,folder);published=join(folder,revName);}
  else {if(read(pointer).revision!==input.base)throw Error('Music revision changed; read before retrying');published=join(folder,revName);renameSync(stage,published);save(join(folder,'current.next.json'),{revision});renameSync(join(folder,'current.next.json'),pointer);}
  return {name:input.name,revision,stats,artifacts:['audio.wav','score.json','pattern.strudel','render.json'].map(x=>join(published,x)),bank:join(folder,'bank.json'),note:'Listen and request a revision by layer. The original bank samples and earlier revisions are preserved.'};
 } finally {if(existsSync(stage))rmSync(stage,{recursive:true,force:true});}
}
const sections={type:'array',minItems:1,maxItems:16,description:'Optional song form. Each section selects layer IDs for 1–32 cycles. Phrases restart at each section; sum(cycles)*240/bpm must equal seconds. Example: [{id:"intro",cycles:4,layers:["chords"]},{id:"theme",cycles:4,layers:["lead","chords","bass","beat"]}]',items:{type:'object',properties:{id:{type:'string'},cycles:{type:'integer',minimum:1,maximum:32},layers:{type:'array',items:{type:'string'}}},required:['id','cycles','layers']}};
const layer={type:'object',properties:{id:{type:'string'},sound:{type:'string',description:'Alias from bank, e.g. lead (not a Blips ID)'},rhythm:{type:'string',maxLength:160,description:'x triggers, ~ rests; groups [], alternation <>, repeats *; e.g. x ~ [x x] ~'},speed:{type:'string',maxLength:160,description:'Playback ratios, only for layers without notes; e.g. 1 1.25 1.5 2'},notes:{type:'string',maxLength:512,description:'Use instead of speed for a tone:true bank instrument. Cropped notes are short stabs, without sustain: use rhythm x*4 for chord/bass pulses each beat; x is one short hit per bar. Named pitches or MIDI, within +/-24 semitones of rootMidi. Spaces sequence notes within one cycle; <> alternates cycles; comma stacks chords. Four-bar C major phrase: <[E4 G4 A4 G4 E4 D4 C4 E4] [D4 G4 B4 A4 G4 E4 D4 G4] [C4 E4 A4 G4 E4 C4 E4 G4] [F4 A4 G4 E4 D4 E4 G4 C4]>. Match rhythm x*8 to eight notes per bar. Harmony: <[C4,E4,G4] [G3,B3,D4] [A3,C4,E4] [F3,A3,C4]>. Bass: <C3 G3 A3 F3>.'},gain:{type:'number',minimum:0,maximum:1}},required:['id','sound','rhythm','gain']};
export function installMusic(pi){
 pi.registerTool?.({name:'music',label:'Make music',description:'Create and revise local music/effects with curated Blips samples and Strudel timing. template returns a tested uplifting-major score scaffold; keep its timing and customize melody notes. catalog lists candidate Blips IDs. create selects an immutable bank and renders a score. read returns the current score and revision. revise patches named layers (read first, supply base); render rerenders the same score. Returns WAV and editable source as chat attachments. No JavaScript input. For tunes, select catalog tone:true in fanfare/startup, build a major-key four-bar motif plus chord/bass progression and quiet percussion, then arrange intro/theme/variation sections. Render promptly. A cycle is four beats. Example 20-second loop: bpm 96, seconds 20, loop true (8 cycles).',
 parameters:{type:'object',properties:{action:{type:'string',enum:['template','catalog','read','create','revise','render']},name:{type:'string',description:'Required except template/catalog; stable composition name, e.g. robot'},tone:{type:'boolean',description:'catalog only: return candidates with an isolated stable first note for pitched instruments'},category:{type:'string',enum:['click','blip','pop','toggle','success','error','notification','swoosh','coin','powerup','jump','laser','explosion','hit','sent','received','trash','confirm','reward','impact','zap','fanfare','gameover','countdown','startup','alarm']},base:{type:'integer'},bank:{type:'object',description:'REQUIRED create bank. Effects: {click: "click-001"}. Pitched instruments: {lead:{id:"fanfare-001",tone:true}} isolates the stable first note, records its pitch, enables notes. Use actual catalog IDs. Layer sound names use bank aliases.',additionalProperties:{anyOf:[{type:'string'},{type:'object',properties:{id:{type:'string'},tone:{const:true}},required:['id','tone']}]}},score:{type:'object',properties:{bpm:{type:'number',minimum:30,maximum:240},seconds:{type:'number',minimum:0.1,maximum:120},loop:{type:'boolean'},sections,layers:{type:'array',minItems:1,maxItems:8,items:layer}},required:['bpm','seconds','loop','layers']},changes:{type:'object',properties:{bpm:{type:'number',minimum:30,maximum:240},seconds:{type:'number',minimum:0.1,maximum:120},loop:{type:'boolean'},sections,layers:{type:'array',items:{...layer,required:['id']}},add:{type:'array',items:layer},remove:{type:'array',items:{type:'string'}}}}},required:['action']},
 async execute(_id,input,signal,_update,ctx){try {const result=await musicAction(input,{cwd:ctx?.cwd||process.cwd(),signal});return {content:[{type:'text',text:JSON.stringify(result)}],details:{musicName:result.name,artifacts:result.artifacts||[]}};}catch(error){return {content:[{type:'text',text:`Music failed: ${error.stderr||error.message}. ${input.action==='create'?'Fix the fields and retry create. Supply bank aliases mapped to catalog IDs; do not read before creation succeeds.':'Read the current score, fix the reported issue and retry; the last good revision is preserved.'}`}],isError:true,details:{}};}}
 });
}
