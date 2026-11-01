/* THROWAWAY: B's directed tears, followed by a secret character performance. */
(() => {
  'use strict';
  const base = document.currentScript.src;
  const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = new URL('./prototype.css', base); document.head.append(css);
  const root = document.getElementById('contact-view'), panel = root.querySelector('#ct-panel');
  const tuning = root.querySelector('#ct-tuning'), dial = root.querySelector('#ct-dial');
  const variant = 'B';
  let state = 'idle', frame = 0, serial = 0, downAt = 0, burstAt = 0, releaseAt = 0, releaseFrom = 0;
  let holding = false, committed = false, suppressClick = false, internal = false, auto = false;
  let charge = 0, field = null, fieldPromise = null, hijack = null, hijackPromise = null, downPoint = null, taps = [];
  const timing = () => ({ hold: 620, burst: 320, release: 160 });
  root.dataset.signalPrototype = 'true';
  root.querySelector('#ct-dial-hint')?.remove();
  dial.removeAttribute('aria-describedby'); dial.removeAttribute('aria-keyshortcuts');
  const layer = document.createElement('div'); layer.className = 'sg-layer'; layer.hidden = true;
  layer.innerHTML = '<div class="sg-field"></div>';
  panel.append(layer);
  const mount = layer.querySelector('.sg-field');
  tuning.replaceChildren(); tuning.setAttribute('aria-label', '信号彩蛋');
  tuning.classList.add('sg-tuning');
  function setState(next) { state = next; root.dataset.signalState = next; }
  function paintVariant() {
    root.dataset.signalVariant = variant; tuning.dataset.signalVariant = variant;
  }
  function writeURL() { const url = new URL(location.href); url.searchParams.set('variant', variant); history.replaceState(history.state, '', url); }
  function stop() {
    serial++; cancelAnimationFrame(frame); hijack?.stop(); holding = false; auto = false; committed = false; downPoint = null;
    layer.hidden = true; root.dataset.dialHolding = 'false'; root.style.setProperty('--sg-charge', 0);
    charge = 0; setState('idle');
  }
  function leave() { if (!internal) stop(); }
  window.TangzyTuning = { leave, cancelHold: stop };
  function restoreCover() { internal = true; window.TangzyContact.screen('channel'); internal = false; }
  function getHijack() {
    if (!hijackPromise) hijackPromise = import(new URL('./hijack.js', base)).then(module => { hijack = module.createHijack(tuning); return hijack; });
    return hijackPromise;
  }
  async function showSurprise() {
    cancelAnimationFrame(frame); holding = false; auto = false; committed = true; taps = [];
    root.dataset.signalDurationMs = String(Math.round(performance.now() - downAt));
    internal = true; window.TangzyContact.screen('tuning'); internal = false;
    layer.hidden = true; root.dataset.dialHolding = 'false'; root.style.setProperty('--sg-charge', 0);
    setState('hijack'); tuning.dataset.phase = 'playing';
    root.querySelector('#ct-frequency').textContent = 'TANGZY / ???';
    tuning.focus({ preventScroll: true });
    const request = serial, performanceScene = await getHijack();
    if (request !== serial || state !== 'hijack') return;
    root.querySelector('#ct-announcement').textContent = 'Hello Tangzy!';
    performanceScene.play({ quiet: root.dataset.quiet === 'true', onFinish() { stop(); restoreCover(); dial.focus({ preventScroll: true }); } });
  }
  function getField() {
    if (!fieldPromise) fieldPromise = import(new URL('./field.js', base)).then(module => { field = module.createSignalField(mount); root.dataset.signalEngine = 'webgl'; return field; });
    return fieldPromise;
  }
  function wrap(ctx, text, width) {
    const lines = []; let line = '';
    for (const letter of text) { if (line && ctx.measureText(line + letter).width > width) { lines.push(line); line = letter; } else line += letter; }
    if (line) lines.push(line); return lines;
  }
  async function captureCover() {
    const view = root.querySelector('#ct-channel-view'), bounds = view.getBoundingClientRect(), panelBounds = panel.getBoundingClientRect();
    const width = Math.max(1, bounds.width), height = Math.max(1, bounds.height);
    layer.style.left = bounds.left - panelBounds.left + 'px'; layer.style.top = bounds.top - panelBounds.top + 'px';
    layer.style.width = width + 'px'; layer.style.height = height + 'px';
    const canvas = document.createElement('canvas'), ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.ceil(width * ratio); canvas.height = Math.ceil(height * ratio);
    const ctx = canvas.getContext('2d'); ctx.scale(ratio, ratio);
    const accent = getComputedStyle(root).getPropertyValue('--ct-accent').trim() || '#ffa6d3';
    ctx.fillStyle = '#171224'; ctx.fillRect(0, 0, width, height);
    const gradient = ctx.createRadialGradient(width * .5, height * .28, 0, width * .5, height * .3, width * .65);
    gradient.addColorStop(0, accent + '18'); gradient.addColorStop(1, '#17122400'); ctx.fillStyle = gradient; ctx.fillRect(0, 0, width, height);
    function text(node, content = node.textContent, align) {
      const rect = node.getBoundingClientRect(), style = getComputedStyle(node);
      ctx.font = [style.fontStyle, style.fontWeight, style.fontSize, style.fontFamily].join(' ');
      ctx.fillStyle = style.color; ctx.textBaseline = 'middle'; ctx.textAlign = align || style.textAlign;
      const lines = wrap(ctx, content.trim(), rect.width), lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.3;
      const x = ctx.textAlign === 'center' ? rect.left - bounds.left + rect.width / 2 : rect.left - bounds.left;
      const offset = Math.max(0, (rect.height - lines.length * lineHeight) / 2);
      lines.forEach((line, i) => ctx.fillText(line, x, rect.top - bounds.top + offset + lineHeight * (i + .5)));
    }
    const art = root.querySelector('.ct-screen-art').getBoundingClientRect();
    ctx.save(); ctx.translate(width / 2, art.top - bounds.top + art.height / 2); ctx.rotate(-.35); ctx.strokeStyle = accent + '39'; ctx.lineWidth = .7; ctx.beginPath(); ctx.ellipse(0, 0, width * .34, Math.max(18, art.height * .42), 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    const svg = root.querySelector('#ct-symbol'), svgRect = svg.getBoundingClientRect();
    const clone = svg.cloneNode(true); clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg'); clone.setAttribute('stroke', accent); clone.style.color = accent; clone.removeAttribute('id');
    const image = new Image(); const blobURL = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' }));
    await new Promise(resolve => { image.onload = resolve; image.onerror = resolve; image.src = blobURL; });
    if (image.naturalWidth) { ctx.shadowColor = accent + '55'; ctx.shadowBlur = 12; ctx.drawImage(image, svgRect.left - bounds.left, svgRect.top - bounds.top, svgRect.width, svgRect.height); ctx.shadowBlur = 0; }
    URL.revokeObjectURL(blobURL);
    text(root.querySelector('#ct-channel-title')); text(root.querySelector('#ct-channel-note'));
    const footer = root.querySelector('.ct-screen-footer').getBoundingClientRect();
    ctx.strokeStyle = accent + '35'; ctx.beginPath(); ctx.moveTo(0, footer.top - bounds.top); ctx.lineTo(width, footer.top - bounds.top); ctx.stroke();
    text(root.querySelector('#ct-account'), undefined, 'left');
    const wave = root.querySelector('.ct-wave').getBoundingClientRect(); ctx.fillStyle = accent + '88';
    for (let i = 0; i < 17; i++) { const h = 3 + (i * 7 % 12); ctx.fillRect(wave.left - bounds.left + i * wave.width / 17, wave.top - bounds.top + (wave.height - h) / 2, 1, h); }
    for (const button of [root.querySelector('#ct-open'), root.querySelector('#ct-copy')]) {
      const rect = button.getBoundingClientRect(), style = getComputedStyle(button), x = rect.left - bounds.left, y = rect.top - bounds.top;
      ctx.fillStyle = style.backgroundColor; ctx.strokeStyle = style.borderColor; ctx.lineWidth = 1; ctx.beginPath(); ctx.roundRect(x, y, rect.width, rect.height, 6); ctx.fill(); ctx.stroke();
      if (button.id === 'ct-open') { ctx.font = style.font; ctx.fillStyle = style.color; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(button.textContent.replace('↗', '').trim(), x + 14, y + rect.height / 2); ctx.fillStyle = accent; ctx.textAlign = 'right'; ctx.fillText('↗', x + rect.width - 14, y + rect.height / 2); }
      else { ctx.strokeStyle = style.color; ctx.strokeRect(x + 19, y + 18, 12, 14); ctx.beginPath(); ctx.moveTo(x + 24, y + 14); ctx.lineTo(x + 14, y + 14); ctx.lineTo(x + 14, y + 27); ctx.stroke(); }
    }
    return { canvas, width, height };
  }
  function tick(now) {
    if (state === 'idle' || state === 'hijack') return;
    if (state === 'charging') {
      charge = Math.max(0, Math.min(1, (now - downAt) / timing().hold));
      if (!holding && !auto) return;
      if (charge >= 1) { committed = true; suppressClick = true; if (root.dataset.quiet === 'true') { showSurprise(); return; } burstAt = now; setState('burst'); }
    } else if (state === 'releasing') {
      const t = Math.min(1, (now - releaseAt) / timing().release); charge = releaseFrom * (1 - t * t * (3 - 2 * t));
      if (t >= 1) { stop(); return; }
    }
    const burst = state === 'burst' ? Math.min(1, (now - burstAt) / timing().burst) : 0;
    if (burst >= 1) { showSurprise(); return; }
    layer.hidden = !field || root.dataset.quiet === 'true' || (charge < .08 && state === 'charging');
    if (field && root.dataset.quiet !== 'true') field.draw({ charge, burst, time: now / 1000, variant: 1 });
    const level = Math.round(charge * 100);
    root.dataset.signalLevel = String(Math.floor(level / 10) * 10); root.style.setProperty('--sg-charge', charge);
    frame = requestAnimationFrame(tick);
  }
  async function begin({ demo = false, point = null } = {}) {
    stop(); const request = serial;
    holding = !demo; auto = demo; committed = false; suppressClick = false; downPoint = point;
    restoreCover(); paintVariant();
    setState('charging'); root.dataset.dialHolding = 'true'; downAt = performance.now();
    if (root.dataset.quiet === 'true') { if (demo) showSurprise(); else frame = requestAnimationFrame(tick); return; }
    try {
      getHijack();
      const [renderer, source] = await Promise.all([getField(), captureCover()]);
      if (request !== serial || state !== 'charging' || (!holding && !auto)) return;
      renderer.source(source.canvas, source.width, source.height);
      root.dataset.signalCaptureMs = String(Math.round(performance.now() - downAt));
      frame = requestAnimationFrame(tick);
    } catch (error) { root.dataset.signalEngine = 'fallback'; console.warn('Signal prototype unavailable:', error); if (request === serial && (holding || auto)) showSurprise(); }
  }
  function release(cancel = false) {
    if (!holding) return;
    holding = false; downPoint = null; root.dataset.dialHolding = 'false';
    if (committed || state === 'burst' || state === 'hijack') return;
    const duration = performance.now() - downAt;
    if (cancel || duration > 220) {
      suppressClick = true; releaseFrom = charge; releaseAt = performance.now(); setState('releasing');
      cancelAnimationFrame(frame); frame = requestAnimationFrame(tick);
    } else stop();
  }
  root.addEventListener('pointerdown', event => {
    if (!dial.contains(event.target) || event.button !== 0 || !event.isPrimary) return;
    if (state === 'hijack' || state === 'burst' || (state === 'charging' && auto)) { suppressClick = true; event.preventDefault(); event.stopImmediatePropagation(); return; }
    event.stopImmediatePropagation(); dial.setPointerCapture(event.pointerId);
    begin({ point: { x: event.clientX, y: event.clientY } });
  }, true);
  root.addEventListener('pointermove', event => { if (holding && downPoint && Math.hypot(event.clientX - downPoint.x, event.clientY - downPoint.y) > 22) release(true); }, true);
  root.addEventListener('pointerup', event => { if (dial.contains(event.target)) release(); }, true);
  root.addEventListener('pointercancel', () => release(true), true);
  root.addEventListener('contextmenu', event => { if (dial.contains(event.target)) event.preventDefault(); });
  root.addEventListener('click', event => {
    if (!dial.contains(event.target)) { taps = []; return; }
    if (suppressClick || committed || state === 'releasing') { suppressClick = false; event.preventDefault(); event.stopImmediatePropagation(); return; }
    const now = performance.now(); taps = taps.filter(time => now - time < 1800); taps.push(now);
    if (taps.length >= 5) { event.preventDefault(); event.stopImmediatePropagation(); taps = []; begin({ demo: true }); }
  }, true);
  root.addEventListener('keydown', event => {
    const editable = event.target.closest('input,textarea,[contenteditable=true]');
    if (editable) return;
    if (event.key === 'Escape' && state !== 'idle') { event.preventDefault(); event.stopPropagation(); stop(); restoreCover(); dial.focus({ preventScroll: true }); return; }
    if (!dial.contains(event.target) || !['Enter', ' '].includes(event.key)) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (event.repeat) return;
    if (event.shiftKey && event.key === 'Enter') begin({ demo: true }); else begin();
  }, true);
  root.addEventListener('keyup', event => { if (dial.contains(event.target) && ['Enter', ' '].includes(event.key)) { event.preventDefault(); const quick = holding && !committed && performance.now() - downAt <= 220; release(); if (quick) dial.click(); } }, true);
  new MutationObserver(() => { if (root.dataset.quiet === 'true' && ['charging', 'burst', 'hijack'].includes(state)) showSurprise(); }).observe(root, { attributes: true, attributeFilter: ['data-quiet'] });
  document.addEventListener('visibilitychange', () => { if (document.hidden && state !== 'idle') { stop(); restoreCover(); } });
  window.addEventListener('resize', () => { if (['charging', 'burst', 'releasing'].includes(state)) { stop(); restoreCover(); } });
  // Email owns delivery and its explicit localhost-only motion preview.
  paintVariant(); setState('idle'); writeURL();
})();
