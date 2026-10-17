import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validate, revise } from '../../harness/music/score.mjs';
import { musicAction } from '../../harness/music.mjs';
import { encodeWav, decodeWav } from '../../harness/music/wav.mjs';

// Task 263: without the renderer the render tests say "Not run" and why; with CI set they run and fail instead of
// counting a skip as a pass.
const rendererMissing = !existsSync(new URL('../../harness/music/node_modules/@strudel/core', import.meta.url)) && !process.env.PI_TEST_MUSIC;
const notRun = rendererMissing && !process.env.CI && 'Not run: the music renderer is not installed in harness/music/node_modules (run npm ci there; it downloads). With CI set this test fails instead.';

test('create, read, revise named layer, preserve bank and old audible revision; failed render is atomic', {skip: notRun}, async () => {
 const root=mkdtempSync(join(tmpdir(),'plh-music-'));
 try {
  const pcm=Float32Array.from({length:4410},(_,i)=>Math.sin(i*0.06)*0.3*(1-i/4410));
  const sample=join(root,'sample.wav');writeFileSync(sample,encodeWav(pcm,44100));
  const cli=async(args)=>args[0]==='show'?{id:args[1],librarySeed:1,tags:['soft'],duration:0.1}:null;
  const exportSound=async(id,path)=>writeFileSync(path,readFileSync(sample));
  const options={cwd:root,cli,exportSound};
  const score={bpm:120,seconds:2,loop:true,layers:[{id:'melody',sound:'chime',rhythm:'x ~ x ~',speed:'1 1.5',gain:0.3},{id:'beat',sound:'click',rhythm:'x*4',speed:'1',gain:0.2}]};
  const first=await musicAction({action:'create',name:'robot',bank:{chime:'success-003',click:'click-001'},score},options);
  assert.equal(first.revision,1);assert.equal(first.stats.events,6);assert.ok(first.stats.rms>0);assert.ok(first.artifacts.some(x=>x.endsWith('.wav')));
  const before=await musicAction({action:'read',name:'robot'},options);
  const next=await musicAction({action:'revise',name:'robot',base:1,changes:{layers:[{id:'beat',gain:0.05}]}},options);
  assert.equal(next.revision,2);
  const after=await musicAction({action:'read',name:'robot'},options);
  assert.deepEqual(after.score.layers[0],before.score.layers[0]);assert.equal(after.score.layers[1].gain,0.05);
  assert.deepEqual(after.bank,before.bank);assert.ok(decodeWav(readFileSync(first.artifacts[0])).samples.length>0);
  assert.notEqual(readFileSync(next.artifacts[0]).toString('base64'),readFileSync(first.artifacts[0]).toString('base64'));
  await assert.rejects(musicAction({action:'revise',name:'robot',base:1,changes:{bpm:90}},options),/revision/i);
  await assert.rejects(musicAction({action:'revise',name:'robot',base:2,changes:{layers:[{id:'melody',rhythm:'[x'}]}},options));
  assert.equal((await musicAction({action:'read',name:'robot'},options)).revision,2);
  assert.throws(()=>decodeWav(Buffer.from('invalid')),/WAV/);
  await assert.rejects(musicAction({action:'read',name:'../outside'},options),/name/i);
  await assert.rejects(musicAction({action:'revise',name:'robot',base:2,changes:{layers:[{id:'missing',gain:0.1}]}},options),/layer/i);
 } finally {rmSync(root,{recursive:true,force:true});}
});


test('score bounds, exact loop length, supported syntax and patches are validated without Strudel installed', () => {
 const bank={chime:{}}, score={bpm:120,seconds:2,loop:true,layers:[{id:'melody',sound:'chime',rhythm:'x ~ x ~',speed:'1',gain:0.3}]};
 assert.equal(validate(score,bank),score);
 for(const change of [{seconds:121},{seconds:3},{bpm:0},{layers:[]},{layers:[{...score.layers[0],sound:'missing'}]},{layers:[{...score.layers[0],rhythm:'x*999'}]},{layers:[{...score.layers[0],gain:2}]}])assert.throws(()=>validate({...score,...change},bank));
 assert.throws(()=>revise(score,{effects:'reverb'}),/Unknown field/);
 assert.throws(()=>revise(score,{remove:['missing']}),/Unknown layer/);
 assert.equal(revise(score,{layers:[{id:'melody',gain:0.1}]}).layers[0].gain,0.1);
 assert.equal(score.layers[0].gain,0.3);
});

