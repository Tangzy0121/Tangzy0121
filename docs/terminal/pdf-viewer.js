// In-terminal PDF gallery (CV + papers): PDF.js pages + thumbnails, styled with the shell's CSS variables.
// window.__openPDF({ url, title, label, pending }) · window.__openCV() · window.__openPaper(index)
(() => {
  const PDFJS = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs';
  const WORKER = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';
  // Only real, public files. A paper without `url` shows an honest "not public yet" panel.
  const PAPERS = [
    { id: 'asimov-cascade', title: 'Asimov Cascade Monitoring in Humanoid Robotics: An Evidence-Gated Technology Management Framework with Quantification', venue: 'ICRA 2027 · Under Review',
      url: 'https://tangzy0121.github.io/papers/asimov-cascade-anon.pdf' /* anonymized review copy only */ },
  ];
  const CV = { url: 'https://tangzy0121.github.io/cv.pdf', title: '~/cv.pdf', label: 'Curriculum vitae viewer',
    pending: '<div><span class="w">cv.pdf</span> is not published yet.</div><div class="m">Meanwhile: try <b>bio</b>, <b>projects</b>, <b>awards</b> or <b>contact</b>.</div>' };
  const css = `
#cvv{position:fixed;inset:0;z-index:9999;background:color-mix(in srgb,var(--page-bg) 80%,transparent);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;font-family:'Maple Mono','JetBrains Mono',ui-monospace,monospace;color:var(--text)}
#cvv .win{outline:none;width:calc(100vw - 16px);height:calc(100vh - 16px);background:var(--term-bg);border:1px solid var(--border);border-radius:10px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.25)}
#cvv .bar{display:flex;align-items:center;gap:12px;padding:8px 14px;border-bottom:1px solid var(--border);font-size:14px;flex-wrap:wrap}
#cvv .bar .t{color:var(--path);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:50vw} #cvv .pg{white-space:nowrap} #cvv .bar .sp{flex:1}
#cvv button,#cvv a.b{font:inherit;font-size:13px;color:var(--link);background:none;border:1px solid var(--border);border-radius:6px;padding:4px 10px;cursor:pointer;text-decoration:none}
#cvv button:hover,#cvv a.b:hover,#cvv button:focus-visible{border-color:var(--link);outline:none}
#cvv .body{flex:1;display:flex;min-height:0}
#cvv .thumbs{width:176px;flex-shrink:0;overflow-y:auto;border-right:1px solid var(--border);padding:12px;display:flex;flex-direction:column;gap:12px}
#cvv .thumbs canvas{width:100%;border:1px solid var(--border);border-radius:4px;cursor:pointer;background:#fff}
#cvv .thumbs canvas.on{border-color:var(--link);box-shadow:0 0 0 2px var(--link)}
#cvv .stage{flex:1;overflow:auto;display:flex;justify-content:center;align-items:flex-start;padding:20px}
#cvv .stage canvas{background:#fff;border-radius:4px;box-shadow:0 4px 18px rgba(0,0,0,.18)}
#cvv .msg{margin:auto;text-align:left;font-size:15px;line-height:1.8;max-width:640px;padding:20px}
#cvv .msg .w{color:var(--warning)} #cvv .msg .m{color:var(--muted)} #cvv .msg .h{color:var(--text);font-weight:600}
#cvv .hint{color:var(--faint);font-size:12px}
#cvv .main{flex:1;min-width:0;display:flex;flex-direction:column;position:relative}
#cvv .flip{position:absolute;top:50%;transform:translateY(-50%);z-index:2;width:48px;height:96px;font-size:30px;line-height:1;border-radius:10px;background:color-mix(in srgb,var(--term-bg) 85%,transparent);box-shadow:0 2px 10px rgba(0,0,0,.12)}
#cvv .flip.l{left:12px} #cvv .flip.r{right:22px}
#cvv button:disabled{opacity:.3;cursor:default;border-color:var(--border)}
#cvv .nav{display:flex;align-items:center;justify-content:center;gap:14px;padding:8px;border-top:1px solid var(--border);font-size:14px}
#cvv .nav button{padding:5px 16px;font-size:14px}
@media (max-width:640px){#cvv .thumbs{display:none}#cvv .win{width:100vw;height:100vh;height:100dvh;border-radius:0;border:0}#cvv .hint,#cvv [data-a=in],#cvv [data-a=out]{display:none}#cvv .bar{gap:8px;padding:8px}#cvv .stage{padding:8px}#cvv button,#cvv a.b{padding:8px 12px}#cvv .flip{width:36px;height:72px;font-size:24px}#cvv .flip.l{left:4px}#cvv .flip.r{right:4px}}`;
  const readerCSS = "\n#cvv{--text:#fff0fa;--link:#ffd2ec;--border:#9b80a2;--path:#d9bdd9;background:#3e3248;color:var(--text);backdrop-filter:none}\n#cvv .win{width:100%;height:100%;border:0;border-radius:0;box-shadow:none;background:#44374e}\n#cvv .bar{flex-wrap:nowrap;gap:9px;min-height:60px;padding:10px 18px;background:#51425c}\n#cvv .bar .t{max-width:40%;font-size:14px}.dark #cvv .bar .t{color:#ffe1f3}\n#cvv .bar .zm{display:inline;color:#eddef2;font-size:12px;min-width:36px;text-align:center}\n#cvv .bar button,#cvv .bar a.b{flex:none;border-radius:3px;font-size:13px;padding:7px 11px;min-height:34px}\n#cvv .bar [data-a=close]{margin-left:5px;color:#f1d9e9}\n#cvv .thumbs{width:126px;background:#493b54;padding:14px}\n#cvv .main{background:#3e3348}\n#cvv .stage{display:block;padding:16px;scrollbar-gutter:stable;overscroll-behavior:contain}\n#cvv .stage canvas{display:block;max-width:none;margin:0 auto;border-radius:1px;box-shadow:0 8px 30px #0005}\n#cvv .flip{display:none}\n#cvv .nav{flex:none;min-height:48px;background:#493b54}\n#cvv.single-page .thumbs,#cvv.single-page .nav{display:none}\n@media(max-width:640px){#cvv .bar{padding:9px;gap:5px}#cvv .bar{flex-wrap:wrap}#cvv .bar .t{max-width:none;font-size:12px;flex:1}#cvv .bar .sp{flex:0 0 100%;height:0}#cvv .bar .pg{font-size:12px}#cvv .bar [data-a=in],#cvv .bar [data-a=out]{display:block}#cvv .bar .zm{display:inline}#cvv .bar button,#cvv .bar a.b{padding:6px 8px}#cvv .stage{padding:12px}}\n";
  const report = open => { document.getElementById("root").inert = open; parent.postMessage({type:'tangzy:shell',action:'document',open},location.origin); };
  let renderSeq=0;
  let lib, doc, cur, page = 1, zoom = 1, root, renderTask;
  const docs = new Map();
  const $ = (s) => root.querySelector(s);
  function close(){ ++renderSeq; renderTask?.cancel?.(); report(false); root?.remove(); root=null; doc=null; document.removeEventListener('keydown', onKey, true); document.querySelector('textarea,input')?.focus(); }
  function onKey(e){ if(!root) return; if(e.key==='Tab'){const items=[...root.querySelectorAll('button:not(:disabled),a[href],canvas[tabindex]')].filter(el=>el.getClientRects().length);const i=items.indexOf(document.activeElement);if(e.shiftKey&&i<=0){e.preventDefault();items.at(-1)?.focus();}else if(!e.shiftKey&&(i<0||i===items.length-1)){e.preventDefault();items[0]?.focus();}return;} if(e.key==='Escape'||e.key==='q') close(); else if(['ArrowRight','j','PageDown'].includes(e.key)) go(page+1); else if(['ArrowLeft','k','PageUp'].includes(e.key)) go(page-1); else if(e.key==='+'||e.key==='=') setZoom(zoom*1.15); else if(e.key==='-') setZoom(zoom/1.15); else return; e.preventDefault(); e.stopPropagation(); }
  function setZoom(z){ zoom=Math.min(2.5,Math.max(.5,z)); $('.zm')&&($('.zm').textContent=Math.round(zoom*100)+'%'); go(page); }
  async function draw(p, canvas, width){ const pg=await doc.getPage(p); const v1=pg.getViewport({scale:1}); const dpr=window.devicePixelRatio||1; const v=pg.getViewport({scale:width/v1.width*dpr}); canvas.width=v.width; canvas.height=v.height; canvas.style.width=(v.width/dpr)+'px'; return pg.render({canvasContext:canvas.getContext('2d'),viewport:v}); }
  /** Fit the page to the stage: full width (capped for readability), zoom multiplies. */
  // Comfortable reading width (~A4 at 100–110%), not edge-to-edge; zoom steps are ×1.15.
  const MAX_W = 880;
  function fitWidth(){ const st=$('.stage'); return Math.max(120, Math.min(st.clientWidth-50, MAX_W)) * zoom; }
  async function go(p){ if(!doc||!root)return;const seq=++renderSeq;page=Math.min(doc.numPages,Math.max(1,p));$('.pg').textContent=page+' / '+doc.numPages;$('.pg2').textContent=page+' / '+doc.numPages;root.querySelectorAll('[data-a=prev]').forEach(b=>b.disabled=page<=1);root.querySelectorAll('[data-a=next]').forEach(b=>b.disabled=page>=doc.numPages);root.classList.toggle('single-page',doc.numPages===1);$('.stage').scrollTop=0;root.querySelectorAll('.thumbs canvas').forEach((c,i)=>c.classList.toggle('on',i+1===page));renderTask?.cancel?.();try{const task=await draw(page,$('.stage canvas'),fitWidth());if(!root||seq!==renderSeq){task.cancel();return;}renderTask=task;await task.promise;}catch{} }
  function shell(o){ root=document.createElement('div'); root.id='cvv'; root.setAttribute('role','dialog'); root.setAttribute('aria-modal','true'); root.setAttribute('aria-label',o.label);
    root.innerHTML=`<div class="win"><div class="bar"><span class="t" title="${o.title}">${o.title}</span><span class="pg" aria-live="polite"></span><span class="sp"></span><button data-a="out" aria-label="Zoom out">−</button><span class="zm hint">100%</span><button data-a="in" aria-label="Zoom in">+</button><button data-a="fit" aria-label="Fit page width">适宽</button><a class="b" href="${o.url||'#'}" download>下载</a><button data-a="close" aria-label="Close viewer">✕</button></div><div class="body"><nav class="thumbs" aria-label="Pages"></nav><div class="main"><button class="flip l" data-a="prev" aria-label="Previous page" title="Previous page (←)">‹</button><div class="stage"><canvas aria-label="PDF page"></canvas></div><button class="flip r" data-a="next" aria-label="Next page" title="Next page (→)">›</button><div class="nav"><button data-a="prev">‹ Prev</button><span class="pg2"></span><button data-a="next">Next ›</button></div></div></div></div>`;
    root.addEventListener('click',e=>{ if(e.target===root) return close(); const a=e.target.closest('[data-a]')?.dataset.a; ({prev:()=>go(page-1),next:()=>go(page+1),in:()=>setZoom(zoom*1.15),out:()=>setZoom(zoom/1.15),fit:()=>setZoom(1),close})[a]?.(); });
    document.body.appendChild(root); report(true); document.addEventListener('keydown',onKey,true); const win=$('.win'); win.tabIndex=-1; setTimeout(()=>win.focus({preventScroll:true}),0); }
  function pending(html){ $('.body').innerHTML=`<div class="msg">${html}</div>`; root.querySelectorAll('.bar button:not([data-a=close]),.bar a').forEach(b=>b.style.display='none'); }
  let resizeT; window.addEventListener('resize',()=>{ clearTimeout(resizeT); resizeT=setTimeout(()=>root&&doc&&go(page),150); });
  window.__openPDF = async (o) => { if(root) close(); if(!document.getElementById('cvv-css')){const s=document.createElement('style');s.id='cvv-css';s.textContent=css+readerCSS;document.head.appendChild(s);}
    cur=o; page=1; zoom=1; shell(o); $('.pg').textContent='loading…';
    try{ if(!o.url) throw 0; const head=await fetch(o.url,{method:'HEAD'}); if(!head.ok) throw 0; lib ||= await import(PDFJS); lib.GlobalWorkerOptions.workerSrc=WORKER;
      if(!docs.has(o.url)) docs.set(o.url, lib.getDocument(o.url).promise); doc=await docs.get(o.url); }
    catch{ docs.delete(o.url); if(root){ $('.pg').textContent=''; pending(o.pending); } return; }
    if(!root||cur!==o) return;
    const th=$('.thumbs'); for(let i=1;i<=doc.numPages;i++){ const c=document.createElement('canvas'); c.tabIndex=0; c.setAttribute('aria-label',`Page ${i}`); c.onclick=()=>go(i); c.onkeydown=e=>{if(e.key==='Enter')go(i)}; th.appendChild(c); draw(i,c,150).then(t=>t.promise).catch(()=>{}); }
    go(1); };
  window.__openCV = () => window.__openPDF(CV);
  window.__papers = PAPERS.map(({id,title,venue})=>({id,title,venue}));
  window.__openPaper = (i = 0) => { const p = PAPERS[i]; if(!p) return false;
    window.__openPDF({ url: p.url, title: `~/papers/${p.id}-anon.pdf — ${p.title}`, label: `Paper viewer: ${p.title}`,
      pending: `<div class="h">${p.title}</div><div class="m">${p.venue}</div><br><div><span class="w">${p.id}.pdf</span> is not public yet.</div><div class="m">The manuscript is under review; the PDF will appear here as a browsable gallery once it is released.</div><div class="m">Meanwhile: <b>scholar</b> · <b>projects</b> · <b>cat projects/asimov-cascade</b></div>` });
    return true; };
})();
