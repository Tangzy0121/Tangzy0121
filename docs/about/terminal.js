/* Permanent center terminal with GUI command shortcuts and the original shell. */
(() => {
  'use strict';
  const about = document.getElementById('about-view');
  const frame = document.getElementById('terminal-original');
  const panel = document.getElementById('portfolio-terminal');
  const label = document.getElementById('about-terminal-command');
  const homeButton = document.getElementById('about-terminal-home');
  const backButton = document.getElementById('about-terminal-back');
  const pathLabel = document.getElementById('about-terminal-path');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const documentShade = document.createElement('button');
  documentShade.id = 'about-document-shade'; documentShade.type = 'button';
  documentShade.tabIndex = -1; documentShade.setAttribute('aria-label', '关闭文档阅读层');
  documentShade.hidden = true; about.querySelector('.experience').appendChild(documentShade);
  documentShade.addEventListener('click', () => post({ type: 'tangzy:shell:document-close' }));
  function documentMode(open) {
    about.dataset.documentOpen = String(open); documentShade.hidden = !open;
    if (open) post({ type: 'tangzy:shell:document-focus' });
    for (const el of [about.querySelector('.chapter-navigation'), about.querySelector('.about-side'), document.querySelector('.site-nav')]) if (el) el.inert = open;
  }
  addEventListener('keydown', event => {
    if (about.dataset.documentOpen === 'true' && event.key === 'Escape') {
      event.preventDefault(); event.stopImmediatePropagation(); post({ type: 'tangzy:shell:document-close' });
    }
  }, true);
  const commands = { home: 'home', study: 'study', explore: 'explore', mindset: 'mindset' };
  const chapters = { home: 'home', study: 'study', education: 'study', explore: 'explore', research: 'explore', mindset: 'mindset' };
  let active = false, ready = false, sequence = 0, pending = null, lastChapter = null, focusAfterReady = false;
  function post(message) {
    frame.contentWindow?.postMessage(message, location.origin);
  }
  function load() {
    panel.hidden = false;
    panel.inert = false;
    if (!frame.getAttribute('src')) frame.src = frame.dataset.src;
  }
  function focus() {
    if (!active || !ready) { focusAfterReady = true; return; }
    frame.focus({ preventScroll: true });
    post({ type: 'tangzy:shell:focus' });
  }
  function flush() {
    if (!active || !ready || !pending) return;
    post({ type: 'tangzy:shell:command', ...pending });
    pending = null;
  }
  function executeCommand(command, { animate = true } = {}) {
    if (!command) return;
    label.textContent = command;
    about.dataset.command = command;
    pending = { command, id: ++sequence, issuedAt: Date.now(), animate: animate && !reduced.matches && about.dataset.motion !== 'off' };
    load();
    flush();
  }
  function executeChapter(key, options) {
    if (!commands[key]) return;
    lastChapter = key;
    executeCommand(commands[key], options);
  }
  about.addEventListener('about:chapter-command', event => {
    if (active) executeChapter(event.detail.key);
  });
  homeButton.addEventListener('click', () => {
    if (active) executeCommand('home');
  });
  backButton.addEventListener('click', () => { if (active && !backButton.disabled) executeCommand('back', { animate: false }); });
  addEventListener('message', event => {
    if (event.source !== frame.contentWindow || event.origin !== location.origin || event.data?.type !== 'tangzy:shell') return;
    const data = event.data;
    if (data.action === 'ready') {
      ready = true;
      flush();
      if (focusAfterReady) { focusAfterReady = false; focus(); }
      return;
    }
    if (!active || about.hidden) return;
    if (data.action === 'document') {
      documentMode(data.open === true);
    } else if (data.action === 'choose-command' && typeof data.command === 'string' && data.command.length <= 160) {
      executeCommand(data.command);
    } else if (data.action === 'navigation') {
      backButton.disabled = !data.canBack;
      pathLabel.textContent = typeof data.path === 'string' ? data.path : '~';
      pathLabel.title = pathLabel.textContent;
      document.getElementById('about-terminal-cwd').textContent = '工作目录 ' + (data.cwd || '~');
      if (data.route === 'home') homeButton.setAttribute('aria-current', 'page');
      else homeButton.removeAttribute('aria-current');
      const key = chapters[data.route];
      if (key) {
        lastChapter = key;
        if (window.TangzyAbout.chapter !== key) window.TangzyAbout.selectChapter(key, { execute: false, push: false });
      } else window.TangzyAbout.clearSelection();
    } else if (data.action === 'navigate-back') {
      if (!backButton.disabled) executeCommand('back', { animate: false });
      else close();
    } else if (data.action === 'compose') dispatchEvent(new CustomEvent('tangzy:terminal-compose'));
    else if (data.action === 'back') close();
    else if (data.action === 'typing') {
      if (data.id === sequence) { label.textContent = data.command; about.dataset.typing = 'true'; }
    } else if (data.action === 'manual-input') {
      ++sequence; pending = null; about.dataset.typing = 'false';
      post({ type: 'tangzy:shell:cancel', preserveDraft: true });
    } else if (data.action === 'typing-cancelled') {
      about.dataset.typing = 'false';
    } else if (data.action === 'executed') {
      if (data.id !== undefined && data.id !== sequence) return;
      if (data.id === undefined) {
        ++sequence; pending = null;
        post({ type: 'tangzy:shell:cancel', preserveDraft: true });
      }
      about.dataset.typing = 'false';
      label.textContent = data.command || 'READY';
      about.dataset.command = data.command;
      if (data.command === 'home') homeButton.setAttribute('aria-current', 'page');
      else homeButton.removeAttribute('aria-current');
      const key = chapters[data.command];
      if (key) {
        lastChapter = key;
        if (window.TangzyAbout.chapter !== key) window.TangzyAbout.selectChapter(key, { execute: false, push: false });
      }
    }
  });
  function open({ focus: shouldFocus = true } = {}) {
    focusAfterReady = shouldFocus;
    if (about.hidden) { dispatchEvent(new CustomEvent('tangzy:terminal-open')); return; }
    load();
    if (shouldFocus) focus();
  }
  function close() {
    post({ type: 'tangzy:shell:cancel' });
    (about.querySelector('.chapter-tab[aria-pressed="true"]') || homeButton).focus({ preventScroll: true });
  }
  about.dataset.terminalState = 'docked';
  window.TangzyTerminal = {
    open, close, executeChapter,
    activate({ chapter = 'home', explicit = false } = {}) {
      active = true;
      load();
      if (!ready || explicit && lastChapter !== chapter) executeChapter(chapter, { animate: false });
      else flush();
      if (ready && focusAfterReady) { focusAfterReady = false; focus(); }
    },
    deactivate() {
      post({ type: 'tangzy:shell:document-close' }); documentMode(false);
      active = false; pending = null;
      about.dataset.typing = 'false';
      post({ type: 'tangzy:shell:cancel' });
    },
    get isOpen() { return false; }
  };
})();
