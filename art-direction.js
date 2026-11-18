import * as T from './three.module.js';
import {miniatureTexture} from './miniature-materials.js?v=0.47';

const random=n=>{const v=Math.sin(n*127.1+34.2)*43758.5453;return v-Math.floor(v)};
const textures=new Map(),materials=new Map();

function configurePaintedTex(tex, repeat=1){
  tex.colorSpace=T.SRGBColorSpace;
  tex.wrapS=tex.wrapT=T.RepeatWrapping;
  tex.repeat.set(repeat,repeat);
  tex.anisotropy=8;
  tex.needsUpdate=true;
  return tex;
}

function surfaceTexture(kind){
  if(textures.has(kind))return textures.get(kind);
  const c=document.createElement('canvas');c.width=c.height=512;const q=c.getContext('2d');
  q.fillStyle='#e2dccb';q.fillRect(0,0,512,512);
  for(let i=0;i<6000;i++){q.fillStyle=i%2?'#ffffff18':'#3b2e1d18';q.fillRect(random(i)*512,random(i+8000)*512,1.5+random(i+40)*2.5,1.5)}
  if(kind==='wood'){
    q.fillStyle='#c9ae82';q.fillRect(0,0,512,512);
    for(let p=0;p<8;p++){
      const y=p*64;
      q.fillStyle=p%2?'#c2a577':'#d1b78c';q.fillRect(0,y+2,512,60);
      q.fillStyle='#5c432666';q.fillRect(0,y,512,3);
      q.fillStyle='#fff2d655';q.fillRect(0,y+3,512,2);
      for(let i=0;i<24;i++){
        q.strokeStyle=i%2?'#6b4e2b26':'#f7e6c42e';q.lineWidth=1.2+random(i+p)*1.8;
        q.beginPath();
        for(let x=0;x<=512;x+=16){
          const yy=y+10+(i*2.1)%46+Math.sin(x*.02+i+p)*2.2;
          x?q.lineTo(x,yy):q.moveTo(x,yy);
        }
        q.stroke();
      }
    }
  }
  if(kind==='leaf'){
    q.fillStyle='#6d944c';q.fillRect(0,0,512,512);
    for(let i=0;i<900;i++){
      const x=random(i)*512,y=random(i+20)*512;
      q.fillStyle=i%3===0?'#9ec46a55':i%3===1?'#496b3455':'#c2dc8444';
      q.beginPath();q.ellipse(x,y,4+random(i+42)*7,2.5+random(i+56)*4.5,random(i+30)*6,0,Math.PI*2);q.fill();
    }
  }
  if(kind==='cottageStone'){
    q.fillStyle='#868170';q.fillRect(0,0,512,512);
    const shades=['#d6d0bc','#c8c3ae','#e0dac6','#bab6a2','#cfc9b4'];
    for(let row=0;row<6;row++)for(let col=-1;col<5;col++){
      const n=row*7+col+101,x=col*128+(row%2)*64,y=row*512/6,h=512/6;
      q.fillStyle=shades[Math.floor(random(n)*shades.length)];
      q.beginPath();q.roundRect(x+4,y+4,120,h-8,9+random(n+8)*5);q.fill();
      q.strokeStyle='#fff7de55';q.lineWidth=2.5;q.beginPath();q.moveTo(x+12,y+7);q.lineTo(x+114,y+7);q.stroke();
      q.strokeStyle='#4a463638';q.beginPath();q.moveTo(x+120,y+12);q.lineTo(x+120,y+h-8);q.lineTo(x+12,y+h-8);q.stroke();
    }
  }
  const map=configurePaintedTex(new T.CanvasTexture(c),1);
  textures.set(kind,map);return map;
}

const archedDoorShape=new T.Shape();archedDoorShape.moveTo(-.41,0);archedDoorShape.lineTo(.41,0);archedDoorShape.lineTo(.41,1.19);archedDoorShape.absarc(0,1.19,.41,0,Math.PI,false);archedDoorShape.lineTo(-.41,0);
const archedDoorGeometry=new T.ExtrudeGeometry(archedDoorShape,{depth:.06,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.016,bevelThickness:.014});archedDoorGeometry.userData.shared=true;

