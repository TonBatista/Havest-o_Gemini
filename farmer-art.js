import * as T from './three.module.js';
import {miniatureTexture} from './miniature-materials.js?v=0.47';

const geometries=new Map();
function roundedBox(w,h,d,r){
  const key=[w,h,d,r].join('/');if(geometries.has(key))return geometries.get(key);
  const g=new T.BoxGeometry(w,h,d,3,3,2),p=g.attributes.position,core=new T.Vector3(w/2-r,h/2-r,d/2-r),v=new T.Vector3(),q=new T.Vector3();
  for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);q.set(T.MathUtils.clamp(v.x,-core.x,core.x),T.MathUtils.clamp(v.y,-core.y,core.y),T.MathUtils.clamp(v.z,-core.z,core.z));v.sub(q).normalize().multiplyScalar(r).add(q);p.setXYZ(i,v.x,v.y,v.z)}
  g.computeVertexNormals();geometries.set(key,g);return g;
}

// Sculpted PS1-indie polygon density (14x10 spheres for charming faceted silhouette)
const sphere=new T.SphereGeometry(1,14,10),smallSphere=new T.SphereGeometry(1,6,4);
let clothGrain;
function fineCloth(){
  if(clothGrain)return clothGrain;
  const c=document.createElement('canvas');c.width=c.height=64;const q=c.getContext('2d');q.imageSmoothingEnabled=false;q.fillStyle='#fcfaf5';q.fillRect(0,0,64,64);
  for(let i=0;i<64;i+=2){q.fillStyle=i%4?'#b5ad8f1c':'#ffffff28';q.fillRect(i,0,1,64);q.fillRect(0,i,64,1)}
  clothGrain=new T.CanvasTexture(c);clothGrain.colorSpace=T.SRGBColorSpace;clothGrain.wrapS=clothGrain.wrapT=T.RepeatWrapping;clothGrain.repeat.set(4,4);
  clothGrain.magFilter=T.NearestFilter;clothGrain.minFilter=T.NearestFilter;
  return clothGrain;
}

function material(color,kind='plain'){
  const m=new T.MeshStandardMaterial({
    color,
    roughness:kind==='metal'?.45:kind==='skin'?.58:.82,
    metalness:kind==='metal'?.55:0
  });
  if(kind==='fabric'){m.map=fineCloth();m.bumpMap=m.map;m.bumpScale=.0012}
  return m;
}

function add(parent,geometry,mat,x=0,y=0,z=0,sx=1,sy=sx,sz=sx){const o=new T.Mesh(geometry,mat);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=mat.userData.castShadow!==false;o.receiveShadow=true;parent.add(o);return o}
function ellipsoid(parent,mat,x,y,z,sx,sy=sx,sz=sx){return add(parent,sphere,mat,x,y,z,sx,sy,sz)}
function softBox(parent,mat,x,y,z,w,h,d,r=Math.min(w,h,d)*.38){return add(parent,roundedBox(w,h,d,r),mat,x,y,z)}
function clothPanel(parent,mat,x,y,z,w,h,d,r){
  const s=new T.Shape(),a=-w/2,b=-h/2;
  s.moveTo(a+r,b);s.lineTo(a+w-r,b);s.quadraticCurveTo(a+w,b,a+w,b+r);s.lineTo(a+w,b+h-r);s.quadraticCurveTo(a+w,b+h,a+w-r,b+h);s.lineTo(a+r,b+h);s.quadraticCurveTo(a,b+h,a,b+h-r);s.lineTo(a,b+r);s.quadraticCurveTo(a,b,a+r,b);
  const g=new T.ExtrudeGeometry(s,{depth:d,bevelEnabled:true,bevelSize:Math.min(d*.24,.004),bevelThickness:Math.min(d*.24,.004),bevelSegments:2,curveSegments:6});g.translate(0,0,-d/2);return add(parent,g,mat,x,y,z);
}
function curve(points){return new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)),false,'centripetal')}
function seam(parent,mat,points,r=.003,steps=16){return add(parent,new T.TubeGeometry(curve(points),steps,r,4,false),mat)}
function stitches(parent,mat,points,size=.006,count=12){
  const path=curve(points);
  for(let i=0;i<count;i++){const u=(i+.5)/count,p=path.getPointAt(u),d=path.getTangentAt(u),m=add(parent,smallSphere,mat,p.x,p.y,p.z,size*.38,size*.38,size);m.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),d)}
}
function ribbon(parent,mat,points,width=.045,depth=.009,steps=20){
  const path=curve(points),pos=[],uv=[],indices=[],normal=new T.Vector3(1,0,0);
  for(let i=0;i<=steps;i++){const u=i/steps,p=path.getPoint(u),t=path.getTangent(u);normal.set(1,0,0).addScaledVector(t,-t.x).normalize();for(const side of [-1,1]){const v=p.clone().addScaledVector(normal,side*width/2);pos.push(v.x,v.y,v.z);uv.push(side===-1?0:1,u)}}
  for(let i=0;i<steps;i++){let a=i*2;indices.push(a,a+1,a+3,a,a+3,a+2)}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();const m=add(parent,g,mat);m.material.side=T.DoubleSide;
  for(const side of [-1,1]){const edge=[];for(let i=0;i<=8;i++){const u=i/8,p=path.getPoint(u),t=path.getTangent(u);normal.set(1,0,0).addScaledVector(t,-t.x).normalize();p.addScaledVector(normal,side*width/2);edge.push([p.x,p.y,p.z])}seam(parent,mat,edge,depth,18)}
  return m;
}
function buckle(parent,mat,x,y,z,w=.043,h=.055){
  const r=.005;
  seam(parent,mat,[[x-w/2,y-h/2+r,z],[x-w/2,y+h/2-r,z],[x-w/2+r,y+h/2,z],[x+w/2-r,y+h/2,z],[x+w/2,y+h/2-r,z],[x+w/2,y-h/2+r,z],[x+w/2-r,y-h/2,z],[x-w/2+r,y-h/2,z],[x-w/2,y-h/2+r,z]],r,24);
  seam(parent,mat,[[x,y-h/2,z],[x,y+h*.08,z-.002]],.003,4);
}
function lockGeometry(points,width,thickness){
  const c=curve(points),positions=[],uv=[],indices=[],n=14,sides=6;
  for(let i=0;i<=n;i++){const u=i/n,p=c.getPoint(u),t=c.getTangent(u),side=new T.Vector3().crossVectors(t,new T.Vector3(0,0,1)).normalize(),out=new T.Vector3().crossVectors(side,t).normalize(),r=(.78+.24*Math.sin(u*Math.PI))*(.03+.97*Math.pow(1-u,.42));
  for(let j=0;j<=sides;j++){const a=j/sides*Math.PI*2,v=p.clone().addScaledVector(side,Math.cos(a)*width*r).addScaledVector(out,Math.sin(a)*thickness*r);positions.push(v.x,v.y,v.z);uv.push(j/sides,u)}
  }
  for(let i=0;i<n;i++)for(let j=0;j<sides;j++){const a=i*(sides+1)+j,b=a+sides+1;indices.push(a,b,a+1,b,b+1,a+1)}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
function wornCanvas(){
  const c=document.createElement('canvas');c.width=c.height=128;const q=c.getContext('2d');q.imageSmoothingEnabled=false;
  const fab=miniatureTexture('fabric',1);if(fab?.image)q.drawImage(fab.image,0,0,128,128);else{q.fillStyle='#c4956e';q.fillRect(0,0,128,128)}
  const noise=n=>{const v=Math.sin(n*127.1+48.3)*43758.5453;return v-Math.floor(v)};
  for(let i=0;i<36;i++){const x=noise(i)*128,y=noise(i+200)*128,r=3+noise(i+900)*14,g=q.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,i%3?'#fff1d522':'#79664920');g.addColorStop(1,'#ffffff00');q.fillStyle=g;q.fillRect(x-r,y-r,r*2,r*2)}
  const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;map.repeat.set(1.4,1.4);map.magFilter=T.NearestFilter;map.minFilter=T.NearestFilter;return map;
}

