(() => {
  'use strict';
  const root = document.getElementById('contact-view');
  const $ = selector => root.querySelector(selector);
  const tabs = [...root.querySelectorAll('[role="tab"]')];
  const config = window.TangzyContactConfig;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const channels = {
    email: { label: 'Email', title: 'A letter, maybe?', note: '适合一个想法，也适合一封长信。', pending: '邮箱地址待补充', action: '打开邮箱', color: '#ffa6d3', rgb: '255,166,211', icon: '<path d="M15 26h110v68H15zM15 27l55 41 55-41M15 94l39-38m71 38L86 56"/><path d="M65 10h10m-5-5v10M129 8h6m-3-3v6M3 58h6m-3-3v6" stroke-width="1.5"/>' },
    github: { label: 'more', title: 'A few other places.', note: '看看公开代码，或读读我的文字。', pending: 'GitHub 主页待补充', action: '前往 GitHub', color: '#c9b7ff', rgb: '201,183,255', icon: '<g transform="translate(24.5 16.5) scale(7)" stroke-width=".34" stroke-linejoin="miter"><path d="M1 0h4v1h1v1h1V1h1V0h4v1h1v4h-1v1h-1v1h-1v1H9v1H8v1H7v1H6v-1H5V9H4V8H3V7H2V6H1V5H0V1h1z" fill="currentColor" fill-opacity=".09"/><path d="M2 2h2" stroke="#f7e8fa" stroke-width=".42" opacity=".7"/></g>' },
    qq: { label: 'Connect', title: 'Scan to connect.', note: '可用的联系二维码，都放在这里。', pending: '联系二维码尚未开放', action: '查看联系二维码', color: '#a7d9ff', rgb: '167,217,255', icon: '<path d="M25 21h90v56H67L43 94V77H25z"/><path d="M45 47h4m19 0h4m19 0h4" stroke-width="5" stroke-linecap="round"/><path d="m110 89 8 8m-8 0 8-8M12 23h8m-4-4v8" stroke-width="1.5"/>' }
  };
  const keys = tabs.map(tab => tab.dataset.channel);
  let current = 'email', active = false, manualMotion = true, qrVisible = false, dialAngle = 0;
  let changeTimer = 0, copyTimer = 0, copyRequest = 0;
  const quiet = () => reduced.matches || !manualMotion;
  const announce = text => { $('#ct-announcement').textContent = text; };
  const socialAccounts = () => [['QQ', config.qq.account], ['WeChat', config.wechat.account]].filter(([, account]) => account).map(([label, account]) => label + ': ' + account).join('\n');
  function publicURL(key) {
    const item = config[key];
    if (key === 'email' && item.account) return 'mailto:' + item.account;
    try { const url = new URL(item.url); return url.protocol === 'https:' ? url.href : ''; } catch { return ''; }
  }
  function showScreen(mode, { focus = false } = {}) {
    if (!['channel', 'compose', 'qr'].includes(mode)) return;
    root.dataset.screenMode = mode;
    $('#ct-channel-view').hidden = !['channel', 'qr'].includes(mode);
    $('#ct-email-composer').hidden = mode !== 'compose';
    $('#ct-screen-back').hidden = mode === 'channel';
    $('#ct-screen-state').hidden = mode !== 'channel';
    $('#ct-panel').setAttribute('aria-labelledby', mode === 'channel' ? 'ct-tab-' + current : 'ct-frequency');
    $('#ct-frequency').textContent = mode === 'compose' ? 'CH.01 — EMAIL' : mode === 'qr' ? 'CH.02 — CONNECT' : 'CH.0' + (keys.indexOf(current) + 1) + ' — ' + channels[current].label.toUpperCase();
    renderQR(mode === 'qr');
    root.dispatchEvent(new CustomEvent('contact:screen', { detail: { mode, focus } }));
    if (focus && mode !== 'compose') (mode === 'compose' ? $('#ct-sender-name') : mode === 'qr' ? $('#ct-panel') : $('#ct-tab-' + current)).focus({ preventScroll: true });
  }
  function syncAction() {
    const data = channels[current], item = config[current], isQR = current === 'qq';
    const inScreen = root.dataset.screenMode && root.dataset.screenMode !== 'channel';
    $('#ct-open').disabled = false;
    $('#ct-open').textContent = inScreen ? '返回频道' : isQR ? (qrVisible ? '返回频道' : data.action) : '写一封信';
    $('.ct-channel-actions').hidden = current === 'github';
    $('#ct-more-links').hidden = current !== 'github';
    $('#ct-github-link').href = publicURL('github');
    const arrow = document.createElement('span'); arrow.textContent = qrVisible ? '↶' : '↗'; arrow.setAttribute('aria-hidden', 'true'); $('#ct-open').append(arrow);
    $('#ct-copy').disabled = current === 'qq' ? !socialAccounts() : !item.account;
    $('#ct-copy').hidden = isQR && !socialAccounts();
    $('#ct-copy').setAttribute('aria-label', '复制 ' + data.label + ' 账号');
  }
  function renderQR(show) {
    qrVisible = show;
    closeQRZoom();
    root.dataset.qr = String(show);
    $('.ct-qr-face').hidden = !show;
    $('.ct-screen-art').hidden = show;
    for (const [provider, label] of [['email', 'Email'], ['qq', 'QQ'], ['wechat', 'WeChat']]) {
      const card = $('[data-qr-provider="' + provider + '"]'), image = card.querySelector('img'), source = config[provider].qr;
      card.hidden = !source;
      image.hidden = !source;
      const frame = card.querySelector('.ct-qr-frame');
      frame.tabIndex = source ? 0 : -1;
      if (source) { frame.setAttribute('role', 'button'); frame.setAttribute('aria-label', '放大 ' + label + ' 二维码'); }
      else { frame.removeAttribute('role'); frame.removeAttribute('aria-label'); }
      card.querySelector('.ct-qr-empty').hidden = !!source;
      card.querySelector('.ct-qr-empty span').textContent = '二维码待补充';
      card.querySelector('.ct-qr-account').textContent = config[provider].account || '账号待补充';
      if (source) { image.src = source; image.alt = label + ' 联系二维码'; }
      else { image.removeAttribute('src'); image.alt = ''; }
    }
    $('.ct-qr-trio').dataset.count = String(root.querySelectorAll('[data-qr-provider]:not([hidden])').length);
    syncAction();
  }
  function select(key, { focus = false } = {}) {
    if (!keys.includes(key)) key = 'email';
    $('#ct-screen-state').textContent = 'READY TO CONNECT'; clearTimeout(changeTimer); clearTimeout(copyTimer); copyRequest++;
    const previousIndex = keys.indexOf(current), index = keys.indexOf(key);
    if (current !== key) dialAngle += (index === 0 && previousIndex === keys.length - 1 ? 1 : index - previousIndex) * 360 / keys.length;
    current = key;
    root.style.setProperty('--ct-dial-angle', dialAngle + 'deg');
    showScreen('channel');
    const data = channels[key], item = config[key];
    root.dataset.channel = key;
    root.style.setProperty('--ct-accent', data.color); root.style.setProperty('--ct-rgb', data.rgb);
    tabs.forEach(tab => { const chosen = tab.dataset.channel === key; tab.setAttribute('aria-selected', String(chosen)); tab.tabIndex = chosen ? 0 : -1; if (chosen && focus) tab.focus({ preventScroll: true }); });
    $('#ct-panel').setAttribute('aria-labelledby', 'ct-tab-' + key);
    $('#ct-frequency').textContent = 'CH.0' + (index + 1) + ' — ' + data.label.toUpperCase();
    $('#ct-channel-title').textContent = data.title; $('#ct-channel-note').textContent = data.note;
    $('#ct-symbol').innerHTML = data.icon;
    $('#ct-account').textContent = current === 'qq' ? socialAccounts().replace(/\n/g, ' · ') || config.email.account || data.pending : current === 'github' ? 'github.com/' + item.account : item.account || data.pending;
    $('#ct-count').textContent = '0' + (index + 1) + ' / 0' + keys.length;
    $('#ct-dial').setAttribute('aria-label', '拨动旋钮，切换到' + ({ email: 'Email', qq: 'Connect', github: 'more' })[keys[(index + 1) % keys.length]] + '模式');
    root.dataset.changing = 'true'; changeTimer = setTimeout(() => { root.dataset.changing = 'false'; }, 370);
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => select(tab.dataset.channel));
    tab.addEventListener('keydown', event => {
      let indexTo;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') indexTo = (index + 1) % keys.length;
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') indexTo = (index + keys.length - 1) % keys.length;
      else if (event.key === 'Home') indexTo = 0;
      else if (event.key === 'End') indexTo = keys.length - 1;
      if (indexTo !== undefined) { event.preventDefault(); select(keys[indexTo], { focus: true }); }
    });
  });
  $('#ct-dial').addEventListener('click', () => select(keys[(keys.indexOf(current) + 1) % keys.length]));
  $('#ct-open').addEventListener('click', () => {
    if (root.dataset.screenMode !== 'channel') { showScreen('channel', { focus: true }); return; }
    if (current === 'email') { showScreen('compose', { focus: true }); return; }
    if (current === 'qq') { showScreen('qr', { focus: true }); announce('已展开当前可用的联系二维码。'); return; }
  });
  $('#ct-screen-back').addEventListener('click', () => { if (root.dataset.qrZoom === 'true') { $('#ct-qr-zoom-back').click(); return; } showScreen('channel', { focus: true }); });
  root.addEventListener('keydown', event => {
    if (event.key === 'Escape' && root.dataset.qrZoom === 'true') { event.preventDefault(); event.stopPropagation(); $('#ct-qr-zoom-back').click(); return; }
    if (event.key === 'Escape' && !event.defaultPrevented && root.dataset.screenMode !== 'channel') {
      event.preventDefault(); event.stopPropagation(); showScreen('channel', { focus: true });
    }
  });
  $('#ct-copy').addEventListener('click', async () => {
    const account = current === 'qq' ? socialAccounts() : config[current].account, request = ++copyRequest;
    if (!account) return;
    try { await navigator.clipboard.writeText(account); if (request === copyRequest && active) { announce('已复制 ' + channels[current].label + ' 账号'); $('#ct-screen-state').textContent = 'COPIED ✓'; copyTimer = setTimeout(() => { $('#ct-screen-state').textContent = 'READY TO CONNECT'; }, 2000); } }
    catch { if (request === copyRequest && active) { announce('复制未完成，可选中屏幕底部的账号手动复制。'); $('#ct-screen-state').textContent = '请手动复制下方账号'; } }
  });
  function closeQRZoom() { root.dataset.qrZoom = 'false'; $('.ct-qr-zoom').hidden = true; }
  function zoomQR(provider) {
    const item = config[provider];
    if (!item.qr) return;
    const label = { email: 'Email', qq: 'QQ', wechat: 'WeChat' }[provider];
    $('#ct-qr-zoom-image').src = item.qr;
    $('#ct-qr-zoom-image').alt = label + ' 联系二维码';
    $('#ct-qr-zoom-label').textContent = label + (item.account ? ' · ' + item.account : '');
    $('#ct-qr-zoom-copy').dataset.provider = provider;
    $('#ct-qr-zoom-copy').disabled = !item.account;
    $('#ct-qr-zoom-copy').textContent = '复制账号';
    root.dataset.qrZoom = 'true'; $('.ct-qr-zoom').hidden = false;
    $('#ct-qr-zoom-back').focus({ preventScroll: true });
  }
  $('#ct-qr-zoom-back').addEventListener('click', () => { const provider = $('#ct-qr-zoom-copy').dataset.provider; closeQRZoom(); $('[data-qr-provider="' + provider + '"] .ct-qr-frame').focus({ preventScroll: true }); });
  $('#ct-qr-zoom-copy').addEventListener('click', async () => {
    const button = $('#ct-qr-zoom-copy'), account = config[button.dataset.provider]?.account;
    if (!account) return;
    try { await navigator.clipboard.writeText(account); button.textContent = '已复制 ✓'; } catch { button.textContent = '可选中上方账号复制'; }
  });
  for (const card of root.querySelectorAll('[data-qr-provider]')) {
    const frame = card.querySelector('.ct-qr-frame');
    frame.addEventListener('click', () => zoomQR(card.dataset.qrProvider));
    frame.addEventListener('keydown', event => { if (['Enter', ' '].includes(event.key)) { event.preventDefault(); zoomQR(card.dataset.qrProvider); } });
    card.querySelector('img').addEventListener('error', () => {
      card.querySelector('img').hidden = true; card.querySelector('.ct-qr-frame').removeAttribute('role'); card.querySelector('.ct-qr-frame').tabIndex = -1; card.querySelector('.ct-qr-empty').hidden = false;
      card.querySelector('.ct-qr-empty span').textContent = '二维码无法显示';
    });
  }
  function syncMotion() {
    root.dataset.quiet = String(quiet()); $('#ct-motion').setAttribute('aria-pressed', String(!quiet()));
    $('#ct-motion').setAttribute('aria-label', quiet() ? '开启 Contact 动画' : '暂停 Contact 动画'); $('#ct-motion>span').textContent = quiet() ? 'OFF' : 'ON';
    $('#ct-motion').disabled = reduced.matches;
    if (reduced.matches) $('#ct-motion').setAttribute('aria-label', '系统已开启减少动态，Contact 动画已暂停');
    if (quiet()) { root.style.setProperty('--ct-rx', '0deg'); root.style.setProperty('--ct-ry', '0deg'); }
  }
  $('#ct-motion').addEventListener('click', () => { manualMotion = !manualMotion; syncMotion(); });
  reduced.addEventListener('change', syncMotion);
  const resetPose = () => { root.style.setProperty('--ct-rx', '0deg'); root.style.setProperty('--ct-ry', '0deg'); };

  document.addEventListener('visibilitychange', () => { root.dataset.active = String(active && !document.hidden); });
  select('email'); syncMotion();
  window.TangzyContact = {
    select,
    compose() { select('email'); showScreen('compose', { focus: true }); },
    screen: showScreen,
    show({ focus = false } = {}) { active = true; root.dataset.active = String(!document.hidden); if (focus) root.focus({ preventScroll: true }); },
    hide() { active = false; root.dataset.active = 'false'; clearTimeout(changeTimer); clearTimeout(copyTimer); copyRequest++; resetPose(); },
    get channel() { return current; }
  };
})();
