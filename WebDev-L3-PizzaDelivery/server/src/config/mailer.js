const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 2525,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendMail = ({ to, subject, html }) =>
  transporter.sendMail({ from: process.env.MAIL_FROM, to, subject, html });

module.exports = { transporter, sendMail };
