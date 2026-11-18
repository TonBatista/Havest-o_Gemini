import {logoPanel} from './alforria-logo.js?v=0.47';
import * as T from './three.module.js';
import {part,mergeParts} from './wildlife-art.js?v=0.47';
import {colliderContains} from './scene-collisions.js?v=0.47';

export const NEW_RESIDENTS=Object.freeze([
  {id:'emerson',name:'Mestre Emerson',area:'beach',x:-31,z:5.7,skin:'#e9be9b',hair:'#463d37',beard:true,cord:['#eee9db'],master:true,text:'Eu sou o mestre Emerson. Aqui no Grupo Alforria a roda começa com respeito, escuta e amizade. O berimbau guia o nosso encontro, e todo mundo é bem-vindo!'},
  {id:'bianca',name:'Bianca',area:'beach',x:-28.66,z:6.65,skin:'#f0cdb4',hair:'#d6ac55',long:true,cord:['#589550','#d5b34b'],text:'Sou a Bianca! Meu cordão é verde e amarelo. Gosto de treinar na areia e ouvir o mar entre uma ginga e outra.'},
  {id:'monica',name:'Mônica',area:'beach',x:-28.66,z:9.35,skin:'#edc5a8',hair:'#77432c',long:true,cord:['#589550','#d5b34b'],text:'Meu nome é Mônica. A roda fica mais bonita quando cada pessoa traz seu jeito. Depois do treino, adoro passear pela vila.'},
  {id:'nico',name:'Thomas',area:'beach',x:-31,z:10.7,skin:'#f0cbb0',hair:'#72462d',child:true,cord:['#578f4d'],text:'Eu sou o Thomas! Arrumei meu cabelo com gel antes de vir treinar. Ainda estou aprendendo, mas já sei acompanhar as palmas!'},
  {id:'dandara',name:'Dandara',area:'beach',x:-33.34,z:9.35,skin:'#794c35',hair:'#302720',curly:true,cord:['#d8b64c'],text:'Sou Dandara. Meu cordão amarelo me lembra de continuar aprendendo. Aqui a gente joga junto e cuida um do outro.'},
  {id:'davi',name:'Davi',area:'beach',x:-33.34,z:6.65,skin:'#805039',hair:'#2d2823',cord:['#5477b1'],text:'Eu sou o Davi! Enquanto o mestre toca, eu acompanho o ritmo nas palmas. Traga seus amigos para conhecer a nossa roda.'},
  {id:'helena',name:'Helena',area:'village',x:5.2,z:8.5,skin:'#81543b',hair:'#403027',headwrap:'#ba7c42',shirt:'#7c936a',apron:'#c8b28b',text:'Sou Helena. Cuido dos jardins da vila. Um punhado de sementes e um pouco de paciência transformam qualquer cantinho.'},
  {id:'caio',name:'Caio',area:'lake',x:-25,z:-19,skin:'#bc865d',hair:'#403026',curly:true,hat:'#b9a16b',shirt:'#bd9856',apron:'#68765d',text:'Sou Caio, vizinho destas bandas do lago. Estou aprendendo a escolher a madeira e a preparar meu próprio terreno.'},
  {id:'cecilia',name:'Cecília',area:'village',x:-6.6,z:6.4,skin:'#e3bd9c',hair:'#c4beb1',long:true,shirt:'#ab90aa',text:'Pode me chamar de dona Cecília. Guardo receitas de todas as estações. Uma visita e uma boa conversa sempre deixam o dia mais gostoso.'},
  {id:'ravi',name:'Ravi',area:'mountain',x:-8.7,z:3,skin:'#bc855e',hair:'#392a22',curly:true,shirt:'#5f8a8b',vest:'#b9a783',binoculars:true,text:'Eu sou Ravi! Vim escutar os pássaros. Caminhe devagar, preste atenção nos cantos e deixe a câmera pronta: o bosque sempre reserva uma surpresa.'},
  {id:'aurora',name:'Aurora',area:'village',x:-6.2,z:-5.6,skin:'#ecc7a6',hair:'#a66037',long:true,hat:'#c5ad73',shirt:'#ded3b7',apron:'#b88862',text:'Sou Aurora. Cuido das abelhas e das flores. Quando o pomar floresce, o vale inteiro parece trabalhar junto.'},
  {id:'antonio',name:'Seu Antônio',area:'beach',x:-11.2,z:6.4,skin:'#83563e',hair:'#b0aba0',hat:'#617385',shirt:'#7c94a1',moustache:true,text:'Eu sou Antônio. Conheço estas marés desde menino. De manhã conserto as redes; à tarde, gosto de conversar com quem passa pelo cais.'},
  {id:'cidinha',name:'Vó Cidinha',area:'chapel',x:-3.2,z:-2.65,skin:'#e4bda3',hair:'#bfc0bd',curly:true,glasses:true,scarf:'#e6bf42',shirt:'#3d456a',brooch:true,text:'Sou a Vó Cidinha e cuido da Capela Sta Julieta. Deixo as flores e as portas prontas para acolher todo mundo. Meu marido, o Vô Batista, costuma pescar lá no lago. Vá dar um abraço nele por mim!'},
  {id:'batista',name:'Vô Batista',area:'lake',x:-3.2,z:-18.5,skin:'#dfb695',hair:'#c4c5bf',moustache:true,shirt:'#b7b6ac',vest:'#a4a5a1',pants:'#657c96',fisher:true,text:'Eu sou o Vô Batista, marido da Vó Cidinha. Enquanto ela cuida da Capela Sta Julieta, eu venho prosear com os peixes. Puxe um banco: pescaria boa também é tempo bem vivido.'}
]);

