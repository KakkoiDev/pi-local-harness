import { readFileSync, statSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { homedir } from 'node:os';
const imageTypes = {'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif'};
const audioTypes = new Set(['.wav','.mp3','.m4a','.aac','.flac','.ogg','.aiff','.aif','.opus']);
export function mediaPaths(text, cwd) {
 const tokens = text.match(/"[^"\n]+"|'[^'\n]+'|(?:@)?(?:~\/|\/|\.\.?\/)[^\s]+/g) || [];
 const found = new Map();
 for (const token of tokens) {
  let path = token.replace(/^['"]|['"]$/g,'').replace(/^@/,'').replace(/[),;]+$/,'');
  if(path.startsWith('~/')) path=homedir()+path.slice(1);
  path=resolve(cwd,path);
  const extension=extname(path).toLowerCase();
  if (!imageTypes[extension] && !audioTypes.has(extension)) continue;
  try { if(statSync(path).isFile()) found.set(path, imageTypes[extension] ? 'image' : 'audio'); } catch {}
 }
 return [...found].map(([path,type])=>({path,type}));
}
export async function attachMedia(event, cwd, model, transcribe) {
 const files=mediaPaths(event.text,cwd);
 if(!files.length) return {action:'continue'};
 const images=[...(event.images || [])]; let text=event.text;
 for(const file of files) {
  if(file.type==='image') {
   if(!model?.input?.includes('image')) throw new Error('The selected pi model does not advertise vision. Select ollama/gemma4:26b-mlx.');
   images.push({type:'image',data:readFileSync(file.path).toString('base64'),mimeType:imageTypes[extname(file.path).toLowerCase()]});
  } else {
   const transcript=await transcribe(file.path);
   text+=`\n\nLocal audio transcript (${file.path}; speech recognition may contain errors):\n${transcript}`;
  }
 }
 return {action:'transform',text,images};
}
