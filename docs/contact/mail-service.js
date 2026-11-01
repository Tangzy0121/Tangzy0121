/* Browser-only Web3Forms delivery. A form key is bound to its verified recipient. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TangzyContactMail = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const keyPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const endpoint = () => 'https://api.web3forms.com/submit';
  const isConfigured = config => !!config && config.provider === 'web3forms' && keyPattern.test(String(config.accessKey || '').trim());
  function failure(code, message) { const error = new Error(message); error.code = code; return error; }
  function prepare(fields) {
    const name = String(fields.name || '').trim(), email = String(fields.email || '').trim(), message = String(fields.message || '').trim();
    if (!name || name.length > 80 || /[\r\n]/.test(name)) throw new Error('请填写有效的称呼（最多 80 字）。');
    if (!emailPattern.test(email) || email.length > 254) throw new Error('请填写有效的邮箱地址。');
    if (!message || message.length > 3000) throw new Error('请填写留言（最多 3000 字）。');
    return { name, email, message, replyto: email, subject: '[Tangzy Contact] 来自 ' + name + ' 的留言' };
  }
  async function send(fields, options = {}) {
    if (!keyPattern.test(String(options.accessKey || '').trim())) throw failure('configuration', '收件通道尚未完成绑定，暂时可改用邮箱应用发送。');
    const payload = { ...prepare(fields), access_key: options.accessKey.trim(), from_name: 'Tangzy Portfolio', botcheck: false };
    const response = await (options.fetchImpl || fetch)(endpoint(), {
      method: 'POST', mode: 'cors', credentials: 'omit', signal: options.signal,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload)
    });
    let result;
    try { result = await response.json(); } catch {
      if (response.status >= 500) throw failure('unavailable', '发送服务暂时不可用，原文已保留，请稍后重试。');
      throw failure('bad_response', '发送服务返回异常，原文已保留，请稍后重试。');
    }
    if (!result || typeof result !== 'object' || Array.isArray(result)) throw failure('bad_response', '发送服务返回异常，原文已保留，请稍后重试。');
    if (response.status === 429) throw failure('rate_limit', '提交过于频繁，请稍后再试。原文已保留。');
    if (response.status >= 500) throw failure('unavailable', '发送服务暂时不可用，原文已保留，请稍后重试。');
    if (response.status === 401 || /access[_ ]?key|api[_ ]?key|form (?:id|not found|not active)/i.test(String(result.message || result.body?.message || ''))) {
      if (!response.ok || result.success !== true) throw failure('configuration', '收件通道尚未完成绑定，暂时可改用邮箱应用发送。');
    }
    if (!response.ok || result.success !== true) throw failure('rejected', '发送服务没有确认接收，原文已保留，可稍后重试或改用邮箱应用。');
    return { accepted: true, provider: 'web3forms' };
  }
  return { prepare, endpoint, isConfigured, send };
});
