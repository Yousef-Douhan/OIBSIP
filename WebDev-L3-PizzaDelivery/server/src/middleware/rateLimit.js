const rateLimit = require('express-rate-limit');

// Protects login / register / forgot-password from brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many attempts, please try again in 15 minutes' },
});

module.exports = { authLimiter };
