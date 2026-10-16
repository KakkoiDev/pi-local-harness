const ident=/^[a-z][a-z0-9_-]{0,39}$/;
export function name(value){if(typeof value!=='string'||!ident.test(value))throw Error('Use a name with lowercase letters, digits, underscores or hyphens (1–40 characters)');return value;}
const keys=(o,allowed)=>{if(!o||typeof o!=='object'||Array.isArray(o))throw Error('Expected an object');for(const key of Object.keys(o))if(!allowed.includes(key))throw Error(`Unknown field: ${key}`);};
export function midi(value){
 if(/^\d+$/.test(String(value))&&+value<=127)return +value;
 const m=/^([a-g])([#b]?)([0-8])$/i.exec(String(value));
 if(!m)throw Error(`Invalid note: ${value}; use MIDI 0–127 or names such as C4, F#4`);
 return (+m[3]+1)*12+({c:0,d:2,e:4,f:5,g:7,a:9,b:11}[m[1].toLowerCase()])+(m[2]==='#'?1:m[2]==='b'?-1:0);
}
export function validate(score,bank){
 keys(score,['bpm','seconds','loop','layers','sections']);
 if(!Number.isFinite(score.bpm)||score.bpm<30||score.bpm>240)throw Error('bpm must be 30–240');
 if(!Number.isFinite(score.seconds)||score.seconds<0.1||score.seconds>120)throw Error('seconds must be 0.1–120');
 if(typeof score.loop!=='boolean')throw Error('loop must be true or false');
 if(score.loop&&Math.abs(score.seconds*score.bpm/240-Math.round(score.seconds*score.bpm/240))>0.00001)throw Error('A loop must contain whole cycles: seconds = cycles * 240 / bpm');
 if(!Array.isArray(score.layers)||!score.layers.length||score.layers.length>8)throw Error('Use 1–8 layers');
 const seen=new Set();
 for(const layer of score.layers){
  keys(layer,['id','sound','rhythm','speed','gain','notes']);name(layer.id);if(seen.has(layer.id))throw Error('Duplicate layer id');seen.add(layer.id);
  if(!Object.hasOwn(bank,layer.sound))throw Error(`Unknown bank sound: ${layer.sound}`);
  if(typeof layer.rhythm!=='string'||layer.rhythm.length>160||!/^[x~\s\[\]<>*0-9]+$/.test(layer.rhythm))throw Error('rhythm uses x, ~, [], <>, and * repetitions only (max 160 characters)');
  for(const m of layer.rhythm.matchAll(/\*(\d+)/g))if(+m[1]>32||+m[1]<1)throw Error('Repeat count must be 1–32');
  if(layer.notes!==undefined){
   if(layer.speed!==undefined)throw Error('Use notes OR speed on a layer, not both');
   if(!Number.isFinite(bank[layer.sound].rootMidi))throw Error('notes requires a bank instrument selected with {id, tone:true}');
   if(typeof layer.notes!=='string'||!layer.notes.length||layer.notes.length>512||!/^[a-gA-G#b0-9\s\[\]<>,]+$/.test(layer.notes))throw Error('notes uses note names/MIDI numbers, [], <> and commas (max 512 characters)');
   const tokens=layer.notes.split(/[\s\[\]<>,]+/).filter(Boolean);if(!tokens.length)throw Error('notes must contain pitches');
   for(const token of tokens){const speed=2**((midi(token)-bank[layer.sound].rootMidi)/12);if(speed<0.25||speed>4)throw Error('Notes must be within two octaves of the bank instrument root');}
  }else if(typeof layer.speed!=='string'||layer.speed.length>160||!/^[0-9.\s\[\]<>]+$/.test(layer.speed))throw Error('speed is a mini-notation string of playback ratios, e.g. "1 1.25 1.5 2"');
  if(!Number.isFinite(layer.gain)||layer.gain<0||layer.gain>1)throw Error('gain must be 0–1');
 }
 if(score.sections!==undefined){
  if(!Array.isArray(score.sections)||!score.sections.length||score.sections.length>16)throw Error('Use 1–16 sections');
  const ids=new Set();let cycles=0;
  for(const section of score.sections){keys(section,['id','cycles','layers']);name(section.id);if(ids.has(section.id))throw Error('Duplicate section id');ids.add(section.id);
   if(!Number.isInteger(section.cycles)||section.cycles<1||section.cycles>32)throw Error('Section cycles must be 1–32');cycles+=section.cycles;
   if(!Array.isArray(section.layers)||!section.layers.length||new Set(section.layers).size!==section.layers.length||section.layers.some(id=>!seen.has(id)))throw Error('Sections must select existing, unique layer IDs');
  }
  if(Math.abs(cycles-score.seconds*score.bpm/240)>0.00001)throw Error('Section cycles must fill the duration: seconds = total cycles * 240 / bpm');
 }
 return score;
}
export function revise(score,changes){
 keys(changes,['bpm','seconds','loop','layers','add','remove','sections']);const next=structuredClone(score);
 for(const key of ['bpm','seconds','loop','sections'])if(Object.hasOwn(changes,key))next[key]=changes[key];
 if(changes.layers){if(!Array.isArray(changes.layers))throw Error('layers must be an array of patches');for(const patch of changes.layers){keys(patch,['id','sound','rhythm','speed','gain','notes']);const at=next.layers.findIndex(x=>x.id===patch.id);if(at<0)throw Error(`Unknown layer: ${patch.id}`);next.layers[at]={...next.layers[at],...patch};if(patch.notes!==undefined)delete next.layers[at].speed;else if(patch.speed!==undefined)delete next.layers[at].notes;}}
 if(changes.remove){if(!Array.isArray(changes.remove)||changes.remove.some(id=>!next.layers.some(x=>x.id===id)))throw Error('Unknown layer in remove');next.layers=next.layers.filter(x=>!changes.remove.includes(x.id));}
 if(changes.add){if(!Array.isArray(changes.add))throw Error('add must be an array');next.layers.push(...changes.add);}
 return next;
}
export function ratios(notes,root){return notes.replace(/[a-g][#b]?[0-8]|\d+/gi,n=>String(2**((midi(n)-root)/12)));}
export function source(score,bank={}){
 const expression=x=>`s(${JSON.stringify(x.rhythm)}).s(${JSON.stringify(x.sound)}).speed(${JSON.stringify(x.notes!==undefined?ratios(x.notes,bank[x.sound].rootMidi):x.speed)}).gain(${x.gain})`;
 const stack=ids=>`stack(\n${ids.map(id=>`  // ${id}${score.layers.find(x=>x.id===id).notes?' notes: '+score.layers.find(x=>x.id===id).notes.replace(/\s+/g,' '):''}\n  ${expression(score.layers.find(x=>x.id===id))}`).join(',\n')}\n)`;
 return `// Editable score.json is authoritative; load bank samples before using this export.\nsetcpm(${score.bpm}/4)\n`+(score.sections?`arrange(\n${score.sections.map(s=>`[${s.cycles}, ${stack(s.layers)}] /* ${s.id} */`).join(',\n')}\n)\n`:stack(score.layers.map(x=>x.id))+'\n');
}
