// Blips exports little-endian, mono 16-bit PCM. Accept stereo too, downmixed.
export function decodeWav(data) {
 if(data.length<44||data.toString('ascii',0,4)!=='RIFF'||data.toString('ascii',8,12)!=='WAVE')throw Error('Expected a PCM WAV');
 let format,body;
 for(let p=12;p+8<=data.length;){const size=data.readUInt32LE(p+4),start=p+8;if(start+size>data.length)throw Error('Truncated WAV');
  const tag=data.toString('ascii',p,p+4);if(tag==='fmt '){if(size<16)throw Error('Invalid WAV format');format={type:data.readUInt16LE(start),channels:data.readUInt16LE(start+2),rate:data.readUInt32LE(start+4),bits:data.readUInt16LE(start+14)};}
  if(tag==='data')body=data.subarray(start,start+size);p=start+size+(size%2);
 }
 if(!format||!body||format.type!==1||format.bits!==16||![1,2].includes(format.channels)||format.rate<8000||format.rate>96000)throw Error('WAV must be 16-bit PCM, mono/stereo, 8–96 kHz');
 const frames=body.length/(2*format.channels);if(!Number.isInteger(frames)||frames>format.rate*10)throw Error('WAV sample must be at most 10 seconds');
 const samples=new Float32Array(frames);
 for(let i=0;i<frames;i++)for(let c=0;c<format.channels;c++)samples[i]+=body.readInt16LE((i*format.channels+c)*2)/32768/format.channels;
 return {samples,rate:format.rate};
}
export function encodeWav(samples,rate=44100){
 const out=Buffer.alloc(44+samples.length*2);out.write('RIFF');out.writeUInt32LE(out.length-8,4);out.write('WAVEfmt ',8);out.writeUInt32LE(16,16);out.writeUInt16LE(1,20);out.writeUInt16LE(1,22);out.writeUInt32LE(rate,24);out.writeUInt32LE(rate*2,28);out.writeUInt16LE(2,32);out.writeUInt16LE(16,34);out.write('data',36);out.writeUInt32LE(samples.length*2,40);
 for(let i=0;i<samples.length;i++)out.writeInt16LE(Math.round(Math.max(-1,Math.min(1,samples[i]))*32767),44+i*2);return out;
}
