import {test} from 'node:test';
import assert from 'node:assert/strict';
import {updateView,awayFromMac} from '../../js/updates-window.mjs';
test('each backend state keeps its safe next step and limits plain changes',()=>{
 assert.equal(updateView({state:'current'}).title,'Pi WorkStation is up to date.');
 assert.equal(updateView({state:'unknown'}).action,'Try Again');
 assert.equal(updateView({state:'blocked',why:'This copy has its own changes (2 commits not on GitHub).'}).action,'Ask Pi to Update');
 assert.equal(updateView({state:'blocked',why:'Some files were edited and not saved in a commit.'}).action,'Ask Pi to Save Them');
 assert.match(updateView({state:'blocked',why:'Kept'}).detail,/Nothing was changed\./);
 assert.equal(updateView({state:'available',changes:Array(30).fill('Fix')}).changes.length,20);
 assert.match(updateView({state:'updated',commit:'abc1234'}).title,/Restart plh/);
 // Task 263: "unknown" has several causes; the window says the one the backend found, not always "GitHub can't be reached".
 const why='This clone does not follow a branch on GitHub.';
 assert.match(updateView({state:'unknown',why}).detail,new RegExp(why.replace(/\./g,'\\.')));
 assert.doesNotMatch(updateView({state:'unknown',why}).detail,/can’t be reached/);
 assert.match(updateView({state:'unknown'}).detail,/can’t be reached/,'no reason given: the connection is the likely cause');
});
test('the phone install prompt excludes every local loopback address',()=>{
 for(const host of ['localhost','127.0.0.1','[::1]'])assert.equal(awayFromMac(host),false);
 assert.equal(awayFromMac('scratch.example.ts.net'),true);
});
