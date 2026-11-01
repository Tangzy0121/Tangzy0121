// THROWAWAY: three different screen deformations, no external art or shaders.
import * as THREE from '../vendor/three.module.min.js';

export function createSignalField(mount) {
  const renderer = new THREE.WebGLRenderer({ alpha: false, antialias: false, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  renderer.domElement.dataset.renderer = 'signal-webgl';
  mount.append(renderer.domElement);
  const empty = document.createElement('canvas'); empty.width = empty.height = 2;
  const texture = new THREE.CanvasTexture(empty); texture.colorSpace = THREE.SRGBColorSpace;
  const uniforms = {
    tSource: { value: texture }, uSize: { value: new THREE.Vector2(1, 1) },
    uTime: { value: 0 }, uCharge: { value: 0 }, uBurst: { value: 0 },
    uVariant: { value: 0 }, uCenter: { value: new THREE.Vector2(.51, .52) },
  };
  const material = new THREE.ShaderMaterial({
    uniforms, toneMapped: false,
    vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,
    fragmentShader: `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D tSource;
      uniform vec2 uSize,uCenter;
      uniform float uTime,uCharge,uBurst,uVariant;
      float hash(float x){return fract(sin(x*127.1+17.7)*43758.5453);}
      mat2 rotate(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
      vec3 sampleSafe(vec2 uv){
        float mask=step(0.,uv.x)*step(uv.x,1.)*step(0.,uv.y)*step(uv.y,1.);
        return mix(vec3(.008,.006,.017),texture2D(tSource,clamp(uv,.001,.999)).rgb,mask);
      }
      void main(){
        vec2 uv=vUv;
        vec2 aspect=vec2(uSize.x/uSize.y,1.);
        vec2 delta=(uv-uCenter)*aspect;
        float r=length(delta), p=clamp(uCharge,0.,1.);
        float radius=.11+.65*p;
        float lens=1.-smoothstep(radius*.72,radius,r);
        float rim=exp(-pow((r-radius)/max(.007,.013*p),2.));
        vec2 warped=uv;
        float split=0.;
        if(uVariant<.5){
          // A: a continuous liquid lens; the original content remains visible.
          float power=p*lens;
          vec2 q=rotate(power*(.38+.08*sin(uTime*2.)))*delta;
          q*=1.-power*.52;
          q+=normalize(delta+vec2(.0001))*sin(r*19.-uTime*2.6)*.013*power;
          warped=uCenter+q/aspect;
          split=.003*p+.017*p*pow(lens,.7)+rim*.007*p;
        }else if(uVariant<1.5){
          // B: gather first, then release seven large, directed tears in one snap.
          float band=floor(uv.y*7.);
          float direction=mod(band,2.)<1.?-1.:1.;
          float tension=pow(p,3.4);
          float weight=.55+.45*hash(band+2.);
          warped.x=.5+(uv.x-.5)*(1.+p*.075);
          warped.x+=direction*weight*(.009*p+.18*tension);
          warped.x+=(fract(uv.y*7.)-.5)*tension*.035;
          warped.y+=direction*tension*.004;
          split=.001*p+.015*tension;
          rim=exp(-pow(fract(uv.y*7.)/.022,2.))*tension*.35;
        }else{
          // C: an iris that gathers the picture into a twisting center.
          float influence=exp(-r*r/(.10+.18*p));
          vec2 q=rotate(p*influence*1.7)*delta;
          q*=1.+p*influence*1.6;
          warped=uCenter+q/aspect;
          split=p*(.004+.018*influence);
          radius=.5-.31*p;
          rim=exp(-pow((r-radius)/.009,2.));
        }
        // A single fast squeeze and release, rather than a repeating flash.
        float burst=uBurst;
        float squeeze=1.-smoothstep(.08,.48,burst);
        if(burst>0.){
          if(uVariant>.5 && uVariant<1.5){
            float band=floor(uv.y*7.);
            float direction=mod(band,2.)<1.?-1.:1.;
            warped.x+=direction*(.75+.4*hash(band+2.))*smoothstep(0.,.65,burst);
            split+=sin(burst*3.14159)*.025;
          }else{
            warped.y=(warped.y-.5)/max(.015,squeeze)+.5;
            warped.x+=sin(uv.y*22.+burst*15.)*.07*burst;
            split+=sin(burst*3.14159)*.035;
          }
        }
        vec2 direction=normalize(delta+vec2(.0001))/aspect;
        vec3 c;
        c.r=sampleSafe(warped+direction*split).r;
        c.g=sampleSafe(warped).g;
        c.b=sampleSafe(warped-direction*split).b;
        vec3 rose=vec3(.64,.22,.43);
        c+=rose*rim*p*.26;
        c+=vec3(.1,.05,.14)*lens*p*.12;
        float edge=pow(max(0.,1.-abs(uv.y-.5)/.03),8.);
        if(uVariant<.5 || uVariant>1.5)c+=rose*edge*smoothstep(.25,.4,burst)*(1.-smoothstep(.45,.58,burst))*.75;
        float fade=smoothstep(.45,.75,burst);
        c=mix(c,vec3(.008,.006,.017),fade);
        c*=1.-.07*p*(1.-lens);
        gl_FragColor=vec4(max(c,0.),1.);
        #include <colorspace_fragment>
      }
    `,
  });
  const geometry = new THREE.PlaneGeometry(2, 2);
  const scene = new THREE.Scene(); scene.add(new THREE.Mesh(geometry, material));
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  return {
    source(canvas, width, height) {
      texture.image = canvas; texture.needsUpdate = true;
      renderer.setSize(width, height, false); uniforms.uSize.value.set(width, height);
    },
    draw({ charge = 0, burst = 0, time = 0, variant = 0 }) {
      uniforms.uCharge.value = charge; uniforms.uBurst.value = burst;
      uniforms.uTime.value = time; uniforms.uVariant.value = variant;
      renderer.render(scene, camera);
    },
    dispose(){geometry.dispose();material.dispose();texture.dispose();renderer.dispose();renderer.domElement.remove();},
  };
}