test('pitched Blips instruments, multi-bar phrases, chord stacks and section revisions render together', {skip: notRun}, async () => {
 const root=mkdtempSync(join(tmpdir(),'plh-song-'));
 try {
  const params={wave_type:0,p_base_freq:Math.sqrt(261.625565/3528-0.001),p_freq_ramp:0,p_freq_dramp:0,p_arp_mod:0,p_repeat_speed:0,p_vib_strength:0,p_duty_ramp:0,p_lpf_ramp:0,p_hpf_ramp:0};
  const sound={id:'fanfare-001',librarySeed:1,duration:0.3,parts:[{start:0,duration:0.15,params},{start:0.1,duration:0.2,params}]};
  const options={cwd:root,cli:async args=>args[0]==='list'?[sound]:sound,exportSound:async(id,path)=>writeFileSync(path,encodeWav(Float32Array.from({length:13230},(_,i)=>Math.sin(i*2*Math.PI*261.625565/44100)*0.3),44100))};
  const catalog=await musicAction({action:'catalog',category:'fanfare',tone:true},options);
  assert.equal(catalog.sounds.length,1);assert.ok(Math.abs(catalog.sounds[0].rootMidi-60)<0.001);
  const score={bpm:120,seconds:8,loop:true,layers:[{id:'lead',sound:'tone',rhythm:'x*4',notes:'<C4 E4>',gain:0.3},{id:'chords',sound:'tone',rhythm:'x',notes:'C4,E4,G4',gain:0.15}],sections:[{id:'intro',cycles:2,layers:['lead']},{id:'theme',cycles:2,layers:['lead','chords']}]};
  const first=await musicAction({action:'create',name:'song',bank:{tone:{id:'fanfare-001',tone:true}},score},options);
  assert.equal(first.stats.events,22);assert.ok(first.stats.rms>0);
  const before=await musicAction({action:'read',name:'song'},options);
  const sample=decodeWav(readFileSync(join(root,'assets/music/song/samples/tone.wav')));
  assert.equal(sample.samples.length,Math.floor(0.099*44100));assert.ok(Math.abs(sample.samples.at(-1))<0.0001);
  const pcm=decodeWav(readFileSync(first.artifacts[0])).samples;
  // The second cycle transposes C4 to E4; the third resets the two-cycle phrase at the section boundary.
  const crossings=offset=>{let count=0;for(let i=offset+1;i<offset+3000;i++)if(pcm[i-1]<0&&pcm[i]>=0)count++;return count;};
  assert.ok(crossings(88200)>crossings(0));
  assert.ok(before.source.includes('arrange('));assert.ok(before.source.includes('1.2599'));assert.doesNotThrow(()=>new Function(before.source));
  const second=await musicAction({action:'revise',name:'song',base:1,changes:{layers:[{id:'lead',notes:'<G4 C5>'}],sections:[{id:'intro',cycles:1,layers:['lead']},{id:'theme',cycles:3,layers:['lead','chords']}]}},options);
  assert.equal(second.stats.events,25);
  const after=await musicAction({action:'read',name:'song'},options);
  assert.deepEqual(after.bank,before.bank);assert.deepEqual(after.score.layers[1],before.score.layers[1]);assert.equal(before.score.layers[0].notes,'<C4 E4>');
  await assert.rejects(musicAction({action:'revise',name:'song',base:2,changes:{layers:[{id:'lead',notes:'C8'}]}},options),/two octaves/);
  assert.equal((await musicAction({action:'read',name:'song'},options)).revision,2);
 } finally {rmSync(root,{recursive:true,force:true});}
});

