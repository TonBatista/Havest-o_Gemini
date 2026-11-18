import * as T from './three.module.js';
import {miniatureTexture} from './miniature-materials.js?v=0.47';

const random=n=>{const v=Math.sin(n*127.1+34.2)*43758.5453;return v-Math.floor(v)};
const textures=new Map(),materials=new Map();

function configureRetroTex(tex, repeat=1){
  tex.colorSpace=T.SRGBColorSpace;
  tex.wrapS=tex.wrapT=T.RepeatWrapping;
  tex.repeat.set(repeat,repeat);
  tex.magFilter=T.NearestFilter;
  tex.minFilter=T.NearestFilter;
  tex.generateMipmaps=false;
  tex.anisotropy=1;
  return tex;
}

function surfaceTexture(kind){
  if(textures.has(kind))return textures.get(kind);
  // 128x128 hand-painted PS1 pixel texture
  const c=document.createElement('canvas');c.width=c.height=128;const q=c.getContext('2d');
  q.imageSmoothingEnabled=false;
  q.fillStyle='#d8d3c6';q.fillRect(0,0,128,128);
  for(let i=0;i<1800;i++){q.fillStyle=i%2?'#ffffff1a':'#3026191e';q.fillRect(Math.floor(random(i)*128),Math.floor(random(i+8000)*128),1+Math.floor(random(i+40)*2),1)}
  if(kind==='wood'){
    q.fillStyle='#c4ae86';q.fillRect(0,0,128,128);
    for(let p=0;p<8;p++){
      const y=p*16;
      q.fillStyle=p%2?'#bfa77c':'#cbb58e';q.fillRect(0,y+1,128,14);
      q.fillStyle='#5c452966';q.fillRect(0,y,128,1);
      q.fillStyle='#f4e6c844';q.fillRect(0,y+1,128,1);
      for(let g=0;g<12;g++){
        const gx=Math.floor(random(p*31+g)*120);
        q.fillStyle=g%2?'#785b3733':'#ebdcb933';
        q.fillRect(gx,y+3+(g%9),6+Math.floor(random(g)*14),1);
      }
    }
  }
  if(kind==='leaf'){
    q.fillStyle='#729152';q.fillRect(0,0,128,128);
    for(let i=0;i<320;i++){
      const x=Math.floor(random(i)*128),y=Math.floor(random(i+20)*128);
      q.fillStyle=i%3===0?'#9ab86e':i%3===1?'#536e3b':'#b7cf82';
      q.fillRect(x,y,2,2);q.fillRect(x+1,y+1,2,1);
    }
  }
  if(kind==='cottageStone'){
    q.fillStyle='#797566';q.fillRect(0,0,128,128);
    const shades=['#cbc6b2','#bebaa6','#d6d0bc','#b0ad9b','#c4c0ae'];
    for(let row=0;row<6;row++)for(let col=-1;col<5;col++){
      const n=row*7+col+101,x=Math.floor(col*32+(row%2)*16),y=Math.floor(row*128/6),h=Math.ceil(128/6);
      q.fillStyle=shades[Math.floor(random(n)*shades.length)];
      q.fillRect(x+1,y+1,30,h-2);
      q.fillStyle='#f7efd655';q.fillRect(x+2,y+1,28,1);
      q.fillStyle='#46433455';q.fillRect(x+2,y+h-2,29,1);
    }
  }
  const map=configureRetroTex(new T.CanvasTexture(c),1);
  textures.set(kind,map);return map;
}

const archedDoorShape=new T.Shape();archedDoorShape.moveTo(-.41,0);archedDoorShape.lineTo(.41,0);archedDoorShape.lineTo(.41,1.19);archedDoorShape.absarc(0,1.19,.41,0,Math.PI,false);archedDoorShape.lineTo(-.41,0);
const archedDoorGeometry=new T.ExtrudeGeometry(archedDoorShape,{depth:.06,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.014,bevelThickness:.012});archedDoorGeometry.userData.shared=true;

