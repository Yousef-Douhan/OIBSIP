const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');

const emailRule = body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail();
const passwordRule = body('password')
  .isLength({ min: 6 })
  .withMessage('Password must be at least 6 characters');

router.post(
  '/register',
  authLimiter,
  [body('name').trim().notEmpty().withMessage('Name is required'), emailRule, passwordRule],
  validate,
  ctrl.register
);

router.get('/verify/:token', ctrl.verifyEmail);
router.post('/resend-verification', authLimiter, [emailRule], validate, ctrl.resendVerification);

router.post(
  '/login',
  authLimiter,
  [emailRule, body('password').notEmpty().withMessage('Password is required')],
  validate,
  ctrl.login
);

router.post('/forgot-password', authLimiter, [emailRule], validate, ctrl.forgotPassword);
router.post('/reset-password/:token', [passwordRule], validate, ctrl.resetPassword);

router.get('/me', protect, ctrl.me);

module.exports = router;
