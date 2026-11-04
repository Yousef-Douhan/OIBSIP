const router = require('express').Router();
const { body } = require('express-validator');
const authCtrl = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimit');
// const { protect, isAdmin } = require('../middleware/auth'); // used by inventory & orders routes (next step)

router.post(
  '/login',
  authLimiter,
  [
    body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  authCtrl.adminLogin
);

module.exports = router;