export function artisanMaterial(color,kind='stone'){
  const key=kind+color;if(!materials.has(key)){
    const photograph=miniatureTexture(kind==='siding'?'wood':kind);
    let map=kind==='cottageStone'||kind==='wood'?surfaceTexture(kind):photograph||surfaceTexture(kind==='siding'?'wood':kind);
    const tint=new T.Color(color);
    if(kind==='siding'){if(!textures.has('siding')){const horizontal=surfaceTexture('wood').clone();horizontal.needsUpdate=true;textures.set('siding',horizontal)}map=textures.get('siding')}
    if(photograph&&map===photograph)tint.lerp(new T.Color('#fff9ee'),kind==='leaf'?.30:kind==='bark'?.32:kind==='clay'?.42:.48);
    // Warm velvet shading with subtle sheen for hand-painted storybook richness
    const material=new T.MeshStandardMaterial({
      color:tint,
      map,
      bumpMap:map,
      bumpScale:kind==='fabric'?.006:kind==='leaf'?.010:kind==='wood'||kind==='siding'?.022:kind==='bark'?.042:.026,
      roughness:kind==='clay'?.84:kind==='leaf'?.76:.88,
      metalness:0.02
    });
    material.userData.seasonSurface=({leaf:'leaf',moss:'grass',clay:'roof',wood:'wood',siding:'wood',bark:'wood',stone:'stone',cottageStone:'stone',earth:'soil',fabric:'fabric'})[kind]||kind;
    materials.set(key,material);
  }return materials.get(key);
}

const square=new T.Shape();square.moveTo(-.46,-.46);square.lineTo(.46,-.46);square.lineTo(.46,.46);square.lineTo(-.46,.46);square.closePath();
const softBox=new T.ExtrudeGeometry(square,{depth:.92,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.042,bevelThickness:.042});softBox.translate(0,0,-.46);
const roofTile=new T.ExtrudeGeometry(square,{depth:.9,bevelEnabled:true,bevelSegments:2,steps:2,bevelSize:.048,bevelThickness:.038});roofTile.translate(0,0,-.45);
const tilePositions=roofTile.attributes.position;
for(let i=0;i<tilePositions.count;i++){const x=tilePositions.getX(i),z=tilePositions.getZ(i);tilePositions.setY(i,tilePositions.getY(i)+.24*(1-4*z*z)+.025*Math.sin(x*7+z*4))}roofTile.computeVertexNormals();

const sphere=new T.SphereGeometry(1,16,12),cylinder=new T.CylinderGeometry(1,1,1,14);
const windowGlass=new T.MeshStandardMaterial({color:'#b4d6ce',emissive:'#f2a644',emissiveIntensity:.45,roughness:.22,metalness:.06});
const warmLanternGlass=new T.MeshStandardMaterial({color:'#ffebb5',emissive:'#ffaa38',emissiveIntensity:.95,roughness:.18});

