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
test('phone URL from tailscale serve is listed and linked',()=>{
 const base={gate:8000,web:3000};
 assert.deepEqual(startupLines(base),['Gate: http://127.0.0.1:8000','Web: http://127.0.0.1:3000','Phone access off: set remote_hosts and remote_users in config.json','Loop check: every 10 seconds'],'an unconfigured phone says how to turn it on');
 const lines=startupLines({...base,remote:'https://mini.example.ts.net'});
 assert.equal(lines[2],'Phone: https://mini.example.ts.net');
 assert.ok(renderStartup([lines[2]],80)[0].includes('\x1b]8;;https://mini.example.ts.net\x1b\\'));
 assert.equal(startupLines({...base,remote_error:'tailscale not found'})[2],'Phone access off: tailscale not found');
});

test('the phone address prints as a scannable QR code under its line (task 122)',()=>{
 const url='https://kakkoidevs-mac-mini.tailc6310e.ts.net',modules=qrModules(url),size=modules.length;
 assert.ok(size>=21&&(size-17)%4===0,'a QR version size');
 for(const [row,col] of [[0,0],[0,size-7],[size-7,0]])assert.deepEqual([0,1,2,3,4,5,6].map(i=>modules[row][col+i]),[true,true,true,true,true,true,true],'finder pattern top edge');
 const rows=renderStartup(['Web: http://127.0.0.1:3000','Phone: '+url,'Loop check: every 10 seconds'],80);
 const qr=rows.slice(2,-1);
 assert.equal(qr.length,Math.ceil((size+8)/2),'two module rows per text row, 4-module quiet zone');
 assert.ok(qr.every(row=>row.startsWith('\x1b[30;47m')&&row.endsWith('\x1b[0m')),'dark on light whatever the terminal theme');
 assert.equal(qr[0].replace(/\x1b\[[0-9;]*m/g,''),' '.repeat(size+8),'quiet zone');
 assert.equal(rows.at(-1),'Loop check: every 10 seconds');
 assert.equal(renderStartup(['Phone: '+url],size+7).some(row=>row.includes('\x1b[30;47m')),false,'no QR when the terminal is narrower than it');
});
