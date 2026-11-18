import * as T from './three.module.js';
const sources=new Map(),maps=new Map();

export async function loadMiniatureMaterials(){
  const definitions=[['./material-atlas-v07.png',['earth','bark','moss','leaf']],['./cottage-atlas-v07.png',['stone','wood','clay','fabric']]];
  await Promise.all(definitions.map(async([url,names])=>{
    const img=new Image();
    img.src=new URL(url,import.meta.url);
    await img.decode();
    names.forEach((name,i)=>{
      const canvas=document.createElement('canvas');
      canvas.width=canvas.height=768;
      const q=canvas.getContext('2d');
      q.drawImage(img,(i%2)*img.width/2,Math.floor(i/2)*img.height/2,img.width/2,img.height/2,0,0,768,768);
      sources.set(name,canvas);
    });
  }));
}

export function miniatureTexture(kind,repeat=1){
  const key=kind+repeat;if(maps.has(key))return maps.get(key);
  const original=sources.get(kind==='tilled'?'earth':kind);if(!original)return null;
  const c=document.createElement('canvas');c.width=c.height=768;const q=c.getContext('2d');
  // Rich natural diorama tones: warm timber, lush moss grass, tactile stone & soil
  q.filter=kind==='earth'?'contrast(1.06) brightness(.96) saturate(.95)':
           kind==='tilled'?'contrast(1.15) brightness(.84) saturate(.92)':
           kind==='moss'?'contrast(1.08) brightness(1.06) saturate(1.18)':
           kind==='leaf'?'contrast(1.06) brightness(1.08) saturate(1.12)':
           kind==='wood'?'contrast(1.10) brightness(.98) saturate(1.08)':
           kind==='stone'?'contrast(1.12) brightness(1.04) saturate(.88)':
           'contrast(1.05) brightness(1.02)';
  q.drawImage(original,0,0);q.filter='none';
  if(kind==='moss'){
    // Tiny wildflowers (white & yellow) scattered in the miniature grass like Reference 1
    let seed=1999;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
    for(let i=0;i<160;i++){
      const x=rnd()*768,y=rnd()*768,r=1.8+rnd()*2.2;
      q.fillStyle=i%3===0?'#fff7d6':'#f5d256';
      q.beginPath();q.arc(x,y,r,0,Math.PI*2);q.fill();
    }
  }
  const map=new T.CanvasTexture(c);
  map.colorSpace=T.SRGBColorSpace;
  map.wrapS=map.wrapT=T.MirroredRepeatWrapping;
  map.repeat.set(repeat,repeat);
  map.anisotropy=8;
  maps.set(key,map);return map;
}

export function contactTexture(){
  const c=document.createElement('canvas');c.width=c.height=64;const q=c.getContext('2d'),g=q.createRadialGradient(32,32,2,32,32,32);
  g.addColorStop(0,'#1e1912c8');g.addColorStop(.42,'#221c1478');g.addColorStop(1,'#221c1400');
  q.fillStyle=g;q.fillRect(0,0,64,64);
  return new T.CanvasTexture(c);
}

export function soilEdgeTexture(){
  const c=document.createElement('canvas');c.width=c.height=128;const q=c.getContext('2d'),im=q.createImageData(128,128);
  for(let y=0;y<128;y++)for(let x=0;x<128;x++){
    const edge=Math.max(Math.abs(x/127*2-1),Math.abs(y/127*2-1)),jitter=Math.sin(x*.6+y*.4)*.017+Math.sin(y*.83-x*.2)*.015,v=255*T.MathUtils.smoothstep(1-edge+jitter,0,.22);
    const i=(y*128+x)*4;im.data[i]=im.data[i+1]=im.data[i+2]=v;im.data[i+3]=255;
  }
  q.putImageData(im,0,0);
  return new T.CanvasTexture(c);
}

// Photographic Tilt-Shift Miniature Diorama Lens (Reference 1 & 2)
export function miniatureLens(renderer){
  renderer.info.autoReset=false;
  const drawingSize=new T.Vector2();
  const depthTex=new T.DepthTexture(1,1);
  depthTex.minFilter=T.NearestFilter;depthTex.magFilter=T.NearestFilter;
  const target=new T.WebGLRenderTarget(1,1,{type:T.HalfFloatType,samples:4,depthTexture:depthTex});
  const uniforms={
    sceneMap:{value:target.texture},
    depthMap:{value:target.depthTexture},
    pixel:{value:new T.Vector2(1/1280,1/720)},
    depthRange:{value:99.9},
    blurScale:{value:1}
  };
  const material=new T.ShaderMaterial({
    uniforms,depthTest:false,depthWrite:false,
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
    fragmentShader:`
      varying vec2 vUv;
      uniform sampler2D sceneMap,depthMap;
      uniform vec2 pixel;
      uniform float depthRange,blurScale;

      float depthAt(vec2 uv){return texture2D(depthMap,clamp(uv,vec2(0.001),vec2(0.999))).r*depthRange;}

      void main(){
        float z=depthAt(vUv);
        float zL=depthAt(vUv-vec2(pixel.x,0.0));
        float zR=depthAt(vUv+vec2(pixel.x,0.0));
        float zD=depthAt(vUv-vec2(0.0,pixel.y));
        float zU=depthAt(vUv+vec2(0.0,pixel.y));
        vec2 slope=vec2(zR-zL,zU-zD)*0.5;

        // Warm miniature crevice Ambient Occlusion
        float ao=0.0;
        for(int i=0;i<6;i++){
          float a=float(i)*1.04719755;
          vec2 dir=vec2(cos(a),sin(a));
          vec2 offset=dir*(2.5+float(i)*2.2);
          float delta=z+dot(slope,offset)-depthAt(vUv+offset*pixel);
          ao+=smoothstep(0.02,0.11,delta)*(1.0-smoothstep(0.16,0.70,delta));
        }

        // Subtle photographic tilt-shift bokeh only at top & bottom edges
        float coc=smoothstep(0.28,0.52,abs(vUv.y-0.50))*2.4*blurScale;
        vec3 color=texture2D(sceneMap,vUv).rgb*2.0;
        float total=2.0;
        if(coc>0.02){
          for(int i=0;i<6;i++){
            float a=float(i)*1.04719755;
            vec2 off=vec2(cos(a),sin(a))*sqrt((float(i)+0.5)/6.0)*coc;
            float other=depthAt(vUv+off*pixel);
            float w=1.0-smoothstep(1.2,3.5,abs(other-z));
            color+=texture2D(sceneMap,vUv+off*pixel).rgb*w;
            total+=w;
          }
        }
        color/=total;

        // Rich warm contact shadow + natural filmic warmth
        color*=1.0-clamp(ao*0.095,0.0,0.32);
        color*=vec3(1.03,1.01,0.96);
        float vignette=1.0-0.14*smoothstep(0.36,0.84,length((vUv-0.5)*vec2(0.86,1.0)));
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
        uniforms.blurScale.value=height/900;
      }
      uniforms.depthRange.value=view.far-view.near;
      renderer.setRenderTarget(target);
      renderer.render(world,view);
      renderer.setRenderTarget(null);
      renderer.render(scene,camera);
    }
  };
}
