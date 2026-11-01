/* Minimal geometric poster; retains the selected 1.2 second perspective motion. */
(() => {
 'use strict';
 const layer=document.getElementById('page-transition'),stage=document.getElementById('page-stage'),body=document.body,reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const clamp=v=>Math.max(0,Math.min(1,v)),range=(t,a,b)=>clamp((t-a)/(b-a)),ease=v=>1-Math.pow(1-clamp(v),3),smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
 let variant='A',current=null,pending=null,raf=0,start=0,hiddenAt=0,completed=0,lastDuration=0,phase='idle',progress=0,maxFrameMs=0;
 const names={home:'HOME',work:'WORK',about:'ABOUT',contact:'CONTACT'};
 layer.innerHTML='<div class="tr-environment"></div><div class="tr-back-sheet"></div><div class="tr-sheet"><div class="tr-art"><div class="tr-pink-field"></div><div class="tr-orbit"></div><div class="tr-disc"></div><div class="tr-star"></div></div></div><div class="tr-shutter shutter-left"></div><div class="tr-shutter shutter-right"></div><div class="tr-title"><strong class="tr-word"></strong></div>';
 const el=Object.fromEntries(['environment','back-sheet','sheet','title','word'].map(n=>[n,layer.querySelector('.tr-'+n)])),left=layer.querySelector('.shutter-left'),right=layer.querySelector('.shutter-right');
 const tx=(node,value)=>node.style.transform=value,op=(node,value)=>node.style.opacity=String(clamp(value));
 function state(){window.__transitionStudy={ready:true,prototype:true,variant,busy:!!current,target:current?.key||null,phase,progress,slow:false,queued:pending?.key||null,completed,lastDuration,maxFrameMs};}
 function persist(){const url=new URL(location.href);if(url.searchParams.get('prototype')!=='signal')url.searchParams.delete('variant');url.searchParams.delete('speed');history.replaceState(null,'',url);}
 function applyVariant(){body.dataset.motionVariant=variant;document.querySelectorAll('[data-variant-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.variantChoice===variant)));persist();state();}
 function setVariant(){/* Current working copy is pinned to the selected original A motion. */}
 function animateContents(q){const content=document.querySelector(body.dataset.page==='home'?'#home-view .hero':body.dataset.page==='about'?'#about-view .experience':'#detail-view .detail-inner');if(!content)return;const items=body.dataset.page==='home'?[content]:[...content.children];items.forEach((node,i)=>{const v=ease(range(q,.03+i*.025,.72+i*.025));node.style.opacity=String(v);node.style.transform=`translate3d(${(1-v)*(variant==='A'?65:0)}px,${(1-v)*32}px,0)`;});}
 function clearContents(){document.querySelectorAll('#detail-view .detail-inner > *,#home-view .hero,#about-view .experience > *').forEach(n=>{n.style.removeProperty('opacity');n.style.removeProperty('transform');});}
 function render(t){
  const frame=performance.now(),incoming=t>=.5,q=range(t,.5,1),out=ease(range(t,0,.30)),arrive=ease(range(t,.5,1));
  if(current.variant==='A'){
   const enter=ease(range(t,.06,.43)),leave=smooth(range(t,.57,.97));
   op(el.environment,smooth(range(t,0,.18))*(1-ease(range(t,.63,1)))*.88);body.style.setProperty('--poster-cover',String(smooth(range(t,.18,.38))*(1-ease(range(t,.63,.96)))));
   tx(stage,incoming?`perspective(1400px) translate3d(${(1-arrive)*22}vw,0,${-(1-arrive)*260}px) rotateY(${(1-arrive)*23}deg) rotateZ(${(1-arrive)*3}deg)`:`perspective(1400px) translate3d(${-out*16}vw,0,${-out*340}px) rotateY(${-out*23}deg) rotateZ(${-out*4}deg)`);op(stage,incoming?.5+.5*arrive:1-out*.65);
   tx(el['back-sheet'],`perspective(1000px) translate3d(${(1-ease(range(t,.01,.33)))*-145+leave*150}vw,0,0) skewX(-12deg) rotateY(${(1-enter)*25}deg)`);
   tx(el.sheet,`perspective(1100px) translate3d(${(1-enter)*150-leave*155}vw,0,0) skewX(-12deg) rotateY(${-(1-enter)*32}deg)`);
   op(el.title,smooth(range(t,.19,.36))*(1-ease(range(t,.65,.89))));tx(el.title,`perspective(800px) translate3d(${(1-ease(range(t,.17,.45)))*65-ease(range(t,.65,.94))*65}vw,0,${ease(range(t,.65,.94))*170}px) rotateZ(-7deg)`);
  }else{
   const shut=ease(range(t,.03,.37)),open=ease(range(t,.56,.94));op(el.environment,smooth(range(t,0,.22))*(1-ease(range(t,.66,1))));
   tx(stage,incoming?`perspective(1200px) translate3d(0,${(1-arrive)*5}vh,${-(1-arrive)*420}px)`:`perspective(1200px) translate3d(0,0,${-out*570}px)`);op(stage,incoming?.35+.65*arrive:1-out*.9);
   tx(left,`translate3d(${(1-shut)*-110+open*-110}%,0,0)`);tx(right,`translate3d(${(1-shut)*110+open*110}%,0,0)`);
   op(el.title,smooth(range(t,.24,.32))*(1-ease(range(t,.68,.85))));tx(el.title,`translate3d(0,${(1-ease(range(t,.23,.40)))*8-ease(range(t,.68,.89))*12}vh,0) scale(${1+ease(range(t,.68,.89))*.08})`);
  }
  if(incoming)animateContents(q);maxFrameMs=Math.max(maxFrameMs,performance.now()-frame);
 }
 function finish(){cancelAnimationFrame(raf);clearContents();stage.style.removeProperty('transform');stage.style.removeProperty('opacity');stage.style.removeProperty('transform-origin');layer.hidden=true;body.style.removeProperty('--poster-cover');body.classList.remove('transition-busy');body.removeAttribute('aria-busy');phase='idle';progress=0;completed++;lastDuration=Math.round(performance.now()-start);current=null;const next=pending;pending=null;state();if(next)begin(next);}
 function commit(){if(current&&!current.committed){current.committed=true;current.commit();stage.style.transformOrigin=`50% ${scrollY+innerHeight/2}px`;}}
 function tick(now){if(!current)return;const t=clamp((now-start)/current.duration);if(t>=.5)commit();phase=t<.45?'cover':t<.55?'hold':'reveal';progress=phase==='cover'?range(t,0,.45):phase==='hold'?range(t,.45,.55):range(t,.55,1);render(t);state();if(t===1){finish();return;}raf=requestAnimationFrame(tick);}
 function begin(job){
  if(reduced.matches||new URLSearchParams(location.search).get('motion')==='off'){job.start?.({coverMs:0});job.commit();completed++;lastDuration=0;state();return;}
  current={...job,variant,duration:variant==='A'?1200:1100,committed:false};const title=names[job.key]||names.work;
  el.word.replaceChildren(document.createTextNode(title.slice(0,-1)),Object.assign(document.createElement('span'),{className:'tr-word-end',textContent:title.slice(-1)}));layer.dataset.page=job.key;layer.dataset.variant=variant;layer.hidden=false;phase='cover';progress=0;maxFrameMs=0;start=performance.now();body.classList.add('transition-busy');body.setAttribute('aria-busy','true');stage.style.transformOrigin=`50% ${scrollY+innerHeight/2}px`;job.start?.({coverMs:current.duration*.45});render(0);state();raf=requestAnimationFrame(tick);
 }
 function play(job){if(current){pending=job.route===current.route?null:job;state();return;}begin(job);}
 document.addEventListener('wheel',e=>{if(current)e.preventDefault();},{passive:false,capture:true});document.addEventListener('touchmove',e=>{if(current)e.preventDefault();},{passive:false,capture:true});
 addEventListener('keydown',e=>{if(current&&['PageDown','PageUp','ArrowDown','ArrowUp','Home','End',' '].includes(e.key)&&!e.target.closest('a,button,input,textarea')){e.preventDefault();e.stopImmediatePropagation();}},true);
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&current)hiddenAt=performance.now();else if(hiddenAt&&current){start+=performance.now()-hiddenAt;hiddenAt=0;}});reduced.addEventListener('change',()=>{if(reduced.matches&&current){commit();finish();}});
 window.TangzyTransitions={play,setVariant,get busy(){return!!current;}};applyVariant();state();
})();
