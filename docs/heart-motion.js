/* Tangzy A: heart subject and a synchronized background lifeline; logo remains.
   Reference techniques and observation limits: REFERENCES.md. No 3D mesh or camera. */
(() => {
  'use strict';
  const canvas = document.getElementById('heart');
  const paletteBar = document.getElementById('heart-palette');
  const ctx = canvas.getContext('2d');
  const lineCanvas=document.getElementById('lifeline');
  const lineCtx=lineCanvas.getContext('2d',{alpha:false});
  const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = reducedQuery.matches;
  const TAU = Math.PI * 2;
  const clamp = (v, lo=0, hi=1) => Math.max(lo, Math.min(hi, v));
  const ease = v => 1 - (1-clamp(v))**3;
  let seed = 63921;
  function random() { seed=(Math.imul(seed,1664525)+1013904223)|0; return (seed>>>0)/4294967296; }
  // A small circular dilation rounds the tip and lobes of the original flat mask.
  const roundOffsets=Array.from({length:12},(_,i)=>({x:Math.cos(i/12*TAU)*.035,y:Math.sin(i/12*TAU)*.035}));
  function baseField(x,y){return (x*x+y*y-1)**3-x*x*y*y*y;}
  function field(x,y){x/=1.02;y/=.97;let f=baseField(x,y);for(const o of roundOffsets)f=Math.min(f,baseField(x-o.x,y-o.y));return f;}
  function edgeAt(a) {
    const dx=Math.cos(a),dy=Math.sin(a);let lo=0,hi=1.9;
    for(let i=0;i<19;i++){const m=(lo+hi)/2;if(field(dx*m,dy*m)<=0)lo=m;else hi=m;}
    return {x:dx*lo,y:dy*lo-.11};
  }
  const outline=Array.from({length:640},(_,i)=>edgeAt(i/640*TAU));
  const mask=new Path2D();outline.forEach((p,i)=>i?mask.lineTo(p.x,-p.y):mask.moveTo(p.x,-p.y));mask.closePath();
  const body=[],rim=[],step=.028;
  for(let y=-1.06;y<=1.28;y+=step)for(let x=-1.22;x<=1.22;x+=step){
    if(field(x,y)>0||random()<.055)continue;
    let dist=3,ex=0,ey=0;
    for(let i=0;i<outline.length;i+=2){const q=outline[i],d=Math.hypot(x-q.x,y-.11-q.y);if(d<dist){dist=d;ex=q.x;ey=q.y;}}
    const depth=Math.sin(clamp(dist/.44)*Math.PI/2);
    body.push({x:x+(random()-.5)*step*.45,y:y-.11+(random()-.5)*step*.45,
      depth,edge:Math.exp(-dist/.07),nx:x-ex,ny:y-.11-ey,
      r:random(),phase:random()*TAU,life:random(),ox:0,oy:0,vx:0,vy:0});
  }
  for(let i=0;i<outline.length;i++){
    const p=outline[i];for(let k=0;k<2;k++)rim.push({x:p.x*(1+k*.007),y:p.y*(1+k*.007),u:i/outline.length,r:random(),phase:random()*TAU});
  }
  let pixelSky=null;
  const mixVec=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
  const rgb=(v,a=1)=>`rgba(${v.map(Math.round).join(',')},${a})`;
  const souls=[
    {name:'决心',color:'红',base:[255,50,77]},
    {name:'勇气',color:'橙',base:[255,151,47]},
    {name:'正义',color:'黄',base:[255,222,59]},
    {name:'仁慈',color:'绿',base:[65,220,126]},
    {name:'耐心',color:'青',base:[67,221,245]},
    {name:'正直',color:'蓝',base:[76,117,255]},
    {name:'毅力',color:'紫',base:[183,104,248]}
  ];
  const initialTheme={base:[255,117,188],levels:Array.from({length:64},(_,i)=>{const f=i/63;return [92+163*clamp(f*1.65),9+224*f**1.7,62+187*f**.8];})};
  function soulTheme(soul){return{base:soul.base,levels:Array.from({length:64},(_,i)=>{const f=i/63;return mixVec(soul.base.map(v=>v*clamp(.21+f*1.26)),[255,255,255],clamp((f-.58)/.42)*.72);})};}
  let palette=[],themeBase=initialTheme.base,stableTheme=initialTheme,soulIndex=-1,transition=null,paletteDiscovered=false,queuedSoul=null;
  const colorLabel=index=>index<0?'粉色':`${souls[index].color}色`;
  const paletteButtons=[-1,...souls.map((_,i)=>i)].map((index,i)=>{
    const button=document.createElement('button');button.type='button';button.className='soul-choice';button.dataset.soul=String(index);
    button.setAttribute('aria-label',`${colorLabel(index)}爱心`);button.title=colorLabel(index);button.setAttribute('aria-pressed',String(index===soulIndex));
    button.style.setProperty('--soul-color',rgb(index<0?initialTheme.base:souls[index].base));button.style.setProperty('--soul-order',String(i));
    button.innerHTML='<svg viewBox="0 0 13 11" aria-hidden="true" focusable="false"><path d="M1 0h4v1h1v1h1V1h1V0h4v1h1v4h-1v1h-1v1h-1v1H9v1H8v1H7v1H6v-1H5V9H4V8H3V7H2V6H1V5H0V1h1z"/></svg>';
    button.addEventListener('click',e=>{e.stopPropagation();if(transition){queuedSoul=index;syncPalette();}else if(index!==soulIndex)activate(index);});
    paletteBar.append(button);return button;
  });
  function syncPalette(){
    paletteBar.hidden=!paletteDiscovered||openingActive();const selected=queuedSoul??transition?.next??soulIndex;
    paletteButtons.forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.soul)===selected)));
    canvas.dataset.soulColor=colorLabel(soulIndex);canvas.dataset.paletteDiscovered=String(paletteDiscovered);
  }
  const sprite=document.createElement('canvas');sprite.width=sprite.height=80;const sc=sprite.getContext('2d');
  function tint(lightness=0,alpha=1){return rgb(lightness>=0?mixVec(themeBase,[255,255,255],lightness):themeBase.map(v=>v*(1+lightness)),alpha);}
  function applyTheme(from,to=from,f=0){
    themeBase=mixVec(from.base,to.base,f);palette=from.levels.map((v,i)=>rgb(mixVec(v,to.levels[i],f)));
    sc.clearRect(0,0,80,80);const sg=sc.createRadialGradient(40,40,0,40,40,40);
    sg.addColorStop(0,tint(.75,.80));sg.addColorStop(.10,tint(.10,.49));sg.addColorStop(.35,tint(-.10,.16));sg.addColorStop(1,tint(-.15,0));sc.fillStyle=sg;sc.fillRect(0,0,80,80);
  }
  applyTheme(initialTheme);
  const bloom=document.createElement('canvas'),bc=bloom.getContext('2d');
  const openingPlan={gatherAt:.8,gatherFor:2,readyAt:3};
  let openingElapsed=reduced?openingPlan.readyAt:0,openingFinished=reduced;
  const smooth=v=>{const t=clamp(v);return t*t*t*(t*(t*6-15)+10);};
  let w=0,h=0,dpr=1,time=0,last=0,raf=0,paused=false,frame=0,sceneVisible=true;
  let mx=0,my=0,tx=0,ty=0;
  let activePulseStart=-Infinity,reducedGlow=0,glowTimeout=0,pendingPulse=false;
  let lastArrival=-Infinity,arrivalCount=0,arrivalErrorMs=0,lastGap=null,lastCycle=-1,triggeredCycle=-1;
  const charge=0,burst=0,tiltLimit=10,tiltPerspective=1100;
  let frameMs=0,frameSamples=[];
  const c={cx:0,cy:0,scale:1};
  function openingActive(){return !openingFinished&&!reduced;}
  function openingState(){
    if(!openingActive())return{active:false,stage:'ready',progress:1,heartReveal:1,skyReveal:1,lineReveal:1,lineWidth:1};
    const progress=clamp((openingElapsed-openingPlan.gatherAt)/openingPlan.gatherFor);
    return{active:true,stage:openingElapsed<openingPlan.gatherAt?'lifeline':progress<1?'gather':'settle',progress,
      heartReveal:smooth((progress-.60)/.40),skyReveal:.18+.82*smooth((openingElapsed-.30)/2.50),
      lineReveal:ease(openingElapsed/.30),lineWidth:ease(openingElapsed/.75)};
  }
  function finishOpening(){
    if(openingFinished)return;
    openingElapsed=openingPlan.readyAt;openingFinished=true;lastArrival=-Infinity;lastGap=null;lastCycle=-1;
    canvas.setAttribute('aria-disabled','false');canvas.tabIndex=0;updateLabel();syncPalette();
  }
  function resize(){
    w=innerWidth;h=innerHeight;dpr=Math.min(devicePixelRatio||1,1.5);
    canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    lineCanvas.width=canvas.width;lineCanvas.height=canvas.height;lineCtx.setTransform(dpr,0,0,dpr,0,0);
    bloom.width=Math.ceil(w/3);bloom.height=Math.ceil(h/3);
    c.cx=w*.5;c.cy=h*.5;c.scale=Math.min(w*.325,h*.290);
    paletteBar.style.top=Math.max(20,c.cy-Math.max(...outline.map(p=>p.y))*c.scale*1.12-60)+'px';
    lastGap=null;lastCycle=-1;lastArrival=-Infinity;
    buildSky();
    if(paused||reduced)render(0);
  }
  const rhythm={period:3.6};
  function phaseAt(t){return ((t%rhythm.period)+rhythm.period)%rhythm.period;}
  function bump(p,center,width){return Math.exp(-Math.pow((p-center)/width,2));}
  function beatAt(t){const age=t-lastArrival;if(age<=0||age>.65)return 0;const u=age/.040;return u*Math.exp(1-u);}
  function lifeSignal(s){
    return .10*bump(s,.68,.17)-.17*bump(s,.23,.10)+bump(s,0,.10)
      -.33*bump(s,-.23,.12)+.29*bump(s,-.85,.31);
  }
  function travelState(){const margin=clamp(w*.05,60,100),span=w+margin*2;return{crestX:-margin+span*phaseAt(time)/rhythm.period,speed:span/rhythm.period,baseline:c.cy+c.scale*.05,width:clamp(w*.085,76,125),amplitude:Math.min(48,h*.047,w*.075)};}
  function contactX(baseline){
    const rx=-my*tiltLimit*Math.PI/180,ry=mx*tiltLimit*Math.PI/180,sx=Math.sin(rx),cx=Math.cos(rx),sy=Math.sin(ry),cy=Math.cos(ry);
    const project=p=>{const x=p.x*c.scale,y=-p.y*c.scale,z=-x*cx*sy+y*sx,q=tiltPerspective/(tiltPerspective-z);return{x:c.cx+x*cy*q,y:c.cy+(x*sx*sy+y*cx)*q};};
    let previous=project(outline[outline.length-1]),left=c.cx;
    for(const p of outline){const next=project(p);if((previous.y<=baseline&&next.y>=baseline)||(next.y<=baseline&&previous.y>=baseline)){const dy=next.y-previous.y;if(Math.abs(dy)>.0001)left=Math.min(left,previous.x+(next.x-previous.x)*(baseline-previous.y)/dy);}previous=next;}
    return left;
  }
  function updateArrival(dt,travel){
    const target=contactX(travel.baseline),gap=travel.crestX-target,cycle=Math.floor(time/rhythm.period);
    if(!reduced&&!openingActive()&&lastGap!==null&&lastCycle===cycle&&lastGap<0&&gap>=0&&triggeredCycle!==cycle){
      const overshoot=clamp(gap/(gap-lastGap))*dt;lastArrival=time-overshoot;arrivalCount++;arrivalErrorMs=overshoot*1000;triggeredCycle=cycle;
    }
    lastGap=gap;lastCycle=cycle;return target;
  }
  function buildSky(){
    pixelSky=window.TangzyPixelSky.create(w,h);
  }
  function drawSky(reveal=1){
    pixelSky.draw(lineCtx,{mx,my,time,reduced,reveal});
  }
  function drawLifeline(beat,travel,target,op){
    lineCtx.save();lineCtx.beginPath();lineCtx.rect(0,0,w*op.lineWidth,h);lineCtx.clip();
    const {baseline,amplitude}=travel,crestX=reduced?w*.24:travel.crestX;
    const path=new Path2D();
    for(let x=0;x<=w+2;x+=2){
      const y=baseline-lifeSignal((x-crestX)/travel.width)*amplitude;
      if(x===0)path.moveTo(x,y);else path.lineTo(x,y);
    }
    const fade=lineCtx.createLinearGradient(0,0,w,0);
    fade.addColorStop(0,tint(0,0));fade.addColorStop(.07,tint(0,.33));
    fade.addColorStop(.25,tint(.34,.69));fade.addColorStop(.5,tint(.34,.50));
    fade.addColorStop(.75,tint(.34,.69));fade.addColorStop(.93,tint(0,.33));fade.addColorStop(1,tint(0,0));
    lineCtx.save();lineCtx.lineJoin='round';lineCtx.lineCap='round';lineCtx.strokeStyle=fade;
    lineCtx.globalAlpha=(.10+beat*.045)*op.lineReveal;lineCtx.lineWidth=9;lineCtx.stroke(path);
    lineCtx.globalAlpha=(.22+beat*.10)*op.lineReveal;lineCtx.lineWidth=3.2;lineCtx.stroke(path);
    lineCtx.globalAlpha=(.65+beat*.22)*op.lineReveal;lineCtx.lineWidth=1.05;lineCtx.stroke(path);lineCtx.restore();
    // A single travelling crest makes the approach and contact legible.
    if(crestX>=0&&crestX<=w){const y=baseline-lifeSignal(0)*amplitude;lineCtx.save();lineCtx.globalAlpha=.65*op.lineReveal;lineCtx.fillStyle=tint(.65);lineCtx.beginPath();lineCtx.arc(crestX,y,1.7,0,TAU);lineCtx.fill();lineCtx.restore();}
    if(beat>.02){lineCtx.save();const g=lineCtx.createRadialGradient(target,baseline,0,target,baseline,22);g.addColorStop(0,tint(.55,beat*.45));g.addColorStop(1,tint(0,0));lineCtx.fillStyle=g;lineCtx.fillRect(target-22,baseline-22,44,44);lineCtx.restore();}
    lineCtx.restore();
  }
  function layoutTransform(scale=1,dx=0,dy=0){ctx.translate(c.cx+dx,c.cy+dy);ctx.scale(c.scale*scale,c.scale*scale);}
  function fillMask(color,scale=1,dx=0,dy=0){ctx.save();layoutTransform(scale,dx,dy);ctx.fillStyle=color;ctx.fill(mask);ctx.restore();}
  function glow(x,y,size,alpha){bc.globalAlpha=clamp(alpha);bc.drawImage(sprite,(x-size/2)/3,(y-size/2)/3,size/3,size/3);}
  function paintRelief(pulse,intro){
    // Offset dark silhouettes and fixed painted lighting, rather than a rotating volume.
    const backX=12-mx*9,backY=13-my*7;
    fillMask(tint(-.78,intro*.78),pulse*1.012,backX,backY);
    fillMask(tint(-.58,intro*.60),pulse*.997,backX*.50,backY*.50);
    ctx.save();layoutTransform(pulse);
    const paint=ctx.createLinearGradient(-1,-1.1,1.1,1.15);
    paint.addColorStop(0,tint(-.45));paint.addColorStop(.14,tint(-.68));paint.addColorStop(.38,tint(-.80));paint.addColorStop(.75,tint(-.85));paint.addColorStop(1,tint(-.91));
    ctx.globalAlpha=intro*.96;ctx.fillStyle=paint;ctx.fill(mask);ctx.restore();
  }
  function drawRims(pulse,intro,beat,front){
    const offsetX=front?mx*6:12-mx*9,offsetY=front?my*5:13-my*7;
    const phase=(time*.075)%1;
    for(let i=0;i<rim.length;i++){
      const p=rim[i],hot=Math.max(0,1-Math.abs(((p.u-phase+.5)%1)-.5)/.075);
      const lit=clamp(.38-p.x*.23+p.y*.20),a=(front?.22+lit*.42+hot*.3:.12+p.r*.20)*intro;
      const size=(front?1.2:1.4)+p.r*1.1,x=c.cx+p.x*c.scale*pulse+offsetX,y=c.cy-p.y*c.scale*pulse+offsetY;
      ctx.fillStyle=front?(lit>.6?tint(.70):tint(-.02)):tint(-.40);ctx.globalAlpha=a;ctx.fillRect(Math.round(x),Math.round(y),size,size);
      if(front&&hot>.3&&i%3===0)glow(x,y,23,hot*.38);
    }
    ctx.globalAlpha=1;
  }
  function effectState(){
    if(!transition)return{scatter:0,kick:0,age:0};
    const age=time-transition.start;
    const scatter=age<.55?ease(age/.55):age<.75?1:Math.pow(1-clamp((age-.75)/1.13),3);
    return{age,scatter,kick:0};
  }
  function activePulseState(){
    const age=time-activePulseStart;
    if(reduced)return{strength:0,glow:reducedGlow,active:reducedGlow>0};
    if(age<0||age>1.15)return{strength:0,glow:0,active:false};
    const impulse=t=>t<0?0:(t/.055)*Math.exp(1-t/.055);
    return{strength:impulse(age)+.25*impulse(age-.22),glow:(1-Math.exp(-age/.025))*Math.exp(-age/.36),active:true};
  }
  function drawActiveAura(amount){
    if(amount<.005)return;
    const radius=c.scale*1.65,g=ctx.createRadialGradient(c.cx,c.cy,0,c.cx,c.cy,radius);
    g.addColorStop(0,tint(.30,amount*.18));g.addColorStop(.55,tint(.08,amount*.11));g.addColorStop(1,tint(0,0));
    ctx.save();ctx.fillStyle=g;ctx.fillRect(c.cx-radius,c.cy-radius,radius*2,radius*2);ctx.restore();
  }
  function render(dt){
    const start=performance.now(),op=openingState(),travel=travelState(),target=updateArrival(dt,travel),fx=effectState(),active=activePulseState(),intro=op.heartReveal*(1-clamp(fx.scatter*1.8)),beat=reduced?0:beatAt(time),pulse=1+beat*.027+active.strength*.075;
    ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;ctx.clearRect(0,0,w,h);
    drawSky(op.skyReveal);drawLifeline(beat,travel,target,op);
    document.body.style.setProperty('--logo-reveal',op.active?smooth((openingElapsed-1.55)/1.20):1);
    document.body.style.setProperty('--wordmark-reveal',op.active?smooth((openingElapsed-1.75)/1.05):1);
    canvas.style.transform=reduced?'none':`perspective(${tiltPerspective}px) rotateX(${-my*tiltLimit}deg) rotateY(${mx*tiltLimit}deg)`;
    ctx.globalAlpha=1;bc.clearRect(0,0,bloom.width,bloom.height);bc.globalCompositeOperation='lighter';
    drawActiveAura(active.glow);
    if(intro>.001){paintRelief(pulse,ease((intro-.16)/.84));drawRims(pulse,intro,beat,false);}
    if(!op.active||openingElapsed>openingPlan.gatherAt)for(const p of body){
      const floating=reduced?0:Math.sin(time*.8+p.phase)*.005*(1-p.depth*.5);
      const layerShiftX=(p.depth-.45)*mx*34,layerShiftY=(p.depth-.45)*my*26;
      const age=time-lastArrival;
      const localBeat=reduced||age<0||age>.9?0:Math.exp(-Math.pow((Math.hypot(p.x,p.y*.85)-age*3.2)/.16,2))*Math.exp(-age/.65);
      const scatter=0;
      let x=p.x*(pulse+scatter)+p.ox+floating;
      let y=p.y*(1+beat*.017+active.strength*.065+scatter)+p.oy+floating;
      const direction=Math.atan2(p.y,p.x)+(p.r-.5)*1.0+fx.scatter*.45;
      const distance=fx.scatter*(.60+p.life*.90)*Math.min(1,w/(c.scale*4.5));
      x+=Math.cos(direction)*distance;y+=Math.sin(direction)*distance;
      let visibility=1,assembly=1;
      if(op.active){
        const stagger=p.life*.32,raw=(openingElapsed-openingPlan.gatherAt-stagger)/(openingPlan.gatherFor-stagger);
        assembly=smooth(raw);visibility=ease((openingElapsed-openingPlan.gatherAt)/.30)*(.45+.55*assembly);
        const side=p.r<.5?-1:1,sourceX=side*(w/(c.scale*2)+.18+p.life*.36),sourceY=.05+Math.sin(p.phase)*.38;
        const arc=Math.sin(assembly*Math.PI);
        x=sourceX*(1-assembly)+x*assembly+arc*Math.sin(p.phase+assembly*TAU)*.26;
        y=sourceY*(1-assembly)+y*assembly+arc*Math.sin(p.phase)*(.55+p.life*.50);
      }
      const px=c.cx+x*c.scale+layerShiftX,py=c.cy-y*c.scale+layerShiftY;
      const edgeLight=p.edge*clamp(.35-p.x*.29+p.y*.25);
      const fold=Math.exp(-Math.pow(p.x/.10,2))*clamp((p.y-.30)/.5)*.15;
      const sweep=Math.exp(-Math.pow((p.x*.68+p.y*.42-Math.sin(time*.33)*1.27)/.14,2));
      const grain=.5+.5*Math.sin(p.phase+time*1.8+p.y*4);
      const bright=clamp(.32+p.depth*.28+edgeLight*.55+p.r*.22+grain*.07+sweep*.17+localBeat*.15+active.glow*.25+charge*.14-fold);
      const size=Math.max(.8,c.scale*step*(.42+p.r*.31)*(1+localBeat*.08+active.strength*.05)*(.65+.35*assembly));
      ctx.globalAlpha=(.60+p.r*.32)*visibility;ctx.fillStyle=palette[Math.round(bright*63)];ctx.fillRect(Math.round(px-size/2),Math.round(py-size/2),size,size);
      if(p.r>.66&&bright>.55)glow(px,py,(19+bright*22)*c.scale/240,(bright-.35)*(.64+active.glow*.60)*visibility);
      if(p.r>.992&&bright>.57){const flash=reduced?.5:Math.max(0,Math.sin(time*1.1+p.phase))**14;ctx.globalAlpha=flash*.85*visibility;ctx.fillStyle=tint(.88);ctx.fillRect(px-.5,py-5,1,10);ctx.fillRect(px-5,py-.5,10,1);}
    }
    ctx.globalAlpha=1;if(intro>.001)drawRims(pulse,intro,beat,true);
    if(intro>.001&&canvas.matches(':focus-visible')){ctx.save();layoutTransform(pulse*1.025);ctx.strokeStyle=tint(.8,.60);ctx.lineWidth=1.3/c.scale;ctx.stroke(mask);ctx.restore();}
    ctx.globalAlpha=.88;ctx.globalCompositeOperation='screen';ctx.drawImage(bloom,0,0,w,h);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
    frame++;frameMs=performance.now()-start;frameSamples.push(frameMs);if(frameSamples.length>120)frameSamples.shift();
    window.__heartStudy={variant:'A',renderMode:'screen-space-relief',volumeRotation:false,opening:{...op,elapsed:openingElapsed,readyAt:openingPlan.readyAt},tilt:{x:-my*tiltLimit,y:mx*tiltLimit,limit:tiltLimit,frozen:!!transition||op.active},particles:body.length,rimParticles:rim.length,paused,time,frame,width:w,height:h,frameMs,meanRenderMs:frameSamples.reduce((a,b)=>a+b,0)/frameSamples.length,parallaxSpan:mx*34,soul:{index:soulIndex,name:soulIndex<0?'初始粉色':souls[soulIndex].name,color:soulIndex<0?'粉':souls[soulIndex].color,target:transition?(transition.next<0?'初始粉色':souls[transition.next].name):null},interaction:{active:!!transition,scatter:fx.scatter,age:fx.age,backgroundPulse:active,pendingPulse},geometry:{scale:c.scale,rounding:.035,widthScale:1.02,heightScale:.97},background:{...pixelSky.state},lifeline:{enabled:true,period:rhythm.period,phase:phaseAt(time),crestX:travel.crestX,contactX:target,gap:travel.crestX-target,arrivals:arrivalCount,lastArrival:Number.isFinite(lastArrival)?lastArrival:null,arrivalErrorMs,heartStrength:beat,heartScale:pulse}};
  }
  function tick(now){
    raf=0;const dt=last?Math.min((now-last)/1000,.045):0;last=now;
    if(!paused){time+=dt;if(openingActive()){openingElapsed+=dt;if(openingElapsed>=openingPlan.readyAt)finishOpening();}
      if(!transition&&!openingActive()){mx+=(tx-mx)*Math.min(1,dt*6.5);my+=(ty-my)*Math.min(1,dt*6.5);}
      if(transition){const age=time-transition.start;applyTheme(stableTheme,transition.theme,ease((age-.60)/.95));if(age>=1.88)finishTransition();}
      render(dt);}
    if(sceneVisible&&!paused&&!reduced&&!document.hidden)raf=requestAnimationFrame(tick);
  }
  function updateLabel(){
    if(openingActive()){canvas.setAttribute('aria-label','开场：生命线先显现，像素随后汇聚成爱心。按 Escape 跳过。');return;}
    const label=soulIndex<0?'粉色':`${souls[soulIndex].color}色 · ${souls[soulIndex].name}`;
    canvas.setAttribute('aria-label',`${label}像素爱心。移动指针观察倾斜；点击爱心散开重组并换色，散开时暂停跟随；点击背景触发更亮的主动心跳。回车同样触发重组。${paletteDiscovered?'上方的小像素爱心可直接选择颜色。':''}`);
  }
  function activate(next=soulIndex===souls.length-1?-1:soulIndex+1){
    if(transition||openingActive())return;
    paletteDiscovered=true;
    activePulseStart=-Infinity;reducedGlow=0;clearTimeout(glowTimeout);
    const theme=next<0?initialTheme:soulTheme(souls[next]);
    if(reduced){stableTheme=theme;soulIndex=next;applyTheme(theme);updateLabel();syncPalette();render(0);return;}
    transition={next,theme,start:time};syncPalette();paused=false;canvas.setAttribute('aria-busy','true');render(0);play();
  }
  function triggerBackgroundPulse(){
    if(openingActive())return;
    if(transition){pendingPulse=true;return;}
    if(reduced){clearTimeout(glowTimeout);reducedGlow=.55;render(0);glowTimeout=setTimeout(()=>{reducedGlow=0;render(0);},350);return;}
    activePulseStart=time;paused=false;render(0);play();
  }
  function screenToPlane(clientX,clientY){
    const X=clientX-c.cx,Y=clientY-c.cy,rx=-my*tiltLimit*Math.PI/180,ry=mx*tiltLimit*Math.PI/180;
    const a=Math.cos(ry)-X*Math.cos(rx)*Math.sin(ry)/tiltPerspective;
    const b=X*Math.sin(rx)/tiltPerspective;
    const d=Math.sin(rx)*Math.sin(ry)-Y*Math.cos(rx)*Math.sin(ry)/tiltPerspective;
    const e=Math.cos(rx)+Y*Math.sin(rx)/tiltPerspective,det=a*e-b*d;
    return{x:(X*e-b*Y)/det,y:(a*Y-X*d)/det};
  }
  function hitHeart(x,y){const p=screenToPlane(x,y);return field(p.x/(c.scale*1.035),-p.y/(c.scale*1.035)+.11)<=0;}
  let gestureStart=null,gestureDragged=false;
  addEventListener('pointermove',e=>{
    if(scrollY>1||document.body.dataset.page!=='home'){tx=ty=0;canvas.style.cursor='default';return;}
    if(!reduced){tx=clamp((e.clientX-c.cx)/(c.scale*1.1),-1,1);ty=clamp((e.clientY-c.cy)/(c.scale*1.1),-1,1);}
    canvas.style.cursor=!openingActive()&&hitHeart(e.clientX,e.clientY)&&!transition?'pointer':'default';
    if(gestureStart&&Math.hypot(e.clientX-gestureStart.x,e.clientY-gestureStart.y)>8)gestureDragged=true;
  });
  document.addEventListener('pointerdown',e=>{gestureStart={x:e.clientX,y:e.clientY};gestureDragged=false;});
  addEventListener('pointerup',e=>{gestureStart=null;if(e.pointerType==='touch')tx=ty=0;});
  addEventListener('pointercancel',()=>{gestureStart=null;gestureDragged=true;tx=ty=0;});
  document.addEventListener('click',e=>{
    if(scrollY>1||document.body.dataset.page!=='home')return;
    if(openingActive()||gestureDragged||e.button!==0||(e.target instanceof Element&&e.target.closest('a,button,input,textarea,select,summary,.logo,#heart-palette')))return;
    if(hitHeart(e.clientX,e.clientY))activate();else triggerBackgroundPulse();
  });
  document.addEventListener('pointerout',e=>{if(!e.relatedTarget)tx=ty=0;});
  addEventListener('blur',()=>{tx=ty=0;gestureStart=null;});
  function play(){last=0;if(sceneVisible&&!raf)raf=requestAnimationFrame(tick);}
  function pause(){paused=!paused;if(paused){cancelAnimationFrame(raf);raf=0;render(0);}else play();}
  function finishTransition(){if(!transition)return;stableTheme=transition.theme;soulIndex=transition.next;transition=null;applyTheme(stableTheme);canvas.setAttribute('aria-busy','false');const next=queuedSoul;queuedSoul=null;updateLabel();syncPalette();if(next!==null&&next!==soulIndex){activate(next);return;}if(pendingPulse){pendingPulse=false;triggerBackgroundPulse();}}
  function replay(){pendingPulse=false;queuedSoul=null;finishTransition();time=0;openingElapsed=reduced?openingPlan.readyAt:0;openingFinished=reduced;mx=my=tx=ty=0;canvas.setAttribute('aria-disabled',String(openingActive()));canvas.tabIndex=openingActive()?-1:0;updateLabel();syncPalette();activePulseStart=-Infinity;reducedGlow=0;clearTimeout(glowTimeout);lastGap=null;lastCycle=-1;triggeredCycle=-1;lastArrival=-Infinity;arrivalCount=0;paused=false;if(reduced)render(0);else play();}
  addEventListener('keydown',e=>{if(scrollY>1||document.body.dataset.page!=='home'||(e.target instanceof Element&&e.target.closest('input,textarea,[contenteditable="true"],a,button')))return;if(e.key==='Escape'&&openingActive()){finishOpening();render(0);return;}if((e.key==='Enter'||e.code==='Space')&&e.target===canvas){e.preventDefault();if(!e.repeat)activate();return;}if(e.key.toLowerCase()==='r')replay();});
  addEventListener('tangzy:scene-visibility',e=>{sceneVisible=e.detail.visible;tx=ty=0;if(!sceneVisible){finishOpening();render(0);cancelAnimationFrame(raf);raf=0;last=0;}else if(!paused&&!reduced&&!document.hidden)play();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;last=0;}else if(!paused&&!reduced)play();});
  reducedQuery.addEventListener('change',e=>{reduced=e.matches;cancelAnimationFrame(raf);raf=0;lastArrival=-Infinity;lastGap=null;lastCycle=-1;activePulseStart=-Infinity;reducedGlow=0;clearTimeout(glowTimeout);if(reduced){finishOpening();finishTransition();mx=my=tx=ty=0;render(0);}else if(!paused)play();});
  canvas.addEventListener('focus',()=>render(0));canvas.addEventListener('blur',()=>render(0));
  addEventListener('resize',resize);resize();updateLabel();syncPalette();
  canvas.setAttribute('aria-disabled',String(openingActive()));canvas.tabIndex=openingActive()?-1:0;
  if(reduced)render(0);else play();
})();