export function artisanMaterial(color,kind='stone'){
  const key=kind+color;if(!materials.has(key)){
    const photograph=miniatureTexture(kind==='siding'?'wood':kind);
    let map=kind==='cottageStone'||kind==='wood'?surfaceTexture(kind):photograph||surfaceTexture(kind==='siding'?'wood':kind);
    const tint=new T.Color(color);
    if(kind==='siding'){if(!textures.has('siding')){const horizontal=surfaceTexture('wood').clone();horizontal.needsUpdate=true;textures.set('siding',horizontal)}map=textures.get('siding')}
    if(photograph&&map===photograph)tint.lerp(new T.Color('#fff7e6'),kind==='leaf'?.32:kind==='bark'?.32:kind==='clay'?.48:.50);
    // Crisp flat-shaded faceted look + rich hand-painted texture for nostalgic PS1 indie charm
    const material=new T.MeshStandardMaterial({
      color:tint,
      map,
      bumpMap:map,
      bumpScale:kind==='fabric'?.005:kind==='leaf'?.009:kind==='wood'||kind==='siding'?.018:kind==='bark'?.035:.022,
      roughness:kind==='clay'?.88:.92,
      flatShading:kind==='stone'||kind==='cottageStone'||kind==='bark'||kind==='clay'
    });
    material.userData.seasonSurface=({leaf:'leaf',moss:'grass',clay:'roof',wood:'wood',siding:'wood',bark:'wood',stone:'stone',cottageStone:'stone',earth:'soil',fabric:'fabric'})[kind]||kind;
    materials.set(key,material);
  }return materials.get(key);
}

const square=new T.Shape();square.moveTo(-.46,-.46);square.lineTo(.46,-.46);square.lineTo(.46,.46);square.lineTo(-.46,.46);square.closePath();
const softBox=new T.ExtrudeGeometry(square,{depth:.92,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.035,bevelThickness:.035});softBox.translate(0,0,-.46);
const roofTile=new T.ExtrudeGeometry(square,{depth:.9,bevelEnabled:true,bevelSegments:1,steps:2,bevelSize:.04,bevelThickness:.03});roofTile.translate(0,0,-.45);
const tilePositions=roofTile.attributes.position;
for(let i=0;i<tilePositions.count;i++){const x=tilePositions.getX(i),z=tilePositions.getZ(i);tilePositions.setY(i,tilePositions.getY(i)+.22*(1-4*z*z)+.02*Math.sin(x*7+z*4))}roofTile.computeVertexNormals();

// Faceted low-poly sphere & cylinder (8-10 sides) for sculpted PS1 indie forms
const sphere=new T.SphereGeometry(1,10,7),cylinder=new T.CylinderGeometry(1,1,1,9);
const windowGlass=new T.MeshStandardMaterial({color:'#a8c7bf',emissive:'#e89d42',emissiveIntensity:.38,roughness:.25,metalness:.08});
const warmLanternGlass=new T.MeshStandardMaterial({color:'#ffe4a3',emissive:'#ffaa3b',emissiveIntensity:.85,roughness:.2});

