import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderStartup, installStartupDisplay, startupLines, qrModules } from '../../harness/startup-display.mjs';
test('narrow transcript rendering preserves visible text and complete link targets',()=>{
 const url='http://127.0.0.1:8000', text=`Gate: ${url}`;
 const rows=renderStartup([text],12);
 const strip=row=>row.replace(/\x1b\]8;;[^\x1b]*\x1b\\/g,'').replace(/\x1b\[[0-9;]*m/g,'');
 assert.equal(rows.map(strip).join(''),text);
 assert.ok(rows.every(row=>strip(row).length<=12));
 for(const row of rows) if(row.includes('\x1b]8;;')) assert.ok(row.includes(`\x1b]8;;${url}\x1b\\`));
});
test('older Pi without entry renderers loads and falls back to notifications',()=>{
 assert.equal(installStartupDisplay({on(){}}),undefined);
});
test('the header: name and build, Web, Gate, Phone, how to begin (round 6, T_Startup)',()=>{
 const base={gate:8000,web:3000},about={build:'7f3b86b',data:'~/pi-local-harness-data'};
 assert.deepEqual(startupLines(base,about),['π Pi WorkStation  build 7f3b86b · data in ~/pi-local-harness-data','  Web     http://127.0.0.1:3000','  Gate    http://127.0.0.1:8000','  Phone   off · set remote_hosts and remote_users  /guide phone','  Ask in words, or type /harness for commands.']);
 assert.equal(startupLines(base,{...about,first:true}).at(-1),'  New here? Try “is anything stuck?”, /status or /guide.');
 const lines=startupLines({...base,remote:'https://mini.example.ts.net'},about);
 assert.equal(lines[3],'  Phone   https://mini.example.ts.net  scan →');
 assert.ok(renderStartup([lines[3]],80)[0].includes('\x1b]8;;https://mini.example.ts.net\x1b\\'));
 assert.equal(startupLines({...base,remote_error:'tailscale not found'},about)[3],'  Phone   off · tailscale not found  /guide phone');
 const strip=row=>row.replace(/\x1b\]8;;[^\x1b]*\x1b\\/g,'').replace(/\x1b\[[0-9;]*m/g,'');
 assert.equal(strip(renderStartup(startupLines(base,about),60)[3]),'  Phone   off · /guide phone','at 60 columns the reason moves into the guide');
});

test('the phone address prints as a scannable QR code under its line (task 122)',()=>{
 const url='https://kakkoidevs-mac-mini.tailc6310e.ts.net',modules=qrModules(url),size=modules.length;
 assert.ok(size>=21&&(size-17)%4===0,'a QR version size');
 for(const [row,col] of [[0,0],[0,size-7],[size-7,0]])assert.deepEqual([0,1,2,3,4,5,6].map(i=>modules[row][col+i]),[true,true,true,true,true,true,true],'finder pattern top edge');
 const rows=renderStartup(['  Web     http://127.0.0.1:3000','  Phone   '+url+'  scan →','  Ask in words, or type /harness for commands.'],80);
 const qr=rows.slice(2,-1);
 assert.equal(qr.length,Math.ceil((size+8)/2),'two module rows per text row, 4-module quiet zone');
 assert.ok(qr.every(row=>row.startsWith('\x1b[30;47m')&&row.endsWith('\x1b[0m')),'dark on light whatever the terminal theme');
 assert.equal(qr[0].replace(/\x1b\[[0-9;]*m/g,''),' '.repeat(size+8),'quiet zone');
 assert.equal(rows.at(-1),'  Ask in words, or type /harness for commands.','under 100 columns the QR goes below the phone line');
 assert.equal(renderStartup(['  Phone   '+url+'  scan →'],size+7).some(row=>row.includes('\x1b[30;47m')),false,'no QR when the terminal is narrower than it');
 const wide=renderStartup(['π Pi WorkStation  build x','  Web     http://127.0.0.1:3000','  Phone   '+url+'  scan →','  Ask in words, or type /harness for commands.'],120);
 assert.ok(wide[0].includes('\x1b[30;47m'),'from 100 columns the QR sits beside the lines'); assert.equal(wide.length,Math.ceil((size+8)/2));
});