const TAU=Math.PI*2,byId=new Map(NEW_RESIDENTS.map(d=>[d.id,d]));
function beam(p,color,a,b,r){const v=new T.Vector3(...b).sub(new T.Vector3(...a)),mid=new T.Vector3(...a).add(new T.Vector3(...b)).multiplyScalar(.5),m=part(p,'cylinder',color,mid.x,mid.y,mid.z,r,v.length(),r);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return m}
function shadeHex(hex,factor){const c=new T.Color(hex).multiplyScalar(factor);return '#'+c.getHexString()}

function rig(d){
  const root=new T.Group(),body=new T.Group(),arms=[],legs=[],cap=!!d.cord,shirt=cap?'#faf9f5':d.shirt,pants=cap?'#4d67a1':d.pants||'#74755e';
  root.add(body);root.name='resident-'+d.id;root.userData.seasonalExclude=true;
  if(d.child)root.scale.setScalar(.75);

  // Tailored torso, collar & waist belt/hem
  part(body,'oval',shirt,0,.73,0,.235,.285,.172);
  part(body,'oval',shadeHex(shirt,.88),0,.59,0,.21,.055,.16);
  part(body,'cylinder',pants,0,.44,0,.185,.21,.168);
  part(body,'oval',d.skin,0,1.01,0,.074,.125,.074);
  if(!cap)for(const side of [-1,1]){const col=part(body,'oval','#f2ead5',side*.052,.98,.075,.046,.022,.042);col.rotation.z=-side*.35}

  // Sculpted hair back & crown
  const hairHighlight=shadeHex(d.hair,1.25);
  if(d.long){
    part(body,'oval',d.hair,0,1.14,-.095,.255,.35,.175);
    for(const side of [-1,1])part(body,'oval',hairHighlight,side*.17,1.08,-.05,.075,.24,.08);
  }
  // Cute PS1-JRPG head proportions (slightly larger expressive head, soft cheeks)
  part(body,'oval',d.skin,0,1.245,.025,.242,.248,.220);
  part(body,'oval',d.hair,0,1.395,-.032,.252,.148,.222);
  // Front hair bangs for everyone
  for(let b=-2;b<=2;b++){
    const bang=part(body,'oval',b%2?hairHighlight:d.hair,b*.062,1.365,.172-Math.abs(b)*.015,.058,.062,.045);
    bang.rotation.z=b*.18;
  }

  if(d.curly)for(let i=0;i<14;i++){const a=i*2.4;part(body,'oval',i%3?d.hair:hairHighlight,Math.sin(a)*.185,1.42+(i%3)*.036,Math.cos(a)*.135-.035,.084,.080,.080)}
  if(d.child)for(let i=0;i<5;i++){const t=part(body,'cone',i%2?hairHighlight:d.hair,-.13+i*.065,1.52+(i%2)*.038,.01,.068,.19,.068);t.rotation.z=-.25-i*.06}

  // Expressive eyes, double catchlights, rosy cheeks & sculpted nose
  for(const side of[-1,1]){
    part(body,'oval',d.skin,side*.240,1.23,.018,.048,.068,.046);
    part(body,'oval','#fff9ec',side*.084,1.25,.222,.048,.066,.016);
    part(body,'oval','#2b2820',side*.080,1.246,.239,.030,.048,.013);
    part(body,'oval','#ffffff',side*.071,1.270,.251,.011,.015,.007);
    part(body,'oval','#ffffff',side*.088,1.228,.249,.005,.007,.005);
    part(body,'oval',d.hair,side*.084,1.334,.218,.056,.014,.015);
    // Warm rosy cheek tint
    part(body,'oval','#d8826b',side*.145,1.195,.202,.034,.020,.012);
  }
  part(body,'oval',d.skin,0,1.18,.253,.038,.032,.034);
  part(body,'oval','#a66854',0,1.12,.222,.050,.011,.009);

  if(d.moustache)for(const side of[-1,1])part(body,'oval','#cfc8b4',side*.056,1.15,.237,.074,.035,.028);
  if(d.hat){part(body,'cylinder',d.hat,0,1.485,-.015,.258,.165,.245);part(body,'cylinder',shadeHex(d.hat,.84),0,1.425,-.015,.264,.025,.250);part(body,'cylinder',d.hat,0,1.408,.04,.33,.036,.30)}
  if(d.headwrap){part(body,'oval',d.headwrap,0,1.455,-.035,.255,.175,.225);part(body,'oval',shadeHex(d.headwrap,1.15),-.16,1.535,.10,.095,.085,.085)}
  if(d.apron){part(body,'oval',d.apron,0,.64,.158,.198,.315,.030);for(const side of[-1,1])beam(body,d.apron,[side*.13,.92,.13],[side*.13,.52,.17],.025);part(body,'oval',shadeHex(d.apron,.85),0,.60,.192,.125,.082,.014)}
  if(d.vest)for(const side of[-1,1]){part(body,'oval',d.vest,side*.155,.75,.11,.092,.245,.082);part(body,'oval','#d9c282',side*.12,.72,.188,.014,.014,.008)}
  if(d.binoculars)for(const side of[-1,1]){beam(body,'#6a695c',[side*.11,.97,.13],[side*.08,.72,.23],.012);beam(body,'#485350',[side*.07,.76,.22],[side*.07,.60,.25],.046)}
  if(d.beard){for(const side of[-1,1]){part(body,'oval','#76685f',side*.12,1.10,.186,.096,.066,.056);part(body,'oval','#a29a8e',side*.07,1.11,.228,.060,.019,.014)}part(body,'oval','#71645a',0,1.064,.172,.138,.056,.068)}
  if(d.glasses){for(const side of[-1,1]){const xx=side*.089;for(const yy of[1.205,1.29])beam(body,'#594149',[xx-.068,yy,.256],[xx+.068,yy,.256],.009);for(const edge of[-1,1])beam(body,'#594149',[xx+edge*.068,1.205,.256],[xx+edge*.068,1.29,.256],.009)}beam(body,'#594149',[-.021,1.255,.256],[.021,1.255,.256],.008)}
  if(d.scarf){part(body,'oval',d.scarf,0,.997,.02,.145,.072,.125);for(const side of[-1,1])part(body,'oval',d.scarf,side*.064,.77,.175,.068,.215,.028)}
  if(d.brooch){beam(body,'#d4b26b',[-.18,.86,.158],[-.10,.82,.188],.015);part(body,'oval','#e6c473',-.16,.855,.186,.058,.020,.014)}
  if(d.fisher){beam(body,'#9b8055',[.34,.07,.13],[.45,1.95,.13],.014);beam(body,'#d3ccb0',[.45,1.95,.13],[.52,.42,.19],.003);part(body,'oval','#77796d',.35,.67,.17,.06,.05,.07);for(const side of[-1,1])for(let i=0;i<7;i++)part(body,'oval',i%2?'#6c716d':'#c4c3b9',side*.14,.54+i*.055,.178,.025,.022,.010)}

  if(cap){const ring=new T.Mesh(new T.TorusGeometry(.205,.018,4,22));ring.userData.featherColor=d.cord[0];ring.rotation.x=Math.PI/2;ring.position.y=.52;body.add(ring);part(body,'oval',d.cord[0],.16,.52,.125,.042);for(const side of[-1,1])for(let i=0;i<6;i++)beam(body,d.cord[i%d.cord.length],[.16+side*.025,.51-i*.038,.17],[.16+side*.026,.47-i*.038,.17],.014)}
  if(d.master){const curve=new T.QuadraticBezierCurve3(new T.Vector3(.38,.13,.14),new T.Vector3(.62,.95,.14),new T.Vector3(.40,1.99,.14)),bow=new T.Mesh(new T.TubeGeometry(curve,16,.015,5,false));bow.userData.featherColor='#9c7345';body.add(bow);beam(body,'#d4c6a0',[.38,.13,.14],[.4,1.99,.14],.004);part(body,'oval','#ae814a',.42,.63,.13,.16,.20,.17);part(body,'oval','#594535',.42,.63,.286,.10,.13,.009);beam(body,'#a48556',[.34,.79,.22],[.59,.94,.27],.008)}

  mergeParts(body);if(cap)logoPanel(body,0,.80,.182,.235);

  for(const side of[-1,1]){
    const leg=new T.Group();leg.position.set(side*.105,.43,0);root.add(leg);
    part(leg,'cylinder',pants,0,-.15,0,.076,.31,.076);
    part(leg,'oval',cap?d.skin:'#695546',0,-.36,.05,.092,.068,.150);
    if(!cap)part(leg,'oval','#46382d',0,-.395,.05,.095,.022,.155);
    mergeParts(leg);legs.push(leg);

    const arm=new T.Group();arm.position.set(side*.25,.91,0);root.add(arm);
    part(arm,'oval',shirt,0,-.02,0,.082,.075,.082);
    part(arm,'cylinder',shirt,0,-.09,0,.072,.17,.072);
    part(arm,'cylinder',d.skin,0,-.24,0,.052,.17,.052);
    part(arm,'oval',d.skin,0,-.34,.018,.065,.070,.062);
    if(d.master&&side===1){for(let j=0;j<3;j++)part(arm,'oval',d.skin,-.025+j*.024,-.36,.055,.014,.023,.018);part(arm,'oval',d.skin,.047,-.323,.045,.023,.032,.022)}
    mergeParts(arm);arms.push(arm);
  }
  return{root,body,arms,legs};
}