test('notes and arrangement validation reject untuned samples, ambiguous pitch controls and broken sections', async () => {
 const {toneInfo}=await import('../../harness/music/tone.mjs');
 const {midi,ratios}=await import('../../harness/music/score.mjs');
 assert.equal(midi('C4'),60);assert.equal(midi('F#4'),66);assert.equal(midi('Bb3'),58);assert.equal(ratios('<C4 C5>',60),'<1 2>');
 const bank={tone:{rootMidi:60}}, score={bpm:120,seconds:8,loop:true,layers:[{id:'lead',sound:'tone',rhythm:'x*4',notes:'<C4 E4 G4 C5>',gain:0.3}],sections:[{id:'theme',cycles:4,layers:['lead']}]};
 assert.equal(validate(score,bank),score);
 for(const notes of ['C9','C4;process.exit()','999','C1','[]'])assert.throws(()=>validate({...score,layers:[{...score.layers[0],notes}]},bank));
 assert.throws(()=>validate(score,{tone:{}}),/tone:true/);
 assert.throws(()=>validate({...score,layers:[{...score.layers[0],speed:'1'}]},bank),/OR/);
 for(const sections of [[],[{id:'theme',cycles:3,layers:['lead']}],[{id:'theme',cycles:4,layers:['missing']}],[{id:'theme',cycles:4,layers:['lead','lead']}],[{id:'theme',cycles:4.5,layers:['lead']}]])assert.throws(()=>validate({...score,sections},bank));
 assert.equal(revise(score,{layers:[{id:'lead',speed:'1'}]}).layers[0].notes,undefined);
 assert.equal(revise({...score,layers:[{...score.layers[0],notes:undefined,speed:'1'}]},{layers:[{id:'lead',notes:'C4'}]}).layers[0].speed,undefined);
 const params={wave_type:0,p_base_freq:0.3,p_freq_ramp:0,p_freq_dramp:0,p_arp_mod:0,p_repeat_speed:0,p_vib_strength:0,p_duty_ramp:0,p_lpf_ramp:0,p_hpf_ramp:0};
 assert.ok(toneInfo({duration:1,params}));
 assert.equal(toneInfo({duration:1,params:{...params,p_freq_ramp:0.1}}),null);
 assert.equal(toneInfo({duration:1,parts:[{start:0,duration:0.2,params},{start:0,duration:0.2,params}]}),null);
});

test('uplifting composition scaffold is usable without planning timing or installing Strudel', async () => {
 const template=await musicAction({action:'template'});
 assert.equal(template.style,'uplifting-major');
 const bank={lead:{rootMidi:62},chords:{rootMidi:62},bass:{rootMidi:60},click:{}};
 assert.equal(validate(template.score,bank),template.score);
 assert.deepEqual(template.score.sections.map(x=>x.id),['intro','theme','variation','return']);
 assert.equal(template.score.seconds,32);
 const again=await musicAction({action:'template'});template.score.layers[0].gain=0;
 assert.equal(again.score.layers[0].gain,0.3);
});

test('a revision folder that already exists is never overwritten, even an empty one (task 291)', async () => {
 const root=mkdtempSync(join(tmpdir(),'plh-music-'));
 try{
  const folder=join(root,'assets/music/robot'),first=join(folder,'0001');mkdirSync(first,{recursive:true});
  const score=(await musicAction({action:'template'}));
  writeFileSync(join(folder,'current.json'),JSON.stringify({revision:1}));writeFileSync(join(folder,'bank.json'),'{}');
  writeFileSync(join(first,'score.json'),JSON.stringify(score));writeFileSync(join(first,'pattern.strudel'),'');
  mkdirSync(join(folder,'0002'));
  await assert.rejects(musicAction({action:'render',name:'robot',base:1},{cwd:root}),/0002 already exists/);
  assert.deepEqual(JSON.parse(readFileSync(join(folder,'current.json'),'utf8')),{revision:1});
 } finally {rmSync(root,{recursive:true,force:true});}
});
