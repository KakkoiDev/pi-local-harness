import {test} from 'node:test';
import assert from 'node:assert/strict';
import {updateView,awayFromMac} from '../../js/updates-window.mjs';
test('each backend state keeps its safe next step and limits plain changes',()=>{
 assert.equal(updateView({state:'current'}).title,'Pi Workbench is up to date.');
 assert.equal(updateView({state:'unknown'}).action,'Try Again');
 assert.equal(updateView({state:'blocked',why:'This copy has its own changes (2 commits not on GitHub).'}).action,'Ask Pi to Update');
 assert.equal(updateView({state:'blocked',why:'Some files were edited and not saved in a commit.'}).action,'Ask Pi to Save Them');
 assert.match(updateView({state:'blocked',why:'Kept'}).detail,/Nothing was changed\./);
 assert.equal(updateView({state:'available',changes:Array(30).fill('Fix')}).changes.length,20);
 assert.match(updateView({state:'updated',commit:'abc1234'}).title,/Restart plh/);
});
test('the phone install prompt excludes every local loopback address',()=>{
 for(const host of ['localhost','127.0.0.1','[::1]'])assert.equal(awayFromMac(host),false);
 assert.equal(awayFromMac('scratch.example.ts.net'),true);
});