// Hand-painted PS1/JRPG face texture with rosy cheeks & soft nose bridge shading
function complexion(){
  const c=document.createElement('canvas');c.width=128;c.height=64;const q=c.getContext('2d');q.imageSmoothingEnabled=false;q.fillStyle='#fff9ee';q.fillRect(0,0,128,64);
  for(const x of [.145,.355]){
    const y=.62,g=q.createRadialGradient(x*128,y*64,0,x*128,y*64,7);
    g.addColorStop(0,'#d47a6288');g.addColorStop(.55,'#dc8d7455');g.addColorStop(1,'#dfab8a00');
    q.fillStyle=g;q.fillRect(x*128-8,y*64-8,16,16);
    // Cute PS1 pixel blush highlights
    q.fillStyle='#ffe8dc88';q.fillRect(Math.round(x*128)-2,Math.round(y*64)-1,1,1);q.fillRect(Math.round(x*128)+1,Math.round(y*64)-1,1,1);
  }
  const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.magFilter=T.NearestFilter;tex.minFilter=T.NearestFilter;return tex;
}

function nubuck(){
  const c=document.createElement('canvas');c.width=c.height=64;const q=c.getContext('2d');q.imageSmoothingEnabled=false;q.fillStyle='#e6decd';q.fillRect(0,0,64,64);
  for(let i=0;i<700;i++){const n=Math.sin(i*127.1+34.2)*43758.5453,x=Math.floor((n-Math.floor(n))*64),m=Math.sin(i*83.3+91)*17822.11,y=Math.floor((m-Math.floor(m))*64);q.fillStyle=i%3?'#ffffff22':'#68533f1c';q.fillRect(x,y,1,1)}
  const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(2,2);tex.magFilter=T.NearestFilter;tex.minFilter=T.NearestFilter;return tex;
}

function bakePart(root){
  root.updateWorldMatrix(true,true);const inv=root.matrixWorld.clone().invert(),byMaterial=new Map();
  root.traverse(o=>{if(!o.isMesh)return;const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(new T.Matrix4().multiplyMatrices(inv,o.matrixWorld));if(!byMaterial.has(o.material))byMaterial.set(o.material,[]);byMaterial.get(o.material).push(g)});
  root.clear();
  for(const [mat,parts] of byMaterial){const g=new T.BufferGeometry(),count=parts.reduce((n,p)=>n+p.attributes.position.count,0);for(const [name,width] of [['position',3],['normal',3],['uv',2]]){const data=new Float32Array(count*width);let cursor=0;for(const p of parts){if(p.attributes[name])data.set(p.attributes[name].array,cursor);cursor+=p.attributes.position.count*width}g.setAttribute(name,new T.BufferAttribute(data,width))}g.computeBoundingSphere();add(root,g,mat);parts.forEach(g=>g.dispose())}
}

