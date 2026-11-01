/* Bridge around the retained React shell; commands use its real input state. */
(() => {
  'use strict';
  try { if (!localStorage.getItem('tang-shell-theme')) localStorage.setItem('tang-shell-theme', 'dark'); } catch {}
  const request = (action, detail = {}) => parent.postMessage({ type: 'tangzy:shell', action, ...detail }, location.origin);
  const allowed = new Set(['education', 'research', 'study', 'explore', 'mindset', 'home', 'back', 'blog', 'bio', 'papers', 'projects', 'cv', 'scholar', 'help', 'tree', 'cat bio | grep -i safety']);
  let run, setInput, closePager, announced = false, timer = 0, token = 0, typing = false, automaticID, lastManualInput = -Infinity;
  function cancelTyping({ clear = false } = {}) {
    ++token; clearTimeout(timer); timer = 0;
    const wasTyping = typing; typing = false;
    if (clear && setInput) setInput('');
    if (wasTyping) request('typing-cancelled');
  }
  function incoming(data) {
    if (!run || !setInput || !allowed.has(data.command)) return;
    if (typeof data.issuedAt === 'number' && data.issuedAt <= lastManualInput) return;
    cancelTyping({ clear: true });
    if (document.querySelector('.pager')) closePager?.();
    const current = token, command = data.command;
    const animate = data.animate === true && !matchMedia('(prefers-reduced-motion: reduce)').matches;
    let index = 0;
    typing = true;
    request('typing', { command, id: data.id });
    function commit() {
      if (current !== token) return;
      typing = false;
      automaticID = data.id;
      setInput('');
      run(command);
      automaticID = undefined;
    }
    function type() {
      if (current !== token) return;
      index++;
      setInput(command.slice(0, index));
      if (index < command.length) timer = setTimeout(type, 28);
      else timer = setTimeout(commit, 100);
    }
    if (animate) timer = setTimeout(type, 28);
    else commit();
  }
  window.TangzyShellBridge = {
    request,
    choose(command) { if (allowed.has(command)) request('choose-command', { command }); },
    connect(command, input) {
      run = command; setInput = input.setInput; closePager = input.closePager;
      if (!announced) { announced = true; request('ready'); }
    },
    executed(command) {
      if (typing) cancelTyping();
      request('executed', { command, ...(automaticID === undefined ? {} : { id: automaticID }) });
    }
  };
  addEventListener('message', event => {
    if (event.source !== parent || event.origin !== location.origin) return;
    if (event.data?.type === 'tangzy:shell:document-focus') {
      requestAnimationFrame(() => document.querySelector('#cvv .win')?.focus({ preventScroll: true }));
    } else if (event.data?.type === 'tangzy:shell:document-close') {
      document.querySelector('#cvv [data-a="close"]')?.click();
    } else if (event.data?.type === 'tangzy:shell:focus') {
      requestAnimationFrame(() => document.querySelector('input[aria-label="Terminal input"]')?.focus({ preventScroll: true }));
    } else if (event.data?.type === 'tangzy:shell:command') incoming(event.data);
    else if (event.data?.type === 'tangzy:shell:cancel') cancelTyping({ clear: event.data.preserveDraft !== true });
  });
  addEventListener('keydown', event => {
    if (event.target.matches?.('input[aria-label="Terminal input"]')) {
      lastManualInput = Date.now();
      if (typing) cancelTyping();
    }
    if (event.key === 'Escape' && !document.querySelector('.pager,#cvv,#pdfv,.cmp-menu,.isearch')) {
      event.preventDefault(); event.stopImmediatePropagation(); request('navigate-back');
    }
  }, true);
  document.addEventListener('beforeinput', event => {
    if (event.target.matches?.('input[aria-label="Terminal input"]') && typing) cancelTyping();
  }, true);
  document.addEventListener('input', event => {
    if (event.target.matches?.('input[aria-label="Terminal input"]')) {
      lastManualInput = Date.now(); cancelTyping(); request('manual-input');
    }
  }, true);
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link) return;
    const url = new URL(link.href);
    if (url.protocol === 'mailto:') { event.preventDefault(); event.stopImmediatePropagation(); request('compose'); }
  }, true);
})();
