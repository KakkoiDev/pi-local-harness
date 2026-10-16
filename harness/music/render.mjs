import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { s, stack, arrange, setStringParser } from '@strudel/core';
import { mini } from '@strudel/mini';
import { decodeWav, encodeWav } from './wav.mjs';
import { validate, ratios } from './score.mjs';
setStringParser(mini);
const [scorePath,bankPath,output]=process.argv.slice(2);
try {
 const score=JSON.parse(readFileSync(scorePath)),bank=JSON.parse(readFileSync(bankPath));
 validate(score,bank);
 const layers=new Map(score.layers.map(layer=>[layer.id,s(layer.rhythm).s(layer.sound).speed(layer.notes!==undefined?ratios(layer.notes,bank[layer.sound].rootMidi):layer.speed).gain(layer.gain)]));
 const pattern=score.sections?arrange(...score.sections.map(section=>[section.cycles,stack(...section.layers.map(id=>layers.get(id)))])):stack(...layers.values());
 const rate=44100,cps=score.bpm/240,length=Math.round(score.seconds*rate),pcm=new Float32Array(length);
 const sounds=new Map(Object.entries(bank).map(([name,item])=>[name,decodeWav(readFileSync(join(bankPath,'..',item.file)))]));
 let events=0;
 for(let cycle=0;cycle<Math.ceil(score.seconds*cps);cycle++){
  const haps=pattern.queryArc(cycle,Math.min(cycle+1,score.seconds*cps));
  if(haps.length>2048)throw Error('Too many events in one cycle');
  for(const hap of haps){
   if(!hap.hasOnset())continue;
   if(++events>12000)throw Error('Too many events (limit 12000)');
   const {s:name,speed,gain}=hap.value;
   if(!Number.isFinite(+speed)||+speed<0.25||+speed>4)throw Error('Playback speed must be 0.25–4');
   const sound=sounds.get(name);if(!sound)throw Error(`Unknown bank sound: ${name}`);
   const start=Math.round(+hap.whole.begin/cps*rate),step=+speed*sound.rate/rate;
   for(let i=0;i<sound.samples.length/step;i++){
    const target=start+i;if(!score.loop&&target>=length)break;
    const p=i*step,a=Math.floor(p),f=p-a;
    // Short sample-edge ramps suppress clicks after transposition. Loop tails wrap.
    const edge=Math.min(1,i/64,(sound.samples.length/step-i)/64);
    pcm[target%length]+=((sound.samples[a]||0)*(1-f)+(sound.samples[a+1]||0)*f)*gain*edge;
   }
  }
 }
 let peak=0;for(const n of pcm)peak=Math.max(peak,Math.abs(n));
 if(!events||peak<0.00001)throw Error('The pattern rendered silence; add audible events');
 const scale=peak>0.9?0.9/peak:1;let power=0;
 for(let i=0;i<length;i++){pcm[i]*=scale;if(!score.loop)pcm[i]*=Math.min(1,i/220,(length-1-i)/220);power+=pcm[i]*pcm[i];}
 writeFileSync(output,encodeWav(pcm,rate));
 console.log('PLH_MUSIC '+JSON.stringify({events,seconds:length/rate,peak:peak*scale,rms:Math.sqrt(power/length),attenuation:scale}));
} catch(error){console.error(error.message);process.exitCode=1;}
