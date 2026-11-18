import {addResident} from './new-residents.js?v=0.50';
import * as T from './three.module.js';
import {createKit} from './region-kit.js?v=0.50';
export const C={oak:'#9c7449',dark:'#4e3520',trim:'#ba8f5c',cream:'#d8cbb0',stone:'#8f8877',iron:'#3b3d38',sage:'#7c8c6c',rose:'#b89d9f'};
export function group(parent,x=0,y=0,z=0,angle=0){const g=new T.Group();g.position.set(x,y,z);g.rotation.y=angle;parent.add(g);return g}
function windowFrame(k,x,z,w=1.65,h=1.4){const F=k.fixed;k.box(F,C.dark,x,1.88,z,w+.19,h+.18,.15,'wood');k.box(F,'#c0d6cf',x,1.88,z+.09,w,h,.035);for(const dx of[-w/2,0,w/2])k.box(F,C.trim,x+dx,1.88,z+.13,.065,h+.10,.075,'wood');for(const y of[1.88-h/2,1.88,1.88+h/2])k.box(F,C.trim,x,y,z+.13,w+.08,.055,.075,'wood');k.box(F,C.oak,x,1.88-h/2-.07,z+.17,w+.32,.10,.31,'wood');for(const s of[-1,1]){k.box(F,'#b3b49a',x+s*(w/2+.11),1.89,z+.19,.19,h+.12,.11,'fabric');k.box(F,C.trim,x+s*(w/2+.11),1.66,z+.25,.22,.07,.05,'fabric')}}
export function createInteriorKit(){const k=createKit(),rectangle=k.solid,circle=k.roundSolid;k.solid=(x,z,w,d,options={})=>rectangle(x,z,w,d,{height:1.6,...options,jumpable:false});k.roundSolid=(x,z,r,options={})=>circle(x,z,r,{height:1.6,...options,jumpable:false});return k}
export function createInteriorRoom({id,label,w=12,d=10,wall=C.cream,floor=C.oak,returnTo='village',returnSpawn=[0,12],windows=true,wallKind='stone',floorKind='wood'}={}){
  const k=createInteriorKit(),F=k.fixed;
  k.floor(floor,w,d,0,0,0,floorKind);
  // Thick carved wooden diorama plinth frame around the room (Reference 2)
  k.box(F,'#5a3c22',0,-.32,0,w+.72,.52,d+.72,'wood');
  k.box(F,'#7d5834',0,-.08,0,w+.46,.14,d+.46,'wood');
  const woodTones=[floor,'#a88154','#b38c5e','#967044'];
  if(floorKind==='wood')for(let row=0;row<Math.floor(d/.56);row++)for(let col=0;col<Math.ceil(w/2.1)+1;col++){const left=Math.max(-w/2,-w/2+col*2.1-(row%2)*1.05),right=Math.min(w/2,-w/2+(col+1)*2.1-(row%2)*1.05);if(right-left>.03)k.box(F,woodTones[(row+col)%4],(left+right)/2,.015,-d/2+.29+row*.56,right-left-.015,.025,.54,'wood')}
  k.box(F,wall,0,1.65,-d/2,w+.18,3.3,.22,wallKind);k.box(F,wall,-w/2,1.65,0,.22,3.3,d,wallKind);k.solid(0,-d/2,w,.2);k.solid(-w/2,0,.2,d);
  // Heavy rustic timber beams & wainscoting
  for(const y of[.16,1.08,3.18]){k.box(F,y===1.08?C.oak:C.dark,0,y,-d/2+.13,w,.14,.15,'wood');k.box(F,y===1.08?C.oak:C.dark,-w/2+.13,y,0,.15,.14,d,'wood')}
  for(let x=-w/2+.12;x<=w/2;x+=2.8)k.box(F,C.dark,x,1.64,-d/2+.13,.16,3.28,.16,'wood');for(let z=-d/2+.12;z<d/2;z+=3.1)k.box(F,C.dark,-w/2+.13,1.64,z,.16,3.28,.16,'wood');
  for(let i=0;i<Math.floor(w/.35);i++)k.box(F,i%3?C.oak:'#8a643d',-w/2+.21+i*.35,.58,-d/2+.14,.33,.86,.045,'wood');
  k.box(F,C.trim,w/2,.11,0,.14,.20,d,'wood');for(const x of[-(w+2.1)/4,(w+2.1)/4])k.box(F,C.trim,x,.11,d/2,(w-2.1)/2,.20,.14,'wood');k.box(F,C.trim,0,.035,d/2-.12,2.05,.055,.53,'wood');
  if(windows){windowFrame(k,-w*.27,-d/2+.14);windowFrame(k,w*.27,-d/2+.14)}
  // Warm glowing wall lanterns casting real golden light (Reference 2)
  lantern(k,-w/2+.39,2.28,-.8);
  lantern(k,0,2.35,-d/2+.38);
  k.portal({x:0,z:d/2-.33,to:returnTo,spawn:returnSpawn,label:'Sair de '+label,radius:.87});
  let extraResidents=false;
  k.finishRoom=()=>{if(!extraResidents){extraResidents=true;const visits={chapel:['cecilia',-3.7,1.4],library:['ravi',-3.6,1.7],clinic:['helena',-3.4,1.5],carpenter:['caio',-1.4,2.2],fisherHouse:['antonio',-2.2,1.8]}[id];if(visits)addResident(k,visits[0],{},{x:visits[1],z:visits[2],indoors:true})}return k.finish({id,label,bounds:[-w/2,w/2,-d/2,d/2],spawn:[0,d/2-1.2],indoors:true,viewHeight:Math.max(10,w*.85),photoSubjects:[]})};return k;
}
export function table(k,x,z,w=1.8,d=1.2,height=.8){const g=group(k.fixed,x,0,z);k.box(g,C.oak,0,height,0,w,.13,d,'wood');k.box(g,C.trim,0,height+.078,0,w+.08,.035,d+.08,'wood');for(const sx of[-1,1])for(const sz of[-1,1])k.box(g,C.dark,sx*(w/2-.17),height/2,sz*(d/2-.16),.12,height,.12,'wood');k.solid(x,z,w+.08,d+.08,{height:height+.12});return g}
export function chair(k,x,z,angle=0){const g=group(k.fixed,x,0,z,angle);k.box(g,C.oak,0,.48,0,.55,.10,.55,'wood');for(const sx of[-1,1])for(const sz of[-1,1])k.box(g,C.dark,sx*.21,.24,sz*.21,.07,.48,.07,'wood');for(const sx of[-1,1])k.box(g,C.dark,sx*.22,.84,-.23,.065,.73,.065,'wood');for(const y of[.76,1.03])k.box(g,C.oak,0,y,-.23,.48,.12,.06,'wood');k.solid(x,z,.58,.62,{angle,height:1.12});return g}
export function shelf(k,x,z,w=2,kind='books'){const g=group(k.fixed,x,0,z);k.box(g,C.dark,0,1.03,-.21,w,2.06,.12,'wood');for(const dx of[-w/2,w/2])k.box(g,C.oak,dx,1.08,0,.10,2.16,.55,'wood');for(const y of[.12,.75,1.38,2.10])k.box(g,C.trim,0,y,0,w+.15,.10,.66,'wood');if(kind==='books')for(let row=0;row<3;row++)for(let i=0;i<Math.floor(w/.20)-1;i++){const h=.34+((i*3+row)%4)*.045;const b=k.box(g,['#8d9f80','#a58a8d','#7d969b','#c2a777'][i%4],-w/2+.20+i*.20,.20+row*.63+h/2,.02,.15,h,.33,'fabric');b.rotation.z=(i%5===0?.10:0);k.box(g,C.trim,b.position.x,.20+row*.63+h*.75,.195,.11,.018,.012)}k.solid(x,z,w+.15,.68,{height:2.16});return g}
export function rug(k,x,z,w,d,color=C.sage){k.box(k.fixed,color,x,.048,z,w,.035,d,'fabric');for(const dx of[-w/2+.10,w/2-.10])k.box(k.fixed,C.trim,x+dx,.069,z,.04,.008,d-.12);for(const dz of[-d/2+.10,d/2-.10])k.box(k.fixed,C.trim,x,.069,z+dz,w-.12,.008,.04);for(let i=0;i<Math.floor(w/.12);i++)for(const dz of[-d/2-.05,d/2+.05])k.box(k.fixed,C.trim,x-w/2+.06+i*.12,.047,z+dz,.025,.018,.12,'fabric')}
export function vase(k,p,x,y,z,color=C.rose){k.ball(p,color,x,y+.15,z,.15,.20,.15,'clay');k.cyl(p,color,x,y+.32,z,.08,.13,'clay');for(let i=0;i<4;i++){const a=i*2.4,xx=x+Math.sin(a)*.15,zz=z+Math.cos(a)*.12;k.beam(p,C.sage,[x,y+.33,z],[xx,y+.64+(i%2)*.08,zz],.012,'plain');for(let j=0;j<5;j++){const b=j*Math.PI*2/5;k.ball(p,i%2?'#c6a4a4':'#d5bd7a',xx+Math.sin(b)*.065,y+.64+(i%2)*.08,zz+Math.cos(b)*.065,.045,.025,.045)}k.ball(p,C.trim,xx,y+.65+(i%2)*.08,zz,.03,.03,.03)}}
export function lantern(k,x,y,z){
  const g=group(k.fixed,x,y,z),m=new T.MeshStandardMaterial({color:'#ffebb0',emissive:'#ff9d2e',emissiveIntensity:1.15,roughness:.3});m.userData.regionOwned=true;
  k.box(g,C.iron,0,0,0,.26,.04,.25);k.box(g,m,0,.16,0,.18,.28,.17);
  for(const dx of[-.12,.12])for(const dz of[-.11,.11])k.box(g,C.iron,dx,.16,dz,.025,.32,.025);
  k.box(g,C.iron,0,.34,0,.29,.07,.28);k.beam(g,C.iron,[0,.38,0],[0,.58,-.06],.018,'plain');
  const glowLight=new T.PointLight('#ffae42',2.4,8.5,1.8);glowLight.position.set(x,y+.12,z+.25);k.dynamic.add(glowLight);
  return g;
}
export function npc(k,{name,text,x,z,shirt=C.sage,hair='#80664e',hat=null,seed=0}={}){const g=group(k.dynamic,x,0,z,.18),torso=group(g);k.ball(torso,shirt,0,.65,0,.24,.32,.19,'fabric');for(const s of[-1,1]){k.cyl(g,'#767560',s*.10,.28,0,.075,.40,'fabric');k.ball(g,C.dark,s*.11,.075,.06,.10,.07,.15);k.cyl(torso,shirt,s*.25,.60,0,.065,.34,'fabric');k.ball(torso,'#e6be98',s*.27,.41,.03,.07,.075,.07)}k.cyl(g,'#e6be98',0,.94,0,.075,.12);k.ball(g,'#f2caa4',0,1.18,.02,.25,.26,.23);k.ball(g,hair,0,1.33,-.025,.26,.16,.23);for(const s of[-1,1]){k.ball(g,'#e6be98',s*.245,1.17,.02,.048,.068,.048);k.ball(g,'#24201c',s*.085,1.20,.23,.030,.042,.018);k.ball(g,'#ffffff',s*.078,1.216,.246,.010,.012,.007)}k.ball(g,'#e3a988',0,1.12,.25,.045,.040,.038);if(hat){k.cyl(g,hat,0,1.46,0,.26,.12,'fabric');k.cyl(g,hat,0,1.39,.04,.30,.035,'fabric')}k.roundSolid(x,z,.29);k.interact({x,z:z+.85,type:'talk',label:'Conversar com '+name,data:{name,text},radius:1.4});k.animate((dt,time)=>{torso.scale.y=1+Math.sin(time*1.7+seed)*.012;g.rotation.y=.18+Math.sin(time*.32+seed)*.10});return g}
