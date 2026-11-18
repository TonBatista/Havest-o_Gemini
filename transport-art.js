import * as T from './three.module.js';
import {ANIMALS} from './animal-care.js?v=0.52.0';
import {part,mergeParts} from './wildlife-art.js?v=0.47';
import {migrateTransport,herdPose,propertyKey,updateAnimalWander,setHerdWalkability,bodyRadius} from './transport-rules.js?v=0.52.0';

const templates=new Map();

// Satin porcelain/vinyl figurine finish like Reference 2
function applyPorcelainFinish(mesh){
  if(!mesh?.material)return;
  mesh.material=mesh.material.clone();
  mesh.material.roughness=0.38;
  mesh.material.metalness=0.04;
}

function shape(species){
  if(templates.has(species))return templates.get(species);
  const body=new T.Group(),leg=new T.Group(),chicken=species==='chicken',sheep=species==='sheep';
  if(chicken){
    // Plump ceramic miniature chicken (Reference 2 & 3)
    part(body,'oval','#f7f1e3',0,.32,0,.25,.24,.28);
    part(body,'oval','#fbf6ea',0,.55,.15,.16,.18,.16);
    part(body,'cone','#e89e3c',0,.53,.33,.055,.13,.055).rotation.x=Math.PI/2;
    part(body,'oval','#d94a3d',0,.45,.29,.035,.045,.03);
    for(const s of[-1,1]){
      part(body,'oval','#1e1c1a',s*.095,.59,.27,.025,.030,.016);
      part(body,'oval','#ffffff',s*.088,.602,.284,.008,.010,.006);
      part(body,'oval','#e6dbc4',s*.21,.33,-.02,.07,.14,.19);
    }
    for(let i=0;i<3;i++)part(body,'oval','#d94a3d',0,.73,.10+i*.055,.035,.055,.048);
    part(body,'oval','#efe6d2',0,.41,-.26,.15,.19,.12);
    part(leg,'cylinder','#e39a3b',0,-.05,0,.025,.15,.025);
    part(leg,'oval','#e39a3b',0,-.13,.04,.038,.025,.085);
  }else if(sheep){
    // Fluffy round miniature sheep (Reference 3)
    part(body,'oval','#f5efe2',0,.78,-.08,.44,.40,.62);
    for(let i=0;i<18;i++){
      const a=i*2.39996;
      part(body,'oval',i%3?'#faf5e8':'#e8e0ce',Math.sin(a)*.36,.84+(i%3)*.10,-.08+Math.cos(a)*.46,.21,.19,.21);
    }
    part(body,'oval','#f0d5be',0,.96,.52,.25,.24,.24);
    part(body,'oval','#e6bca6',0,.88,.72,.17,.11,.13);
    for(const s of[-1,1]){
      part(body,'oval','#e8ccb4',s*.26,1.02,.52,.13,.055,.08);
      part(body,'oval','#221f1c',s*.12,.99,.72,.028,.036,.018);
      part(body,'oval','#ffffff',s*.11,1.005,.736,.009,.011,.006);
    }
    part(leg,'cylinder','#d4b89e',0,-.20,0,.082,.42,.082);
    part(leg,'oval','#594a3e',0,-.42,.03,.098,.08,.11);
  }else{
    // Iconic Chubby Harvest Moon / Back to Nature Porcelain Cow (Reference 2!)
    const white='#f7f4ec', spot='#383430', pink='#f2b8ad', pinkDark='#d98e82';
    // Plump rounded barrel body
    part(body,'oval',white,0,.78,-.08,.50,.46,.72);
    // Cute round head + big soft pink muzzle
    part(body,'oval',white,0,.96,.58,.32,.31,.30);
    part(body,'oval',pink,0,.84,.84,.30,.19,.20);
    // Cute nostrils & rosy cheeks
    for(const s of[-1,1]){
      part(body,'oval',pinkDark,s*.11,.86,1.02,.032,.024,.014);
      part(body,'oval','#f5a69b',s*.22,.88,.78,.055,.035,.025);
      // Big expressive glossy dark eyes with white catchlight
      part(body,'oval','#1f1d1a',s*.15,1.04,.82,.042,.054,.024);
      part(body,'oval','#ffffff',s*.135,1.06,.842,.014,.018,.010);
      // Soft rounded ears & stubby cream horns
      part(body,'oval',white,s*.32,1.10,.56,.15,.075,.09);
      part(body,'oval',pink,s*.32,1.08,.61,.10,.045,.04);
      part(body,'cone','#efe2c4',s*.18,1.26,.54,.055,.15,.055);
    }
    // Clean cow spots on back & flanks
    for(const[x,y,z,sx,sy,sz]of[[-.40,.86,-.28,.16,.26,.26],[.41,.90,.06,.16,.26,.25],[.02,1.14,-.16,.28,.11,.24],[-.18,1.16,.55,.14,.10,.14]]){
      part(body,'oval',spot,x,y,z,sx,sy,sz);
    }
    // Brown leather collar + shiny golden cowbell (Reference 2!)
    const collar=new T.Mesh(new T.TorusGeometry(.30,.038,8,20));
    collar.userData.featherColor='#7a4d32';
    collar.position.set(0,.80,.42);
    collar.rotation.x=Math.PI/2-.35;
    body.add(collar);
    part(body,'cylinder','#e3b84b',0,.56,.64,.075,.11,.075);
    part(body,'oval','#b88a28',0,.50,.64,.04,.04,.04);
    // Cute short tail
    part(body,'oval',white,0,.76,-.80,.06,.14,.07);
    part(body,'oval',spot,0,.64,-.84,.075,.09,.075);
    // Stubby chubby legs & dark hooves
    part(leg,'cylinder',white,0,-.19,0,.105,.40,.105);
    part(leg,'oval','#4a423a',0,-.40,.02,.115,.09,.125);
  }
  const b=mergeParts(body),l=mergeParts(leg);
  applyPorcelainFinish(b);applyPorcelainFinish(l);
  b.geometry.userData.shared=l.geometry.userData.shared=true;
  templates.set(species,{b,l});
  return{b,l};
}

