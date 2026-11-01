/* Gesture controller for the original Three.js CRT camera study. */
(() => {
  'use strict';
  // Throwaway motion study; the ordinary route keeps its CRT implementation.
  if (new URLSearchParams(location.search).get('prototype') === 'signal') {
    const prototype = document.createElement('script');
    prototype.src = new URL('./signal-prototype/controller.js', document.currentScript.src).href;
    document.head.append(prototype);
    return;
  }
  const root = document.getElementById('contact-view');
  const dial = root.querySelector('#ct-dial');
  const panel = root.querySelector('#ct-tuning');
  const menu = root.querySelector('#ct-tune-menu');
  const status = root.querySelector('#ct-tune-status');
  const percent = root.querySelector('#ct-tune-percent');
  const hint = root.querySelector('#ct-dial-hint');
  const HOLD_MS = 1200, BURST_MS = 1800, BURST_COUNT = 5;
  const stage = root.querySelector('#ct-tune-stage');
  const fallback = root.querySelector('#ct-tune-fallback');
  const sceneURL = new URL('./crt-scene.js', document.currentScript.src).href;
  let engine = null, enginePromise = null, runSerial = 0;
  let holdTimer = 0, holding = false, origin = null, suppressClick = false;
  let taps = [], playing = false;

  function cancelRun() { runSerial++; engine?.stop(); }
  function cancelHold() {
    clearTimeout(holdTimer); holdTimer = 0; holding = false; origin = null;
    root.dataset.dialHolding = 'false';
  }
  function phase(name, text, value) {
    panel.dataset.phase = name; status.textContent = text; percent.textContent = value + '%';
    panel.style.setProperty('--tune-progress', value + '%');
    menu.hidden = name !== 'ready';
    if (name === 'ready') root.querySelector('#ct-announcement').textContent = '隐藏频段已打开。可以选择写信、扫码或 Terminal 频道，或按 Esc 返回。';
  }
  function getEngine() {
    if (!enginePromise) enginePromise = import(sceneURL).then(({ createCrtScene }) => {
      engine = createCrtScene(stage, {
        onSelect: key => window.TangzyContact.select(key, { focus: true }),
        onComplete: () => { if (playing) phase('ready', '', 100); },
      });
      panel.dataset.engine = 'webgl';
      return engine;
    }).catch(error => { enginePromise = null; throw error; });
    return enginePromise;
  }
  async function play() {
    if (root.hidden || document.hidden) return;
    cancelHold(); cancelRun();
    const request = runSerial;
    taps = []; playing = true; hint.hidden = true; fallback.hidden = true;
    window.TangzyContact.screen('tuning');
    root.querySelector('#ct-announcement').textContent = '发现隐藏频段，开始调频。';
    panel.focus({ preventScroll: true });
    phase('loading', '正在载入调频片段…', 0);
    try {
      const scene = await getEngine();
      if (!playing || request !== runSerial) return;
      phase('playing', '调频中', 0);
      scene.play({ quiet: root.dataset.quiet === 'true' });
    } catch {
      if (!playing || request !== runSerial) return;
      panel.dataset.engine = 'fallback'; fallback.hidden = false;
      phase('ready', '', 100);
    }
  }
  function leave() {
    if (!playing) return;
    cancelHold(); cancelRun(); playing = false; taps = [];
    panel.dataset.phase = 'idle'; menu.hidden = true; hint.hidden = false;
  }
  function beginHold(point) {
    if (holding) return;
    holding = true; origin = point; root.dataset.dialHolding = 'true';
    holdTimer = setTimeout(() => {
      if (!holding) return;
      suppressClick = true;
      play();
    }, HOLD_MS);
  }
  dial.addEventListener('pointerdown', event => {
    if (event.button !== 0 || !event.isPrimary) return;
    suppressClick = false;
    dial.setPointerCapture(event.pointerId);
    beginHold({ x: event.clientX, y: event.clientY });
  });
  dial.addEventListener('pointermove', event => {
    if (origin && Math.hypot(event.clientX - origin.x, event.clientY - origin.y) > 18) cancelHold();
  });
  dial.addEventListener('pointerup', cancelHold);
  dial.addEventListener('lostpointercapture', cancelHold);
  dial.addEventListener('pointercancel', () => { cancelHold(); suppressClick = false; taps = []; });
  dial.addEventListener('contextmenu', event => event.preventDefault());
  dial.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    if (event.shiftKey && event.key === 'Enter') { event.preventDefault(); play(); return; }
    if (event.repeat) { event.preventDefault(); return; }
    suppressClick = false;
    beginHold(null);
  });
  dial.addEventListener('keyup', event => { if (event.key === 'Enter' || event.key === ' ') cancelHold(); });
  dial.addEventListener('blur', cancelHold);
  // Capture runs before the ordinary channel-change handler. Four taps still tune;
  // the fifth opens the hidden band, and releasing a long press cannot tune again.
  dial.addEventListener('click', event => {
    if (suppressClick) { suppressClick = false; event.preventDefault(); event.stopImmediatePropagation(); return; }
    if (playing) { taps = []; return; }
    const now = performance.now();
    taps = taps.filter(time => now - time < BURST_MS); taps.push(now);
    if (taps.length >= BURST_COUNT) { event.preventDefault(); event.stopImmediatePropagation(); play(); }
  }, true);
  root.addEventListener('click', event => { if (!dial.contains(event.target)) taps = []; });
  for (const button of menu.querySelectorAll('[data-tune-channel]')) {
    button.addEventListener('click', () => window.TangzyContact.select(button.dataset.tuneChannel, { focus: true }));
  }
  root.querySelector('#ct-tune-replay').addEventListener('click', play);
  new MutationObserver(() => { if (playing && root.dataset.quiet === 'true') engine?.finish(); }).observe(root, { attributes: true, attributeFilter: ['data-quiet'] });
  document.addEventListener('visibilitychange', () => { cancelHold(); taps = []; if (document.hidden && playing) window.TangzyContact.screen('channel'); });
  window.TangzyTuning = { leave, cancelHold };
})();