function add(parent,geo,material,x,y,z,sx,sy,sz){const m=new T.Mesh(geo,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=m.receiveShadow=true;parent.add(m);return m}
function block(p,color,x,y,z,sx,sy,sz,kind='wood'){return add(p,softBox,artisanMaterial(color,kind),x,y,z,sx,sy,sz)}
function round(p,color,x,y,z,sx,sy,sz,kind='stone'){return add(p,sphere,artisanMaterial(color,kind),x,y,z,sx,sy,sz)}

export function cottage(x,z,w,d,color,roof){
  const g=new T.Group();g.position.set(x,0,z);
  const wallBase=new T.Color(color).lerp(new T.Color('#f4eedc'),.62),wallPalette=[-.04,0,.04].map(v=>'#'+wallBase.clone().offsetHSL(-.01,-.03,v).getHexString());
  const frame='#7e5b38',timberDark='#5c3f24',door='#c99a59',houseSeed=x*3.17+z*1.83;

  // Stone foundation plinth with hand-laid corner quoins
  block(g,'#a6a089',0,.17,0,w+.24,.34,d+.24,'stone');
  for(const side of [-1,1])for(let i=0;i<Math.ceil(d/.52);i++){
    const stone=block(g,i%2?'#d4ceb8':'#b2ae98',side*(w/2+.06),.18,-d/2+(i+.5)*d/Math.ceil(d/.52),.17,.26,d/Math.ceil(d/.52)-.025,'stone');
    stone.rotation.z=(random(i+13)-.5)*.025;
  }

  // Storybook Half-Timbered Cottage Walls
  block(g,wallPalette[1],0,1.38,0,w,2.38,d,'cottageStone');
  for(const sx of [-1,1])for(const sz of [-1,1]){
    block(g,timberDark,sx*(w/2-.02),1.38,sz*(d/2+.045),.20,2.42,.21,'wood');
    for(let q=0;q<4;q++)block(g,q%2?'#cfc9b2':'#bbb69e',sx*(w/2+.03),.55+q*.48,sz*(d/2+.03),.23,.22,.23,'stone');
  }
  block(g,frame,0,.39,d/2+.04,w+.06,.13,.12,'wood');
  block(g,frame,0,1.42,d/2+.045,w+.06,.10,.11,'wood');
  block(g,timberDark,0,2.50,d/2+.06,w+.16,.17,.17,'wood');
  for(const side of [-1,1]){
    block(g,timberDark,side*(w/2+.045),2.50,0,.16,.17,d+.06,'wood');
    block(g,frame,side*(w/2+.04),1.42,0,.11,.10,d+.04,'wood');
    block(g,frame,side*(w/2+.04),.39,0,.12,.13,d+.04,'wood');
    const strut=block(g,frame,side*(w/2-.32),2.02,d/2+.045,.52,.08,.09,'wood');strut.rotation.z=side*.72;
  }

  // Sculpted Terracotta Roof Shingles with Soft Moss Patches
  const half=w/2+.38,rise=1.24,angle=Math.atan2(rise,half),length=Math.hypot(half,rise),depth=d+.74;
  for(const side of [-1,1]){
    const slab=block(g,'#61432e',side*half/2,3.17,0,length,.14,depth,'wood');slab.rotation.z=-side*angle;
    const rows=6,cols=Math.ceil(depth/.42),roofBase=new T.Color(roof).lerp(new T.Color('#d49e72'),.24);
    const roofPalette=Array.from({length:6},(_,i)=>artisanMaterial('#'+roofBase.clone().offsetHSL((i%3-1)*.015,-.03,(i-2.5)*.028).getHexString(),'clay'));
    const mossPalette=['#85a35c','#a2b86a'].map(c=>artisanMaterial(c,'moss'));
    for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
      const n=row*31+col+side*173,u=(row+.5)/rows,xx=side*half*u,zz=-depth/2+(col+.5)*depth/cols+(random(n+20)-.5)*.025;
      const moss=Math.sin(col*.76+row*.53+houseSeed)*.42+Math.cos(col*.39-row*.61+houseSeed*.4)*.35,tileMaterial=moss>.26+(side>0?.08:-.06)?mossPalette[(col+row)%2]:roofPalette[Math.floor(random(n)*roofPalette.length)];
      const tile=add(g,roofTile,tileMaterial,xx,3.79-rise*u+.06+(random(n+10)-.5)*.03,zz,length/rows*1.18,.082,depth/cols-.01);
      tile.rotation.z=-side*(angle+.05)+(random(n+9)-.5)*.022;tile.rotation.x=(random(n+14)-.5)*.025;
    }
    for(const sz of [-1,1]){const fascia=block(g,'#6e4e31',side*half/2,3.15,sz*(depth/2+.03),length+.10,.16,.12,'wood');fascia.rotation.z=-side*angle}
    block(g,'#6c4e31',side*half,2.55,0,.15,.18,depth+.12,'wood');
  }
  for(let i=0;i<Math.ceil(depth/.28);i++){
    const ridge=add(g,cylinder,artisanMaterial(roof,'clay'),0,3.84,-depth/2+(i+.5)*depth/Math.ceil(depth/.28),.12,.30,.12);
    ridge.rotation.x=Math.PI/2;
  }

  // Wooden Gables with Truss & Glowing Attic Window
  const gable=new T.BufferGeometry();gable.setAttribute('position',new T.Float32BufferAttribute([-w/2,2.55,d/2, w/2,2.55,d/2, 0,3.75,d/2, -w/2,2.55,-d/2, 0,3.75,-d/2, w/2,2.55,-d/2],3));gable.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,.5,.8,0,0,.5,.8,1,0],2));gable.computeVertexNormals();
  const ends=new T.Mesh(gable,artisanMaterial(wallPalette[1],'siding'));g.add(ends);
  for(const side of [-1,1]){const brace=block(g,timberDark,side*w*.21,3.04,d/2+.07,Math.hypot(w*.42,1.08),.10,.11,'wood');brace.rotation.z=-side*Math.atan2(1.08,w*.42)}
  block(g,timberDark,0,3.06,d/2+.08,.13,1.18,.14,'wood');
  round(g,'#6b4e30',0,3.04,d/2+.05,.25,.25,.045,'wood');add(g,sphere,windowGlass,0,3.04,d/2+.085,.17,.17,.025);block(g,'#e2cd9e',0,3.04,d/2+.115,.03,.32,.025,'wood');

  // Arched Plank Door, Iron Hinges, Stone Arch & Warm Porch Lantern
  add(g,archedDoorGeometry,artisanMaterial('#66482e','wood'),-.5,.18,d/2+.085,1.22,1.15,1);
  add(g,archedDoorGeometry,artisanMaterial(door,'wood'),-.5,.23,d/2+.19,1,1,1);
  for(let i=0;i<4;i++)block(g,'#785834',-.79+i*.19,.84,d/2+.275,.015,1.15,.016,'wood');
  for(const hy of [.52,1.12])block(g,'#454a44',-.74,hy,d/2+.285,.28,.045,.02,'stone');
  block(g,'#cbb37e',-.5,.48,d/2+.285,.71,.07,.035,'wood');round(g,'#edd07a',-.22,.91,d/2+.305,.048,.048,.038,'stone');
  for(let i=0;i<7;i++){const a=(i+.5)*Math.PI/7,stone=block(g,i%2?'#d4cbb0':'#bdb498',-.5+Math.cos(a)*.56,1.43+Math.sin(a)*.56,d/2+.15,.22,.22,.23,'stone');stone.rotation.z=a-Math.PI/2}
  for(const side of [-1,1])for(let i=0;i<4;i++)block(g,i%2?'#d4cbb0':'#bdb498',-.5+side*.57,.38+i*.26,d/2+.14,.20,.24,.21,'stone');
  block(g,'#a8a48e',-.5,.07,d/2+.36,1.34,.14,.50,'stone');

  block(g,'#4b4e46',.16,1.62,d/2+.16,.07,.07,.22,'stone');
  add(g,softBox,warmLanternGlass,.16,1.47,d/2+.24,.14,.18,.14);
  block(g,'#4b4e46',.16,1.58,d/2+.24,.18,.04,.18,'stone');

  // Front & Side Windows with Shutters, Mullions & Blooming Flower Boxes
  const wx=w*.28;block(g,'#614c33',wx,1.53,d/2+.09,1.06,1.04,.18,'wood');add(g,softBox,windowGlass,wx,1.53,d/2+.19,.81,.79,.035);
  for(const sx of [-1,1]){block(g,'#637d50',wx+sx*.63,1.53,d/2+.13,.24,1.01,.09,'wood');for(let j=0;j<5;j++)block(g,'#849e68',wx+sx*.63,1.19+j*.16,d/2+.19,.25,.04,.025,'wood')}
  block(g,'#f2e8cc',wx,1.53,d/2+.24,.05,.83,.04,'wood');block(g,'#f2e8cc',wx,1.53,d/2+.24,.84,.05,.04,'wood');

  block(g,timberDark,w/2+.075,1.47,-.15,.16,1.05,1.14,'wood');add(g,softBox,windowGlass,w/2+.16,1.47,-.15,.025,.83,.92);
  block(g,'#f2e8cc',w/2+.19,1.47,-.15,.038,.88,.045,'wood');block(g,'#f2e8cc',w/2+.19,1.47,-.15,.038,.046,.96,'wood');
  block(g,timberDark,w/2+.16,.91,-.15,.34,.11,1.24,'wood');
  block(g,'#7e5e37',wx,.97,d/2+.29,1.18,.25,.40,'wood');
  for(let i=0;i<7;i++){const xx=wx-.45+i*.15;round(g,'#5d8442',xx,1.13,d/2+.3,.18,.16,.18,'leaf');for(let j=0;j<5;j++){const a=j*Math.PI*2/5;round(g,i%2?'#f7d674':'#ebadc7',xx+Math.sin(a)*.048,1.27+Math.cos(a)*.048,d/2+.37,.036,.038,.028)}round(g,'#c7a24a',xx,1.27,d/2+.4,.025,.025,.022)}

  // Brick Chimney
  for(let row=0;row<5;row++)for(let col=0;col<2;col++){block(g,row%2?'#b09276':'#c2a687',w*.25+(col-.5)*.27,3.39+row*.19,-d*.2,.26,.18,.52,'stone')}
  block(g,'#736958',w*.25,4.29,-d*.2,.68,.15,.68,'stone');block(g,'#2e3128',w*.25,4.37,-d*.2,.40,.015,.39,'stone');

  // Climbing Vines & Lush Foundation Shrubs
  for(let i=0;i<26;i++){const y=.45+i*.075,xx=-w/2+.23+Math.sin(i*.55)*.11;const leaf=round(g,i%3?'#67874b':'#8fab62',xx,y,d/2+.14,.11,.06,.04,'leaf');leaf.rotation.z=i%2?.55:-.55}
  for(let i=0;i<8;i++)round(g,i%2?'#628246':'#7f9e58',w/2+.03,.25,-d/2+.3+i*(d-.5)/8,.24,.26,.31,'leaf');
  return g;
}

