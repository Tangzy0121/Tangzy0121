// THROWAWAY: approved AI pixel-art body + deterministic LED sprite cells.
export function createHijack(stage) {
  const asset = new URL('./assets/pixel-mask-unlit-v1.png', import.meta.url).href;
  const cells = (name, right) => {
    const result = new Set();
    for (let y = 0; y < 13; y++) for (let x = 0; x < 13; x++) {
      const blink = name === 'blink' || (name === 'wink' && right);
      const lit = blink ? Math.abs(y - 6) <= 1 : name === 'cross' ? Math.abs(x - y) <= 1 || Math.abs(x + y - 12) <= 1 : Math.abs(y - (Math.abs(x - 6) * .8 + 3)) <= 1.1;
      if (lit) result.add(x + ',' + y);
    }
    return result;
  };
  function eyeSprite(name, right) {
    const pixels = cells(name, right), halo = new Set(), left = right ? 769 : 299, top = 316, step = 14;
    for (const cell of pixels) {
      const [x, y] = cell.split(',').map(Number);
      for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1]]) if (!pixels.has((x + dx) + ',' + (y + dy))) halo.add((x + dx) + ',' + (y + dy));
    }
    const rect = (cell, haloOnly) => {
      const [x, y] = cell.split(',').map(Number), px = left + x * step, py = top + y * step;
      return haloOnly ? `<rect x="${px}" y="${py}" width="13" height="13" fill="#2462b0" opacity=".65"/>` : `<rect x="${px}" y="${py}" width="12" height="12" fill="#76cfff"/><rect x="${px + 2}" y="${py + 2}" width="8" height="8" fill="#f2fbff"/>`;
    };
    return [...halo].map(p => rect(p, true)).join('') + [...pixels].map(p => rect(p, false)).join('');
  }
  const expressions = ['cross','happy','wink','blink'].map(name => `<g class="sg-eye sg-eye-${name}">${eyeSprite(name, false)}${eyeSprite(name, true)}</g>`).join('');
  stage.innerHTML = `<div class="sg-hijack" data-expression="cross"><div class="sg-hack-visual"><svg class="sg-mask" viewBox="0 120 1254 930" role="img" aria-label="像素面罩，LED 双眼切换交叉、笑眼和眨眼表情"><image class="sg-pixel-body" href="${asset}" width="1254" height="1254"/>${expressions}</svg></div><div class="sg-hack-message"><h2>Hello Tangzy!</h2></div></div>`;
  const scene = stage.firstElementChild;
  let frame = 0, timer = 0, started = 0, active = false, finish = null, lastPhase = '';
  function phase(name) { if (lastPhase !== name) { lastPhase = name; stage.dataset.hijackPhase = name; } }
  function draw(elapsed, quiet = false) {
    scene.dataset.expression = quiet ? 'wink' : elapsed < 720 ? 'cross' : elapsed < 800 ? 'blink' : elapsed < 1480 ? 'happy' : elapsed < 2020 ? 'wink' : elapsed < 2840 ? 'happy' : 'blink';
    scene.style.setProperty('--hack-reveal', quiet ? 1 : Math.max(0, Math.min(1, (elapsed - 250) / 180)));
    scene.style.setProperty('--led-power', quiet ? 1 : Math.min(1, elapsed / 160));
  }
  function stop() { active = false; cancelAnimationFrame(frame); clearTimeout(timer); finish = null; stage.removeAttribute('data-hijack-phase'); scene.classList.remove('sg-hack-leaving'); }
  function tick(now) {
    if (!active) return;
    const elapsed = now - started;
    phase(elapsed < 720 ? 'cross' : elapsed < 1480 ? 'smile' : elapsed < 2020 ? 'wink' : elapsed < 2900 ? 'hold' : 'restore');
    draw(elapsed);
    if (elapsed >= 2900) scene.classList.add('sg-hack-leaving');
    if (elapsed >= 3120) { const done = finish; stop(); done?.(); return; }
    frame = requestAnimationFrame(tick);
  }
  function play({ quiet = false, onFinish }) {
    stop(); active = true; finish = onFinish; lastPhase = '';
    if (quiet) { phase('still'); draw(1800, true); timer = setTimeout(() => { const done = finish; stop(); done?.(); }, 2600); }
    else { started = performance.now(); draw(0); phase('cross'); frame = requestAnimationFrame(tick); }
  }
  return { play, stop };
}