function add(parent,geo,material,x,y,z,sx,sy,sz){const m=new T.Mesh(geo,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=m.receiveShadow=true;parent.add(m);return m}
function block(p,color,x,y,z,sx,sy,sz,kind='wood'){return add(p,softBox,artisanMaterial(color,kind),x,y,z,sx,sy,sz)}
function round(p,color,x,y,z,sx,sy,sz,kind='stone'){return add(p,sphere,artisanMaterial(color,kind),x,y,z,sx,sy,sz)}

export function cottage(x,z,w,d,color,roof){
  const g=new T.Group();g.position.set(x,0,z);
  const wallBase=new T.Color(color).lerp(new T.Color('#ece6d3'),.65),wallPalette=[-.04,0,.04].map(v=>'#'+wallBase.clone().offsetHSL(-.01,-.04,v).getHexString());
  const frame='#7a5938',timberDark='#5c4026',door='#c29658',houseSeed=x*3.17+z*1.83;

  // Stone foundation plinth with corner quoins
  block(g,'#9c9680',0,.17,0,w+.24,.34,d+.24,'stone');
  for(const side of [-1,1])for(let i=0;i<Math.ceil(d/.52);i++){
    const stone=block(g,i%2?'#ccc6b0':'#a8a490',side*(w/2+.06),.18,-d/2+(i+.5)*d/Math.ceil(d/.52),.17,.26,d/Math.ceil(d/.52)-.025,'stone');
    stone.rotation.z=(random(i+13)-.5)*.03;
  }

  // Main cottage walls + Tudor-style half-timbered beams
  block(g,wallPalette[1],0,1.38,0,w,2.38,d,'cottageStone');
  for(const sx of [-1,1])for(const sz of [-1,1]){
    block(g,timberDark,sx*(w/2-.02),1.38,sz*(d/2+.045),.20,2.42,.21,'wood');
    // Corner stone quoins
    for(let q=0;q<4;q++)block(g,q%2?'#c7c1aa':'#b3ae98',sx*(w/2+.03),.55+q*.48,sz*(d/2+.03),.23,.22,.23,'stone');
  }
  // Horizontal timber belt & diagonal half-timbering braces
  block(g,frame,0,.39,d/2+.04,w+.06,.13,.12,'wood');
  block(g,frame,0,1.42,d/2+.045,w+.06,.10,.11,'wood');
  block(g,timberDark,0,2.50,d/2+.06,w+.16,.17,.17,'wood');
  for(const side of [-1,1]){
    block(g,timberDark,side*(w/2+.045),2.50,0,.16,.17,d+.06,'wood');
    block(g,frame,side*(w/2+.04),1.42,0,.11,.10,d+.04,'wood');
    block(g,frame,side*(w/2+.04),.39,0,.12,.13,d+.04,'wood');
    // Diagonal timber struts on front & side walls
    const strut=block(g,frame,side*(w/2-.32),2.02,d/2+.045,.52,.08,.09,'wood');strut.rotation.z=side*.72;
  }

  // Roof slabs & layered sculpted terracotta/slate shingles
  const half=w/2+.38,rise=1.22,angle=Math.atan2(rise,half),length=Math.hypot(half,rise),depth=d+.74;
  for(const side of [-1,1]){
    const slab=block(g,'#5e422e',side*half/2,3.16,0,length,.14,depth,'wood');slab.rotation.z=-side*angle;
    const rows=6,cols=Math.ceil(depth/.42),roofBase=new T.Color(roof).lerp(new T.Color('#bfa98e'),.28);
    const roofPalette=Array.from({length:6},(_,i)=>artisanMaterial('#'+roofBase.clone().offsetHSL((i%3-1)*.015,-.05,(i-2.5)*.028).getHexString(),'clay'));
    const mossPalette=['#7d9658','#98ab64'].map(c=>artisanMaterial(c,'moss'));
    for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
      const n=row*31+col+side*173,u=(row+.5)/rows,xx=side*half*u,zz=-depth/2+(col+.5)*depth/cols+(random(n+20)-.5)*.025;
      const moss=Math.sin(col*.76+row*.53+houseSeed)*.42+Math.cos(col*.39-row*.61+houseSeed*.4)*.35,tileMaterial=moss>.26+(side>0?.08:-.06)?mossPalette[(col+row)%2]:roofPalette[Math.floor(random(n)*roofPalette.length)];
      const tile=add(g,roofTile,tileMaterial,xx,3.77-rise*u+.06+(random(n+10)-.5)*.03,zz,length/rows*1.18,.08,depth/cols-.01);
      tile.rotation.z=-side*(angle+.05)+(random(n+9)-.5)*.022;tile.rotation.x=(random(n+14)-.5)*.025;
    }
    for(const sz of [-1,1]){const fascia=block(g,'#6b4d31',side*half/2,3.14,sz*(depth/2+.03),length+.10,.16,.12,'wood');fascia.rotation.z=-side*angle}
    block(g,'#694c31',side*half,2.55,0,.15,.18,depth+.12,'wood');
  }
  for(let i=0;i<Math.ceil(depth/.28);i++){
    const ridge=add(g,cylinder,artisanMaterial(roof,'clay'),0,3.82,-depth/2+(i+.5)*depth/Math.ceil(depth/.28),.12,.30,.12);
    ridge.rotation.x=Math.PI/2;
  }

  // Wooden gables with decorative truss & round attic window
  const gable=new T.BufferGeometry();gable.setAttribute('position',new T.Float32BufferAttribute([-w/2,2.55,d/2, w/2,2.55,d/2, 0,3.73,d/2, -w/2,2.55,-d/2, 0,3.73,-d/2, w/2,2.55,-d/2],3));gable.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,.5,.8,0,0,.5,.8,1,0],2));gable.computeVertexNormals();
  const ends=new T.Mesh(gable,artisanMaterial(wallPalette[1],'siding'));g.add(ends);
  for(const side of [-1,1]){const brace=block(g,timberDark,side*w*.21,3.03,d/2+.07,Math.hypot(w*.42,1.08),.10,.11,'wood');brace.rotation.z=-side*Math.atan2(1.08,w*.42)}
  block(g,timberDark,0,3.05,d/2+.08,.13,1.18,.14,'wood');
  round(g,'#684d30',0,3.03,d/2+.05,.25,.25,.045,'wood');add(g,sphere,windowGlass,0,3.03,d/2+.085,.17,.17,.025);block(g,'#d9c496',0,3.03,d/2+.115,.03,.32,.025,'wood');

  // Arched plank door with iron hinges, brass handle, stone arch & warm porch lantern
  add(g,archedDoorGeometry,artisanMaterial('#63472e','wood'),-.5,.18,d/2+.085,1.22,1.15,1);
  add(g,archedDoorGeometry,artisanMaterial(door,'wood'),-.5,.23,d/2+.19,1,1,1);
  for(let i=0;i<4;i++)block(g,'#755633',-.79+i*.19,.84,d/2+.275,.015,1.15,.016,'wood');
  // Iron strap hinges
  for(const hy of [.52,1.12])block(g,'#454a44',-.74,hy,d/2+.285,.28,.045,.02,'stone');
  block(g,'#c5ad7a',-.5,.48,d/2+.285,.71,.07,.035,'wood');round(g,'#e5c675',-.22,.91,d/2+.305,.048,.048,.038,'stone');
  for(let i=0;i<7;i++){const a=(i+.5)*Math.PI/7,stone=block(g,i%2?'#ccc3a4':'#b5ac90',-.5+Math.cos(a)*.56,1.43+Math.sin(a)*.56,d/2+.15,.22,.22,.23,'stone');stone.rotation.z=a-Math.PI/2}
  for(const side of [-1,1])for(let i=0;i<4;i++)block(g,i%2?'#ccc3a4':'#b5ac90',-.5+side*.57,.38+i*.26,d/2+.14,.20,.24,.21,'stone');
  block(g,'#9f9c86',-.5,.07,d/2+.36,1.34,.14,.50,'stone');

  // Porch wall lantern next to the door
  block(g,'#4b4e46',.16,1.62,d/2+.16,.07,.07,.22,'stone');
  add(g,softBox,warmLanternGlass,.16,1.47,d/2+.24,.14,.18,.14);
  block(g,'#4b4e46',.16,1.58,d/2+.24,.18,.04,.18,'stone');

  // Front & side windows with shutters, mullions & flower boxes
  const wx=w*.28;block(g,'#5e4a32',wx,1.53,d/2+.09,1.06,1.04,.18,'wood');add(g,softBox,windowGlass,wx,1.53,d/2+.19,.81,.79,.035);
  for(const sx of [-1,1]){block(g,'#5f754e',wx+sx*.63,1.53,d/2+.13,.24,1.01,.09,'wood');for(let j=0;j<5;j++)block(g,'#7e9464',wx+sx*.63,1.19+j*.16,d/2+.19,.25,.04,.025,'wood')}
  block(g,'#ebe0c3',wx,1.53,d/2+.24,.05,.83,.04,'wood');block(g,'#ebe0c3',wx,1.53,d/2+.24,.84,.05,.04,'wood');

  block(g,timberDark,w/2+.075,1.47,-.15,.16,1.05,1.14,'wood');add(g,softBox,windowGlass,w/2+.16,1.47,-.15,.025,.83,.92);
  block(g,'#ebe0c3',w/2+.19,1.47,-.15,.038,.88,.045,'wood');block(g,'#ebe0c3',w/2+.19,1.47,-.15,.038,.046,.96,'wood');
  block(g,timberDark,w/2+.16,.91,-.15,.34,.11,1.24,'wood');
  block(g,'#7a5b36',wx,.97,d/2+.29,1.18,.25,.40,'wood');
  for(let i=0;i<7;i++){const xx=wx-.45+i*.15;round(g,'#587a3f',xx,1.13,d/2+.3,.18,.16,.18,'leaf');for(let j=0;j<5;j++){const a=j*Math.PI*2/5;round(g,i%2?'#f0cf75':'#dfadc2',xx+Math.sin(a)*.048,1.27+Math.cos(a)*.048,d/2+.37,.036,.038,.028)}round(g,'#bd9c4b',xx,1.27,d/2+.4,.025,.025,.022)}

  // Brick chimney
  for(let row=0;row<5;row++)for(let col=0;col<2;col++){block(g,row%2?'#a68b72':'#b89f82',w*.25+(col-.5)*.27,3.38+row*.19,-d*.2,.26,.18,.52,'stone')}
  block(g,'#6e6555',w*.25,4.28,-d*.2,.68,.15,.68,'stone');block(g,'#2e3128',w*.25,4.36,-d*.2,.40,.015,.39,'stone');

  // Climbing vines & foundation shrubs
  for(let i=0;i<26;i++){const y=.45+i*.075,xx=-w/2+.23+Math.sin(i*.55)*.11;const leaf=round(g,i%3?'#627d48':'#879e5e',xx,y,d/2+.14,.11,.06,.04,'leaf');leaf.rotation.z=i%2?.55:-.55}
  for(let i=0;i<8;i++)round(g,i%2?'#5f7844':'#789154',w/2+.03,.25,-d/2+.3+i*(d-.5)/8,.24,.26,.31,'leaf');
  return g;
}