export function canopyGeometry(){
  const g=new T.IcosahedronGeometry(1,2),p=g.attributes.position;
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),r=1+.085*Math.sin(x*13+z*4)*Math.sin(y*11-z*6)+.05*Math.cos(z*17+x*7);p.setXYZ(i,x*r,y*r,z*r)}g.computeVertexNormals();return g;
}

let crownPalette;
const crownLeaf=new T.BufferGeometry(),leafPoints=[],leafUV=[],leafIndices=[];
for(let row=0;row<6;row++){
  const v=row/5,width=Math.pow(Math.sin(v*Math.PI),.75)*.34+.002,curve=.09*Math.sin(v*Math.PI)-.065*v*v;
  for(let col=0;col<3;col++){
    const side=col-1;leafPoints.push(side*width,curve+.058*(1-side*side)*Math.sin(v*Math.PI)-.012*side*side,v-.48);leafUV.push(col/2,v);
  }
  if(row<5)for(let col=0;col<2;col++){const n=row*3+col;leafIndices.push(n,n+3,n+1,n+1,n+3,n+4)}
}
crownLeaf.setAttribute('position',new T.Float32BufferAttribute(leafPoints,3));crownLeaf.setAttribute('uv',new T.Float32BufferAttribute(leafUV,2));crownLeaf.setIndex(leafIndices);crownLeaf.computeVertexNormals();
const branchGeometry=new T.CylinderGeometry(1,1,1,7);

