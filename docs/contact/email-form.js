/* Real browser delivery and a separately labelled localhost motion preview. */
(() => {
  'use strict';
  const root = document.getElementById('contact-view'), composer = document.getElementById('ct-email-composer');
  const editor = composer.querySelector('.ct-mail-editor'), delivery = composer.querySelector('.ct-mail-delivery');
  const title = document.getElementById('ct-mail-delivery-title'), note = document.getElementById('ct-mail-delivery-note');
  const action = document.getElementById('ct-mail-delivery-action'), fallback = document.getElementById('ct-mail-fallback');
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  const preview = local && new URLSearchParams(location.search).get('mailPreview');
  const deliveryConfig = window.TangzyContactConfig.delivery || {};
  const configured = () => window.TangzyContactMail.isConfigured(deliveryConfig);
  const form = document.getElementById('ct-email-form'), status = document.getElementById('ct-email-form-status');
  const button = document.getElementById('ct-email-submit'), counter = document.getElementById('ct-message-count');
  const fields = ['name', 'email', 'message'].map(key => form.elements.namedItem(key));
  let pending = false, acceptedDraft = '', introTimer = 0;
  const quiet = () => root.dataset.quiet === 'true';
  const visible = () => !root.hidden && root.dataset.screenMode === 'compose';
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const values = () => Object.fromEntries(fields.map((field, i) => [['name', 'email', 'message'][i], field.value.trim()]));
  const canSend = () => !!preview || configured();
  const sendLabel = () => preview ? '预览投递' : canSend() ? '发送留言' : '收件通道待启用';
  function announce(text, state) { status.textContent = text; status.dataset.state = state; }
  function focusDraft() { if (visible()) (fields.find(field => !field.value.trim()) || fields[2]).focus({ preventScroll: true }); }
  function state(next, heading = '', detail = '') {
    clearTimeout(introTimer); composer.dataset.mailState = next;
    const editing = next === 'editing';
    editor.hidden = !editing; editor.inert = !editing;
    delivery.hidden = editing; delivery.inert = editing;
    title.textContent = heading; note.textContent = detail;
    action.hidden = ['editing', 'opening', 'pending'].includes(next);
    fallback.hidden = !!preview || !['error', 'activation'].includes(next);
    action.textContent = next === 'success' ? '再写一封 ↗' : next === 'activation' ? '返回信纸 ↶' : '返回草稿 ↶';
    if (visible()) composer.scrollTop = 0;
  }
  function edit() { state('editing'); focusDraft(); }
  root.addEventListener('contact:screen', event => {
    if (event.detail.mode !== 'compose') { if (composer.dataset.mailState === 'opening') state('editing'); return; }
    if (pending || ['success', 'error', 'activation'].includes(composer.dataset.mailState)) {
      if (!pending && event.detail.focus) action.focus({ preventScroll: true }); return;
    }
    if (quiet()) { edit(); return; }
    state('opening', 'Dear Tangzy,', ''); introTimer = setTimeout(edit, 640);
  });
  action.addEventListener('click', () => {
    if (composer.dataset.mailState === 'success') {
      form.reset(); acceptedDraft = ''; counter.textContent = '0 / 3000'; button.disabled = !canSend();
      button.querySelector('span').textContent = sendLabel(); announce('', '');
    }
    edit();
  });
  form.addEventListener('input', event => {
    if (event.target.matches('input,textarea')) event.target.setCustomValidity('');
    counter.textContent = fields[2].value.length + ' / 3000';
    if (!pending) { button.disabled = !canSend(); button.querySelector('span').textContent = sendLabel(); if (canSend()) status.textContent = ''; }
  });
  if (preview) {
    document.getElementById('ct-mail-preview-note').hidden = false; button.querySelector('span').textContent = '预览投递';
    fields[0].value = '演示访客'; fields[1].value = 'preview@example.test'; fields[2].value = '你好 Tangzy，来聊聊下一个有趣的想法。';
    counter.textContent = fields[2].value.length + ' / 3000';
    document.getElementById('ct-email-service-note').textContent = '当前仅预览投递动画，填写的内容不会交给发送服务。';
  } else if (!configured()) {
    button.disabled = true; button.querySelector('span').textContent = sendLabel();
    announce('邮箱入口尚未启用，暂时可点击上方邮箱地址写信。', 'pending');
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (pending) return;
    if (!canSend()) { announce('收件通道尚未完成绑定，暂时可点击上方邮箱地址写信。', 'pending'); return; }
    if (form.elements.namedItem('botcheck')?.checked) { announce('提交未通过校验，请刷新页面后重试。', 'error'); return; }
    fields.forEach(field => field.setCustomValidity(field.value.trim() ? '' : '请填写这一项。'));
    if (!form.reportValidity()) return;
    const draft = values(), fingerprint = JSON.stringify(draft);
    if (fingerprint === acceptedDraft) { announce('这封留言已提交，修改内容后可以再写一封。', 'success'); return; }
    try { window.TangzyContactMail.prepare(draft); } catch (error) { announce(error.message, 'error'); return; }
    fallback.href = 'mailto:' + window.TangzyContactConfig.email.account + '?subject=' + encodeURIComponent('[Tangzy Contact] 来自 ' + draft.name) + '&body=' + encodeURIComponent('称呼：' + draft.name + '\r\n联系邮箱：' + draft.email + '\r\n\r\n' + draft.message);
    pending = true; button.disabled = true; form.setAttribute('aria-busy', 'true');
    fields.forEach(field => { field.readOnly = true; });
    button.querySelector('span').textContent = '正在投递…';
    const pendingText = preview ? '动效预览中，没有发送邮件。' : '正在等待发送服务确认，请稍候。';
    state('pending', '正在投递…', pendingText); announce(pendingText, 'pending');
    const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const animation = wait(quiet() ? 0 : 1450);
      let result;
      if (preview) {
        await animation;
        if (preview === 'error') throw new Error('失败状态预览：草稿已保留，没有发送邮件。');
        result = { accepted: true, activationPending: preview === 'activation' };
      } else {
        [result] = await Promise.all([window.TangzyContactMail.send(draft, { accessKey: deliveryConfig.accessKey, signal: controller.signal }), animation]);
      }
      if (result.activationPending) {
        const detail = '绑定状态预览，没有发送邮件。真正投递需要先完成收件邮箱绑定。';
        state('activation', '还差一次邮箱绑定', detail); announce(detail, 'pending');
      } else {
        acceptedDraft = fingerprint;
        const detail = preview ? '动效预览已结束，没有发送邮件。' : '发送服务已接收这封信。谢谢你的来信，我会通过你留下的邮箱回复。';
        state('success', preview ? 'A little hello. ✓' : '谢谢你的来信。', detail); announce(detail, 'success');
        button.querySelector('span').textContent = '已提交 ✓';
      }
    } catch (error) {
      const detail = error.name === 'AbortError' ? '连接超时，服务是否收到尚未确认。原文已保留，可稍后重试或改用邮箱应用。' : error.name === 'TypeError' ? '暂时连不上发送服务。原文已保留，可返回草稿重试，或改用邮箱应用发送。' : error.message || '连接失败，原文已保留，请稍后重试。';
      state(error.code === 'configuration' ? 'activation' : 'error', error.code === 'configuration' ? '收件通道尚未启用' : '这封信还在这里。', detail); announce(detail, 'error');
      button.querySelector('span').textContent = preview ? '预览投递' : '重新发送';
    } finally {
      clearTimeout(timeout); pending = false; form.removeAttribute('aria-busy');
      fields.forEach(field => { field.readOnly = false; });
      button.disabled = !canSend() || JSON.stringify(values()) === acceptedDraft;
      if (visible()) action.focus({ preventScroll: true });
    }
  });
})();
