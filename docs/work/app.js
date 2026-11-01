/* Work module for the local portfolio. One outer header, navigation and route owner. */
(() => {
 'use strict';
 const host=document.getElementById('work-view'),base=new URL('./',document.currentScript.src),root=host.attachShadow({mode:'open'});
 root.innerHTML='<link rel="stylesheet" href="'+new URL('style.css',base).href+'">'+"<canvas id=\"sky\" aria-hidden=\"true\"></canvas><div class=\"atmosphere\" aria-hidden=\"true\"></div><div class=\"work-content\">\n  <section class=\"work-heading\" aria-labelledby=\"work-title\"><div><p class=\"section-label\">SELECTED & COLLECTED</p><h1 id=\"work-title\">Work<span class=\"pixel-period\" aria-hidden=\"true\"></span></h1></div><p class=\"work-intro\">阅读、编码、研究，<br>把好奇心做成可以使用的东西。<span>向下，慢慢看。 ↓</span></p></section>\n  <section class=\"collections\" aria-labelledby=\"collections-title\"><div class=\"section-heading\"><h2 id=\"collections-title\">精选系列</h2><span>COLLECTIONS / 02</span></div><div class=\"collection-grid\">\n   <button class=\"collection collection-research\" data-collection=\"questions\" aria-label=\"浏览精选系列 阅读与学习\"><span class=\"folio-art\" aria-hidden=\"true\"><i class=\"paper paper-back\"></i><i class=\"paper paper-middle\"></i><i class=\"paper paper-front\"><span class=\"folio-diagram\"><b></b><b></b><b></b><b></b><em></em></span><span class=\"paper-tab\">READING</span></i></span><span class=\"collection-copy\"><span class=\"collection-kicker\">01 / 从资料到理解</span><strong>阅读与学习</strong><span class=\"collection-description\">让阅读与学习，多一点顺手的工具。</span></span><span class=\"collection-end\">03 项<span>↗</span></span></button>\n   <button class=\"collection collection-studio\" data-collection=\"studio\" aria-label=\"浏览精选系列 代码与工具\"><span class=\"folio-art\" aria-hidden=\"true\"><i class=\"paper paper-back\"></i><i class=\"paper paper-middle\"></i><i class=\"paper paper-front\"><span class=\"folio-rings\"><b></b><b></b><b></b></span><span class=\"paper-tab\">BUILDING</span></i></span><span class=\"collection-copy\"><span class=\"collection-kicker\">02 / 从想法到实现</span><strong>代码与工具</strong><span class=\"collection-description\">从侧问面板，到一个 Agent 的学习过程。</span></span><span class=\"collection-end\">03 项<span>↗</span></span></button>\n  </div></section>\n  <section id=\"catalogue\" class=\"catalogue\" aria-labelledby=\"catalogue-title\">\n   <div class=\"catalogue-title\"><h2 id=\"catalogue-title\">全部作品<span id=\"result-count\">09</span></h2><p>来自公开仓库与个人主页</p></div>\n   <div class=\"filter-bar\"><div class=\"category-tabs\" aria-label=\"筛选作品类别\"><button data-category=\"all\" aria-pressed=\"true\">全部</button><button data-category=\"research\" aria-pressed=\"false\">资料</button><button data-category=\"tools\" aria-pressed=\"false\">工具</button><button data-category=\"design\" aria-pressed=\"false\">设计</button><button data-category=\"experiment\" aria-pressed=\"false\">探索</button></div><div class=\"search-box\"><svg viewBox=\"0 0 20 20\" aria-hidden=\"true\"><circle cx=\"8.5\" cy=\"8.5\" r=\"5.5\"/><path d=\"m13 13 4 4\"/></svg><input id=\"search\" type=\"search\" placeholder=\"查找作品\" aria-label=\"查找作品\" autocomplete=\"off\"><button id=\"clear-search\" aria-label=\"清除搜索\" hidden>×</button></div></div>\n   <div id=\"collection-filter\" class=\"collection-filter\" hidden><span></span><button aria-label=\"退出精选系列\">×</button></div>\n   <p id=\"results-status\" class=\"sr-only\" role=\"status\" aria-live=\"polite\"></p>\n   <div id=\"work-list\" class=\"work-list\"></div>\n  </section>\n  <section id=\"visual-notes\" class=\"visual-notes\" aria-labelledby=\"visual-title\"><div class=\"visual-heading\"><div><p class=\"section-label\">OUT OF THE REPOSITORY</p><h2 id=\"visual-title\">从仓库里，<br><em>走到日常里。</em></h2></div><p>一本书、一个侧问面板、一位桌面伙伴。<br><span>点开，看看每件作品解决的小问题。</span></p></div><div id=\"notes-grid\" class=\"notes-grid\"></div></section>\n  <footer class=\"page-footer\"><span>KEEP MAKING. KEEP WONDERING.</span><button id=\"footer-top\">回到顶部 <span>↑</span></button></footer>\n </div><button class=\"back-top\" id=\"back-top\" aria-label=\"回到顶部\" hidden>↑</button> <dialog id=\"project-dialog\" aria-labelledby=\"project-title\"><div id=\"project-content\"></div><button id=\"close-dialog\" aria-label=\"关闭项目详情\">×</button></dialog>";
 const $=s=>root.querySelector(s),asset=p=>new URL(p,base).href,TAU=Math.PI*2;
 let active=false,savedY=0,currentProject=null,pendingProject=null,detailFrame=0,paintFrame=0;
 function publish(){window.__workStudy={ready:true,active,category:state.category,query:state.query,collection:state.collection,project:currentProject,results:filtered().length,savedY};}
 function requestProject(id){dispatchEvent(new CustomEvent('tangzy:work-project',{detail:{id}}));}
 const categoryNames={all:'全部',research:'资料',tools:'工具',design:'设计',experiment:'探索'};
 const projects=window.TangzyWorkProjects;
 const collections={questions:{name:'阅读与学习',ids:['folio','market','loci']},studio:{name:'代码与工具',ids:['btw','mewcode','algorithm']}};
 const state={category:'all',query:'',collection:null};
 const reduced=matchMedia('(prefers-reduced-motion:reduce)');
 function rng(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return(seed>>>0)/4294967296;};}
 function artwork(p){
  if(p.image)return '<img src="'+asset(p.image)+'" alt="" loading="lazy" class="project-image image-'+p.id+'">';
  if(p.art==='folio')return '<div class="brand-art folio-artwork"><img src="'+asset('assets/folio-icon.png')+'" alt=""><b>Folio</b><span>MD · HTML · ZIP</span></div>';
  if(p.art==='mewcode')return '<div class="brand-art mew-artwork"><span class="cat-mark">/&#92;_/&#92;<br>( o.o )<br>&gt; ^ &lt;</span><b>MewCode<span>_</span></b><small>LEARNING IN PUBLIC</small></div>';
  if(p.art==='loci')return '<div class="brand-art loci-artwork"><b>loci<span>_</span></b><span>READ · VERIFY · TRACE</span></div>';
  const random=rng(p.id.split('').reduce((n,c)=>n+c.charCodeAt(0),0)*117),c=p.color;
  let drawing='';
  if(p.art==='graph'){
   const points=Array.from({length:17},(_,i)=>({x:80+random()*440,y:50+random()*250}));
   for(let i=0;i<points.length;i++){const a=points[i];for(let j=i+1;j<points.length;j++){const b=points[j];if(Math.hypot(a.x-b.x,a.y-b.y)<145)drawing+=`<path d="M${a.x},${a.y} Q300,170 ${b.x},${b.y}" fill="none" stroke="${c}" stroke-width=".8" opacity=".2"/>`;}}
   drawing+=`<path d="${[1,5,9,13].map((i,n)=>(n?'L':'M')+points[i].x+','+points[i].y).join(' ')}" fill="none" stroke="${c}" stroke-width="2" opacity=".8"/>`;
   points.forEach((a,i)=>{drawing+=`<circle cx="${a.x}" cy="${a.y}" r="${i%4===1?5:2}" fill="${c}" opacity="${i%4===1?.95:.5}"/>`;if(i%4===1)drawing+=`<circle cx="${a.x}" cy="${a.y}" r="11" fill="none" stroke="${c}" opacity=".25"/>`;});
  }else if(p.art==='shell'){
   drawing=`<rect x="105" y="60" width="390" height="234" rx="5" fill="#181525" stroke="${c}" stroke-opacity=".55"/><path d="M105 93H495" stroke="${c}" opacity=".2"/><g fill="${c}" opacity=".55"><circle cx="122" cy="77" r="2"/><circle cx="133" cy="77" r="2"/><circle cx="144" cy="77" r="2"/></g><text x="130" y="135" fill="${c}" font-family="monospace" font-size="15">$ make a little room_</text>`;
   for(let row=0;row<5;row++){const width=80+random()*180;drawing+=`<rect x="130" y="${162+row*19}" width="${width}" height="3" fill="${c}" opacity="${.13+random()*.23}"/>`;}
   drawing+=`<path d="M130 272h11" stroke="${c}" stroke-width="2"/><rect x="151" y="264" width="6" height="12" fill="${c}" opacity=".85"/>`;
  }else if(p.art==='ribbon'){
   for(let i=0;i<34;i++){const a=i/33,offset=a*102;drawing+=`<path d="M${125+offset*.28} ${64+offset} C ${490-offset} ${20+offset*.7},${140+offset} ${350-offset},${475-offset*.27} ${285-offset*.9}" fill="none" stroke="${c}" stroke-width="${i%6===0?1.3:.55}" opacity="${.19+.5*Math.sin(a*Math.PI)}"/>`;}
   drawing+=`<path d="M75 175H525M300 35V315" stroke="${c}" stroke-width=".5" stroke-dasharray="2 12" opacity=".18"/>`;
  }else if(p.art==='pixel'){
   const pattern=['0011001100','0111111110','1111111111','1111111111','0111111110','0011111100','0001111000','0000110000'];
   pattern.forEach((row,y)=>row.split('').forEach((v,x)=>{if(v==='1')drawing+=`<rect x="${175+x*25}" y="${67+y*25}" width="19" height="19" fill="${c}" opacity="${.3+(.5*(1-y/9))+random()*.2}"/>`;}));
   drawing+=`<path d="M130 45h-15v15M470 290h15v-15" fill="none" stroke="${c}" opacity=".4"/>`;
  }else if(p.art==='world'){
   const point=(x,y,z)=>[300+(x-z)*30,190+(x+z)*13-y*27];
   for(let i=-4;i<=4;i++){drawing+=`<path d="M${point(i,0,-4)}L${point(i,0,4)}M${point(-4,0,i)}L${point(4,0,i)}" fill="none" stroke="${c}" opacity=".22"/>`;}
   for(const [x,z,h]of[[-2,-1,2],[0,0,4],[2,-2,1.6],[-2,2,1.2],[2,1,2.6]]){const a=point(x,0,z),b=point(x+1,0,z),d=point(x,0,z+1),e=point(x,h,z),f=point(x+1,h,z),g=point(x+1,h,z+1),k=point(x,h,z+1);drawing+=`<path d="M${a}L${b}L${f}L${g}L${k}L${d}Z M${e}L${f} M${e}L${k} M${a}L${e} M${e}L${f}L${g}L${k}Z" fill="${c}" fill-opacity=".04" stroke="${c}" stroke-opacity=".7"/>`;}
  }else{
   for(let i=0;i<32;i++){let d='';for(let j=0;j<=90;j++){const x=70+j/90*460,y=50+i*8+Math.sin(j*.07+i*.09)*23+Math.sin(j*.13-i*.15)*14;d+=(j?'L':'M')+x.toFixed(1)+','+y.toFixed(1);}drawing+=`<path d="${d}" fill="none" stroke="${c}" stroke-width="${i%7===0?1.3:.6}" opacity="${i%7===0?.85:.35}"/>`;}
  }
  return `<svg viewBox="0 0 600 350" aria-hidden="true"><defs><radialGradient id="g-${p.id}"><stop stop-color="${c}" stop-opacity=".06"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient></defs><ellipse cx="300" cy="175" rx="260" ry="165" fill="url(#g-${p.id})"/>${drawing}</svg>`;
 }
 function filtered(){return projects.filter(p=>(!state.collection||collections[state.collection].ids.includes(p.id))&&(state.category==='all'||p.category===state.category)&&`${p.title} ${p.cn} ${p.description} ${p.status} ${categoryNames[p.category]}`.toLowerCase().includes(state.query.toLowerCase().trim()));}
 function syncURL(){publish();}
 function renderResults(){
  const rows=filtered();$('#result-count').textContent=String(rows.length).padStart(2,'0');$('#results-status').textContent=`当前显示 ${rows.length} 项作品`;
  root.querySelectorAll('[data-category]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.category===state.category)));
  $('#collection-filter').hidden=!state.collection;if(state.collection)$('#collection-filter span').textContent=`精选系列 / ${collections[state.collection].name}`;
  $('#clear-search').hidden=!state.query;
  $('#work-list').innerHTML=rows.length?rows.map(p=>`<button class="work-row" data-open="${p.id}" style="--accent:${p.color}" aria-label="查看 ${p.title}，${categoryNames[p.category]}，${p.year} 年，${p.status}"><span class="row-number">${String(projects.indexOf(p)+1).padStart(2,'0')}</span><span class="row-image">${artwork(p)}</span><span class="row-copy"><strong>${p.title}</strong><span>${p.description}</span><small class="row-state">${p.status}</small><span class="row-mobile-meta">${categoryNames[p.category]} / ${p.year}</span></span><span class="row-category">${categoryNames[p.category]}</span><span class="row-year">${p.year}</span><span class="row-arrow" aria-hidden="true">↗</span></button>`).join(''):`<div class="empty-state"><p>没有找到符合条件的作品。</p><button data-reset>清除筛选，查看全部作品</button></div>`;
  $('#visual-notes').hidden=!!(state.collection||state.category!=='all'||state.query.trim());
  syncURL();
 }
 $('#notes-grid').innerHTML=['folio','btw','roxy'].map(id=>{const p=projects.find(p=>p.id===id);return `<button class="visual-note" data-open="${p.id}" aria-label="查看 ${p.title}"><div class="note-art">${artwork(p)}</div><span class="note-caption"><strong>${p.title}</strong><span>${p.status}</span></span></button>`;}).join('');
 function clearFilters(){state.category='all';state.collection=null;state.query='';$('#search').value='';renderResults();}
 root.addEventListener('click',e=>{
  const button=e.target.closest('button');if(!button)return;
  if(button.dataset.category){state.category=button.dataset.category;renderResults();}
  if(button.dataset.collection){state.collection=button.dataset.collection;state.category='all';state.query='';$('#search').value='';renderResults();$('#catalogue').scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'start'});}
  if(button.dataset.open)requestProject(button.dataset.open);
  if(button.hasAttribute('data-reset'))clearFilters();
 });
 $('#collection-filter button').addEventListener('click',()=>{state.collection=null;renderResults();});
 $('#search').value=state.query;$('#search').addEventListener('input',e=>{state.query=e.target.value;renderResults();});
 $('#clear-search').addEventListener('click',()=>{state.query='';$('#search').value='';renderResults();$('#search').focus();});
 $('#work-list').addEventListener('pointermove',e=>{const row=e.target.closest('.work-row');if(row){const r=row.getBoundingClientRect();row.style.setProperty('--mx',`${(e.clientX-r.left)/r.width*100}%`);}});
 let returnFocus=null;
 function openProject(id){
  const p=projects.find(p=>p.id===id);if(!p)return;if(currentProject===id&&$('#project-dialog').open)return;returnFocus=root.activeElement||host;currentProject=id;
  window.scrollTo({top:scrollY,behavior:'instant'});
  $('#project-content').innerHTML=`<header class="project-header"><p>${categoryNames[p.category]} / ${p.year} · ${p.status}</p><h2 id="project-title">${p.title}</h2><p class="project-description">${p.description}</p></header><figure class="project-figure"><div class="project-picture">${artwork(p)}</div><figcaption>${p.imageCaption||'为本次展示制作的概念封面'}</figcaption></figure><div class="project-body"><section><h3>关于项目</h3><p>${p.about}</p></section><section><h3>值得展开的部分</h3><p>${p.focus}</p></section></div><ul class="feature-tags">${p.features.map(f=>'<li>'+f+'</li>').join('')}</ul><div class="project-links">${p.links.map(([label,url])=>'<a href="'+url+'" target="_blank" rel="noopener noreferrer">'+label+' <span aria-hidden="true">↗</span></a>').join('')}</div><p class="project-disclaimer">${p.note}</p>`;
  if(!$('#project-dialog').open)$('#project-dialog').showModal();document.body.style.overflow='hidden';publish();$('#close-dialog').focus({preventScroll:true});$('#project-dialog').scrollTop=0;
 }
 function closeProject(){requestProject(null);}
 function dismissDetail(){pendingProject=null;cancelAnimationFrame(detailFrame);detailFrame=0;currentProject=null;if($('#project-dialog').open)$('#project-dialog').close();publish();}
 $('#close-dialog').addEventListener('click',closeProject);
 $('#project-dialog').addEventListener('close',()=>{document.body.style.overflow='';if(active&&returnFocus?.isConnected)returnFocus.focus({preventScroll:true});});
 $('#project-dialog').addEventListener('cancel',e=>{e.preventDefault();closeProject();});
 $('#project-dialog').addEventListener('click',e=>{if(e.target===$('#project-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeProject();}});
 function top(){window.scrollTo({top:0,behavior:reduced.matches?'instant':'smooth'});}
 $('#back-top').addEventListener('click',top);$('#footer-top').addEventListener('click',top);
 window.addEventListener('scroll',()=>{if(active){$('#back-top').hidden=scrollY<650;savedY=scrollY;}},{passive:true});
 const sky=$('#sky');let skyContext,skyState,w,h,drawn=false,last=0;let mx=0,my=0;
 function resize(){w=innerWidth;h=innerHeight;const d=Math.min(devicePixelRatio,1.5);sky.width=Math.round(w*d);sky.height=Math.round(h*d);skyContext=sky.getContext('2d');skyContext.setTransform(d,0,0,d,0,0);skyState=window.TangzyPixelSky.create(w,h);drawn=false;}
 window.addEventListener('resize',()=>{if(active)resize();});window.addEventListener('pointermove',e=>{mx=(e.clientX/innerWidth-.5)*.24;my=(e.clientY/innerHeight-.5)*.24;},{passive:true});
 reduced.addEventListener('change',()=>{drawn=false;});
 function frame(now){paintFrame=0;if(!active)return;paintFrame=requestAnimationFrame(frame);if(document.hidden||now-last<40||(reduced.matches&&drawn))return;last=now;skyState.draw(skyContext,{mx:reduced.matches?0:mx,my:reduced.matches?0:my,time:now/1000,reduced:reduced.matches,reveal:1});drawn=true;}
 function queueDetail(id){
  pendingProject=id;cancelAnimationFrame(detailFrame);
  const reveal=()=>{detailFrame=0;if(!active||pendingProject!==id)return;if(window.TangzyTransitions?.busy){detailFrame=requestAnimationFrame(reveal);return;}openProject(id);};
  reveal();
 }
 window.TangzyWork={
  show(id,{focus=false}={}){
   const entering=!active;active=true;
   if(entering){resize();paintFrame=requestAnimationFrame(frame);window.scrollTo({top:savedY,behavior:'instant'});requestAnimationFrame(()=>{if(active)window.scrollTo({top:savedY,behavior:'instant'});});}
   const valid=projects.some(p=>p.id===id)?id:null;
   if(valid)queueDetail(valid);else dismissDetail();
   if(focus&&!valid)host.focus({preventScroll:true});publish();
  },
  hide(){if(!active)return;savedY=scrollY;active=false;cancelAnimationFrame(paintFrame);paintFrame=0;dismissDetail();},
  closeDetail:closeProject,
  get isDetailOpen(){return $('#project-dialog').open||!!pendingProject;},
  get isEditing(){return !!root.activeElement?.matches('input,textarea,[contenteditable="true"]');}
 };
 renderResults();
})();
