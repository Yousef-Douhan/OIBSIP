const { sendMail } = require('../config/mailer');

const layout = (title, body) => `
  <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;border:1px solid #eee;border-radius:12px">
    <h2 style="color:#e63946;margin-top:0">🍕 Pizza App</h2>
    <h3>${title}</h3>
    ${body}
    <p style="color:#888;font-size:12px;margin-top:32px">If you did not request this, you can ignore this email.</p>
  </div>`;

const button = (href, label) =>
  `<p><a href="${href}" style="background:#e63946;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block">${label}</a></p>
   <p style="font-size:12px;color:#666">Or open this link: ${href}</p>`;

const sendVerificationEmail = (user, rawToken) => {
  const link = `${process.env.CLIENT_URL}/verify-email/${rawToken}`;
  return sendMail({
    to: user.email,
    subject: 'Verify your email - Pizza App',
    html: layout(
      `Welcome, ${user.name}!`,
      `<p>Please confirm your email address to activate your account. The link is valid for 24 hours.</p>${button(link, 'Verify Email')}`
    ),
  });
};

const sendPasswordResetEmail = (user, rawToken) => {
  const link = `${process.env.CLIENT_URL}/reset-password/${rawToken}`;
  return sendMail({
    to: user.email,
    subject: 'Reset your password - Pizza App',
    html: layout(
      'Password reset',
      `<p>Click the button below to choose a new password. The link is valid for 15 minutes and can be used once.</p>${button(link, 'Reset Password')}`
    ),
  });
};

const sendLowStockEmail = (items) => {
  const rows = items
    .map(
      (i) =>
        `<tr><td style="padding:6px 12px">${i.name}</td><td style="padding:6px 12px">${i.category}</td><td style="padding:6px 12px;color:#e63946"><b>${i.quantity}</b></td><td style="padding:6px 12px">${i.threshold}</td></tr>`
    )
    .join('');
  return sendMail({
    to: process.env.ADMIN_EMAIL,
    subject: `⚠️ Low stock alert: ${items.length} item(s)`,
    html: layout(
      'Low stock alert',
      `<p>The following ingredients are at or below their threshold:</p>
       <table style="border-collapse:collapse;border:1px solid #eee">
         <tr style="background:#f7f7f7"><th style="padding:6px 12px">Item</th><th style="padding:6px 12px">Category</th><th style="padding:6px 12px">Qty</th><th style="padding:6px 12px">Threshold</th></tr>
         ${rows}
       </table>`
    ),
  });
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail, sendLowStockEmail };
