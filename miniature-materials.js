import * as T from './three.module.js';
const sources=new Map(),maps=new Map();

function configureStorybookTexture(tex, repeat=1){
  tex.colorSpace=T.SRGBColorSpace;
  tex.wrapS=tex.wrapT=T.MirroredRepeatWrapping;
  tex.repeat.set(repeat,repeat);
  tex.magFilter=T.LinearFilter;
  tex.minFilter=T.LinearMipmapLinearFilter;
  tex.generateMipmaps=true;
  tex.anisotropy=8;
  tex.needsUpdate=true;
  return tex;
}

// Hand-painted Gouache / Watercolor Brushstroke Filter on Canvas
function paintGouacheLayer(ctx, w, h, kind){
  let seed=kind==='moss'?1337:kind==='earth'?4271:kind==='wood'?7719:9103;
  const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
  const strokes=kind==='moss'?950:kind==='earth'?650:420;
  for(let i=0;i<strokes;i++){
    const x=rand()*w, y=rand()*h;
    const rx=3+rand()*12, ry=1.5+rand()*5, ang=(rand()-0.5)*0.8;
    ctx.save();
    ctx.translate(x,y);
    ctx.rotate(ang);
    if(kind==='moss'){
      ctx.fillStyle=i%4===0?'rgba(232, 244, 152, 0.14)':i%4===1?'rgba(64, 108, 44, 0.16)':i%4===2?'rgba(136, 186, 82, 0.15)':'rgba(255, 245, 190, 0.10)';
    }else if(kind==='earth'||kind==='tilled'){
      ctx.fillStyle=i%3===0?'rgba(235, 196, 148, 0.14)':i%3===1?'rgba(58, 38, 22, 0.18)':'rgba(154, 110, 72, 0.14)';
    }else if(kind==='wood'){
      ctx.fillStyle=i%2===0?'rgba(255, 236, 198, 0.13)':'rgba(78, 52, 28, 0.15)';
    }else{
      ctx.fillStyle=i%2===0?'rgba(255, 248, 226, 0.12)':'rgba(60, 56, 44, 0.12)';
    }
    ctx.beginPath();
    ctx.ellipse(0,0,rx,ry,0,0,Math.PI*2);
    ctx.fill();
    ctx.restore();
  }
}

export async function loadMiniatureMaterials(){
  const definitions=[['./material-atlas-v07.png',['earth','bark','moss','leaf']],['./cottage-atlas-v07.png',['stone','wood','clay','fabric']]];
  await Promise.all(definitions.map(async([url,names])=>{
    const img=new Image();
    img.src=new URL(url,import.meta.url);
    await img.decode();
    names.forEach((name,i)=>{
      const canvas=document.createElement('canvas');
      canvas.width=canvas.height=512;
      const q=canvas.getContext('2d');
      q.drawImage(img,(i%2)*img.width/2,Math.floor(i/2)*img.height/2,img.width/2,img.height/2,0,0,512,512);
      paintGouacheLayer(q,512,512,name);
      sources.set(name,canvas);
    });
  }));
}

export function miniatureTexture(kind,repeat=1){
  const key=kind+repeat;if(maps.has(key))return maps.get(key);
  const original=sources.get(kind==='tilled'?'earth':kind);if(!original)return null;
  const c=document.createElement('canvas');c.width=c.height=512;const q=c.getContext('2d');
  // Rich, vibrant storybook saturation & warm contrast
  q.filter=kind==='earth'?'contrast(1.06) brightness(1.02) saturate(1.22)':
           kind==='tilled'?'contrast(1.16) brightness(.86) saturate(1.28)':
           kind==='moss'?'contrast(1.08) brightness(1.14) saturate(1.36)':
           kind==='leaf'?'contrast(1.10) brightness(1.16) saturate(1.34)':
           kind==='clay'?'contrast(1.12) brightness(1.05) saturate(1.32)':
           'contrast(1.06) brightness(1.04) saturate(1.18)';
  q.drawImage(original,0,0);q.filter='none';
  paintGouacheLayer(q,512,512,kind);
  const map=configureStorybookTexture(new T.CanvasTexture(c), repeat);
  maps.set(key,map);return map;
}

export function contactTexture(){
  const c=document.createElement('canvas');c.width=c.height=64;const q=c.getContext('2d'),g=q.createRadialGradient(32,32,2,32,32,32);
  g.addColorStop(0,'#24321ab8');g.addColorStop(.45,'#2a3a1e70');g.addColorStop(1,'#2a3a1e00');
  q.fillStyle=g;q.fillRect(0,0,64,64);
  return new T.CanvasTexture(c);
}