export function canopyGeometry(){
  const g=new T.IcosahedronGeometry(1,2),p=g.attributes.position;
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),r=1+.085*Math.sin(x*13+z*4)*Math.sin(y*11-z*6)+.05*Math.cos(z*17+x*7);p.setXYZ(i,x*r,y*r,z*r)}g.computeVertexNormals();return g;
}

let crownPalette;
const crownLeaf=new T.BufferGeometry(),leafPoints=[],leafUV=[],leafIndices=[];
for(let row=0;row<6;row++){
  const v=row/5,width=Math.pow(Math.sin(v*Math.PI),.75)*.33+.002,curve=.09*Math.sin(v*Math.PI)-.065*v*v;
  for(let col=0;col<3;col++){
    const side=col-1;leafPoints.push(side*width,curve+.058*(1-side*side)*Math.sin(v*Math.PI)-.012*side*side,v-.48);leafUV.push(col/2,v);
  }
  if(row<5)for(let col=0;col<2;col++){const n=row*3+col;leafIndices.push(n,n+3,n+1,n+1,n+3,n+4)}
}
crownLeaf.setAttribute('position',new T.Float32BufferAttribute(leafPoints,3));crownLeaf.setAttribute('uv',new T.Float32BufferAttribute(leafUV,2));crownLeaf.setIndex(leafIndices);crownLeaf.computeVertexNormals();
const branchGeometry=new T.CylinderGeometry(1,1,1,6);

