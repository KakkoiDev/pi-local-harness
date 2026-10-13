import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderStartup, installStartupDisplay, startupLines } from '../../harness/startup-display.mjs';
test('narrow transcript rendering preserves visible text and complete link targets',()=>{
 const url='http://127.0.0.1:8000', text=`Laya: ${url}`;
 const rows=renderStartup([text],12);
 const strip=row=>row.replace(/\x1b\]8;;[^\x1b]*\x1b\\/g,'').replace(/\x1b\[[0-9;]*m/g,'');
 assert.equal(rows.map(strip).join(''),text);
 assert.ok(rows.every(row=>strip(row).length<=12));
 for(const row of rows) if(row.includes('\x1b]8;;')) assert.ok(row.includes(`\x1b]8;;${url}\x1b\\`));
});
test('older Pi without entry renderers loads and falls back to notifications',()=>{
 assert.equal(installStartupDisplay({on(){}}),undefined);
});
test('phone URL from tailscale serve is listed and linked',()=>{
 const base={laya:8000,web:3000};
 assert.deepEqual(startupLines(base),['Laya: http://127.0.0.1:8000','Web: http://127.0.0.1:3000','Loop check: every 10 seconds']);
 const lines=startupLines({...base,remote:'https://mini.example.ts.net'});
 assert.equal(lines[2],'Phone: https://mini.example.ts.net');
 assert.ok(renderStartup([lines[2]],80)[0].includes('\x1b]8;;https://mini.example.ts.net\x1b\\'));
 assert.equal(startupLines({...base,remote_error:'tailscale not found'})[2],'Phone access off: tailscale not found');
});
