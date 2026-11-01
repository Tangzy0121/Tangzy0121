/* Local portfolio: one route owner for Home, Work, About and Contact. */
(() => {
 'use strict';
 const body=document.body,home=document.getElementById('home-view'),work=document.getElementById('work-view'),about=document.getElementById('about-view'),contact=document.getElementById('contact-view'),detail=document.getElementById('detail-view'),nav=document.querySelector('.site-nav'),indicator=nav.querySelector('.nav-heart'),links=[...nav.querySelectorAll('a')],scene=document.getElementById('scene'),canvas=document.getElementById('heart'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let page='home',navPage='home',route='home',homeY=0,sceneVisible=true,scrollFrame=0,section='01',pendingTerminalMail=false;
 const sections=[...document.querySelectorAll('[data-section]')];
 history.scrollRestoration='manual';
 function publish(){window.__homeScrollStudy={ready:true,prototype:true,page,navPage,route,homeY,scrollY,section,sceneVisible};}
 function moveIndicator(){const label=links.find(a=>a.dataset.page===navPage).querySelector('span').getBoundingClientRect(),rect=nav.getBoundingClientRect();indicator.style.transform=`translateX(${Math.round(label.left-rect.left-indicator.offsetWidth-9)}px)`;}
 function syncNavigation(key,{coverMs}={}){
  navPage=key;if(Number.isFinite(coverMs))nav.style.setProperty('--indicator-duration',`${coverMs}ms`);
  links.forEach(a=>{if(a.dataset.page===key)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});moveIndicator();publish();
 }
 function updateScroll(){scrollFrame=0;const y=scrollY,vh=innerHeight;body.classList.toggle('is-scrolled',page==='home'&&y>180);if(page==='home'){homeY=y;scene.style.setProperty('--hero-opacity',String(1-Math.min(y/vh,1)*.65));let active=sections[0];for(const s of sections)if(s.getBoundingClientRect().top<vh*.48)active=s;section=active.dataset.section;document.getElementById('section-number').textContent=section;}
  const visible=page==='home'&&y<vh+20;if(visible!==sceneVisible){sceneVisible=visible;dispatchEvent(new CustomEvent('tangzy:scene-visibility',{detail:{visible}}));}canvas.tabIndex=visible&&y<2&&!window.__heartStudy?.opening.active?0:-1;publish();}
 function onScroll(){if(!scrollFrame)scrollFrame=requestAnimationFrame(updateScroll);}
 function scrollTop(smooth=true){window.scrollTo({top:0,behavior:smooth&&!reduced.matches?'smooth':'instant'});}
 function commitNavigation(next,{push=true,keyboard=false}={}){
  next=next==='work/01'?'work/folio':next==='work/02'?'work/btw':next;
  const wanted=next.split('/')[0],nextPage=['work','about','contact'].includes(wanted)?wanted:'home',wasHome=page==='home';
  if(wasHome&&nextPage!=='home')homeY=scrollY;
  if(nextPage!=='work')window.TangzyWork.hide();
  if(push)history.pushState(null,'','#'+(nextPage==='home'?'home':next));
  route=nextPage==='home'?'home':next;page=nextPage;body.dataset.page=page;home.hidden=page!=='home';work.hidden=page!=='work';about.hidden=page!=='about';contact.hidden=page!=='contact';detail.hidden=true;
  if(page!=='about')window.TangzyAbout.hide();
  if(page!=='contact')window.TangzyContact.hide();
  syncNavigation(page);
  if(page==='home'){
   if(wasHome)scrollTop();else{window.scrollTo({top:homeY,behavior:'instant'});requestAnimationFrame(()=>window.scrollTo({top:homeY,behavior:'instant'}));}
  }else if(page==='about'){
   window.scrollTo({top:0,behavior:'instant'});window.TangzyAbout.show(next.split('/')[1],{focus:keyboard});
  }else if(page==='contact'){
   window.scrollTo({top:0,behavior:'instant'});window.TangzyContact.show({focus:keyboard});if(pendingTerminalMail){pendingTerminalMail=false;window.TangzyContact.compose();}
  }else{
   window.TangzyWork.show(next.split('/')[1],{focus:keyboard});
  }
  document.title='Tangzy';moveIndicator();updateScroll();
 }
 function navigate(next,options={}){
  const key=['work','about','contact'].includes(next.split('/')[0])?next.split('/')[0]:'home';
  if(next===route&&!window.TangzyTransitions.busy){if(key==='home')scrollTop();return;}
  if(key==='about'&&page==='about'&&!window.TangzyTransitions.busy){commitNavigation(next,options);return;}
  if(key==='work'&&page==='work'&&!window.TangzyTransitions.busy){commitNavigation(next,options);return;}
  const link=links.find(a=>a.dataset.page===key),rect=link.getBoundingClientRect(),origin=options.origin||{x:rect.left+rect.width/2,y:rect.top+rect.height/2};
  window.TangzyTransitions.play({key,route:next,origin,start:timing=>syncNavigation(key,timing),commit:()=>commitNavigation(next,options)});
 }
 document.addEventListener('click',e=>{
  const target=e.target.closest('a,button');if(!target)return;
  if(target.closest('#heart-palette'))return;
  if(target.closest('.site-nav,.brand,#home-view,#detail-view,.to-top')){e.stopPropagation();}
  if(target.matches('[data-scroll]')){e.preventDefault();document.getElementById(target.dataset.scroll).scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'start'});return;}
  if(target.matches('.to-top')){scrollTop();return;}
  if(target.matches('a[href^="#"]')){e.preventDefault();navigate(target.hash.slice(1),{keyboard:e.detail===0,origin:e.detail===0?undefined:{x:e.clientX,y:e.clientY}});}
 },true);
 addEventListener('popstate',()=>navigate(location.hash.slice(1)||'home',{push:false}));
 // The iframe owns terminal history; GUI shortcuts must not add a second entry.
 addEventListener('tangzy:about-chapter',()=>{if(page==='about')publish();});
 addEventListener('tangzy:terminal-open',()=>navigate('about'));
 addEventListener('tangzy:terminal-compose',()=>{pendingTerminalMail=true;navigate('contact');});
 addEventListener('tangzy:work-project',e=>navigate(e.detail.id?'work/'+e.detail.id:'work'));
 addEventListener('keydown',e=>{if(page!=='work')return;if(e.key==='Escape'&&window.TangzyWork.isDetailOpen){e.preventDefault();e.stopImmediatePropagation();window.TangzyWork.closeDetail();}else if(window.TangzyWork.isEditing)e.stopImmediatePropagation();},true);
 addEventListener('keydown',e=>{if(e.key==='Escape'&&page==='about'&&window.TangzyTerminal?.isOpen){e.preventDefault();e.stopImmediatePropagation();window.TangzyTerminal.close();return;}if(page==='contact'&&contact.dataset.screenMode!=='channel'||e.target.closest('input,textarea,[contenteditable="true"]'))return;if(e.key==='Escape'&&(page!=='home'||window.TangzyTransitions.busy)){e.preventDefault();e.stopImmediatePropagation();navigate('home',{keyboard:true});links[0].focus({preventScroll:true});}},true);
 addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',()=>{moveIndicator();onScroll();});
 body.classList.add('js-reveal');const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}}),{threshold:.08});document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
 commitNavigation(location.hash.slice(1)||'home',{push:false});
})();