function freeAt(k,x,z,skip=null){return !k.colliders.some(c=>c!==skip&&colliderContains(c,x,z,.33))&&!k.portals.some(p=>Math.hypot(x-p.x,z-p.z)<1.8)}
function positionFor(k,x,z){if(freeAt(k,x,z))return{x,z};for(const r of[.65,1.2,1.8])for(let i=0;i<12;i++){const a=i*TAU/12;if(freeAt(k,x+Math.sin(a)*r,z+Math.cos(a)*r))return{x:x+Math.sin(a)*r,z:z+Math.cos(a)*r}}return null}

export function addResident(k,id,state={},override={}){
  const d={...byId.get(id),...override};if(!d.id)return null;const home=positionFor(k,d.x,d.z);if(!home)return null;const art=rig(d),g=art.root;g.position.set(home.x,0,home.z);k.dynamic.add(g);const collider={x:home.x,z:home.z,r:d.child?.20:.28,npcId:d.id};k.colliders.push(collider);const data={name:d.name,get text(){const hour=(state.minutes??360)/60,greeting=!Number.isFinite(state.minutes)?'':hour>=18?'Boa noite! ':hour<12?'Bom dia! ':'Boa tarde! ';return greeting+d.text}};k.interact({x:home.x,z:home.z,type:'talk',label:'Conversar com '+d.name,data,radius:1.35});const talk=k.interactions.at(-1),seed=NEW_RESIDENTS.findIndex(a=>a.id===d.id)*1.31;let goal=null,rest=1.8+seed%2,phase=0;
  k.animate((dt,time)=>{let walk=false;const cap=!!d.cord;if(!cap&&!override.indoors){rest-=dt;if(!goal&&rest<0){rest=3+Math.random()*4;for(let i=0;i<6;i++){const a=Math.random()*TAU,r=.7+Math.random()*.8,q={x:home.x+Math.sin(a)*r,z:home.z+Math.cos(a)*r};if(!freeAt(k,q.x,q.z,collider))continue;let clear=true;for(let j=1;j<=10;j++){const t=j/10;if(!freeAt(k,g.position.x+(q.x-g.position.x)*t,g.position.z+(q.z-g.position.z)*t,collider)){clear=false;break}}if(clear){goal=q;break}}}if(goal&&dt>0){const dx=goal.x-g.position.x,dz=goal.z-g.position.z,len=Math.hypot(dx,dz),step=Math.min(len,dt*.42);if(len<.04)goal=null;else{g.position.x+=dx/len*step;g.position.z+=dz/len*step;g.rotation.y=Math.atan2(dx,dz);phase+=step*12;walk=true}}}g.position.y=Math.sin(time*1.7+seed)*.007;art.body.rotation.z=0;for(const [i,leg]of art.legs.entries())leg.rotation.x=walk?Math.sin(phase+i*Math.PI)*.28:0;art.arms.forEach((arm,i)=>{arm.rotation.x=walk?-Math.sin(phase+i*Math.PI)*.18:0;arm.rotation.z=(i===0?-1:1)*.09});if(cap){const beat=time*2.8+seed,playing=!d.master&&(Math.floor(time/8)+(d.child?1:0))%3===NEW_RESIDENTS.findIndex(a=>a.id===d.id)%3;g.rotation.y=Math.atan2((d.centerX??-31)-home.x,(d.centerZ??8)-home.z);if(d.master){art.arms[1].rotation.x=-.38;art.arms[1].rotation.z=.75;art.arms[0].rotation.x=-.35;art.arms[0].rotation.z=-.35+Math.sin(beat)*.10}else if(playing){g.position.x=home.x+Math.sin(beat)*.11;art.body.rotation.z=Math.sin(beat)*.10;art.legs[0].rotation.x=Math.sin(beat)*.37;art.legs[1].rotation.x=-Math.sin(beat)*.37;art.arms[0].rotation.x=-.8-Math.sin(beat)*.3;art.arms[1].rotation.x=-.8+Math.sin(beat)*.3}else{art.arms[0].rotation.z=-.65-Math.sin(beat)*.18;art.arms[1].rotation.z=.65+Math.sin(beat)*.18;art.arms.forEach(a=>a.rotation.x=-.72)}}else if(!walk){const player=state.player;if(player&&Math.hypot(player.x-g.position.x,player.z-g.position.z)<2.8)g.rotation.y=Math.atan2(player.x-g.position.x,player.z-g.position.z);else g.rotation.y=.35+Math.sin(time*.23+seed)*.12}collider.x=talk.x=g.position.x;collider.z=talk.z=g.position.z});return g;
}

export function addNewResidents(k,area,state={}){const added=[];for(const d of NEW_RESIDENTS.filter(d=>d.area===area)){const g=addResident(k,d.id,state);if(g)added.push(g)}return added}
