import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {recordGuides} from '../../harness/decisions.mjs';
test('guide attachment records code provenance without guide text or prompts (task 249)',()=>{
 const data=mkdtempSync(join(tmpdir(),'pi-decisions-'));
 recordGuides(data,'request-1',[{name:'bug',text:'private source'}]);
 const row=JSON.parse(readFileSync(join(data,'decisions.jsonl'),'utf8'));
 assert.equal(row.who,'code');assert.equal(row.kind,'guide_chosen');assert.equal(row.request,'request-1');assert.deepEqual(row.answer,['bug']);assert.ok(row.rule);assert.doesNotMatch(JSON.stringify(row),/private/);
});
