/* Selected 2026-10-26: B pixel sky, V3 brighter stars, 85% brightness.
   Code-drawn stars only. Comparison experiments remain in the background prototype. */
(() => {
  'use strict';
  const TAU=Math.PI*2,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  function rng(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return(seed>>>0)/4294967296;};}
  function makeGlow(){
    const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d'),g=ctx.createRadialGradient(64,64,0,64,64,64);
    g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.035,'rgba(255,248,226,.96)');g.addColorStop(.09,'rgba(149,192,255,.72)');g.addColorStop(.23,'rgba(149,192,255,.25)');g.addColorStop(.52,'rgba(149,192,255,.065)');g.addColorStop(1,'rgba(149,192,255,0)');
    ctx.fillStyle=g;ctx.fillRect(0,0,128,128);return canvas;
  }
  const glow=makeGlow();
  function create(w,h){
    const rand=rng(1231+66*87),scale=clamp(Math.min(w,h)/800,.65,1.2),particles=[];
    const beacons=[[.16,.27],[.85,.23],[.075,.57],[.92,.66],[.30,.115],[.72,.84],[.25,.79],[.84,.43]]
      .slice(0,w<h?6:8).map(([x,y],i)=>({x,y,size:(i%3===0?18:11)*scale,phase:rand()*TAU,depth:.5+rand()*.5}));
    const count=Math.round(clamp(w*h/4000,90,400));
    for(let i=0;i<count;i++)particles.push({x:rand(),y:rand(),size:rand()>.94?4:rand()>.5?3:2,phase:rand()*TAU,depth:rand(),color:rand()>.87?'#fff2c8':'#d6e7ff'});
    return{
      state:{variant:'B',stars:count,brightStars:beacons.length,brightness:85,nebula:false,wordmark:true,renderer:'pixel-canvas',rasterAssets:0},
      draw(ctx,{mx=0,my=0,time=0,reduced=false,reveal=1}){
        const t=reduced?0:time,px=reduced?0:mx,py=reduced?0:my;
        ctx.save();ctx.globalAlpha=1;ctx.fillStyle='#141126';ctx.fillRect(0,0,w,h);
        for(const p of particles){
          const twinkle=.80+.20*Math.sin(t*.7+p.phase),x=p.x*w+px*p.depth*9,y=p.y*h+py*p.depth*6;
          ctx.globalAlpha=(.62+p.depth*.38)*twinkle;
          if(p.depth>.8){ctx.globalAlpha=.25*twinkle;ctx.fillStyle='#91baff';ctx.fillRect(Math.round(x)-3,Math.round(y)-3,p.size+6,p.size+6);ctx.globalAlpha=twinkle;}
          ctx.fillStyle=p.color;ctx.fillRect(Math.round(x),Math.round(y),p.size,p.size);
        }
        ctx.globalCompositeOperation='screen';
        for(const p of beacons){
          const x=p.x*w+px*p.depth*12,y=p.y*h+py*p.depth*8,light=.84+.16*Math.sin(t*.52+p.phase),r=p.size*(.94+light*.06);
          ctx.globalAlpha=light;ctx.drawImage(glow,x-r*3.2,y-r*3.2,r*6.4,r*6.4);
          const u=Math.max(2,Math.round(scale*3)),ix=Math.round(x),iy=Math.round(y),arm=Math.round(r/u)*u;
          ctx.fillStyle='#87b8ff';ctx.globalAlpha=light*.38;ctx.fillRect(ix-arm,iy-u,arm*2+u,u*3);ctx.fillRect(ix-u,iy-arm,u*3,arm*2+u);
          ctx.fillStyle='#d9edff';ctx.globalAlpha=light;ctx.fillRect(ix-arm,iy,arm*2+u,u);ctx.fillRect(ix,iy-arm,u,arm*2+u);ctx.fillStyle='#ffffff';ctx.fillRect(ix-u,iy-u,u*3,u*3);
        }
        ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;ctx.fillStyle='rgba(0,0,0,.15)';ctx.fillRect(0,0,w,h);
        if(reveal<1){ctx.fillStyle=`rgba(8,6,14,${(1-reveal)*.88})`;ctx.fillRect(0,0,w,h);}
        ctx.restore();
      }
    };
  }
  window.TangzyPixelSky={create};
})();
