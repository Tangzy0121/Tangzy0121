/* About GUI shortcuts, living background, and the persistent portrait. */
(() => {
  'use strict';
  const root=document.getElementById('about-view'),experience=document.getElementById('experience'),canvas=document.getElementById('sky'),ctx=canvas.getContext('2d'),tabs=[...root.querySelectorAll('.chapter-tab')],motionButton=document.getElementById('motion-toggle'),portraitButton=document.getElementById('portrait-button'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const names={home:{name:'终端首页',en:'HOME'},study:{name:'学业背景',en:'STUDY',kicker:'LEARNING / CONNECTING',foot:'LEARNING, ONE STEP AT A TIME.'},explore:{name:'研究与能力',en:'EXPLORE',kicker:'QUESTIONS / METHODS / PRACTICE',foot:'SMALL QUESTIONS. OPEN POSSIBILITIES.'},mindset:{name:'学习与探索',en:'MINDSET',kicker:'LEARNING / ASKING / REFLECTING',foot:'SPACE FOR THOUGHTS TO GROW.'}},keys=Object.keys(names),clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t;
  let active=false,current='home',manualMotion=true,outline=false,portraitPress=null,w=0,h=0,dpr=1,raf=0,lastFrame=0,px=0,py=0,mx=0,my=0,targetPoseX=0,targetPoseY=0,poseX=0,poseY=0,pointerX=0,pointerY=0,mode=0,modeTarget=0,constellationPulse=0,burstCount=0,disposed=false;
  let portraitAnimation=null;const bursts=[],dust=[];
  const rand=i=>{const s=Math.sin(i*127.1+311.7)*43758.5453;return s-Math.floor(s);};
  const stars=Array.from({length:260},(_,i)=>({x:rand(i*5+1),y:rand(i*11+4),z:.35+rand(i*3+8)*.65,size:rand(i*7+14)>.94?2.8:rand(i+18)>.6?1.6:1,phase:rand(i*4+3)*Math.PI*2}));
  function quiet(){return reduced.matches||!manualMotion;}
  function publish(){root.dataset.chapter=current;root.dataset.bursts=String(burstCount);root.dataset.motion=quiet()?'off':'on';root.dataset.portraitView=outline?'outline':'normal';canvas.dataset.scene=current;}
  function wake(){if(active&&!raf&&!document.hidden&&!disposed)raf=requestAnimationFrame(frame);}
  function resize(){w=innerWidth;h=innerHeight;dpr=Math.min(devicePixelRatio||1,1.6);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);wake();}
  function targetPoints(index){const cx=w*(w<760?.55:.77),cy=h*(w<760?.39:.45),s=Math.min(w,h);if(index===0)return Array.from({length:7},(_,i)=>{const a=i/7*Math.PI*2-.5;return{x:cx+Math.cos(a)*s*.32,y:cy+Math.sin(a)*s*.30};});if(index===1)return[{x:.57,y:.12},{x:.78,y:.23},{x:.94,y:.40},{x:.77,y:.57},{x:.61,y:.44},{x:.71,y:.30},{x:.91,y:.72}].map(p=>({x:p.x*w,y:p.y*h}));return Array.from({length:7},(_,i)=>{const a=i*.75-1.4,r=s*(.12+i*.035);return{x:cx+Math.cos(a)*r,y:cy+Math.sin(a)*r};});}
  function drawScene(now){
    ctx.clearRect(0,0,w,h);const t=quiet()?0:now/1000,shift=quiet()?0:1;mx=lerp(mx,px,.075);my=lerp(my,py,.075);poseX=lerp(poseX,targetPoseX,.09);poseY=lerp(poseY,targetPoseY,.09);mode=lerp(mode,modeTarget,.055);root.style.setProperty('--mx',quiet()?'0':mx.toFixed(4));root.style.setProperty('--my',quiet()?'0':my.toFixed(4));root.style.setProperty('--pose-x',quiet()?'0':poseX.toFixed(4));root.style.setProperty('--pose-y',quiet()?'0':poseY.toFixed(4));
    for(let i=0;i<stars.length;i++){const s=stars[i],x=s.x*w+mx*s.z*-13,y=s.y*h+my*s.z*-9+Math.sin(t*.08+s.phase)*s.z*5*shift,a=(.36+.48*(.5+.5*Math.sin(t*.7+s.phase)))*s.z;ctx.fillStyle=i%13===0?`rgba(255,218,151,${a})`:`rgba(242,199,229,${a})`;ctx.fillRect(Math.round(x),Math.round(y),s.size,s.size);if(s.size>2){ctx.globalAlpha=.65;ctx.fillRect(Math.round(x)-4,Math.round(y)+1,11,1);ctx.fillRect(Math.round(x)+1,Math.round(y)-4,1,11);ctx.globalAlpha=1;}}
    const from=Math.floor(mode),to=Math.min(2,from+1),v=mode-from,a=targetPoints(from),b=targetPoints(to),nodes=a.map((p,i)=>({x:lerp(p.x,b[i].x,v)+mx*-8,y:lerp(p.y,b[i].y,v)+my*-6}));
    const formationGlow=quiet()?0:clamp(1-(now-constellationPulse)/1250);
    ctx.lineWidth=1;ctx.strokeStyle=`rgba(236,188,222,${.23+formationGlow*.22})`;ctx.beginPath();nodes.forEach((p,i)=>{if(i===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);});if(mode<.45)ctx.closePath();ctx.stroke();
    if(mode>.4){ctx.strokeStyle=`rgba(247,210,143,${.15+formationGlow*.16})`;ctx.beginPath();ctx.moveTo(nodes[1].x,nodes[1].y);ctx.lineTo(nodes[4].x,nodes[4].y);ctx.lineTo(nodes[6].x,nodes[6].y);ctx.stroke();}
    nodes.forEach((p,i)=>{const active=i===keys.indexOf(current)+1,twinkle=.78+.18*Math.sin(t*1.05+i*1.7),glowRadius=18+formationGlow*10,glow=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,glowRadius);glow.addColorStop(0,active?`rgba(255,217,143,${.24+formationGlow*.2})`:`rgba(241,175,218,${.15+formationGlow*.14})`);glow.addColorStop(1,'rgba(241,175,218,0)');ctx.fillStyle=glow;ctx.fillRect(p.x-glowRadius,p.y-glowRadius,glowRadius*2,glowRadius*2);ctx.fillStyle=active?`rgba(255,227,169,${twinkle})`:`rgba(251,218,241,${twinkle})`;const x=Math.round(p.x),y=Math.round(p.y);ctx.fillRect(x-2,y-2,5,5);ctx.globalAlpha=.8;ctx.fillRect(x-8,y,17,1);ctx.fillRect(x,y-8,1,17);ctx.globalAlpha=1;for(let j=0;j<2;j++){const angle=rand(i*9+j+31)*Math.PI*2,r=24+rand(i*7+j+17)*27;ctx.fillStyle=`rgba(238,184,220,${.5+formationGlow*.18})`;ctx.fillRect(Math.round(p.x+Math.cos(angle)*r),Math.round(p.y+Math.sin(angle)*r),2,2);}});
    if(!quiet()){
      ctx.strokeStyle='rgba(239,170,210,.08)';ctx.beginPath();ctx.arc(w*.78,h*.45,Math.min(w,h)*(.34+.006*Math.sin(t*.4)),t*.025,t*.025+Math.PI*1.4);ctx.stroke();
      for(let i=bursts.length-1;i>=0;i--){const p=bursts[i],age=(now-p.start)/1100;if(age>=1){bursts.splice(i,1);continue;}const r=8+Math.pow(age,.75)*180;ctx.strokeStyle=`rgba(${p.gold?'243,201,114':'236,158,204'},${(1-age)*.6})`;ctx.lineWidth=1;ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.stroke();for(let j=0;j<8;j++){const angle=j*Math.PI/4+age*.2,x=p.x+Math.cos(angle)*r,y=p.y+Math.sin(angle)*r;ctx.fillStyle=`rgba(243,201,114,${(1-age)*.65})`;ctx.fillRect(Math.round(x)-1,Math.round(y)-1,3,3);}}
      for(let i=dust.length-1;i>=0;i--){const p=dust[i],age=(now-p.start)/650;if(age>1){dust.splice(i,1);continue;}ctx.fillStyle=`rgba(237,180,217,${(1-age)*.35})`;ctx.fillRect(Math.round(p.x+age*p.dx),Math.round(p.y-age*12),2,2);}
    }
  }
  function frame(now){raf=0;if(now-lastFrame>=30||quiet()){drawScene(now);lastFrame=now;}if(!quiet())wake();}
  function burst(x,y,gold=false){if(quiet())return;bursts.push({x,y,start:performance.now(),gold});if(bursts.length>8)bursts.shift();burstCount++;publish();wake();}
  function cleanAnimation(animation){if(animation){animation.onfinish=null;animation.cancel();}}
  function select(key,{focus=false,push=true,origin,execute=true}={}){
    if(!keys.includes(key)&&key!=='home')key='home';const same=current===key;current=key;modeTarget=Math.max(0,keys.indexOf(key)-1);constellationPulse=performance.now();if(quiet())mode=modeTarget;
    tabs.forEach((tab,index)=>{const chosen=tab.dataset.target===key;tab.setAttribute('aria-pressed',String(chosen));tab.tabIndex=chosen?0:-1;});const d=names[key]||{name:'终端首页',en:'HOME'},i=keys.indexOf(key);document.getElementById('chapter-status').textContent=i<0?'HOME':`0${i+1} — ${d.en}`;document.getElementById('announcement').textContent='已切换到'+d.name;
    if(active&&execute)root.dispatchEvent(new CustomEvent('about:chapter-command',{detail:{key}}));
    if(push&&!same)dispatchEvent(new CustomEvent('tangzy:about-chapter',{detail:{key}}));publish();
    if(focus)(tabs[i]||document.getElementById('about-terminal-home')).focus({preventScroll:true});cleanAnimation(portraitAnimation);
    if(active&&!quiet()){
      if(!window.TangzyTerminal?.isOpen)portraitAnimation=portraitButton.animate([{filter:'brightness(1.18)',opacity:.72},{filter:'brightness(1)',opacity:1}],{duration:650,easing:'ease-out'});
      const r=(tabs[i]||document.getElementById('about-terminal-home')).getBoundingClientRect();burst(origin?.x??r.right,origin?.y??r.top+r.height/2,i===0);
    }else wake();
  }
  tabs.forEach(tab=>tab.addEventListener('click',e=>select(tab.dataset.target,{origin:e.detail?{x:e.clientX,y:e.clientY}:undefined})));
  root.querySelector('.chapter-menu').addEventListener('keydown',e=>{let index=keys.indexOf(current);if(['ArrowDown','ArrowRight','ArrowUp','ArrowLeft','Home','End'].includes(e.key)){e.preventDefault();const forward=['ArrowDown','ArrowRight'].includes(e.key);index=e.key==='Home'?0:e.key==='End'?keys.length-1:index<0?(forward?0:keys.length-1):(index+(forward?1:keys.length-1))%keys.length;select(keys[index],{focus:true});}});
  addEventListener('keydown',e=>{if(!active)return;if(e.target.closest('input,textarea,[contenteditable]'))return;if(['1','2','3'].includes(e.key)){e.preventDefault();select(keys[Number(e.key)],{focus:true});}});
  experience.addEventListener('pointermove',e=>{if(quiet())return;const r=experience.getBoundingClientRect();px=clamp((e.clientX-r.left)/r.width*2-1,-1,1);py=clamp((e.clientY-r.top)/r.height*2-1,-1,1);wake();});
  experience.addEventListener('pointerleave',()=>{px=py=0;wake();});experience.addEventListener('pointercancel',()=>{px=py=0;wake();});
  addEventListener('pointermove',e=>{if(!active)return;pointerX=e.clientX;pointerY=e.clientY;if(quiet())return;if(e.pointerType!=='touch'){const r=portraitButton.getBoundingClientRect();targetPoseX=clamp((e.clientX-r.left-r.width/2)/Math.max(1,r.width*.6),-1,1);targetPoseY=clamp((e.clientY-r.top-r.height/2)/Math.max(1,r.height*.7),-1,1);wake();}if(dust.length<32&&Math.abs(pointerX-(dust.at(-1)?.x??0))+Math.abs(pointerY-(dust.at(-1)?.y??0))>35){dust.push({x:pointerX,y:pointerY,dx:(rand(e.clientX+e.clientY)-.5)*24,start:performance.now()});wake();}},{passive:true});
  document.documentElement.addEventListener('pointerleave',()=>{targetPoseX=targetPoseY=0;wake();});
  addEventListener('pointercancel',()=>{targetPoseX=targetPoseY=0;wake();});
  document.addEventListener('click',e=>{if(!active)return;if(!e.target.closest('a,button,summary,.reading-card'))burst(e.clientX,e.clientY);});
  portraitButton.addEventListener('pointerdown',e=>{portraitPress={x:e.clientX,y:e.clientY,moved:false};});
  portraitButton.addEventListener('pointermove',e=>{if(portraitPress&&Math.hypot(e.clientX-portraitPress.x,e.clientY-portraitPress.y)>7)portraitPress.moved=true;if(quiet()||e.pointerType==='touch'||outline)return;const r=portraitButton.getBoundingClientRect();portraitButton.style.setProperty('--scan-x',((e.clientX-r.left)/r.width*100).toFixed(1)+'%');portraitButton.style.setProperty('--scan-y',((e.clientY-r.top)/r.height*100).toFixed(1)+'%');portraitButton.style.setProperty('--scan-radius',Math.max(65,r.width*.24)+'px');portraitButton.classList.add('is-scanning');});
  portraitButton.addEventListener('pointerleave',()=>portraitButton.classList.remove('is-scanning'));
  portraitButton.addEventListener('click',e=>{if(e.detail&&portraitPress?.moved){portraitPress=null;return;}portraitPress=null;outline=!outline;portraitButton.classList.remove('is-scanning');portraitButton.setAttribute('aria-pressed',String(outline));portraitButton.setAttribute('aria-label',outline?'恢复 Tangzy LOGO 的完整肖像':'查看 Tangzy LOGO 的轮廓视图');document.getElementById('portrait-hint-text').textContent=outline?'轮廓视图 · 点击恢复':'划过扫描 · 点击切换';publish();const r=portraitButton.getBoundingClientRect();burst(r.left+r.width*.5,r.top+r.height*.44,true);cleanAnimation(portraitAnimation);if(!quiet())portraitAnimation=portraitButton.animate([{filter:'brightness(1)'},{filter:'brightness(1.25)',offset:.2},{filter:'brightness(1)'}],{duration:700});});
  portraitButton.addEventListener('pointercancel',()=>{portraitPress=null;portraitButton.classList.remove('is-scanning');});

  root.querySelectorAll('.entry').forEach(detail=>detail.addEventListener('toggle',()=>{if(detail.open&&!quiet())detail.querySelector('.entry-body').animate([{opacity:0,transform:'translateY(-8px)'},{opacity:1,transform:'translateY(0)'}],{duration:260,easing:'ease-out'});}));
  function syncMotion(){if(quiet()){px=py=mx=my=targetPoseX=targetPoseY=poseX=poseY=0;mode=modeTarget;bursts.length=dust.length=0;portraitButton.classList.remove('is-scanning');cleanAnimation(portraitAnimation);}motionButton.setAttribute('aria-pressed',String(!quiet()));motionButton.querySelector('span').textContent=quiet()?'OFF':'ON';motionButton.setAttribute('aria-label',quiet()?'开启动画':'暂停动画');publish();wake();}
  motionButton.addEventListener('click',()=>{manualMotion=!manualMotion;syncMotion();root.dispatchEvent(new CustomEvent('about:motion-change'));});reduced.addEventListener('change',syncMotion);
  root.addEventListener('about:terminal-change',()=>{cleanAnimation(portraitAnimation);portraitButton.classList.remove('is-scanning');targetPoseX=targetPoseY=0;});

  addEventListener('resize',resize);document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;cleanAnimation(portraitAnimation);}else wake();});
  resize();select('home',{push:false});syncMotion();
  root.dataset.active='false';
  window.TangzyAbout={
    show(chapter,{focus=false}={}){active=true;root.dataset.active='true';resize();select(keys.includes(chapter)||chapter==='home'?chapter:current,{push:false,execute:false});if(focus)(tabs[keys.indexOf(current)]||document.getElementById('about-terminal-home')).focus({preventScroll:true});window.TangzyTerminal?.activate({chapter:current,explicit:!!chapter});wake();},
    selectChapter(key,options={}){select(key,options);},
    clearSelection(){tabs.forEach((tab,i)=>{tab.setAttribute('aria-pressed','false');tab.tabIndex=i===0?0:-1;});},
    hide(){window.TangzyTerminal?.deactivate();active=false;root.dataset.active='false';cancelAnimationFrame(raf);raf=0;cleanAnimation(portraitAnimation);px=py=mx=my=targetPoseX=targetPoseY=poseX=poseY=0;for(const name of ['--mx','--my','--pose-x','--pose-y'])root.style.setProperty(name,'0');portraitButton.classList.remove('is-scanning');},
    get chapter(){return current;}
  };
})();