function animalRig(a){
  const root=new T.Group(),body=new T.Group(),legs=[],chicken=a.species==='chicken',{b,l}=shape(a.species);
  body.add(b.clone());root.add(body);
  for(const s of[-1,1])for(const z of(chicken?[0]:[-.46,.32])){
    const pivot=new T.Group();
    pivot.position.set(s*(chicken?.09:.29),chicken?.18:.50,z);
    pivot.add(l.clone());root.add(pivot);legs.push(pivot);
  }
  root.scale.setScalar(a.species==='sheep'?.68:a.species==='cow'?.94:1.05);
  return{root,body,legs};
}

export function createTransportDisplay(state,area='farm',canWalk){
  let walkability=canWalk,barnResidents=new Set();if(canWalk)setHerdWalkability(state,canWalk);
  const root=new T.Group();root.name='walking-herd';
  const hay=new T.Group();part(hay,'oval','#d4b46a',0,.24,0,.48,.28,.33);part(hay,'cylinder','#8a7846',-.22,.27,0,.023,.59,.023);part(hay,'cylinder','#8a7846',.22,.27,0,.023,.59,.023);mergeParts(hay);hay.position.set(-9.5,0,1.2);root.add(hay);
  const interactions=[],photoSubjects=[],colliders=[],animals=ANIMALS.map((a,i)=>{const rig=animalRig(a);root.add(rig.root);photoSubjects.push({id:'pasture-'+a.id,speciesId:a.species,name:a.name,object:rig.root,offsetY:a.species==='chicken'?.35:.8});return{...a,...rig,i}});
  function update(dt=0,time=0,override){
    const current=override||(typeof area==='function'?area():area);
    root.visible=['farm','homestead','barn','coop'].includes(current);
    updateAnimalWander(state,dt,current,walkability);
    interactions.length=0;colliders.length=0;let outside=0;
    for(const a of animals){
      const p=herdPose(state,a.id,current);
      a.root.visible=root.visible&&p.visible&&!(['barn','coop'].includes(current)&&!state.herdRoutes?.[a.id]&&barnResidents.has(a.id));
      if(!a.root.visible)continue;
      const phase=p.phase??time*2.4+a.i,walking=p.walking;let x=p.x,z=p.z,angle=p.angle;
      if(!['barn','coop'].includes(current))outside++;
      colliders.push({x,z,r:bodyRadius(a.id),animalId:a.id});
      a.root.position.set(x,walking?Math.abs(Math.sin(phase))*.028:Math.sin(time*1.8+a.i)*.006,z);
      const diff=Math.atan2(Math.sin(angle-a.root.rotation.y),Math.cos(angle-a.root.rotation.y));
      a.root.rotation.y+=diff*(dt>0?1-Math.exp(-dt*8):1);
      a.body.rotation.x=walking?Math.sin(phase*2)*.025:Math.sin(time*.8+a.i)*.012;
      for(let j=0;j<a.legs.length;j++)a.legs[j].rotation.x=walking?Math.sin(phase+(j%2)*Math.PI+(j>1?Math.PI:0))*.42:0;
      if(!state.carryingHay||!['barn','coop'].includes(current)&&!walking)interactions.push({x,z,radius:a.species==='cow'?1.8:a.species==='sheep'?1.55:1.25,type:state.carryingHay||state.held==='chickenFeed'?'feed':'pet',label:a.name,data:{animalId:a.id,name:a.name}});
    }
    hay.visible=outside>0&&!['barn','coop'].includes(current);
    if(hay.visible)interactions.push({x:-9.5,z:1.2,radius:1.25,type:'hayRack',label:'Feno do pasto · pegar ou devolver uma porção',data:{}});
  }
  return{root,update,interactions,photoSubjects,colliders,setWalkability(fn){walkability=fn;setHerdWalkability(state,fn)},setBarnResidents(ids){barnResidents=new Set(ids)}};
}