export function createFarmer(scene,profile={}){
  const M={
    skin:material('#f3cca4','skin'),ear:material('#dca686','skin'),nose:material('#e8b890','skin'),blush:material('#dc997d','skin'),
    hair:material('#4a301f'),hairLight:material('#6f492b'),hairFine:material('#966b42'),
    cap:material('#728a6b','fabric'),capShade:material('#556d52','fabric'),capSeam:material('#8ea383','fabric'),
    shirt:material('#f2ebd6','fabric'),shirtShade:material('#d6cbb0','fabric'),shirtLight:material('#faf4e3','fabric'),
    glove:material('#f5efe0','fabric'),gloveShade:material('#d4ccb8','fabric'),
    overall:material('#736c82','fabric'),overallDark:material('#595269','fabric'),overallLight:material('#958da3','fabric'),
    thread:material('#b8b38c','fabric'),clothThread:material('#e6d1ae','fabric'),
    scarf:material('#8e6b9c','fabric'),scarfShade:material('#6e4e7d','fabric'),scarfLight:material('#b38ec0','fabric'),
    boot:material('#69462f'),bootDark:material('#4f3626'),bootLight:material('#8a6546'),sole:material('#423b30'),lace:material('#cbb689','fabric'),
    brass:material('#cca95e','metal'),metalDark:material('#877a5c','metal'),
    pack:material('#b57f5b','fabric'),packFade:material('#c79873','fabric'),packShade:material('#8f694e','fabric'),packEdge:material('#ba9e7b','fabric'),patch:material('#cbb68c','fabric'),
    eye:material('#221d19'),iris:material('#5e4632'),eyeWhite:material('#fffaf0'),glint:material('#ffffff'),mouth:material('#a36652','skin')
  };
  for(const key of ['thread','clothThread','brass','metalDark','packEdge','capSeam','lace','eyeWhite','eye','iris','glint','mouth','hairFine','blush','scarfLight','overallLight'])M[key].userData.castShadow=false;
  const packMap=wornCanvas();for(const key of ['pack','packFade','packShade']){M[key].map=M[key].bumpMap=packMap;M[key].bumpScale=.002}
  const leatherMap=nubuck();for(const key of ['boot','bootDark','bootLight']){M[key].map=M[key].bumpMap=leatherMap;M[key].bumpScale=.002}
  M.bib=M.overall.clone();M.bib.name='avatar-bib';
  M.glint.roughness=.12;M.eye.roughness=.16;M.iris.roughness=.22;M.hair.roughness=M.hairLight.roughness=.45;M.skin.roughness=.62;

  const farmer=new T.Group(),body=new T.Group(),torso=new T.Group();farmer.name='farmer';farmer.scale.setScalar(.84);farmer.add(body);body.add(torso);torso.scale.set(.96,.92,.95);torso.position.y=.015;scene.add(farmer);

  // Sculpted torso with shirt collar & tailored overalls
  const torsoGeometry=new T.LatheGeometry([new T.Vector2(.20,.67),new T.Vector2(.252,.70),new T.Vector2(.260,.73),new T.Vector2(.25,.92),new T.Vector2(.235,1.045),new T.Vector2(.178,1.10),new T.Vector2(.118,1.115)],24);
  const shirt=add(torso,torsoGeometry,M.shirt);shirt.scale.z=.77;
  ellipsoid(torso,M.skin,0,1.135,0,.115,.135,.115);
  // Shirt collar lapels
  for(const side of [-1,1]){
    const collar=softBox(torso,M.shirtLight,side*.065,1.085,.125,.075,.032,.075,.01);
    collar.rotation.set(.35,side*.32,-side*.25);
  }
  clothPanel(torso,M.bib,0,.810,.216,.132,.096,.010,.022);
  // Front bib pocket
  clothPanel(torso,M.overallLight,0,.808,.224,.076,.048,.006,.012);
  seam(torso,M.overallLight,[[-.058,.850,.224],[-.057,.782,.227],[0,.773,.227],[.057,.782,.227],[.058,.850,.224]],.0020,16);

  for(const side of [-1,1]){
    const x=side*.151;
    ribbon(torso,M.overallDark,[[x,.86,.212],[x,.99,.188],[x,1.091,.094],[x,1.093,-.055],[x,.99,-.166],[x,.78,-.19]],.058,.005);
    seam(torso,M.thread,[[x+side*.020,.91,.225],[x+side*.02,1.015,.17],[x+side*.02,1.09,.07],[x+side*.02,1.078,-.095]],.0021);
    ellipsoid(torso,M.brass,x,.902,.242,.022,.022,.010);
    ellipsoid(torso,M.metalDark,x,.902,.252,.005,.005,.003);
    seam(torso,M.overallDark,[[side*.25,.67,.11],[side*.27,.72,.08],[side*.267,.8,.045]],.007);
    seam(torso,M.overallLight,[[side*.216,.60,.124],[side*.235,.65,.14],[side*.252,.695,.12]],.0035);
  }

  // Detailed Canvas Rucksack with side rolled bedroll & brass buckles
  const backpack=new T.Group();backpack.name='small-worn-orange-backpack';torso.add(backpack);
  const bagGeo=new T.SphereGeometry(1,18,14),bp=bagGeo.attributes.position;
  for(let i=0;i<bp.count;i++){const rawX=bp.getX(i),rawY=bp.getY(i),rawZ=bp.getZ(i),x=Math.sign(rawX)*Math.pow(Math.abs(rawX),.52)*.215,y=Math.sign(rawY)*Math.pow(Math.abs(rawY),.50)*.25,z=Math.sign(rawZ)*Math.pow(Math.abs(rawZ),.65)*.105,shoulder=1-.10*T.MathUtils.smoothstep(y,.05,.25);bp.setXYZ(i,x*shoulder,y+Math.cos(x*12)*.005,z+(z<0?-.009*Math.cos(y*13)*Math.cos(x*7):0))}bagGeo.computeVertexNormals();
  add(backpack,bagGeo,M.pack,0,.85,-.365);
  ellipsoid(backpack,M.packShade,0,.85,-.248,.178,.214,.052);
  // Rolled bedroll strapped on top of rucksack for extra adventurer silhouette
  const bedroll=add(backpack,new T.CylinderGeometry(.052,.052,.34,10),M.shirtShade,0,1.085,-.375,1,1,1);
  bedroll.rotation.z=Math.PI/2;
  for(const side of [-1,1]){
    const gusset=softBox(backpack,M.packShade,side*.194,.825,-.362,.018,.300,.138,.008);gusset.rotation.z=side*.035;
    seam(backpack,M.packEdge,[[side*.178,.622,-.405],[side*.211,.677,-.44],[side*.208,.90,-.45],[side*.17,1.073,-.435]],.0031);
    seam(backpack,M.packShade,[[side*.185,.69,-.46],[side*.17,.81,-.475],[side*.178,.92,-.455]],.0028);
    // Bedroll leather straps
    ribbon(backpack,M.bootDark,[[side*.11,1.03,-.33],[side*.11,1.14,-.37],[side*.11,1.03,-.43]],.018,.003,10);
  }
  const flap=clothPanel(backpack,M.packFade,0,.992,-.481,.387,.199,.024,.042);flap.rotation.z=-.025;
  const flapEdge=[[-.179,1.058,-.499],[-.182,.953,-.500],[-.14,.906,-.501],[.128,.908,-.501],[.178,.951,-.500],[.178,1.058,-.499]];
  seam(backpack,M.packEdge,flapEdge,.003);stitches(backpack,M.clothThread,flapEdge,.0042,28);
  clothPanel(backpack,M.packFade,-.015,.744,-.484,.269,.164,.031,.034);
  const pocketEdge=[[-.139,.802,-.506],[-.139,.698,-.507],[-.109,.675,-.507],[.084,.675,-.507],[.116,.698,-.507],[.116,.802,-.506]];
  seam(backpack,M.packEdge,pocketEdge,.0024);stitches(backpack,M.clothThread,pocketEdge,.0041,24);
  softBox(backpack,M.packShade,.047,.891,-.506,.037,.167,.014,.006);
  softBox(backpack,M.packFade,.047,.897,-.515,.026,.162,.008,.003);
  buckle(backpack,M.brass,.047,.856,-.522,.041,.045);
  ellipsoid(backpack,M.metalDark,.047,.918,-.522,.0035,.004,.002);
  ellipsoid(backpack,M.metalDark,.047,.941,-.522,.0035,.004,.002);
  const tag=softBox(backpack,M.patch,-.062,.762,-.509,.067,.035,.006,.002);tag.rotation.z=.035;
  seam(backpack,M.packShade,[[-.083,.765,-.514],[-.043,.765,-.514]],.0017,4);
  ribbon(backpack,M.packShade,[[-.062,1.072,-.354],[-.061,1.143,-.355],[0,1.154,-.358],[.061,1.143,-.355],[.062,1.072,-.354]],.023,.0035,16);
  for(const side of [-1,1]){
    const points=[[side*.163,1.02,-.292],[side*.216,1.085,-.168],[side*.229,1.09,-.02],[side*.247,1.015,.137],[side*.244,.88,.188],[side*.24,.737,.17],[side*.231,.681,-.06],[side*.194,.722,-.281]];
    ribbon(torso,M.packShade,points,.040,.0049,28);
    seam(torso,M.packEdge,[[side*.239,1.074,-.1],[side*.249,1.06,.07],[side*.266,.97,.16],[side*.264,.82,.185]],.0020);
    buckle(torso,M.metalDark,side*.245,.813,.201,.033,.040);
  }

  // Folded kerchief
  const scarf=new T.Group();scarf.position.set(0,.935,.05);body.add(scarf);
  const scarfRing=new T.Mesh(new T.TorusGeometry(.166,.028,8,24),M.scarf);scarfRing.rotation.x=Math.PI/2;scarfRing.scale.set(1.08,1,.91);scarf.add(scarfRing);
  seam(scarf,M.scarfLight,[[-.15,-.009,.115],[-.08,-.03,.16],[.06,-.026,.17],[.15,.008,.12]],.004);
  seam(scarf,M.scarfShade,[[-.16,.018,.1],[-.08,.008,.18],[.10,.013,.164]],.0045);
  const knot=ellipsoid(scarf,M.scarfLight,.092,-.012,.218,.036,.029,.028);knot.rotation.z=.4;
  scarf.scale.setScalar(.9);const tail=new T.Group();tail.scale.setScalar(.62);tail.position.set(.048,.918,.245);tail.rotation.z=-.28;body.add(tail);
  add(tail,lockGeometry([[0,0,0],[-.010,-.09,.035],[-.057,-.181,.022]],.046,.011),M.scarf);
  add(tail,lockGeometry([[.035,0,0],[.072,-.055,.018],[.096,-.123,.011]],.035,.010),M.scarfShade);
  seam(tail,M.scarfLight,[[-.021,-.025,.017],[-.033,-.095,.04],[-.060,-.157,.032]],.0024);

  // Expressive PS1-JRPG Sculpted Head (Softer chin taper, fuller cheeks, larger expressive eyes)
  const head=new T.Group();head.position.y=1.30;head.scale.setScalar(1.13);body.add(head);const headArt=new T.Group();head.add(headArt);
  const faceGeo=new T.SphereGeometry(1,22,16),fp=faceGeo.attributes.position;
  for(let i=0;i<fp.count;i++){
    const x=fp.getX(i),y=fp.getY(i),z=fp.getZ(i);
    const cheek=1+.048*Math.exp(-Math.pow((y+.13)*3.2,2));
    const jaw=1-.13*T.MathUtils.smoothstep(-y,.12,.95);
    const chin=y<-.55&&z>0?1+.04*Math.exp(-x*x*18):1;
    fp.setXYZ(i,x*.338*cheek*jaw,Math.sign(y)*Math.pow(Math.abs(y),.88)*.304-.015,z*(z>0?.292*chin:.275));
  }
  faceGeo.computeVertexNormals();
  const faceMaterial=M.skin.clone();faceMaterial.map=complexion();
  add(headArt,faceGeo,faceMaterial);

  for(const side of [-1,1]){
    const ear=ellipsoid(headArt,M.skin,side*.332,-.018,-.004,.065,.082,.056);ear.rotation.z=side*-.16;
    ellipsoid(headArt,M.ear,side*.362,-.018,.033,.020,.038,.015);
  }
  // Cute sculpted nose with warm bridge highlight
  ellipsoid(headArt,M.nose,0,-.065,.288,.025,.022,.023);
  ellipsoid(headArt,M.skin,-.005,-.058,.302,.012,.010,.008);
  // Warm cheerful smile
  seam(headArt,M.mouth,[[-.036,-.148,.264],[-.016,-.162,.270],[.015,-.162,.270],[.036,-.147,.264]],.0036,14);

  // Large expressive JRPG/PS1 eyes (preserving exact .083 blink pivot)
  const eyes=[];
  for(const side of [-1,1]){
    const e=new T.Group();e.position.set(side*.124,-.010,.268);e.scale.y=.083;head.add(e);eyes.push(e);
    const eyeArt=new T.Group();eyeArt.position.set(0,.005/.083,0);eyeArt.rotation.y=side*.11;e.add(eyeArt);
    ellipsoid(eyeArt,M.eyeWhite,0,0,0,.048,.94,.010);
    ellipsoid(eyeArt,M.iris,-side*.005,.025,.010,.043,.95,.010);
    ellipsoid(eyeArt,M.eye,-side*.006,.085,.018,.029,.76,.007);
    // Double anime/PS1 catchlights for lively expression
    ellipsoid(eyeArt,M.glint,-.011,.36,.026,.008,.15,.003);
    ellipsoid(eyeArt,M.glint,.012,-.28,.025,.004,.07,.002);
    // Bold lash line & expressive eyebrows
    seam(headArt,M.hair,[[side*.124-.048,.038,.280],[side*.124-.034,.074,.284],[side*.124,.084,.284],[side*.124+.034,.072,.279],[side*.124+.048,.038,.272]],.0040,16);
    seam(headArt,M.hair,[[side*.086,.116,.270],[side*.122,.126,.265],[side*.158,.119,.254]],.0048,10);
  }

  // Layered hair tufts & sideburns
  const hairGeo=new T.SphereGeometry(1,22,14,0,Math.PI*2,0,Math.PI*.77);
  add(headArt,hairGeo,M.hair,0,.138,-.047,.345,.218,.285);
  for(const side of [-1,1]){
    add(headArt,lockGeometry([[side*.301,.186,.088],[side*.326,.065,.088],[side*.302,-.022,.064]],.048,.028),M.hair);
    add(headArt,lockGeometry([[side*.269,.147,-.157],[side*.305,.035,-.184],[side*.245,-.058,-.205]],.052,.024),M.hair);
  }
  ellipsoid(headArt,M.hair,0,.205,.292,.121,.074,.018);
  // Sweeping forelocks with extra volume
  add(headArt,lockGeometry([[-.124,.145,.262],[-.232,.222,.320],[-.362,.192,.336],[-.455,.070,.298]],.058,.043),M.hairLight);
  add(headArt,lockGeometry([[-.164,.125,.279],[-.266,.106,.340],[-.306,-.002,.342],[-.272,-.086,.305]],.050,.037),M.hairLight);
  add(headArt,lockGeometry([[.115,.150,.265],[.195,.185,.308],[.255,.115,.315]],.040,.028),M.hairLight);

  const capArt=new T.Group();capArt.name='avatar-hat-cap';head.add(capArt);
  const capPos=[],capUv=[],capIndex=[],around=36,rows=18;
  function capHem(a){const x=Math.sin(a)*.413;return .154+(Math.cos(a)>0?.100*Math.exp(-Math.pow(x/.108,4)):0)}
  for(let j=0;j<=rows;j++)for(let i=0;i<=around;i++){
    const a=i/around*Math.PI*2,t=j/rows*Math.acos((capHem(a)-.193)/.352);capPos.push(Math.sin(a)*Math.sin(t)*.413,.193+Math.cos(t)*.352,-.036+Math.cos(a)*Math.sin(t)*.359);capUv.push(i/around,j/rows);
  }
  for(let j=0;j<rows;j++)for(let i=0;i<around;i++){const a=j*(around+1)+i,b=a+around+1;capIndex.push(a,b,a+1,b,b+1,a+1)}
  const capGeo=new T.BufferGeometry();capGeo.setAttribute('position',new T.Float32BufferAttribute(capPos,3));capGeo.setAttribute('uv',new T.Float32BufferAttribute(capUv,2));capGeo.setIndex(capIndex);capGeo.computeVertexNormals();add(capArt,capGeo,M.cap);
  const band=[];for(let i=0;i<=48;i++){const a=i/48*Math.PI*2,t=Math.acos((capHem(a)-.193)/.352);band.push([Math.sin(a)*Math.sin(t)*.413,capHem(a),-.036+Math.cos(a)*Math.sin(t)*.359])}seam(capArt,M.capShade,band,.0065,52);
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2,points=[],end=Math.acos((capHem(a)-.193)/.352);for(let j=0;j<=10;j++){const t=j/10*end;points.push([Math.sin(a)*Math.sin(t)*.414,.193+Math.cos(t)*.353,-.036+Math.cos(a)*Math.sin(t)*.360])}seam(capArt,M.capSeam,points,.0015,22)}
  ellipsoid(capArt,M.capShade,0,.546,-.036,.024,.012,.024);
  ellipsoid(capArt,M.cap,0,.552,-.036,.018,.008,.018);
  const brimPositions=[],brimUv=[],brimIndex=[],nx=24,ny=5;
  for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){const a=(i/nx-.5)*Math.PI*.94,u=j/ny,r=.182+u*.17,x=Math.sin(a)*r,z=-.241-Math.cos(a)*r*.85,y=.171-u*.024+Math.sin(a)**2*.014;brimPositions.push(x,y,z);brimUv.push(i/nx,u)}
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+nx+1;brimIndex.push(a,b,a+1,b,b+1,a+1)}
  const brim=new T.BufferGeometry();brim.setAttribute('position',new T.Float32BufferAttribute(brimPositions,3));brim.setAttribute('uv',new T.Float32BufferAttribute(brimUv,2));brim.setIndex(brimIndex);brim.computeVertexNormals();M.capShade.side=T.DoubleSide;add(capArt,brim,M.capShade);const topBrim=add(capArt,brim,M.cap);topBrim.position.y=.007;
  const brimEdge=[];for(let i=0;i<=24;i++){const a=(i/24-.5)*Math.PI*.94;brimEdge.push([Math.sin(a)*.352,.152+Math.sin(a)**2*.014,-.241-Math.cos(a)*.352*.85])}seam(capArt,M.capSeam,brimEdge,.0020,28);
  softBox(capArt,M.capShade,0,.174,.325,.221,.031,.014,.005);
  softBox(capArt,M.cap,.023,.178,.337,.169,.025,.009,.003);
  for(const x of [-.021,.011,.043])ellipsoid(capArt,M.capShade,x,.178,.344,.0038,.0045,.002);

  // Arms, cuffed gloves, knees & sturdy work boots
  const arms=[],legs=[],knees=[],feet=[];
  for(const side of [-1,1]){
    const arm=new T.Group();arm.position.set(side*.287,.914,0);body.add(arm);arms.push(arm);const armArt=new T.Group();arm.add(armArt);
    const sleeve=ellipsoid(armArt,M.shirt,side*.008,-.075,-.008,.089,.104,.088);sleeve.rotation.z=side*.12;
    const cuff=ellipsoid(armArt,M.shirtLight,side*.012,-.154,.005,.084,.018,.087);cuff.rotation.z=side*.055;
    ellipsoid(armArt,M.skin,0,-.201,.014,.067,.083,.070);
    ellipsoid(armArt,M.gloveShade,0,-.272,.015,.077,.020,.081);
    ellipsoid(armArt,M.glove,0,-.275,.018,.079,.020,.083);
    ellipsoid(armArt,M.glove,0,-.326,.023,.080,.077,.084);
    const thumb=ellipsoid(armArt,M.glove,-side*.063,-.317,.060,.032,.044,.032);thumb.rotation.z=side*.3;
    bakePart(armArt);

    const leg=new T.Bone();leg.position.set(side*.155,.49,0);body.add(leg);legs.push(leg);const thighArt=new T.Group();leg.add(thighArt);
    const knee=new T.Bone();knee.position.y=-.22;leg.add(knee);knees.push(knee);const shinArt=new T.Group();knee.add(shinArt);
    const foot=new T.Group();foot.position.y=-.21;knee.add(foot);feet.push(foot);
    ellipsoid(foot,M.sole,0,-.047,.065,.142,.031,.198);
    const bootGeometry=new T.SphereGeometry(1,16,12),bootPos=bootGeometry.attributes.position;
    for(let j=0;j<bootPos.count;j++)bootPos.setY(j,Math.max(-.72,bootPos.getY(j)));bootGeometry.computeVertexNormals();
    add(foot,bootGeometry,M.boot,0,.026,.073,.148,.114,.198);
    ellipsoid(foot,M.boot,0,.073,-.012,.108,.096,.110);
    // Boot cuff & brass lace eyelets
    ellipsoid(foot,M.bootLight,0,.115,-.012,.112,.024,.114);
    seam(foot,M.bootLight,[[-.102,-.025,.17],[0,-.032,.236],[.102,-.025,.17]],.0023,16);
    for(let j=0;j<2;j++){const z=.041+j*.038,y=.125-j*.012;seam(foot,M.lace,[[-.038,y,z],[0,y+.005,z+.018],[.038,y,z+.024]],.0034,8)}
    bakePart(foot);
  }

  // Continuous deforming overalls & trousers
  const garmentPositions=[],garmentUv=[],garmentIndices=[],garmentSkin=[],garmentWeights=[];
  const garmentSides=36,garmentRows=18,legRows=18;
  const baseLocalY=(.56-.015)/.91,baseRadius=.249+.020*Math.sin(Math.PI*((baseLocalY-.55)/.45)),waistRx=baseRadius*.97,waistRz=baseRadius*.79*.96;
  function vertex(x,y,z,u,v,indices=[0,0,0,0],weights=[1,0,0,0]){garmentPositions.push(x,y,z);garmentUv.push(u,v);garmentSkin.push(...indices);garmentWeights.push(...weights)}
  function rings(start,rows){for(let j=0;j<rows;j++)for(let i=0;i<garmentSides;i++){const k=start+j*(garmentSides+1)+i;garmentIndices.push(k,k+1,k+garmentSides+2,k,k+garmentSides+2,k+garmentSides+1)}}
  for(let j=0;j<=garmentRows;j++)for(let i=0;i<=garmentSides;i++){
    const a=i/garmentSides*Math.PI*2,u=j/garmentRows,top=.843+.158*T.MathUtils.smoothstep(Math.cos(a),.67,.83),y=baseLocalY+u*(top-baseLocalY),radius=.249+.020*Math.sin(Math.PI*T.MathUtils.clamp((y-.55)/.45,0,1));
    vertex(Math.sin(a)*radius*.97,y*.91+.015,Math.cos(a)*radius*.79*.96,i/garmentSides,u*.6+.4);
  }
  rings(0,garmentRows);
  for(let sideIndex=0;sideIndex<2;sideIndex++){
    const side=sideIndex===0?-1:1,start=garmentPositions.length/3,hipIndex=sideIndex===0?1:3,kneeIndex=hipIndex+1;
    for(let j=0;j<=legRows;j++)for(let i=0;i<=garmentSides;i++){
      const a=i/garmentSides*Math.PI*2,u=j/legRows,sn=Math.sin(a),cs=Math.cos(a),y=.135+u*(.56-.135),r=.106+.015*Math.sin(Math.PI*u),loft=T.MathUtils.smoothstep(u,.58,1),inner=sn*side<0;
      const targetX=inner?0:sn*waistRx,targetY=inner?.475+.085*Math.abs(cs):.56,targetZ=cs*waistRz;
      const x=T.MathUtils.lerp(side*.155+sn*r,targetX,loft),yy=T.MathUtils.lerp(y,targetY,loft),z=T.MathUtils.lerp(cs*r*1.05+.012*T.MathUtils.smoothstep(u,.3,.8),targetZ,loft);
      const fixed=T.MathUtils.smoothstep(u,.58,1),kneeWeight=T.MathUtils.smoothstep(.365-y,0,.18),hipWeight=(1-fixed)*(1-kneeWeight),shinWeight=(1-fixed)*kneeWeight;
      vertex(x,yy,z,i/garmentSides,u*.4,[0,hipIndex,kneeIndex,0],[fixed,hipWeight,shinWeight,0]);
    }
    rings(start,legRows);
  }
  const garmentGeo=new T.BufferGeometry();garmentGeo.setAttribute('position',new T.Float32BufferAttribute(garmentPositions,3));garmentGeo.setAttribute('uv',new T.Float32BufferAttribute(garmentUv,2));garmentGeo.setAttribute('skinIndex',new T.Uint16BufferAttribute(garmentSkin,4));garmentGeo.setAttribute('skinWeight',new T.Float32BufferAttribute(garmentWeights,4));garmentGeo.setIndex(garmentIndices);garmentGeo.computeVertexNormals();
  const normalGroups=new Map(),normals=garmentGeo.attributes.normal;
  for(let j=0;j<garmentPositions.length/3;j++){const key=garmentPositions.slice(j*3,j*3+3).map(v=>Math.round(v*1e5)).join('/');if(!normalGroups.has(key))normalGroups.set(key,[]);normalGroups.get(key).push(j)}
  for(const points of normalGroups.values()){if(points.length<2)continue;const normal=new T.Vector3();for(const j of points)normal.add(new T.Vector3().fromBufferAttribute(normals,j));normal.normalize();for(const j of points)normals.setXYZ(j,normal.x,normal.y,normal.z)}
  const pelvis=new T.Bone();body.add(pelvis);const bibIndexCount=garmentRows*garmentSides*6;garmentGeo.clearGroups();garmentGeo.addGroup(0,bibIndexCount,0);garmentGeo.addGroup(bibIndexCount,garmentIndices.length-bibIndexCount,1);const garment=new T.SkinnedMesh(garmentGeo,[M.bib,M.overall]);garment.name='continuous-overalls-and-trousers';garment.castShadow=garment.receiveShadow=true;body.add(garment);body.updateWorldMatrix(true,true);garment.bind(new T.Skeleton([pelvis,legs[0],knees[0],legs[1],knees[1]]));

  // Hats, Hair variants, Dress & Winter coat
  const strawHat=new T.Group();strawHat.name='avatar-hat-straw';head.add(strawHat);const strawMat=material('#d4b678','fabric'),strawEdge=material('#b8975c','fabric');add(strawHat,new T.CylinderGeometry(.60,.62,.038,28),strawMat,0,.17,-.03);ellipsoid(strawHat,strawMat,0,.32,-.03,.37,.25,.33);add(strawHat,new T.CylinderGeometry(.368,.375,.07,24),M.scarf,0,.235,-.03);seam(strawHat,strawEdge,Array.from({length:33},(_,i)=>{const a=i/32*Math.PI*2;return[Math.sin(a)*.61,.195,-.03+Math.cos(a)*.61]}),.006,32);bakePart(strawHat);
  const beanie=new T.Group();beanie.name='avatar-hat-beanie';head.add(beanie);ellipsoid(beanie,M.cap,0,.32,-.035,.374,.28,.331);const hem=new T.Mesh(new T.TorusGeometry(.341,.047,8,28),M.capShade);hem.rotation.x=Math.PI/2;hem.position.set(0,.19,-.035);hem.scale.z=.94;beanie.add(hem);for(let i=0;i<12;i++){const a=i/12*Math.PI*2;seam(beanie,M.capSeam,[[Math.sin(a)*.36,.205,-.035+Math.cos(a)*.31],[Math.sin(a)*.31,.43,-.035+Math.cos(a)*.27],[Math.sin(a)*.09,.576,-.035+Math.cos(a)*.08]],.003,10)}for(const side of[-1,1]){ellipsoid(beanie,M.cap,side*.34,.055,-.02,.078,.16,.16);seam(beanie,M.capSeam,[[side*.38,.16,.07],[side*.39,.03,.06],[side*.37,-.08,.02]],.006,8)}ellipsoid(beanie,M.capSeam,0,.64,-.035,.105,.10,.105);bakePart(beanie);bakePart(capArt);
  const uncoveredHair=new T.Group();uncoveredHair.name='avatar-uncovered-hair';head.add(uncoveredHair);ellipsoid(uncoveredHair,M.hair,0,.16,-.062,.344,.224,.284);add(uncoveredHair,lockGeometry([[-.24,.26,.08],[-.21,.31,.22],[-.09,.25,.29]],.045,.020),M.hairLight);add(uncoveredHair,lockGeometry([[.04,.35,-.02],[.11,.42,-.06],[.17,.37,-.10]],.032,.018),M.hairLight);bakePart(uncoveredHair);
  const skirt=new T.Group();skirt.name='avatar-country-dress';body.add(skirt);add(skirt,new T.CylinderGeometry(.252,.38,.43,24,2,true),M.overall,0,.468,.005);const dressHem=new T.Mesh(new T.TorusGeometry(.373,.014,6,24),M.overallLight);dressHem.rotation.x=Math.PI/2;dressHem.position.set(0,.258,.005);skirt.add(dressHem);seam(skirt,M.overallLight,[[0,.67,.257],[-.025,.49,.32],[-.04,.27,.377]],.0025,14);bakePart(skirt);
  bakePart(torso);bakePart(headArt);bakePart(scarf);bakePart(tail);
  const longHair=new T.Group();longHair.name='avatar-braids';head.add(longHair);
  for(const side of[-1,1]){
    add(longHair,lockGeometry([[side*.28,.08,-.12],[side*.34,-.13,-.10],[side*.32,-.43,.035],[side*.28,-.61,.09]],.064,.039),M.hair);
    for(let i=0;i<6;i++){const braid=ellipsoid(longHair,i%2?M.hairLight:M.hair,side*(.325+Math.sin(i*2.1)*.018),-.12-i*.072,-.09+i*.029,.056,.061,.047);braid.rotation.z=side*(i%2?.21:-.18)}
    ellipsoid(longHair,M.scarfLight,side*.29,-.55,.083,.061,.024,.052);
    add(longHair,lockGeometry([[side*.29,-.56,.09],[side*.27,-.64,.12],[side*.30,-.68,.12]],.036,.022),M.hairLight);
  }
  bakePart(longHair);M.hair.name='avatar-hair';M.hairLight.name='avatar-hair-light';M.hairFine.name='avatar-hair-fine';
  const winterSleeves=arms.map(arm=>{const g=new T.Group();arm.add(g);ellipsoid(g,M.overall,0,-.135,.005,.097,.175,.094);ellipsoid(g,M.overallDark,0,-.266,.014,.09,.028,.09);bakePart(g);return g});
  const winterCoat=new T.Group();body.add(winterCoat);ellipsoid(winterCoat,M.overall,0,.83,.015,.285,.35,.205);for(const x of[-.09,.09])seam(winterCoat,M.overallLight,[[x,.56,.19],[x,.88,.22],[x,1.1,.17]],.009,10);for(const y of[.68,.81,.94])ellipsoid(winterCoat,M.overallLight,0,y,.225,.025,.025,.015);bakePart(winterCoat);

  function setAppearance(value={}){const valid=c=>/^#[0-9a-f]{6}$/i.test(c||''),sex=value.sex==='female'?'female':'male',color=valid(value.hairColor)?value.hairColor:'#6c492d',hat=['cap','straw','beanie','none'].includes(value.hat)?value.hat:'cap',outfit=['overalls','workshirt','winter'].includes(value.outfit)||sex==='female'&&value.outfit==='dress'?value.outfit:'overalls',shirtColor=valid(value.shirtColor)?value.shirtColor:'#f2ebd6',clothesColor=valid(value.clothesColor)?value.clothesColor:'#736c82';const base=new T.Color(color),shirtBase=new T.Color(shirtColor),clothBase=new T.Color(clothesColor);M.hair.color.copy(base).multiplyScalar(.70);M.hairLight.color.copy(base);M.hairFine.color.copy(base).lerp(new T.Color('#ead7b1'),.25);M.cap.color.set(hat==='beanie'?shirtColor:'#728a6b');M.capShade.color.copy(M.cap.color).multiplyScalar(.83);M.capSeam.color.copy(M.cap.color).lerp(new T.Color('#eee2cf'),.25);M.shirt.color.copy(shirtBase);M.shirtShade.color.copy(shirtBase).multiplyScalar(.86);M.shirtLight.color.copy(shirtBase).lerp(new T.Color('#fff9e8'),.2);M.overall.color.copy(clothBase);M.bib.color.copy(outfit==='workshirt'?shirtBase:clothBase);M.overallDark.color.copy(outfit==='workshirt'?shirtBase:clothBase).multiplyScalar(.82);M.overallLight.color.copy(outfit==='workshirt'?shirtBase:clothBase).lerp(new T.Color('#eee2cf'),.21);longHair.visible=sex==='female';headArt.scale.x=sex==='female'?.98:1;capArt.visible=hat==='cap';strawHat.visible=hat==='straw';beanie.visible=hat==='beanie';uncoveredHair.visible=hat==='none';skirt.visible=outfit==='dress';winterCoat.visible=outfit==='winter';winterSleeves.forEach(g=>g.visible=outfit==='winter');farmer.userData.avatar={sex,hairColor:color,hat,outfit,shirtColor,clothesColor};return farmer.userData.avatar}
  setAppearance(profile);
  return {farmer,body,head,eyes,scarf,tail,arms,legs,knees,feet,setAppearance,get appearance(){return {...farmer.userData.avatar}}};
}