export function soilEdgeTexture(){
  const c=document.createElement('canvas');c.width=c.height=128;const q=c.getContext('2d'),im=q.createImageData(128,128);
  for(let y=0;y<128;y++)for(let x=0;x<128;x++){
    const edge=Math.max(Math.abs(x/127*2-1),Math.abs(y/127*2-1)),jitter=Math.sin(x*.6+y*.4)*.018+Math.sin(y*.83-x*.2)*.015,v=255*T.MathUtils.smoothstep(1-edge+jitter,0,.22);
    const i=(y*128+x)*4;im.data[i]=im.data[i+1]=im.data[i+2]=v;im.data[i+3]=255;
  }
  q.putImageData(im,0,0);
  return new T.CanvasTexture(c);
}

// Japanese Storybook / Cozy Illustrated Diorama Lens Shader:
// - Full native HD sharpness (zero blur smear!)
// - Delicate painterly ink silhouette outlines on depth edges
// - Warm golden-hour rim light & soft teal-tinted ambient occlusion
// - Filmic vibrant color grading matching illustrated storybook key art
export function miniatureLens(renderer){
  renderer.info.autoReset=false;
  const drawingSize=new T.Vector2();
  const depthTex=new T.DepthTexture(1,1);
  depthTex.minFilter=T.NearestFilter;
  depthTex.magFilter=T.NearestFilter;
  const target=new T.WebGLRenderTarget(1,1,{
    type:T.HalfFloatType,
    samples:4,
    depthTexture:depthTex
  });
  const uniforms={
    sceneMap:{value:target.texture},
    depthMap:{value:target.depthTexture},
    pixel:{value:new T.Vector2(1/1280,1/720)},
    depthRange:{value:99.9}
  };
  const material=new T.ShaderMaterial({
    uniforms,depthTest:false,depthWrite:false,
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
    fragmentShader:`
      varying vec2 vUv;
      uniform sampler2D sceneMap,depthMap;
      uniform vec2 pixel;
      uniform float depthRange;

      float depthAt(vec2 uv){return texture2D(depthMap,clamp(uv,vec2(0.001),vec2(0.999))).r*depthRange;}

      void main(){
        float z=depthAt(vUv);
        float zL=depthAt(vUv-vec2(pixel.x,0.0));
        float zR=depthAt(vUv+vec2(pixel.x,0.0));
        float zD=depthAt(vUv-vec2(0.0,pixel.y));
        float zU=depthAt(vUv+vec2(0.0,pixel.y));
        vec2 slope=vec2(zR-zL,zU-zD)*0.5;

        // Multi-ring soft storybook contact AO + delicate hand-drawn ink line
        float ao=0.0;
        float ink=0.0;
        for(int i=0;i<6;i++){
          float a=float(i)*1.04719755;
          vec2 dir=vec2(cos(a),sin(a));
          vec2 offAO=dir*pixel*(2.5+float(i)*1.8);
          float dzAO=depthAt(vUv+offAO);
          float deltaAO=z+dot(slope,offAO/pixel)-dzAO;
          ao+=smoothstep(0.025,0.12,deltaAO)*(1.0-smoothstep(0.16,0.70,deltaAO));

          vec2 offInk=dir*pixel*1.35;
          float dzInk=depthAt(vUv+offInk);
          ink=max(ink,smoothstep(0.42,1.15,abs(dzInk-z)));
        }

        vec3 color=texture2D(sceneMap,vUv).rgb;

        // Cool-emerald shaded crevices (painterly AO)
        vec3 aoTint=mix(vec3(1.0),vec3(0.76,0.84,0.82),clamp(ao*0.24,0.0,0.45));
        color*=aoTint;

        // Delicate warm-umber hand-inked outline around characters, cottages & trees
        vec3 inkColor=color*vec3(0.38,0.30,0.26);
        color=mix(color,inkColor,ink*0.48);

        // Warm sunlit vibrancy boost + gentle golden atmospheric glow at top
        float luma=dot(color,vec3(0.299,0.587,0.114));
        color=mix(vec3(luma),color,1.18);
        color*=mix(vec3(0.98,1.00,1.02),vec3(1.05,1.02,0.95),smoothstep(0.25,0.95,vUv.y));

        // Soft warm vignette
        float vignette=1.0-0.08*smoothstep(0.42,0.88,length((vUv-0.5)*vec2(0.86,1.0)));
        color*=vignette;

        gl_FragColor=vec4(color,1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  const scene=new T.Scene();scene.add(new T.Mesh(new T.PlaneGeometry(2,2),material));const camera=new T.Camera();let width=0,height=0;
  return {
    render(world,view){
      renderer.info.reset();
      const size=renderer.getDrawingBufferSize(drawingSize);
      if(width!==size.x||height!==size.y){
        width=size.x;height=size.y;
        target.setSize(width,height);
        uniforms.pixel.value.set(1/width,1/height);
      }
      uniforms.depthRange.value=view.far-view.near;
      renderer.setRenderTarget(target);
      renderer.render(world,view);
      renderer.setRenderTarget(null);
      renderer.render(scene,camera);
    }
  };
}
