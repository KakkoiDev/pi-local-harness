// The extension's code-owned guide attachment; the classifier's selection has its own Python record.
import {appendFileSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
export function recordGuides(data,request,guides) {
 if(!request)return;
 const names=guides.map(guide=>guide.name);
 if(names.some(name=>typeof name!=='string'||!/^[-a-z0-9]{1,64}$/.test(name)))throw Error('Invalid guide name.');
 const row={time:new Date().toISOString(),request,kind:'guide_chosen',who:'code',rule:'guides.attach',answer:names};
 mkdirSync(data,{recursive:true});appendFileSync(join(data,'decisions.jsonl'),JSON.stringify(row)+'\n',{mode:0o600});
}