export function treeCrown(seed=0){
  if(!crownPalette){
    const source=miniatureTexture('leaf')||surfaceTexture('leaf'),canvas=document.createElement('canvas');canvas.width=canvas.height=512;const q=canvas.getContext('2d');q.drawImage(source.image,0,0,512,512);const leaf=configurePaintedTex(new T.CanvasTexture(canvas),1);
    crownPalette=['#a8d48c','#c4e3a1','#d7ecb0','#8ec278'].map(color=>{const m=new T.MeshStandardMaterial({color,map:leaf,bumpMap:leaf,bumpScale:.012,roughness:.74,side:T.DoubleSide});m.userData.seasonSurface='leaf';return m});
  }
  const g=new T.Group(),up=new T.Vector3(0,1,0),normal=new T.Vector3(),start=new T.Vector3(),end=new T.Vector3(),mid=new T.Vector3(),bark=artisanMaterial('#99825e','bark');
  const branch=(a,b,r)=>{start.fromArray(a);end.fromArray(b);mid.subVectors(end,start);const m=add(g,branchGeometry,bark,(start.x+end.x)/2,(start.y+end.y)/2,(start.z+end.z)/2,r,mid.length(),r*.78);m.quaternion.setFromUnitVectors(up,mid.normalize());return m};
  branch([0,-.74,0],[.025,.24,-.025],.076);
  const clusters=[[-.63,-.15,-.13,.38,.30,.37],[.58,-.10,.20,.40,.32,.37],[-.34,.40,.04,.42,.34,.39],[.23,.47,-.23,.40,.35,.40],[-.13,-.37,.37,.43,.28,.37],[.11,-.23,-.48,.43,.31,.37],[-.65,.19,.30,.36,.31,.35],[.62,.23,-.27,.36,.32,.35]];
  clusters.forEach(([cx,cy,cz,rx,ry,rz],cluster)=>{
    const phase=seed*.11,turn=new T.Vector3(cx,cy,cz).applyAxisAngle(up,phase),x=turn.x,y=turn.y,z=turn.z;
    branch([.025,-.38+cluster*.045,-.025],[x*.88,y,z*.88],.022+random(seed+cluster)*.014);
    for(let i=0;i<60;i++){
      const n=seed*173+cluster*97+i,a=i*2.399963+cluster*1.1,yy=1-2*(i+.5)/60,r=Math.sqrt(1-yy*yy),depth=.50+.50*Math.cbrt(random(n+40));
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
    const angle=i*2.399963,c=Math.cos(angle),s=Math.sin(angle),h=.22+random(i+70)*.16,w=.015+random(i+93)*.008,bend=.065+random(i+31)*.07,spread=.018+random(i+11)*.022,base=points.length/3;
    for(let row=0;row<3;row++){
      const v=row/2,width=w*(row===0?1:row===1?.65:.04),z=spread+bend*v*v;
      for(const side of [-1,1]){const x=side*width;points.push(x*c+z*s,v*h,z*c-x*s);uv.push((side+1)/2,v)}
    }
    indices.push(base,base+2,base+1,base+1,base+2,base+3,base+2,base+4,base+3,base+3,base+4,base+5);
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(points,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
