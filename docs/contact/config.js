/* Only add addresses and QR images approved for public display. Paths are relative to index.html. */
window.TangzyContactConfig = {
  // Public form access key from the verified recipient's Web3Forms dashboard.
  // Never put an email password, SMTP authorization code or private API secret here.
  delivery: { provider: 'web3forms', accessKey: '20c0df9c-1e12-4b31-a5dc-4f07427dbdbe' },
  email: { account: 'tangzy_0121@163.com', url: '', qr: 'contact/assets/email-qr.svg' },
  github: { account: 'tangzy0121', url: 'https://github.com/tangzy0121', qr: '' },
  qq: { account: '', url: '', qr: '' },
  wechat: { account: '', url: '', qr: '' }
};
