// Broken imports and offline-cache entries must fail before the app is shipped.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {dirname,resolve,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=path=>readFileSync(resolve(root,path),'utf8');
const literals=text=>[...text.matchAll(/['"]([^'"]+)['"]/g)].map(match=>match[1]);
test('every local page, manifest, cache and module reference exists',()=>{
 const missing=[];
 function check(url,from='index.html') {
  if(!url||/^(?:[a-z][\w+.-]*:|\/\/|#)/i.test(url))return;
  const name=decodeURIComponent(url.split(/[?#]/)[0]);if(!name)return;
  const path=resolve(name.startsWith('/')?root:dirname(resolve(root,from)),'.'+(name.startsWith('/')?name:'/'+name));
  if(relative(root,path).startsWith('..')||!existsSync(path))missing.push(`${from}: ${relative(root,path)} (${url})`);
 }
 const shell=read('sw.js').match(/\bSHELL\s*=\s*\[([\s\S]*?)\]/);assert.ok(shell,'sw.js: missing literal SHELL list');
 for(const path of literals(shell[1]))check(path,'sw.js');
 for(const match of read('index.html').matchAll(/\b(?:src|href)\s*=\s*['"]([^'"]+)['"]/gi))check(match[1]);
 for(const icon of JSON.parse(read('manifest.webmanifest')).icons||[])check(icon.src,'manifest.webmanifest');
 function modules(folder){for(const entry of readdirSync(resolve(root,folder),{withFileTypes:true})){const name=folder+'/'+entry.name;if(entry.isDirectory())modules(name);else if(name.endsWith('.mjs')){
  for(const match of read(name).matchAll(/\b(?:import\s*\(\s*|(?:import|export)\s+(?:[^;'"]*?\s+from\s*)?)['"]([^'"]+)['"]/g))if(match[1].startsWith('.')||match[1].startsWith('/'))check(match[1],name);
 }}}
 modules('js');assert.deepEqual(missing,[],`Missing referenced files (build static/app.css before testing):\n${missing.join('\n')}`);
});