export function treeCrown(seed=0){
  if(!crownPalette){
    const source=miniatureTexture('leaf')||surfaceTexture('leaf'),canvas=document.createElement('canvas');canvas.width=canvas.height=128;const q=canvas.getContext('2d');q.imageSmoothingEnabled=false;q.drawImage(source.image,0,0,128,128);const leaf=configureRetroTex(new T.CanvasTexture(canvas),1);
    crownPalette=['#b6d19e','#cde0b4','#d8e5bd','#9ec28e'].map(color=>{const m=new T.MeshStandardMaterial({color,map:leaf,bumpMap:leaf,bumpScale:.01,roughness:.76,side:T.DoubleSide});m.userData.seasonSurface='leaf';return m});
  }
  const g=new T.Group(),up=new T.Vector3(0,1,0),normal=new T.Vector3(),start=new T.Vector3(),end=new T.Vector3(),mid=new T.Vector3(),bark=artisanMaterial('#948160','bark');
  const branch=(a,b,r)=>{start.fromArray(a);end.fromArray(b);mid.subVectors(end,start);const m=add(g,branchGeometry,bark,(start.x+end.x)/2,(start.y+end.y)/2,(start.z+end.z)/2,r,mid.length(),r*.78);m.quaternion.setFromUnitVectors(up,mid.normalize());return m};
  branch([0,-.74,0],[.025,.24,-.025],.076);
  const clusters=[[-.63,-.15,-.13,.38,.30,.37],[.58,-.10,.20,.40,.32,.37],[-.34,.40,.04,.42,.34,.39],[.23,.47,-.23,.40,.35,.40],[-.13,-.37,.37,.43,.28,.37],[.11,-.23,-.48,.43,.31,.37],[-.65,.19,.30,.36,.31,.35],[.62,.23,-.27,.36,.32,.35]];
  clusters.forEach(([cx,cy,cz,rx,ry,rz],cluster)=>{
    const phase=seed*.11,turn=new T.Vector3(cx,cy,cz).applyAxisAngle(up,phase),x=turn.x,y=turn.y,z=turn.z;
    branch([.025,-.38+cluster*.045,-.025],[x*.88,y,z*.88],.022+random(seed+cluster)*.014);
    for(let i=0;i<56;i++){
      const n=seed*173+cluster*97+i,a=i*2.399963+cluster*1.1,yy=1-2*(i+.5)/56,r=Math.sqrt(1-yy*yy),depth=.50+.50*Math.cbrt(random(n+40));
      const dx=Math.cos(a)*r*rx*depth,dz=Math.sin(a)*r*rz*depth,dy=yy*ry*depth,size=.20+random(n+18)*.11;
      const m=add(g,crownLeaf,crownPalette[(cluster+(i%5===0?1:0))%4],x+dx,y+dy,z+dz,size*(.90+random(n+15)*.22),size,size);
      normal.set(dx*.7,.14+dy*.8,dz*.7).normalize();m.quaternion.setFromUnitVectors(up,normal);m.rotateY(a+(random(n+30)-.5)*1.6);m.rotateX((random(n+32)-.5)*.65);
    }
  });
  return g;
}

export function meadowGeometry(){
  const points=[],uv=[],indices=[];
  for(let i=0;i<5;i++){
    const angle=i*2.399963,c=Math.cos(angle),s=Math.sin(angle),h=.21+random(i+70)*.16,w=.015+random(i+93)*.008,bend=.065+random(i+31)*.07,spread=.018+random(i+11)*.022,base=points.length/3;
    for(let row=0;row<3;row++){
      const v=row/2,width=w*(row===0?1:row===1?.65:.04),z=spread+bend*v*v;
      for(const side of [-1,1]){const x=side*width;points.push(x*c+z*s,v*h,z*c-x*s);uv.push((side+1)/2,v)}
    }
    indices.push(base,base+2,base+1,base+1,base+2,base+3,base+2,base+4,base+3,base+3,base+4,base+5);
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(points,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
