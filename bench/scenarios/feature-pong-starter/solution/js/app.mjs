import {createGame,step} from './logic/pong.mjs';
import {choose,load,translate} from './i18n.mjs';
import {saveBest} from './store.mjs';
const english=await load('en');
async function language(asked){const lang=choose(localStorage.getItem('language'),navigator.languages,asked);const messages=await load(lang);document.documentElement.lang=lang;for(const el of document.querySelectorAll('[data-t]'))el.textContent=translate(messages,english,el.getAttribute('data-t'));}
await language(new URLSearchParams(location.search).get('lang'));
for(const button of document.querySelectorAll('[data-lang]'))button.addEventListener('click',()=>{localStorage.setItem('language',button.getAttribute('data-lang'));language(button.getAttribute('data-lang'));});
const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d'),game=createGame(),keys=new Set();
addEventListener('keydown',e=>{if(['w','s','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();keys.add(e.key);}});
addEventListener('keyup',e=>keys.delete(e.key));addEventListener('blur',()=>keys.clear());
let previous=performance.now();function frame(now){step(game,Math.min((now-previous)/1000,.04),keys);previous=now;ctx.fillStyle='black';ctx.fillRect(0,0,640,360);ctx.fillStyle='white';ctx.fillRect(20,game.left,10,64);ctx.fillRect(610,game.right,10,64);ctx.fillRect(game.x-4,game.y-4,8,8);document.querySelector('#score').textContent=game.score.join(' : ');saveBest(Math.max(...game.score));requestAnimationFrame(frame);}requestAnimationFrame(frame);
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js');
