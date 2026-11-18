import * as T from './three.module.js';
const sources=new Map(),maps=new Map();

// PS1/Indie Retro Palette & Nearest-Neighbor Crisp Filtering
function configurePS1Texture(tex, repeat=1){
  tex.colorSpace=T.SRGBColorSpace;
  tex.wrapS=tex.wrapT=T.RepeatWrapping;
  tex.repeat.set(repeat,repeat);
  tex.magFilter=T.NearestFilter;
  tex.minFilter=T.NearestMipmapLinearFilter;
  tex.generateMipmaps=true;
  tex.anisotropy=1;
  tex.needsUpdate=true;
  return tex;
}

// Ordered Bayer 4x4 Dithering + Color Quantization on Canvas
function ditherCanvas(ctx, w, h, levels=14){
  const bayer=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
  const img=ctx.getImageData(0,0,w,h), d=img.data;
  for(let y=0;y<h;y++){
    for(let x=0;x<w;x++){
      const i=(y*w+x)*4;
      const threshold=(bayer[y&3][x&3]/16 - 0.5) * (255/levels);
      for(let c=0;c<3;c++){
        const v=Math.max(0,Math.min(255,d[i+c]+threshold));
        d[i+c]=Math.round((v/255)*levels)*(255/levels);
      }
    }
  }
  ctx.putImageData(img,0,0);
}

export async function loadMiniatureMaterials(){
  const definitions=[['./material-atlas-v07.png',['earth','bark','moss','leaf']],['./cottage-atlas-v07.png',['stone','wood','clay','fabric']]];
  await Promise.all(definitions.map(async([url,names])=>{
    const img=new Image();
    img.src=new URL(url,import.meta.url);
    await img.decode();
    names.forEach((name,i)=>{
      // Low-res crisp 128x128 texels per quadrant for authentic PS1/indie hand-painted texel density
      const canvas=document.createElement('canvas');
      canvas.width=canvas.height=128;
      const q=canvas.getContext('2d');
      q.imageSmoothingEnabled=true;
      q.drawImage(img,(i%2)*img.width/2,Math.floor(i/2)*img.height/2,img.width/2,img.height/2,0,0,128,128);
      ditherCanvas(q,128,128,16);
      sources.set(name,canvas);
    });
  }));
}

export function miniatureTexture(kind,repeat=1){
  const key=kind+repeat;if(maps.has(key))return maps.get(key);
  const original=sources.get(kind==='tilled'?'earth':kind);if(!original)return null;
  const c=document.createElement('canvas');c.width=c.height=128;const q=c.getContext('2d');
  q.imageSmoothingEnabled=false;
  q.filter=kind==='earth'?'contrast(1.12) brightness(.96) saturate(1.15)':kind==='tilled'?'contrast(1.22) brightness(.84) saturate(1.18)':kind==='moss'?'contrast(1.12) brightness(1.06) saturate(1.22)':kind==='leaf'?'contrast(1.1) brightness(1.08) saturate(1.18)':'contrast(1.08) saturate(1.12)';
  q.drawImage(original,0,0);q.filter='none';
  if(kind==='earth'){
    let seed=4271;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
    for(let i=0;i<600;i++){
      const x=Math.floor(random()*128),y=Math.floor(random()*128);
      q.fillStyle=i%3?'#2e211638':'#e8cfa230';
      q.fillRect(x,y,i%2?2:1,1);
    }
  }
  ditherCanvas(q,128,128,15);
  const map=configurePS1Texture(new T.CanvasTexture(c), repeat);
  maps.set(key,map);return map;
}

export function contactTexture(){
  const c=document.createElement('canvas');c.width=c.height=32;const q=c.getContext('2d'),g=q.createRadialGradient(16,16,1,16,16,16);
  g.addColorStop(0,'#1a1e12d0');g.addColorStop(.5,'#1a1e1288');g.addColorStop(1,'#1a1e1200');
  q.fillStyle=g;q.fillRect(0,0,32,32);
  ditherCanvas(q,32,32,8);
  const tex=new T.CanvasTexture(c);
  tex.magFilter=T.NearestFilter;tex.minFilter=T.NearestFilter;
  return tex;
}

export function soilEdgeTexture(){
  const c=document.createElement('canvas');c.width=c.height=64;const q=c.getContext('2d'),im=q.createImageData(64,64);
  for(let y=0;y<64;y++)for(let x=0;x<64;x++){
    const edge=Math.max(Math.abs(x/63*2-1),Math.abs(y/63*2-1)),jitter=Math.sin(x*.9+y*.6)*.03+Math.sin(y*1.2-x*.4)*.025,v=255*T.MathUtils.smoothstep(1-edge+jitter,0,.18);
    const i=(y*64+x)*4;im.data[i]=im.data[i+1]=im.data[i+2]=v;im.data[i+3]=255;
  }
  q.putImageData(im,0,0);
  const tex=new T.CanvasTexture(c);
  tex.magFilter=T.NearestFilter;tex.minFilter=T.NearestFilter;
  return tex;
}

