import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderStartup } from '../../harness/startup-display.mjs';
test('narrow transcript rendering preserves visible text and complete link targets',()=>{
 const url='http://127.0.0.1:8000', text=`Laya: ${url}`;
 const rows=renderStartup([text],12);
 const strip=row=>row.replace(/\x1b\]8;;[^\x1b]*\x1b\\/g,'').replace(/\x1b\[[0-9;]*m/g,'');
 assert.equal(rows.map(strip).join(''),text);
 assert.ok(rows.every(row=>strip(row).length<=12));
 for(const row of rows) if(row.includes('\x1b]8;;')) assert.ok(row.includes(`\x1b]8;;${url}\x1b\\`));
});
