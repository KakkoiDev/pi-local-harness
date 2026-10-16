// Pure game rules, in pixels and seconds.
export function createGame(){return {left:148,right:148,x:320,y:180,vx:240,vy:100,score:[0,0],winner:null};}
export function step(g,dt,keys){
 if(g.winner!==null)return;
 const clamp=y=>Math.max(0,Math.min(296,y));
 g.left=clamp(g.left+((keys.has('s')?1:0)-(keys.has('w')?1:0))*300*dt);
 g.right=clamp(g.right+((keys.has('ArrowDown')?1:0)-(keys.has('ArrowUp')?1:0))*300*dt);
 g.x+=g.vx*dt;g.y+=g.vy*dt;
 if(g.y<4||g.y>356){g.y=Math.max(4,Math.min(356,g.y));g.vy=-g.vy;}
 if(g.vx<0&&g.x<=34&&g.x>=20&&g.y>=g.left&&g.y<=g.left+64){g.x=34;g.vx=Math.abs(g.vx);}
 if(g.vx>0&&g.x>=606&&g.x<=620&&g.y>=g.right&&g.y<=g.right+64){g.x=606;g.vx=-Math.abs(g.vx);}
 if(g.x<0||g.x>640){const loser=g.x<0?0:1;g.score[1-loser]++;if(g.score[1-loser]>=11)g.winner=1-loser;g.x=320;g.y=180;g.vx=loser===0?-240:240;g.vy=100;}
}