// PS1 / Indie Retro Post-Processing Lens:
// - Crisp PS1 internal resolution scaling (gentle pixelation with crisp edges)
// - Ordered 4x4 Bayer dithering + 15-bit RGB555 color depth simulation
// - Stylized Warm Rim & Contact AO without blurry tilt-shift smear
export function miniatureLens(renderer){
  renderer.info.autoReset=false;
  const drawingSize=new T.Vector2();
  const target=new T.WebGLRenderTarget(1,1,{
    type:T.HalfFloatType,
    samples:0,
    minFilter:T.NearestFilter,
    magFilter:T.NearestFilter,
    depthTexture:new T.DepthTexture(1,1)
  });
  const uniforms={
    sceneMap:{value:target.texture},
    depthMap:{value:target.depthTexture},
    pixel:{value:new T.Vector2(1,1)},
    texelSize:{value:new T.Vector2(1,1)},
    depthRange:{value:99.9},
    time:{value:0}
  };
  const material=new T.ShaderMaterial({
    uniforms,depthTest:false,depthWrite:false,
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
    fragmentShader:`
      varying vec2 vUv;
      uniform sampler2D sceneMap,depthMap;
      uniform vec2 pixel,texelSize;
      uniform float depthRange;

      float depthAt(vec2 uv){return texture2D(depthMap,uv).r*depthRange;}

      float bayer4x4(vec2 pos){
        int x=int(mod(pos.x,4.0));
        int y=int(mod(pos.y,4.0));
        int idx=y*4+x;
        if(idx==0)return 0.0/16.0;if(idx==1)return 8.0/16.0;if(idx==2)return 2.0/16.0;if(idx==3)return 10.0/16.0;
        if(idx==4)return 12.0/16.0;if(idx==5)return 4.0/16.0;if(idx==6)return 14.0/16.0;if(idx==7)return 6.0/16.0;
        if(idx==8)return 3.0/16.0;if(idx==9)return 11.0/16.0;if(idx==10)return 1.0/16.0;if(idx==11)return 9.0/16.0;
        if(idx==12)return 15.0/16.0;if(idx==13)return 7.0/16.0;if(idx==14)return 13.0/16.0;
        return 5.0/16.0;
      }

      void main(){
        // Subtle PS1 pixel-grid snap (2.2x retro texel scale, keeps UI & text 100% sharp)
        vec2 grid=floor(vUv/texelSize)*texelSize+texelSize*0.5;
        float z=depthAt(grid);
        vec2 slope=vec2(dFdx(z),dFdy(z));

        // Crisp stylized contact AO + dark silhouette edge ink
        float ao=0.0;
        float edge=0.0;
        for(int i=0;i<4;i++){
          float a=float(i)*1.5707963;
          vec2 offset=vec2(cos(a),sin(a))*texelSize*1.5;
          float dz=depthAt(grid+offset);
          float delta=z+dot(slope,offset)-dz;
          ao+=smoothstep(0.03,0.14,delta)*(1.0-smoothstep(0.18,0.75,delta));
          edge=max(edge,smoothstep(0.45,1.25,abs(dz-z)));
        }

        vec3 color=texture2D(sceneMap,grid).rgb;
        // Warm indie color grading + crisp silhouette outline
        color*=1.0-ao*0.14;
        color=mix(color,color*vec3(0.42,0.36,0.34),edge*0.42);

        // Soft warm vignette
        float vignette=1.0-0.12*smoothstep(0.38,0.82,length((vUv-0.5)*vec2(0.88,1.0)));
        color*=vignette;

        // PS1 15-bit RGB555 (32 levels per channel) + Ordered Bayer Dithering
        vec2 screenPos=floor(vUv/texelSize);
        float dither=(bayer4x4(screenPos)-0.5)*(1.0/30.0);
        color=clamp(color+dither,0.0,1.0);
        color=floor(color*31.0+0.5)/31.0;

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
      // Render at retro PS1-inspired internal resolution (height ~360p-420p) for authentic crunchy pixels & high FPS
      const scale=Math.max(1,Math.round(size.y/380));
      const rw=Math.max(320,Math.floor(size.x/scale));
      const rh=Math.max(200,Math.floor(size.y/scale));
      if(width!==rw||height!==rh){
        width=rw;height=rh;
        target.setSize(width,height);
        uniforms.pixel.value.set(1/width,1/height);
        uniforms.texelSize.value.set(1/width,1/height);
      }
      uniforms.depthRange.value=view.far-view.near;
      renderer.setRenderTarget(target);
      renderer.render(world,view);
      renderer.setRenderTarget(null);
      renderer.render(scene,camera);
    }
  };
}
